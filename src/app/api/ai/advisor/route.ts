import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, verifyAuth } from '@/lib/serverAuth';
import { generateAiDiagnosisFromData } from '@/utils/aiAdvisor';


interface AnalysisPayload {
  user_id: string;
  month: number;
  year: number;
  month_key?: string;
  summary?: string;
  status?: string;
  status_text?: string;
  insights?: unknown;
  advice?: string;
  updated_at?: string;
  [key: string]: unknown;
}

// Helper para salvar com fallback de compatibilidade de colunas
async function saveAnalysisToDatabase(payload: AnalysisPayload) {
  let { data, error } = await supabaseServer
    .from('ai_analyses')
    .upsert(payload, { onConflict: 'user_id,month,year' })
    .select();

  if (error) {
    const res2 = await supabaseServer
      .from('ai_analyses')
      .upsert(payload, { onConflict: 'user_id,month_key' })
      .select();
    error = res2.error;
    data = res2.data;
  }

  if (error) {
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

  if (error) {
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
        let cached: AnalysisPayload | null = null;

        const { data: byMonthYear } = await supabaseServer
          .from('ai_analyses')
          .select('*')
          .eq('user_id', user.id)
          .eq('month', m)
          .eq('year', y)
          .maybeSingle();

        if (byMonthYear) {
          cached = byMonthYear as AnalysisPayload;
        } else {
          const { data: byMonthKey } = await supabaseServer
            .from('ai_analyses')
            .select('*')
            .eq('user_id', user.id)
            .eq('month_key', monthKey)
            .maybeSingle();
          if (byMonthKey) cached = byMonthKey as AnalysisPayload;
        }

        if (cached && (cached.summary || cached.advice)) {
          return NextResponse.json({
            summary: cached.summary || cached.advice,
            status: cached.status || 'good',
            statusText: cached.status_text || 'Orçamento Equilibrado',
            insights: Array.isArray(cached.insights) ? cached.insights : ((cached.alerts as unknown[]) || []),
            advice: cached.advice || cached.summary,
            cached: true,
            updated_at: cached.updated_at || cached.created_at
          });
        }
      } catch (cacheErr) {
        console.warn('Verificação de cache em ai_analyses falhou:', cacheErr);
      }
    }

    // 2. Busca movimentações do usuário no mês
    const lastDay = new Date(y, m, 0).getDate();
    const startDate = `${y}-${String(m).padStart(2, '0')}-01T00:00:00.000Z`;
    const endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`;

    const { data: transactions } = await supabaseServer
      .from('transactions')
      .select('amount, type, category, title, date')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate);

    let totalIncome = 0;
    let totalExpense = 0;
    const expenseByCategory: Record<string, number> = {};

    interface TxSummaryRow {
      amount: number | string;
      type: string;
      category?: string;
    }

    ((transactions || []) as TxSummaryRow[]).forEach((t) => {
      const amount = parseFloat(String(t.amount || 0));
      if (t.type === 'income') {
        totalIncome += amount;
      } else {
        totalExpense += amount;
        expenseByCategory[t.category || 'Geral'] = (expenseByCategory[t.category || 'Geral'] || 0) + amount;
      }
    });

    const balance = totalIncome - totalExpense;

    // 3. Gera diagnóstico estratégico avançado
    const localDiag = generateAiDiagnosisFromData(
      { totalIncome, totalExpense, balance, expensesByCategory: expenseByCategory },
      m,
      y
    );
    let adviceText = localDiag.aiAdviceText || localDiag.summary;

    // 4. Chamada de IA Generativa de Alto Nível (Gemini / OpenRouter)
    const rawOpenRouterKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
    const rawGeminiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      '';
    const openRouterKey = rawOpenRouterKey.trim().replace(/^["']|["']$/g, '');
    const geminiKey = rawGeminiKey.trim().replace(/^["']|["']$/g, '');
    const apiKey = openRouterKey || geminiKey;

    if (apiKey) {
      const prompt = `
        Você é um Consultor Financeiro e Gestor Patrimonial CFP (Certified Financial Planner) de elite.
        Você está analisando a performance financeira de um cliente no mês ${month}/${year}.

        DADOS FINANCEIROS CONSOLIDADOS:
        - Receita Total: R$ ${totalIncome.toFixed(2)}
        - Despesa Total: R$ ${totalExpense.toFixed(2)}
        - Saldo Líquido Livre: R$ ${balance.toFixed(2)}
        - Taxa de Poupança: ${totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : '0'}%
        - Composição dos Gastos:
        ${Object.keys(expenseByCategory).length > 0 
          ? Object.entries(expenseByCategory).map(([cat, val]) => `  * ${cat}: R$ ${val.toFixed(2)}`).join('\n')
          : '  * Nenhuma despesa registrada no período.'}

        DIRETRIZES CRÍTICAS PARA SUA ANÁLISE:
        1. NÃO FAÇA RESUMO ARITMÉTICO ÓBVIO (não diga "você faturou X e gastou Y", o cliente já tem esses números na tela).
        2. ENTENDA A NATUREZA DOS GASTOS:
           - Educação, Cursos, Livros e Capacitação são INVESTIMENTOS EM CAPITAL HUMANO (maior LTV da vida), nunca sugira cortar ou renegociar isso levianamente.
           - Saúde e Alimentação Básica são manutenção essencial do bem-estar.
           - Lazer, Compras e Delivery são estilo de vida discricionário (onde mora a verdadeira margem de otimização).
        3. FOQUE NO PRÓXIMO PASSO DO CLIENTE:
           - Se teve sobra positiva alta: Qual o próximo passo tático? (Reserva de Emergência de 6 meses em 100% CDI, diversificação em IPCA+).
           - Se teve déficit: Onde ajustar de forma indolor e sem terrorismo.
        4. TOM: Profissional, consultivo, pragmático e inspirador. Máximo 2 a 3 parágrafos curtos.
      `;

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

    // 5. Salva a análise completa no banco de dados Supabase
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

  } catch (error: unknown) {
    console.error('Erro geral no endpoint de IA:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Erro ao gerar diagnóstico: ' + message }, { status: 500 });
  }
}

// POST /api/ai/advisor
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno ao salvar análise';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
