const mongoose = require('mongoose');

// Middleware to validate MongoDB ObjectId in req.params.id
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'InvalidIdError',
          message: `The provided '${paramName}' parameter '${id}' is not a valid MongoDB ObjectId`
        }
      });
    }
    next();
  };
};

// Middleware to validate Create Product request body
const validateCreateProduct = (req, res, next) => {
  const { name, sku, price, category, stock } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Product name is required and must be a non-empty string' });
  }

  if (!sku || typeof sku !== 'string' || sku.trim().length === 0) {
    errors.push({ field: 'sku', message: 'Product SKU is required and must be a non-empty string' });
  }

  if (price === undefined || price === null || typeof price !== 'number' || isNaN(price) || price < 0) {
    errors.push({ field: 'price', message: 'Price is required and must be a non-negative number' });
  }

  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    errors.push({ field: 'category', message: 'Product category is required' });
  }

  if (stock !== undefined && stock !== null) {
    if (typeof stock !== 'number' || !Number.isInteger(stock) || stock < 0) {
      errors.push({ field: 'stock', message: 'Initial stock must be a non-negative integer' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        type: 'InputValidationError',
        message: 'Invalid input data provided for product creation',
        details: errors
      }
    });
  }

  next();
};

// Middleware to validate Stock Operation input
const validateStockOperation = (req, res, next) => {
  const { quantity } = req.body;

  if (quantity === undefined || quantity === null || typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({
      success: false,
      error: {
        type: 'InvalidStockQuantityError',
        message: 'Stock adjustment quantity must be a positive integer greater than zero'
      }
    });
  }

  next();
};

// Middleware to validate Query Parameters for Filtering/Sorting/Pagination
const validateProductQuery = (req, res, next) => {
  const { page, limit, minPrice, maxPrice, order } = req.query;
  const errors = [];

  if (page !== undefined && (!Number.isInteger(Number(page)) || Number(page) < 1)) {
    errors.push({ parameter: 'page', message: 'Page must be an integer greater than or equal to 1' });
  }

  if (limit !== undefined && (!Number.isInteger(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    errors.push({ parameter: 'limit', message: 'Limit must be an integer between 1 and 100' });
  }

  if (minPrice !== undefined && (isNaN(Number(minPrice)) || Number(minPrice) < 0)) {
    errors.push({ parameter: 'minPrice', message: 'minPrice must be a non-negative number' });
  }

  if (maxPrice !== undefined && (isNaN(Number(maxPrice)) || Number(maxPrice) < 0)) {
    errors.push({ parameter: 'maxPrice', message: 'maxPrice must be a non-negative number' });
  }

  if (minPrice !== undefined && maxPrice !== undefined && Number(minPrice) > Number(maxPrice)) {
    errors.push({ parameter: 'priceRange', message: 'minPrice cannot be greater than maxPrice' });
  }

  if (order !== undefined && !['asc', 'desc'].includes(order.toLowerCase())) {
    errors.push({ parameter: 'order', message: "Order must be either 'asc' or 'desc'" });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        type: 'QueryValidationError',
        message: 'Invalid query parameters provided',
        details: errors
      }
    });
  }

  next();
};

module.exports = {
  validateObjectId,
  validateCreateProduct,
  validateStockOperation,
  validateProductQuery
};
