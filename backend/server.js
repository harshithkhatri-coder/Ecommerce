require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "velux_kicks_secret_key_2024";
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://gowdarakshith4663_db_user:gowdaatlas@velux.ofigioe.mongodb.net/ecommerce?retryWrites=true&w=majority";

// ===== MONGODB CONNECTION =====
const safeMongoUri = MONGO_URI.replace(/:([^:@]+)@/, ":****@");
console.log("MongoDB URI:", safeMongoUri);
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB");
    // Initialize/Seed database (ensures production is populated)
    await initializeDatabase();
  })
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ===== MONGOOSE MODELS ====

// User Schema
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
  role: { type: String, default: "user" }, // "user" or "admin"
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});
const User = mongoose.model("User", userSchema);

// Product Schema
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

// Review Schema
const reviewSchema = new mongoose.Schema({
  product_id: { type: String, required: true },
  user: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  images: { type: [String], default: [] },
  created_at: { type: Date, default: Date.now }
});
const Review = mongoose.model("Review", reviewSchema);

// Order Schema
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
  payment_method: { type: String, default: "Prepaid" },
  tracking_location: { type: String, default: "" },
  estimated_delivery: { type: Date },
  cancellation_reason: { type: String, default: "" },
  cancelled_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now }
});
const Order = mongoose.model("Order", orderSchema);

// Notification Schema
const notificationSchema = new mongoose.Schema({
  type: { type: String, required: true }, // "order_placed", "order_cancelled", "order_updated"
  title: { type: String, required: true },
  message: { type: String, required: true },
  order_id: { type: String },
  user_id: { type: String },
  user_name: { type: String },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});
const Notification = mongoose.model("Notification", notificationSchema);

// Helper function to create notifications
async function createNotification(type, title, message, orderId = null, userId = null, userName = null) {
  try {
    const notification = new Notification({
      type,
      title,
      message,
      order_id: orderId,
      user_id: userId,
      user_name: userName
    });
    await notification.save();
    console.log(`📢 Notification created: ${type} - ${title}`);
  } catch (err) {
    console.error("Error creating notification:", err);
  }
}

// ===== Middleware =====
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static images from public folder
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// ===== DATABASE SEEDING =====
async function initializeDatabase() {
  const productCount = await Product.countDocuments();

  // Image mapping for 12 products (9 unique images, some reused)
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

  if (productCount === 0) {
    const productsToCreate = productData.map((product, index) => ({
      ...product,
      image_url: imageUrls[index]
    }));
    await Product.create(productsToCreate);
    console.log("🌱 Seeded 12 demo products into MongoDB");
  } else {
    // Update existing products with new image URLs
    for (let i = 0; i < productData.length; i++) {
      await Product.findOneAndUpdate(
        { name: productData[i].name },
        { image_url: imageUrls[i], updated_at: Date.now() },
        { new: true }
      );
    }
    console.log("✅ Updated 12 products with new image URLs");
  }

  // Seed admin user if not exists
  const adminEmail = "admin@veluxkicks.com";
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await User.create({
      name: "Admin",
      email: adminEmail,
      password: hashedPassword,
      phone: "+91 9876543210",
      address: "Velux Kicks HQ",
      city: "Mumbai",
      state: "Maharashtra",
      zip_code: "400001",
      country: "India",
      role: "admin"
    });
    console.log("🌱 Seeded admin user (admin@veluxkicks.com / admin123)");
  }
}

// ===== Helper function to generate JWT token =====
function generateToken(user) {
  return jwt.sign(
    { id: user._id || user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Helper to convert MongoDB document to plain object with id
function toPlainObj(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  return obj;
}

async function generateOrderId() {
  // Keep order IDs readable while still preventing collisions.
  for (let i = 0; i < 5; i++) {
    const candidate = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;
    const exists = await Order.exists({ order_id: candidate });
    if (!exists) return candidate;
  }
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

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

// POST to sync/refresh products (replaces all products)
app.post("/api/products/sync", async (req, res) => {
  try {
    // Delete all existing products
    await Product.deleteMany({});

    // Image mapping for 12 products
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

    res.json({
      success: true,
      message: "Synced 12 products successfully",
      count: productsToCreate.length
    });
  } catch (err) {
    console.error("Error syncing products:", err);
    res.status(500).json({ success: false, message: "Failed to sync products" });
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

// GET reviews for a product
app.get("/api/products/:id/reviews", async (req, res) => {
  try {
    const reviews = await Review.find({ product_id: req.params.id }).sort({ created_at: -1 });
    res.json({
      success: true,
      data: reviews,
      count: reviews.length,
    });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ success: false, message: "Failed to fetch reviews" });
  }
});

// POST a new review
app.post("/api/products/:id/reviews", async (req, res) => {
  const { user, rating, comment, images } = req.body;

  if (!user || !rating || !comment) {
    return res.status(400).json({
      success: false,
      message: "User, rating, and comment are required",
    });
  }

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const review = await Review.create({
      product_id: req.params.id,
      user,
      rating: parseInt(rating, 10),
      comment,
      images: images || []
    });

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      data: toPlainObj(review),
    });
  } catch (err) {
    console.error("Error creating review:", err);
    res.status(500).json({ success: false, message: "Failed to add review" });
  }
});

// ===== SEARCH ENDPOINTS =====
app.get("/api/search", async (req, res) => {
  const query = req.query.q?.toLowerCase();

  if (!query) {
    return res.status(400).json({ success: false, message: "Search query required" });
  }

  try {
    const results = await Product.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } }
      ]
    }).sort({ created_at: -1 });

    res.json({
      success: true,
      data: results,
      count: results.length,
      query,
    });
  } catch (err) {
    console.error("Error searching products:", err);
    res.status(500).json({ success: false, message: "Failed to search" });
  }
});

// ===== CART ENDPOINTS (stateless) =====
app.post("/api/cart", (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items)) {
    return res.status(400).json({ success: false, message: "Items must be an array" });
  }

  const cartTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = Math.round(cartTotal * 0.18);
  const grandTotal = cartTotal + tax;

  res.json({
    success: true,
    data: {
      items,
      subtotal: cartTotal,
      tax,
      total: grandTotal,
      itemCount: items.length,
    },
  });
});

// ===== ORDER ENDPOINTS =====

// Place order
app.post("/api/orders", async (req, res) => {
  const { userId, items, total, address } = req.body;

  if (!userId || !items || !total) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Generate unique order ID
    const orderId = await generateOrderId();

    const estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const order = await Order.create({
      order_id: orderId,
      user_id: userId,
      items,
      total,
      address: address || "",
      status: "Pending",
      payment_method: "Prepaid",
      tracking_location: "",
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

    // Create notification for admin
    await createNotification(
      "order_placed",
      "New Order Received",
      `Order ${orderId} placed by ${user.name} for ₹${total}`,
      orderId,
      userId,
      user.name
    );
  } catch (err) {
    console.error("Error placing order:", err);
    res.status(500).json({ success: false, message: "Failed to place order" });
  }
});

// GET user orders
app.get("/api/orders/:userId", async (req, res) => {
  try {
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

// PUT to cancel an order
const cancelOrderHandler = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: "Cancellation reason is required" });
    }

    let order = null;
    const orderId = req.params.orderId;

    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId);
    }

    if (!order) {
      order = await Order.findOne({ order_id: orderId });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Check if the order belongs to the authenticated user
    if (order.user_id !== user._id.toString()) {
      return res.status(403).json({ success: false, message: "You can only cancel your own orders" });
    }

    if (order.status === "Delivered" || order.status === "Cancelled") {
      return res.status(400).json({ success: false, message: "This order cannot be cancelled" });
    }

    order.status = "Cancelled";
    order.cancellation_reason = reason.trim();
    order.cancelled_at = new Date();
    const updatedOrder = await order.save();

    console.log("Order cancelled:", updatedOrder._id, "Status:", updatedOrder.status, "By user:", user._id);

    res.json({
      success: true,
      message: "Order cancelled successfully",
      data: toPlainObj(updatedOrder)
    });

    // Create notification for admin
    await createNotification(
      "order_cancelled",
      "Order Cancelled",
      `Order ${updatedOrder.order_id} cancelled by ${user.name}. Reason: ${reason.trim()}`,
      updatedOrder.order_id,
      user._id,
      user.name
    );
  } catch (err) {
    console.error("Error cancelling order:", err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    res.status(500).json({ success: false, message: "Failed to cancel order: " + err.message });
  }
};

app.put("/api/orders/:orderId/cancel", cancelOrderHandler);
app.put("/api/orders/cancel/:orderId", cancelOrderHandler);
app.put("/api/order-cancel/:orderId", cancelOrderHandler);

// ===== USER AUTHENTICATION ENDPOINTS =====

// Register user
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, phone, address, city, state, zipCode, country } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ success: false, message: "Name, email, password, and phone are required" });
  }

  try {
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
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zip_code,
        country: user.country,
        role: user.role,
        token,
      },
    });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ success: false, message: "Failed to register" });
  }
});

// Login user
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password required",
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    const token = generateToken(user);

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
        zipCode: user.zip_code,
        country: user.country,
        role: user.role,
        token,
      },
    });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ success: false, message: "Failed to login" });
  }
});

// Admin login endpoint
app.post("/api/auth/admin-login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password required",
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if user is admin
    if (user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Admin only." });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: "Admin login successful",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      },
    });
  } catch (err) {
    console.error("Error admin login:", err);
    res.status(500).json({ success: false, message: "Failed to login" });
  }
});

// Verify token and get user data
app.get("/api/auth/verify", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zip_code,
        country: user.country,
      },
    });
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
});

// Update user profile
app.put("/api/auth/profile", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  const { name, phone, address, city, state, zipCode, country } = req.body;

  try {
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

// Get user profile
app.get("/api/auth/profile/:userId", async (req, res) => {
  try {
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

// ===== WISHLIST ENDPOINTS =====

// Get wishlist
app.get("/api/wishlist/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const wishlistIds = user.wishlist || [];
    if (wishlistIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        count: 0,
      });
    }

    const products = await Product.find({ _id: { $in: wishlistIds } });

    res.json({
      success: true,
      data: products.map(toPlainObj),
      count: products.length,
    });
  } catch (err) {
    console.error("Error fetching wishlist:", err);
    res.status(500).json({ success: false, message: "Failed to fetch wishlist" });
  }
});

// Add to wishlist
app.post("/api/wishlist/:userId/:productId", async (req, res) => {
  const { userId, productId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const wishlist = user.wishlist || [];
    if (!wishlist.includes(productId)) {
      wishlist.push(productId);
      await User.findByIdAndUpdate(userId, {
        wishlist,
        updated_at: new Date()
      });
    }

    res.json({
      success: true,
      message: "Added to wishlist",
      data: wishlist,
    });
  } catch (err) {
    console.error("Error updating wishlist:", err);
    res.status(500).json({ success: false, message: "Failed to update wishlist" });
  }
});

// Remove from wishlist
app.delete("/api/wishlist/:userId/:productId", async (req, res) => {
  const { userId, productId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const wishlist = user.wishlist || [];
    const updatedWishlist = wishlist.filter(id => id !== productId);

    await User.findByIdAndUpdate(userId, {
      wishlist: updatedWishlist,
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: "Removed from wishlist",
      data: updatedWishlist,
    });
  } catch (err) {
    console.error("Error updating wishlist:", err);
    res.status(500).json({ success: false, message: "Failed to update wishlist" });
  }
});

// ===== STATISTICS ENDPOINTS =====
app.get("/api/stats", async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();

    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

    const products = await Product.find();
    const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);

    res.json({
      success: true,
      data: {
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenue,
        totalStock,
      },
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
});

// ===== ADMIN PRODUCT ENDPOINTS =====

// Add product (Admin)
app.post("/api/admin/products", async (req, res) => {
  const { name, price, category, stock, description, image_url } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({ success: false, message: "Name, price, and category are required" });
  }

  try {
    const product = await Product.create({
      name,
      price: parseFloat(price),
      category,
      stock: stock || 0,
      description: description || "",
      image_url: image_url || ""
    });

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      data: toPlainObj(product),
    });
  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).json({ success: false, message: "Failed to add product" });
  }
});

// Update product (Admin)
app.put("/api/admin/products/:id", async (req, res) => {
  const { name, price, category, stock, description, image_url } = req.body;

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    await Product.findByIdAndUpdate(req.params.id, {
      name,
      price: parseFloat(price),
      category,
      stock: stock || 0,
      description: description || "",
      image_url: image_url || "",
      updated_at: new Date()
    });

    const updatedProduct = await Product.findById(req.params.id);

    res.json({
      success: true,
      message: "Product updated successfully",
      data: toPlainObj(updatedProduct),
    });
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ success: false, message: "Failed to update product" });
  }
});

// Delete product (Admin)
app.delete("/api/admin/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    await Review.deleteMany({ product_id: req.params.id });
    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ success: false, message: "Failed to delete product" });
  }
});

// ===== ADMIN ORDER ENDPOINTS =====

// Get all orders with user info (Admin)
app.get("/api/admin/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ created_at: -1 });

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

// Get single order with details (Admin)
app.get("/api/admin/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({
      success: true,
      data: toPlainObj(order),
    });
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
});

// Update order status (Admin)
app.put("/api/admin/orders/:id/status", async (req, res) => {
  const { status, tracking_location } = req.body;
  const validStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

  if (!status && typeof tracking_location === "undefined") {
    return res.status(400).json({ success: false, message: "Please provide a status or tracking location" });
  }

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const updatePayload = { updated_at: new Date() };
    if (status) updatePayload.status = status;
    if (typeof tracking_location !== "undefined") updatePayload.tracking_location = tracking_location;

    await Order.findByIdAndUpdate(req.params.id, updatePayload);

    const updatedOrder = await Order.findById(req.params.id);

    res.json({
      success: true,
      message: "Order updated successfully",
      data: toPlainObj(updatedOrder),
    });

    // Create notification for status change
    if (status && status !== order.status) {
      const user = await User.findById(order.user_id);
      await createNotification(
        "order_updated",
        "Order Status Updated",
        `Order ${order.order_id} status changed from ${order.status} to ${status}`,
        order.order_id,
        order.user_id,
        user ? user.name : "Customer"
      );
    }
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ success: false, message: "Failed to update order status" });
  }
});

// Delete order (Admin)
app.delete("/api/admin/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    await Order.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting order:", err);
    res.status(500).json({ success: false, message: "Failed to delete order" });
  }
});

// ===== ADMIN STATS ENDPOINT =====
app.get("/api/admin/stats", async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();

    const allOrders = await Order.find();
    const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    const pendingOrders = allOrders.filter(o => o.status === "Pending").length;
    const completedOrders = allOrders.filter(o => o.status === "Delivered").length;

    const allProducts = await Product.find();
    const totalStock = allProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
    const lowStockProducts = allProducts.filter(p => p.stock < 10).length;

    res.json({
      success: true,
      data: {
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenue,
        totalStock,
        pendingOrders,
        completedOrders,
        lowStockProducts,
      },
    });
  } catch (err) {
    console.error("Error fetching admin stats:", err);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
});

// ===== HEALTH CHECK =====
app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "ok", database: "MongoDB" });
});

// ===== NOTIFICATION ENDPOINTS =====

// Get all notifications (Admin only)
app.get("/api/admin/notifications", async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ created_at: -1 });
    res.json({
      success: true,
      data: notifications.map(toPlainObj),
      count: notifications.length,
    });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
});

// Mark notification as read (Admin only)
app.put("/api/admin/notifications/:id/read", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { is_read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.json({
      success: true,
      message: "Notification marked as read",
      data: toPlainObj(notification)
    });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ success: false, message: "Failed to mark notification as read" });
  }
});

// Get unread notification count (Admin only)
app.get("/api/admin/notifications/unread-count", async (req, res) => {
  try {
    const count = await Notification.countDocuments({ is_read: false });
    res.json({
      success: true,
      count
    });
  } catch (err) {
    console.error("Error fetching unread count:", err);
    res.status(500).json({ success: false, message: "Failed to fetch unread count" });
  }
});

// ===== ERROR HANDLING =====
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ===== START SERVER =====
// Only start the server if not running on Vercel
if (process.env.VERCEL === undefined) {
  const server = app.listen(PORT, async () => {
    console.log(`\n✅ Server running on http://localhost:${PORT}`);
    console.log(`📦 Database: MongoDB`);
    console.log(`🔐 JWT Secret: ${JWT_SECRET.substring(0, 8)}...`);
  });
}

// Vercel serverless export
module.exports = app;
