import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DateFilterProvider } from '@/context/DateFilterContext';
import MonthSelector from '@/components/MonthSelector';

describe('MonthSelector', () => {
  it('should render month selector with current year', () => {
    render(
      <DateFilterProvider>
        <MonthSelector />
      </DateFilterProvider>
    );
    
    const yearText = screen.getByText(new RegExp(`${new Date().getFullYear()}`));
    expect(yearText).toBeInTheDocument();
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