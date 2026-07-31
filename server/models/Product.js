const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      enum: {
        values: ['kg', 'g', 'ltr', 'ml', 'pcs', 'dozen', 'pack', 'box', 'bottle', 'bag'],
        message: '{VALUE} is not a valid unit',
      },
    },
    buyingPrice: {
      type: Number,
      required: [true, 'Buying price is required'],
      min: [0, 'Buying price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
    },
    supplier: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Supplier',
      default: null,
    },
    barcode: {
      type: String,
      unique: true,
      sparse: true,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, 'Low stock threshold cannot be negative'],
    },
    stockStatus: {
      type: String,
      enum: ['In Stock', 'Low Stock', 'Out of Stock'],
      default: 'In Stock',
    },
    image: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtual: Profit Margin ────────────────────────────────────────────────────
productSchema.virtual('profitMargin').get(function () {
  if (!this.sellingPrice || this.sellingPrice === 0) return 0;
  return (((this.sellingPrice - this.buyingPrice) / this.sellingPrice) * 100).toFixed(2);
});

// ── Virtual: Is Expired ───────────────────────────────────────────────────────
productSchema.virtual('isExpired').get(function () {
  if (!this.expiryDate) return false;
  return new Date() > new Date(this.expiryDate);
});

// ── Virtual: Days Until Expiry ────────────────────────────────────────────────
productSchema.virtual('daysUntilExpiry').get(function () {
  if (!this.expiryDate) return null;
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diff = expiry - today;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// ── Pre-save Hook: Auto-compute stockStatus ───────────────────────────────────
productSchema.pre('save', function (next) {
  if (this.quantity === 0) {
    this.stockStatus = 'Out of Stock';
  } else if (this.quantity <= this.lowStockThreshold) {
    this.stockStatus = 'Low Stock';
  } else {
    this.stockStatus = 'In Stock';
  }
  next();
});

// ── Pre-findOneAndUpdate Hook: Auto-compute stockStatus on updates ─────────────
productSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.quantity !== undefined || update.$set?.quantity !== undefined) {
    const qty = update.quantity ?? update.$set?.quantity;
    const threshold = update.lowStockThreshold ?? update.$set?.lowStockThreshold ?? 10;
    let status;
    if (qty === 0) {
      status = 'Out of Stock';
    } else if (qty <= threshold) {
      status = 'Low Stock';
    } else {
      status = 'In Stock';
    }
    if (update.$set) {
      update.$set.stockStatus = status;
    } else {
      update.stockStatus = status;
    }
  }
  next();
});

// ── Indexes ───────────────────────────────────────────────────────────────────
productSchema.index({ productName: 'text', barcode: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ stockStatus: 1 });
productSchema.index({ expiryDate: 1 });
productSchema.index({ isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
