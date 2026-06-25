const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Models for Seeding
const Category = require('./models/Category');
const Medicine = require('./models/Medicine');
const Employee = require('./models/Employee');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/medicines', require('./routes/medicineRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/chatbot', require('./routes/chatbotRoutes'));

// Default Health Route
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'KSJ Global Medical API Gateway is running.' });
});

// Database Auto-seeder
const seedData = async () => {
  try {
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      console.log('Seeding initial categories...');
      const categories = [
        { name: 'Tablets', slug: 'tablets', description: 'Oral tablets for generic treatment', imageURI: '/images/cat-tablets.jpg' },
        { name: 'Capsules', slug: 'capsules', description: 'Gelatin shell capsules', imageURI: '/images/cat-capsules.jpg' },
        { name: 'Syrups', slug: 'syrups', description: 'Liquid oral suspensions', imageURI: '/images/cat-syrups.jpg' },
        { name: 'Injections', slug: 'injections', description: 'Intravenous or intramuscular injectables', imageURI: '/images/cat-injections.jpg' },
        { name: 'Vitamins & Supplements', slug: 'vitamins-supplements', description: 'Daily nutrients and health boosters', imageURI: '/images/cat-vitamins.jpg' },
        { name: 'Diabetic Care', slug: 'diabetic-care', description: 'Blood sugar trackers and medications', imageURI: '/images/cat-diabetic.jpg' },
        { name: 'Ayurvedic Medicines', slug: 'ayurvedic', description: 'Herbal and traditional medicines', imageURI: '/images/cat-ayurvedic.jpg' }
      ];
      const insertedCats = await Category.insertMany(categories);

      console.log('Seeding initial medicines...');
      const medicines = [
        {
          name: 'Dolo 650mg',
          sku: 'MED-DOLO-650',
          genericName: 'Paracetamol',
          brand: 'Micro Labs',
          description: 'Effective medicine for reducing fever and treating mild to moderate pain.',
          category: insertedCats[0]._id, // Tablets
          price: 30,
          discountPrice: 27,
          stock: 120,
          minStockLevel: 15,
          expiryDate: new Date('2028-12-31'),
          requiresPrescription: false,
          dosage: 'One tablet as recommended by doctor, max 4 times a day',
          sideEffects: 'Nausea, allergic reactions (rare)',
          isFeatured: true
        },
        {
          name: 'Benadryl Cough Syrup 100ml',
          sku: 'MED-BENA-100',
          genericName: 'Diphenhydramine',
          brand: 'Johnson & Johnson',
          description: 'Soothes throat irritation and provides relief from dry cough.',
          category: insertedCats[2]._id, // Syrups
          price: 110,
          discountPrice: 99,
          stock: 80,
          minStockLevel: 10,
          expiryDate: new Date('2027-06-30'),
          requiresPrescription: false,
          dosage: '10ml three times daily or as prescribed',
          sideEffects: 'Drowsiness, dry mouth',
          isFeatured: true
        },
        {
          name: 'Zincovit Tablets',
          sku: 'MED-ZINC-TAB',
          genericName: 'Multivitamins and Zinc',
          brand: 'Apex Laboratories',
          description: 'Daily dietary supplement to support immune system functions and reduce fatigue.',
          category: insertedCats[4]._id, // Vitamins
          price: 150,
          discountPrice: 135,
          stock: 200,
          minStockLevel: 20,
          expiryDate: new Date('2028-03-31'),
          requiresPrescription: false,
          dosage: 'One tablet daily after meal',
          sideEffects: 'None reported for standard intake levels',
          isFeatured: true
        },
        {
          name: 'Humalog Insulin Injection',
          sku: 'MED-HUMA-INJ',
          genericName: 'Insulin Lispro',
          brand: 'Eli Lilly',
          description: 'Rapid-acting insulin analogue used to improve blood sugar control in diabetics.',
          category: insertedCats[3]._id, // Injections
          price: 980,
          discountPrice: 890,
          stock: 5, // Low stock indicator test
          minStockLevel: 8,
          expiryDate: new Date('2026-10-31'),
          requiresPrescription: true,
          dosage: 'Subcutaneous injection, dosage as calculated by physician',
          sideEffects: 'Hypoglycemia, injection site reactions',
          isFeatured: false
        }
      ];
      await Medicine.insertMany(medicines);
    }

    // Seed default admin employee if none exists
    const employeeCount = await Employee.countDocuments();
    if (employeeCount === 0) {
      console.log('Seeding default Admin employee account...');
      const admin = new Employee({
        employeeId: 'EMP-2026-0001',
        name: 'KSJ Main Admin',
        email: 'admin@ksjmedical.com',
        password: 'AdminPassword123',
        role: 'Admin',
        permissions: ['manage_inventory', 'update_orders', 'view_reports', 'manage_employees'],
        status: 'Active'
      });
      await admin.save();
      console.log('Admin account created: email: admin@ksjmedical.com, password: AdminPassword123');
    }
  } catch (err) {
    console.error('Data seeding failed:', err.message);
  }
};

// Start Server & Run Seeder
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running in mode on port ${PORT}`);
  await seedData();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server configuration error encountered.' });
});
