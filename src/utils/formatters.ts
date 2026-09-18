const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatCurrency(val: number): string {
  return currencyFormatter.format(Number.isFinite(val) ? val : 0);
}

export function formatPercentage(val: number, decimals = 1): string {
  const safeVal = Number.isFinite(val) ? val : 0;
  return `${safeVal.toFixed(decimals)}%`;
}

export function formatDateDisplay(dateStr?: string): string {
  if (!dateStr) return '';
  const cleanDate = dateStr.split('T')[0];
  const parts = cleanDate.split('-');
  if (parts.length < 3) return dateStr;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

export function formatInputDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateTimeDisplay(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return '';
  }
}

