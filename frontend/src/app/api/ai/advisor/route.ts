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

    const candidateEndpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`
    ];

    let text = '';
    let lastErrorMsg = '';

    for (const endpointUrl of candidateEndpoints) {
      try {
        const aiRes = await fetch(endpointUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        const data = await aiRes.json();
        if (aiRes.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          text = data.candidates[0].content.parts[0].text;
          break;
        } else if (data?.error?.message) {
          lastErrorMsg = data.error.message;
        }
      } catch (err: any) {
        lastErrorMsg = err?.message || String(err);
      }
    }

    if (!text) {
      throw new Error(lastErrorMsg || 'Não foi possível obter a resposta da IA.');
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

    return NextResponse.json({ error: 'Erro ao gerar conselho com a IA: ' + errMsg }, { status: 500 });
  }
}
