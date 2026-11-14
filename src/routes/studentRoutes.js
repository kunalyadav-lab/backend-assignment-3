const express = require('express');
const router = express.Router();
const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  updateFeeStatus,
  deleteStudent,
  getCourseSummary
} = require('../controllers/studentController');

// Aggregation summary route (placed before /:id)
router.get('/reports/course-summary', getCourseSummary);

// Standard CRUD endpoints
router
  .route('/')
  .post(createStudent)
  .get(getStudents);

router
  .route('/:id')
  .get(getStudentById)
  .put(updateStudent)
  .delete(deleteStudent);

// Specific operational updates
router.patch('/:id/fees', updateFeeStatus);

module.exports = router;
