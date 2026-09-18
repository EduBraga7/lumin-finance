import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, verifyAuth } from '@/lib/serverAuth';

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function generateLocalDiagnosis(
  totalIncome: number,
  totalExpense: number,
  balance: number,
  expenseByCategory: Record<string, number>,
  month: number,
  year: number
) {
  const monthName = MONTH_NAMES[month - 1];

  if (totalIncome === 0 && totalExpense === 0) {
    return {
      status: 'warning',
      statusText: 'Sem Movimentações',
      summary: `Ainda não identifiquei movimentações financeiras em ${monthName} de ${year}. Adicione alguns lançamentos para liberar o diagnóstico completo!`,
      insights: [
        {
          type: 'tip',
          title: 'Primeiros Passos',
          description: 'Cadastre sua principal fonte de renda e despesas fixas para liberar análises preditivas.'
        }
      ],
      advice: `Você ainda não registrou receitas nem despesas em ${monthName} de ${year}. Para que eu possa analisar seus padrões de gastos e dar conselhos estratégicos, comece cadastrando seus lançamentos no Extrato.`
    };
  }

  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : -100;
  const sortedCategories = Object.entries(expenseByCategory || {}).sort(([, a], [, b]) => b - a);
  const topCategory = sortedCategories[0];
  const secondCategory = sortedCategories[1];
  const topCatPct = totalExpense > 0 && topCategory ? ((topCategory[1] / totalExpense) * 100) : 0;

  let status = 'good';
  let statusText = 'Orçamento Equilibrado';
  let summary = '';
  const insights: Array<{ type: string; title: string; description: string }> = [];

  if (balance < 0) {
    status = 'critical';
    statusText = 'Déficit no Período';
    summary = `Atenção: suas despesas superaram as receitas em R$ ${Math.abs(balance).toFixed(2)} em ${monthName} de ${year}. É recomendável cortar gastos não essenciais imediatamente.`;
    insights.push({
      type: 'warning',
      title: 'Despesas Superando Entradas',
      description: `O saldo está negativo em R$ ${Math.abs(balance).toFixed(2)}. Priorize quitar contas essenciais e evite compras a prazo.`
    });
  } else if (savingsRate >= 25) {
    status = 'excellent';
    statusText = 'Excelente Poupança';
    summary = `Parabéns! Você economizou ${savingsRate.toFixed(1)}% dos seus ganhos em ${monthName} de ${year}, acumulando R$ ${balance.toFixed(2)} em caixa.`;
    insights.push({
      type: 'positive',
      title: 'Taxa de Poupança Alta',
      description: `Você reteve mais de 25% da sua renda (${savingsRate.toFixed(1)}%). Considere investir parte desse excedente em uma reserva de emergência ou renda fixa.`
    });
  } else {
    status = 'good';
    statusText = 'Orçamento Saudável';
    summary = `Você encerrou ${monthName} com saldo positivo de R$ ${balance.toFixed(2)} (${savingsRate.toFixed(1)}% poupado). Suas finanças estão sob controle.`;
    insights.push({
      type: 'positive',
      title: 'Saldo sob Controle',
      description: `Você manteve as saídas menores que as entradas em ${monthName}. Procure aumentar sua taxa de poupança para pelo menos 20%.`
    });
  }

  if (topCategory && topCatPct > 35) {
    insights.push({
      type: 'warning',
      title: `Concentração em ${topCategory[0]}`,
      description: `${topCatPct.toFixed(1)}% dos seus gastos estão concentrados em ${topCategory[0]} (R$ ${topCategory[1].toFixed(2)}). Avalie se é possível renegociar despesas desse grupo.`
    });
  }

  if (secondCategory) {
    insights.push({
      type: 'tip',
      title: `Segundo Maior Gasto: ${secondCategory[0]}`,
      description: `Sua segunda maior categoria consumiu R$ ${secondCategory[1].toFixed(2)}. Monitorar despesas recorrentes aqui pode gerar economia rápida.`
    });
  }

  const advice = `Análise de ${monthName}/${year}: Você faturou R$ ${totalIncome.toFixed(2)} e gastou R$ ${totalExpense.toFixed(2)}, fechando com saldo de R$ ${balance.toFixed(2)} (${savingsRate.toFixed(1)}% de taxa de poupança). ${topCategory ? `Sua maior despesa foi em ${topCategory[0]} (R$ ${topCategory[1].toFixed(2)}).` : ''} Continue mantendo o controle rigoroso dos seus lançamentos para construir previsibilidade financeira.`;

  return { status, statusText, summary, insights, advice };
}

// Helper para salvar com fallback de compatibilidade de colunas
async function saveAnalysisToDatabase(payload: any) {
  // 1. Tentar salvar payload completo com conflito em (user_id, month, year)
  let { data, error } = await supabaseServer
    .from('ai_analyses')
    .upsert(payload, { onConflict: 'user_id,month,year' })
    .select();

  // 2. Se falhar, tentar conflito em (user_id, month_key)
  if (error) {
    console.warn('Upsert (user_id,month,year) falhou, tentando (user_id,month_key):', error.message);
    const res2 = await supabaseServer
      .from('ai_analyses')
      .upsert(payload, { onConflict: 'user_id,month_key' })
      .select();
    error = res2.error;
    data = res2.data;
  }

  // 3. Se falhar por causa de colunas extras (ex: status_text ou month_key não existem), tentar payload simplificado
  if (error) {
    console.warn('Upsert de colunas completas falhou, tentando colunas básicas:', error.message);
    const basicPayload = {
      user_id: payload.user_id,
      month: payload.month,
      year: payload.year,
      summary: payload.summary,
      status: payload.status,
      advice: payload.advice,
      updated_at: payload.updated_at
    };
    const res3 = await supabaseServer
      .from('ai_analyses')
      .upsert(basicPayload, { onConflict: 'user_id,month,year' })
      .select();
    error = res3.error;
    data = res3.data;
  }

  // 4. Último fallback: apenas advice, month, year
  if (error) {
    console.warn('Tentando fallback mínimo em ai_analyses:', error.message);
    const minimalPayload = {
      user_id: payload.user_id,
      month: payload.month,
      year: payload.year,
      advice: payload.advice || payload.summary,
      updated_at: payload.updated_at
    };
    const res4 = await supabaseServer
      .from('ai_analyses')
      .upsert(minimalPayload, { onConflict: 'user_id,month,year' })
      .select();
    error = res4.error;
    data = res4.data;
  }

  if (error) {
    console.error('❌ Não foi possível salvar em ai_analyses no Supabase:', error.message);
  } else {
    console.log('✅ Análise da IA salva com sucesso no Supabase:', payload.month_key);
  }

  return { data, error };
}

// GET /api/ai/advisor
export async function GET(req: NextRequest) {
  const user = verifyAuth(req);
  if (!user) return NextResponse.json({ error: 'Token inválido ou não fornecido' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const refresh = searchParams.get('refresh') === 'true';

    if (!month || !year) {
      return NextResponse.json({ error: 'Mês e ano são obrigatórios.' }, { status: 400 });
    }

    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const monthKey = `${y}-${String(m).padStart(2, '0')}`;

    // 1. Se não for refresh forçado, verifica se já existe análise no banco para este mês
    if (!refresh) {
      try {
        let cached: any = null;

        // Tenta buscar por (month, year)
        const { data: byMonthYear } = await supabaseServer
          .from('ai_analyses')
          .select('*')
          .eq('user_id', user.id)
          .eq('month', m)
          .eq('year', y)
          .maybeSingle();

        if (byMonthYear) {
          cached = byMonthYear;
        } else {
          // Tenta buscar por month_key
          const { data: byMonthKey } = await supabaseServer
            .from('ai_analyses')
            .select('*')
            .eq('user_id', user.id)
            .eq('month_key', monthKey)
            .maybeSingle();
          if (byMonthKey) cached = byMonthKey;
        }

        if (cached && (cached.summary || cached.advice)) {
          return NextResponse.json({
            summary: cached.summary || cached.advice,
            status: cached.status || 'good',
            statusText: cached.status_text || 'Orçamento Equilibrado',
            insights: Array.isArray(cached.insights) ? cached.insights : (cached.alerts || []),
            advice: cached.advice || cached.summary,
            cached: true,
            updated_at: cached.updated_at || cached.created_at
          });
        }
      } catch (cacheErr) {
        console.warn('Verificação de cache em ai_analyses falhou:', cacheErr);
      }
    }

    // 2. Busca movimentações do usuário no mês para compor o diagnóstico
    const lastDay = new Date(y, m, 0).getDate();
    const startDate = `${y}-${String(m).padStart(2, '0')}-01T00:00:00.000Z`;
    const endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`;

    const { data: transactions, error } = await supabaseServer
      .from('transactions')
      .select('amount, type, category, title, date')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) {
      console.error('Erro ao buscar transações para análise de IA:', error);
    }

    let totalIncome = 0;
    let totalExpense = 0;
    const expenseByCategory: Record<string, number> = {};

    (transactions || []).forEach((t: any) => {
      const amount = parseFloat(t.amount || 0);
      if (t.type === 'income') {
        totalIncome += amount;
      } else {
        totalExpense += amount;
        expenseByCategory[t.category || 'Geral'] = (expenseByCategory[t.category || 'Geral'] || 0) + amount;
      }
    });

    const balance = totalIncome - totalExpense;

    // 3. Gera diagnóstico base estruturado
    const localDiag = generateLocalDiagnosis(totalIncome, totalExpense, balance, expenseByCategory, m, y);
    let adviceText = localDiag.advice;

    // 4. Se houver chave configurada, tenta chamar o Gemini / OpenRouter para parecer avançado
    const rawOpenRouterKey = process.env.OPENROUTER_API_KEY || '';
    const rawGeminiKey = process.env.GEMINI_API_KEY || '';
    const openRouterKey = rawOpenRouterKey.trim().replace(/^["']|["']$/g, '');
    const geminiKey = rawGeminiKey.trim().replace(/^["']|["']$/g, '');
    const apiKey = openRouterKey || geminiKey;

    if (apiKey) {
      const prompt = `
        Atue como um mentor financeiro inteligente e bem-humorado.
        Você está analisando as contas do usuário em ${month}/${year}.
        
        Dados:
        - Receitas: R$ ${totalIncome.toFixed(2)}
        - Despesas: R$ ${totalExpense.toFixed(2)}
        - Saldo final: R$ ${balance.toFixed(2)}
        - Gastos por Categoria:
        ${Object.keys(expenseByCategory).length > 0 
          ? Object.entries(expenseByCategory).map(([cat, val]) => `- ${cat}: R$ ${val.toFixed(2)}`).join('\n')
          : '- Nenhuma despesa no mês.'}
        
        Escreva um parecer direto de 2 a 3 parágrafos curtos com conselhos práticos para otimizar esse orçamento.
      `;

      // Se for chave OpenRouter
      if (openRouterKey.startsWith('sk-or-')) {
        try {
          const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openRouterKey}`,
              'Content-Type': 'application/json',
              'X-Title': 'Lumin Finance'
            },
            body: JSON.stringify({
              model: 'google/gemini-2.0-flash-lite-001',
              messages: [{ role: 'user', content: prompt }]
            })
          });
          const aiData = await aiRes.json();
          if (aiData?.choices?.[0]?.message?.content) {
            adviceText = aiData.choices[0].message.content;
          }
        } catch (e) {
          console.warn('Chamada OpenRouter falhou, usando parecer local:', e);
        }
      } else if (geminiKey) {
        // Tenta Gemini REST API
        try {
          const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          });
          const aiData = await aiRes.json();
          if (aiData?.candidates?.[0]?.content?.parts?.[0]?.text) {
            adviceText = aiData.candidates[0].content.parts[0].text;
          }
        } catch (e) {
          console.warn('Chamada Gemini falhou, usando parecer local:', e);
        }
      }
    }

    const nowIso = new Date().toISOString();

    // 5. Salva a análise completa no banco de dados Supabase na tabela ai_analyses
    const dbPayload = {
      user_id: user.id,
      month: m,
      year: y,
      month_key: monthKey,
      summary: localDiag.summary,
      status: localDiag.status,
      status_text: localDiag.statusText,
      insights: localDiag.insights,
      advice: adviceText,
      updated_at: nowIso
    };

    await saveAnalysisToDatabase(dbPayload);

    return NextResponse.json({
      summary: localDiag.summary,
      status: localDiag.status,
      statusText: localDiag.statusText,
      insights: localDiag.insights,
      advice: adviceText,
      cached: false,
      updated_at: nowIso
    });

  } catch (error: any) {
    console.error('Erro geral no endpoint de IA:', error);
    return NextResponse.json({ error: 'Erro ao gerar diagnóstico: ' + (error?.message || error) }, { status: 500 });
  }
}

// POST /api/ai/advisor (Permite que o frontend salve ou sincronize explicitamente uma análise)
export async function POST(req: NextRequest) {
  const user = verifyAuth(req);
  if (!user) return NextResponse.json({ error: 'Token inválido ou não fornecido' }, { status: 401 });

  try {
    const body = await req.json();
    const { month, year, summary, status, statusText, insights, advice } = body;

    if (!month || !year) {
      return NextResponse.json({ error: 'Mês e ano são obrigatórios.' }, { status: 400 });
    }

    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const monthKey = `${y}-${String(m).padStart(2, '0')}`;
    const nowIso = new Date().toISOString();

    const dbPayload = {
      user_id: user.id,
      month: m,
      year: y,
      month_key: monthKey,
      summary: summary || '',
      status: status || 'good',
      status_text: statusText || '',
      insights: Array.isArray(insights) ? insights : [],
      advice: advice || summary || '',
      updated_at: nowIso
    };

    const { data, error } = await saveAnalysisToDatabase(dbPayload);

    if (error) {
      return NextResponse.json({ error: 'Erro ao persistir no Supabase: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, saved: data?.[0] || dbPayload });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro interno ao salvar análise' }, { status: 500 });
  }
}
