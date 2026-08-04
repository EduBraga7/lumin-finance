const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permite requisições sem origem (ex: apps mobile ou curl) ou origens na lista permitida
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // em dev pode flexibilizar ou restringir conforme necessário
    }
  },
  credentials: true
}));
app.use(express.json());

// Basic Route to test
app.get('/', (req, res) => {
  res.json({ message: 'Lumin Finance API is running!' });
});

// Routes
const transactionsRoutes = require('./routes/transactions');
const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/ai', aiRoutes);


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
