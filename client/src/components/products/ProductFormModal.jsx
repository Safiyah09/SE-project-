import React from 'react';
import { X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const ProductFormModal = ({
  isModalOpen,
  closeModal,
  editingProductId,
  formData,
  handleInputChange,
  handleSubmit,
  formLoading,
  formError,
  formSuccess,
  suppliers = [],
  categories = []
}) => {
  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/20">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md w-full max-w-md overflow-hidden animate-fade-in">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-50 bg-gray-50/20">
          <h2 className="text-lg font-bold text-[#172b1f]">
            {editingProductId ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={closeModal}
            className="text-[#8a948d] hover:text-[#172b1f] transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
          {formError && (
            <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-100 p-2.5 rounded-xl font-bold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p>{formError}</p>
            </div>
          )}
          {formSuccess && (
            <div className="flex items-center gap-2 text-xs text-[#1a5d2e] bg-green-50 border border-green-100 p-2.5 rounded-xl font-bold">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <p>{formSuccess}</p>
            </div>
          )}

          <div className="space-y-1">
            <label className="form-label">Product Name</label>
            <input
              type="text"
              name="productName"
              value={formData.productName}
              onChange={handleInputChange}
              className="form-input"
              placeholder="e.g. Organic Bananas"
            />
          </div>

          <div className="space-y-1">
            <label className="form-label">Image URL</label>
            <input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleInputChange}
              className="form-input"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="form-label">Category</label>
              <select
                name="category"
                value={formData.category || ''}
                onChange={handleInputChange}
                className="form-input appearance-none cursor-pointer"
              >
                <option value="" disabled>Select a category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="form-label">Unit</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="form-input appearance-none cursor-pointer"
              >
                {['kg', 'g', 'ltr', 'ml', 'pcs', 'dozen', 'pack', 'box', 'bottle', 'bag'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3.5">
            <div className="space-y-1">
              <label className="form-label">Buying (₹)</label>
              <input
                type="number"
                name="buyingPrice"
                step="0.01"
                min="0"
                value={formData.buyingPrice}
                onChange={handleInputChange}
                className="form-input"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <label className="form-label">Selling (₹)</label>
              <input
                type="number"
                name="sellingPrice"
                step="0.01"
                min="0"
                value={formData.sellingPrice}
                onChange={handleInputChange}
                className="form-input !text-[#1a5d2e]"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <label className="form-label">Qty</label>
              <input
                type="number"
                name="quantity"
                min="0"
                value={formData.quantity}
                onChange={handleInputChange}
                className="form-input"
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="form-label">Supplier</label>
            <select
              name="supplier"
              value={formData.supplier || ''}
              onChange={handleInputChange}
              className="form-input appearance-none cursor-pointer"
            >
              <option value="">Select Supplier</option>
              {suppliers.map(sup => (
                <option key={sup._id} value={sup._id}>{sup.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              disabled={formLoading}
              className="btn-secondary !px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="btn-primary min-w-[120px] disabled:opacity-50"
            >
              {formLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                editingProductId ? 'Save Changes' : 'Add Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
