require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');

const TEST_PORT = 5055;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Helper assertion function
let passedTests = 0;
let failedTests = 0;

const assert = (condition, description) => {
  if (condition) {
    console.log(`  ✓ PASS: ${description}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${description}`);
    failedTests++;
  }
};

const runTests = async () => {
  console.log('\n======================================================');
  console.log('   INVENTORY & DATA MANAGEMENT SYSTEM - TEST SUITE   ');
  console.log('======================================================\n');

  await connectDB();
  const server = app.listen(TEST_PORT);

  try {
    // -----------------------------------------------------------
    // TEST 1: Health Check Endpoint
    // -----------------------------------------------------------
    console.log('[Test 1] Health Check Endpoint');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, 'Health check returns status 200');
    assert(healthData.status === 'healthy', 'Health check reports healthy status');
    assert(healthData.database.status === 'Connected', 'Database reports Connected');

    // -----------------------------------------------------------
    // TEST 2: Create Product with Valid Data
    // -----------------------------------------------------------
    console.log('\n[Test 2] Product Creation (POST /api/products)');
    const testSku = `TEST-ITEM-${Date.now()}`;
    const newProductPayload = {
      name: 'Automated Test Gaming Monitor',
      sku: testSku,
      description: '27-inch 144Hz IPS display for latency testing.',
      category: 'Electronics',
      price: 299.99,
      stock: 25,
      reorderLevel: 8,
      status: 'active',
      tags: ['test', 'monitor', 'hardware']
    };

    const createRes = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProductPayload)
    });
    const createData = await createRes.json();

    assert(createRes.status === 201, 'POST /api/products returns status 201 Created');
    assert(createData.success === true, 'Response payload has success: true');
    assert(createData.data.sku === testSku, 'Created product has matching SKU');
    assert(createData.data.stock === 25, 'Initial stock matches requested stock');
    const createdProductId = createData.data._id;

    // -----------------------------------------------------------
    // TEST 3: Validation and Error Handling
    // -----------------------------------------------------------
    console.log('\n[Test 3] Validation & Duplicate Key Handling');

    // 3a. Duplicate SKU
    const duplicateRes = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newProductPayload, name: 'Duplicate SKU Monitor' })
    });
    const duplicateData = await duplicateRes.json();
    assert(duplicateRes.status === 409, 'Duplicate SKU returns status 409 Conflict');
    assert(duplicateData.error.type === 'DuplicateFieldError', 'Returns DuplicateFieldError type');

    // 3b. Negative Price
    const negativePriceRes = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Negative Price Item',
        sku: `NEG-PRC-${Date.now()}`,
        category: 'Electronics',
        price: -50,
        stock: 10
      })
    });
    assert(negativePriceRes.status === 400, 'Negative price rejected with status 400 Bad Request');

    // 3c. Negative Stock
    const negativeStockRes = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Negative Stock Item',
        sku: `NEG-STK-${Date.now()}`,
        category: 'Electronics',
        price: 50,
        stock: -10
      })
    });
    assert(negativeStockRes.status === 400, 'Negative stock rejected with status 400 Bad Request');

    // 3d. Missing Required Fields (Missing Category)
    const missingFieldRes = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Missing Category Item',
        sku: `MISS-CAT-${Date.now()}`,
        price: 50
      })
    });
    assert(missingFieldRes.status === 400, 'Missing category rejected with status 400 Bad Request');

    // -----------------------------------------------------------
    // TEST 4: Fetch Single Product & ID Validation
    // -----------------------------------------------------------
    console.log('\n[Test 4] Fetch Product By ID (GET /api/products/:id)');

    // 4a. Valid ID
    const getByIdRes = await fetch(`${BASE_URL}/api/products/${createdProductId}`);
    const getByIdData = await getByIdRes.json();
    assert(getByIdRes.status === 200, 'GET /api/products/:id returns status 200');
    assert(getByIdData.data._id === createdProductId, 'Returns correct product document');
    assert(getByIdData.data.isLowStock === false, 'Virtual property isLowStock computed correctly');

    // 4b. Invalid ObjectId Format
    const invalidIdRes = await fetch(`${BASE_URL}/api/products/invalid-hex-12345`);
    assert(invalidIdRes.status === 400, 'Invalid ObjectId format rejected with status 400 Bad Request');

    // 4c. Non-existent Product ID
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const notFoundRes = await fetch(`${BASE_URL}/api/products/${nonExistentId}`);
    assert(notFoundRes.status === 404, 'Non-existent ID returns status 404 Not Found');

    // -----------------------------------------------------------
    // TEST 5: Update Product Details
    // -----------------------------------------------------------
    console.log('\n[Test 5] Update Product Details (PUT /api/products/:id)');
    const updateRes = await fetch(`${BASE_URL}/api/products/${createdProductId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        price: 279.99,
        description: 'Updated description with new discounted promo price.'
      })
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, 'PUT /api/products/:id returns status 200');
    assert(updateData.data.price === 279.99, 'Price successfully updated to 279.99');
    assert(updateData.data.description.includes('discounted promo'), 'Description updated correctly');

    // -----------------------------------------------------------
    // TEST 6: Safe Stock Increments & Decrements (Restock & Sale)
    // -----------------------------------------------------------
    console.log('\n[Test 6] Safe Stock Operations (Restock & Sale)');

    // 6a. Restock (Increment)
    const restockRes = await fetch(`${BASE_URL}/api/products/${createdProductId}/restock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: 15 })
    });
    const restockData = await restockRes.json();
    assert(restockRes.status === 200, 'Restock returns status 200');
    assert(restockData.data.currentStock === 40, 'Stock correctly incremented from 25 to 40');

    // 6b. Normal Sale (Decrement)
    const saleRes = await fetch(`${BASE_URL}/api/products/${createdProductId}/sale`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: 10 })
    });
    const saleData = await saleRes.json();
    assert(saleRes.status === 200, 'Sale returns status 200');
    assert(saleData.data.currentStock === 30, 'Stock correctly decremented from 40 to 30');

    // 6c. Overselling Protection (Requested quantity > Available stock)
    const overSaleRes = await fetch(`${BASE_URL}/api/products/${createdProductId}/sale`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: 100 }) // Current stock is only 30!
    });
    const overSaleData = await overSaleRes.json();
    assert(overSaleRes.status === 400, 'Oversell attempt rejected with status 400 Bad Request');
    assert(overSaleData.error.type === 'InsufficientStockError', 'Returns InsufficientStockError');

    // Verify stock was unaffected by failed oversell
    const verifyStockRes = await fetch(`${BASE_URL}/api/products/${createdProductId}`);
    const verifyStockData = await verifyStockRes.json();
    assert(verifyStockData.data.stock === 30, 'Inventory stock remained safely untouched at 30');

    // -----------------------------------------------------------
    // TEST 7: Filtering, Sorting & Pagination
    // -----------------------------------------------------------
    console.log('\n[Test 7] Catalog Querying: Filtering, Sorting & Pagination');

    // 7a. Pagination
    const pageRes = await fetch(`${BASE_URL}/api/products?page=1&limit=2`);
    const pageData = await pageRes.json();
    assert(pageRes.status === 200, 'GET /api/products returns status 200');
    assert(pageData.pagination.currentPage === 1, 'Pagination reports currentPage: 1');
    assert(pageData.pagination.limit === 2, 'Pagination honors limit: 2');
    assert(pageData.data.length <= 2, 'Returned data items count <= limit');

    // 7b. Filter by Category
    const catRes = await fetch(`${BASE_URL}/api/products?category=Electronics`);
    const catData = await catRes.json();
    const allElectronics = catData.data.every((p) => p.category.toLowerCase() === 'electronics');
    assert(allElectronics, 'All filtered items belong to category Electronics');

    // 7c. Filter by Price Range
    const priceRes = await fetch(`${BASE_URL}/api/products?minPrice=50&maxPrice=300`);
    const priceData = await priceRes.json();
    const inRange = priceData.data.every((p) => p.price >= 50 && p.price <= 300);
    assert(inRange, 'All filtered items fall within price range [50, 300]');

    // 7d. Sorting by Price Ascending
    const sortRes = await fetch(`${BASE_URL}/api/products?sortBy=price&order=asc&limit=10`);
    const sortData = await sortRes.json();
    let isSortedAsc = true;
    for (let i = 1; i < sortData.data.length; i++) {
      if (sortData.data[i].price < sortData.data[i - 1].price) {
        isSortedAsc = false;
        break;
      }
    }
    assert(isSortedAsc, 'Products sorted in ascending order of price');

    // -----------------------------------------------------------
    // TEST 8: Low-Stock Report
    // -----------------------------------------------------------
    console.log('\n[Test 8] Low-Stock Alert Report (GET /api/reports/low-stock)');
    const lowStockRes = await fetch(`${BASE_URL}/api/reports/low-stock`);
    const lowStockData = await lowStockRes.json();
    assert(lowStockRes.status === 200, 'Low-stock report returns status 200');
    assert(lowStockData.summary !== undefined, 'Summary statistics present in report');
    assert(Array.isArray(lowStockData.data), 'Report contains array of low-stock items');

    // -----------------------------------------------------------
    // TEST 9: Category-wise Summary Aggregation Pipeline
    // -----------------------------------------------------------
    console.log('\n[Test 9] Category-wise Aggregation Summary (GET /api/reports/category-summary)');
    const aggRes = await fetch(`${BASE_URL}/api/reports/category-summary`);
    const aggData = await aggRes.json();
    assert(aggRes.status === 200, 'Aggregation report returns status 200');
    assert(aggData.warehouseTotals !== undefined, 'Warehouse totals KPI block present');
    assert(Array.isArray(aggData.categories), 'Categories aggregation array returned');
    if (aggData.categories.length > 0) {
      const firstCat = aggData.categories[0];
      assert(firstCat.totalProducts > 0, 'Category aggregation contains totalProducts count');
      assert(firstCat.totalCategoryValuation >= 0, 'Category aggregation contains totalCategoryValuation');
      assert(firstCat.avgPrice !== undefined, 'Category aggregation contains avgPrice');
    }

    // -----------------------------------------------------------
    // TEST 10: Delete Product & Post-Deletion Verification
    // -----------------------------------------------------------
    console.log('\n[Test 10] Delete Product (DELETE /api/products/:id)');
    const deleteRes = await fetch(`${BASE_URL}/api/products/${createdProductId}`, {
      method: 'DELETE'
    });
    const deleteData = await deleteRes.json();
    assert(deleteRes.status === 200, 'DELETE returns status 200 OK');
    assert(deleteData.data.id === createdProductId, 'Deleted product snapshot returned');

    // Verify product no longer exists
    const verifyDeletedRes = await fetch(`${BASE_URL}/api/products/${createdProductId}`);
    assert(verifyDeletedRes.status === 404, 'Deleted product now returns status 404 Not Found');

    // -----------------------------------------------------------
    // TEST 11: Student Data Management Endpoints & Aggregation
    // -----------------------------------------------------------
    console.log('\n[Test 11] Student Data Management (GET /api/students & Aggregations)');

    // 11a. Fetch All Students
    const allStudentsRes = await fetch(`${BASE_URL}/api/students`);
    const allStudentsData = await allStudentsRes.json();
    assert(allStudentsRes.status === 200, 'GET /api/students returns status 200');
    assert(allStudentsData.pagination.totalStudents >= 15, 'Returns seeded student collection (>= 15)');

    // 11b. Fetch Student by Custom studentId (STU001)
    const stu1Res = await fetch(`${BASE_URL}/api/students/STU001`);
    const stu1Data = await stu1Res.json();
    assert(stu1Res.status === 200, 'GET /api/students/STU001 returns status 200');
    assert(stu1Data.data.name === 'Aarav Sharma', 'Student STU001 matches Aarav Sharma');
    assert(stu1Data.data.totalMarks === 256, 'Virtual totalMarks computed correctly (88+76+92 = 256)');

    // 11c. Filter Students by Course
    const cseStudentsRes = await fetch(`${BASE_URL}/api/students?course=CSE`);
    const cseStudentsData = await cseStudentsRes.json();
    assert(cseStudentsRes.status === 200, 'Filter by course=CSE returns status 200');
    const allCSE = cseStudentsData.data.every((s) => s.course === 'CSE');
    assert(allCSE, 'All filtered student records belong to CSE');

    // 11d. Update Fee Status
    const feeUpdateRes = await fetch(`${BASE_URL}/api/students/STU003/fees`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feesPaid: true })
    });
    const feeUpdateData = await feeUpdateRes.json();
    assert(feeUpdateRes.status === 200, 'PATCH /api/students/STU003/fees returns status 200');
    assert(feeUpdateData.data.feesPaid === true, 'Rahul Singh (STU003) fee status updated to true');

    // 11e. Course-wise Aggregation Summary
    const courseSummaryRes = await fetch(`${BASE_URL}/api/students/reports/course-summary`);
    const courseSummaryData = await courseSummaryRes.json();
    assert(courseSummaryRes.status === 200, 'GET /api/students/reports/course-summary returns status 200');
    assert(Array.isArray(courseSummaryData.courses), 'Course aggregation returns courses array');
    assert(courseSummaryData.institutionTotals !== undefined, 'Institution totals KPI present');

  } catch (error) {
    console.error(`\nTest Runner Exception: ${error.message}`);
    failedTests++;
  } finally {
    server.close();
    await mongoose.connection.close();

    console.log('\n======================================================');
    console.log(`TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('======================================================\n');

    process.exit(failedTests > 0 ? 1 : 0);
  }
};

runTests();
