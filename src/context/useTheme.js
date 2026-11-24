import { useContext } from 'react';
import { ThemeContext } from './themeContext.js';

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error('useTheme faqat ThemeProvider ichida ishlatilishi mumkin.');
  }
  return context;
}
