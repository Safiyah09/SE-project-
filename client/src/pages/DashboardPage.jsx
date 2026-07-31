import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, ShoppingCart, TrendingUp, AlertTriangle,
  ArrowUpRight, ArrowDownRight, MoreHorizontal,
  RefreshCw, ChevronRight, Folder,
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { productService } from '../api/axios';
import { getSalesAnalytics } from '../services/orderService';
import { getCategoryName } from '../utils/categoryHelpers';

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ title, value, subtitle, Icon, color, trend, trendUp }) {
  const colorMap = {
    emerald: 'bg-green-50 text-green-700',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-rose-50 text-rose-700',
    violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-colors duration-150 group animate-slide-up">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-150 ${colorMap[color] || colorMap.emerald}`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-lg ${trendUp ? 'text-green-700 bg-green-50' : 'text-rose-700 bg-rose-50'}`}>
            {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-[#172b1f] tracking-tight">{value}</p>
      <p className="text-[11px] font-bold text-[#5f6f65] mt-1 uppercase tracking-wider">{title}</p>
      {subtitle && <p className="text-[10px] text-[#8a948d] mt-1 font-medium">{subtitle}</p>}
    </div>
  );
}

const stockBadge = {
  'In Stock': 'text-green-700 bg-green-50 border-green-100',
  'Low Stock': 'text-amber-700 bg-amber-50 border-amber-100',
  'Out of Stock': 'text-rose-700 bg-rose-50 border-rose-100',
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [alerts, setAlerts] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [salesAnalytics, setSalesAnalytics] = useState(null);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      setAnalyticsError(null);
      const [alertRes, prodRes, analyticsRes, categoryRes] = await Promise.all([
        productService.getLowStock(),
        productService.getAll({ limit: 6, sortBy: 'createdAt', order: 'desc' }),
        getSalesAnalytics().catch(e => { throw { source: 'analytics', error: e }; }),
        import('../services/categoryService').then(m => m.getCategories())
      ]);
      setAlerts(alertRes.data.data || []);
      setProducts(prodRes.data.products || []);
      setSalesAnalytics(analyticsRes.data);
      setCategories(categoryRes.data || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      if (err.source === 'analytics') {
        setAnalyticsError('Failed to load analytics');
      }
    } finally {
      setLoadingAlerts(false);
      setLoadingAnalytics(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const stats = [
    {
      title: 'Total Revenue',
      value: `₹ ${Number(salesAnalytics?.totalRevenue || 0).toLocaleString('en-IN')}`,
      subtitle: 'All time earnings',
      Icon: TrendingUp,
      color: 'blue',
      trend: 12, trendUp: true,
    },
    {
      title: 'Total Orders',
      value: salesAnalytics?.totalOrders || '0',
      subtitle: 'Bills generated',
      Icon: ShoppingCart,
      color: 'violet',
      trend: 8, trendUp: true,
    },
    {
      title: 'Today\'s Sales',
      value: `₹ ${Number(salesAnalytics?.todaySales || 0).toLocaleString('en-IN')}`,
      subtitle: `${salesAnalytics?.todayOrders || 0} orders today`,
      Icon: Package,
      color: 'emerald',
      trend: 4, trendUp: false,
    },

    {
      title: 'Total Categories',
      value: categories.length.toString(),
      subtitle: 'Active catalogs',
      Icon: Folder,
      color: 'emerald',
      trend: 2, trendUp: true,
    },
  ];

  const COLORS = ['#2f8f46', '#f59e0b', '#e11d48', '#3b82f6', '#8b5cf6', '#14b8a6', '#64748b'];

  const categoryPieData = categories.map((cat) => ({
    name: cat.name,
    value: cat.totalProducts || 0
  })).filter(d => d.value > 0);

  return (
    <div className="space-y-5">

      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-[#172b1f] tracking-tight">Dashboard</h1>
          <p className="text-[#5f6f65] text-sm mt-0.5 font-medium">Welcome back! Here's what's happening today.</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:border-[#2f8f46] hover:text-[#2f8f46] text-[#5f6f65] px-3.5 py-2 rounded-xl text-xs font-bold transition-colors duration-150 shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Low Stock Alert Banner ─────────────────────────────────────── */}
      {alerts && alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-4 animate-fade-in shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-amber-700" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-amber-900 font-medium leading-tight">
              <strong className="font-bold">{alerts.length} item(s)</strong> are running low on stock.
            </p>
          </div>
          <Link to="/products" className="bg-white px-3.5 py-1.5 rounded-xl text-amber-700 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-100 transition-colors shadow-sm">
            Restock Now <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* ── Stat Cards ─────────────────────────────────────────────────── */}
      {loadingAnalytics ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm animate-pulse">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100" />
                <div className="w-12 h-5 rounded-lg bg-gray-100" />
              </div>
              <div className="w-24 h-8 rounded-lg bg-gray-100 mb-2" />
              <div className="w-32 h-4 rounded-lg bg-gray-100 mb-1.5" />
              <div className="w-20 h-3 rounded-lg bg-gray-100" />
            </div>
          ))}
        </div>
      ) : analyticsError ? (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
          <AlertTriangle className="w-8 h-8 text-rose-600 mb-2" />
          <h3 className="font-bold text-[#172b1f] text-sm">Failed to load analytics</h3>
          <p className="text-[#5f6f65] text-xs mt-1 mb-3">There was a problem connecting to the server.</p>
          <button 
            onClick={() => fetchData(true)}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((s) => <StatCard key={s.title} {...s} />)}
        </div>
      )}

      {/* ── Charts + Alerts Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Revenue Area Chart */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 animate-slide-up">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h3 className="text-base font-bold text-[#172b1f]">Revenue Overview</h3>
              <p className="text-[10px] text-[#8a948d] mt-1 font-bold uppercase tracking-wider">Weekly earnings trend</p>
            </div>
            <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>
          {loadingAnalytics ? (
            <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesAnalytics?.revenueByDay || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2f8f46" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2f8f46" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8a948d', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8a948d', fontWeight: 600 }} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#172b1f', fontWeight: 'bold' }}
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#2f8f46" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Low Stock Alerts Widget */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm animate-slide-up max-h-[400px] overflow-y-auto">
          <div className="flex justify-between items-start mb-5 sticky top-0 bg-white z-10 pb-2">
            <div>
              <h3 className="text-base font-bold text-[#172b1f]">Low Stock Alerts</h3>
              <p className="text-[10px] text-[#8a948d] mt-1 font-bold uppercase tracking-wider">Quantity &lt; 10</p>
            </div>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-lg text-[9px] font-bold uppercase border border-amber-100">
              {alerts?.length ?? 0}
            </span>
          </div>
          <div className="space-y-2.5">
            {loadingAlerts ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : alerts?.length > 0 ? (
              alerts.map((p) => (
                <div key={p._id} className="flex items-center justify-between gap-3 p-2.5 bg-gray-50/50 rounded-xl border border-gray-100 transition-colors hover:bg-white hover:shadow-sm group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                      {p.image ? (
                        <img src={p?.image} alt={p?.productName || "Product"} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={16} className="text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#172b1f] truncate group-hover:text-amber-600 transition-colors">{p.productName}</p>
                      <p className="text-[9px] text-amber-700 font-bold uppercase mt-0.5 tracking-wider">Only {p.quantity} left</p>
                    </div>
                  </div>
                  <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-emerald-50/50 rounded-2xl border border-emerald-100 border-dashed">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                  <Package size={18} className="text-emerald-600" />
                </div>
                <p className="text-xs text-[#172b1f] font-bold">Inventory levels are healthy</p>
                <p className="text-[10px] text-[#8a948d] font-medium mt-0.5">No low stock items</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Additional Charts Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Orders Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm animate-slide-up">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h3 className="text-base font-bold text-[#172b1f]">Orders by Day</h3>
              <p className="text-[10px] text-[#8a948d] mt-1 font-bold uppercase tracking-wider">Weekly transaction volume</p>
            </div>
            <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>
          {loadingAnalytics ? (
            <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesAnalytics?.ordersByDay || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8a948d', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8a948d', fontWeight: 600 }} />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#172b1f', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="orders" fill="#2f8f46" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        
        {/* Category Distribution Chart */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm animate-slide-up">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h3 className="text-base font-bold text-[#172b1f]">Category Distribution</h3>
              <p className="text-[10px] text-[#8a948d] mt-1 font-bold uppercase tracking-wider">Products per category</p>
            </div>
            <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>
          {loadingAnalytics ? (
            <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <div className="h-64 w-full flex items-center justify-center">
              {categoryPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#172b1f', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-[#8a948d] text-sm font-bold">No category data available</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Products Table ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm animate-slide-up overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
          <div>
            <h3 className="text-base font-bold text-[#172b1f]">Recently Added Products</h3>
            <p className="text-[10px] text-[#8a948d] mt-1 font-bold uppercase tracking-wider">Latest inventory additions</p>
          </div>
          <Link
            to="/products"
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-[10px] font-bold text-[#2f8f46] hover:bg-green-50 hover:border-green-200 transition-colors shadow-sm flex items-center gap-1"
          >
            View All <ChevronRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          {loadingAlerts ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3 border border-gray-100">
                <Package size={20} className="text-[#8a948d]" />
              </div>
              <p className="text-[#172b1f] font-bold text-sm">No products yet</p>
              <p className="text-[#8a948d] text-xs mt-1 font-medium">Add your first product to get started</p>
              <Link to="/products" className="btn-primary mt-4 py-2 px-4 text-xs font-bold">
                Add Product
              </Link>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/30 border-b border-gray-100">
                  <th className="py-3 px-5 text-[10px] font-bold text-[#5f6f65] uppercase tracking-wider">#</th>
                  <th className="py-3 px-5 text-[10px] font-bold text-[#5f6f65] uppercase tracking-wider">Product</th>
                  <th className="py-3 px-5 text-[10px] font-bold text-[#5f6f65] uppercase tracking-wider">Category</th>
                  <th className="py-3 px-5 text-[10px] font-bold text-[#5f6f65] uppercase tracking-wider">Qty</th>
                  <th className="py-3 px-5 text-[10px] font-bold text-[#5f6f65] uppercase tracking-wider">Price</th>
                  <th className="py-3 px-5 text-[10px] font-bold text-[#5f6f65] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p, idx) => (
                  <tr key={p._id} className="hover:bg-gray-50/30 transition-colors duration-100 group">
                    <td className="py-3 px-5 text-[#8a948d] font-bold text-[11px]">{idx + 1}</td>
                    <td className="py-3 px-5">
                      <p className="font-bold text-[#172b1f] group-hover:text-[#2f8f46] transition-colors text-sm leading-tight">{p.productName}</p>
                      <p className="text-[9px] text-[#8a948d] font-bold uppercase mt-0.5 tracking-wider">{p.barcode || '—'}</p>
                    </td>
                    <td className="py-3 px-5">
                      <span className="px-2 py-0.5 bg-gray-100 text-[#5f6f65] rounded-lg text-[9px] font-bold uppercase border border-gray-200/50">
                        {getCategoryName(p)}
                      </span>
                    </td>
                    <td className="py-3 px-5 font-bold text-[#172b1f] text-sm">
                      {p.quantity} <span className="text-[#8a948d] font-medium text-[10px]">{p.unit}</span>
                    </td>
                    <td className="py-3 px-5 font-bold text-[#172b1f] text-sm">
                      ₹{p.sellingPrice?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-5">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border ${stockBadge[p.stockStatus] || 'bg-gray-100 text-[#5f6f65] border-gray-100'}`}>
                        {p.stockStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>



    </div>
  );
}
