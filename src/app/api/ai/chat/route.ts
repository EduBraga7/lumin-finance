import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, verifyAuth } from '@/lib/serverAuth';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// GET /api/ai/chat -> Carrega as últimas mensagens persistidas do usuário
export async function GET(req: NextRequest) {
  const user = verifyAuth(req);
  if (!user) {
    return NextResponse.json({ error: 'Token inválido ou não fornecido' }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseServer
      .from('ai_chat_messages')
      .select('id, role, content, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(60);

    if (error) {
      // Se a tabela ai_chat_messages ainda não tiver sido criada no Supabase, retorna vazio sem falhar
      return NextResponse.json({ messages: [] });
    }

    return NextResponse.json({ messages: data || [] });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}

// DELETE /api/ai/chat -> Limpa o histórico de chat do usuário
export async function DELETE(req: NextRequest) {
  const user = verifyAuth(req);
  if (!user) {
    return NextResponse.json({ error: 'Token inválido ou não fornecido' }, { status: 401 });
  }

  try {
    await supabaseServer
      .from('ai_chat_messages')
      .delete()
      .eq('user_id', user.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}

// POST /api/ai/chat -> Envia pergunta ao Copiloto CFO e persiste a conversa
export async function POST(req: NextRequest) {
  const user = verifyAuth(req);
  if (!user) {
    return NextResponse.json({ error: 'Token inválido ou não fornecido' }, { status: 401 });
  }

  try {
    const { message, history = [] }: { message: string; history: ChatMessage[] } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 });
    }

    // 1. Obter resumo financeiro atual do usuário para enriquecer o contexto
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01T00:00:00.000Z`;
    const lastDay = new Date(currentYear, currentMonth, 0).getDate();
    const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`;

    const { data: transactions } = await supabaseServer
      .from('transactions')
      .select('title, amount, type, category, date')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate);

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals: Record<string, number> = {};

    (transactions || []).forEach((t) => {
      const val = parseFloat(String(t.amount)) || 0;
      if (t.type === 'income') {
        totalIncome += val;
      } else {
        totalExpense += val;
      }
      if (t.category) {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + (t.type === 'expense' ? val : 0);
      }
    });

    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.max(0, (balance / totalIncome) * 100) : 0;

    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, val]) => `${cat}: R$ ${val.toFixed(2)}`)
      .join(', ');

    // 2. Chaves de API
    const rawOpenRouterKey = process.env.OPENROUTER_API_KEY || '';
    const rawGeminiKey = process.env.GEMINI_API_KEY || '';
    const openRouterKey = rawOpenRouterKey.trim().replace(/^["']|["']$/g, '');
    const geminiKey = rawGeminiKey.trim().replace(/^["']|["']$/g, '');

    const systemPrompt = `
Você é o Copiloto e CFO Virtual do Lumin Finance, uma assessoria financeira executiva e pessoal de alto nível.
Você fala com o cliente @${user.username}.

DADOS FINANCEIROS REAIS DO CLIENTE (Mês Atual - ${currentMonth}/${currentYear}):
- Receitas Totais: R$ ${totalIncome.toFixed(2)}
- Despesas Totais: R$ ${totalExpense.toFixed(2)}
- Saldo Líquido do Mês: R$ ${balance.toFixed(2)}
- Taxa de Poupança: ${savingsRate.toFixed(1)}%
- Maiores Grupos de Gastos: ${topCategories || 'Nenhuma despesa registrada ainda este mês'}
- Quantidade de Lançamentos no Mês: ${transactions?.length || 0}

DIRETRIZES DA RESPOSTA:
1. Responda de forma estratégica, consultiva, amigável e direta ao ponto (use Bullet Points quando ajudar).
2. Se o cliente perguntar se pode comprar algo, faça a conta do impacto no saldo líquido e na taxa de poupança.
3. Se o cliente perguntar onde economizar, aponte as categorias de maior peso sem sugerir cortar investimentos em educação ou saúde básica.
4. Mantenha as respostas concisas (2 a 4 parágrafos no máximo).
`;

    let reply = '';

    // 3. Tentar chamada via OpenRouter ou Gemini
    if (openRouterKey.startsWith('sk-or-')) {
      try {
        const messages = [
          { role: 'system', content: systemPrompt },
          ...history.slice(-6).map((h) => ({ role: h.role, content: h.content })),
          { role: 'user', content: message }
        ];

        const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'X-Title': 'Lumin Finance Copilot'
          },
          body: JSON.stringify({
            model: 'google/gemini-2.0-flash-lite-001',
            messages,
          }),
        });

        const aiData = await aiRes.json();
        reply = aiData?.choices?.[0]?.message?.content || '';
      } catch (err) {
        console.warn('Erro ao chamar OpenRouter para chat:', err);
      }
    } else if (geminiKey) {
      try {
        const fullPrompt = `${systemPrompt}\n\nHistórico recente:\n${history
          .slice(-4)
          .map((h) => `${h.role === 'user' ? 'Cliente' : 'CFO'}: ${h.content}`)
          .join('\n')}\n\nCliente: ${message}\nCFO:`;

        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }],
            }),
          }
        );

        const aiData = await aiRes.json();
        reply = aiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } catch (err) {
        console.warn('Erro ao chamar Gemini para chat:', err);
      }
    }

    // 4. Fallback Analítico Inteligente (caso nenhuma chave de IA esteja configurada ou tenha falhado)
    if (!reply) {
      const lower = message.toLowerCase();
      let fallbackReply = `Analisando seu mês atual (@${user.username}):\n\n- Receitas: R$ ${totalIncome.toFixed(2)}\n- Despesas: R$ ${totalExpense.toFixed(2)}\n- Saldo Líquido: R$ ${balance.toFixed(2)} (${savingsRate.toFixed(1)}% de economia)\n\n`;

      if (lower.includes('comprar') || lower.includes('posso') || lower.includes('gastar')) {
        if (balance > 1000) {
          fallbackReply += `Você possui uma folga de caixa de R$ ${balance.toFixed(2)} este mês. Caso decida fazer essa aquisição, recomendo manter ao menos 30% dessa sobra como margem de segurança para despesas imprevistas.`;
        } else {
          fallbackReply += `Seu saldo líquido atual está em R$ ${balance.toFixed(2)}. O momento pede cautela antes de assumir novos compromissos parcelados ou compras de grande porte sem antes recompor a margem de segurança.`;
        }
      } else if (lower.includes('economizar') || lower.includes('cortar') || lower.includes('onde')) {
        fallbackReply += `Seus maiores grupos de despesa são: ${topCategories || 'ainda sem registros'}.\n\nA melhor estratégia tática é avaliar os gastos discricionários (como Delivery e Lazer) para estipular um teto semanal, preservando despesas estruturais e investimentos essenciais.`;
      } else {
        fallbackReply += `Como posso te ajudar a planejar seu próximo passo financeiro? Você pode me perguntar sobre viabilidade de compras, estratégias para poupar mais ou projeção de reserva de emergência!`;
      }

      reply = fallbackReply;
    }

    // 5. Salvar histórico no Supabase (se a tabela ai_chat_messages existir)
    try {
      await supabaseServer.from('ai_chat_messages').insert([
        { user_id: user.id, role: 'user', content: message },
        { user_id: user.id, role: 'assistant', content: reply },
      ]);
    } catch (saveErr) {
      console.warn('Tabela ai_chat_messages não disponível ou erro ao persistir:', saveErr);
    }

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao processar consulta';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
