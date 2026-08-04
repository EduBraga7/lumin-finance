const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const JWT_SECRET = process.env.JWT_SECRET || 'lumin-finance-secret-key-123';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }

  // 1. Verificar se usuário já existe
  const { data: existingUser } = await supabase
    .from('custom_users')
    .select('id')
    .eq('username', username)
    .single();

  if (existingUser) {
    return res.status(400).json({ error: 'Nome de usuário já está em uso.' });
  }

  // 2. Criptografar a senha
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 3. Inserir no banco
  const { data, error } = await supabase
    .from('custom_users')
    .insert([{ username, password: hashedPassword }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Erro ao criar usuário: ' + error.message });
  }

  // 4. Gerar JWT
  const token = jwt.sign({ id: data.id, username: data.username }, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({ user: { id: data.id, username: data.username }, token });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }

  // 1. Buscar usuário no banco
  const { data: user, error } = await supabase
    .from('custom_users')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !user) {
    return res.status(401).json({ error: 'Usuário não encontrado.' });
  }

  // 2. Validar senha
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Senha incorreta.' });
  }

  // 3. Gerar JWT
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

  res.json({ user: { id: user.id, username: user.username }, token });
});

module.exports = router;
