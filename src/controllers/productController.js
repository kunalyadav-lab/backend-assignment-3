const Product = require('../models/Product');

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Public
 */
const createProduct = async (req, res, next) => {
  try {
    const { name, sku, description, category, price, stock, reorderLevel, status, tags } = req.body;

    const product = await Product.create({
      name,
      sku,
      description,
      category,
      price,
      stock,
      reorderLevel,
      status,
      tags
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all products with filtering, sorting, and pagination
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      inStock,
      status,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Build filter query object
    const filter = {};

    // 1. Text/Regex search across name and description
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { sku: { $regex: searchRegex } }
      ];
    }

    // 2. Category filtering
    if (category && category.trim() !== '') {
      filter.category = new RegExp(`^${category.trim()}$`, 'i');
    }

    // 3. Price range filtering ($gte, $lte)
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) {
        filter.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    // 4. In-stock availability filtering
    if (inStock !== undefined) {
      if (inStock === 'true' || inStock === true) {
        filter.stock = { $gt: 0 };
      } else if (inStock === 'false' || inStock === false) {
        filter.stock = 0;
      }
    }

    // 5. Status filtering
    if (status && status.trim() !== '') {
      filter.status = status.trim().toLowerCase();
    }

    // Build sort options
    const allowedSortFields = ['price', 'stock', 'name', 'createdAt', 'reorderLevel', 'category'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = order.toLowerCase() === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortDirection };

    // Pagination calculations
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Execute queries in parallel
    const [totalProducts, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter).sort(sort).skip(skip).limit(limitNum)
    ]);

    const totalPages = Math.ceil(totalProducts / limitNum) || 1;

    res.status(200).json({
      success: true,
      pagination: {
        totalProducts,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          type: 'NotFoundError',
          message: `Product with ID '${req.params.id}' not found`
        }
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update product details
 * @route   PUT /api/products/:id
 * @access  Public
 */
const updateProduct = async (req, res, next) => {
  try {
    // Disallow modifying sku directly if desired, or let Mongoose validate
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { returnDocument: 'after', runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          type: 'NotFoundError',
          message: `Product with ID '${req.params.id}' not found`
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Safely restock product (increment stock)
 * @route   PATCH /api/products/:id/restock
 * @access  Public
 */
const restockProduct = async (req, res, next) => {
  try {
    const { quantity } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { stock: quantity } },
      { returnDocument: 'after', runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          type: 'NotFoundError',
          message: `Product with ID '${req.params.id}' not found`
        }
      });
    }

    res.status(200).json({
      success: true,
      message: `Stock successfully increased by ${quantity} units`,
      data: {
        id: product._id,
        name: product.name,
        sku: product.sku,
        previousStock: product.stock - quantity,
        addedQuantity: quantity,
        currentStock: product.stock,
        isLowStock: product.isLowStock
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Safely record product sale (decrement stock without going negative)
 * @route   PATCH /api/products/:id/sale
 * @access  Public
 */
const sellProduct = async (req, res, next) => {
  try {
    const { quantity } = req.body;

    // Atomically decrement ONLY IF stock >= quantity to prevent race conditions and negative inventory
    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        stock: { $gte: quantity }
      },
      {
        $inc: { stock: -quantity }
      },
      {
        returnDocument: 'after',
        runValidators: true
      }
    );

    if (!product) {
      // Check if product exists to provide an accurate, helpful error
      const existingProduct = await Product.findById(req.params.id);

      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          error: {
            type: 'NotFoundError',
            message: `Product with ID '${req.params.id}' not found`
          }
        });
      }

      return res.status(400).json({
        success: false,
        error: {
          type: 'InsufficientStockError',
          message: `Insufficient stock for product '${existingProduct.name}'. Available stock: ${existingProduct.stock}, Requested: ${quantity}`,
          availableStock: existingProduct.stock,
          requestedQuantity: quantity
        }
      });
    }

    res.status(200).json({
      success: true,
      message: `Sale processed successfully: ${quantity} units sold`,
      data: {
        id: product._id,
        name: product.name,
        sku: product.sku,
        previousStock: product.stock + quantity,
        soldQuantity: quantity,
        currentStock: product.stock,
        isLowStock: product.isLowStock
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unified stock adjustment (restock, sale, or manual count set)
 * @route   PATCH /api/products/:id/stock
 * @access  Public
 */
const adjustStock = async (req, res, next) => {
  try {
    const { action, quantity } = req.body;

    if (!action || !['restock', 'sale', 'set'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'InvalidStockActionError',
          message: "Stock action must be either 'restock', 'sale', or 'set'"
        }
      });
    }

    if (action === 'restock') {
      return restockProduct(req, res, next);
    }

    if (action === 'sale') {
      return sellProduct(req, res, next);
    }

    if (action === 'set') {
      if (quantity === undefined || quantity < 0 || !Number.isInteger(quantity)) {
        return res.status(400).json({
          success: false,
          error: {
            type: 'InvalidStockQuantityError',
            message: 'Stock value for action "set" must be a non-negative integer'
          }
        });
      }

      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { $set: { stock: quantity } },
        { returnDocument: 'after', runValidators: true }
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          error: {
            type: 'NotFoundError',
            message: `Product with ID '${req.params.id}' not found`
          }
        });
      }

      return res.status(200).json({
        success: true,
        message: `Stock level updated directly to ${quantity} units`,
        data: product
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Public
 */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          type: 'NotFoundError',
          message: `Product with ID '${req.params.id}' not found`
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product successfully deleted from catalog',
      data: {
        id: product._id,
        name: product.name,
        sku: product.sku
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  restockProduct,
  sellProduct,
  adjustStock,
  deleteProduct
};
