const Supplier = require('../models/Supplier');
const Product = require('../models/Product');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    
    // Get product counts for each supplier
    const suppliersWithCounts = await Promise.all(
      suppliers.map(async (supplier) => {
        const count = await Product.countDocuments({ supplier: supplier._id });
        return {
          ...supplier.toObject(),
          suppliedProductsCount: count,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: suppliersWithCounts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create a new supplier
// @route   POST /api/suppliers
// @access  Private
const createSupplier = async (req, res) => {
  try {
    const { name, email, phone, address, notes, isActive } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Supplier name is required' });
    }

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ success: false, message: 'Phone number must be exactly 10 digits' });
    }

    const existingSupplierName = await Supplier.findOne({ name: name.trim() });
    if (existingSupplierName) {
      return res.status(400).json({ success: false, message: 'Supplier with this name already exists' });
    }
    
    const existingSupplierEmail = await Supplier.findOne({ email: email.trim().toLowerCase() });
    if (existingSupplierEmail) {
      return res.status(400).json({ success: false, message: 'Supplier with this email already exists' });
    }

    const supplier = await Supplier.create({
      name,
      email,
      phone,
      address,
      notes,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update a supplier
// @route   PUT /api/suppliers/:id
// @access  Private
const updateSupplier = async (req, res) => {
  try {
    const { name, email, phone, address, notes, isActive } = req.body;

    let supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    if (name) {
      if (name.trim() === '') {
        return res.status(400).json({ success: false, message: 'Supplier name is required' });
      }
      const existingSupplier = await Supplier.findOne({ name: name.trim() });
      if (existingSupplier && existingSupplier._id.toString() !== req.params.id) {
        return res.status(400).json({ success: false, message: 'Supplier with this name already exists' });
      }
    }

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    const existingSupplierEmail = await Supplier.findOne({ email: email.trim().toLowerCase() });
    if (existingSupplierEmail && existingSupplierEmail._id.toString() !== req.params.id) {
      return res.status(400).json({ success: false, message: 'Supplier with this email already exists' });
    }

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ success: false, message: 'Phone number must be exactly 10 digits' });
    }

    supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        phone,
        address,
        notes,
        isActive,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete a supplier
// @route   DELETE /api/suppliers/:id
// @access  Private
const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    // Optional Cleanup: Remove this supplier from all products
    await Product.updateMany(
      { supplier: supplier._id },
      { $set: { supplier: null } }
    );

    await supplier.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
