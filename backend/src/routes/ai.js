const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const JWT_SECRET = process.env.JWT_SECRET;

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const requireAuth = (req, res, next) => {
  if (!JWT_SECRET) {
    return res.status(500).json({ error: 'Erro de configuração no servidor: JWT_SECRET não configurado.' });
  }
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Falta o token de autenticação' });
  const token = authHeader.replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

function getCategoryNature(categoryName) {
  const norm = (categoryName || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (/educaca|curso|livro|faculdade|estudo|idioma|capacit|pos-grad|treina|workshop|mentoria|escola/.test(norm)) {
    return 'human_capital';
  }
  if (/saude|medic|remedio|farmacia|consulta|hospital|plano de saude|terapia|psicolog|moradia|aluguel|condominio|iptu|energia|luz|agua|gas|internet|supermercado|alimentacao|mercado|feira|transporte|combustivel|metro|onibus|uber/.test(norm)) {
    return 'essential';
  }
  if (/invest|reserva|poupanca|previdencia|seguro|emprestimo|financiamento|fatura|divida|imposto|tributo/.test(norm)) {
    return 'financial';
  }
  return 'lifestyle';
}

function generateLocalDiagnosis(totalIncome, totalExpense, balance, expenseByCategory, month, year) {
  const monthName = MONTH_NAMES[month - 1];

  const fmt = val =>
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

  const insights = [];

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

async function saveAnalysisToDatabase(payload) {
  let { data, error } = await supabase
    .from('ai_analyses')
    .upsert(payload, { onConflict: 'user_id,month,year' })
    .select();

  if (error) {
    const res2 = await supabase
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
    const res3 = await supabase
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
    const res4 = await supabase
      .from('ai_analyses')
      .upsert(minimalPayload, { onConflict: 'user_id,month,year' })
      .select();
    error = res4.error;
    data = res4.data;
  }

  return { data, error };
}

router.get('/advisor', requireAuth, async (req, res) => {
  try {
    const { month, year, refresh } = req.query;
    if (!month || !year) return res.status(400).json({ error: 'Mês e ano são obrigatórios.' });

    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const monthKey = `${y}-${String(m).padStart(2, '0')}`;

    if (refresh !== 'true') {
      try {
        let cached = null;
        const { data: byMonthYear } = await supabase
          .from('ai_analyses')
          .select('*')
          .eq('user_id', req.user.id)
          .eq('month', m)
          .eq('year', y)
          .maybeSingle();

        if (byMonthYear) {
          cached = byMonthYear;
        } else {
          const { data: byMonthKey } = await supabase
            .from('ai_analyses')
            .select('*')
            .eq('user_id', req.user.id)
            .eq('month_key', monthKey)
            .maybeSingle();
          if (byMonthKey) cached = byMonthKey;
        }

        if (cached && (cached.summary || cached.advice)) {
          return res.json({ 
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
        console.warn('Cache check warning em ai_analyses:', cacheErr);
      }
    }

    const lastDay = new Date(y, m, 0).getDate();
    const startDate = `${y}-${String(m).padStart(2, '0')}-01T00:00:00.000Z`;
    const endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`;

    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, type, category, title, date')
      .eq('user_id', req.user.id)
      .gte('date', startDate)
      .lte('date', endDate);

    let totalIncome = 0;
    let totalExpense = 0;
    const expenseByCategory = {};

    (transactions || []).forEach(t => {
      const amount = parseFloat(t.amount || 0);
      if (t.type === 'income') {
        totalIncome += amount;
      } else {
        totalExpense += amount;
        expenseByCategory[t.category || 'Geral'] = (expenseByCategory[t.category || 'Geral'] || 0) + amount;
      }
    });

    const balance = totalIncome - totalExpense;
    const localDiag = generateLocalDiagnosis(totalIncome, totalExpense, balance, expenseByCategory, m, y);
    let adviceText = localDiag.advice;

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'placeholder_gemini_key') {
      try {
        const prompt = `
          Você é um Consultor Financeiro CFP (Certified Financial Planner) de alto nível.
          Analise o mês ${month}/${year} do cliente:
          - Receitas: R$ ${totalIncome.toFixed(2)}
          - Despesas: R$ ${totalExpense.toFixed(2)}
          - Saldo Livre: R$ ${balance.toFixed(2)}
          - Gastos:
          ${Object.keys(expenseByCategory).length > 0 
            ? Object.entries(expenseByCategory).map(([cat, val]) => `  * ${cat}: R$ ${val.toFixed(2)}`).join('\n')
            : '  * Sem despesas no mês.'}
          
          DIRETRIZES:
          1. Não repita números óbvios.
          2. Considere Educação e Cursos como investimento em Capital Humano de alto valor, não custo.
          3. Dê direcionamento prático para o saldo livre (reserva de emergência de 6 meses em 100% CDI, tesouro IPCA+).
          4. Máximo 2 a 3 parágrafos curtos, inspiradores e práticos.
        `;

        const genAI = new GoogleGenerativeAI(apiKey);
        const candidateModels = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];

        for (const modelName of candidateModels) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            if (text) {
              adviceText = text;
              break;
            }
          } catch (err) {
            console.warn(`[Backend IA] Modelo ${modelName} falhou:`, err?.message || err);
          }
        }
      } catch (aiErr) {
        console.warn('Falha no Gemini SDK:', aiErr?.message || aiErr);
      }
    }

    const nowIso = new Date().toISOString();

    const dbPayload = {
      user_id: req.user.id,
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

    res.json({
      summary: localDiag.summary,
      status: localDiag.status,
      statusText: localDiag.statusText,
      insights: localDiag.insights,
      advice: adviceText,
      cached: false,
      updated_at: nowIso
    });

  } catch (error) {
    console.error("Erro na API de IA (backend):", error);
    res.status(500).json({ error: 'Erro ao gerar análise: ' + (error?.message || error) });
  }
});

router.post('/advisor', requireAuth, async (req, res) => {
  try {
    const { month, year, summary, status, statusText, insights, advice } = req.body;
    if (!month || !year) return res.status(400).json({ error: 'Mês e ano são obrigatórios.' });

    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const monthKey = `${y}-${String(m).padStart(2, '0')}`;
    const nowIso = new Date().toISOString();

    const dbPayload = {
      user_id: req.user.id,
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
      return res.status(500).json({ error: 'Erro ao salvar no Supabase: ' + error.message });
    }

    res.json({ success: true, saved: data?.[0] || dbPayload });
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Erro interno' });
  }
});

module.exports = router;
