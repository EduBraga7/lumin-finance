import { render, screen } from '@testing-library/react';
import { DateFilterProvider } from '@/context/DateFilterContext';
import MonthSelector from '@/components/MonthSelector';

describe('MonthSelector', () => {
  it('should render month selector', () => {
    render(
      <DateFilterProvider>
        <MonthSelector />
      </DateFilterProvider>
    );
    
    const selector = screen.getByRole('combobox');
    expect(selector).toBeInTheDocument();
  });

  it('should have navigation buttons', () => {
    render(
      <DateFilterProvider>
        <MonthSelector />
      </DateFilterProvider>
    );
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});