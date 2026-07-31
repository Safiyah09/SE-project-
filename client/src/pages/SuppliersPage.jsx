import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Search, Filter, Plus, X, AlertCircle, CheckCircle2, Edit2, Trash2, Truck, Phone, Mail, MapPin, Package } from 'lucide-react';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../services/supplierService';
import ToastContainer from '../components/products/ToastContainer';

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Add/Edit Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    isActive: true,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Delete Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
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

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSuppliers();
      setSuppliers(data.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load suppliers.');
      showToast('Failed to load suppliers.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch =
      (supplier.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (supplier.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (supplier.phone?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Active' && supplier.isActive) ||
      (statusFilter === 'Inactive' && !supplier.isActive);

    return matchesSearch && matchesStatus;
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;
    if (name === 'phone') {
      newValue = value.replace(/\D/g, '');
    }
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
    setEditingSupplierId(null);
    setFormData({ name: '', phone: '', email: '', address: '', notes: '', isActive: true });
    setFormError(null);
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const handleEditClick = (supplier) => {
    setEditingSupplierId(supplier._id);
    setFormData({
      name: supplier.name || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
      isActive: supplier.isActive ?? true,
    });
    setFormError(null);
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const handleStatusToggle = async (supplier) => {
    try {
      await updateSupplier(supplier._id, { isActive: !supplier.isActive });
      showToast(`Supplier ${supplier.name} ${!supplier.isActive ? 'activated' : 'deactivated'}.`);
      fetchSuppliers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status.', 'error');
    }
  };

  const handleDeleteClick = (supplier) => {
    setSupplierToDelete(supplier);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = {};
    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Supplier name is required.';
    }
    
    if (!formData.phone || formData.phone.trim() === '') {
      errors.phone = 'Phone number is required.';
    } else {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(formData.phone)) {
        errors.phone = 'Phone number must be exactly 10 digits';
      }
    }
    
    if (!formData.email || formData.email.trim() === '') {
      errors.email = 'Email is required.';
    } else {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Enter valid email.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);
      if (editingSupplierId) {
        await updateSupplier(editingSupplierId, formData);
        showToast('Supplier updated successfully.');
      } else {
        await createSupplier(formData);
        showToast('Supplier added successfully.');
      }
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', email: '', address: '', notes: '', isActive: true });
      await fetchSuppliers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save supplier.');
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;
    try {
      setDeleteLoading(true);
      await deleteSupplier(supplierToDelete._id);
      showToast('Supplier deleted successfully.');
      setIsDeleteModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete supplier.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!Array.isArray(suppliers)) {
    return <div className="p-8 text-center text-rose-600 font-bold">Suppliers failed to load. Invalid state.</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172b1f] flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#2f8f46] flex items-center justify-center shadow-sm">
              <Truck className="w-5.5 h-5.5 text-white" />
            </div>
            Suppliers
          </h1>
          <p className="text-[#5f6f65] mt-1 text-sm font-medium">Manage your vendors and distributors</p>
        </div>
        <button onClick={handleAddClick} className="btn-primary">
          <Plus size={18} strokeWidth={2.5} />
          Add Supplier
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-sm font-bold text-rose-800">{error}</p>
        </div>
      )}

      {/* ── Search & Filter ── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a948d] group-focus-within:text-[#2f8f46] transition-colors" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#172b1f] placeholder-[#8a948d] focus:outline-none focus:border-[#2f8f46] focus:bg-white transition-colors"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#8a948d] hover:text-[#172b1f] transition-colors">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-40 group">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a948d] group-focus-within:text-[#2f8f46] transition-colors" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#5f6f65] focus:outline-none focus:border-[#2f8f46] focus:bg-white transition-colors appearance-none cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="bg-[#dff3e4] px-4 py-2.5 rounded-xl border border-green-200 shrink-0 hidden sm:block">
            <p className="text-[10px] font-bold text-[#1a5d2e] uppercase tracking-wider mb-0.5">Total Suppliers</p>
            <p className="text-sm font-black text-[#2f8f46] leading-none">{suppliers.length}</p>
          </div>
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#2f8f46] animate-spin mb-4" />
            <p className="text-sm font-bold text-[#172b1f]">Loading suppliers...</p>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 border border-gray-100">
              <Truck className="w-8 h-8 text-[#8a948d]" />
            </div>
            <h3 className="text-sm font-bold text-[#172b1f]">No suppliers found</h3>
            <p className="text-xs text-[#5f6f65] mt-1">Add your first supplier to get started.</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="py-20 text-center text-[#5f6f65] text-sm font-bold">
            No matching suppliers found.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100 text-[#8a948d] font-bold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Supplier</th>
                    <th className="px-6 py-4">Contact Info</th>
                    <th className="px-6 py-4 text-center">Products</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredSuppliers?.map((supplier) => (
                    <tr key={supplier?._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                            <Truck className="w-5 h-5 text-[#8a948d]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#172b1f]">{supplier?.name || "Unnamed Supplier"}</p>
                            {supplier?.address && (
                              <p className="text-xs text-[#5f6f65] flex items-center gap-1 mt-0.5">
                                <MapPin size={12} /> {supplier.address}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {supplier?.phone && (
                            <p className="text-xs font-semibold text-[#5f6f65] flex items-center gap-1.5">
                              <Phone size={12} className="text-[#8a948d]" /> {supplier.phone}
                            </p>
                          )}
                          {supplier?.email && (
                            <p className="text-xs font-semibold text-[#5f6f65] flex items-center gap-1.5">
                              <Mail size={12} className="text-[#8a948d]" /> {supplier.email}
                            </p>
                          )}
                          {!supplier?.phone && !supplier?.email && (
                            <span className="text-xs text-gray-400 italic">No contact info</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-gray-100 text-[#172b1f] font-bold text-xs border border-gray-200">
                          {supplier.suppliedProductsCount || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleStatusToggle(supplier)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                            supplier.isActive 
                              ? 'bg-green-50 text-[#1a5d2e] border-green-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200' 
                              : 'bg-gray-100 text-[#5f6f65] border-gray-200 hover:bg-green-50 hover:text-[#1a5d2e] hover:border-green-200'
                          }`}
                          title={supplier.isActive ? "Click to Deactivate" : "Click to Activate"}
                        >
                          {supplier.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditClick(supplier)}
                            className="p-1.5 text-[#5f6f65] hover:text-[#3b82f6] hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(supplier)}
                            className="p-1.5 text-[#5f6f65] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {filteredSuppliers?.map((supplier) => (
                <div key={supplier?._id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                        <Truck className="w-5 h-5 text-[#8a948d]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#172b1f]">{supplier?.name || "Unnamed Supplier"}</p>
                        <span className={`inline-flex mt-1 items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${
                          supplier?.isActive ? 'bg-green-50 text-[#1a5d2e] border-green-100' : 'bg-gray-100 text-[#5f6f65] border-gray-200'
                        }`}>
                          {supplier?.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEditClick(supplier)} className="p-1.5 text-[#5f6f65] bg-gray-50 rounded-lg">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDeleteClick(supplier)} className="p-1.5 text-rose-600 bg-rose-50 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-100">
                    {supplier.phone && (
                      <p className="text-xs font-semibold text-[#5f6f65] flex items-center gap-2">
                        <Phone size={12} className="text-[#8a948d]" /> {supplier.phone}
                      </p>
                    )}
                    {supplier.email && (
                      <p className="text-xs font-semibold text-[#5f6f65] flex items-center gap-2">
                        <Mail size={12} className="text-[#8a948d]" /> {supplier.email}
                      </p>
                    )}
                    {supplier.address && (
                      <p className="text-xs font-semibold text-[#5f6f65] flex items-center gap-2">
                        <MapPin size={12} className="text-[#8a948d]" /> {supplier.address}
                      </p>
                    )}
                    <p className="text-xs font-semibold text-[#1a5d2e] flex items-center gap-2 border-t border-gray-200 pt-2 mt-2">
                      <Package size={12} className="text-[#2f8f46]" /> {supplier.suppliedProductsCount || 0} Products Supplied
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Add/Edit Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-50 bg-gray-50/20">
              <h2 className="text-lg font-bold text-[#172b1f] flex items-center gap-2">
                <Truck size={18} className="text-[#2f8f46]" />
                {editingSupplierId ? 'Edit Supplier' : 'Add New Supplier'}
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
                <label className="form-label text-[10px] font-bold text-[#5f6f65] uppercase tracking-wider ml-1 block mb-1">Supplier Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={`form-input w-full px-4 py-2.5 rounded-xl border ${validationErrors.name ? 'border-rose-500 bg-rose-50/30' : 'border-gray-200 bg-white'} text-sm font-medium focus:outline-none focus:border-[#2f8f46]`} placeholder="e.g Amul" />
                {validationErrors.name && <p className="text-[10px] font-bold text-rose-500 ml-1 mt-1">{validationErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="form-label text-[10px] font-bold text-[#5f6f65] uppercase tracking-wider ml-1 block mb-1">Phone Number *</label>
                  <input type="text" name="phone" maxLength={10} value={formData.phone} onChange={handleInputChange} className={`form-input w-full px-4 py-2.5 rounded-xl border ${validationErrors.phone ? 'border-rose-500 bg-rose-50/30' : 'border-gray-200 bg-white'} text-sm font-medium focus:outline-none focus:border-[#2f8f46]`} placeholder="Phone Number" />
                  {validationErrors.phone && <p className="text-[10px] font-bold text-rose-500 ml-1 mt-1">{validationErrors.phone}</p>}
                </div>
                <div className="space-y-1">
                  <label className="form-label text-[10px] font-bold text-[#5f6f65] uppercase tracking-wider ml-1 block mb-1">Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={`form-input w-full px-4 py-2.5 rounded-xl border ${validationErrors.email ? 'border-rose-500 bg-rose-50/30' : 'border-gray-200 bg-white'} text-sm font-medium focus:outline-none focus:border-[#2f8f46]`} placeholder="Email Address" />
                  {validationErrors.email && <p className="text-[10px] font-bold text-rose-500 ml-1 mt-1">{validationErrors.email}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="form-label text-[10px] font-bold text-[#5f6f65] uppercase tracking-wider ml-1 block mb-1">Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="form-input w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:border-[#2f8f46]" placeholder="Full physical address" />
              </div>

              <div className="space-y-1">
                <label className="form-label text-[10px] font-bold text-[#5f6f65] uppercase tracking-wider ml-1 block mb-1">Notes</label>
                <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="2" className="form-input w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:border-[#2f8f46] resize-none" placeholder="Optional notes..."></textarea>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="w-4 h-4 text-[#2f8f46] border-gray-300 rounded focus:ring-[#2f8f46]" />
                <span className="text-sm font-bold text-[#172b1f]">Active Supplier</span>
              </label>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={formLoading} className="px-5 py-2 rounded-xl bg-white hover:bg-gray-50 text-[#5f6f65] font-bold text-sm border border-gray-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={formLoading} className="px-5 py-2 rounded-xl bg-[#2f8f46] hover:bg-[#26763a] text-white font-bold text-sm transition-colors flex items-center justify-center min-w-[120px]">
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingSupplierId ? 'Save Changes' : 'Add Supplier')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {isDeleteModalOpen && supplierToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-rose-500" />
            </div>
            <h2 className="text-xl font-bold text-[#172b1f] mb-2">Delete Supplier?</h2>
            <p className="text-sm text-[#5f6f65] mb-6">
              Are you sure you want to delete <span className="font-bold text-[#172b1f]">{supplierToDelete.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)} disabled={deleteLoading} className="px-6 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-[#5f6f65] font-bold text-sm border border-gray-200 transition-colors flex-1">
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={deleteLoading} className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-colors flex-1 flex items-center justify-center">
                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersPage;
