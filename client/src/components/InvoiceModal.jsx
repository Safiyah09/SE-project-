import React from 'react';
import InvoiceReceipt from './InvoiceReceipt';

export default function InvoiceModal({ isOpen, onClose, order, onPrint }) {
  if (!isOpen || !order) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 pt-24 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="max-w-lg w-full">
        <InvoiceReceipt order={order} onClose={onClose} onPrint={onPrint} />
      </div>
    </div>
  );
}
