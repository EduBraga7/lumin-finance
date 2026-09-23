"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const SUGGESTED_PROMPTS = [
  'Posso comprar algo de R$ 3.000 em 10x?',
  'Onde posso economizar R$ 500 este mês?',
  'Qual é a minha taxa de poupança atual?',
  'Como montar minha reserva de emergência?',
];

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `Olá! Sou seu Copiloto CFO Virtual. Estou conectado ao seu histórico financeiro e pronto para te ajudar a avaliar compras, planejar metas e otimizar seus gastos.\n\nVocê pode me fazer perguntas diretas ou clicar em uma das sugestões abaixo!`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

// Formatação limpa de Markdown para negrito e listas, eliminando asteriscos soltos
function formatChatMessage(text: string) {
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();
    const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
    const lineToProcess = isBullet ? trimmed.replace(/^[-*]\s+/, '') : line;

    // Divide texto em partes que estavam entre **texto**
    const parts = lineToProcess.split(/(\*\*[^*]+\*\*)/g);

    const renderedLine = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} style={{ fontWeight: 700 }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    if (isBullet) {
      return (
        <div
          key={lineIdx}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.45rem',
            marginTop: '0.25rem',
            lineHeight: 1.5,
          }}
        >
          <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>•</span>
          <span style={{ flex: 1 }}>{renderedLine}</span>
        </div>
      );
    }

    return (
      <div
        key={lineIdx}
        style={{
          minHeight: trimmed === '' ? '0.65rem' : 'auto',
          lineHeight: 1.55,
        }}
      >
        {renderedLine}
      </div>
    );
  });
}

export default function CfoChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([DEFAULT_WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carrega histórico persistido (do Supabase ou localStorage) ao montar
  useEffect(() => {
    if (!user) return;
    let ignore = false;

    async function loadHistory() {
      try {
        const res = await fetch('/api/ai/chat', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
            if (!ignore) {
              const formatted: ChatMessage[] = data.messages.map((m: { id?: string; role: 'user' | 'assistant'; content: string; created_at?: string }, idx: number) => ({
                id: m.id || `hist-${idx}`,
                role: m.role,
                content: m.content,
                timestamp: m.created_at
                  ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '',
              }));
              setMessages(formatted);
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar histórico persistido de chat:', err);
      }
    }

    loadHistory();

    return () => {
      ignore = true;
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: text, history: historyPayload }),
      });

      const data = await res.json();
      const replyContent = data.reply || 'Desculpe, não consegui processar sua consulta no momento.';

      const botMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Ocorreu uma instabilidade na conexão com o copiloto. Tente novamente em instantes.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    try {
      await fetch('/api/ai/chat', { method: 'DELETE', credentials: 'include' });
    } catch {
      // Ignora erro em caso de falha de rede
    }

    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: `Conversa reiniciada. Como posso te auxiliar na sua estratégia financeira agora?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '640px', padding: 0, overflow: 'hidden' }}>
      {/* Cabeçalho do Chat */}
      <div style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255, 255, 255, 0.02)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(59, 130, 246, 0.2))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(16, 185, 129, 0.4)',
          }}>
            <Bot size={20} className="text-accent" />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
              Copiloto CFO
              <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: 4, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-primary)', fontWeight: 600 }}>
                Online
              </span>
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, marginTop: '0.15rem' }}>
              Consultoria executiva contextualizada com suas receitas e despesas
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="btn-secondary"
          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          title="Limpar conversa"
        >
          <RefreshCw size={14} />
          Limpar
        </button>
      </div>

      {/* Sugestões Rápidas */}
      <div style={{
        padding: '0.75rem 1.5rem',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(0, 0, 0, 0.1)',
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
      }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
          <Sparkles size={13} className="text-accent" />
          Sugestões:
        </span>
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSendMessage(prompt)}
            disabled={loading}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 20,
              padding: '0.3rem 0.75rem',
              fontSize: '0.78rem',
              color: 'var(--text-primary)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Área de Mensagens */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              display: 'flex',
              gap: '0.75rem',
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: m.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-surface-hover)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid var(--border-subtle)',
            }}>
              {m.role === 'user' ? <User size={16} color="#fff" /> : <Bot size={16} className="text-accent" />}
            </div>

            <div style={{
              background: m.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-surface)',
              color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
              padding: '0.85rem 1.15rem',
              borderRadius: 14,
              border: m.role === 'user' ? 'none' : '1px solid var(--border-subtle)',
              fontSize: '0.9rem',
              lineHeight: 1.55,
            }}>
              <div>{formatChatMessage(m.content)}</div>
              {m.timestamp && (
                <div style={{
                  fontSize: '0.7rem',
                  opacity: 0.65,
                  marginTop: '0.4rem',
                  textAlign: m.role === 'user' ? 'right' : 'left',
                }}>
                  {m.timestamp}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'flex-start', maxWidth: '80%' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)' }}>
              <Bot size={16} className="text-accent" />
            </div>
            <div style={{ background: 'var(--bg-surface)', padding: '0.85rem 1.15rem', borderRadius: 14, border: '1px solid var(--border-subtle)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Digitando parecer estratégico...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Envio */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '0.75rem',
          background: 'rgba(255, 255, 255, 0.01)',
        }}
      >
        <input
          type="text"
          className="form-input"
          placeholder="Pergunte sobre seus gastos, viabilidade de compras ou metas..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          style={{ flex: 1, margin: 0 }}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="btn-primary"
          style={{
            width: 'auto',
            padding: '0 1.25rem',
            margin: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            opacity: !input.trim() || loading ? 0.6 : 1,
            cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
          }}
        >
          <Send size={16} />
          <span>Enviar</span>
        </button>
      </form>
    </div>
  );
}
