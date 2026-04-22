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
  "mongodb+srv://harshithkhatri_db_user:ChhMlZS6skY6WfeP@cluster0.l1vghag.mongodb.net/ecommerce?retryWrites=true&w=majority&appName=Cluster0";

// ===== Middleware =====
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// ===== ROOT =====
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 Backend is running",
    endpoints: {
      health: "/api/health",
      products: "/api/products",
      login: "/api/auth/login"
    }
  });
});

// ===== MODELS =====
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: "user" }
});
const User = mongoose.model("User", userSchema);

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  stock: Number,
  description: String,
  image_url: String
});
const Product = mongoose.model("Product", productSchema);

// ===== AUTH ROUTES =====

// Register
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: "All fields required" });

  try {
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ success: false, message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, password: hashed });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      message: "Registered successfully",
      data: { id: user._id, name, email, token }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ success: false, message: "Email & password required" });

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ success: false, message: "Invalid password" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      message: "Login successful",
      data: { id: user._id, name: user.name, email: user.email, token }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

// ===== TEST =====
app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "API working!" });
});

// ===== PRODUCTS =====
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json({ success: true, data: products });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
});

// ===== HEALTH =====
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running" });
});

// ===== 404 =====
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ===== START SERVER =====
async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("❌ DB Connection Failed:", err);
    process.exit(1);
  }
}

startServer();