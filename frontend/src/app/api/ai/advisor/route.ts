import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseServer, verifyAuth } from '@/lib/serverAuth';

// GET /api/ai/advisor
export async function GET(req: NextRequest) {
  const user = verifyAuth(req);
  if (!user) return NextResponse.json({ error: 'Token inválido ou não fornecido' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!month || !year) {
      return NextResponse.json({ error: 'Mês e ano são obrigatórios.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'A chave da API do Gemini (GEMINI_API_KEY) não está configurada no servidor.' }, { status: 503 });
    }

    const m = parseInt(month);
    const y = parseInt(year);
    const startDate = new Date(y, m - 1, 1).toISOString();
    const endDate = new Date(y, m, 0, 23, 59, 59, 999).toISOString();

    const { data: transactions, error } = await supabaseServer
      .from('transactions')
      .select('amount, type, category, title, date')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    let totalIncome = 0;
    let totalExpense = 0;
    const expenseByCategory: Record<string, number> = {};

    transactions.forEach((t: any) => {
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ advice: text });
  } catch (error: any) {
    console.error('Erro na API de IA:', error);
    return NextResponse.json({ error: 'Erro ao gerar conselho com a IA.' }, { status: 500 });
  }
}
