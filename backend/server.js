require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "velux_kicks_secret_key_2024";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@veluxkicks.com").trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://harshithkhatri_db_user:ChhMlZS6skY6WfeP@cluster0.l1vghag.mongodb.net/ecommerce?retryWrites=true&w=majority&appName=Cluster0";

// ===== Multer Setup for Image Uploads =====
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "public/images");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

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
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  city: { type: String, default: "" },
  state: { type: String, default: "" },
  zip_code: { type: String, default: "" },
  country: { type: String, default: "" },
  role: { type: String, default: "user" },
  created_at: { type: Date, default: Date.now },
  reset_token_hash: { type: String, default: "" },
  reset_token_expires: { type: Date, default: null }
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

const orderSchema = new mongoose.Schema({
  order_id: { type: String, unique: true },
  user_id: { type: String, required: true },
  items: [
    {
      product_id: String,
      name: String,
      price: Number,
      quantity: { type: Number, default: 1 },
      image_url: String
    }
  ],
  total: { type: Number, required: true },
  address: { type: String, default: "" },
  status: { type: String, default: "Pending" },
  payment_method: { type: String, default: "Prepaid" },
  tracking_location: { type: String, default: "" },
  cancellation_reason: { type: String, default: "" },
  created_at: { type: Date, default: Date.now }
});
const Order = mongoose.model("Order", orderSchema);

const carouselSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "home" },
    slides: [
      {
        id: Number,
        url: String,
        title: String
      }
    ]
  },
  { timestamps: true }
);
const CarouselConfig = mongoose.model("CarouselConfig", carouselSchema);

const DEFAULT_CAROUSEL_SLIDES = [
  { id: 1, url: "/images/SHOE1.jpg", title: "BRANDED SHOES" },
  { id: 2, url: "/images/WhatsApp Image 2026-01-13 at 7.57.38 PM.jpeg", title: "Premium Collection" },
  { id: 3, url: "/images/WhatsApp Image 2026-01-13 at 7.57.39 PM (1).jpeg", title: "New Arrivals" },
  { id: 4, url: "/images/WhatsApp Image 2026-01-13 at 7.57.39 PM.jpeg", title: "Premium Sneakers" },
  { id: 5, url: "/images/WhatsApp Image 2026-01-13 at 7.57.40 PM.jpeg", title: "Latest Trends" }
];

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const getEffectiveRole = (user) => {
  if (!user) return "user";
  return normalizeEmail(user.email) === ADMIN_EMAIL || user.role === "admin" ? "admin" : "user";
};

const serializeUser = (user, token) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: getEffectiveRole(user),
  token
});

async function generateOrderId() {
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

async function ensureAdminUser() {
  const adminEmail = normalizeEmail(ADMIN_EMAIL);
  const existingAdmin = await User.findOne({ email: adminEmail });

  if (!existingAdmin) {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await User.create({
      name: "Admin",
      email: adminEmail,
      password: hashed,
      role: "admin"
    });
    console.log(`Admin user created: ${adminEmail}`);
    return;
  }

  if (getEffectiveRole(existingAdmin) !== "admin") {
    existingAdmin.role = "admin";
    await existingAdmin.save();
    console.log(`Admin role granted: ${adminEmail}`);
  }
}

async function sendPasswordResetEmail({ toEmail, resetLink }) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM || "no-reply@veluxkicks.com";

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log(`[Password Reset] SMTP not configured. Reset link for ${toEmail}: ${resetLink}`);
    return { delivered: false, preview: resetLink };
  }

  try {
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    await transporter.sendMail({
      from: `"Velux Kicks" <${fromEmail}>`,
      to: toEmail,
      subject: "Reset your Velux Kicks password",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Reset your password</h2>
          <p>Click the button below to reset your password. This link will expire in 15 minutes.</p>
          <p>
            <a href="${resetLink}" style="display:inline-block;background:#111827;color:#fff;padding:10px 16px;text-decoration:none;border-radius:6px;">
              Reset Password
            </a>
          </p>
          <p>If you did not request this, you can ignore this email.</p>
        </div>
      `
    });

    return { delivered: true };
  } catch (error) {
    console.error("Error sending reset email:", error);
    return { delivered: false, preview: resetLink };
  }
}

// ===== AUTH ROUTES =====

// Register
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, phone, address, city, state, zipCode, country } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: "All fields required" });

  try {
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing)
      return res.status(400).json({ success: false, message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashed,
      phone: phone || "",
      address: address || "",
      city: city || "",
      state: state || "",
      zip_code: zipCode || "",
      country: country || "",
      role: normalizedEmail === ADMIN_EMAIL ? "admin" : "user"
    });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      message: "Registered successfully",
      data: serializeUser(user, token)
    });

  } catch (err) {
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!email || !password)
    return res.status(400).json({ success: false, message: "Email & password required" });

  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ success: false, message: "Invalid password" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      message: "Login successful",
      data: serializeUser(user, token)
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

const forgotPasswordHandler = async (req, res) => {
  const normalizedEmail = normalizeEmail(req.body?.email || "");

  if (!normalizedEmail) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email: normalizedEmail });

    // Always return success-like response to avoid email enumeration.
    if (!user) {
      return res.json({
        success: true,
        message: "If this email exists, a reset link has been sent."
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const resetLink = `${CLIENT_URL}/?page=reset-password&token=${encodeURIComponent(rawToken)}`;

    user.reset_token_hash = tokenHash;
    user.reset_token_expires = expiresAt;
    await user.save();

    const emailStatus = await sendPasswordResetEmail({
      toEmail: user.email,
      resetLink
    });

    return res.json({
      success: true,
      message: "If this email exists, a reset link has been sent.",
      ...(emailStatus.delivered ? {} : { resetLink: emailStatus.preview })
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ success: false, message: "Failed to process forgot password" });
  }
};

const resetPasswordHandler = async (req, res) => {
  const token = String(req.body?.token || "");
  const newPassword = String(req.body?.newPassword || "");

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: "Token and new password are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
  }

  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      reset_token_hash: tokenHash,
      reset_token_expires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset link" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.reset_token_hash = "";
    user.reset_token_expires = null;
    await user.save();

    return res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ success: false, message: "Failed to reset password" });
  }
};

app.post("/api/auth/forgot-password", forgotPasswordHandler);
app.post("/api/auth/forgotPassword", forgotPasswordHandler);
app.post("/api/auth/reset-password", resetPasswordHandler);
app.post("/api/auth/resetPassword", resetPasswordHandler);

// ===== ORDERS =====
app.post("/api/orders", async (req, res) => {
  const { userId, items, total, address } = req.body;

  if (!userId || !Array.isArray(items) || items.length === 0 || !total) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const orderId = await generateOrderId();
    const order = await Order.create({
      order_id: orderId,
      user_id: String(user._id),
      items,
      total: Number(total),
      address: address || "",
      status: "Pending",
      payment_method: "Prepaid"
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: {
        _id: order._id,
        id: order._id,
        order_id: order.order_id,
        user_id: order.user_id,
        items: order.items,
        total: order.total,
        address: order.address,
        status: order.status,
        payment_method: order.payment_method,
        tracking_location: order.tracking_location,
        created_at: order.created_at
      }
    });
  } catch (err) {
    console.error("Error placing order:", err);
    res.status(500).json({ success: false, message: "Failed to place order" });
  }
});

app.get("/api/orders/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.params.userId }).sort({ created_at: -1 });
    res.json({ success: true, data: orders, count: orders.length });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});

app.get("/api/carousel", async (req, res) => {
  try {
    const config = await CarouselConfig.findOne({ key: "home" });
    res.json({
      success: true,
      data: config?.slides?.length ? config.slides : DEFAULT_CAROUSEL_SLIDES
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch carousel" });
  }
});

// ===== HEALTH =====
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running" });
});

// ===== ADMIN MIDDLEWARE =====
const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || getEffectiveRole(user) !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    req.adminUser = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// ===== ADMIN PRODUCTS =====
app.get("/api/admin/products", adminAuth, async (req, res) => {
  try {
    const products = await Product.find();
    res.json({ success: true, data: products });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
});

app.post("/api/admin/products", adminAuth, upload.single("image"), async (req, res) => {
  try {
    const { name, price, category, stock, description, image_url } = req.body;
    let imageUrl = image_url || "";
    
    if (req.file) {
      imageUrl = "/images/" + req.file.filename;
    }
    
    const product = await Product.create({ 
      name, 
      price: Number(price), 
      category, 
      stock: Number(stock), 
      description, 
      image_url: imageUrl 
    });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to create product" });
  }
});

app.put("/api/admin/products/:id", adminAuth, upload.single("image"), async (req, res) => {
  try {
    const { name, price, category, stock, description, image_url } = req.body;
    let imageUrl = image_url;
    
    if (req.file) {
      imageUrl = "/images/" + req.file.filename;
    }
    
    const updateData = { name, price: Number(price), category, stock: Number(stock), description };
    if (imageUrl) {
      updateData.image_url = imageUrl;
    }
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update product" });
  }
});

app.delete("/api/admin/products/:id", adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete product" });
  }
});

// ===== ADMIN USERS =====
app.get("/api/admin/users", adminAuth, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    const allOrders = await Order.find({}, { user_id: 1 });
    const orderCountMap = allOrders.reduce((acc, order) => {
      const key = String(order.user_id);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const normalizedUsers = users.map((user) => ({
      ...user.toObject(),
      role: getEffectiveRole(user),
      orderCount: orderCountMap[String(user._id)] || 0
    }));
    res.json({ success: true, data: normalizedUsers });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});

// ===== ADMIN ORDERS =====
app.get("/api/admin/orders", adminAuth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ created_at: -1 });
    const userIds = [...new Set(orders.map((o) => o.user_id).filter(Boolean))];
    const users = await User.find({ _id: { $in: userIds } }).select("name email");
    const userMap = users.reduce((acc, user) => {
      acc[String(user._id)] = user;
      return acc;
    }, {});

    const payload = orders.map((order) => {
      const owner = userMap[String(order.user_id)];
      return {
        ...order.toObject(),
        id: order._id,
        user_name: owner?.name || "Customer",
        user_email: owner?.email || "-"
      };
    });

    res.json({ success: true, data: payload, count: payload.length });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});

// ===== ADMIN NOTIFICATIONS (Placeholder) =====
app.get("/api/admin/notifications", adminAuth, async (req, res) => {
  res.json({ success: true, data: [] });
});

app.get("/api/admin/notifications/unread-count", adminAuth, async (req, res) => {
  res.json({ success: true, count: 0 });
});

app.put("/api/admin/notifications/:id/read", adminAuth, async (req, res) => {
  res.json({ success: true, message: "Notification marked as read" });
});

app.get("/api/admin/carousel", adminAuth, async (req, res) => {
  try {
    const config = await CarouselConfig.findOne({ key: "home" });
    res.json({
      success: true,
      data: config?.slides?.length ? config.slides : DEFAULT_CAROUSEL_SLIDES
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch admin carousel" });
  }
});

app.put("/api/admin/carousel", adminAuth, async (req, res) => {
  try {
    const slides = Array.isArray(req.body?.slides) ? req.body.slides : null;
    if (!slides || slides.length === 0) {
      return res.status(400).json({ success: false, message: "Slides are required" });
    }

    const normalizedSlides = slides.map((slide, index) => ({
      id: Number(slide?.id) || index + 1,
      title: String(slide?.title || `Slide ${index + 1}`).trim(),
      url: String(slide?.url || "").trim()
    }));

    const hasEmptyImage = normalizedSlides.some((slide) => !slide.url);
    if (hasEmptyImage) {
      return res.status(400).json({ success: false, message: "All slides must have an image URL" });
    }

    const updated = await CarouselConfig.findOneAndUpdate(
      { key: "home" },
      { key: "home", slides: normalizedSlides },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: updated.slides, message: "Carousel updated" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update carousel" });
  }
});

app.put("/api/admin/orders/:id/status", adminAuth, async (req, res) => {
  try {
    const { status, tracking_location } = req.body;
    const update = {};
    if (typeof status !== "undefined") update.status = status;
    if (typeof tracking_location !== "undefined") update.tracking_location = tracking_location;

    const updated = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.json({ success: true, message: "Order status updated", data: updated });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update order status" });
  }
});

app.delete("/api/admin/orders/:id", adminAuth, async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.json({ success: true, message: "Order deleted" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to delete order" });
  }
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
    await ensureAdminUser();
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
