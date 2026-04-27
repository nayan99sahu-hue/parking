require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const ParchiType = require('./models/ParchiType');
const connectDB = require('./config/db');

const seed = async () => {
  await connectDB();
  await User.deleteMany();
  await ParchiType.deleteMany();

  await User.create([
    { name: 'Super Admin', email: 'admin@parchi.com', password: 'admin123', role: 'admin' },
    { name: 'Operator One', email: 'op1@parchi.com', password: 'op123', role: 'operator' },
    { name: 'Operator Two', email: 'op2@parchi.com', password: 'op123', role: 'operator' },
  ]);

  await ParchiType.create([
    { name: 'Small Parchi', amount: 5, prefix: 'T05', color: '#0d9488', description: '₹5 parking ticket' },
    { name: 'Medium Parchi', amount: 10, prefix: 'T10', color: '#0891b2', description: '₹10 parking ticket' },
    { name: 'Large Parchi', amount: 20, prefix: 'T20', color: '#7c3aed', description: '₹20 parking ticket' },
    { name: 'Premium Parchi', amount: 50, prefix: 'T50', color: '#dc2626', description: '₹50 parking ticket' },
    { name: 'Special Parchi', amount: 100, prefix: 'T100', color: '#d97706', description: '₹100 parking ticket' },
  ]);

  console.log('✅ Seeded successfully');
  console.log('Admin: admin@parchi.com / admin123');
  console.log('Operator: op1@parchi.com / op123');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
