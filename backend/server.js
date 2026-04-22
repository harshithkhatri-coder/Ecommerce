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

// Serve static images
app.use('/images', express.static(path.join(__dirname, 'public/images')));


// ✅ ROOT ROUTE FIX (IMPORTANT)
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 Velux Kicks Backend is running successfully!",
    endpoints: {
      health: "/api/health",
      products: "/api/products",
      test: "/api/test"
    }
  });
});


// ===== MONGOOSE MODELS =====
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
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


// ===== TEST ROUTES =====
app.get("/api/test", async (req, res) => {
  res.json({ success: true, message: "API working!" });
});

app.get("/api/products", async (req, res) => {
  const products = await Product.find();
  res.json({ success: true, data: products });
});


// ===== HEALTH CHECK =====
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running" });
});


// ===== 404 HANDLER =====
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});


// ===== START SERVER AFTER DB CONNECT =====
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