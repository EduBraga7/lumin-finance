export interface AiInsight {
  type: 'positive' | 'warning' | 'tip';
  title: string;
  description: string;
  badge?: string;
}

export interface AiDiagnosis {
  status: 'excellent' | 'good' | 'warning' | 'critical';
  statusText: string;
  summary: string;
  aiAdviceText?: string;
  updatedAt?: string;
  cached?: boolean;
  insights: AiInsight[];
  metrics?: {
    savingsRate: number;
    runwayMonths: number;
    humanCapitalInvestment: number;
    projectedWealth12m: number;
    projectedMonthlyPassiveIncome: number;
  };
}

export type CategoryNature = 'human_capital' | 'essential' | 'lifestyle' | 'financial';

export function getCategoryNature(categoryName: string): CategoryNature {
  const norm = (categoryName || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // 1. Investimento em Capital Humano & Futuro (NUNCA sugerir corte!)
  if (/educaca|curso|livro|faculdade|estudo|idioma|capacit|pos-grad|treina|workshop|mentoria|escola/.test(norm)) {
    return 'human_capital';
  }

  // 2. Despesas Essenciais / Saúde / Sobrevivência
  if (/saude|medic|remedio|farmacia|consulta|hospital|plano de saude|terapia|psicolog|moradia|aluguel|condominio|iptu|energia|luz|agua|gas|internet|supermercado|alimentacao|mercado|feira|transporte|combustivel|metro|onibus|uber/.test(norm)) {
    return 'essential';
  }

  // 3. Compromissos Financeiros / Patrimônio
  if (/invest|reserva|poupanca|previdencia|seguro|emprestimo|financiamento|fatura|divida|imposto|tributo/.test(norm)) {
    return 'financial';
  }

  // 4. Estilo de Vida & Discricionários (Lazer, restaurantes, compras, delivery)
  return 'lifestyle';
}

export function generateAiDiagnosisFromData(
  dash: { totalIncome: number; totalExpense: number; balance: number; expensesByCategory: Record<string, number> },
  month: number,
  year: number
): AiDiagnosis {
  const { totalIncome = 0, totalExpense = 0, balance = 0, expensesByCategory = {} } = dash;

  const MONTH_NAMES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const monthName = MONTH_NAMES[month - 1];

  const fmt = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (totalIncome === 0 && totalExpense === 0) {
    return {
      status: 'warning',
      statusText: 'Sem Movimentações',
      summary: `Nenhuma movimentação registrada em ${monthName} de ${year}. Cadastre suas primeiras receitas e despesas no Extrato para desbloquear a inteligência preditiva.`,
      insights: [
        {
          type: 'tip',
          title: 'Primeiros Passos Financeiros',
          description: 'Cadastre sua principal fonte de receita e seus custos fixos mensais para ativarmos o cálculo de autonomia e projeção patrimonial.'
        }
      ]
    };
  }

  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : (balance >= 0 ? 100 : -100);

  // Classificação semântica dos gastos
  let humanCapitalTotal = 0;
  let essentialTotal = 0;
  let lifestyleTotal = 0;

  const safeExpenses = expensesByCategory || {};
  Object.entries(safeExpenses).forEach(([cat, amount]) => {
    const val = Number(amount) || 0;
    const nature = getCategoryNature(cat);
    if (nature === 'human_capital') humanCapitalTotal += val;
    else if (nature === 'essential') essentialTotal += val;
    else if (nature === 'lifestyle') lifestyleTotal += val;
    else essentialTotal += val;
  });

  // Autonomia financeira (quantos meses de custo de vida a sobra banca)
  const runwayMonths = totalExpense > 0 && balance > 0 ? (balance / totalExpense) : 0;

  // Projeção a 12 meses com aportes regulares a 100% CDI (~10.5% ao ano)
  // Fórmula de anuidade futura: FV = PMT * [((1 + i)^n - 1) / i]
  const monthlyRate = 0.105 / 12; // ~0.875% ao mês
  let projectedWealth12m = 0;
  let projectedMonthlyPassive = 0;

  if (balance > 0) {
    const n = 12;
    projectedWealth12m = balance * ((Math.pow(1 + monthlyRate, n) - 1) / monthlyRate);
    projectedMonthlyPassive = projectedWealth12m * monthlyRate;
  }

  // Definição de Status
  let status: 'excellent' | 'good' | 'warning' | 'critical' = 'good';
  let statusText = 'Orçamento Equilibrado';

  if (balance < 0) {
    status = 'critical';
    statusText = 'Déficit no Período';
  } else if (savingsRate >= 30) {
    status = 'excellent';
    statusText = 'Poupança de Alto Nível';
  } else if (savingsRate >= 15) {
    status = 'good';
    statusText = 'Orçamento Saudável';
  } else {
    status = 'warning';
    statusText = 'Margem de Segurança Estreita';
  }

  const insights: AiInsight[] = [];

  // Insight 1: Autonomia & Runway
  if (balance > 0) {
    insights.push({
      type: 'positive',
      title: `Autonomia: +${runwayMonths.toFixed(1)} meses de custo de vida`,
      description: `O excedente deste mês (${fmt(balance)}) banca sozinho ${runwayMonths.toFixed(1)}x todo o seu custo de vida atual (${fmt(totalExpense)}). Você está construindo uma barreira de segurança sólida contra imprevistos.`
    });
  } else {
    insights.push({
      type: 'warning',
      title: 'Alerta de Queima de Caixa',
      description: `O mês fechou com déficit de ${fmt(Math.abs(balance))}. Para evitar o uso de limites caros, identifique e congele compras discricionárias de estilo de vida nos próximos 30 dias.`
    });
  }

  // Insight 2: Investimento em Capital Humano vs Estilo de Vida
  if (humanCapitalTotal > 0) {
    const hcPctIncome = totalIncome > 0 ? ((humanCapitalTotal / totalIncome) * 100) : 0;
    insights.push({
      type: 'positive',
      title: `Aporte em Capital Humano (${fmt(humanCapitalTotal)})`,
      description: `Você direcionou ${hcPctIncome.toFixed(1)}% da sua renda em Educação e desenvolvimento pessoal. Este é o ativo de maior taxa de retorno comprovada no longo prazo. Mantenha o foco em alavancar seu poder de ganho.`
    });
  } else if (lifestyleTotal > 0 && totalExpense > 0 && (lifestyleTotal / totalExpense) > 0.35) {
    const lifePct = ((lifestyleTotal / totalExpense) * 100).toFixed(0);
    insights.push({
      type: 'warning',
      title: `Atenção a Gastos de Estilo de Vida (${lifePct}%)`,
      description: `Categorias discricionárias (Lazer, Delivery, Compras) consumiram ${fmt(lifestyleTotal)}. Pequenos ajustes conscientes aqui podem acelerar significativamente seus aportes de investimento.`
    });
  } else {
    const essPct = totalIncome > 0 ? ((essentialTotal / totalIncome) * 100).toFixed(0) : '0';
    insights.push({
      type: 'tip',
      title: 'Estrutura de Custos Essenciais',
      description: `Seus gastos essenciais consumiram ${essPct}% da sua receita. Manter o custo de vida fixo controlado é a chave que permite ter flexibilidade e paz mental financeira.`
    });
  }

  // Insight 3: Projeção de Juros Compostos (Renda Passiva Futura)
  if (balance > 0) {
    insights.push({
      type: 'tip',
      title: `Projeção 12 Meses: ${fmt(projectedWealth12m)}`,
      description: `Mantendo aportes mensais de ${fmt(balance)} a 100% CDI (~10,5% a.a.), você acumulará ${fmt(projectedWealth12m)} em 1 ano, gerando aproximadamente ${fmt(projectedMonthlyPassive)}/mês de renda passiva sem precisar trabalhar.`
    });
  } else {
    insights.push({
      type: 'tip',
      title: 'Recuperação de Capacidade de Aporte',
      description: 'Reestruture seus gastos variáveis para voltar a ter saldo positivo. Mesmo pequenos aportes mensais ativam a bola de neve dos juros compostos a seu favor.'
    });
  }

  // Parecer Consultivo Estratégico (Sem ficar repetindo aritmética óbvia que já tá nos cards)
  let strategicAdvice = '';

  if (balance > 0 && savingsRate >= 30) {
    const reserveTarget = totalExpense * 6;
    strategicAdvice = `Sua saúde financeira está em nível de excelência, retendo ${savingsRate.toFixed(1)}% de margem livre e mantendo um custo de vida enxuto. ${humanCapitalTotal > 0 ? `O destaque positivo foi priorizar seu desenvolvimento (Educação - ${fmt(humanCapitalTotal)}) sem desbalancear as contas.` : ''}\n\nDiretriz estratégica para o excedente de ${fmt(balance)}:\n1. Caso ainda não tenha montado sua Reserva de Emergência (meta: ${fmt(reserveTarget)}, equivalente a 6 meses de despesas), direcione 100% do saldo para Tesouro Selic ou CDB com liquidez diária.\n2. Se sua reserva já estiver completa, é hora de diversificar parte dos novos aportes em ativos com proteção contra a inflação (IPCA+) para multiplicar seu patrimônio no médio e longo prazo.`;
  } else if (balance > 0) {
    strategicAdvice = `Seu fluxo de caixa encerrou no azul com taxa de poupança positiva de ${savingsRate.toFixed(1)}%. Você tem fôlego orçamentário para manter a estabilidade.\n\nPróximo passo recomendado: Estabeleça a meta de automatizar uma transferência de pelo menos 20% da sua receita para sua conta de investimentos logo no dia que o pagamento cair, garantindo consistência patrimonial mês após mês.`;
  } else {
    strategicAdvice = `O fechamento do mês indicou que as saídas superaram a renda em ${fmt(Math.abs(balance))}. Isso não é motivo para pânico, mas exige ajuste preventivo de rota.\n\nPlano tático:\n1. Faça uma varredura nas assinaturas e gastos de conveniência/delivery nos próximos 15 dias.\n2. Não parcele novas compras em cartões enquanto o fluxo de caixa mensal não voltar a fechar com folga positiva.`;
  }

  const summary = balance >= 0
    ? `Excelente disciplina orçamentária: você reteve ${savingsRate.toFixed(1)}% dos seus ganhos em ${monthName} de ${year}, gerando ${fmt(balance)} em liquidez livre.`
    : `Atenção ao fluxo de caixa: suas despesas superaram as entradas em ${fmt(Math.abs(balance))} em ${monthName} de ${year}.`;

  return {
    status,
    statusText,
    summary,
    aiAdviceText: strategicAdvice,
    insights,
    metrics: {
      savingsRate,
      runwayMonths,
      humanCapitalInvestment: humanCapitalTotal,
      projectedWealth12m,
      projectedMonthlyPassiveIncome: projectedMonthlyPassive
    }
  };
}
