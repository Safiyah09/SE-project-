import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Calendar,
  Package,
  Receipt,
  Store,
  X,
  Printer,
  ChevronRight,
  ShoppingCart,
  Download,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency, formatInvoiceDate } from '../utils/invoiceHelpers';
import InvoiceModal from '../components/InvoiceModal';
import InvoiceReceipt from '../components/InvoiceReceipt';
import { getOrders, getSalesAnalytics } from '../services/orderService';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#2f8f46', '#3b82f6'];

const SalesPage = () => {
  // Frontend state for now
  const [orders, setOrders] = useState([]);
  const [salesAnalytics, setSalesAnalytics] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const [ordersRes, analyticsRes] = await Promise.all([
          getOrders(),
          getSalesAnalytics()
        ]);
        setOrders(ordersRes.data || []);
        setSalesAnalytics(analyticsRes.data);
        setError(null);
      } catch (err) {
        console.error('Failed to load orders from backend, falling back to local storage', err);
        setError('Failed to load live data. Showing offline records.');
        const savedSalesJSON = localStorage.getItem('freshledger_sales');
        if (savedSalesJSON) {
          setOrders(JSON.parse(savedSalesJSON));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchSearch = order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPayment = paymentFilter === 'All' || order.paymentMethod === paymentFilter;
    
    // Date filter logic
    let matchDate = true;
    if (selectedDate) {
      const orderDateStr = new Date(order.createdAt).toISOString().split('T')[0];
      matchDate = orderDateStr === selectedDate;
    }

    return matchSearch && matchPayment && matchDate;
  });

  const handleExportCSV = () => {
    if (filteredOrders.length === 0) return;
    
    // Create CSV Headers
    const headers = ['Order ID', 'Customer', 'Date', 'Payment Method', 'Items Count', 'Total Amount'];
    
    // Create CSV Rows
    const rows = filteredOrders.map(order => [
      order.orderId,
      `"${order.customerName}"`,
      new Date(order.createdAt).toLocaleDateString('en-US'),
      order.paymentMethod,
      order.items?.length || 0,
      order.total
    ]);
    
    // Combine to single string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `sales-report-${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewInvoice = (order) => {
    setSelectedOrder(order);
    setShowInvoiceModal(true);
  };

  const handlePrintInvoice = (order) => {
    setSelectedOrder(order);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const paymentDistributionData = (salesAnalytics?.paymentDistribution || []).filter(
    (entry) => entry.name !== 'Card'
  );

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        
        {/* 1. Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#172b1f] flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-[#2f8f46] flex items-center justify-center shadow-sm">
                <History className="w-5.5 h-5.5 text-white" />
              </div>
              Sales History
            </h1>
            <p className="text-[#5f6f65] mt-1 text-sm font-medium">View and manage past transactions and invoices</p>
          </div>
        </div>

        {/* 2. Error Banner */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-800">Connection Error</h3>
              <p className="text-xs font-medium text-amber-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* 2.5 Analytics Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-2">
          {/* Payment Method Distribution */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm animate-slide-up">
            <div className="mb-4">
              <h3 className="text-base font-bold text-[#172b1f]">Payment Methods</h3>
              <p className="text-[10px] text-[#8a948d] mt-1 font-bold uppercase tracking-wider">Distribution</p>
            </div>
            {loading ? (
              <div className="h-56 bg-gray-50 rounded-xl animate-pulse" />
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#172b1f', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex justify-center gap-4 mt-2">
              {paymentDistributionData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-xs font-bold text-[#5f6f65]">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Revenue Trend */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 animate-slide-up">
            <div className="mb-4">
              <h3 className="text-base font-bold text-[#172b1f]">Weekly Revenue Trend</h3>
              <p className="text-[10px] text-[#8a948d] mt-1 font-bold uppercase tracking-wider">Sales performance</p>
            </div>
            {loading ? (
              <div className="h-[248px] bg-gray-50 rounded-xl animate-pulse" />
            ) : (
              <div className="h-[248px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesAnalytics?.revenueByDay || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8a948d', fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8a948d', fontWeight: 600 }} tickFormatter={(val) => `₹${val/1000}k`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#172b1f', fontWeight: 'bold' }}
                      formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#2f8f46" strokeWidth={3} dot={{ fill: '#2f8f46', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* 3. Search + Filter Row */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:max-w-md group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a948d] group-focus-within:text-[#2f8f46] transition-colors" />
            <input
              type="text"
              placeholder="Search by Order ID or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#172b1f] placeholder-[#8a948d] focus:outline-none focus:border-[#2f8f46] focus:bg-white transition-colors"
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

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-40">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8a948d]" />
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#5f6f65] focus:outline-none focus:border-[#2f8f46] focus:bg-white transition-colors appearance-none"
              >
                <option value="All">All Payments</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
              </select>
            </div>

            <div className="relative flex-1 md:w-40 group">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8a948d] group-focus-within:text-[#2f8f46] transition-colors" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#5f6f65] focus:outline-none focus:border-[#2f8f46] focus:bg-white transition-colors appearance-none"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8a948d] hover:text-[#172b1f] transition-colors"
                  title="Clear Date"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredOrders.length === 0}
              className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 text-[#172b1f] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors hidden sm:flex shrink-0 shadow-sm"
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        {/* 4. Sales Table & Empty State */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-[#8a948d] font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4 text-center">Items</th>
                  <th className="px-6 py-4 text-right">Total Amount</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Loader2 className="w-8 h-8 text-[#2f8f46] animate-spin mb-4" />
                        <p className="text-sm font-bold text-[#172b1f]">Loading sales data...</p>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center select-none">
                        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 border border-gray-100">
                          <Receipt className="w-8 h-8 text-[#8a948d]" />
                        </div>
                        <h3 className="text-sm font-bold text-[#172b1f]">No sales recorded yet</h3>
                        <p className="text-xs text-[#5f6f65] mt-1 max-w-[200px] leading-relaxed">
                          Completed orders from the Billing page will appear here.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-[#5f6f65] text-sm font-bold">
                      No matching orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.orderId} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-black text-[#172b1f]">{order.orderId}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-[#5f6f65]">{order.customerName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-[#8a948d]">{formatInvoiceDate(order.createdAt)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                          order.paymentMethod === 'Cash' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          order.paymentMethod === 'UPI' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          'bg-purple-50 text-purple-700 border-purple-100'
                        }`}>
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-extrabold text-[#5f6f65]">{order.items?.length || 0}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-black text-[#1a5d2e]">{formatCurrency(order.total)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewInvoice(order)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition"
                            title="View Invoice"
                          >
                            <Receipt className="w-5 h-5 text-slate-600" />
                          </button>
                          <button
                            onClick={() => handlePrintInvoice(order)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition"
                            title="Print Invoice"
                          >
                            <Printer className="w-5 h-5 text-slate-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── REUSABLE INVOICE MODAL ─────────────────────────────────────── */}
        <InvoiceModal
          isOpen={showInvoiceModal}
          order={selectedOrder}
          onClose={() => setShowInvoiceModal(false)}
          onPrint={() => handlePrintInvoice(selectedOrder)}
        />

        {/* ── HIDDEN PRINTABLE INVOICE ───────────────────────────────────── */}
        {selectedOrder && (
          <div className="hidden print:block print-area bg-white text-black p-6">
            <InvoiceReceipt order={selectedOrder} />
          </div>
        )}
      </div>
    </>
  );
};

export default SalesPage;
