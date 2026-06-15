const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const JWT_SECRET = process.env.JWT_SECRET || 'lumin-finance-secret-key-123';

const requireAuth = (req, res, next) => {
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

    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

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

    transactions.forEach(t => {
      const amount = parseFloat(t.amount);
      if (t.type === 'income') {
        totalIncome += amount;
      } else {
        totalExpense += amount;
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + amount;
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
      ${Object.entries(expenseByCategory).map(([cat, val]) => `- ${cat}: R$ ${val.toFixed(2)}`).join('\n')}
      
      Seja ácido e engraçado, critique onde ele gastou muito (especialmente futilidades como lazer ou alimentação cara) ou elogie de forma irônica se sobrou dinheiro. Não invente dados que não estão listados.
    `;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ advice: text });

  } catch (error) {
    console.error("Erro na API de IA:", error);
    res.status(500).json({ error: 'Erro ao gerar conselho com a IA.' });
  }
});

module.exports = router;
