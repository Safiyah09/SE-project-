import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Search, Filter, Plus, X, AlertCircle, CheckCircle2, Edit2, Trash2, Folder, Package, Archive, AlertTriangle } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/categoryService';
import ToastContainer from '../components/products/ToastContainer';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Add/Edit Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Delete Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast state
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load categories.');
      showToast('Failed to load categories.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Filter categories
  const filteredCategories = categories.filter(category => {
    const matchesSearch =
      (category.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (category.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Active' && category.isActive) ||
      (statusFilter === 'Inactive' && !category.isActive);

    return matchesSearch && matchesStatus;
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: newValue 
    }));
    setFormError(null);
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleAddClick = () => {
    setEditingCategoryId(null);
    setFormData({ name: '', description: '', isActive: true });
    setFormError(null);
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const handleEditClick = (category) => {
    setEditingCategoryId(category._id);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      isActive: category.isActive ?? true,
    });
    setFormError(null);
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const handleStatusToggle = async (category) => {
    try {
      await updateCategory(category._id, { isActive: !category.isActive });
      showToast(`Category ${category.name} ${!category.isActive ? 'activated' : 'deactivated'}.`);
      fetchCategories();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status.', 'error');
    }
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = {};
    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Category name is required.';
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);
      if (editingCategoryId) {
        await updateCategory(editingCategoryId, formData);
        showToast('Category updated successfully.');
      } else {
        await createCategory(formData);
        showToast('Category added successfully.');
      }
      setIsModalOpen(false);
      setFormData({ name: '', description: '', isActive: true });
      await fetchCategories();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save category.');
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      setDeleteLoading(true);
      await deleteCategory(categoryToDelete._id);
      showToast('Category deleted successfully.');
      setIsDeleteModalOpen(false);
      fetchCategories();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete category.', 'error');
      setIsDeleteModalOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!Array.isArray(categories)) {
    return <div className="p-8 text-center text-rose-600 font-bold">Categories failed to load. Invalid state.</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#172b1f] tracking-tight">Categories</h1>
          <p className="text-sm text-[#8a948d] font-medium mt-1">Manage product categories and insights</p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#2f8f46] text-white rounded-xl hover:bg-[#257338] transition-all font-bold text-sm shadow-md shadow-green-900/10 active:scale-95 whitespace-nowrap"
        >
          <Plus size={18} strokeWidth={2.5} />
          Add Category
        </button>
      </div>

      {/* ── Top Controls ── */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative group flex-1 sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2f8f46] transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2f8f46]/20 focus:border-[#2f8f46] transition-all shadow-sm placeholder:text-gray-400"
            />
          </div>
        </div>
        <div className="bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center gap-2">
          <span className="text-sm font-medium text-[#8a948d]">Total Categories:</span>
          <span className="text-lg font-black text-[#172b1f]">{filteredCategories.length}</span>
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden min-h-[400px] relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10">
            <Loader2 className="w-10 h-10 text-[#2f8f46] animate-spin mb-4" />
            <p className="text-sm font-bold text-[#5f6f65] animate-pulse">Loading categories...</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-rose-500" />
            </div>
            <p className="text-rose-600 font-bold mb-2">{error}</p>
            <button onClick={fetchCategories} className="text-sm text-[#2f8f46] font-bold hover:underline">Try Again</button>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Folder className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-black text-[#172b1f] mb-2">No Categories Found</h3>
            <p className="text-sm text-[#8a948d] max-w-sm mb-6 font-medium">
              {searchTerm || statusFilter !== 'All' 
                ? "We couldn't find any categories matching your filters. Try clearing them."
                : "You haven't added any categories yet. Create your first category to organize your inventory."}
            </p>
            {(searchTerm || statusFilter !== 'All') ? (
              <button 
                onClick={() => { setSearchTerm(''); setStatusFilter('All'); }}
                className="text-[#2f8f46] font-bold text-sm hover:underline"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={handleAddClick}
                className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-bold text-sm"
              >
                <Plus size={18} strokeWidth={2.5} /> Add First Category
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="p-4 text-[11px] font-bold text-[#8a948d] uppercase tracking-wider pl-6">Category</th>
                    <th className="p-4 text-[11px] font-bold text-[#8a948d] uppercase tracking-wider">Total Products</th>
                    <th className="p-4 text-[11px] font-bold text-[#8a948d] uppercase tracking-wider">Inventory Value</th>
                    <th className="p-4 text-[11px] font-bold text-[#8a948d] uppercase tracking-wider">Low Stock</th>
                    <th className="p-4 text-[11px] font-bold text-[#8a948d] uppercase tracking-wider text-center pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredCategories.map((category) => (
                    <tr key={category._id} className="hover:bg-green-50/20 transition-colors group">
                      <td className="p-4 pl-6">
                        <div>
                          <p className="font-bold text-sm text-[#172b1f]">{category.name}</p>
                          {category.description && (
                            <p className="text-xs text-[#8a948d] mt-0.5 truncate max-w-[200px]">{category.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">
                          <Package size={12} /> {category.totalProducts || 0}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-bold text-[#172b1f]">
                          ₹{Number(category.inventoryValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-start w-24">
                          {(category.lowStockCount || 0) > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-xs font-bold w-full justify-center">
                              <AlertTriangle size={12} /> {category.lowStockCount} items
                            </span>
                          ) : (
                            <span className="inline-flex items-center w-full justify-center text-xs text-gray-400 font-medium">—</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 pr-6">
                        <div className="flex items-center justify-center gap-2 transition-opacity">
                          <button onClick={() => handleEditClick(category)} className="p-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors" title="Edit">
                            <Edit2 size={14} strokeWidth={2.5} />
                          </button>
                          <button onClick={() => handleDeleteClick(category)} className="p-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors" title="Delete">
                            <Trash2 size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredCategories.map((category) => (
                <div key={category._id} className="p-5 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-bold text-[#172b1f] text-base">{category.name}</h3>
                      {category.description && (
                        <p className="text-xs text-[#8a948d] mt-1 line-clamp-2">{category.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditClick(category)} className="p-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 active:scale-95 transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteClick(category)} className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 active:scale-95 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold text-[#8a948d] uppercase mb-1 flex items-center gap-1.5">
                        <Package size={10} /> Total Products
                      </p>
                      <p className="font-bold text-sm text-[#172b1f]">{category.totalProducts || 0}</p>
                    </div>
                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold text-[#8a948d] uppercase mb-1 flex items-center gap-1.5">
                        <Archive size={10} /> Inventory Value
                      </p>
                      <p className="font-bold text-sm text-[#172b1f]">₹{Number(category.inventoryValue || 0).toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  {(category.lowStockCount || 0) > 0 && (
                    <div className="flex items-center justify-end pt-3 border-t border-gray-50">
                      <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                        <AlertTriangle size={12} /> {category.lowStockCount} Low Stock
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Add/Edit Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-50 bg-gray-50/20">
              <h2 className="text-lg font-bold text-[#172b1f] flex items-center gap-2">
                <Folder size={18} className="text-[#2f8f46]" />
                {editingCategoryId ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8a948d] hover:text-[#172b1f] transition-colors p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-100 p-2.5 rounded-xl font-bold">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p>{formError}</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="form-label text-[10px] font-bold text-[#5f6f65] uppercase tracking-wider ml-1 block mb-1">Category Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  className={`form-input w-full px-4 py-2.5 rounded-xl border ${validationErrors.name ? 'border-rose-500 bg-rose-50/30' : 'border-gray-200 bg-white'} text-sm font-medium focus:outline-none focus:border-[#2f8f46]`} 
                  placeholder="e.g. Fruits, Dairy, Bakery" 
                />
                {validationErrors.name && <p className="text-[10px] font-bold text-rose-500 ml-1 mt-1">{validationErrors.name}</p>}
              </div>

              <div className="space-y-1">
                <label className="form-label text-[10px] font-bold text-[#5f6f65] uppercase tracking-wider ml-1 block mb-1">Description</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  rows="3" 
                  className="form-input w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:border-[#2f8f46] resize-none" 
                  placeholder="Optional description..."
                ></textarea>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-50 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2.5 bg-[#2f8f46] text-white text-sm font-bold rounded-xl hover:bg-[#257338] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-green-900/10"
                >
                  {formLoading && <Loader2 size={16} className="animate-spin" />}
                  {editingCategoryId ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-gray-100 shadow-xl text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-black text-[#172b1f] mb-2">Delete Category?</h3>
            <p className="text-sm text-[#8a948d] mb-6 font-medium">
              Are you sure you want to delete <span className="text-[#172b1f] font-bold">"{categoryToDelete?.name}"</span>?
              <br /><span className="text-rose-500 font-bold mt-1 block">This action cannot be undone.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-colors flex items-center justify-center gap-2 text-sm shadow-md shadow-rose-500/20 disabled:opacity-50"
              >
                {deleteLoading && <Loader2 size={16} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
