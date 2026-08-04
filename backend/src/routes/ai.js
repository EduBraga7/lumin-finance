const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const JWT_SECRET = process.env.JWT_SECRET;

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

router.get('/advisor', requireAuth, async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ error: 'Mês e ano são obrigatórios.' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'A chave da API do Gemini (GEMINI_API_KEY) não está configurada no servidor.' });
    }

    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const lastDay = new Date(y, m, 0).getDate();
    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`;

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('amount, type, category, title, date')
      .eq('user_id', req.user.id)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

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

    const prompt = `
      Atue como um conselheiro financeiro virtual altamente sarcástico, irônico, mas que no fundo dá dicas verdadeiras e úteis. 
      Você está analisando os gastos de um usuário no mês ${month}/${year}.
      Resuma a situação em no máximo 3 parágrafos curtos.
      
      Dados financeiros:
      - Ganhou (Receitas): R$ ${totalIncome.toFixed(2)}
      - Gastou (Despesas): R$ ${totalExpense.toFixed(2)}
      - Saldo final do mês: R$ ${balance.toFixed(2)}
      
      Divisão das despesas:
      ${Object.keys(expenseByCategory).length > 0 
        ? Object.entries(expenseByCategory).map(([cat, val]) => `- ${cat}: R$ ${val.toFixed(2)}`).join('\n')
        : '- Nenhuma despesa registrada neste mês.'}
      
      Seja ácido e engraçado, critique onde ele gastou muito (especialmente futilidades como lazer ou alimentação cara) ou elogie de forma irônica se sobrou dinheiro. Não invente dados que não estão listados.
    `;

    const genAI = new GoogleGenerativeAI(apiKey);
    const candidateModels = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-pro'];
    let text = '';
    let lastError = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        text = response.text();
        if (text) break;
      } catch (err) {
        console.warn(`[Backend IA] Tentativa com modelo ${modelName} falhou:`, err?.message || err);
        lastError = err;
      }
    }

    if (!text && lastError) {
      throw lastError;
    }

    res.json({ advice: text });

  } catch (error) {
    console.error("Erro na API de IA (backend):", error);
    const errMsg = error?.message || String(error);

    if (error?.status === 429 || errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
      return res.status(429).json({ 
        error: 'Limite de chamadas da IA atingido temporariamente. Por favor, aguarde cerca de 30 segundos e tente novamente.' 
      });
    }

    res.status(500).json({ error: 'Erro ao gerar conselho com a IA: ' + errMsg });
  }
});

module.exports = router;
