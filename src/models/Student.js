const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^STU\d{3,}$/, 'Student ID must follow format STU001, STU002, etc.']
    },
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [16, 'Student age must be at least 16'],
      max: [100, 'Invalid student age']
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: {
        values: ['Male', 'Female', 'Other'],
        message: '{VALUE} is not a valid gender'
      }
    },
    course: {
      type: String,
      required: [true, 'Course is required'],
      trim: true,
      enum: {
        values: ['CSE', 'BCA', 'BBA', 'MCA', 'Other'],
        message: '{VALUE} is not a valid course'
      }
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: [1, 'Semester must be at least 1'],
      max: [8, 'Semester cannot exceed 8']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    marks: {
      math: {
        type: Number,
        min: [0, 'Marks cannot be negative'],
        max: [100, 'Marks cannot exceed 100'],
        default: 0
      },
      dbms: {
        type: Number,
        min: [0, 'Marks cannot be negative'],
        max: [100, 'Marks cannot exceed 100'],
        default: 0
      },
      web: {
        type: Number,
        min: [0, 'Marks cannot be negative'],
        max: [100, 'Marks cannot exceed 100'],
        default: 0
      }
    },
    attendance: {
      type: Number,
      required: [true, 'Attendance percentage is required'],
      min: [0, 'Attendance cannot be negative'],
      max: [100, 'Attendance cannot exceed 100']
    },
    feesPaid: {
      type: Boolean,
      default: false
    },
    skills: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual property: totalMarks
studentSchema.virtual('totalMarks').get(function () {
  if (!this.marks) return 0;
  return (this.marks.math || 0) + (this.marks.dbms || 0) + (this.marks.web || 0);
});

// Virtual property: percentage
studentSchema.virtual('percentage').get(function () {
  if (!this.marks) return 0;
  const total = (this.marks.math || 0) + (this.marks.dbms || 0) + (this.marks.web || 0);
  return Math.round((total / 3) * 100) / 100;
});

// Compound and single field indexes
studentSchema.index({ course: 1, semester: 1 });
studentSchema.index({ city: 1 });
studentSchema.index({ attendance: 1 });
studentSchema.index({ feesPaid: 1 });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
