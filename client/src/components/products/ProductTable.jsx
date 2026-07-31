import React from 'react';
import { Edit2, Trash2, Package, AlertTriangle } from 'lucide-react';
import { getCategoryName } from '../../utils/categoryHelpers';
import { getSupplierName } from '../../utils/supplierHelpers';

const ProductTable = ({ filteredProducts, getStockStatusColor, handleEditClick, handleDeleteClick, suppliers = [] }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Desktop/Tablet Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="py-4 px-6 font-bold text-[#5f6f65] text-[10px] uppercase tracking-wider">Product Name</th>
              <th className="py-4 px-6 font-bold text-[#5f6f65] text-[10px] uppercase tracking-wider">Category</th>
              <th className="py-4 px-6 font-bold text-[#5f6f65] text-[10px] uppercase tracking-wider">Supplier</th>
              <th className="py-4 px-6 font-bold text-[#5f6f65] text-[10px] uppercase tracking-wider">Price</th>
              <th className="py-4 px-6 font-bold text-[#5f6f65] text-[10px] uppercase tracking-wider">Quantity</th>
              <th className="py-4 px-6 font-bold text-[#5f6f65] text-[10px] uppercase tracking-wider">Stock Status</th>
              <th className="py-4 px-6 font-bold text-[#5f6f65] text-[10px] uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredProducts.map((product) => (
              <tr key={product._id || product.id} className={`transition-colors duration-100 group ${product.quantity < 10 ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-gray-50'}`}>
                <td className="py-3 px-6 font-bold text-[#172b1f]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {product.image ? (
                        <img 
                          src={product?.image} 
                          alt={product?.productName || "Product"} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/40?text=NA';
                          }}
                        />
                      ) : (
                        <Package className="w-4.5 h-4.5 text-[#8a948d]" />
                      )}
                    </div>
                    <span className="text-sm group-hover:text-[#2f8f46] transition-colors">{product.productName}</span>
                  </div>
                </td>
                <td className="py-3 px-6">
                  <span className="px-2 py-0.5 bg-gray-50 text-[#5f6f65] rounded-lg text-[9px] font-bold uppercase tracking-wider border border-gray-100">
                    {getCategoryName(product)}
                  </span>
                </td>
                <td className="py-3 px-6">
                  <span className="text-xs font-semibold text-[#5f6f65]">
                    {getSupplierName(product, suppliers)}
                  </span>
                </td>
                <td className="py-3 px-6 text-[#172b1f] font-bold text-sm">
                  ₹{Number(product.sellingPrice).toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-6 text-[#5f6f65] font-medium text-sm">
                  <div className="flex items-center gap-1.5">
                    <span>{product.quantity} <span className="text-[#8a948d] text-xs">{product.unit}</span></span>
                    {product.quantity < 10 && <AlertTriangle size={14} className="text-amber-500" title="Low Stock" />}
                  </div>
                </td>
                <td className="py-3 px-6">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${getStockStatusColor(product.stockStatus)}`}>
                    {product.stockStatus || 'Unknown'}
                  </span>
                </td>
                <td className="py-3 px-6 text-right">
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => handleEditClick(product)}
                      className="p-1.5 bg-white hover:bg-green-50 text-[#8a948d] hover:text-[#1a5d2e] rounded-lg transition-colors border border-gray-100 hover:border-green-100"
                      title="Edit Product"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(product)}
                      className="p-1.5 bg-white hover:bg-rose-50 text-[#8a948d] hover:text-rose-700 rounded-lg transition-colors border border-gray-100 hover:border-rose-100"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-50">
        {filteredProducts.map((product) => (
          <div key={product._id || product.id} className={`p-4 transition-colors duration-100 ${product.quantity < 10 ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-gray-50'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {product.image ? (
                    <img 
                      src={product?.image} 
                      alt={product?.productName || "Product"} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/40?text=NA';
                      }}
                    />
                  ) : (
                    <Package className="w-5 h-5 text-[#8a948d]" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-[#172b1f] text-sm leading-tight">{product.productName}</h3>
                  <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-gray-50 rounded-lg text-[9px] font-bold uppercase tracking-wider text-[#5f6f65] border border-gray-100">
                    {getCategoryName(product)}
                  </span>
                  
                  <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 mt-1">
                    <span className="text-xs font-semibold text-[#5f6f65]">
                      {getSupplierName(product, suppliers)}
                    </span>
                  </div>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${getStockStatusColor(product.stockStatus)}`}>
                {product.stockStatus || 'Unknown'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-gray-50/50 rounded-xl p-2.5 border border-gray-100/50">
                <p className="text-[9px] uppercase font-bold text-[#8a948d] tracking-wider mb-0.5">Price</p>
                <p className="text-sm font-bold text-[#1a5d2e]">₹{Number(product.sellingPrice).toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-gray-50/50 rounded-xl p-2.5 border border-gray-100/50">
                <p className="text-[9px] uppercase font-bold text-[#8a948d] tracking-wider mb-0.5">Quantity</p>
                <p className="text-sm font-bold text-[#172b1f] flex items-center gap-1.5">
                  {product.quantity} <span className="text-[#8a948d] font-medium text-xs">{product.unit}</span>
                  {product.quantity < 10 && <AlertTriangle size={14} className="text-amber-500" />}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEditClick(product)}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-white hover:bg-green-50 text-[#1a5d2e] rounded-xl transition-colors border border-gray-100 hover:border-green-100 font-bold text-xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => handleDeleteClick(product)}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-white hover:bg-rose-50 text-rose-700 rounded-xl transition-colors border border-gray-100 hover:border-rose-100 font-bold text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductTable;
