import { useState } from 'react';

export function useConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'danger' | 'warning' | 'info'>('warning');
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = (title: string, message: string, modalType: 'danger' | 'warning' | 'info' = 'warning'): Promise<boolean> => {
    setTitle(title);
    setMessage(message);
    setType(modalType);
    setIsOpen(true);
    
    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolver) resolver(true);
    setResolver(null);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolver) resolver(false);
    setResolver(null);
  };

  return {
    isOpen,
    title,
    message,
    type,
    handleConfirm,
    handleCancel,
    confirm
  };
}

