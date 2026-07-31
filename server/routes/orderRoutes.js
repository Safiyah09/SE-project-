const express = require('express');
const router = express.Router();
const { createOrder, getOrders, getOrderById, getSalesAnalytics } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.get('/analytics/overview', protect, getSalesAnalytics);

router.route('/')
  .post(protect, createOrder)
  .get(protect, getOrders);

router.route('/:id')
  .get(protect, getOrderById);

module.exports = router;
