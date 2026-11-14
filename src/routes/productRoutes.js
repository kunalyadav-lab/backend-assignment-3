const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  restockProduct,
  sellProduct,
  adjustStock,
  deleteProduct
} = require('../controllers/productController');
const {
  getLowStockReport,
  getCategorySummary
} = require('../controllers/reportController');
const {
  validateObjectId,
  validateCreateProduct,
  validateStockOperation,
  validateProductQuery
} = require('../middleware/validator');

// Reports routes under /api/products/reports/* (placed BEFORE /:id to prevent route shadowing)
router.get('/reports/low-stock', getLowStockReport);
router.get('/reports/category-summary', getCategorySummary);

// Standard CRUD endpoints
router
  .route('/')
  .post(validateCreateProduct, createProduct)
  .get(validateProductQuery, getProducts);

router
  .route('/:id')
  .get(validateObjectId('id'), getProductById)
  .put(validateObjectId('id'), updateProduct)
  .delete(validateObjectId('id'), deleteProduct);

// Safe Stock Adjustment endpoints
router.patch('/:id/restock', validateObjectId('id'), validateStockOperation, restockProduct);
router.patch('/:id/sale', validateObjectId('id'), validateStockOperation, sellProduct);
router.patch('/:id/stock', validateObjectId('id'), adjustStock);

module.exports = router;
