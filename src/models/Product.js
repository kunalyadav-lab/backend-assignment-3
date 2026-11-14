const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
      maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    sku: {
      type: String,
      required: [true, 'Product SKU (Stock Keeping Unit) is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9-]+$/, 'SKU must consist of uppercase alphanumeric characters and hyphens only']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: ''
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
      enum: {
        values: [
          'Electronics',
          'Clothing',
          'Books',
          'Home & Kitchen',
          'Sports & Outdoors',
          'Toys & Games',
          'Health & Beauty',
          'Food & Beverage',
          'Office Supplies',
          'Other'
        ],
        message: '{VALUE} is not a supported product category'
      }
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be a positive number or zero'],
      set: (v) => Math.round(v * 100) / 100 // Round to 2 decimal places
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Stock quantity must be an integer'
      }
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: [0, 'Reorder level cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Reorder level must be an integer'
      }
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive', 'discontinued'],
        message: '{VALUE} is not a valid status'
      },
      default: 'active'
    },
    tags: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual property: isLowStock
productSchema.virtual('isLowStock').get(function () {
  return this.stock <= this.reorderLevel;
});

// Virtual property: inventoryValue
productSchema.virtual('inventoryValue').get(function () {
  return Math.round(this.price * this.stock * 100) / 100;
});

// Compound and single field indexes for optimal query performance
productSchema.index({ category: 1, price: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ name: 'text', description: 'text' });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
