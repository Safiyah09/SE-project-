import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from '../services/productServices';
import { getSuppliers } from '../services/supplierService';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, PackageX, Package, Search, Filter, Plus, X, AlertCircle, CheckCircle2, Edit2, Trash2, Upload } from 'lucide-react';
import ProductTable from '../components/products/ProductTable';
import ProductFormModal from '../components/products/ProductFormModal';
import DeleteConfirmationModal from '../components/products/DeleteConfirmationModal';
import ImportCSVModal from '../components/products/ImportCSVModal';
import ToastContainer from '../components/products/ToastContainer';
import { getCategoryName } from '../utils/categoryHelpers';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchParams] = useSearchParams();
  const stockFilter = searchParams.get('stock');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Add/Edit Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [formData, setFormData] = useState({
    productName: '',
    category: '',
    buyingPrice: '',
    sellingPrice: '',
    quantity: '',
    unit: 'pcs',
    supplier: '',
    image: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  // Import Modal states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Delete Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);

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

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      let productsLoaded = false;
      try {
        const data = await getProducts();
        setProducts(data.products || []);
        productsLoaded = true;
      } catch (err) {
        console.error("Failed to load products:", err);
        setProducts([]);
        setError('Failed to load products');
        showToast('Failed to load products.', 'error');
      }

      if (productsLoaded) {
        try {
          const supplierData = await getSuppliers();
          setSuppliers(supplierData.data || []);
        } catch (err) {
          console.error("Failed to load suppliers:", err);
        }
        
        try {
          const { getCategories } = await import('../services/categoryService');
          const categoryData = await getCategories();
          setCategories(categoryData.data || []);
        } catch (err) {
          console.error("Failed to load categories:", err);
        }
        
        setError(null);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setProducts([]);
      setError('Failed to load products');
      showToast('Failed to load data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchedRef = useRef(false);

  useEffect(() => {
    // console.log('[useEffect] Fetching products...');
    fetchProducts();
  }, [fetchProducts]);
  const getStockStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'in stock':
        return 'text-[#1a5d2e] bg-green-50 border-green-100';
      case 'low stock':
        return 'text-[#92400e] bg-amber-50 border-amber-100';
      case 'out of stock':
        return 'text-[#9f1239] bg-rose-50 border-rose-100';
      default:
        return 'text-[#5f6f65] bg-gray-50 border-gray-100';
    }
  };

  // Live categories for filter
  const filterCategories = categories?.length > 0 
    ? ['All', ...categories.map(c => c.name)]
    : ['All', ...new Set(products?.map(p => getCategoryName(p)).filter(Boolean) || [])];

  // Filter products
  const filteredProducts = products?.filter(product => {
    const catName = getCategoryName(product);
    const matchesSearch =
      (product?.productName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (catName.toLowerCase()).includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || catName === selectedCategory;

    // Stock filtering logic
    let matchesStock = true;
    const qty = Number(product?.quantity || 0);
    if (stockFilter === "in") {
      matchesStock = qty > 10;
    } else if (stockFilter === "low") {
      matchesStock = qty > 0 && qty <= 10;
    } else if (stockFilter === "out") {
      matchesStock = qty <= 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  }) || [];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(null);
    setFormSuccess(null);
  };

  const validateForm = () => {
    if (!formData.supplier) {
      return 'Please select a supplier';
    }
    if (!formData.productName || !formData.category || !formData.buyingPrice || !formData.sellingPrice || !formData.quantity || !formData.unit) {
      return 'All fields are required.';
    }
    if (Number(formData.buyingPrice) < 0 || Number(formData.sellingPrice) < 0) {
      return 'Prices cannot be negative.';
    }
    if (Number(formData.quantity) < 0) {
      return 'Quantity cannot be negative.';
    }
    return null;
  };

  const handleAddClick = () => {
    setEditingProductId(null);
    setFormData({ productName: '', category: '', buyingPrice: '', sellingPrice: '', quantity: '', unit: 'pcs', supplier: '', image: '' });
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (product) => {
    setEditingProductId(product._id || product.id);
    setFormData({
      productName: product.productName || '',
      category: product.category?._id || product.category || '',
      buyingPrice: product.buyingPrice || '',
      sellingPrice: product.sellingPrice || '',
      quantity: product.quantity || '',
      unit: product.unit || 'pcs',
      supplier: product.supplier?._id || product.supplier || '',
      image: product.image || ''
    });
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteError(null);
    setDeleteSuccess(null);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormLoading(true);
    try {
      const token = localStorage.getItem('gms_token');
      const payload = {
        productName: formData.productName,
        category: formData.category,
        buyingPrice: Number(formData.buyingPrice),
        sellingPrice: Number(formData.sellingPrice),
        quantity: Number(formData.quantity),
        unit: formData.unit,
        supplier: formData.supplier,
        image: formData.image
      };

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      if (editingProductId) {
        await updateProduct(editingProductId, payload);
        const msg = 'Product updated successfully!';
        setFormSuccess(msg);
        showToast(msg, 'success');
      } else {
        await createProduct(payload);
        const msg = 'Product added successfully!';
        setFormSuccess(msg);
        showToast(msg, 'success');
      }

      // Refresh list
      await fetchProducts();

      // Clear and close
      setTimeout(() => {
        setIsModalOpen(false);
        setEditingProductId(null);
        setFormData({ productName: '', category: '', buyingPrice: '', sellingPrice: '', quantity: '', unit: 'pcs', supplier: '', image: '' });
        setFormSuccess(null);
      }, 1000);

    } catch (err) {
      console.error('Error saving product:', err);
      
      let msg = 'Failed to save product. Please try again.';
      
      // Handle backend validation errors array or single message
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        msg = err.response.data.errors.map(e => e.msg).join(', ');
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('gms_token');
      const productId = productToDelete._id || productToDelete.id;
      await deleteProduct(productId);

      const msg = 'Product deleted successfully!';
      setDeleteSuccess(msg);
      showToast(msg, 'success');
      await fetchProducts();

      setTimeout(() => {
        setIsDeleteModalOpen(false);
        setProductToDelete(null);
        setDeleteSuccess(null);
      }, 1000);
    } catch (err) {
      console.error('Error deleting product:', err);
      const msg = err.response?.data?.message || 'Failed to delete product. Please try again.';
      setDeleteError(msg);
      showToast(msg, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProductId(null);
    setFormData({ productName: '', category: '', buyingPrice: '', sellingPrice: '', quantity: '', unit: 'pcs', supplier: '' });
    setFormError(null);
    setFormSuccess(null);
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;
    setIsDeleteModalOpen(false);
    setProductToDelete(null);
    setDeleteError(null);
    setDeleteSuccess(null);
  };

  if (!Array.isArray(products)) {
    return <div className="p-8 text-center text-red-500 font-bold">Products failed to load</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172b1f] flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#2f8f46] flex items-center justify-center shadow-sm">
              <Package className="w-6 h-6 text-white" />
            </div>
            Products Inventory
          </h1>
          <p className="text-[#5f6f65] mt-1 text-sm font-medium">View and monitor all your grocery items</p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between w-full lg:w-auto mt-4 lg:mt-0">
          
          <div className="flex flex-col sm:flex-row gap-3 flex-1 flex-wrap">
            {/* Search Bar */}
            <div className="relative w-full sm:w-60 group shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a948d] group-focus-within:text-[#2f8f46] transition-colors" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#2f8f46] transition-colors"
              />
            </div>

            {/* Category Filter */}
            <div className="relative w-full sm:w-fit group shrink-0">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a948d] group-focus-within:text-[#2f8f46] transition-colors" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-auto pl-11 pr-10 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#2f8f46] transition-colors appearance-none cursor-pointer min-w-fit whitespace-nowrap"
              >
                {filterCategories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-start sm:justify-end shrink-0 gap-3">
            {/* Import CSV Button */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="btn-secondary w-full sm:w-auto min-w-fit whitespace-nowrap !px-4"
            >
              <Upload className="w-4 h-4" /> Import CSV
            </button>
            {/* Add Button */}
            <button
              onClick={handleAddClick}
              className="btn-primary w-full sm:w-auto min-w-fit whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="flex flex-col items-center justify-center h-80 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Loader2 className="w-10 h-10 text-[#2f8f46] animate-spin mb-3" />
          <p className="text-base text-[#5f6f65] font-bold">Loading products...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-80 bg-rose-50 rounded-2xl border border-rose-100 shadow-sm">
          <p className="text-rose-600 text-base font-bold">{error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <PackageX className="w-12 h-12 text-[#8a948d] mb-3" />
          <p className="text-xl font-bold text-[#172b1f]">No products yet</p>
          <p className="text-[#5f6f65] mt-1 text-base font-medium">Your inventory is currently empty.</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Search className="w-12 h-12 text-[#8a948d] mb-3" />
          <p className="text-xl font-bold text-[#172b1f]">No matching products found</p>
          <p className="text-[#5f6f65] mt-1 text-base font-medium">Try adjusting your search or filters.</p>
          <button
            onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
            className="mt-5 px-5 py-2 bg-gray-100 text-[#172b1f] hover:bg-gray-200 rounded-xl text-sm font-bold transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
          <ProductTable 
            filteredProducts={filteredProducts}
            getStockStatusColor={getStockStatusColor}
            handleEditClick={handleEditClick}
            handleDeleteClick={handleDeleteClick}
            suppliers={suppliers}
          />
      )}

      {isModalOpen && (
        <ProductFormModal
          isModalOpen={isModalOpen}
          closeModal={() => setIsModalOpen(false)}
          formData={formData}
          formError={formError}
          formSuccess={formSuccess}
          formLoading={formLoading}
          editingProductId={editingProductId}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          suppliers={suppliers}
          categories={categories}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isDeleteModalOpen={isDeleteModalOpen}
        productToDelete={productToDelete}
        closeDeleteModal={closeDeleteModal}
        confirmDelete={confirmDelete}
        deleteLoading={deleteLoading}
        deleteError={deleteError}
        deleteSuccess={deleteSuccess}
      />

      {/* Import CSV Modal */}
      <ImportCSVModal
        isModalOpen={isImportModalOpen}
        closeModal={() => setIsImportModalOpen(false)}
        onSuccess={fetchProducts}
        showToast={showToast}
      />

      {/* Toast Notification System */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default ProductsPage;