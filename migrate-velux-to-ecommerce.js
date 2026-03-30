/**
 * MongoDB Migration Script
 * Migrates data from ecommerce_velux to ecommerce database in MongoDB Atlas
 * 
 * Usage:
 * Run: node migrate-velux-to-ecommerce.js
 */

const mongoose = require('mongoose');

// Connection strings - Source (old) and Target (new) in Atlas
const SOURCE_URI = "mongodb+srv://gowdarakshith4663_db_user:gowdaatlas@velux.ofigioe.mongodb.net/ecommerce_velux?retryWrites=true&w=majority";
const TARGET_URI = "mongodb+srv://gowdarakshith4663_db_user:gowdaatlas@velux.ofigioe.mongodb.net/ecommerce?retryWrites=true&w=majority";

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
    console.log('🔄 Starting migration from ecommerce_velux to ecommerce...\n');

    // Connect to source database (ecommerce_velux)
    console.log('📡 Connecting to source database (ecommerce_velux)...');
    await mongoose.connect(SOURCE_URI);
    console.log('✅ Connected to source database\n');

    // Export data from source
    console.log('📤 Exporting data from ecommerce_velux...');
    const users = await User.find({});
    const products = await Product.find({});
    const reviews = await Review.find({});
    const orders = await Order.find({});
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Reviews: ${reviews.length}`);
    console.log(`   - Orders: ${orders.length}\n`);

    // Disconnect from source
    await mongoose.disconnect();
    console.log('📴 Disconnected from source database\n');

    // Connect to target database (ecommerce)
    console.log('📡 Connecting to target database (ecommerce)...');
    await mongoose.connect(TARGET_URI);
    console.log('✅ Connected to target database\n');

    // Import data to target
    console.log('📥 Importing data to ecommerce...');

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
    console.log('Your data has been migrated from ecommerce_velux to ecommerce.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
