const Student = require('../models/Student');
const mongoose = require('mongoose');

/**
 * @desc    Create a new student
 * @route   POST /api/students
 * @access  Public
 */
const createStudent = async (req, res, next) => {
  try {
    const student = await Student.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Student record created successfully',
      data: student
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all students with filtering, sorting, and pagination
 * @route   GET /api/students
 * @access  Public
 */
const getStudents = async (req, res, next) => {
  try {
    const {
      search,
      course,
      semester,
      city,
      gender,
      feesPaid,
      isActive,
      minAttendance,
      skill,
      sortBy = 'studentId',
      order = 'asc',
      page = 1,
      limit = 10
    } = req.query;

    const filter = {};

    // Keyword search in name, email, studentId
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { studentId: { $regex: searchRegex } }
      ];
    }

    // Exact or regex match filters
    if (course && course.trim() !== '') {
      filter.course = new RegExp(`^${course.trim()}$`, 'i');
    }

    if (semester !== undefined) {
      filter.semester = Number(semester);
    }

    if (city && city.trim() !== '') {
      filter.city = new RegExp(`^${city.trim()}$`, 'i');
    }

    if (gender && gender.trim() !== '') {
      filter.gender = new RegExp(`^${gender.trim()}$`, 'i');
    }

    if (feesPaid !== undefined) {
      filter.feesPaid = feesPaid === 'true' || feesPaid === true;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    }

    if (minAttendance !== undefined) {
      filter.attendance = { $gte: Number(minAttendance) };
    }

    if (skill && skill.trim() !== '') {
      filter.skills = new RegExp(skill.trim(), 'i');
    }

    // Sort setup
    const allowedSortFields = ['studentId', 'name', 'age', 'attendance', 'createdAt', 'semester'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'studentId';
    const sortDirection = order.toLowerCase() === 'desc' ? -1 : 1;
    const sort = { [sortField]: sortDirection };

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [totalStudents, students] = await Promise.all([
      Student.countDocuments(filter),
      Student.find(filter).sort(sort).skip(skip).limit(limitNum)
    ]);

    const totalPages = Math.ceil(totalStudents / limitNum) || 1;

    res.status(200).json({
      success: true,
      pagination: {
        totalStudents,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      count: students.length,
      data: students
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single student by MongoDB ObjectId or studentId (e.g. STU001)
 * @route   GET /api/students/:id
 * @access  Public
 */
const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let student;

    if (mongoose.Types.ObjectId.isValid(id)) {
      student = await Student.findById(id);
    } else {
      student = await Student.findOne({ studentId: id.toUpperCase() });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        error: {
          type: 'NotFoundError',
          message: `Student with identifier '${id}' not found`
        }
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update student record
 * @route   PUT /api/students/:id
 * @access  Public
 */
const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { studentId: id.toUpperCase() };

    const student = await Student.findOneAndUpdate(query, { $set: req.body }, { returnDocument: 'after', runValidators: true });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: {
          type: 'NotFoundError',
          message: `Student with identifier '${id}' not found`
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student record updated successfully',
      data: student
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update student fee status
 * @route   PATCH /api/students/:id/fees
 * @access  Public
 */
const updateFeeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { feesPaid } = req.body;

    if (feesPaid === undefined || typeof feesPaid !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: {
          type: 'ValidationError',
          message: "'feesPaid' boolean field is required in request body"
        }
      });
    }

    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { studentId: id.toUpperCase() };
    const student = await Student.findOneAndUpdate(query, { $set: { feesPaid } }, { returnDocument: 'after', runValidators: true });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: {
          type: 'NotFoundError',
          message: `Student with identifier '${id}' not found`
        }
      });
    }

    res.status(200).json({
      success: true,
      message: `Fee payment status updated to: ${feesPaid ? 'PAID' : 'PENDING'}`,
      data: {
        studentId: student.studentId,
        name: student.name,
        feesPaid: student.feesPaid
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete student record
 * @route   DELETE /api/students/:id
 * @access  Public
 */
const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { studentId: id.toUpperCase() };

    const student = await Student.findOneAndDelete(query);

    if (!student) {
      return res.status(404).json({
        success: false,
        error: {
          type: 'NotFoundError',
          message: `Student with identifier '${id}' not found`
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student record successfully deleted',
      data: {
        id: student._id,
        studentId: student.studentId,
        name: student.name
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Course-wise Aggregation Summary (Data Management Analytics)
 * @route   GET /api/students/reports/course-summary
 * @access  Public
 */
const getCourseSummary = async (req, res, next) => {
  try {
    const summary = await Student.aggregate([
      {
        $group: {
          _id: '$course',
          totalStudents: { $sum: 1 },
          avgAttendance: { $avg: '$attendance' },
          avgMathMarks: { $avg: '$marks.math' },
          avgDbmsMarks: { $avg: '$marks.dbms' },
          avgWebMarks: { $avg: '$marks.web' },
          feesPaidCount: {
            $sum: { $cond: [{ $eq: ['$feesPaid', true] }, 1, 0] }
          },
          feesPendingCount: {
            $sum: { $cond: [{ $eq: ['$feesPaid', false] }, 1, 0] }
          },
          activeStudentsCount: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          course: '$_id',
          totalStudents: 1,
          avgAttendance: { $round: ['$avgAttendance', 2] },
          avgMathMarks: { $round: ['$avgMathMarks', 2] },
          avgDbmsMarks: { $round: ['$avgDbmsMarks', 2] },
          avgWebMarks: { $round: ['$avgWebMarks', 2] },
          overallAvgMarks: {
            $round: [
              {
                $divide: [{ $add: ['$avgMathMarks', '$avgDbmsMarks', '$avgWebMarks'] }, 3]
              },
              2
            ]
          },
          feesPaidCount: 1,
          feesPendingCount: 1,
          activeStudentsCount: 1
        }
      },
      {
        $sort: { totalStudents: -1 }
      }
    ]);

    // Overall metrics across all courses
    const overallStats = await Student.aggregate([
      {
        $group: {
          _id: null,
          totalEnrolledStudents: { $sum: 1 },
          overallAvgAttendance: { $avg: '$attendance' },
          totalFeesPaid: {
            $sum: { $cond: [{ $eq: ['$feesPaid', true] }, 1, 0] }
          },
          totalFeesPending: {
            $sum: { $cond: [{ $eq: ['$feesPaid', false] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalEnrolledStudents: 1,
          overallAvgAttendance: { $round: ['$overallAvgAttendance', 2] },
          totalFeesPaid: 1,
          totalFeesPending: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      reportType: 'Course-wise Student Data Management Summary',
      generatedAt: new Date().toISOString(),
      institutionTotals: overallStats[0] || {},
      courses: summary
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  updateFeeStatus,
  deleteStudent,
  getCourseSummary
};
