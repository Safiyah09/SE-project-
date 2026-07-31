const Category = require('../models/Category');
const Product = require('../models/Product');

// @desc    Get all categories with analytics
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    
    const categoriesWithAnalytics = await Promise.all(
      categories.map(async (category) => {
        const products = await Product.find({ category: category._id });
        
        const totalProducts = products.length;
        const totalStockQuantity = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
        const inventoryValue = products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.buyingPrice || 0)), 0);
        const lowStockCount = products.filter(p => (p.quantity || 0) <= (p.lowStockThreshold || 10)).length;

        return {
          ...category.toObject(),
          totalProducts,
          totalStockQuantity,
          inventoryValue,
          lowStockCount
        };
      })
    );

    res.status(200).json({
      success: true,
      data: categoriesWithAnalytics,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private
const createCategory = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).json({ success: false, message: 'Category with this name already exists' });
    }

    const category = await Category.create({
      name,
      description,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private
const updateCategory = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    let category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (name) {
      if (name.trim() === '') {
        return res.status(400).json({ success: false, message: 'Category name is required' });
      }
      const existingCategory = await Category.findOne({ name: name.trim() });
      if (existingCategory && existingCategory._id.toString() !== req.params.id) {
        return res.status(400).json({ success: false, message: 'Category with this name already exists' });
      }
    }

    category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, isActive },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Safety check: Prevent deletion if category contains products
    const productsCount = await Product.countDocuments({ category: req.params.id });
    if (productsCount > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete category with linked products' });
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
