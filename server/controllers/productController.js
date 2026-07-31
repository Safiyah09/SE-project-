const Product = require('../models/Product');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');
const { validationResult } = require('express-validator');
const fs = require('fs');
const csv = require('csv-parser');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Add a new product
// @route   POST /api/products
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const addProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((e) => e.msg),
      });
    }

    const productData = { ...req.body, addedBy: req.user._id };
    const product = await Product.create(productData);
    await product.populate('category', 'name');

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      product,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all products with search, filter, pagination
// @route   GET /api/products
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const getAllProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      stockStatus,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (category)    filter.category    = category;
    if (stockStatus) filter.stockStatus = stockStatus;

    // Text search across productName, barcode, category
    if (search) {
      const Category = require('../models/Category');
      const matchingCategories = await Category.find({ name: { $regex: search, $options: 'i' } }).select('_id');
      const categoryIds = matchingCategories.map(c => c._id);

      filter.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { barcode:     { $regex: search, $options: 'i' } },
        { category:    { $in: categoryIds } },
      ];
    }

    // Pagination
    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    // Sort direction
    const sortOrder = order === 'asc' ? 1 : -1;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .populate('addedBy', 'name email')
        .populate('category', 'name'),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count:      products.length,
      total,
      page:       pageNum,
      totalPages: Math.ceil(total / limitNum),
      products,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('addedBy', 'name email')
      .populate('category', 'name');

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const updateProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((e) => e.msg),
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('category', 'name');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: updated,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Soft-delete a product (set isActive = false)
// @route   DELETE /api/products/:id
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Soft delete — preserve data for billing history
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update product stock quantity
// @route   PATCH /api/products/:id/stock
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const updateStock = async (req, res, next) => {
  try {
    const { quantity, operation } = req.body; // operation: 'set' | 'add' | 'subtract'

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required',
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let newQty = product.quantity;
    if (operation === 'add') {
      newQty = product.quantity + quantity;
    } else if (operation === 'subtract') {
      newQty = Math.max(0, product.quantity - quantity);
    } else {
      newQty = quantity; // default: 'set'
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { quantity: newQty } },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      product: updated,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get low stock products
// @route   GET /api/products/alerts/low-stock
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const getLowStockProducts = async (req, res, next) => {
  try {
    const lowStockProducts = await Product.find({
      isActive: true,
      quantity: { $lt: 10 }
    }).sort({ quantity: 1 });

    res.status(200).json({
      success: true,
      data: lowStockProducts
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all distinct categories
// @route   GET /api/products/meta/categories
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    res.status(200).json({ success: true, categories });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Import products from CSV
// @route   POST /api/products/import
// @access  Protected/Admin
// ─────────────────────────────────────────────────────────────────────────────
const importProductsFromCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a CSV file' });
    }

    const results = [];
    let successCount = 0;
    let failedCount = 0;
    const errors = [];

    // Pre-fetch categories and suppliers to map names to ObjectIds if provided
    const categories = await Category.find();
    const suppliers = await Supplier.find();
    
    // Map by name (lowercase for case-insensitive matching)
    const categoryMap = {};
    categories.forEach(c => categoryMap[c.name.trim().toLowerCase()] = c);
    
    const supplierMap = {};
    suppliers.forEach(s => supplierMap[s.name.trim().toLowerCase()] = s);

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        for (let i = 0; i < results.length; i++) {
          const row = results[i];
          const rowNumber = i + 1; // 1-indexed for logging (header is technically row 1, but this matches array + 1 conceptually)
          
          try {
            // Trim whitespace from every CSV value
            Object.keys(row).forEach(key => {
              if (typeof row[key] === "string") {
                row[key] = row[key].trim();
              }
            });

            // console.log("Parsed CSV Row:", row);

            // Validation
            if (!row.productName || row.productName === '') {
              failedCount++;
              errors.push(`Row ${rowNumber} → productName missing`);
              continue;
            }
            if (!row.category || row.category === '') {
              failedCount++;
              errors.push(`Row ${rowNumber} → category missing`);
              continue;
            }
            if (!row.supplier || row.supplier === '') {
              failedCount++;
              errors.push(`Row ${rowNumber} → supplier missing`);
              continue;
            }
            
            const sellingPrice = Number(row.sellingPrice);
            if (row.sellingPrice === undefined || row.sellingPrice === '' || isNaN(sellingPrice) || sellingPrice < 0) {
              failedCount++;
              errors.push(`Row ${rowNumber} → sellingPrice missing or invalid`);
              continue;
            }

            const quantity = Number(row.quantity);
            if (row.quantity === undefined || row.quantity === '' || isNaN(quantity) || quantity < 0) {
              failedCount++;
              errors.push(`Row ${rowNumber} → quantity missing or invalid`);
              continue;
            }

            // Category Logic
            let categoryDoc;
            const categoryNameKey = row.category.toLowerCase();
            if (categoryMap[categoryNameKey]) {
              categoryDoc = categoryMap[categoryNameKey];
            } else {
              // Auto-create category
              const newCategory = await Category.create({ name: row.category });
              categoryDoc = newCategory;
              categoryMap[categoryNameKey] = categoryDoc; // Add to map to prevent duplicates in same CSV
            }

            // Supplier Logic
            let supplierDoc;
            const supplierNameKey = row.supplier.toLowerCase();
            if (supplierMap[supplierNameKey]) {
              supplierDoc = supplierMap[supplierNameKey];
            } else {
              // Auto-create supplier
              const supplierDataToCreate = {
                name: row.supplier,
                phone: row.supplierPhone ? row.supplierPhone : '',
                email: row.supplierEmail ? row.supplierEmail : ''
              };
              const newSupplier = await Supplier.create(supplierDataToCreate);
              supplierDoc = newSupplier;
              supplierMap[supplierNameKey] = supplierDoc; // Add to map to prevent duplicates
            }

            // console.log("Category Doc:", categoryDoc);
            // console.log("Supplier Doc:", supplierDoc);

            // Product Creation
            try {
              await Product.create({
                productName: row.productName,
                category: categoryDoc._id,
                supplier: supplierDoc._id,
                buyingPrice: Number(row.buyingPrice || 0),
                sellingPrice: Number(sellingPrice),
                quantity: Number(quantity),
                unit: row.unit || 'pcs',
                image: row.image || '',
                barcode: `CSV-${Date.now()}-${i}`,
                addedBy: req.user._id
              });
              successCount++;
            } catch (error) {
              console.error("Product Creation Error:", error);
              failedCount++;
              errors.push(`Row ${rowNumber} → ${error.message}`);
            }
          } catch (err) {
            console.error(`MongoDB Error on row ${rowNumber}:`, err);
            failedCount++;
            errors.push(`Row ${rowNumber} → ${err.message}`);
          }
        }

        // Clean up file
        fs.unlinkSync(req.file.path);

        res.status(200).json({
          success: true,
          message: 'CSV import completed',
          successCount,
          failedCount,
          errors: errors.length > 0 ? errors : undefined
        });
      })
      .on('error', (error) => {
        fs.unlinkSync(req.file.path);
        return res.status(500).json({ success: false, message: 'Error parsing CSV file', error: error.message });
      });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

module.exports = {
  addProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts,
  getCategories,
  importProductsFromCSV,
};
