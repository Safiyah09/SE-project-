import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-4 px-5 py-4 rounded-2xl border shadow-xl backdrop-blur-md animate-in slide-in-from-right duration-300 w-[340px] sm:w-[400px] max-w-[90vw] transition-all bg-white/95 border-gray-100`}
        >
          <div className={`p-2 rounded-xl mt-0.5 ${toast.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'
            }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-gray-900 leading-tight">
              {toast.type === 'success' ? 'Success' : 'Error'}
            </p>
            <p className="text-xs text-gray-500 mt-1.5 font-medium break-words whitespace-pre-wrap">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
