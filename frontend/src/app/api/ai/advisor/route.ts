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

    const rawKey = process.env.GEMINI_API_KEY || '';
    const apiKey = rawKey.trim().replace(/^["']|["']$/g, '');

    if (!apiKey) {
      return NextResponse.json({ error: 'A chave da API do Gemini (GEMINI_API_KEY) não está configurada no servidor.' }, { status: 503 });
    }

    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const lastDay = new Date(y, m, 0).getDate();
    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`;

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
    const candidateModels = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro-latest',
      'gemini-1.5-pro',
      'gemini-pro'
    ];
    let text = '';
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        text = response.text();
        if (text) break;
      } catch (err: any) {
        console.warn(`[Frontend API IA] Tentativa com modelo ${modelName} falhou:`, err?.message || err);
        lastError = err;
      }
    }

    if (!text && lastError) {
      throw lastError;
    }

    return NextResponse.json({ advice: text });
  } catch (error: any) {
    console.error('Erro na API de IA (frontend):', error);
    const errMsg = error?.message || String(error);

    if (error?.status === 429 || errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json({ 
        error: 'Limite de chamadas da IA atingido temporariamente. Por favor, aguarde cerca de 30 segundos e tente novamente.' 
      }, { status: 429 });
    }

    if (errMsg.includes('404') || errMsg.includes('not found')) {
      return NextResponse.json({ 
        error: 'Sua chave GEMINI_API_KEY não foi encontrada ou é inválida (404). Por favor, crie uma chave gratuita em aistudio.google.com e atualize na Vercel.' 
      }, { status: 404 });
    }

    return NextResponse.json({ error: 'Erro ao gerar conselho com a IA: ' + errMsg }, { status: 500 });
  }
}
