const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey); // Cliente global
const JWT_SECRET = process.env.JWT_SECRET || 'lumin-finance-secret-key-123';

// Middleware customizado para decodificar o nosso JWT
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Falta o token de autenticação (Authorization header)' });
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username }
    req.supabase = supabase; // Retorna a usar o client global, pois nós faremos a filtragem via WHERE explicitamente
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

// Helper para filtro de data
const applyDateFilter = (query, month, year) => {
  if (month && year) {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
    return query.gte('date', startDate).lte('date', endDate);
  }
  return query;
};

// GET /api/transactions
router.get('/', requireAuth, async (req, res) => {
  const { month, year } = req.query;
  let query = req.supabase
    .from('transactions')
    .select('*')
    .eq('user_id', req.user.id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  query = applyDateFilter(query, month, year);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/transactions
router.post('/', requireAuth, async (req, res) => {
  const { title, amount, type, category, date } = req.body;

  if (!title || !amount || !type || !category) {
    return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
  }

  const { data, error } = await req.supabase
    .from('transactions')
    .insert([
      { 
        title, 
        amount, 
        type, 
        category, 
        date: date || new Date().toISOString().split('T')[0],
        user_id: req.user.id // Vincula a transação ao usuário logado
      }
    ])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

// PUT /api/transactions/:id
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { title, amount, type, category, date } = req.body;

  const { data, error } = await req.supabase
    .from('transactions')
    .update({ title, amount, type, category, date })
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  if (data.length === 0) return res.status(404).json({ error: 'Transação não encontrada.' });

  res.json(data[0]);
});

// DELETE /api/transactions/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  const { data, error } = await req.supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id) // Reforço de segurança
    .select();

  if (error) return res.status(500).json({ error: error.message });
  if (data.length === 0) return res.status(404).json({ error: 'Transação não encontrada.' });

  res.json({ message: 'Transação deletada com sucesso.', deleted: data[0] });
});

// GET /api/transactions/dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
  const { month, year } = req.query;
  let query = req.supabase
    .from('transactions')
    .select('*')
    .eq('user_id', req.user.id);

  query = applyDateFilter(query, month, year);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  let totalIncome = 0;
  let totalExpense = 0;
  const expensesByCategory = {};

  data.forEach((t) => {
    const amount = parseFloat(t.amount);
    if (t.type === 'income') {
      totalIncome += amount;
    } else if (t.type === 'expense') {
      totalExpense += amount;
      if (!expensesByCategory[t.category]) {
        expensesByCategory[t.category] = 0;
      }
      expensesByCategory[t.category] += amount;
    }
  });

  res.json({
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    expensesByCategory
  });
});

// GET /api/transactions/yearly
router.get('/yearly', requireAuth, async (req, res) => {
  const { year } = req.query;
  const targetYear = year ? parseInt(year) : new Date().getFullYear();
  
  // Como o banco usa YYYY-MM-DD no timezone GMT, a busca simplificada por string atende
  const startDate = `${targetYear}-01-01`;
  const endDate = `${targetYear}-12-31`;

  const { data, error } = await req.supabase
    .from('transactions')
    .select('amount, type, date')
    .eq('user_id', req.user.id)
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) return res.status(500).json({ error: error.message });

  const monthsMap = [
    { name: 'Jan', income: 0, expense: 0 },
    { name: 'Fev', income: 0, expense: 0 },
    { name: 'Mar', income: 0, expense: 0 },
    { name: 'Abr', income: 0, expense: 0 },
    { name: 'Mai', income: 0, expense: 0 },
    { name: 'Jun', income: 0, expense: 0 },
    { name: 'Jul', income: 0, expense: 0 },
    { name: 'Ago', income: 0, expense: 0 },
    { name: 'Set', income: 0, expense: 0 },
    { name: 'Out', income: 0, expense: 0 },
    { name: 'Nov', income: 0, expense: 0 },
    { name: 'Dez', income: 0, expense: 0 },
  ];

  data.forEach(t => {
    const monthIndex = parseInt(t.date.split('-')[1]) - 1; 
    const amount = parseFloat(t.amount);
    
    if (t.type === 'income') {
      monthsMap[monthIndex].income += amount;
    } else {
      monthsMap[monthIndex].expense += amount;
    }
  });

  res.json(monthsMap);
});

module.exports = router;
