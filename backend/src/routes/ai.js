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

function generateLocalDiagnosis(totalIncome, totalExpense, balance, expenseByCategory, month, year) {
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
      advice: `Você ainda não registrou movimentações em ${monthName} de ${year}. Comece registrando suas receitas e despesas no Extrato.`
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
  const insights = [];

  if (balance < 0) {
    status = 'critical';
    statusText = 'Déficit no Período';
    summary = `Atenção: suas despesas superaram as receitas em R$ ${Math.abs(balance).toFixed(2)} em ${monthName} de ${year}.`;
    insights.push({
      type: 'warning',
      title: 'Despesas Superando Entradas',
      description: `O saldo está negativo em R$ ${Math.abs(balance).toFixed(2)}. Priorize cortar gastos supérfluos.`
    });
  } else if (savingsRate >= 25) {
    status = 'excellent';
    statusText = 'Excelente Poupança';
    summary = `Parabéns! Você economizou ${savingsRate.toFixed(1)}% dos seus ganhos em ${monthName} de ${year}, acumulando R$ ${balance.toFixed(2)} em caixa.`;
    insights.push({
      type: 'positive',
      title: 'Taxa de Poupança Alta',
      description: `Mais de 25% da renda retida. Excelente momento para fortalecer sua reserva.`
    });
  } else {
    status = 'good';
    statusText = 'Orçamento Saudável';
    summary = `Você encerrou ${monthName} com saldo positivo de R$ ${balance.toFixed(2)} (${savingsRate.toFixed(1)}% poupado).`;
    insights.push({
      type: 'positive',
      title: 'Saldo sob Controle',
      description: `Receitas cobriram as despesas. Busque manter essa consistência.`
    });
  }

  if (topCategory && topCatPct > 35) {
    insights.push({
      type: 'warning',
      title: `Concentração em ${topCategory[0]}`,
      description: `${topCatPct.toFixed(1)}% dos gastos estão concentrados em ${topCategory[0]} (R$ ${topCategory[1].toFixed(2)}).`
    });
  }

  if (secondCategory) {
    insights.push({
      type: 'tip',
      title: `Segundo Maior Gasto: ${secondCategory[0]}`,
      description: `Consumiu R$ ${secondCategory[1].toFixed(2)} no período.`
    });
  }

  const advice = `Análise de ${monthName}/${year}: Receitas de R$ ${totalIncome.toFixed(2)}, despesas de R$ ${totalExpense.toFixed(2)}, saldo de R$ ${balance.toFixed(2)} (${savingsRate.toFixed(1)}% poupado). ${topCategory ? `Principal gasto: ${topCategory[0]} (R$ ${topCategory[1].toFixed(2)}).` : ''}`;

  return { status, statusText, summary, insights, advice };
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

    // 1. Se não for refresh forçado, verifica se já existe análise no banco para este mês
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
          Atue como um mentor financeiro inteligente.
          Você está analisando as contas do usuário no mês ${month}/${year}.
          
          Dados financeiros:
          - Ganhou (Receitas): R$ ${totalIncome.toFixed(2)}
          - Gastou (Despesas): R$ ${totalExpense.toFixed(2)}
          - Saldo final do mês: R$ ${balance.toFixed(2)}
          
          Divisão das despesas:
          ${Object.keys(expenseByCategory).length > 0 
            ? Object.entries(expenseByCategory).map(([cat, val]) => `- ${cat}: R$ ${val.toFixed(2)}`).join('\n')
            : '- Nenhuma despesa registrada neste mês.'}
          
          Escreva um parecer direto e acionável em 2 a 3 parágrafos curtos.
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
        console.warn('Falha na chamada ao Gemini SDK:', aiErr?.message || aiErr);
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
