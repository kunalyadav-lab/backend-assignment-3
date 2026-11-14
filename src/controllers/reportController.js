const Product = require('../models/Product');

/**
 * @desc    Generate Low-Stock Alert Report
 * @route   GET /api/reports/low-stock (and /api/products/reports/low-stock)
 * @access  Public
 */
const getLowStockReport = async (req, res, next) => {
  try {
    const { threshold } = req.query;

    let matchCondition;

    if (threshold !== undefined) {
      const parsedThreshold = parseInt(threshold, 10);
      if (isNaN(parsedThreshold) || parsedThreshold < 0) {
        return res.status(400).json({
          success: false,
          error: {
            type: 'ValidationError',
            message: 'Threshold must be a non-negative integer'
          }
        });
      }
      matchCondition = { stock: { $lte: parsedThreshold } };
    } else {
      // Compare each product's stock against its own reorderLevel using $expr
      matchCondition = {
        $expr: { $lte: ['$stock', '$reorderLevel'] }
      };
    }

    // Fetch low-stock products sorted by stock ascending (out of stock and lowest stock first)
    const lowStockProducts = await Product.find(matchCondition)
      .sort({ stock: 1, name: 1 })
      .select('name sku category price stock reorderLevel status updatedAt');

    const outOfStockCount = lowStockProducts.filter((p) => p.stock === 0).length;
    const criticalStockCount = lowStockProducts.filter((p) => p.stock > 0 && p.stock <= 5).length;

    res.status(200).json({
      success: true,
      reportType: 'Low-Stock Alert Report',
      generatedAt: new Date().toISOString(),
      summary: {
        totalAlerts: lowStockProducts.length,
        outOfStockCount,
        criticalStockCount,
        warningStockCount: lowStockProducts.length - (outOfStockCount + criticalStockCount)
      },
      data: lowStockProducts.map((p) => ({
        id: p._id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        price: p.price,
        stock: p.stock,
        reorderLevel: p.reorderLevel,
        status: p.status,
        urgency: p.stock === 0 ? 'CRITICAL_OUT_OF_STOCK' : p.stock <= 5 ? 'HIGH' : 'MEDIUM'
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate Category-wise Inventory Summary using MongoDB Aggregation Pipeline
 * @route   GET /api/reports/category-summary (and /api/products/reports/category-summary)
 * @access  Public
 */
const getCategorySummary = async (req, res, next) => {
  try {
    // Aggregation pipeline to group products by category and compute comprehensive metrics
    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          totalProducts: { $sum: 1 },
          totalStockQuantity: { $sum: '$stock' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          totalCategoryValuation: {
            $sum: { $multiply: ['$price', '$stock'] }
          },
          outOfStockCount: {
            $sum: {
              $cond: [{ $eq: ['$stock', 0] }, 1, 0]
            }
          },
          lowStockCount: {
            $sum: {
              $cond: [{ $lte: ['$stock', '$reorderLevel'] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          totalProducts: 1,
          totalStockQuantity: 1,
          avgPrice: { $round: ['$avgPrice', 2] },
          minPrice: { $round: ['$minPrice', 2] },
          maxPrice: { $round: ['$maxPrice', 2] },
          totalCategoryValuation: { $round: ['$totalCategoryValuation', 2] },
          outOfStockCount: 1,
          lowStockCount: 1
        }
      },
      {
        $sort: { totalCategoryValuation: -1 }
      }
    ]);

    // Overall warehouse totals aggregation
    const overallTotals = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalCatalogProducts: { $sum: 1 },
          totalUnitsInStock: { $sum: '$stock' },
          totalWarehouseValuation: {
            $sum: { $multiply: ['$price', '$stock'] }
          },
          overallAvgPrice: { $avg: '$price' },
          totalOutOfStock: {
            $sum: {
              $cond: [{ $eq: ['$stock', 0] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalCatalogProducts: 1,
          totalUnitsInStock: 1,
          totalWarehouseValuation: { $round: ['$totalWarehouseValuation', 2] },
          overallAvgPrice: { $round: ['$overallAvgPrice', 2] },
          totalOutOfStock: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      reportType: 'Category-wise Inventory Summary',
      generatedAt: new Date().toISOString(),
      warehouseTotals: overallTotals[0] || {
        totalCatalogProducts: 0,
        totalUnitsInStock: 0,
        totalWarehouseValuation: 0,
        overallAvgPrice: 0,
        totalOutOfStock: 0
      },
      categoryCount: categoryStats.length,
      categories: categoryStats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLowStockReport,
  getCategorySummary
};
