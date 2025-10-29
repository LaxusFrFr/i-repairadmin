import { useState } from 'react';

export function useNotification() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'success' | 'error' | 'info'>('info');

  const notify = (message: string, notificationType: 'success' | 'error' | 'info' = 'info') => {
    setMessage(message);
    setType(notificationType);
    setIsOpen(true);
    
    // Auto close after 3 seconds
    setTimeout(() => {
      setIsOpen(false);
    }, 3000);
  };

  const close = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    message,
    type,
    notify,
    close
  };
}

