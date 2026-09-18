"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

interface DateFilterContextType {
  month: number;
  year: number;
  setMonth: (m: number) => void;
  setYear: (y: number) => void;
}

const DateFilterContext = createContext<DateFilterContextType>({
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  setMonth: () => {},
  setYear: () => {}
});

export const DateFilterProvider = ({ children }: { children: ReactNode }) => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  return (
    <DateFilterContext.Provider value={{ month, year, setMonth, setYear }}>
      {children}
    </DateFilterContext.Provider>
  );
};

export const useDateFilter = () => useContext(DateFilterContext);
