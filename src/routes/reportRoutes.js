const express = require('express');
const router = express.Router();
const {
  getLowStockReport,
  getCategorySummary
} = require('../controllers/reportController');

router.get('/low-stock', getLowStockReport);
router.get('/category-summary', getCategorySummary);

module.exports = router;
