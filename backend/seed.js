require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const ParchiType = require('./models/ParchiType');
const MembershipType = require('./models/MembershipType');
const connectDB = require('./config/db');

const seed = async () => {
  await connectDB();
  await User.deleteMany();
  await ParchiType.deleteMany();
  await MembershipType.deleteMany();

  await User.create([
    { name: 'Super Admin', email: 'admin@parchi.com', password: 'admin123', role: 'admin', shift: 'Morning' },
    { name: 'Operator One', email: 'op1@parchi.com', password: 'op123', role: 'operator', shift: 'Morning' },
    { name: 'Operator Two', email: 'op2@parchi.com', password: 'op123', role: 'operator', shift: 'Evening' },
  ]);

  await ParchiType.create([
    { name: 'Small Parchi', amount: 5, prefix: 'T05', color: '#0d9488', description: '₹5 parking ticket' },
    { name: 'Medium Parchi', amount: 10, prefix: 'T10', color: '#0891b2', description: '₹10 parking ticket' },
    { name: 'Large Parchi', amount: 20, prefix: 'T20', color: '#7c3aed', description: '₹20 parking ticket' },
    { name: 'Premium Parchi', amount: 50, prefix: 'T50', color: '#dc2626', description: '₹50 parking ticket' },
    { name: 'Special Parchi', amount: 100, prefix: 'T100', color: '#d97706', description: '₹100 parking ticket' },
  ]);

  await MembershipType.create([
    { name: 'Monthly - 2 Wheeler', amount: 300, durationDays: 30, color: '#0891b2', description: 'Monthly membership for 2-wheelers' },
    { name: 'Monthly - 4 Wheeler', amount: 500, durationDays: 30, color: '#7c3aed', description: 'Monthly membership for 4-wheelers' },
    { name: 'Quarterly - 2 Wheeler', amount: 800, durationDays: 90, color: '#0d9488', description: 'Quarterly membership for 2-wheelers' },
    { name: 'Quarterly - 4 Wheeler', amount: 1400, durationDays: 90, color: '#dc2626', description: 'Quarterly membership for 4-wheelers' },
  ]);

  console.log('✅ Seeded successfully');
  console.log('Admin: admin@parchi.com / admin123');
  console.log('Operator: op1@parchi.com / op123');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
