import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, verifyAuth } from '@/lib/serverAuth';

export async function POST(req: NextRequest) {
  const user = verifyAuth(req);
  if (!user) {
    return NextResponse.json({ error: 'Token inválido ou não fornecido' }, { status: 401 });
  }

  try {
    const {
      incomeChangePercent = 0,
      newRecurringExpense = 0,
      purchaseAmount = 0,
      installments = 1,
      emergencyFund = 0,
    } = await req.json();

    // 1. Obter histórico dos últimos lançamentos para média mensal
    const now = new Date();
    const currentYear = now.getFullYear();

    const { data: transactions } = await supabaseServer
      .from('transactions')
      .select('amount, type, date')
      .eq('user_id', user.id)
      .gte('date', `${currentYear}-01-01T00:00:00.000Z`)
      .lte('date', `${currentYear}-12-31T23:59:59.999Z`);

    let totalIncome = 0;
    let totalExpense = 0;

    (transactions || []).forEach((t) => {
      const val = parseFloat(String(t.amount)) || 0;
      if (t.type === 'income') totalIncome += val;
      else totalExpense += val;
    });

    const activeMonths = Math.max(1, now.getMonth() + 1);
    const avgMonthlyIncome = totalIncome > 0 ? totalIncome / activeMonths : 5000;
    const avgMonthlyExpense = totalExpense > 0 ? totalExpense / activeMonths : 3500;
    const baselineBalance = avgMonthlyIncome - avgMonthlyExpense;

    // 2. Simular os próximos 12 meses
    const parsedIncomeChange = Number(incomeChangePercent) || 0;
    const parsedNewRecurring = Math.max(0, Number(newRecurringExpense) || 0);
    const parsedPurchase = Math.max(0, Number(purchaseAmount) || 0);
    const parsedInstallments = Math.max(1, Math.min(24, Number(installments) || 1));
    const monthlyInstallment = parsedPurchase > 0 ? parsedPurchase / parsedInstallments : 0;
    let simulatedEmergencyFund = Math.max(0, Number(emergencyFund) || 0);

    const simulatedIncome = avgMonthlyIncome * (1 + parsedIncomeChange / 100);
    const simulatedBaseExpense = avgMonthlyExpense + parsedNewRecurring;

    const projection = [];
    const MONTH_LABELS = ['Mês 1', 'Mês 2', 'Mês 3', 'Mês 4', 'Mês 5', 'Mês 6', 'Mês 7', 'Mês 8', 'Mês 9', 'Mês 10', 'Mês 11', 'Mês 12'];

    let lowestProjectedFund = simulatedEmergencyFund;

    for (let i = 0; i < 12; i++) {
      const installmentThisMonth = i < parsedInstallments ? monthlyInstallment : 0;
      const monthExpense = simulatedBaseExpense + installmentThisMonth;
      const monthBalance = simulatedIncome - monthExpense;

      simulatedEmergencyFund += monthBalance;
      if (simulatedEmergencyFund < lowestProjectedFund) {
        lowestProjectedFund = simulatedEmergencyFund;
      }

      projection.push({
        month: MONTH_LABELS[i],
        baselineBalance: Math.round(baselineBalance),
        simulatedBalance: Math.round(monthBalance),
        simulatedIncome: Math.round(simulatedIncome),
        simulatedExpense: Math.round(monthExpense),
        projectedReserve: Math.round(Math.max(0, simulatedEmergencyFund)),
      });
    }

    const firstMonthSimulatedBalance = simulatedIncome - (simulatedBaseExpense + monthlyInstallment);
    const newSavingsRate = simulatedIncome > 0 ? Math.max(0, (firstMonthSimulatedBalance / simulatedIncome) * 100) : 0;

    // 3. Determinar nível de risco
    let riskLevel: 'low' | 'moderate' | 'high' = 'low';
    if (firstMonthSimulatedBalance < 0 || lowestProjectedFund < 0) {
      riskLevel = 'high';
    } else if (newSavingsRate < 15 || lowestProjectedFund < avgMonthlyExpense * 2) {
      riskLevel = 'moderate';
    }

    // 4. Parecer Executivo emitido pelo Gemini
    const rawOpenRouterKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
    const rawGeminiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      '';
    const openRouterKey = rawOpenRouterKey.trim().replace(/^["']|["']$/g, '');
    const geminiKey = rawGeminiKey.trim().replace(/^["']|["']$/g, '');

    const prompt = `
Você é o CFO Consultor de Elite do Lumin Finance avaliando uma simulação financeira de um cliente (@${user.username}).

PARÂMETROS DA SIMULAÇÃO:
- Renda Média Atual: R$ ${avgMonthlyIncome.toFixed(2)}
- Despesa Média Atual: R$ ${avgMonthlyExpense.toFixed(2)}
- Variação de Renda Simulada: ${parsedIncomeChange >= 0 ? '+' : ''}${parsedIncomeChange}% (Nova Renda: R$ ${simulatedIncome.toFixed(2)})
- Nova Despesa Fixa Recorrente: R$ ${parsedNewRecurring.toFixed(2)} / mês
- Nova Compra Planejada: R$ ${parsedPurchase.toFixed(2)} em ${parsedInstallments}x de R$ ${monthlyInstallment.toFixed(2)}
- Novo Saldo Líquido no 1º Mês: R$ ${firstMonthSimulatedBalance.toFixed(2)}
- Nova Taxa de Poupança: ${newSavingsRate.toFixed(1)}%
- Classificação de Risco do Algoritmo: ${riskLevel === 'low' ? 'BAIXO RISCO (Seguro)' : riskLevel === 'moderate' ? 'RISCO MODERADO (Atenção)' : 'ALTO RISCO (Alerta Crítico)'}

RESPONDA COM UM PARECER EXECUTIVO DIRETO E PRAGMÁTICO (Máximo 2 parágrafos curtos):
1. Diga com clareza se o plano é financeiramente viável ou perigoso.
2. Dê 1 recomendação tática imediata (ex: cortar outra área, renegociar parcelamento, ou aprovar com tranquilidade).
`;

    let opinion = '';

    if (openRouterKey.startsWith('sk-or-')) {
      try {
        const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.0-flash-lite-001',
            messages: [{ role: 'user', content: prompt }],
          }),
        });
        const aiData = await aiRes.json();
        opinion = aiData?.choices?.[0]?.message?.content || '';
      } catch (err) {
        console.warn('Erro ao chamar OpenRouter para simulação:', err);
      }
    } else if (geminiKey) {
      try {
        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          }
        );
        const aiData = await aiRes.json();
        opinion = aiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } catch (err) {
        console.warn('Erro ao chamar Gemini para simulação:', err);
      }
    }

    if (!opinion) {
      if (riskLevel === 'high') {
        opinion = `**Atenção Crítica:** Esse cenário leva a um fluxo de caixa negativo de **R$ ${Math.abs(firstMonthSimulatedBalance).toFixed(2)}/mês** durante o período do parcelamento. Não recomendamos prosseguir sem antes reduzir o valor da aquisição ou aumentar o prazo de parcelamento.`;
      } else if (riskLevel === 'moderate') {
        opinion = `**Cenário Viável com Monitoramento:** Seu saldo permanecerá positivo em **R$ ${firstMonthSimulatedBalance.toFixed(2)}/mês**, mas sua capacidade de poupança cairá para **${newSavingsRate.toFixed(1)}%**. É recomendável cortar pequenos excessos discricionários durante as parcelas.`;
      } else {
        opinion = `**Cenário Saudável e Aprovado:** Sua nova capacidade orçamentária absorve perfeitamente os novos compromissos, mantendo um saldo livre de **R$ ${firstMonthSimulatedBalance.toFixed(2)}/mês** e taxa de poupança em **${newSavingsRate.toFixed(1)}%**.`;
      }
    }

    return NextResponse.json({
      baseline: {
        income: avgMonthlyIncome,
        expense: avgMonthlyExpense,
        balance: baselineBalance,
      },
      simulated: {
        income: simulatedIncome,
        expense: simulatedBaseExpense + monthlyInstallment,
        balance: firstMonthSimulatedBalance,
        savingsRate: newSavingsRate,
      },
      projection,
      riskLevel,
      opinion,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao processar simulação';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
