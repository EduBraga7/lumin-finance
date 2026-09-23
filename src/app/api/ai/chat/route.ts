import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, verifyAuth } from '@/lib/serverAuth';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// GET /api/ai/chat -> Carrega histórico do usuário
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
      return NextResponse.json({ messages: [] });
    }

    return NextResponse.json({ messages: data || [] });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}

// DELETE /api/ai/chat -> Limpa o histórico do usuário
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

// POST /api/ai/chat -> Processa pergunta no Copiloto CFO
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

    // 2. Chaves de API (suporta GEMINI_API_KEY, GOOGLE_API_KEY e OPENROUTER_API_KEY)
    const rawOpenRouterKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
    const rawGeminiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      '';
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
1. Responda de forma estratégica, consultiva, empática, amigável e direta ao ponto.
2. Seja natural em cumprimentos como "Oi" ou "Tudo bem?".
3. Se perguntado sobre "estou bem?" ou "minha situação", analise os números de forma transparente e encorajadora.
4. Se o cliente perguntar se pode comprar algo, faça a conta do impacto no saldo líquido e na taxa de poupança.
5. Mantenha as respostas concisas e agradáveis de ler.
`;

    let reply = '';

    // 3. Chamada via OpenRouter se configurado
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

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          reply = aiData?.choices?.[0]?.message?.content || '';
        } else {
          console.error('[OpenRouter] Erro HTTP:', aiRes.status, await aiRes.text());
        }
      } catch (err) {
        console.warn('Erro ao chamar OpenRouter para chat:', err);
      }
    }

    // 4. Chamada via Gemini direto se configurado
    if (!reply && geminiKey) {
      const fullPrompt = `${systemPrompt}\n\nHistórico recente:\n${history
        .slice(-4)
        .map((h) => `${h.role === 'user' ? 'Cliente' : 'CFO'}: ${h.content}`)
        .join('\n')}\n\nCliente: ${message}\nCFO:`;

      const geminiModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash'];
      for (const model of geminiModels) {
        try {
          const aiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
              }),
            }
          );

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const text = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              reply = text;
              break;
            }
          } else {
            const errText = await aiRes.text();
            console.error(`[Gemini ${model}] Erro HTTP ${aiRes.status}:`, errText);
          }
        } catch (err) {
          console.error(`[Gemini ${model}] Falha de rede:`, err);
        }
      }
    }

    // 5. Fallback Conversacional Dinâmico (quando nenhuma chave de IA estiver configurada no .env)
    if (!reply) {
      const lower = message.toLowerCase().trim();

      // Saudações e cumprimentos
      if (/^(oi|ol[aá]|bom dia|boa tarde|boa noite|opa|e a[ií]|hey|fala|salve)\b/i.test(lower)) {
        reply = `Olá, @${user.username}! Tudo ótimo por aqui. Sou seu Copiloto CFO Virtual.\n\nComo posso te apoiar hoje? Posso analisar sua saúde financeira deste mês, verificar se cabe uma nova compra no orçamento ou traçar metas para economizar!`;
      }
      // Perguntas de estado / "to bem?" / "como estou?"
      else if (
        lower.includes('to bem') ||
        lower.includes('tô bem') ||
        lower.includes('estou bem') ||
        lower.includes('como estou') ||
        lower.includes('minha situação') ||
        lower.includes('como ta') ||
        lower.includes('como tá') ||
        lower.includes('saúde financeira')
      ) {
        if (balance > 0 && savingsRate >= 20) {
          reply = `Sim, @${user.username}, você está muito bem este mês!\n\n- Taxa de Poupança: ${savingsRate.toFixed(1)}% (acima da meta recomendada de 20% pelo mercado).\n- Saldo Positivo: R$ ${balance.toFixed(2)} de folga no caixa.\n- Receitas (R$ ${totalIncome.toFixed(2)}) superando suas despesas (R$ ${totalExpense.toFixed(2)}).\n\nRecomendação do CFO: esse é um momento propício para abastecer sua reserva de emergência ou acelerar aportes!`;
        } else if (balance > 0) {
          reply = `Você está positivo este mês, @${user.username}, mas com pouca margem.\n\n- Saldo Atual: R$ ${balance.toFixed(2)}.\n- Taxa de Poupança: ${savingsRate.toFixed(1)}%.\n\nPara blindar seu orçamento, o ideal é tentar poupar ao menos 20% da renda. Seus maiores gastos hoje são em ${topCategories || 'despesas gerais'}.`;
        } else {
          reply = `O momento pede atenção, @${user.username}.\n\n- Suas despesas (R$ ${totalExpense.toFixed(2)}) estão maiores que as receitas (R$ ${totalIncome.toFixed(2)}), com déficit de R$ ${Math.abs(balance).toFixed(2)}.\n\nRecomendo pausar novos gastos discricionários e focar em equilibrar as contas essenciais. Quer que eu avalie onde cortar?`;
        }
      }
      // Dúvida / não sei / o que fazer
      else if (
        lower.includes('nao sei') ||
        lower.includes('não sei') ||
        lower.includes('ajuda') ||
        lower.includes('o que fazer') ||
        lower.includes('duvida') ||
        lower.includes('dúvida')
      ) {
        reply = `Sem problemas! Como seu CFO, aqui estão algumas coisas úteis que podemos avaliar juntos:\n\n- Viabilidade de compra: "Posso comprar algo de R$ 1.500 em 5x?"\n- Otimização de despesas: "Onde posso economizar R$ 300 este mês?"\n- Reserva: "Quanto deveria ser minha reserva de emergência?"\n- Simulação futura: você também pode abrir a aba ao lado "Simulador What-If"!`;
      }
      // Reserva de emergência
      else if (lower.includes('reserva') || lower.includes('emergencia') || lower.includes('emergência')) {
        const ideal = totalExpense * 6;
        reply = `Uma reserva de emergência segura deve cobrir de 3 a 6 meses do seu custo de vida.\n\n- Seu custo de despesas atual: R$ ${totalExpense.toFixed(2)}/mês.\n- Meta ideal recomendada (6 meses): R$ ${ideal.toFixed(2)}.\n- Com seu saldo positivo deste mês (R$ ${Math.max(0, balance).toFixed(2)}), você já consegue destinar uma boa parcela para iniciar essa blindagem.`;
      }
      // Compras e gastos
      else if (lower.includes('comprar') || lower.includes('posso') || lower.includes('gastar') || lower.includes('vale a pena')) {
        if (balance > 1000) {
          reply = `Você possui uma folga de caixa de R$ ${balance.toFixed(2)} este mês (@${user.username}).\n\nCaso decida fazer essa aquisição, a recomendação é preservar pelo menos 30% dessa sobra como margem de segurança para despesas imprevistas, evitando comprometer todo o excedente.`;
        } else {
          reply = `Seu saldo líquido atual é de R$ ${balance.toFixed(2)}. O momento pede cautela antes de assumir novos parcelamentos ou compras supérfluas, garantindo que suas contas essenciais fiquem confortáveis.`;
        }
      }
      // Economizar e cortes
      else if (lower.includes('economizar') || lower.includes('cortar') || lower.includes('onde')) {
        reply = `Seus maiores grupos de despesa registrados este mês são:\n- ${topCategories || 'ainda sem categorias registradas'}\n\nA recomendação executiva é auditar os gastos discricionários (como alimentação fora de casa, delivery ou lazer) e estipular um teto semanal, preservando sempre moradia, saúde e investimentos em capacitação.`;
      }
      // Resposta geral contextualizada
      else {
        reply = `Entendido, @${user.username}! Com base nos seus números deste mês:\n\n- Receitas: R$ ${totalIncome.toFixed(2)}\n- Despesas: R$ ${totalExpense.toFixed(2)}\n- Saldo Líquido: R$ ${balance.toFixed(2)} (${savingsRate.toFixed(1)}% poupado)\n\nMe diga o que você tem em mente (ex: avaliar uma compra, montar meta de economia ou falar de investimentos) para eu te dar a melhor recomendação!`;
      }
    }

    // 6. Salvar histórico no Supabase (se a tabela ai_chat_messages existir)
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
