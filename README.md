# 💡 Lumin Finance — Gestão Financeira Inteligente com IA

<p align="center">
  <a href="https://lumin-finance-taupe.vercel.app">
    <img src="https://img.shields.io/badge/Demo_Online-Vercel-black?style=for-the-badge&logo=vercel&logoColor=white" alt="Demo Online" />
  </a>
  <img src="https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google Gemini" />
</p>

O **Lumin Finance** é uma plataforma moderna e completa de gestão orçamentária pessoal e executiva. Desenvolvido para oferecer controle financeiro com previsibilidade e clareza, o sistema integra **Inteligência Artificial Generativa (Google Gemini)** para diagnósticos em tempo real, relatórios anuais executivos com detalhamento de categorias, lançamento rápido com linguagem natural e arquitetura resiliente a fusos horários.

---

## ✨ Funcionalidades Principais

### 1. 📊 Dashboard Executivo e Financeiro
- **Visão Geral Instantânea:** Acompanhamento de Saldo Total, Entradas, Saídas e Taxa de Poupança do mês.
- **Gráficos Dinâmicos:** Comparativo de fluxo de caixa mensal e distribuição de despesas por categoria via Recharts.
- **Seletor de Período Global:** Navegação ágil entre meses e anos com atualização em cascata em todos os componentes.

### 2. ⚡ Extrato Inteligente & Lançamento Rápido
- **Layout Full-Width Otimizado:** Visualização executiva em largura completa, eliminando poluição visual.
- **Métricas do Mês Filtrado:** 4 cards com resumo analítico (Receitas, Despesas, Saldo Líquido e % de Economia).
- **Lançamento Rápido em Linguagem Natural:** Barra de entrada de texto que interpreta automaticamente o que você digita.
  > *Exemplos aceitos:*  
  > `Almoço com a equipe 65 alimentacao hoje`  
  > `Salário mensal 6500 dia 5`  
  > `Uber para o aeroporto 42 ontem`
- **Preenchimento e Alerta de Data Inteligente:**
  - O modal de novo lançamento pré-preenche a data de acordo com o mês selecionado no filtro.
  - Alerta visual preventivo quando a data escolhida difere do mês em exibição.
- **Filtros e Busca em Tempo Real:** Pesquisa instantânea por descrição e filtro por tipo (*Todas, Receitas, Despesas*) e categorias.

### 3. 🧠 Lumin AI Advisor (Google Gemini) com Cache Inteligente
- **Diagnóstico Automatizado:** Avaliação do perfil financeiro (Saudável, Atenção ou Crítico), alertas de desvios orçamentários e recomendações táticas personalizadas.
- **Cache Persistente no Banco de Dados (`ai_analyses`):** As análises de cada mês são salvas no banco e reutilizadas. A IA só é acionada novamente se o mês virar ou se o usuário solicitar a atualização expressa ("Atualizar Análise").
- **Histórico e Timestamp:** Exibição clara de quando o último diagnóstico foi gerado.

### 4. 📈 Relatórios Anuais Executivos & Gastos por Categoria
- **Consolidação Anual (2026+):** KPIs de faturamento anual, despesas acumuladas, saldo do exercício e média mensal de economia.
- **Destaques:** Identificação automática do *Mês com Maior Economia* e do *Mês com Mais Gastos*.
- **Demonstrativo Mês a Mês:** Tabela completa com receitas, despesas, saldo líquido e taxa de poupança mensal.
- **Detalhamento Interativo de Gastos por Categoria:** Ao selecionar qualquer categoria de despesa, é exibido o raio-x detalhado de onde o dinheiro foi gasto naquele grupo.

### 5. 🌐 Tratamento Rigoroso de Fuso Horário (UTC-3 / Brasil)
- Gravação padronizada em meio-dia UTC (`T12:00:00.000Z`), eliminando o problema clássico de recuo de data (-3h em relação a UTC 00:00 resultando no dia anterior).
- Intervalos de consulta seguros cobrindo de `00:00:00.000Z` até `23:59:59.999Z`.

---

## 🛠️ Tecnologias Utilizadas

### **Frontend** (`/frontend`)
- **Framework:** Next.js 16 (App Router com Turbopack) & React 19
- **Estilização:** Tailwind CSS & Lucide Icons
- **Gráficos:** Recharts
- **Persistência de Sessão:** Context API com Supabase Auth & JWT

### **Backend** (`/backend`)
- **Runtime:** Node.js com Express
- **Banco de Dados:** Supabase (PostgreSQL)
- **IA Generativa:** Google Generative AI (`@google/genai` e Gemini Pro/Flash)
- **Segurança:** Bcryptjs e JsonWebToken

---

## 🗄️ Esquema do Banco de Dados (Supabase)

Para o correto funcionamento do cache de IA e das transações, execute o script SQL abaixo no **SQL Editor** do seu projeto Supabase:

```sql
-- 1. Tabela de Transações Financeiras
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    category VARCHAR(50) NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para alta performance de consulta
CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
    ON public.transactions(user_id, date);

-- 2. Tabela de Cache de Análises da IA (Lumin AI Advisor)
CREATE TABLE IF NOT EXISTS public.ai_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month_key VARCHAR(7) NOT NULL, -- Exemplo: '2026-09'
    summary TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Saudável',
    alerts JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    metrics JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_month_analysis UNIQUE (user_id, month_key)
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso (RLS) para Transactions
CREATE POLICY "Usuários gerenciam suas transações"
    ON public.transactions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Políticas de Acesso (RLS) para AI Analyses
CREATE POLICY "Usuários gerenciam suas análises de IA"
    ON public.ai_analyses
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

---

## 💻 Como Rodar o Projeto Localmente

### Pré-requisitos
- Node.js 18+ instalado
- Conta no [Supabase](https://supabase.com)
- Chave de API do [Google AI Studio](https://aistudio.google.com/) (Gemini API)

### 1. Clonar o Repositório
```bash
git clone https://github.com/EduBraga7/lumin-finance.git
cd lumin-finance
```

### 2. Configurar o Backend
Crie um arquivo `backend/.env` com as seguintes variáveis:
```env
PORT=3001
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
JWT_SECRET=seu_jwt_secret_seguro
GEMINI_API_KEY=sua_gemini_api_key
```

Instale as dependências e inicie o backend:
```bash
cd backend
npm install
npm run dev
```

### 3. Configurar o Frontend
Crie um arquivo `frontend/.env.local` com as seguintes variáveis:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001/api
GEMINI_API_KEY=sua_gemini_api_key
```

Instale as dependências e inicie o frontend:
```bash
cd ../frontend
npm install
npm run dev
```

O aplicativo estará disponível em: `http://localhost:3000`.

---

## 📁 Estrutura de Diretórios

```text
lumin-finance/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── ai.js              # Rota com Gemini AI e cache no ai_analyses
│   │   │   ├── auth.js            # Cadastro e login JWT
│   │   │   └── transactions.js    # CRUD de transações e dashboards
│   │   ├── index.js               # Entrada do servidor Express
│   │   └── supabase.js            # Cliente Supabase com Service Role
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/               # Next.js API Routes (rotas serverless e fallbacks)
│   │   │   ├── login/             # Tela de login e cadastro
│   │   │   ├── reports/           # Relatório Anual Executivo e Drill-down de categorias
│   │   │   ├── transactions/      # Extrato inteligente e Lançamento Rápido
│   │   │   ├── layout.tsx         # Layout raiz com Sidebar e BottomNav
│   │   │   └── page.tsx           # Dashboard Principal e Card da IA
│   │   ├── components/            # Sidebar, BottomNav, MonthSelector, etc.
│   │   ├── context/               # AuthContext para sessão e autenticação
│   │   ├── utils/
│   │   │   ├── aiAdvisor.ts       # Algoritmo de diagnóstico e interfaces de IA
│   │   │   └── quickAddParser.ts  # Parser de linguagem natural para lançamentos
│   │   └── lib/                   # Supabase client helpers
│   └── package.json
└── README.md
```

---

## 📄 Licença
Distribuído sob a licença MIT. Consulte `LICENSE` para mais detalhes.

Desenvolvido com excelência por [Eduardo Braga](https://github.com/EduBraga7).
