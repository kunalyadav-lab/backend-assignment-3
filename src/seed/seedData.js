require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Student = require('../models/Student');
const connectDB = require('../config/db');

const sampleProducts = [
  // Electronics
  {
    name: 'Wireless Noise-Canceling Headphones',
    sku: 'ELEC-WNC-001',
    description: 'Over-ear Bluetooth headphones with active noise cancellation and 30-hour battery life.',
    category: 'Electronics',
    price: 199.99,
    stock: 45,
    reorderLevel: 15,
    status: 'active',
    tags: ['audio', 'wireless', 'bluetooth']
  },
  {
    name: 'Ultra-HD 4K Webcam',
    sku: 'ELEC-CAM-002',
    description: 'Streaming camera with dual stereo microphones and autofocus.',
    category: 'Electronics',
    price: 89.5,
    stock: 8,
    reorderLevel: 10,
    status: 'active',
    tags: ['streaming', 'work-from-home', 'camera']
  },
  {
    name: 'Mechanical Gaming Keyboard',
    sku: 'ELEC-KEY-003',
    description: 'RGB mechanical keyboard with hot-swappable switches and detachable USB-C cable.',
    category: 'Electronics',
    price: 129.0,
    stock: 0,
    reorderLevel: 12,
    status: 'active',
    tags: ['gaming', 'peripheral', 'keyboard']
  },
  {
    name: 'USB-C Multiport Adapter Hub',
    sku: 'ELEC-HUB-004',
    description: '7-in-1 USB-C hub with 4K HDMI, 100W Power Delivery, and SD card reader.',
    category: 'Electronics',
    price: 49.99,
    stock: 65,
    reorderLevel: 20,
    status: 'active',
    tags: ['accessories', 'usb-c', 'hardware']
  },

  // Clothing
  {
    name: 'Classic Organic Cotton T-Shirt',
    sku: 'CLTH-TSH-101',
    description: 'Breathable, 100% certified organic cotton crewneck tee.',
    category: 'Clothing',
    price: 24.99,
    stock: 120,
    reorderLevel: 30,
    status: 'active',
    tags: ['apparel', 'cotton', 'basics']
  },
  {
    name: 'Slim-Fit Stretch Denim Jeans',
    sku: 'CLTH-JNS-102',
    description: 'Premium stretch denim with reinforced stitching and 5-pocket styling.',
    category: 'Clothing',
    price: 69.95,
    stock: 5,
    reorderLevel: 15,
    status: 'active',
    tags: ['apparel', 'denim', 'casual']
  },
  {
    name: 'Waterproof All-Weather Windbreaker',
    sku: 'CLTH-JCK-103',
    description: 'Lightweight packable hooded jacket with water-resistant membrane.',
    category: 'Clothing',
    price: 110.0,
    stock: 22,
    reorderLevel: 10,
    status: 'active',
    tags: ['outerwear', 'weatherproof', 'jacket']
  },

  // Home & Kitchen
  {
    name: 'Stainless Steel French Press Coffee Maker',
    sku: 'HOME-COF-201',
    description: 'Double-wall insulated 34-ounce French press with 4-level filtration system.',
    category: 'Home & Kitchen',
    price: 34.99,
    stock: 35,
    reorderLevel: 10,
    status: 'active',
    tags: ['kitchen', 'coffee', 'brewing']
  },
  {
    name: 'Cast Iron Pre-Seasoned Skillet (12-inch)',
    sku: 'HOME-SKI-202',
    description: 'Heavy-duty cast iron skillet with dual pour spouts and assist handle.',
    category: 'Home & Kitchen',
    price: 45.0,
    stock: 3,
    reorderLevel: 10,
    status: 'active',
    tags: ['cookware', 'kitchen', 'cast-iron']
  },
  {
    name: 'Programmable Digital Air Fryer XL',
    sku: 'HOME-AFR-203',
    description: '6-quart rapid hot-air fryer with 8 one-touch cooking presets.',
    category: 'Home & Kitchen',
    price: 119.99,
    stock: 0,
    reorderLevel: 5,
    status: 'active',
    tags: ['appliance', 'kitchen', 'air-fryer']
  },

  // Books
  {
    name: 'Designing Data-Intensive Applications',
    sku: 'BOOK-DDI-301',
    description: 'The definitive guide to the architecture and principles of reliable modern data systems.',
    category: 'Books',
    price: 44.95,
    stock: 50,
    reorderLevel: 15,
    status: 'active',
    tags: ['tech', 'database', 'engineering']
  },
  {
    name: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    sku: 'BOOK-CLN-302',
    description: 'Best practices, patterns, and principles for writing readable, maintainable software.',
    category: 'Books',
    price: 39.99,
    stock: 4,
    reorderLevel: 12,
    status: 'active',
    tags: ['programming', 'software', 'books']
  },

  // Sports & Outdoors
  {
    name: 'High-Density Non-Slip Yoga Mat',
    sku: 'SPRT-YOG-401',
    description: '6mm eco-friendly TPE foam exercise mat with alignment marks and carrying strap.',
    category: 'Sports & Outdoors',
    price: 29.99,
    stock: 80,
    reorderLevel: 20,
    status: 'active',
    tags: ['fitness', 'yoga', 'exercise']
  },
  {
    name: 'Insulated Stainless Steel Water Bottle (32oz)',
    sku: 'SPRT-BOT-402',
    description: 'Vacuum insulated flask keeping drinks cold for 24h or hot for 12h.',
    category: 'Sports & Outdoors',
    price: 22.5,
    stock: 95,
    reorderLevel: 25,
    status: 'active',
    tags: ['hydration', 'fitness', 'outdoor']
  },

  // Office Supplies
  {
    name: 'Ergonomic Memory Foam Lumbar Cushion',
    sku: 'OFFC-LUM-501',
    description: 'Contoured orthopedic support cushion for office chairs with breathable mesh cover.',
    category: 'Office Supplies',
    price: 32.0,
    stock: 18,
    reorderLevel: 10,
    status: 'active',
    tags: ['ergonomics', 'office', 'chair']
  }
];

// 15 University Student records provided in assignment
const sampleStudents = [
  {
    _id: new mongoose.Types.ObjectId('6ab2229364e805b2875c0832'),
    studentId: 'STU001',
    name: 'Aarav Sharma',
    age: 20,
    gender: 'Male',
    course: 'CSE',
    semester: 4,
    city: 'Delhi',
    email: 'aarav@example.com',
    marks: { math: 88, dbms: 76, web: 92 },
    attendance: 91,
    feesPaid: true,
    skills: ['JavaScript', 'MongoDB', 'React'],
    isActive: true
  },
  {
    _id: new mongoose.Types.ObjectId('6ab2229364e805b2875c0833'),
    studentId: 'STU002',
    name: 'Priya Verma',
    age: 19,
    gender: 'Female',
    course: 'CSE',
    semester: 2,
    city: 'Gurgaon',
    email: 'priya@example.com',
    marks: { math: 95, dbms: 89, web: 94 },
    attendance: 96,
    feesPaid: true,
    skills: ['HTML', 'CSS', 'JavaScript'],
    isActive: true
  },
  {
    _id: new mongoose.Types.ObjectId('6ab2229364e805b2875c0834'),
    studentId: 'STU003',
    name: 'Rahul Singh',
    age: 21,
    gender: 'Male',
    course: 'BCA',
    semester: 4,
    city: 'Noida',
    email: 'rahul@example.com',
    marks: { math: 72, dbms: 68, web: 81 },
    attendance: 78,
    feesPaid: false,
    skills: ['Python', 'SQL'],
    isActive: true
  },
  {
    _id: new mongoose.Types.ObjectId('6ab2229364e805b2875c0835'),
    studentId: 'STU004',
    name: 'Sneha Gupta',
    age: 20,
    gender: 'Female',
    course: 'BCA',
    semester: 6,
    city: 'Delhi',
    email: 'sneha@example.com',
    marks: { math: 84, dbms: 91, web: 87 },
    attendance: 88,
    feesPaid: true,
    skills: ['Java', 'SQL', 'React'],
    isActive: true
  },
  {
    _id: new mongoose.Types.ObjectId('6ab2229364e805b2875c0836'),
    studentId: 'STU005',
    name: 'Mohit Kumar',
    age: 22,
    gender: 'Male',
    course: 'BBA',
    semester: 6,
    city: 'Faridabad',
    email: 'mohit@example.com',
    marks: { math: 65, dbms: 59, web: 70 },
    attendance: 72,
    feesPaid: false,
    skills: ['Excel', 'Power BI'],
    isActive: false
  },
  {
    _id: new mongoose.Types.ObjectId('6ab2229364e805b2875c0837'),
    studentId: 'STU006',
    name: 'Ananya Mehta',
    age: 19,
    gender: 'Female',
    course: 'CSE',
    semester: 2,
    city: 'Jaipur',
    email: 'ananya@example.com',
    marks: { math: 91, dbms: 85, web: 89 },
    attendance: 94,
    feesPaid: true,
    skills: ['React', 'Node.js', 'MongoDB'],
    isActive: true
  },
  {
    _id: new mongoose.Types.ObjectId('6ab2229364e805b2875c0838'),
    studentId: 'STU007',
    name: 'Vikram Yadav',
    age: 23,
    gender: 'Male',
    course: 'BCA',
    semester: 6,
    city: 'Gurgaon',
    email: 'vikram@example.com',
    marks: { math: 78, dbms: 74, web: 69 },
    attendance: 81,
    feesPaid: true,
    skills: ['PHP', 'MySQL'],
    isActive: true
  },
  {
    _id: new mongoose.Types.ObjectId('6ab2229364e805b2875c0839'),
    studentId: 'STU008',
    name: 'Ishita Jain',
    age: 20,
    gender: 'Female',
    course: 'CSE',
    semester: 4,
    city: 'Noida',
    email: 'ishita@example.com',
    marks: { math: 87, dbms: 93, web: 90 },
    attendance: 89,
    feesPaid: true,
    skills: ['JavaScript', 'Node.js', 'Express'],
    isActive: true
  },
  {
    _id: new mongoose.Types.ObjectId('6ab2229364e805b2875c083a'),
    studentId: 'STU009',
    name: 'Karan Malhotra',
    age: 21,
    gender: 'Male',
    course: 'BBA',
    semester: 4,
    city: 'Delhi',
    email: 'karan@example.com',
    marks: { math: 82, dbms: 71, web: 66 },
    attendance: 85,
    feesPaid: true,
    skills: ['Excel', 'SQL'],
    isActive: true
  },
  {
    _id: new mongoose.Types.ObjectId('6ab2229364e805b2875c083b'),
    studentId: 'STU010',
    name: 'Neha Kapoor',
    age: 18,
    gender: 'Female',
    course: 'CSE',
    semester: 1,
    city: 'Faridabad',
    email: 'neha@example.com',
    marks: { math: 76, dbms: 80, web: 85 },
    attendance: 90,
    feesPaid: false,
    skills: ['HTML', 'CSS'],
    isActive: true
  },
  {
    _id: new mongoose.Types.ObjectId('6ab2229364e805b2875c083c'),
    studentId: 'STU011',
    name: 'Aditya Joshi',
    age: 24,
    gender: 'Male',
    course: 'MCA',
    semester: 2,
    city: 'Delhi',
    email: 'aditya@example.com',
    marks: { math: 89, dbms: 86, web: 91 },
    attendance: 87,
    feesPaid: true,
    skills: ['Java', 'Spring', 'SQL'],
    isActive: true
  },
  {
    _id: new mongoose.Types.ObjectId('6ab2229364e805b2875c083d'),
    studentId: 'STU012',
    name: 'Riya Chawla',
    age: 22,
    gender: 'Female',
    course: 'MCA',
    semester: 4,
    city: 'Noida',
    email: 'riya@example.com',
    marks: { math: 96, dbms: 92, web: 95 },
    attendance: 97,
    feesPaid: true,
    skills: ['React', 'Node.js', 'MongoDB'],
    isActive: true
  },
  {
    _id: new mongoose.Types.ObjectId('6ab2229364e805b2875c083e'),
    studentId: 'STU013',
    name: 'Nitin Saini',
    age: 20,
    gender: 'Male',
    course: 'CSE',
    semester: 4,
    city: 'Jaipur',
    email: 'nitin@example.com',
    marks: { math: 69, dbms: 73, web: 77 },
    attendance: 74,
    feesPaid: false,
    skills: ['C', 'C++'],
    isActive: false
  },
  {
    _id: new mongoose.Types.ObjectId('6ab2229364e805b2875c083f'),
    studentId: 'STU014',
    name: 'Pooja Agarwal',
    age: 21,
    gender: 'Female',
    course: 'BCA',
    semester: 4,
    city: 'Gurgaon',
    email: 'pooja@example.com',
    marks: { math: 88, dbms: 79, web: 83 },
    attendance: 92,
    feesPaid: true,
    skills: ['Python', 'Django', 'SQL'],
    isActive: true
  },
  {
    _id: new mongoose.Types.ObjectId('6ab2229364e805b2875c0840'),
    studentId: 'STU015',
    name: 'Harsh Vardhan',
    age: 19,
    gender: 'Male',
    course: 'BBA',
    semester: 2,
    city: 'Delhi',
    email: 'harsh@example.com',
    marks: { math: 74, dbms: 62, web: 71 },
    attendance: 79,
    feesPaid: false,
    skills: ['Excel', 'Power BI', 'SQL'],
    isActive: false
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('[Seeder] Clearing existing products & students...');
    await Promise.all([Product.deleteMany({}), Student.deleteMany({})]);

    console.log(`[Seeder] Inserting ${sampleProducts.length} sample products...`);
    const insertedProducts = await Product.insertMany(sampleProducts);

    console.log(`[Seeder] Inserting ${sampleStudents.length} student records...`);
    const insertedStudents = await Student.insertMany(sampleStudents);

    console.log(`[Seeder] Successfully seeded:`);
    console.log(`  - Products: ${insertedProducts.length}`);
    console.log(`  - Students: ${insertedStudents.length}`);
    process.exit(0);
  } catch (error) {
    console.error(`[Seeder Error] Failed to seed database: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
