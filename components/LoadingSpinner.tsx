'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizeClasses[size]} border-4 border-mint-bg border-t-mint rounded-full animate-spin`}
        role="status"
        aria-label="加載中"
      >
        <span className="sr-only">加載中...</span>
      </div>
      {message && <p className="text-sm text-ink-soft font-bold">{message}</p>}
    </div>
  );
}
