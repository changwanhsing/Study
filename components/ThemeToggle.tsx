'use client';

import { useTheme } from '@/lib/theme-context';

export function ThemeToggle() {
  const { effectiveTheme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-mint-bg transition-colors"
      aria-label={`切換為${effectiveTheme === 'light' ? '深色' : '淺色'}模式`}
      title={`切換為${effectiveTheme === 'light' ? '深色' : '淺色'}模式`}
    >
      {effectiveTheme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
