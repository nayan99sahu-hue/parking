const express = require('express');
const router = express.Router();
const { getDashboardStats, getOperatorStats, getDailyReport } = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/dashboard', protect, adminOnly, getDashboardStats);
router.get('/operators', protect, adminOnly, getOperatorStats);
router.get('/daily', protect, adminOnly, getDailyReport);

module.exports = router;
