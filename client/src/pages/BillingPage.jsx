import React, { useState, useEffect } from 'react';
import { getProducts } from '../services/productServices';
import {
  formatCurrency,
  calculateSubtotal,
  calculateGST,
  calculateTotal,
  generateOrderId,
  formatInvoiceDate
} from '../utils/invoiceHelpers';
import {
  ShoppingCart,
  Search,
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  CreditCard,
  Package,
  Loader2,
  Receipt,
  Coins,
  QrCode,
  CheckCircle,
  AlertTriangle,
  Store
} from 'lucide-react';
import { getCategoryName } from '../utils/categoryHelpers';

import InvoiceModal from '../components/InvoiceModal';
import InvoiceReceipt from '../components/InvoiceReceipt';
import { createOrder } from '../services/orderService';

const BillingPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // POS filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Cart state
  const [cartItems, setCartItems] = useState([]);

  // Checkout modal states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [stockError, setStockError] = useState(null);

  // Invoice states
  const [showInvoice, setShowInvoice] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';

    script.onload = () => {
      resolve(true);
    };

    script.onerror = () => {
      resolve(false);
    };

    document.body.appendChild(script);
  });
};

  const handleCompleteOrder = async () => {
  setIsCheckingOut(true);

  const orderId = generateOrderId();

  const apiItems = cartItems.map(item => ({
    productId: item.product._id,
    productName: item.product.productName,
    quantity: item.quantity,
    price: item.product.sellingPrice,
    image: item.product.image || ''
  }));

  const orderPayload = {
    orderId,
    customerName: customerName.trim() || 'Walk-in Customer',
    paymentMethod,
    items: apiItems,
    subtotal,
    gst,
    total
  };

  try {

    // ================================
    // CASH PAYMENT
    // ================================
    if (paymentMethod === 'Cash') {

      const res = await createOrder(orderPayload);

      const completedOrderData = {
        ...res.data,
        items: cartItems.map(item => ({
          ...item,
          product: { ...item.product }
        }))
      };

      setCompletedOrder(completedOrderData);

      setCartItems([]);
      setCustomerName('');
      setPaymentMethod('Cash');
      setShowCheckoutModal(false);
      setShowInvoice(true);
      setShowSuccessToast(true);

      fetchProducts();

      setTimeout(() => setShowSuccessToast(false), 3000);

      return;
    }

    // ================================
    // ONLINE PAYMENT (UPI)
    // ================================
    else if (paymentMethod === 'UPI') {
    const razorpayLoaded = await loadRazorpayScript();

    if (!razorpayLoaded) {
      alert('Razorpay SDK failed to load');
      setIsCheckingOut(false);
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,

      amount: Math.round(total * 100),

      currency: 'INR',

      name: 'Grocery Management',

      description: `Order ${orderId}`,

      handler: async function (response) {

        const paymentData = {
          ...orderPayload,
          razorpayPaymentId: response.razorpay_payment_id,
          paymentStatus: 'Paid'
        };

        try {

          const res = await createOrder(paymentData);

          const completedOrderData = {
            ...res.data,
            items: cartItems.map(item => ({
              ...item,
              product: { ...item.product }
            }))
          };

          setCompletedOrder(completedOrderData);

          setCartItems([]);
          setCustomerName('');
          setPaymentMethod('Cash');
          setShowCheckoutModal(false);
          setShowInvoice(true);
          setShowSuccessToast(true);

          fetchProducts();

          setTimeout(() => setShowSuccessToast(false), 3000);

        } catch (err) {
          console.error(err);
          alert('Payment succeeded but order save failed');
        }

      },

      method: {
        upi: true,
        netbanking: true,
        wallet: true
      },

      prefill: {
        name: customerName || 'Walk-in Customer',
      },

      config: {
  display: {
    blocks: {
      upi: {
        name: "Pay using UPI",
        instruments: [
          {
            method: "upi"
          }
        ]
      }
    },

    sequence: ["block.upi"],

    preferences: {
      show_default_blocks: true
    }
  }
},

      theme: {
        color: '#2f8f46'
      }
    };

    const paymentObject = new window.Razorpay(options);

    paymentObject.open();
  }

  } catch (error) {

    console.error(error);

    alert('Checkout failed');

  } finally {
    setIsCheckingOut(false);
  }
};

  const addToCart = (product) => {
    if (product.quantity <= 0) return;

    setCartItems((prevCart) => {
      const existing = prevCart.find((item) => item.product._id === product._id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCartItems((prevCart) => {
      return prevCart.map((item) => {
        if (item.product._id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.product.quantity) return item;
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prevCart) => prevCart.filter((item) => item.product._id !== productId));
  };

  // Computations
  const subtotal = calculateSubtotal(cartItems);
  const gst = calculateGST(subtotal);
  const total = calculateTotal(subtotal, gst);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data.products || []);
      
      const { getCategories } = await import('../services/categoryService');
      const categoryData = await getCategories();
      setCategories(categoryData.data || []);
      
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch products from database
  useEffect(() => {
    fetchProducts();
  }, []);

  // Live categories
  const filterCategories = categories?.length > 0 
    ? ['All', ...categories.map((c) => c.name)]
    : ['All', ...new Set(products?.map(p => getCategoryName(p)).filter(Boolean) || [])];

  // Filter products by search term and selected category
  const filteredProducts = products?.filter((product) => {
    const catName = getCategoryName(product);
    const matchesSearch =
      (product?.productName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (catName.toLowerCase()).includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || catName === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  // Stock status styling helpers
  const getStockBadgeColor = (qty) => {
    if (qty <= 0) {
      return 'text-rose-700 bg-rose-50 border border-rose-100';
    } else if (qty < 10) {
      return 'text-amber-700 bg-amber-50 border border-amber-100';
    } else {
      return 'text-green-700 bg-green-50 border border-green-100';
    }
  };

  const getStockStatusLabel = (qty) => {
    if (qty <= 0) {
      return 'Out of Stock';
    } else if (qty < 10) {
      return `Low Stock (${qty})`;
    } else {
      return 'In Stock';
    }
  };

  const handlePrintReceipt = (order) => {
    setCompletedOrder(order);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <>
    {/* Inject print styles once */}
    {/* Inject print styles once */}
    <div className="space-y-6 animate-fade-in">
      
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172b1f] flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#2f8f46] flex items-center justify-center shadow-sm">
              <ShoppingCart className="w-5.5 h-5.5 text-white" />
            </div>
            Billing & POS
          </h1>
          <p className="text-[#5f6f65] mt-1 text-sm font-medium">Generate customer invoices and record payments</p>
        </div>
      </div>

      {/* ── POS Workspace Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Search, Filters, and Product Cards Grid */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Controls Panel */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            
            {/* Search Input */}
            <div className="relative w-full group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a948d] group-focus-within:text-[#2f8f46] transition-colors" />
              <input
                type="text"
                placeholder="Search products by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-[#172b1f] placeholder-[#8a948d] focus:outline-none focus:border-[#2f8f46] transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#8a948d] hover:text-[#172b1f] transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {filterCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all duration-150 active:scale-95 ${
                    selectedCategory === cat
                      ? 'bg-[#2f8f46] text-white border-transparent shadow-sm'
                      : 'bg-white text-[#5f6f65] border-gray-200 hover:bg-gray-50 hover:text-[#172b1f]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

          </div>

          {/* Product Cards Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-80 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <Loader2 className="w-10 h-10 text-[#2f8f46] animate-spin mb-3" />
              <p className="text-base text-[#5f6f65] font-bold">Loading inventory items...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-80 bg-rose-50 rounded-2xl border border-rose-100 shadow-sm">
              <p className="text-[#9f1239] text-base font-bold">{error}</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <Package className="w-12 h-12 text-[#8a948d] mb-3" />
              <p className="text-xl font-bold text-[#172b1f]">No matching products found</p>
              <p className="text-[#5f6f65] mt-1 text-sm font-medium">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map((prod) => {
                const inCartItem = cartItems.find((item) => item.product._id === prod._id);
                const cartQty = inCartItem ? inCartItem.quantity : 0;
                const remainingStock = prod.quantity - cartQty;
                
                const isOutOfStock = remainingStock <= 0;

                return (
                  <div
                    key={prod._id}
                    className={`group rounded-2xl bg-white border p-4 transition-all duration-200 flex flex-col justify-between select-none ${
                      isOutOfStock
                        ? 'border-gray-100 opacity-60 cursor-not-allowed'
                        : 'border-gray-100 shadow-sm hover:border-[#2f8f46]/40 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
                    }`}
                  >
                    
                    {/* Image Block */}
                    <div className="relative h-28 bg-[#f7f8f6] rounded-xl overflow-hidden flex items-center justify-center mb-3 border border-gray-100">
                      {prod.image ? (
                        <img
                          src={prod.image}
                          alt={prod.productName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                          }}
                        />
                      ) : (
                        <Package className="w-7 h-7 text-[#8a948d]" />
                      )}

                      {/* Stock Status Badge */}
                      <div className="absolute top-2 right-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider ${getStockBadgeColor(remainingStock)}`}>
                          {getStockStatusLabel(remainingStock)}
                        </span>
                      </div>
                    </div>

                    {/* Card Description */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#8a948d] uppercase tracking-wider block">
                          {getCategoryName(prod)}
                        </span>
                        <span className={`text-[10px] font-bold flex items-center gap-1 ${
                          remainingStock <= 0 ? 'text-rose-600' :
                          remainingStock < 10 ? 'text-amber-600' : 
                          cartQty > 0 ? 'text-[#2f8f46]' : 'text-[#5f6f65]'
                        }`}>
                          {remainingStock < 10 && remainingStock > 0 && <AlertTriangle size={10} />}
                          {remainingStock <= 0 ? 'Out of Stock' :
                           cartQty > 0 ? `${remainingStock} left` : 
                           remainingStock < 10 ? `Only ${remainingStock} left` : `Qty: ${prod.quantity}`}
                        </span>
                      </div>
                      <h3 className="font-bold text-[#172b1f] text-sm mt-0.5 group-hover:text-[#2f8f46] transition-colors truncate">
                        {prod.productName}
                      </h3>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-base font-extrabold text-[#172b1f]">
                          {formatCurrency(prod.sellingPrice)}
                        </span>

                        <button
                          disabled={isOutOfStock}
                          onClick={() => addToCart(prod)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs transition-all duration-150 ${
                            isOutOfStock
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-transparent'
                              : 'bg-[#2f8f46] hover:bg-[#26763a] text-white active:scale-95 shadow-sm shadow-[#2f8f46]/10'
                          }`}
                        >
                          <Plus size={12} strokeWidth={3} /> Add
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Sticky Cart Panel */}
        <div className="lg:col-span-4 lg:sticky lg:top-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-10rem)]">
            
            {/* Cart Panel Header */}
            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#5f6f65]" />
                <h2 className="font-bold text-[#172b1f] text-sm">Current Order</h2>
                {cartItems.length > 0 && (
                  <span className="bg-[#2f8f46] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse-slow">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[180px] max-h-[350px]">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center select-none">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3 border border-gray-100">
                    <ShoppingBag className="w-6 h-6 text-[#8a948d]" />
                  </div>
                  <h3 className="text-xs font-bold text-[#172b1f]">Cart is empty</h3>
                  <p className="text-[11px] text-[#5f6f65] mt-1 max-w-[180px] mx-auto leading-relaxed">
                    Select products from the grid on the left to start billing.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {cartItems.map((item) => (
                    <div key={item.product._id} className="flex items-center justify-between py-3 gap-2 group transition-all duration-150">
                      
                      <div className="min-w-0 flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 overflow-hidden">
                          {item.product.image ? (
                            <img src={item.product.image} alt={item.product.productName} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-4 h-4 text-[#8a948d]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-[#172b1f] truncate group-hover:text-[#2f8f46] transition-colors">
                            {item.product.productName}
                          </h4>
                          <p className="text-[10px] text-[#8a948d] mt-0.5">
                            {getCategoryName(item.product)} | {formatCurrency(item.product.sellingPrice)} each
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* +/- Counters */}
                        <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                          <button
                            onClick={() => updateQuantity(item.product._id, -1)}
                            className="p-1 rounded text-[#5f6f65] hover:text-[#172b1f] hover:bg-gray-100 transition-colors"
                          >
                            <Minus size={10} strokeWidth={3} />
                          </button>
                          
                          <span className="text-xs font-bold text-[#172b1f] px-1.5 min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          
                          <button
                            onClick={() => updateQuantity(item.product._id, 1)}
                            disabled={item.quantity >= item.product.quantity}
                            className={`p-1 rounded text-[#5f6f65] hover:text-[#172b1f] hover:bg-gray-100 transition-colors ${
                              item.quantity >= item.product.quantity ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                          >
                            <Plus size={10} strokeWidth={3} />
                          </button>
                        </div>

                        {/* Calculated Subtotal */}
                        <div className="text-right min-w-[60px]">
                          <p className="text-xs font-extrabold text-[#172b1f]">
                            {formatCurrency(item.product.sellingPrice * item.quantity)}
                          </p>
                        </div>

                        {/* Trash delete */}
                        <button
                          onClick={() => removeFromCart(item.product._id)}
                          className="p-1 text-[#8a948d] hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="p-4 bg-gray-50/50 border-t border-gray-100 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#5f6f65]">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#172b1f]">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#5f6f65]">
                  <span>GST (12%)</span>
                  <span className="font-bold text-[#172b1f]">{formatCurrency(gst)}</span>
                </div>
                <div className="flex justify-between text-[#172b1f] text-sm font-bold border-t border-gray-200/80 pt-2 mt-2">
                  <span>Total Amount</span>
                  <span className="text-[#2f8f46] font-extrabold text-base">{formatCurrency(total)}</span>
                </div>
              </div>

              {cartItems.length === 0 ? (
                <button
                  disabled
                  className="w-full py-3 bg-gray-100 text-gray-400 rounded-xl font-bold text-xs cursor-not-allowed opacity-60 flex items-center justify-center gap-1.5"
                >
                  <CreditCard size={14} /> Checkout (Cart Empty)
                </button>
              ) : cartItems.some(item => item.quantity > item.product.quantity) ? (
                <button
                  disabled
                  className="w-full py-3 bg-rose-100 text-rose-500 rounded-xl font-bold text-xs cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle size={14} /> Exceeds Available Stock
                </button>
              ) : (
                <button
                  onClick={() => setShowCheckoutModal(true)}
                  className="w-full py-3 bg-[#2f8f46] hover:bg-[#26763a] text-white rounded-xl font-extrabold text-xs transition-all duration-200 active:scale-95 shadow-md shadow-[#2f8f46]/10 flex items-center justify-center gap-1.5 hover:scale-[1.01] cursor-pointer"
                >
                  <CreditCard size={14} strokeWidth={2.5} /> Checkout ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)
                </button>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* ── CHECKOUT RECEIPT MODAL ───────────────────────────────────────── */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-gray-100 rounded-3xl max-w-lg w-full p-6 text-[#172b1f] shadow-2xl relative animate-slide-up flex flex-col max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="invoice-header-band bg-gradient-to-br from-[#1a5d2e] to-[#2f8f46] rounded-t-3xl px-8 py-6 text-white text-center relative -mx-6 -mt-6 mb-4 shrink-0">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Store className="w-4.5 h-4.5 text-white" />
                </div>
                <h2 className="text-lg font-black tracking-wide">
                  GroceryHub
                </h2>
              </div>
            
              <p className="text-green-200 text-xs font-semibold tracking-widest uppercase">
                Invoice Receipt
              </p>
            
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="no-print absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X size={15} className="text-white" />
              </button>
            </div>

            {/* Input fields */}
            <div className="space-y-4 mb-4">
              {/* Customer Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#5f6f65] uppercase tracking-wider block ml-0.5">
                  Customer Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Walk-in Customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-[#172b1f] placeholder-[#8a948d] focus:outline-none focus:border-[#2f8f46] transition-colors"
                />
              </div>

              {/* Payment Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#5f6f65] uppercase tracking-wider block ml-0.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Cash', icon: Coins, label: 'Cash' },
                    { id: 'UPI', icon: QrCode, label: 'UPI' }
                  ].map((pay) => {
                    const Icon = pay.icon;
                    const isActive = paymentMethod === pay.id;
                    return (
                      <button
                        key={pay.id}
                        onClick={() => setPaymentMethod(pay.id)}
                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border font-bold text-xs transition-all duration-150 active:scale-95 ${
                          isActive
                            ? 'bg-[#dff3e4] text-[#1a5d2e] border-[#2f8f46]/30 shadow-xs scale-102 font-extrabold'
                            : 'bg-white text-[#5f6f65] border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <Icon size={13} />
                        {pay.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Receipt Summary Table */}
            <div className="bg-[#fcfdfc] border border-gray-200 rounded-2xl p-4 font-mono text-[11px] leading-relaxed shadow-sm text-slate-800 border-dashed">
              <div className="space-y-1 mb-3 border-b border-dashed border-gray-200 pb-2 max-h-[140px] overflow-y-auto">
                <div className="flex font-bold text-[#5f6f65] text-[9px] border-b border-gray-100 pb-1 mb-1">
                  <span className="w-1/2">ITEM</span>
                  <span className="w-1/6 text-center">QTY</span>
                  <span className="w-1/6 text-right">RATE</span>
                  <span className="w-1/6 text-right">TOTAL</span>
                </div>
                {cartItems.map((item) => (
                  <div key={item.product._id} className="flex text-slate-700 items-center py-1">
                    <div className="w-1/2 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 overflow-hidden">
                        {item.product.image ? (
                          <img src={item.product.image} alt={item.product.productName} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-3 h-3 text-[#8a948d]" />
                        )}
                      </div>
                      <span className="truncate font-bold text-[#172b1f] text-[10px]">{item.product.productName}</span>
                    </div>
                    <span className="w-1/6 text-center">{item.quantity}</span>
                    <span className="w-1/6 text-right">{(item.product.sellingPrice).toFixed(2)}</span>
                    <span className="w-1/6 text-right font-bold text-[#172b1f]">{(item.product.sellingPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals Summary */}
              <div className="space-y-1 text-[10px] font-bold">
                <div className="flex justify-between text-[#5f6f65]">
                  <span>SUBTOTAL:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#5f6f65]">
                  <span>GST (12.0%):</span>
                  <span>{formatCurrency(gst)}</span>
                </div>
                <div className="flex justify-between text-xs font-black text-[#172b1f] border-t border-gray-200 pt-1.5 mt-1">
                  <span>GRAND TOTAL:</span>
                  <span className="text-[#2f8f46] text-sm">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer Buttons */}
            <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 mt-4">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                disabled={isCheckingOut}
                className="py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-[#5f6f65] hover:text-[#172b1f] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleCompleteOrder}
                disabled={isCheckingOut}
                className="py-2.5 bg-[#2f8f46] hover:bg-[#26763a] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all duration-150 hover:scale-[1.01] active:scale-95 shadow-sm shadow-[#2f8f46]/10 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isCheckingOut ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  'Complete Order'
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── SUCCESS TOAST ──────────────────────────────────────────────── */}
      {showSuccessToast && (
        <div className="fixed top-6 right-6 z-50 animate-fade-in shadow-xl">
          <div className="bg-white border border-[#2f8f46]/20 rounded-xl p-4 flex items-center gap-3 w-72">
            <div className="w-8 h-8 rounded-full bg-[#dff3e4] flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-[#2f8f46]" />
            </div>
            <div>
              <h4 className="text-[#172b1f] font-bold text-sm">Success</h4>
              <p className="text-[#5f6f65] text-xs font-medium">Order completed successfully</p>
            </div>
          </div>
        </div>
      )}

      {/* ── OFFLINE TOAST ──────────────────────────────────────────────── */}
      {showOfflineToast && (
        <div className="fixed top-6 right-6 z-50 animate-fade-in shadow-xl">
          <div className="bg-white border border-amber-500/20 rounded-xl p-4 flex items-center gap-3 w-72">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="text-[#172b1f] font-bold text-sm">Offline Mode</h4>
              <p className="text-[#5f6f65] text-xs font-medium">Saved locally (offline mode)</p>
            </div>
          </div>
        </div>
      )}

    </div>

      {/* ── STOCK ERROR TOAST ──────────────────────────────────────────── */}
      {stockError && (
        <div className="fixed top-6 right-6 z-50 animate-fade-in shadow-xl">
          <div className="bg-white border border-rose-500/20 rounded-xl p-4 flex items-center gap-3 w-72">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h4 className="text-[#172b1f] font-bold text-sm">Checkout Failed</h4>
              <p className="text-[#5f6f65] text-xs font-medium">{stockError}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── INVOICE / RECEIPT MODAL ─────────────────────────────────────── */}
      <InvoiceModal
        isOpen={showInvoice}
        order={completedOrder}
        onClose={() => setShowInvoice(false)}
        onPrint={() => handlePrintReceipt(completedOrder)}
      />

      {completedOrder && (
        <div className="hidden print:block print-area bg-white text-black p-6">
          <InvoiceReceipt order={completedOrder} />
        </div>
      )}
    </>
  );
};

export default BillingPage;