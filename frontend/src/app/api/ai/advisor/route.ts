import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, verifyAuth } from '@/lib/serverAuth';

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function getCategoryNature(categoryName: string): 'human_capital' | 'essential' | 'lifestyle' | 'financial' {
  const norm = (categoryName || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // 1. Investimento em Capital Humano & Futuro
  if (/educaca|curso|livro|faculdade|estudo|idioma|capacit|pos-grad|treina|workshop|mentoria|escola/.test(norm)) {
    return 'human_capital';
  }

  // 2. Despesas Essenciais / Saúde / Sobrevivência
  if (/saude|medic|remedio|farmacia|consulta|hospital|plano de saude|terapia|psicolog|moradia|aluguel|condominio|iptu|energia|luz|agua|gas|internet|supermercado|alimentacao|mercado|feira|transporte|combustivel|metro|onibus|uber/.test(norm)) {
    return 'essential';
  }

  // 3. Compromissos Financeiros / Patrimônio
  if (/invest|reserva|poupanca|previdencia|seguro|emprestimo|financiamento|fatura|divida|imposto|tributo/.test(norm)) {
    return 'financial';
  }

  // 4. Estilo de Vida & Discricionários (Lazer, restaurantes, compras, delivery)
  return 'lifestyle';
}

function generateLocalDiagnosis(
  totalIncome: number,
  totalExpense: number,
  balance: number,
  expenseByCategory: Record<string, number>,
  month: number,
  year: number
) {
  const monthName = MONTH_NAMES[month - 1];

  const fmt = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (totalIncome === 0 && totalExpense === 0) {
    return {
      status: 'warning',
      statusText: 'Sem Movimentações',
      summary: `Nenhuma movimentação registrada em ${monthName} de ${year}. Cadastre suas primeiras receitas e despesas no Extrato para desbloquear a inteligência preditiva.`,
      insights: [
        {
          type: 'tip',
          title: 'Primeiros Passos Financeiros',
          description: 'Cadastre sua principal fonte de receita e seus custos fixos mensais para ativarmos o cálculo de autonomia e projeção patrimonial.'
        }
      ],
      advice: `Para iniciar seu planejamento, lance no Extrato suas fontes de receita e principais contas fixas de ${monthName}.`
    };
  }

  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : (balance >= 0 ? 100 : -100);

  let humanCapitalTotal = 0;
  let essentialTotal = 0;
  let lifestyleTotal = 0;

  Object.entries(expenseByCategory || {}).forEach(([cat, amount]) => {
    const val = Number(amount) || 0;
    const nature = getCategoryNature(cat);
    if (nature === 'human_capital') humanCapitalTotal += val;
    else if (nature === 'essential') essentialTotal += val;
    else if (nature === 'lifestyle') lifestyleTotal += val;
    else essentialTotal += val;
  });

  const runwayMonths = totalExpense > 0 && balance > 0 ? (balance / totalExpense) : 0;
  const monthlyRate = 0.105 / 12;
  let projectedWealth12m = 0;
  let projectedMonthlyPassive = 0;

  if (balance > 0) {
    const n = 12;
    projectedWealth12m = balance * ((Math.pow(1 + monthlyRate, n) - 1) / monthlyRate);
    projectedMonthlyPassive = projectedWealth12m * monthlyRate;
  }

  let status = 'good';
  let statusText = 'Orçamento Equilibrado';

  if (balance < 0) {
    status = 'critical';
    statusText = 'Déficit no Período';
  } else if (savingsRate >= 30) {
    status = 'excellent';
    statusText = 'Poupança de Alto Nível';
  } else if (savingsRate >= 15) {
    status = 'good';
    statusText = 'Orçamento Saudável';
  } else {
    status = 'warning';
    statusText = 'Margem de Segurança Estreita';
  }

  const insights: Array<{ type: string; title: string; description: string }> = [];

  // 1. Autonomia & Cobertura
  if (balance > 0) {
    insights.push({
      type: 'positive',
      title: `Autonomia: +${runwayMonths.toFixed(1)} meses de custo de vida`,
      description: `O excedente deste mês (${fmt(balance)}) banca sozinho ${runwayMonths.toFixed(1)}x todo o seu custo de vida atual (${fmt(totalExpense)}). Você está construindo uma barreira de segurança sólida contra imprevistos.`
    });
  } else {
    insights.push({
      type: 'warning',
      title: 'Alerta de Queima de Caixa',
      description: `O mês fechou com déficit de ${fmt(Math.abs(balance))}. Para evitar o uso de limites caros, congele compras discricionárias de estilo de vida nos próximos 30 dias.`
    });
  }

  // 2. Capital Humano vs Estilo de Vida
  if (humanCapitalTotal > 0) {
    const hcPctIncome = totalIncome > 0 ? ((humanCapitalTotal / totalIncome) * 100) : 0;
    insights.push({
      type: 'positive',
      title: `Aporte em Capital Humano (${fmt(humanCapitalTotal)})`,
      description: `Você direcionou ${hcPctIncome.toFixed(1)}% da sua renda em Educação e desenvolvimento pessoal. Este é o ativo de maior retorno comprovado no longo prazo. Mantenha o foco em alavancar seu poder de ganho.`
    });
  } else if (lifestyleTotal > 0 && totalExpense > 0 && (lifestyleTotal / totalExpense) > 0.35) {
    const lifePct = ((lifestyleTotal / totalExpense) * 100).toFixed(0);
    insights.push({
      type: 'warning',
      title: `Atenção a Gastos de Estilo de Vida (${lifePct}%)`,
      description: `Categorias discricionárias (Lazer, Delivery, Compras) consumiram ${fmt(lifestyleTotal)}. Pequenos ajustes conscientes aqui aceleram significativamente seus aportes de investimento.`
    });
  } else {
    const essPct = totalIncome > 0 ? ((essentialTotal / totalIncome) * 100).toFixed(0) : '0';
    insights.push({
      type: 'tip',
      title: 'Estrutura de Custos Essenciais',
      description: `Seus gastos essenciais consumiram ${essPct}% da sua receita. Manter o custo de vida fixo controlado é a chave que permite ter flexibilidade e paz mental financeira.`
    });
  }

  // 3. Projeção de Juros Compostos
  if (balance > 0) {
    insights.push({
      type: 'tip',
      title: `Projeção 12 Meses: ${fmt(projectedWealth12m)}`,
      description: `Mantendo aportes mensais de ${fmt(balance)} a 100% CDI (~10,5% a.a.), você acumulará ${fmt(projectedWealth12m)} em 1 ano, gerando aproximadamente ${fmt(projectedMonthlyPassive)}/mês de renda passiva sem precisar trabalhar.`
    });
  } else {
    insights.push({
      type: 'tip',
      title: 'Recuperação de Capacidade de Aporte',
      description: 'Reestruture seus gastos variáveis para voltar a ter saldo positivo. Mesmo pequenos aportes ativam a bola de neve dos juros compostos a seu favor.'
    });
  }

  let strategicAdvice = '';
  if (balance > 0 && savingsRate >= 30) {
    const reserveTarget = totalExpense * 6;
    strategicAdvice = `Sua saúde financeira está em nível de excelência, retendo ${savingsRate.toFixed(1)}% de margem livre e mantendo um custo de vida enxuto. ${humanCapitalTotal > 0 ? `O grande destaque positivo foi priorizar seu desenvolvimento (Educação - ${fmt(humanCapitalTotal)}) sem desbalancear as contas.` : ''}\n\nDiretriz estratégica para o excedente de ${fmt(balance)}:\n1. Caso ainda não tenha montado sua Reserva de Emergência (meta: ${fmt(reserveTarget)}, equivalente a 6 meses de despesas), direcione 100% do saldo para Tesouro Selic ou CDB com liquidez diária.\n2. Se sua reserva já estiver completa, é hora de diversificar parte dos novos aportes em ativos com proteção contra a inflação (IPCA+) para multiplicar seu patrimônio no médio e longo prazo.`;
  } else if (balance > 0) {
    strategicAdvice = `Seu fluxo de caixa encerrou no azul com taxa de poupança positiva de ${savingsRate.toFixed(1)}%. Você tem fôlego orçamentário para manter a estabilidade.\n\nPróximo passo recomendado: Estabeleça a meta de automatizar uma transferência de pelo menos 20% da sua receita para sua conta de investimentos logo no dia que o pagamento cair, garantindo consistência patrimonial mês após mês.`;
  } else {
    strategicAdvice = `O fechamento do mês indicou que as saídas superaram a renda em ${fmt(Math.abs(balance))}. Isso exige ajuste preventivo de rota.\n\nPlano tático:\n1. Faça uma varredura nas assinaturas e gastos de conveniência/delivery nos próximos 15 dias.\n2. Não parcele novas compras em cartões enquanto o fluxo de caixa mensal não voltar a fechar com folga positiva.`;
  }

  const summary = balance >= 0
    ? `Excelente disciplina orçamentária: você reteve ${savingsRate.toFixed(1)}% dos seus ganhos em ${monthName} de ${year}, gerando ${fmt(balance)} em liquidez livre.`
    : `Atenção ao fluxo de caixa: suas despesas superaram as entradas em ${fmt(Math.abs(balance))} em ${monthName} de ${year}.`;

  return { status, statusText, summary, insights, advice: strategicAdvice };
}

// Helper para salvar com fallback de compatibilidade de colunas
async function saveAnalysisToDatabase(payload: any) {
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
        let cached: any = null;

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

    // 3. Gera diagnóstico estratégico avançado
    const localDiag = generateLocalDiagnosis(totalIncome, totalExpense, balance, expenseByCategory, m, y);
    let adviceText = localDiag.advice;

    // 4. Chamada de IA Generativa de Alto Nível (Gemini / OpenRouter)
    const rawOpenRouterKey = process.env.OPENROUTER_API_KEY || '';
    const rawGeminiKey = process.env.GEMINI_API_KEY || '';
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

  } catch (error: any) {
    console.error('Erro geral no endpoint de IA:', error);
    return NextResponse.json({ error: 'Erro ao gerar diagnóstico: ' + (error?.message || error) }, { status: 500 });
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
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro interno ao salvar análise' }, { status: 500 });
  }
}
