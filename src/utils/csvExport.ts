import { Transaction } from '@/types/finance';

export function exportTransactionsToCsv(
  transactions: Transaction[],
  month: number,
  year: number
): boolean {
  if (!transactions || transactions.length === 0) {
    return false;
  }

  const header = ['Data,Título,Categoria,Tipo,Valor(R$)'];
  const rows = transactions.map((t) => {
    const cleanDate = t.date ? t.date.split('T')[0] : '';
    const escapedTitle = (t.title || '').replace(/"/g, '""');
    const typeLabel = t.type === 'income' ? 'Receita' : 'Despesa';
    return `${cleanDate},"${escapedTitle}",${t.category},${typeLabel},${t.amount}`;
  });

  const csvContent = [header, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `lumin_finance_${month}_${year}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}
