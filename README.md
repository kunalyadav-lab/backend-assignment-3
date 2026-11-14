# Inventory and Data Management System

A robust, enterprise-grade RESTful backend built with **Node.js**, **Express.js**, and **MongoDB** (via **Mongoose**). This project implements product catalogue management, field-level schema validation, query-string filtering, sorting, pagination, safe atomic stock adjustments (concurrency-safe restock and sale operations), low-stock alerting, and aggregation reports.

---

## 📋 Table of Contents
1. [Tech Stack & Restrictions](#-tech-stack--restrictions)
2. [Project Architecture](#-project-architecture)
3. [Prerequisites & Getting Started](#-prerequisites--getting-started)
4. [Environment Variables](#-environment-variables)
5. [Database Seeding](#-database-seeding)
6. [API Endpoints Reference](#-api-endpoints-reference)
   - [Product CRUD Endpoints](#product-crud-endpoints)
   - [Safe Stock Adjustments](#safe-stock-adjustments-restock--sale)
   - [Filtering, Sorting & Pagination](#filtering-sorting--pagination)
   - [Inventory & Aggregation Reports](#inventory--aggregation-reports)
7. [Error Handling & Validation](#-error-handling--validation)
8. [Automated Testing](#-automated-testing)

---

## 🛠 Tech Stack & Restrictions

- **Runtime**: Node.js (v18+)
- **Web Framework**: Express.js (v5)
- **Database & ODM**: MongoDB with Mongoose (v9)
- **Configuration**: `dotenv`
- **Restrictions Complied**: Zero third-party boilerplates, CMS frameworks, or unpermitted libraries. Built purely using Node.js, Express, Mongoose, and dotenv.

---

## 🏗 Project Architecture

```
inventory-management-system/
├── .env                              # Active environment variables (git-ignored)
├── .env.example                      # Environment template
├── .gitignore                        # Git exclusion rules
├── package.json                      # Project metadata & npm scripts
├── README.md                         # Complete documentation
├── server.js                         # Application entrypoint & graceful shutdown
├── src/
│   ├── app.js                        # Express application configuration & routing
│   ├── config/
│   │   └── db.js                     # MongoDB connection management & event listeners
│   ├── controllers/
│   │   ├── productController.js      # CRUD actions & safe stock operations
│   │   └── reportController.js       # Aggregation pipeline & low-stock reports
│   ├── middleware/
│   │   ├── errorHandler.js           # Centralized error handler (CastError, 11000, etc.)
│   │   ├── notFound.js               # 404 Route Not Found middleware
│   │   └── validator.js              # Request validation (ObjectId, body, query parameters)
│   ├── models/
│   │   └── Product.js                # Mongoose schema with field validation, indexes & virtuals
│   └── seed/
│       └── seedData.js               # Sample inventory database seeder
└── test/
    └── api-test.js                   # Automated end-to-end API test suite (46 assertions)
```

---

## 🚀 Prerequisites & Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) installed
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally on port `27017` (or MongoDB Atlas URI)

### 2. Installation
Navigate to the project root directory:
```bash
cd C:\Users\kunal\.gemini\antigravity\scratch\inventory-management-system
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/inventory_management
```

### 4. Seed the Database
Populate the database with 15 realistic products across 6 categories:
```bash
npm run seed
```

### 5. Start the Server
```bash
# Production mode
npm start

# Development mode (auto-reload with Node native watch)
npm run dev
```
The server will start at `http://localhost:5000`.

---

## 📊 Database Schema Design

### Product Model (`src/models/Product.js`)

| Field | Type | Rules & Validation |
| :--- | :--- | :--- |
| `name` | String | Required, trim, min: 2 chars, max: 100 chars |
| `sku` | String | Required, unique index, uppercase, regex: `/^[A-Z0-9-]+$/` |
| `description`| String | Optional, trim, max: 1000 chars |
| `category` | String | Required, enum: `Electronics`, `Clothing`, `Books`, `Home & Kitchen`, `Sports & Outdoors`, `Toys & Games`, `Health & Beauty`, `Food & Beverage`, `Office Supplies`, `Other` |
| `price` | Number | Required, min: 0, rounded to 2 decimal places |
| `stock` | Number | Required, integer, min: 0, default: 0 |
| `reorderLevel`| Number | Integer, min: 0, default: 10 |
| `status` | String | Enum: `['active', 'inactive', 'discontinued']`, default: `active` |
| `tags` | [String]| Array of category/feature keywords |
| `timestamps` | Date | `createdAt`, `updatedAt` managed automatically by Mongoose |

#### Virtual Fields & Indexes:
- `isLowStock`: Computes dynamically whether `stock <= reorderLevel`.
- `inventoryValue`: Computes `price * stock`.
- Compound Index: `{ category: 1, price: 1 }`
- Text & Range Indexes: `{ stock: 1 }`, `{ name: 'text', description: 'text' }`

---

## 📡 API Endpoints Reference

### Product CRUD Endpoints

#### 1. Create Product
- **Endpoint**: `POST /api/products`
- **Request Body**:
  ```json
  {
    "name": "Noise-Canceling Wireless Earbuds",
    "sku": "ELEC-EAR-005",
    "description": "True wireless earbuds with ANC and transparency mode.",
    "category": "Electronics",
    "price": 149.99,
    "stock": 40,
    "reorderLevel": 10,
    "status": "active",
    "tags": ["audio", "wireless"]
  }
  ```
- **Response**: `201 Created`

#### 2. Get All Products (with Filtering, Sorting, Pagination)
- **Endpoint**: `GET /api/products`
- **Query Parameters**:
  - `page`: Page number (default: `1`)
  - `limit`: Items per page (default: `10`, max: `100`)
  - `category`: Filter by category (case-insensitive)
  - `minPrice` / `maxPrice`: Filter within price boundaries
  - `inStock`: `true` (stock > 0) or `false` (stock = 0)
  - `search`: Keyword search in `name`, `description`, or `sku`
  - `sortBy`: `price`, `stock`, `name`, `createdAt`, `reorderLevel` (default: `createdAt`)
  - `order`: `asc` or `desc` (default: `desc`)
- **Example Request**:
  ```bash
  GET /api/products?category=Electronics&minPrice=50&maxPrice=200&sortBy=price&order=asc&page=1&limit=5
  ```
- **Response Structure**:
  ```json
  {
    "success": true,
    "pagination": {
      "totalProducts": 15,
      "totalPages": 3,
      "currentPage": 1,
      "limit": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "count": 5,
    "data": [ ... ]
  }
  ```

#### 3. Get Single Product
- **Endpoint**: `GET /api/products/:id`
- **Response**: `200 OK` (or `404 Not Found` / `400 Bad Request` if invalid ID)

#### 4. Update Product
- **Endpoint**: `PUT /api/products/:id`
- **Request Body**: JSON object containing fields to update.
- **Response**: `200 OK` with updated product document.

#### 5. Delete Product
- **Endpoint**: `DELETE /api/products/:id`
- **Response**: `200 OK` with deleted product ID, name, and SKU confirmation.

---

### Safe Stock Adjustments (Restock & Sale)

Concurrency-safe inventory management preventing race conditions and negative inventory levels.

#### 1. Restock Product (Stock Increment)
- **Endpoint**: `PATCH /api/products/:id/restock`
- **Request Body**:
  ```json
  { "quantity": 20 }
  ```
- **Behavior**: Uses atomic `$inc: { stock: quantity }`.
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Stock successfully increased by 20 units",
    "data": {
      "id": "6af73cb3bd40266dd330ae24",
      "name": "Wireless Noise-Canceling Headphones",
      "sku": "ELEC-WNC-001",
      "previousStock": 45,
      "addedQuantity": 20,
      "currentStock": 65,
      "isLowStock": false
    }
  }
  ```

#### 2. Process Sale (Safe Stock Decrement)
- **Endpoint**: `PATCH /api/products/:id/sale`
- **Request Body**:
  ```json
  { "quantity": 5 }
  ```
- **Atomicity Guard**:
  ```javascript
  Product.findOneAndUpdate(
    { _id: id, stock: { $gte: quantity } }, // Guarantees stock will never drop below 0
    { $inc: { stock: -quantity } },
    { returnDocument: 'after' }
  );
  ```
- **Sufficient Stock**: Responds with `200 OK`.
- **Insufficient Stock**: Responds with `400 Bad Request`:
  ```json
  {
    "success": false,
    "error": {
      "type": "InsufficientStockError",
      "message": "Insufficient stock for product 'Ultra-HD 4K Webcam'. Available stock: 8, Requested: 15",
      "availableStock": 8,
      "requestedQuantity": 15
    }
  }
  ```

#### 3. Unified Stock Endpoint
- **Endpoint**: `PATCH /api/products/:id/stock`
- **Request Body**:
  ```json
  { "action": "restock", "quantity": 10 }
  // OR
  { "action": "sale", "quantity": 3 }
  // OR
  { "action": "set", "quantity": 50 }
  ```

---

### Inventory & Aggregation Reports

#### 1. Low-Stock Alert Report
- **Endpoint**: `GET /api/reports/low-stock` *(also accessible via `/api/products/reports/low-stock`)*
- **Query Parameter (Optional)**: `?threshold=10` (if omitted, dynamically matches products against their individual `reorderLevel` via `$expr: { $lte: ['$stock', '$reorderLevel'] }`)
- **Response Sample**:
  ```json
  {
    "success": true,
    "reportType": "Low-Stock Alert Report",
    "generatedAt": "2026-11-13T16:37:07.775Z",
    "summary": {
      "totalAlerts": 5,
      "outOfStockCount": 2,
      "criticalStockCount": 2,
      "warningStockCount": 1
    },
    "data": [
      {
        "id": "6af73cb3bd40266dd330ae1c",
        "name": "Mechanical Gaming Keyboard",
        "sku": "ELEC-KEY-003",
        "category": "Electronics",
        "price": 129,
        "stock": 0,
        "reorderLevel": 12,
        "urgency": "CRITICAL_OUT_OF_STOCK"
      }
    ]
  }
  ```

#### 2. Category-wise Summary (MongoDB Aggregation Pipeline)
- **Endpoint**: `GET /api/reports/category-summary` *(also accessible via `/api/products/reports/category-summary`)*
- **Aggregation Pipeline Logic**:
  1. `$group`: Groups by `category`, aggregates `totalProducts`, `totalStockQuantity`, `avgPrice`, `minPrice`, `maxPrice`, `totalCategoryValuation`, and conditional counts for low/out-of-stock items.
  2. `$project`: Formats averages and totals rounded to 2 decimal places.
  3. `$sort`: Orders categories by total inventory valuation descending.

---

### Student Data Management Endpoints (15 Dataset Records)

The exact 15 student records provided in the assignment (`STU001` - `STU015`) are fully seeded into MongoDB and accessible via:

#### 1. Student CRUD Endpoints
- `POST   /api/students`: Create student record with schema validation
- `GET    /api/students`: List all students with query filtering, sorting, and pagination
  - Filters: `course` (e.g. `CSE`), `city`, `feesPaid` (`true`\|`false`), `minAttendance` (e.g. `85`), `skill` (e.g. `React`), `search`
  - Sorting: `sortBy=attendance|name|age|studentId`, `order=asc|desc`
  - Pagination: `page=1&limit=5`
- `GET    /api/students/:id`: Fetch student by MongoDB ObjectId OR custom `studentId` (e.g. `/api/students/STU001` or `/api/students/6ab2229364e805b2875c0832`)
- `PUT    /api/students/:id`: Update student details
- `PATCH  /api/students/:id/fees`: Update fee payment status (`{ "feesPaid": true }`)
- `DELETE /api/students/:id`: Remove student record

#### 2. Course-wise Aggregation Summary
- **Endpoint**: `GET /api/students/reports/course-summary`
- **Aggregation Pipeline Stages**:
  1. `$group`: Groups students by `course`, calculating:
     - `totalStudents`: count per course
     - `avgAttendance`: average attendance percentage
     - `avgMathMarks`, `avgDbmsMarks`, `avgWebMarks`: subject averages
     - `feesPaidCount` & `feesPendingCount`: fee reconciliation counts
     - `activeStudentsCount`: active vs inactive students
  2. `$project`: Formats averages rounded to 2 decimal places and computes `overallAvgMarks`.
  3. Overall Institution KPI block: total enrolled students, institution-wide average attendance, and total fee collection metrics.
  4. Global Facet / Warehouse Totals: Evaluates total inventory valuation, total units in stock, and total catalogue products across the whole warehouse.
- **Response Sample**:
  ```json
  {
    "success": true,
    "reportType": "Category-wise Inventory Summary",
    "generatedAt": "2026-11-13T16:37:07.796Z",
    "warehouseTotals": {
      "totalCatalogProducts": 15,
      "totalUnitsInStock": 547,
      "totalWarehouseValuation": 28416.75,
      "overallAvgPrice": 66.83,
      "totalOutOfStock": 2
    },
    "categoryCount": 6,
    "categories": [
      {
        "category": "Electronics",
        "totalProducts": 4,
        "totalStockQuantity": 118,
        "avgPrice": 117.12,
        "minPrice": 49.99,
        "maxPrice": 199.99,
        "totalCategoryValuation": 12964.9,
        "outOfStockCount": 1,
        "lowStockCount": 2
      },
      {
        "category": "Clothing",
        "totalProducts": 3,
        "totalStockQuantity": 147,
        "avgPrice": 68.31,
        "minPrice": 24.99,
        "maxPrice": 110,
        "totalCategoryValuation": 5768.55,
        "outOfStockCount": 0,
        "lowStockCount": 1
      }
    ]
  }
  ```

---

## 🛡 Error Handling & Validation

Centralized error-handling middleware (`src/middleware/errorHandler.js`) normalizes all errors into structured JSON responses:

| Error Case | HTTP Status | Response Schema |
| :--- | :--- | :--- |
| **Invalid ObjectId** | `400 Bad Request` | `{ success: false, error: { type: "CastError", message: "..." } }` |
| **Field Validation Failure** | `400 Bad Request` | `{ success: false, error: { type: "ValidationError", details: [...] } }` |
| **Duplicate SKU** | `409 Conflict` | `{ success: false, error: { type: "DuplicateFieldError", field: "sku", message: "..." } }` |
| **Insufficient Stock** | `400 Bad Request` | `{ success: false, error: { type: "InsufficientStockError", availableStock: X, requestedQuantity: Y } }` |
| **Resource Not Found** | `404 Not Found` | `{ success: false, error: { type: "NotFoundError", message: "..." } }` |
| **Route Not Found** | `404 Not Found` | `{ success: false, error: { type: "NotFound", message: "Cannot find endpoint ..." } }` |

---

## 🧪 Automated Testing

A comprehensive test suite is included in `test/api-test.js` covering 46 automated assertions across all 8 assignment requirements.

Run tests:
```bash
npm test
```

Expected output:
```
======================================================
TEST SUMMARY: 46 PASSED, 0 FAILED
======================================================
```
