export const formatCurrency = (value) => {
  return '₹' + Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const calculateSubtotal = (cartItems) => {
  if (!cartItems || !Array.isArray(cartItems)) return 0;
  return cartItems.reduce((acc, item) => acc + (item.product.sellingPrice * item.quantity), 0);
};

export const calculateGST = (subtotal) => {
  return subtotal * 0.12;
};

export const calculateTotal = (subtotal, gst) => {
  return subtotal + gst;
};

export const generateOrderId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FL-${timestamp}-${random}`;
};

export const formatInvoiceDate = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(new Date(date));
};
