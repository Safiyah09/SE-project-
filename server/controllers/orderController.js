const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
  try {
    const { orderId, customerName, paymentMethod, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item',
      });
    }

    // 1. Fetch all matching products
    const productIds = items.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    // 2. Validate all products and stock BEFORE saving anything
    for (const item of items) {
      const product = products.find(p => p._id.toString() === item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productName}`,
        });
      }
      if (item.quantity > product.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.productName}`,
        });
      }
    }

    // Safely calculate totals on the backend
    let calculatedSubtotal = 0;
    
    const orderItems = items.map(item => {
      const itemSubtotal = item.quantity * item.price;
      calculatedSubtotal += itemSubtotal;
      return {
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        subtotal: itemSubtotal,
        image: item.image,
      };
    });

    const gst = calculatedSubtotal * 0.12;
    const total = calculatedSubtotal + gst;

    const newOrder = new Order({
      orderId,
      customerName: customerName || 'Walk-in Customer',
      paymentMethod: paymentMethod || 'Cash',
      items: orderItems,
      subtotal: calculatedSubtotal,
      gst,
      total,
      createdBy: req.user._id,
    });

    // 3. Save order
    const savedOrder = await newOrder.save();

    // 4. Deduct stock concurrently
    await Promise.all(items.map(async (item) => {
      const product = products.find(p => p._id.toString() === item.productId);
      product.quantity -= item.quantity;
      await product.save();
    }));

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: savedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res, next) => {
  try {
    // Newest orders first
    const orders = await Order.find({}).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sales analytics overview
// @route   GET /api/orders/analytics/overview
// @access  Private
const getSalesAnalytics = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [orders, lowStockProducts] = await Promise.all([
      Order.find({}),
      Product.find({ isActive: true, quantity: { $lt: 10 } })
    ]);

    let totalRevenue = 0;
    let totalGST = 0;
    let todaySales = 0;
    let todayOrders = 0;

    const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push({
        day: daysMap[d.getDay()],
        dateString: d.toISOString().split('T')[0]
      });
    }

    const revenueByDayMap = {};
    const ordersByDayMap = {};
    last7Days.forEach(d => {
      revenueByDayMap[d.day] = 0;
      ordersByDayMap[d.day] = 0;
    });

    const paymentDistributionMap = { Cash: 0, UPI: 0, Card: 0 };

    orders.forEach(order => {
      totalRevenue += order.total;
      totalGST += order.gst;
      
      const orderDate = new Date(order.createdAt);
      if (orderDate >= today) {
        todaySales += order.total;
        todayOrders++;
      }

      if (paymentDistributionMap[order.paymentMethod] !== undefined) {
        paymentDistributionMap[order.paymentMethod]++;
      }

      const orderDateString = orderDate.toISOString().split('T')[0];
      const matchedDay = last7Days.find(d => d.dateString === orderDateString);
      if (matchedDay) {
        revenueByDayMap[matchedDay.day] += order.total;
        ordersByDayMap[matchedDay.day] += 1;
      }
    });

    const revenueByDay = last7Days.map(d => ({ day: d.day, revenue: revenueByDayMap[d.day] }));
    const ordersByDay = last7Days.map(d => ({ day: d.day, orders: ordersByDayMap[d.day] }));
    const paymentDistribution = Object.keys(paymentDistributionMap).map(key => ({ name: key, value: paymentDistributionMap[key] }));

    res.status(200).json({
      success: true,
      data: {
        totalOrders: orders.length,
        totalRevenue,
        totalGST,
        todaySales,
        todayOrders,
        lowStockCount: lowStockProducts.length,
        revenueByDay,
        ordersByDay,
        paymentDistribution
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  getSalesAnalytics,
};
