import React from 'react';
import { Store, X, Printer, Package, Receipt } from 'lucide-react';
import { formatCurrency, formatInvoiceDate } from '../utils/invoiceHelpers';

const InvoiceReceipt = ({ order, onPrint, onClose }) => {
  if (!order) return null;

  const dateStr = order.createdAt || order.dateTime;

  return (
    <div className="invoice-card bg-white rounded-3xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
      {/* ── Receipt Header Band ── */}
      <div 
        className="invoice-header-band bg-gradient-to-br from-[#1a5d2e] to-[#2f8f46] rounded-t-3xl px-8 py-6 text-white text-center relative shrink-0"
        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <Store className="w-4.5 h-4.5 text-white" />
          </div>
          <h2 className="text-lg font-black tracking-wide">GroceryHub</h2>
        </div>
      
        <p className="text-green-200 text-xs font-semibold tracking-widest uppercase">
          Invoice Receipt
        </p>
      
        {onClose && (
          <button
            onClick={onClose}
            className="no-print absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X size={15} className="text-white" />
          </button>
        )}
      </div>

      {/* ── Receipt Body ── */}
      <div className="overflow-y-auto flex-1">
        <div className="px-8 py-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#f7f9f7] rounded-2xl p-3 border border-gray-100">
            <p className="text-[9px] font-bold text-[#8a948d] uppercase tracking-wider mb-0.5">Order ID</p>
            <p className="text-xs font-black text-[#172b1f] font-mono">{order.orderId}</p>
          </div>
          <div className="bg-[#f7f9f7] rounded-2xl p-3 border border-gray-100">
            <p className="text-[9px] font-bold text-[#8a948d] uppercase tracking-wider mb-0.5">Date & Time</p>
            <p className="text-[10px] font-bold text-[#172b1f] leading-tight">{formatInvoiceDate(dateStr)}</p>
          </div>
          <div className="bg-[#f7f9f7] rounded-2xl p-3 border border-gray-100">
            <p className="text-[9px] font-bold text-[#8a948d] uppercase tracking-wider mb-0.5">Customer</p>
            <p className="text-xs font-bold text-[#172b1f] truncate">{order.customerName}</p>
          </div>
          <div className="bg-[#f7f9f7] rounded-2xl p-3 border border-gray-100">
            <p className="text-[9px] font-bold text-[#8a948d] uppercase tracking-wider mb-0.5">Payment</p>
            <p className="text-xs font-bold text-[#172b1f]">{order.paymentMethod}</p>
          </div>
        </div>

        <div className="border-t-2 border-dashed border-gray-200" />

        <div>
          <p className="text-[9px] font-bold text-[#8a948d] uppercase tracking-widest mb-2">Purchased Items</p>
          <div className="bg-[#fcfdfc] border border-gray-100 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-1 px-4 py-2 bg-gray-50 border-b border-gray-100">
              <span className="col-span-5 text-[9px] font-extrabold text-[#5f6f65] uppercase tracking-wider">Product</span>
              <span className="col-span-2 text-[9px] font-extrabold text-[#5f6f65] uppercase tracking-wider text-center">Qty</span>
              <span className="col-span-2 text-[9px] font-extrabold text-[#5f6f65] uppercase tracking-wider text-right">Price</span>
              <span className="col-span-3 text-[9px] font-extrabold text-[#5f6f65] uppercase tracking-wider text-right">Subtotal</span>
            </div>
            <div className="divide-y divide-gray-50">
              {order?.items?.map((item, index) => {
                const productName = item.productName || item.product?.productName || "Unknown Item";
                const price = item.price || item.product?.sellingPrice || 0;
                const image = item.image || item.product?.image;

                return (
                  <div key={index} className="grid grid-cols-12 gap-1 px-4 py-2.5 items-center">
                    <div className="col-span-5 flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 overflow-hidden">
                        {image ? (
                          <img src={image} alt={productName} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-3.5 h-3.5 text-[#8a948d]" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-[#172b1f] truncate">{productName}</span>
                    </div>
                    <span className="col-span-2 text-[10px] font-bold text-[#5f6f65] text-center">{item.quantity}</span>
                    <span className="col-span-2 text-[10px] font-semibold text-[#5f6f65] text-right">
                      ₹{Number(price).toFixed(2)}
                    </span>
                    <span className="col-span-3 text-[10px] font-extrabold text-[#172b1f] text-right">
                      ₹{(price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t-2 border-dashed border-gray-200" />

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#5f6f65] font-semibold">Subtotal</span>
            <span className="text-xs font-bold text-[#172b1f]">{formatCurrency(order.subtotal || 0)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#5f6f65] font-semibold">GST</span>
            <span className="text-xs font-bold text-[#172b1f]">{formatCurrency(order.gst || 0)}</span>
          </div>
          <div className="flex justify-between items-center bg-[#dff3e4] rounded-xl px-4 py-2.5 mt-1">
            <span className="text-sm font-extrabold text-[#1a5d2e]">Grand Total</span>
            <span className="text-base font-black text-[#2f8f46]">{formatCurrency(order.totalAmount || order.total || 0)}</span>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          Thank you for shopping with us
        </div>

        {onClose && (
          <div className="no-print grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => (onPrint ? onPrint() : window.print())}
              className="flex items-center justify-center gap-2 py-3 bg-[#2f8f46] hover:bg-[#26763a] text-white font-extrabold text-xs rounded-2xl transition-all duration-150 active:scale-95 shadow-md shadow-[#2f8f46]/20 hover:scale-[1.01] cursor-pointer"
            >
              <Printer size={14} strokeWidth={2.5} />
              Print Invoice
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-[#5f6f65] hover:text-[#172b1f] font-bold text-xs rounded-2xl transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <X size={14} />
              Close
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default InvoiceReceipt;
