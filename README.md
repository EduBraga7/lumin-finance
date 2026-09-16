# 💡 Lumin Finance — Gestão Financeira & Inteligência Analítica com IA

<p align="center">
  <a href="https://lumin-finance-taupe.vercel.app">
    <img src="https://img.shields.io/badge/Demo_Online-Vercel-black?style=for-the-badge&logo=vercel&logoColor=white" alt="Demo Online" />
  </a>
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google Gemini" />
</p>

O **Lumin Finance** é uma aplicação Full Stack desenvolvida para proporcionar controle orçamentário completo, previsibilidade de caixa e diagnósticos financeiros automatizados através de Inteligência Artificial Generativa.

---

## 🚀 Funcionalidades

- **Dashboard Financeiro Interativo:** Visão unificada de saldo atual, receitas, despesas e taxa de poupança com gráficos interativos via Recharts.
- **Gestão de Transações:** Cadastro, categorização e filtragem avançada por período e tipo de movimentação.
- **Controle de Contas a Pagar e Receber:** Acompanhamento de vencimentos para evitar inadimplência ou multas.
- **Diagnóstico com IA (Google Gemini):** Módulo inteligente que analisa os hábitos de gastos do usuário e sugere planos de contingência e investimentos.
- **Autenticação & Segurança:** Fluxo seguro baseado em JWT e criptografia de senhas com bcryptjs.

---

## 🛠️ Arquitetura & Tecnologias

### **Frontend** (`/frontend`)
- **Next.js & React:** Interface reativa, componentizada e responsiva.
- **Tailwind CSS & Lucide React:** Design moderno e minimalista.
- **Recharts:** Visualização analítica de fluxos de caixa.
- **Supabase Client:** Integração com banco de dados em tempo real.

### **Backend** (`/backend`)
- **Node.js com Express:** API RESTful modular.
- **Supabase / PostgreSQL:** Persistência relacional de dados financeiros.
- **Google Generative AI SDK:** Integração com Gemini AI para análise de dados.
- **JWT & Bcrypt:** Autenticação e autorização por tokens.

---

## 💻 Como Rodar Localmente

### 1. Clonar o repositório
\`\`\`bash
git clone https://github.com/EduBraga7/lumin-finance.git
cd lumin-finance
\`\`\`

### 2. Backend
\`\`\`bash
cd backend
npm install
npm run dev
\`\`\`

### 3. Frontend
\`\`\`bash
cd ../frontend
npm install
npm run dev
\`\`\`

---

Desenvolvido por [Eduardo Braga](https://github.com/EduBraga7).
