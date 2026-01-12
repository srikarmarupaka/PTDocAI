import React, { useEffect } from 'react';

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
}

interface NotificationProps {
  notification: NotificationItem;
  onDismiss: (id: string) => void;
}

export const Notification: React.FC<NotificationProps> = ({ notification, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(notification.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const icons = {
    success: 'fa-circle-check',
    error: 'fa-circle-exclamation',
    info: 'fa-circle-info'
  };

  const colors = {
    success: 'bg-pwn-panel border-pwn-success text-pwn-success',
    error: 'bg-pwn-panel border-pwn-danger text-pwn-danger',
    info: 'bg-pwn-panel border-pwn-accent text-pwn-accent'
  };

  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg border-l-4 shadow-xl mb-3 animate-fade-in-up min-w-[300px] ${colors[notification.type]}`}>
      <i className={`fa-solid ${icons[notification.type]} text-xl`}></i>
      <p className="flex-1 text-sm text-white font-medium">{notification.message}</p>
      <button 
        onClick={() => onDismiss(notification.id)}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <i className="fa-solid fa-xmark"></i>
      </button>
    </div>
  );
};
