export interface ParsedQuickAdd {
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  isValid: boolean;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Alimentação': [
    'almoço', 'almoco', 'jantar', 'café', 'cafe', 'lanche', 'mercado', 'supermercado',
    'ifood', 'restaurante', 'pizza', 'burger', 'hambúrguer', 'padaria', 'feirante',
    'feira', 'churrasco', 'açougue', 'acougue', 'comida', 'bebida', 'bar', 'chopp',
    'cerveja', 'sorvete', 'delivery', 'mcdonalds', 'subway'
  ],
  'Transporte': [
    'uber', '99', 'táxi', 'taxi', 'gasolina', 'combustível', 'combustivel', 'etanol',
    'diesel', 'posto', 'estacionamento', 'pedágio', 'pedagio', 'ônibus', 'onibus',
    'metrô', 'metro', 'passagem', 'mecânico', 'mecanico', 'oficina', 'ipva', 'seguro auto'
  ],
  'Moradia': [
    'aluguel', 'condomínio', 'condominio', 'luz', 'energia', 'água', 'agua', 'gás', 'gas',
    'internet', 'wifi', 'iptu', 'reforma', 'limpeza', 'faxina', 'móvel', 'movel',
    'eletro', 'encanador', 'eletricista'
  ],
  'Lazer': [
    'cinema', 'filme', 'netflix', 'spotify', 'prime', 'disney', 'hbo', 'show', 'show',
    'ingresso', 'teatro', 'jogo', 'game', 'steam', 'playstation', 'xbox', 'praia',
    'viagem', 'passeio', 'hotel', 'pousada', 'parque', 'shopping'
  ],
  'Saúde': [
    'farmácia', 'farmacia', 'remédio', 'remedio', 'drogaria', 'médico', 'medico',
    'consulta', 'exame', 'dentista', 'academia', 'suplemento', 'hospital', 'psicólogo',
    'psicologo', 'terapia', 'ótica', 'otica'
  ],
  'Educação': [
    'curso', 'livro', 'faculdade', 'escola', 'colégio', 'colegio', 'udemy', 'alura',
    'aula', 'mensalidade', 'material escolar', 'treinamento', 'workshop'
  ],
  'Salário': [
    'salário', 'salario', 'adiantamento', 'holerite', 'proventos', 'ordenado'
  ],
  'Rendimentos': [
    'dividendos', 'rendimento', 'rendimentos', 'juros', 'cdi', 'aplicação', 'investimento',
    'lucro', 'freelance', 'bico', 'consultoria'
  ],
  'Vendas': [
    'venda', 'vendas', 'comissão', 'comissao', 'cliente', 'recebi', 'pix recebido'
  ]
};

const INCOME_KEYWORDS = [
  'salário', 'salario', 'recebi', 'pix recebido', 'venda', 'vendas', 'rendimento',
  'rendimentos', 'freelance', 'comissão', 'comissao', 'lucro', 'dividendo', 'dividendos',
  'pagamento recebido', 'ted recebida', 'depósito', 'deposito'
];

export function parseQuickAddInput(
  rawInput: string,
  targetMonth: number,
  targetYear: number
): ParsedQuickAdd {
  const text = rawInput.trim();
  if (!text) {
    return {
      title: '',
      amount: 0,
      type: 'expense',
      category: 'Geral',
      date: getDefaultDate(targetMonth, targetYear),
      isValid: false
    };
  }

  // 1. Extração do Valor Financeiro (ex: R$ 42,50 | 42.50 | 42,00 | 42 reais | 150)
  let amount = 0;
  let textWithoutAmount = text;

  // Regex para capturar padrões numéricos financeiros
  const amountRegex = /(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real|rs)?/i;
  const matchAmount = text.match(amountRegex);

  if (matchAmount) {
    const rawNum = matchAmount[1].replace(',', '.');
    const parsed = parseFloat(rawNum);
    if (!isNaN(parsed) && parsed > 0) {
      amount = parsed;
      // Remove o valor do texto para sobrar o título
      textWithoutAmount = text.replace(matchAmount[0], ' ');
    }
  }

  const lowerText = text.toLowerCase();

  // 2. Extração do Tipo (Receita vs Despesa)
  let type: 'income' | 'expense' = 'expense';
  for (const kw of INCOME_KEYWORDS) {
    if (lowerText.includes(kw)) {
      type = 'income';
      break;
    }
  }

  // 3. Extração da Categoria
  let category = type === 'income' ? 'Salário' : 'Geral';
  let categoryFound = false;

  for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      // Checa se a palavra-chave está no texto
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(lowerText)) {
        category = catName;
        categoryFound = true;
        break;
      }
    }
    if (categoryFound) break;
  }

  // 4. Extração de Data
  let date = getDefaultDate(targetMonth, targetYear);
  const now = new Date();

  if (/\bhoje\b/i.test(lowerText)) {
    date = formatDate(now);
  } else if (/\bontem\b/i.test(lowerText)) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    date = formatDate(yesterday);
  } else if (/\banteontem\b/i.test(lowerText)) {
    const dayBefore = new Date();
    dayBefore.setDate(dayBefore.getDate() - 2);
    date = formatDate(dayBefore);
  } else {
    // Procura por "dia 15" ou "dia 5"
    const matchDay = lowerText.match(/\bdia\s+(\d{1,2})\b/i);
    if (matchDay) {
      const dayNum = parseInt(matchDay[1], 10);
      if (dayNum >= 1 && dayNum <= 31) {
        date = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      }
    }
  }

  // 5. Limpeza e Formatação do Título
  let cleanedTitle = textWithoutAmount
    .replace(/\b(hoje|ontem|anteontem|dia \d{1,2})\b/gi, '')
    .replace(/\b(gastei|comprei|paguei|no|na|de|do|da|com|em|para|reais|real)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Se o título ficou vazio (ex: usuário só digitou "42"), usa a categoria como título
  if (!cleanedTitle) {
    cleanedTitle = category !== 'Geral' ? category : (type === 'income' ? 'Receita' : 'Despesa');
  } else {
    // Capitaliza a primeira letra de cada palavra relevante
    cleanedTitle = cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);
  }

  return {
    title: cleanedTitle,
    amount,
    type,
    category,
    date,
    isValid: amount > 0
  };
}

function getDefaultDate(m: number, y: number): string {
  const now = new Date();
  const isCurrent = (now.getMonth() + 1 === m) && (now.getFullYear() === y);
  const day = isCurrent ? String(now.getDate()).padStart(2, '0') : '01';
  return `${y}-${String(m).padStart(2, '0')}-${day}`;
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
