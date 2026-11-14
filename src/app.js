const express = require('express');
const productRoutes = require('./routes/productRoutes');
const reportRoutes = require('./routes/reportRoutes');
const studentRoutes = require('./routes/studentRoutes');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

// Built-in body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Lightweight request logging middleware using pure Node.js (no extra packages needed)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Root API documentation endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Inventory and Data Management System API',
    version: '1.0.0',
    documentation: {
      products: {
        'POST   /api/products': 'Create a new product with field validation',
        'GET    /api/products': 'List all products with filtering, sorting & pagination',
        'GET    /api/products/:id': 'Fetch a single product by MongoDB ObjectId',
        'PUT    /api/products/:id': 'Update product details with schema validation',
        'DELETE /api/products/:id': 'Delete product from catalog',
        'PATCH  /api/products/:id/restock': 'Safely increment stock (body: { quantity })',
        'PATCH  /api/products/:id/sale': 'Safely decrement stock without negative inventory (body: { quantity })',
        'PATCH  /api/products/:id/stock': "Unified stock adjustment (body: { action: 'restock'|'sale'|'set', quantity })"
      },
      reports: {
        'GET    /api/reports/low-stock': 'Low-stock alert report (optional query: ?threshold=X)',
        'GET    /api/reports/category-summary': 'Category-wise inventory aggregation summary (with warehouse totals)'
      },
      students: {
        'POST   /api/students': 'Create student record with schema validation',
        'GET    /api/students': 'List students with query filtering (course, city, feesPaid, minAttendance), sorting & pagination',
        'GET    /api/students/:id': 'Fetch student by MongoDB ObjectId or studentId (e.g. STU001)',
        'PUT    /api/students/:id': 'Update student details',
        'PATCH  /api/students/:id/fees': 'Update fee payment status (body: { feesPaid: true|false })',
        'DELETE /api/students/:id': 'Delete student record',
        'GET    /api/students/reports/course-summary': 'Course-wise student data aggregation summary'
      },
      system: {
        'GET    /api/health': 'Check API health and database connectivity status'
      }
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbState = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'][mongoose.connection.readyState] || 'Unknown';

  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: {
      status: dbState,
      name: mongoose.connection.name
    }
  });
});

// Mount resource routes
app.use('/api/products', productRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/students', studentRoutes);

// Catch-all 404 handler
app.use(notFound);

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
