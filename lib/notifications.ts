export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

let notificationId = 0;
let listeners: Set<(notifications: Notification[]) => void> = new Set();
let notifications: Map<string, Notification> = new Map();

export function useNotifications() {
  const [notifs, setNotifs] = React.useState<Notification[]>([]);

  React.useEffect(() => {
    const handleUpdate = (newNotifs: Notification[]) => {
      setNotifs(newNotifs);
    };

    listeners.add(handleUpdate);
    return () => listeners.delete(handleUpdate);
  }, []);

  return notifs;
}

export function showNotification(
  message: string,
  type: NotificationType = 'info',
  duration = 4000
): string {
  const id = `notif-${++notificationId}`;
  const notification: Notification = { id, type, message, duration };

  notifications.set(id, notification);
  notifyListeners();

  if (duration > 0) {
    setTimeout(() => {
      notifications.delete(id);
      notifyListeners();
    }, duration);
  }

  return id;
}

export function hideNotification(id: string) {
  notifications.delete(id);
  notifyListeners();
}

function notifyListeners() {
  const notifs = Array.from(notifications.values());
  listeners.forEach((listener) => listener(notifs));
}

// 便利方法
export const notify = {
  success: (message: string, duration?: number) =>
    showNotification(message, 'success', duration),
  error: (message: string, duration?: number) =>
    showNotification(message, 'error', duration),
  info: (message: string, duration?: number) =>
    showNotification(message, 'info', duration),
  warning: (message: string, duration?: number) =>
    showNotification(message, 'warning', duration),
};

// 需要在組件中導入 React
import React from 'react';
