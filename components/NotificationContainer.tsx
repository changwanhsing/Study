'use client';

import { useNotifications, hideNotification, type Notification } from '@/lib/notifications';

const notificationStyles: Record<Notification['type'], { bg: string; icon: string }> = {
  success: { bg: 'bg-mint', icon: '✅' },
  error: { bg: 'bg-coral', icon: '❌' },
  info: { bg: 'bg-ink', icon: 'ℹ️' },
  warning: { bg: 'bg-coral', icon: '⚠️' },
};

export function NotificationContainer() {
  const notifications = useNotifications();

  return (
    <div className="fixed top-4 right-4 space-y-2 z-50 max-w-sm pointer-events-none">
      {notifications.map((notif) => {
        const { bg, icon } = notificationStyles[notif.type];
        return (
          <div
            key={notif.id}
            className={`${bg} text-white font-bold p-4 rounded-lg shadow-lg flex items-start gap-3 pointer-events-auto animate-slide-in`}
            role="alert"
            aria-live={notif.type === 'error' ? 'assertive' : 'polite'}
          >
            <span className="flex-shrink-0">{icon}</span>
            <div className="flex-1">
              <p>{notif.message}</p>
            </div>
            <button
              onClick={() => hideNotification(notif.id)}
              className="flex-shrink-0 hover:opacity-80 transition-opacity"
              aria-label="關閉"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
