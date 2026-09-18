# 💡 Lumin Finance — Gestão Financeira Inteligente com IA

<p align="center">
  <a href="https://lumin-finance-taupe.vercel.app">
    <img src="https://img.shields.io/badge/Demo_Online-Vercel-black?style=for-the-badge&logo=vercel&logoColor=white" alt="Demo Online" />
  </a>
  <img src="https://img.shields.io/badge/Versão-0.2.1-blue?style=for-the-badge" alt="Versão 0.2.1" />
  <img src="https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google Gemini" />
  <img src="https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA Ready" />
  <img src="https://img.shields.io/badge/Testes-20%20Passando-brightgreen?style=for-the-badge&logo=vitest&logoColor=white" alt="Testes Unitários" />
</p>

O **Lumin Finance** é uma plataforma full-stack moderna e completa de gestão orçamentária pessoal e executiva. Desenvolvido para oferecer controle financeiro com previsibilidade e clareza, o sistema integra **Inteligência Artificial Generativa (Google Gemini)** para diagnósticos em tempo real, relatórios anuais executivos com detalhamento de categorias, lançamento rápido com linguagem natural, suporte offline e arquitetura resiliente a fusos horários.

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
- **Exportação CSV:** Exportação com um clique de lançamentos formatados e seguros.

### 3. 🧠 Lumin AI Advisor (Google Gemini) com Cache Inteligente
- **Diagnóstico Automatizado:** Avaliação do perfil financeiro (Saudável, Atenção ou Crítico), alertas de desvios orçamentários e recomendações táticas personalizadas.
- **Cache Persistente no Banco de Dados (`ai_analyses`):** As análises de cada mês são salvas no banco e reutilizadas. A IA só é acionada novamente se o mês virar ou se o usuário solicitar a atualização expressa ("Atualizar Análise").
- **Histórico e Timestamp:** Exibição clara de quando o último diagnóstico foi gerado.

### 4. 📈 Relatórios Anuais Executivos & Gastos por Categoria
- **Consolidação Anual (2026+):** KPIs de faturamento anual, despesas acumuladas, saldo do exercício e média mensal de economia.
- **Destaques:** Identificação automática do *Mês com Maior Economia* e do *Mês com Mais Gastos*.
- **Demonstrativo Mês a Mês:** Tabela completa com receitas, despesas, saldo líquido e taxa de poupança mensal.
- **Detalhamento Interativo de Gastos por Categoria:** Ao selecionar qualquer categoria de despesa, é exibido o raio-x detalhado de onde o dinheiro foi gasto naquele grupo.

### 5. 📴 PWA & Suporte Offline-First
- **Progressive Web App (PWA):** Instalação nativa em dispositivos móveis e desktop via Service Worker e Web App Manifest.
- **Fila Offline com Sincronização Automática:** Lançamentos criados sem internet são armazenados localmente e sincronizados de forma transparente assim que a conexão é restabelecida.

### 6. 🌐 Tratamento Rigoroso de Fuso Horário (UTC-3 / Brasil)
- Gravação padronizada em meio-dia UTC (`T12:00:00.000Z`), eliminando o problema clássico de recuo de data (-3h em relação a UTC 00:00 resultando no dia anterior).
- Intervalos de consulta seguros cobrindo de `00:00:00.000Z` até `23:59:59.999Z`.

### 7. 🎭 Modo de Demonstração Interativo (Zero-Config para Recrutadores)
- **Acesso com 1 Clique:** Na tela de login, qualquer recrutador ou visitante pode clicar em *"Acessar Demonstração Interativa"* sem precisar criar conta ou digitar credenciais.
- **Dataset Realista Completo:** Carrega automaticamente transações executivas, métricas de saldo, categorização inteligente, fluxo de caixa e diagnóstico analítico da IA sem tocar no banco de dados.
- **Banner Persistente com Botão de Saída:** Faixa indicativa clara de modo demonstração no topo da aplicação com ação instantânea para encerrar e voltar ao login.

---

## 🔐 Segurança

O Lumin Finance adota um modelo de autenticação focado em segurança máxima:

- **Cookie HttpOnly exclusivo:** O JWT de autenticação trafega **apenas** em cookies `HttpOnly; Secure; SameSite=Lax`, nunca sendo exposto ao JavaScript do browser. Isso elimina por completo o risco de roubo de token via XSS.
- **Sem token em `localStorage`:** O `localStorage` armazena somente os dados de exibição do usuário (nome de usuário), nunca o token de sessão.
- **Proxy de autenticação server-side (`src/proxy.ts`):** O Next.js 16 intercepta todas as requisições antes de chegar às páginas — usuários não autenticados são redirecionados para `/login` sem que nenhum componente React seja sequer renderizado.
- **Supabase com Service Role Key:** Todas as queries ao banco passam pelas Route Handlers server-side usando a `SUPABASE_SERVICE_ROLE_KEY`. O cliente Supabase anon nunca chega ao front-end.
- **Role `anon` bloqueada:** Execute o script abaixo no Supabase para impedir acesso direto não autorizado via REST:

```sql
REVOKE ALL ON public.transactions, public.ai_analyses, public.custom_users FROM anon;
```

---

## 🏗️ Arquitetura Clean Code & Full-Stack Unificado

O projeto adota uma arquitetura full-stack monolítica moderna baseada no **Next.js 16 (App Router)** com **Turbopack**, eliminando camadas intermediárias e reduzindo a complexidade de deploy para um único serviço na **Vercel**:

- **Serverless Route Handlers (`src/app/api/`)**: Endpoints de autenticação, transações, relatórios e inteligência artificial rodando na mesma infraestrutura sem necessidade de servidor Express dedicado.
- **Proxy de autenticação (`src/proxy.ts`)**: Guard server-side nativo do Next.js 16 que valida o cookie JWT antes de qualquer renderização.
- **Descentralização dos Componentes ("God Components" eliminados)**: Telas divididas em subcomponentes atômicos com responsabilidade única (`src/components/dashboard`, `src/components/transactions`, `src/components/reports`).
- **Custom Hooks Reutilizáveis**: Lógica de negócio desacoplada da interface via `useTransactions` e `useDashboard`.
- **Single Source of Truth**: Tipos TypeScript centralizados (`src/types/finance.ts`), constantes canônicas (`src/constants/`) e utilitários puros de formatação (`src/utils/formatters.ts`).

---

## 🛠️ Tecnologias Utilizadas

- **Framework Full-Stack:** Next.js 16 (App Router com Turbopack & Route Handlers Serverless) & React 19
- **Linguagem:** TypeScript 5 com verificação estrita de tipos (`tsc --noEmit` sem erros)
- **Estilização & UI:** Tailwind CSS v4, Lucide Icons & Recharts (gráficos dinâmicos)
- **Banco de Dados & Auth:** Supabase (PostgreSQL) com JWT e Bcryptjs
- **Inteligência Artificial:** Google Gemini (`gemini-1.5-flash`, `gemini-2.0-flash`) & OpenRouter API
- **Offline & Mobile:** Progressive Web App (PWA), Service Worker e Fila Local com Sincronização Automática
- **Testes:** Vitest com 20 testes unitários (parsers, formatadores, diagnóstico de IA)
- **Qualidade de Código:** ESLint sem warnings, TypeScript estrito
- **Hospedagem & CI/CD:** Vercel

---

## 🗄️ Esquema do Banco de Dados (Supabase)

Para o correto funcionamento do cache de IA e das transações, execute o script SQL abaixo no **SQL Editor** do seu projeto Supabase:

```sql
-- 1. Tabela de Usuários Customizados (se ainda não tiver)
CREATE TABLE IF NOT EXISTS public.custom_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Transações Financeiras
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    category VARCHAR(50) NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    is_paid BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
    ON public.transactions(user_id, date);

-- 3. Tabela de Cache e Histórico das Análises da IA (Lumin AI Advisor)
CREATE TABLE IF NOT EXISTS public.ai_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    month_key VARCHAR(7), -- Exemplo: '2026-09'
    summary TEXT,
    status VARCHAR(30) DEFAULT 'good',
    status_text VARCHAR(100),
    insights JSONB DEFAULT '[]'::jsonb,
    advice TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Caso a tabela ai_analyses já tenha sido criada anteriormente, assegure todas as colunas:
ALTER TABLE public.ai_analyses ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.ai_analyses ADD COLUMN IF NOT EXISTS month INTEGER;
ALTER TABLE public.ai_analyses ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE public.ai_analyses ADD COLUMN IF NOT EXISTS month_key VARCHAR(7);
ALTER TABLE public.ai_analyses ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.ai_analyses ADD COLUMN IF NOT EXISTS status VARCHAR(30);
ALTER TABLE public.ai_analyses ADD COLUMN IF NOT EXISTS status_text VARCHAR(100);
ALTER TABLE public.ai_analyses ADD COLUMN IF NOT EXISTS insights JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.ai_analyses ADD COLUMN IF NOT EXISTS advice TEXT;
ALTER TABLE public.ai_analyses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Garante que cada usuário possua apenas 1 registro por competência mensal
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_analyses_user_month_year 
    ON public.ai_analyses(user_id, month, year);

-- 4. Blindagem de Segurança (Role anon)
-- Como a validação é gerenciada via Route Handlers com JWT e SUPABASE_SERVICE_ROLE_KEY,
-- revogue o acesso da role anon para impedir requisições diretas não autorizadas via REST:
REVOKE ALL ON public.transactions, public.ai_analyses, public.custom_users FROM anon;
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

### 2. Configurar as Variáveis de Ambiente
Copie o arquivo de exemplo e crie o seu `.env.local`:
```bash
cp .env.example .env.local
```

Preencha as variáveis no `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
JWT_SECRET=seu_jwt_secret_forte_e_seguro
GEMINI_API_KEY=sua_gemini_api_key
```

### 3. Instalar Dependências, Testar e Iniciar
```bash
npm install

# Executar a suíte de testes unitários (Vitest — 20 testes)
npm test

# Verificar tipos TypeScript
npx tsc --noEmit

# Verificar qualidade do código
npm run lint

# Iniciar o servidor de desenvolvimento
npm run dev
```

O aplicativo estará disponível em: `http://localhost:3000`.

---

## 🚀 Deploy na Vercel

O projeto está 100% configurado para deploy automático na Vercel:

1. Importe o repositório [`EduBraga7/lumin-finance`](https://github.com/EduBraga7/lumin-finance) na sua conta Vercel.
2. Certifique-se de que o **Root Directory** esteja configurado como `./` (raiz).
3. Adicione as variáveis de ambiente em **Project Settings > Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `GEMINI_API_KEY`
4. Clique em **Deploy**.

---

## 📁 Estrutura de Diretórios

```text
lumin-finance/
├── public/                        # Ícones PWA, manifest.json e Service Worker
├── src/
│   ├── proxy.ts                   # Guard de autenticação server-side (Next.js 16)
│   ├── app/
│   │   ├── api/                   # Route Handlers serverless (Full-Stack Next.js)
│   │   │   ├── ai/advisor/        # Parecer consultivo com Gemini e cache no DB
│   │   │   ├── auth/              # Login, registro e logout com JWT + cookie HttpOnly
│   │   │   └── transactions/      # CRUD de lançamentos, filtros e yearly
│   │   ├── login/                 # Página de autenticação
│   │   ├── reports/               # Relatório Anual Executivo
│   │   ├── transactions/          # Extrato inteligente e Lançamento Rápido
│   │   ├── layout.tsx             # Root layout com PWA e Providers
│   │   └── page.tsx               # Dashboard Executivo e Lumin AI Advisor
│   ├── components/                # Componentes modulares de UI
│   │   ├── dashboard/             # AiAdvisorCard, CategoryExpenseChart, DrilldownModal
│   │   ├── reports/               # AnnualKpiCards, AnnualCashFlowChart, AnnualSummaryTable
│   │   ├── transactions/          # QuickAddBar, TransactionFilters, Table, Modal, SummaryCards
│   │   ├── AppLayoutWrapper.tsx
│   │   ├── BottomNav.tsx
│   │   ├── MonthSelector.tsx
│   │   ├── OfflineSyncBanner.tsx
│   │   ├── RegisterSW.tsx
│   │   └── Sidebar.tsx
│   ├── constants/                 # Cores de categorias, emojis e meses (Single Source of Truth)
│   ├── context/                   # AuthContext e DateFilterContext
│   ├── hooks/                     # useTransactions e useDashboard (Clean Code Hooks)
│   ├── lib/                       # serverAuth.ts (validação de JWT e Supabase Server)
│   ├── types/                     # Tipos TypeScript centralizados (finance.ts)
│   └── utils/
│       ├── __tests__/             # Testes unitários (Vitest) — 20 testes
│       ├── aiAdvisor.ts           # Diagnóstico financeiro determinístico
│       ├── csvExport.ts
│       ├── formatters.ts
│       ├── offlineQueue.ts        # Fila offline com sync via cookie (sem token exposto)
│       └── quickAddParser.ts      # Parser de linguagem natural
├── .env.example                   # Modelo de variáveis de ambiente
├── next.config.ts                 # Configurações do Next.js
├── package.json                   # Dependências e scripts do projeto
├── tsconfig.json                  # Configuração TypeScript
└── README.md
```

---

## 📄 Licença
Distribuído sob a licença MIT. Consulte `LICENSE` para mais detalhes.

Desenvolvido com excelência por [Eduardo Braga](https://bragaweb.netlify.app/).
