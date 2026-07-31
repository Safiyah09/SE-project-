const express = require('express');
const { body, param } = require('express-validator');
const {
  addProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts,
  getCategories,
  importProductsFromCSV
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// All product routes are protected
router.use(protect);

// ── Validation Rules ──────────────────────────────────────────────────────────
const productValidation = [
  body('productName')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ max: 100 }).withMessage('Product name cannot exceed 100 characters'),

  body('category')
    .notEmpty().withMessage('Category is required'),

  body('quantity')
    .isFloat({ min: 0 }).withMessage('Quantity must be a non-negative number'),

  body('unit')
    .notEmpty().withMessage('Unit is required')
    .isIn(['kg', 'g', 'ltr', 'ml', 'pcs', 'dozen', 'pack', 'box', 'bottle', 'bag'])
    .withMessage('Invalid unit'),

  body('buyingPrice')
    .isFloat({ min: 0 }).withMessage('Buying price must be a non-negative number'),

  body('sellingPrice')
    .isFloat({ min: 0 }).withMessage('Selling price must be a non-negative number'),

  body('barcode')
    .optional({ nullable: true })
    .isLength({ max: 50 }).withMessage('Barcode cannot exceed 50 characters'),

  body('expiryDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('Invalid expiry date format'),
];

const stockValidation = [
  body('quantity')
    .isFloat({ min: 0 }).withMessage('Quantity must be a non-negative number'),
  body('operation')
    .optional()
    .isIn(['set', 'add', 'subtract']).withMessage('Operation must be set, add, or subtract'),
];

// ── Special Routes (must come BEFORE /:id) ────────────────────────────────────
// GET  /api/products/alerts/low-stock
router.get('/alerts/low-stock', getLowStockProducts);

// GET  /api/products/meta/categories
router.get('/meta/categories', getCategories);

// POST /api/products/import
router.post('/import', authorize('admin'), upload.single('file'), importProductsFromCSV);

// ── Core CRUD Routes ──────────────────────────────────────────────────────────
// GET    /api/products          → All products (search, filter, pagination)
// POST   /api/products          → Add new product
router
  .route('/')
  .get(getAllProducts)
  .post(productValidation, addProduct);

// GET    /api/products/:id      → Single product
// PUT    /api/products/:id      → Update product
// DELETE /api/products/:id      → Soft delete product
router
  .route('/:id')
  .get(getProduct)
  .put(productValidation, updateProduct)
  .delete(deleteProduct);

// PATCH  /api/products/:id/stock → Update stock quantity only
router.patch('/:id/stock', stockValidation, updateStock);

module.exports = router;
