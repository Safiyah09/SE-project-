import React from 'react';
import { Trash2, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const DeleteConfirmationModal = ({
  isDeleteModalOpen,
  productToDelete,
  closeDeleteModal,
  confirmDelete,
  deleteLoading,
  deleteError,
  deleteSuccess
}) => {
  if (!isDeleteModalOpen || !productToDelete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-50 mb-6 mx-auto">
            <Trash2 className="w-7 h-7 text-rose-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Delete Product</h3>
          <p className="text-gray-500 text-center mb-1 font-medium">
            Are you sure you want to delete <span className="font-bold text-gray-900">{productToDelete.productName}</span>?
          </p>
          <p className="text-rose-600 text-sm text-center font-bold">
            This action cannot be undone.
          </p>

          {deleteError && (
            <div className="mt-6 flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-100 p-4 rounded-xl font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p>{deleteError}</p>
            </div>
          )}

          {deleteSuccess && (
            <div className="mt-6 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 p-4 rounded-xl font-medium">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <p>{deleteSuccess}</p>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <button
              type="button"
              onClick={closeDeleteModal}
              disabled={deleteLoading}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold transition-all w-full"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleteLoading}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all flex items-center justify-center w-full shadow-md shadow-rose-900/10 active:scale-95 disabled:opacity-50"
            >
              {deleteLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Delete Product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
