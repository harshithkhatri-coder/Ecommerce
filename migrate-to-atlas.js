/**
 * MongoDB Migration Script
 * Migrates data from local MongoDB to MongoDB Atlas
 * 
 * Usage:
 * 1. Update the LOCAL_URI and ATLAS_URI below
 * 2. Run: node migrate-to-atlas.js
 */

const mongoose = require('mongoose');

// Connection strings - UPDATE THESE
const LOCAL_URI = "mongodb://127.0.0.1:27017/ecommerce";
const ATLAS_URI = "mongodb+srv://gowdarakshith4663_db_user:gowdaatlas@velux.ofigioe.mongodb.net/ecommerce?retryWrites=true&w=majority";

// Schemas (matching server.js)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: String,
  address: String,
  city: String,
  state: String,
  zip_code: String,
  country: String,
  wishlist: [String],
  role: String,
  created_at: Date,
  updated_at: Date
}, { collection: 'users' });

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  stock: Number,
  description: String,
  image_url: String,
  created_at: Date,
  updated_at: Date
}, { collection: 'products' });

const reviewSchema = new mongoose.Schema({
  product_id: String,
  user: String,
  rating: Number,
  comment: String,
  images: [String],
  created_at: Date
}, { collection: 'reviews' });

const orderSchema = new mongoose.Schema({
  order_id: String,
  user_id: String,
  items: [{
    product_id: String,
    name: String,
    price: Number,
    quantity: Number,
    image_url: String
  }],
  total: Number,
  address: String,
  status: String,
  estimated_delivery: Date,
  created_at: Date
}, { collection: 'orders' });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

async function migrate() {
  try {
    console.log('🔄 Starting migration from Local MongoDB to Atlas...\n');

    // Connect to local MongoDB
    console.log('📡 Connecting to local MongoDB...');
    await mongoose.connect(LOCAL_URI);
    console.log('✅ Connected to local MongoDB\n');

    // Export data from local DB
    console.log('📤 Exporting data from local database...');
    const users = await User.find({});
    const products = await Product.find({});
    const reviews = await Review.find({});
    const orders = await Order.find({});
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Reviews: ${reviews.length}`);
    console.log(`   - Orders: ${orders.length}\n`);

    // Disconnect from local
    await mongoose.disconnect();
    console.log('📴 Disconnected from local MongoDB\n');

    // Connect to Atlas
    console.log('📡 Connecting to MongoDB Atlas...');
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    // Import data to Atlas
    console.log('📥 Importing data to Atlas...');

    if (users.length > 0) {
      await User.deleteMany({});
      await User.insertMany(users);
      console.log(`   - ${users.length} users imported`);
    }

    if (products.length > 0) {
      await Product.deleteMany({});
      await Product.insertMany(products);
      console.log(`   - ${products.length} products imported`);
    }

    if (reviews.length > 0) {
      await Review.deleteMany({});
      await Review.insertMany(reviews);
      console.log(`   - ${reviews.length} reviews imported`);
    }

    if (orders.length > 0) {
      await Order.deleteMany({});
      await Order.insertMany(orders);
      console.log(`   - ${orders.length} orders imported`);
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('Your data has been migrated to MongoDB Atlas.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Check if user has updated the Atlas URI
if (ATLAS_URI.includes('your_username') || ATLAS_URI.includes('cluster0.xxxxx')) {
  console.log('⚠️  Please update the ATLAS_URI in this script before running!');
  console.log('   Edit migrate-to-atlas.js and replace:');
  console.log('   - your_username with your Atlas username');
  console.log('   - your_password with your Atlas password');
  console.log('   - cluster0.xxxxx with your actual cluster name\n');
  console.log('Then run: node migrate-to-atlas.js');
  process.exit(1);
}

migrate();
