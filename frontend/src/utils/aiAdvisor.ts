export interface AiDiagnosis {
  status: 'excellent' | 'good' | 'warning' | 'critical';
  statusText: string;
  summary: string;
  aiAdviceText?: string;
  updatedAt?: string;
  cached?: boolean;
  insights: Array<{
    type: 'positive' | 'warning' | 'tip';
    title: string;
    description: string;
  }>;
}

export function generateAiDiagnosisFromData(
  dash: { totalIncome: number; totalExpense: number; balance: number; expensesByCategory: Record<string, number> },
  month: number,
  year: number
): AiDiagnosis {
  const { totalIncome, totalExpense, balance, expensesByCategory } = dash;

  const MONTH_NAMES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const monthName = MONTH_NAMES[month - 1];

  if (totalIncome === 0 && totalExpense === 0) {
    return {
      status: 'warning',
      statusText: 'Sem Movimentações',
      summary: `Ainda não identifiquei movimentações financeiras em ${monthName} de ${year}. Adicione alguns lançamentos para que eu possa gerar o diagnóstico completo de seus hábitos!`,
      insights: [
        {
          type: 'tip',
          title: 'Primeiros Passos',
          description: 'Cadastre sua principal fonte de renda e despesas fixas para liberar análises preditivas.'
        }
      ]
    };
  }

  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : -100;

  // Encontra as 2 maiores categorias de gastos
  const sortedCategories = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a);

  const topCategory = sortedCategories[0];
  const secondCategory = sortedCategories[1];

  const topCatPct = totalExpense > 0 && topCategory ? ((topCategory[1] / totalExpense) * 100) : 0;

  let status: 'excellent' | 'good' | 'warning' | 'critical' = 'good';
  let statusText = 'Orçamento Equilibrado';

  if (balance < 0) {
    status = 'critical';
    statusText = 'Déficit no Período';
  } else if (savingsRate >= 25) {
    status = 'excellent';
    statusText = 'Saúde Financeira Excelente';
  } else if (savingsRate < 10) {
    status = 'warning';
    statusText = 'Atenção com Margem de Segurança';
  }

  const fmt = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const insights: Array<{ type: 'positive' | 'warning' | 'tip'; title: string; description: string }> = [];

  // Insight 1: Taxa de Poupança & Fluxo
  if (balance >= 0) {
    insights.push({
      type: 'positive',
      title: `Capacidade de Aporte em ${savingsRate.toFixed(1)}%`,
      description: `Você conseguiu reter ${fmt(balance)} neste mês (${savingsRate.toFixed(1)}% dos seus ganhos totais). Esse excedente está pronto para ser direcionado para reservas ou investimentos.`
    });
  } else {
    insights.push({
      type: 'warning',
      title: 'Despesas Superaram as Receitas',
      description: `Seu caixa fechou o mês negativo em ${fmt(Math.abs(balance))}. É crucial identificar custos variáveis para reequilibrar o fluxo antes do fechamento das próximas faturas.`
    });
  }

  // Insight 2: Concentração de Gastos
  if (topCategory) {
    if (topCatPct > 40) {
      insights.push({
        type: 'warning',
        title: `Alta Concentração em ${topCategory[0]} (${topCatPct.toFixed(0)}%)`,
        description: `A categoria ${topCategory[0]} consumiu ${fmt(topCategory[1])}, representando quase metade do total gasto. Avalie se esse peso é recorrente ou sazonal.`
      });
    } else {
      insights.push({
        type: 'tip',
        title: `Maior Linha de Custo: ${topCategory[0]}`,
        description: `Seu principal compromisso financeiro foi ${topCategory[0]} com ${fmt(topCategory[1])} (${topCatPct.toFixed(0)}% do total), um nível proporcionalmente saudável.`
      });
    }
  }

  // Insight 3: Dica Prática de Economia
  if (secondCategory) {
    insights.push({
      type: 'tip',
      title: `Oportunidade de Otimização em ${secondCategory[0]}`,
      description: `Se você reduzir apenas 15% nos desembolsos com ${secondCategory[0]} (economizando ${fmt(secondCategory[1] * 0.15)}), seu saldo livre ao fim do mês aumentaria consideravelmente.`
    });
  } else {
    insights.push({
      type: 'tip',
      title: 'Diversificação de Despesas',
      description: 'Continue categorizando seus lançamentos para que a IA consiga identificar oportunidades invisíveis de corte.'
    });
  }

  return {
    status,
    statusText,
    summary: `Análise consolidada de ${monthName}/${year}: Você registrou ${fmt(totalIncome)} em receitas e ${fmt(totalExpense)} em despesas, resultando em um saldo ${balance >= 0 ? 'positivo de ' + fmt(balance) : 'negativo de ' + fmt(balance)}.`,
    insights
  };
}
