const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Menu = require('../models/Menu');
const Admin = require('../models/Admin');
require('dotenv').config();

const sampleMenus = [
  {
    name: "Espresso",
    description: "Kopi espresso klasik dengan rasa yang kuat dan aroma yang menggugah",
    price: 25000,
    category: "espresso",
    ingredients: ["Biji kopi Arabika pilihan", "Air panas"],
    preparationTime: 3,
    popularity: 1245,
    imageUrl: "/uploads/default-coffee.jpg"
  },
  {
    name: "Cappuccino",
    description: "Kombinasi sempurna espresso, susu steamed dan foam dengan latte art cantik",
    price: 35000,
    category: "espresso",
    ingredients: ["Espresso", "Susu steamed", "Foam susu"],
    preparationTime: 5,
    popularity: 985,
    imageUrl: "/uploads/default-coffee.jpg"
  },
  {
    name: "Iced Coffee",
    description: "Kopi dingin yang menyegarkan dengan es batu, sempurna untuk hari panas",
    price: 30000,
    category: "manual-brew",
    ingredients: ["Kopi tubruk", "Es batu", "Gula cair"],
    preparationTime: 4,
    popularity: 876,
    imageUrl: "/uploads/default-coffee.jpg"
  },
  {
    name: "Latte",
    description: "Espresso dengan susu steamed yang lembut dan creamy",
    price: 38000,
    category: "espresso",
    ingredients: ["Espresso", "Susu steamed"],
    preparationTime: 5,
    popularity: 754,
    imageUrl: "/uploads/default-coffee.jpg"
  },
  {
    name: "Arabica Blend",
    description: "Biji kopi pilihan dengan rasa smooth dan aroma floral",
    price: 40000,
    category: "signature",
    ingredients: ["Biji kopi Arabika premium", "Rempah pilihan"],
    preparationTime: 6,
    popularity: 643,
    imageUrl: "/uploads/default-coffee.jpg"
  },
  {
    name: "Caramel Macchiato",
    description: "Espresso dengan vanila, susu steamed dan caramel drizzle",
    price: 42000,
    category: "signature",
    ingredients: ["Espresso", "Sirup vanila", "Susu steamed", "Caramel"],
    preparationTime: 6,
    popularity: 532,
    imageUrl: "/uploads/default-coffee.jpg"
  },
  {
    name: "Americano",
    description: "Espresso dengan tambahan air panas, rasa kopi yang kuat",
    price: 28000,
    category: "espresso",
    ingredients: ["Espresso", "Air panas"],
    preparationTime: 3,
    popularity: 421,
    imageUrl: "/uploads/default-coffee.jpg"
  },
  {
    name: "Mocha",
    description: "Perpaduan espresso dengan coklat dan susu steamed",
    price: 38000,
    category: "signature",
    ingredients: ["Espresso", "Coklat", "Susu steamed", "Whipped cream"],
    preparationTime: 5,
    popularity: 389,
    imageUrl: "/uploads/default-coffee.jpg"
  },
  {
    name: "Kopi Tubruk",
    description: "Kopi tradisional Indonesia dengan cita rasa yang autentik",
    price: 20000,
    category: "manual-brew",
    ingredients: ["Biji kopi giling", "Air panas", "Gula"],
    preparationTime: 4,
    popularity: 765,
    imageUrl: "/uploads/default-coffee.jpg"
  },
  {
    name: "Green Tea Latte",
    description: "Minuman teh hijau dengan susu steamed untuk pecinta non-kopi",
    price: 35000,
    category: "non-coffee",
    ingredients: ["Matcha powder", "Susu steamed", "Gula"],
    preparationTime: 4,
    popularity: 298,
    imageUrl: "/uploads/default-coffee.jpg"
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');
    
    // Connect to database
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kopi_nusantara';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Menu.deleteMany({});
    await Admin.deleteMany({});
    console.log('✅ Cleared existing data\n');

    // Insert sample menus
    console.log('📝 Inserting sample menus...');
    const menus = await Menu.insertMany(sampleMenus);
    console.log(`✅ Inserted ${menus.length} sample menus\n`);

    // Create default admin user
    console.log('👨‍💼 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await Admin.create({
      username: 'admin',
      email: 'admin@kopinusantara.com',
      password: hashedPassword,
      role: 'superadmin'
    });
    console.log(`✅ Created admin user: ${admin.email}\n`);

    // Create additional test users
    const cashierPassword = await bcrypt.hash('cashier123', 10);
    const cashier = await Admin.create({
      username: 'cashier',
      email: 'cashier@kopinusantara.com',
      password: cashierPassword,
      role: 'cashier'
    });
    console.log(`✅ Created cashier user: ${cashier.email}\n`);

    console.log('='.repeat(50));
    console.log('🎉 Database seeding completed successfully!');
    console.log('='.repeat(50));
    console.log('\n📊 Sample Data Summary:');
    console.log(`   • ${menus.length} menu items created`);
    console.log(`   • 2 admin accounts created\n`);
    
    console.log('🔑 Login Credentials:');
    console.log('   Super Admin:');
    console.log('     Email: admin@kopinusantara.com');
    console.log('     Password: admin123\n');
    console.log('   Cashier:');
    console.log('     Email: cashier@kopinusantara.com');
    console.log('     Password: cashier123\n');
    
    console.log('🚀 To start the server:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Access API at: http://localhost:5000/api');
    console.log('   3. Test endpoints with the credentials above');
    console.log('='.repeat(50));

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Seeding error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Run seeding
seedDatabase();