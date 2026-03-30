require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "velux_kicks_secret_key_2024";
// Use environment variable or fallback to the MongoDB Atlas URI
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://gowdarakshith4663_db_user:gowdaatlas@velux.ofigioe.mongodb.net/ecommerce?retryWrites=true&w=majority";

// Enable CORS for all origins
app.use(cors());
app.use(bodyParser.json());

// Debug logging
console.log("API Starting...");
console.log("MongoDB URI:", MONGO_URI ? MONGO_URI.substring(0, 30) + "..." : "not set");
console.log("Node env:", process.env.NODE_ENV);
console.log("Vercel env:", process.env.VERCEL);

// MongoDB Connection
let isConnected = false;
let dbConnection = null;

async function connectDB() {
  if (isConnected && dbConnection) {
    console.log("Using existing DB connection");
    return dbConnection;
  }
  
  try {
    console.log("Connecting to MongoDB...");
    console.log("MongoDB URI:", MONGO_URI ? MONGO_URI.replace(/:([^:@]+)@/, ":****@") : "not set");
    
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    isConnected = true;
    dbConnection = mongoose.connection;
    console.log("✅ Connected to MongoDB Atlas");
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error("MongoDB connection error:", err);
      isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log("MongoDB disconnected");
      isConnected = false;
    });
    
    return dbConnection;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    isConnected = false;
    throw err;
  }
}

// ===== MONGOOSE MODELS =====

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  city: { type: String, default: "" },
  state: { type: String, default: "" },
  zip_code: { type: String, default: "" },
  country: { type: String, default: "" },
  wishlist: { type: [String], default: [] },
  role: { type: String, default: "user" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});
const User = mongoose.model("User", userSchema);

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  stock: { type: Number, default: 0 },
  description: { type: String },
  image_url: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});
const Product = mongoose.model("Product", productSchema);

const reviewSchema = new mongoose.Schema({
  product_id: { type: String, required: true },
  user: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  images: { type: [String], default: [] },
  created_at: { type: Date, default: Date.now }
});
const Review = mongoose.model("Review", reviewSchema);

const orderSchema = new mongoose.Schema({
  order_id: { type: String, unique: true },
  user_id: { type: String, required: true },
  items: [{
    product_id: { type: String },
    name: { type: String },
    price: { type: Number },
    quantity: { type: Number, default: 1 },
    image_url: { type: String }
  }],
  total: { type: Number, required: true },
  address: { type: String },
  status: { type: String, default: "Pending" },
  estimated_delivery: { type: Date },
  created_at: { type: Date, default: Date.now }
});
const Order = mongoose.model("Order", orderSchema);

// Helper function
function toPlainObj(obj) {
  if (!obj) return null;
  return JSON.parse(JSON.stringify(obj));
}

function generateToken(user) {
  return jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
}

// Initialize database with sample products
async function initializeDatabase() {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      const imageUrls = [
        "/images/SHOE1.jpg",
        "/images/WhatsApp Image 2026-01-13 at 7.57.38 PM.jpeg",
        "/images/WhatsApp Image 2026-01-13 at 7.57.39 PM (1).jpeg",
        "/images/WhatsApp Image 2026-01-13 at 7.57.39 PM.jpeg",
        "/images/WhatsApp Image 2026-01-13 at 7.57.40 PM.jpeg",
        "/images/Screenshot 2026-02-04 122545.png",
        "/images/Screenshot 2026-02-04 122832.png",
        "/images/Screenshot 2026-02-04 122857.png",
        "/images/Screenshot 2026-02-04 123044.png",
        "/images/Screenshot 2026-02-04 123126.png",
        "/images/Screenshot 2026-02-04 123222.png",
        "/images/Screenshot 2026-02-04 123246.png"
      ];

      const productData = [
        { name: "Air Max Pro Runner", price: 55000, category: "Running Sneakers", stock: 50, description: "High performance running shoe with max cushioning." },
        { name: "Classic White Sneakers", price: 2500, category: "Casual Sneakers", stock: 100, description: "Clean white sneakers for everyday wear." },
        { name: "Performance Runner", price: 30000, category: "Running Sneakers", stock: 75, description: "Very fast and responsive running shoe." },
        { name: "Executive Premium", price: 4000, category: "Premium Sneakers", stock: 60, description: "Excellent quality for work and formal occasions." },
        { name: "Athletic Performance", price: 55000, category: "Running Sneakers", stock: 45, description: "Good for sports activities." },
        { name: "Urban Casual", price: 2100, category: "Casual Sneakers", stock: 120, description: "Light and comfortable for daily wear." },
        { name: "Street Style Pro", price: 45000, category: "Premium Sneakers", stock: 40, description: "Stylish for city walks." },
        { name: "Comfort Walk", price: 2650, category: "Casual Sneakers", stock: 90, description: "Super comfortable walking shoes." },
        { name: "Elite Runner", price: 8500, category: "Running Sneakers", stock: 80, description: "Great for long runs." },
        { name: "Luxury Collection", price: 5200, category: "Premium Sneakers", stock: 35, description: "Great for special occasions." },
        { name: "Street Canvas", price: 3500, category: "Casual Sneakers", stock: 70, description: "Retro style and comfortable." },
        { name: "Exclusive Edition", price: 9500, category: "Premium Sneakers", stock: 25, description: "Elegant and durable." }
      ];

      const productsToCreate = productData.map((product, index) => ({
        ...product,
        image_url: imageUrls[index]
      }));

      await Product.create(productsToCreate);
      console.log("✅ Database initialized with sample products");
    }
  } catch (err) {
    console.error("Error initializing database:", err);
  }
}

// Connect to MongoDB
connectDB().then(() => initializeDatabase());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ===== PRODUCT ENDPOINTS =====

// GET all products
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ created_at: -1 });
    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
});

// GET single product by ID
app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, data: toPlainObj(product) });
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ success: false, message: "Failed to fetch product" });
  }
});

// ===== REVIEW ENDPOINTS =====

app.get("/api/products/:id/reviews", async (req, res) => {
  try {
    const reviews = await Review.find({ product_id: req.params.id }).sort({ created_at: -1 });
    res.json({
      success: true,
      data: reviews,
    });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ success: false, message: "Failed to fetch reviews" });
  }
});

app.post("/api/products/:id/reviews", async (req, res) => {
  try {
    const review = await Review.create({
      product_id: req.params.id,
      user: req.body.user,
      rating: req.body.rating,
      comment: req.body.comment,
      images: req.body.images || []
    });
    res.status(201).json({
      success: true,
      data: toPlainObj(review),
    });
  } catch (err) {
    console.error("Error creating review:", err);
    res.status(500).json({ success: false, message: "Failed to create review" });
  }
});

// ===== AUTH ENDPOINTS =====

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, phone, address, city, state, zipCode, country } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ success: false, message: "Name, email, password, and phone are required" });
  }

  try {
    await connectDB();
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address: address || "",
      city: city || "",
      state: state || "",
      zip_code: zipCode || "",
      country: country || ""
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token
      }
    });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ success: false, message: "Failed to register user" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  console.log("Login attempt for:", email);

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  try {
    await connectDB();
    console.log("Connected to DB, looking for user...");
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found:", email);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log("Invalid password for user:", email);
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    const token = generateToken(user);
    console.log("Login successful for:", email);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        zip_code: user.zip_code,
        country: user.country,
        role: user.role,
        token
      }
    });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ success: false, message: "Failed to login" });
  }
});

// ===== WISHLIST ENDPOINTS =====

app.get("/api/wishlist/:userId", async (req, res) => {
  try {
    await connectDB();
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const wishlistProducts = await Product.find({ _id: { $in: user.wishlist } });
    res.json({
      success: true,
      data: wishlistProducts,
    });
  } catch (err) {
    console.error("Error fetching wishlist:", err);
    res.status(500).json({ success: false, message: "Failed to fetch wishlist" });
  }
});

app.post("/api/wishlist/:userId/:productId", async (req, res) => {
  try {
    await connectDB();
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.wishlist.includes(req.params.productId)) {
      user.wishlist.push(req.params.productId);
      await user.save();
    }

    const wishlistProducts = await Product.find({ _id: { $in: user.wishlist } });
    res.json({
      success: true,
      data: wishlistProducts,
    });
  } catch (err) {
    console.error("Error adding to wishlist:", err);
    res.status(500).json({ success: false, message: "Failed to add to wishlist" });
  }
});

app.delete("/api/wishlist/:userId/:productId", async (req, res) => {
  try {
    await connectDB();
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.wishlist = user.wishlist.filter(id => id !== req.params.productId);
    await user.save();

    const wishlistProducts = await Product.find({ _id: { $in: user.wishlist } });
    res.json({
      success: true,
      data: wishlistProducts,
    });
  } catch (err) {
    console.error("Error removing from wishlist:", err);
    res.status(500).json({ success: false, message: "Failed to remove from wishlist" });
  }
});

// ===== ORDER ENDPOINTS =====

app.post("/api/orders", async (req, res) => {
  const { userId, items, total, address } = req.body;

  if (!userId || !items || !total) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    await connectDB();
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const orderId = "ORD-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
    const estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    
    const order = await Order.create({
      order_id: orderId,
      user_id: userId,
      items,
      total,
      address: address || "",
      status: "Pending",
      estimated_delivery: estimatedDelivery
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: {
        id: order._id,
        order_id: orderId,
        userId,
        items,
        total,
        address,
        status: "Pending",
        estimatedDelivery,
      },
    });
  } catch (err) {
    console.error("Error placing order:", err);
    res.status(500).json({ success: false, message: "Failed to place order" });
  }
});

app.get("/api/orders/:userId", async (req, res) => {
  try {
    await connectDB();
    const orders = await Order.find({ user_id: req.params.userId }).sort({ created_at: -1 });
    res.json({
      success: true,
      data: orders.map(toPlainObj),
      count: orders.length,
    });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});

// ===== PROFILE ENDPOINTS =====

app.put("/api/auth/profile/:userId", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  const { name, phone, address, city, state, zipCode, country } = req.body;

  try {
    await connectDB();
    const decoded = jwt.verify(token, JWT_SECRET);

    await User.findByIdAndUpdate(decoded.id, {
      name,
      phone,
      address,
      city,
      state,
      zip_code: zipCode,
      country,
      updated_at: new Date()
    });

    const user = await User.findById(decoded.id);

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: toPlainObj(user),
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
});

app.get("/api/auth/profile/:userId", async (req, res) => {
  try {
    await connectDB();
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      data: toPlainObj(user),
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
});

// Export for Vercel
module.exports = app;
