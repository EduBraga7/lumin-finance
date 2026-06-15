"use client";

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDateFilter } from '@/context/DateFilterContext';

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function MonthSelector() {
  const { month, year, setMonth, setYear } = useDateFilter();

  const handlePrev = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--surface-light)', padding: '0.5rem 1rem', borderRadius: '12px', width: 'fit-content', border: '1px solid var(--border-subtle)' }}>
      <button onClick={handlePrev} className="btn-icon" style={{ background: 'transparent' }}>
        <ChevronLeft size={20} color="var(--text-secondary)" />
      </button>
      <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', minWidth: '120px', textAlign: 'center' }}>
        {months[month - 1]} {year}
      </span>
      <button onClick={handleNext} className="btn-icon" style={{ background: 'transparent' }}>
        <ChevronRight size={20} color="var(--text-secondary)" />
      </button>
    </div>
  );
}
