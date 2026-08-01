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
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin@12341";
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
const memoryStorage = multer.memoryStorage();
const PRODUCT_IMAGE_LIMIT = 10;
const PRODUCT_VIDEO_LIMIT = 2;
const memoryUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 8 * 1024 * 1024 }
});

// In-memory caches to reduce DB roundtrips
const couponCache = new Map(); // key -> { doc, expires }
const COUPON_CACHE_TTL = 60 * 1000; // 60s

let adsCache = { data: null, expires: 0 };
const ADS_CACHE_TTL = 30 * 1000; // 30s

function getCachedCoupon(code) {
  if (!code) return null;
  const key = String(code).trim().toUpperCase();
  const entry = couponCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    couponCache.delete(key);
    return null;
  }
  return entry.doc;
}

function setCachedCoupon(code, doc) {
  if (!code || !doc) return;
  const key = String(code).trim().toUpperCase();
  couponCache.set(key, { doc, expires: Date.now() + COUPON_CACHE_TTL });
}

const productUpload = memoryUpload.fields([
  { name: "images", maxCount: PRODUCT_IMAGE_LIMIT },
  { name: "videos", maxCount: PRODUCT_VIDEO_LIMIT }
]);

function handleProductUpload(req, res, next) {
  productUpload(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ success: false, message: "Each image or video must be 8 MB or smaller." });
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({ success: false, message: `You can upload up to ${PRODUCT_IMAGE_LIMIT} images and ${PRODUCT_VIDEO_LIMIT} videos per product.` });
      }
    }

    console.error("Product upload error:", err);
    return res.status(400).json({ success: false, message: "Unable to process the uploaded product media." });
  });
}

function fileToBase64(file) {
  if (!file || !file.buffer) return null;
  const mime = file.mimetype || "application/octet-stream";
  return `data:${mime};base64,${file.buffer.toString("base64")}`;
}

// ===== Middleware =====
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

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
  avatar: { type: String, default: "" },
  created_at: { type: Date, default: Date.now },
  last_login_at: { type: Date, default: Date.now },
  last_login_ip: { type: String, default: "" },
  reset_token_hash: { type: String, default: "" },
  reset_token_expires: { type: Date, default: null }
});
const User = mongoose.model("User", userSchema);

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  original_price: Number,
  category: String,
  stock: Number,
  description: String,
  image_url: String,
  images: [String],
  videos: [String],
  is_featured: { type: Boolean, default: false },
  offer: { type: String, default: "" },
  sizes: { type: mongoose.Schema.Types.Mixed, default: ["7", "8", "9", "10", "11", "12"] }
}, { strict: false });
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
  payment_status: { type: String, enum: ["Paid", "Unpaid"], default: "Paid" },
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

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discount_type: { type: String, enum: ["percentage", "fixed"], required: true },
  discount_value: { type: Number, required: true },
  min_order_value: { type: Number, default: 0 },
  max_discount: { type: Number, default: 0 },
  applicable_product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  target_audience: { type: String, enum: ["all", "new_users_only", "specific_users"], default: "all" },
  allowed_user_ids: [{ type: String }],
  usage_limit: { type: Number, default: 0 },
  usage_limit_per_user: { type: Number, default: 1 },
  total_used: { type: Number, default: 0 }
});
// Ensure codes are normalized and indexed for fast lookups
couponSchema.pre('save', function (next) {
  if (this.code) this.code = String(this.code).trim().toUpperCase();
  next();
});
// Clear cache when coupons change
couponSchema.post('save', function(doc) {
  try { couponCache.delete(String(doc.code).trim().toUpperCase()); } catch (e) {}
});
couponSchema.post('remove', function(doc) {
  try { couponCache.delete(String(doc.code).trim().toUpperCase()); } catch (e) {}
});
const Coupon = mongoose.model("Coupon", couponSchema);

const WishlistSchema = new mongoose.Schema({
  user_id: { type: String, required: true, index: true },
  product_id: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});
WishlistSchema.index({ user_id: 1, product_id: 1 }, { unique: true });
const Wishlist = mongoose.model("Wishlist", WishlistSchema);

const couponUsageSchema = new mongoose.Schema({
  coupon_id: { type: String, required: true },
  user_id: { type: String, required: true },
  used_at: { type: Date, default: Date.now }
});
const CouponUsage = mongoose.model("CouponUsage", couponUsageSchema);

const couponLockSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  locked: { type: Boolean, default: false },
  last_coupon_used: { type: String, default: "" },
  locked_at: { type: Date, default: null }
});
couponLockSchema.index({ user_id: 1 });
const CouponLock = mongoose.model("CouponLock", couponLockSchema);

const adSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  image_url: { type: String, default: "" },
  link_url: { type: String, default: "" },
  button_text: { type: String, default: "Shop Now" },
  display_type: { type: String, enum: ["banner", "modal", "toast"], default: "banner" },
  is_active: { type: Boolean, default: true },
  priority: { type: Number, default: 0 },
  start_date: { type: Date, default: null },
  end_date: { type: Date, default: null },
  target_audience: { type: String, enum: ["all", "new_users", "returning"], default: "all" }
}, { timestamps: true });
// useful index to speed up active/date-range queries
adSchema.index({ is_active: 1, start_date: 1, end_date: 1, priority: -1 });
const Ad = mongoose.model("Ad", adSchema);

const messageSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  user_name: String,
  user_email: String,
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  product_name: String,
  message: { type: String, required: true },
  status: { type: String, default: "Unread" },
  created_at: { type: Date, default: Date.now }
}, { timestamps: true });
const Message = mongoose.model("Message", messageSchema);

const DEFAULT_COUPONS = [
  { code: "WELCOME10", discount_type: "percentage", discount_value: 10, min_order_value: 0, max_discount: 0, is_active: true, target_audience: "new_users_only", usage_limit_per_user: 1 },
  { code: "SAVE20", discount_type: "percentage", discount_value: 20, min_order_value: 500, max_discount: 200, is_active: true, target_audience: "all", usage_limit_per_user: 1 },
  { code: "FLAT50", discount_type: "fixed", discount_value: 50, min_order_value: 300, max_discount: 0, is_active: true, target_audience: "all", usage_limit_per_user: 1 }
];

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

async function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    return await User.findById(decoded.id);
  } catch {
    return null;
  }
}

// ===== AUTH MIDDLEWARE =====
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

function serializeCoupon(coupon, discountAmount) {
  return {
    id: coupon._id,
    code: coupon.code,
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_value,
    discount_amount: discountAmount,
    min_order_value: coupon.min_order_value,
    max_discount: coupon.max_discount,
    target_audience: coupon.target_audience,
    usage_limit: coupon.usage_limit,
    usage_limit_per_user: coupon.usage_limit_per_user,
    total_used: coupon.total_used || 0
  };
}

async function validateCouponForUser({ code, subtotal, cartItems, userId }) {
  const normalizedCode = (code || "").trim().toUpperCase();
  const userIdentifier = String(userId || "").trim();
  const orderSubtotal = Number(subtotal) || 0;

  if (!normalizedCode) {
    return { status: 400, body: { success: false, message: "Coupon code is required" } };
  }

  if (!userIdentifier) {
    return { status: 401, body: { success: false, message: "Please login to use coupons" } };
  }

  const coupon = await Coupon.findOne({ code: normalizedCode, is_active: true }).lean();
  if (!coupon) {
    return { status: 404, body: { success: false, message: "Invalid coupon code" } };
  }

  // product applicability check
  if (coupon.applicable_product_id) {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return { status: 400, body: { success: false, message: "Cart is empty" } };
    }

    const hasProduct = cartItems.some(item =>
      String(item.product_id || item._id || item.id) === String(coupon.applicable_product_id)
    );
    if (!hasProduct) {
      return { status: 400, body: { success: false, message: "This coupon is only applicable for a specific product." } };
    }
  }

  const minOrderValue = coupon.min_order_value || 0;
  if (orderSubtotal < minOrderValue) {
    return { status: 400, body: { success: false, message: `Minimum order value of ₹${minOrderValue} required` } };
  }

  if (!userIdentifier) {
    return { status: 401, body: { success: false, message: "Please login to use coupons" } };
  }

  // Run independent DB checks in parallel to reduce latency
  const existingOrdersPromise = coupon.target_audience === "new_users_only"
    ? Order.countDocuments({ user_id: userIdentifier })
    : Promise.resolve(0);

  const userUsageCountPromise = coupon.usage_limit_per_user > 0
    ? CouponUsage.countDocuments({ coupon_id: String(coupon._id), user_id: userIdentifier })
    : Promise.resolve(0);

  const couponLockPromise = CouponLock.findOne({ user_id: userIdentifier }).lean();

  const [existingOrders, userUsageCount, couponLock] = await Promise.all([
    existingOrdersPromise,
    userUsageCountPromise,
    couponLockPromise
  ]);

  if (coupon.target_audience === "new_users_only" && existingOrders > 0) {
    return { status: 403, body: { success: false, message: "This coupon is only for new users (first order)." } };
  }

  if (coupon.target_audience === "specific_users") {
    const allowedIds = (coupon.allowed_user_ids || []).map(id => String(id).trim()).filter(Boolean);
    if (allowedIds.length === 0 || !allowedIds.includes(userIdentifier)) {
      return { status: 403, body: { success: false, message: "You are not eligible for this coupon." } };
    }
  }

  if (coupon.usage_limit > 0 && (coupon.total_used || 0) >= coupon.usage_limit) {
    return { status: 403, body: { success: false, message: "This coupon usage limit has been reached." } };
  }

  if (coupon.usage_limit_per_user > 0 && userUsageCount >= coupon.usage_limit_per_user) {
    return { status: 403, body: { success: false, message: "You have already used this coupon the maximum number of times." } };
  }

  if (couponLock && couponLock.locked) {
    return {
      status: 403,
      body: {
        success: false,
        message: "You have used a coupon recently. Please wait for admin permission to use another coupon.",
        coupon_locked: true
      }
    };
  }

  let discountAmount = 0;
  if (coupon.discount_type === "percentage") {
    discountAmount = Math.round((orderSubtotal * coupon.discount_value) / 100);
    if (coupon.max_discount && discountAmount > coupon.max_discount) discountAmount = coupon.max_discount;
  } else {
    discountAmount = coupon.discount_value;
  }

  discountAmount = Math.min(discountAmount, orderSubtotal);

  return {
    status: 200,
    coupon,
    discountAmount,
    body: {
      success: true,
      data: serializeCoupon(coupon, discountAmount)
    }
  };
}

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


// ===== FEATURED & COUPONS (PUBLIC) =====
app.get("/api/products/featured", async (req, res) => {
  try {
    const products = await Product.find({ is_featured: true });
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch featured products" });
  }
});

app.get("/api/coupons/active", async (req, res) => {
  try {
    const coupons = await Coupon.find({ is_active: true });
    res.json({ success: true, data: coupons });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch active coupons" });
  }
});

app.post("/api/coupons/validate", async (req, res) => {
  try {
    const authUser = await getAuthenticatedUser(req);
    const payload = {
      code: req.body.code,
      subtotal: req.body.subtotal,
      cartItems: req.body.cartItems,
      userId: authUser?._id || req.body.userId
    };

    const result = await validateCouponForUser(payload);
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error("Coupon validation error:", err);
    return res.status(500).json({ success: false, message: "Failed to validate coupon" });
  }
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

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ success: false, message: "Failed to fetch product" });
  }
});

// ===== PRODUCT REVIEWS =====
const reviewSchema = new mongoose.Schema({
  product_id: { type: String, required: true },
  user: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  images: [String],
  created_at: { type: Date, default: Date.now }
});
const Review = mongoose.model("Review", reviewSchema);

app.get("/api/products/:id/reviews", async (req, res) => {
  try {
    const reviews = await Review.find({ product_id: req.params.id }).sort({ created_at: -1 });
    res.json({ success: true, data: reviews });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ success: false, message: "Failed to fetch reviews" });
  }
});

app.post("/api/products/:id/reviews", async (req, res) => {
  const { user, rating, comment } = req.body;

  if (!user || !rating || !comment) {
    return res.status(400).json({ success: false, message: "User, rating, and comment are required" });
  }

  try {
    const review = await Review.create({
      product_id: req.params.id,
      user,
      rating: Number(rating),
      comment
    });
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    console.error("Error creating review:", err);
    res.status(500).json({ success: false, message: "Failed to create review" });
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

app.put("/api/auth/profile", auth, async (req, res) => {
  try {
    const { name, phone, address, city, state, zip_code, country, avatar } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zip_code !== undefined) updateData.zip_code = zip_code;
    if (country !== undefined) updateData.country = country;
    if (avatar !== undefined) updateData.avatar = avatar;

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, { new: true }).select("-password");
    res.json({ success: true, data: updatedUser, message: "Profile updated successfully" });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
});

app.put("/api/users/profile", auth, async (req, res) => {
  try {
    const { name, phone, address, city, state, zip_code, country, avatar } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zip_code !== undefined) updateData.zip_code = zip_code;
    if (country !== undefined) updateData.country = country;
    if (avatar !== undefined) updateData.avatar = avatar;

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, { new: true }).select("-password");
    res.json({ success: true, data: updatedUser, message: "Profile updated successfully" });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
});

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

    const couponCode = (req.body.coupon_code || "").trim().toUpperCase();
    if (couponCode) {
      const validation = await validateCouponForUser({
        code: couponCode,
        subtotal: req.body.subtotal || req.body.original_total || total,
        cartItems: items,
        userId: user._id
      });

      if (!validation.body.success) {
        return res.status(validation.status).json(validation.body);
      }

      const expectedTax = Math.round(((Number(req.body.subtotal || req.body.original_total || total) || 0) - validation.discountAmount) * 0.18);
      const expectedTotal = (Number(req.body.subtotal || req.body.original_total || total) || 0) - validation.discountAmount + expectedTax;
      if (Math.abs(Number(total) - expectedTotal) > 1) {
        return res.status(400).json({ success: false, message: "Order total does not match coupon discount" });
      }

      await CouponLock.findOneAndUpdate(
        { user_id: String(user._id) },
        {
          locked: true,
          last_coupon_used: couponCode,
          locked_at: new Date()
        },
        { upsert: true, new: true }
      );

      await CouponUsage.create({
        coupon_id: String(validation.coupon._id),
        user_id: String(user._id)
      });
      await Coupon.findByIdAndUpdate(validation.coupon._id, {
        $inc: { total_used: 1 }
      });
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

app.get("/api/admin/orders", adminAuth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ created_at: -1 });
    res.json({ success: true, data: orders, count: orders.length });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});

app.put("/api/admin/orders/:id/payment-status", adminAuth, async (req, res) => {
  try {
    const { payment_status } = req.body;
    if (!["Paid", "Unpaid"].includes(payment_status)) {
      return res.status(400).json({ success: false, message: "Invalid payment status" });
    }

    let updatedOrder = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      updatedOrder = await Order.findByIdAndUpdate(req.params.id, { payment_status }, { new: true });
    }
    if (!updatedOrder) {
      updatedOrder = await Order.findOneAndUpdate(
        { $or: [{ _id: req.params.id }, { id: isNaN(req.params.id) ? req.params.id : Number(req.params.id) }] },
        { payment_status },
        { new: true }
      );
    }

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, data: updatedOrder, message: `Payment status updated to ${payment_status}` });
  } catch (err) {
    console.error("Error updating payment status:", err);
    res.status(500).json({ success: false, message: "Failed to update payment status" });
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

// ===== WISHLIST =====
app.get("/api/wishlist/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId || userId === "undefined") {
      return res.json({ success: true, data: [], count: 0 });
    }
    const items = await Wishlist.find({ user_id: String(userId) });
    const productIds = items.map(i => i.product_id);

    const dbProducts = await Product.find({
      $or: [
        { _id: { $in: productIds.filter(id => mongoose.Types.ObjectId.isValid(id)) } },
        { id: { $in: productIds.map(id => isNaN(id) ? id : Number(id)) } }
      ]
    });

    res.json({ success: true, data: dbProducts, count: dbProducts.length });
  } catch (err) {
    console.error("Error fetching wishlist:", err);
    res.status(500).json({ success: false, message: "Failed to fetch wishlist" });
  }
});

app.post("/api/wishlist/:userId/:productId", async (req, res) => {
  try {
    const { userId, productId } = req.params;
    if (!userId || !productId || userId === "undefined" || productId === "undefined") {
      return res.status(400).json({ success: false, message: "Invalid parameters" });
    }

    await Wishlist.updateOne(
      { user_id: String(userId), product_id: String(productId) },
      { user_id: String(userId), product_id: String(productId) },
      { upsert: true }
    );

    const items = await Wishlist.find({ user_id: String(userId) });
    const productIds = items.map(i => i.product_id);
    const dbProducts = await Product.find({
      $or: [
        { _id: { $in: productIds.filter(id => mongoose.Types.ObjectId.isValid(id)) } },
        { id: { $in: productIds.map(id => isNaN(id) ? id : Number(id)) } }
      ]
    });

    res.json({ success: true, data: dbProducts, message: "Added to wishlist" });
  } catch (err) {
    console.error("Error adding to wishlist:", err);
    res.status(500).json({ success: false, message: "Failed to add to wishlist" });
  }
});

app.delete("/api/wishlist/:userId/:productId", async (req, res) => {
  try {
    const { userId, productId } = req.params;
    if (!userId || !productId || userId === "undefined" || productId === "undefined") {
      return res.status(400).json({ success: false, message: "Invalid parameters" });
    }

    await Wishlist.deleteOne({ user_id: String(userId), product_id: String(productId) });

    const items = await Wishlist.find({ user_id: String(userId) });
    const productIds = items.map(i => i.product_id);
    const dbProducts = await Product.find({
      $or: [
        { _id: { $in: productIds.filter(id => mongoose.Types.ObjectId.isValid(id)) } },
        { id: { $in: productIds.map(id => isNaN(id) ? id : Number(id)) } }
      ]
    });

    res.json({ success: true, data: dbProducts, message: "Removed from wishlist" });
  } catch (err) {
    console.error("Error removing from wishlist:", err);
    res.status(500).json({ success: false, message: "Failed to remove from wishlist" });
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

// ===== ADMIN PRODUCTS =====
app.get("/api/admin/products", adminAuth, async (req, res) => {
  try {
    const products = await Product.find();
    res.json({ success: true, data: products });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
});

app.post("/api/admin/products", adminAuth, handleProductUpload, async (req, res) => {
  try {
    const { name, price, original_price, category, stock, description, image_url, offer, is_featured } = req.body;
    let imageUrl = image_url || "";
    let imagesArr = [];
    let videosArr = [];

    if (req.files) {
      if (req.files['images'] && req.files['images'].length > 0) {
        imagesArr = req.files['images'].map(file => fileToBase64(file)).filter(Boolean);
        imageUrl = imagesArr[0] || imageUrl;
      } else if (image_url) {
        imagesArr = [image_url];
      }

      if (req.files['videos'] && req.files['videos'].length > 0) {
        videosArr = req.files['videos'].map(file => fileToBase64(file)).filter(Boolean);
      }
    } else if (image_url) {
      imagesArr = [image_url];
    }

    let sizesArray = ["7", "8", "9", "10", "11", "12"];
    if (req.body.sizes) {
      try {
        sizesArray = typeof req.body.sizes === "string" ? JSON.parse(req.body.sizes) : req.body.sizes;
      } catch (e) {
        sizesArray = String(req.body.sizes).split(",").map(s => s.trim()).filter(Boolean);
      }
    }

    const product = await Product.create({
      name,
      price: Number(price),
      original_price: original_price ? Number(original_price) : Number(price),
      category,
      stock: Number(stock),
      description,
      image_url: imagesArr[0] || image_url || "",
      images: imagesArr,
      videos: videosArr,
      is_featured: is_featured === "true" || is_featured === true,
      offer: offer || "",
      sizes: sizesArray
    });
    res.json({ success: true, data: product });
  } catch (err) {
    console.error("Product create error:", err);
    res.status(500).json({ success: false, message: "Failed to create product" });
  }
});

app.put("/api/admin/products/:id", adminAuth, (req, res, next) => {
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    return handleProductUpload(req, res, next);
  } else {
    next();
  }
}, async (req, res) => {
  try {
    const { name, price, original_price, category, stock, description, image_url, offer, is_featured, sizes, existing_images, existing_videos } = req.body;

    let existingProduct = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      existingProduct = await Product.findById(req.params.id);
    }
    if (!existingProduct) {
      existingProduct = await Product.findOne({
        $or: [
          { _id: req.params.id },
          { id: isNaN(req.params.id) ? req.params.id : Number(req.params.id) }
        ]
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (price !== undefined) updateData.price = Number(price);
    if (original_price !== undefined) updateData.original_price = Number(original_price);
    if (category !== undefined) updateData.category = category.trim();
    if (stock !== undefined) updateData.stock = Number(stock);
    if (description !== undefined) updateData.description = description.trim();
    if (offer !== undefined) updateData.offer = offer;
    if (is_featured !== undefined) updateData.is_featured = is_featured === "true" || is_featured === true;

    if (sizes) {
      try {
        updateData.sizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
      } catch (e) {
        updateData.sizes = String(sizes).split(",").map(s => s.trim()).filter(Boolean);
      }
    }

    // Process images
    let updatedImages = [];
    if (existing_images) {
      try {
        updatedImages = typeof existing_images === "string" ? JSON.parse(existing_images) : existing_images;
      } catch (e) {
        updatedImages = [];
      }
    } else if (existingProduct && Array.isArray(existingProduct.images) && existingProduct.images.length > 0) {
      updatedImages = [...existingProduct.images];
    } else if (image_url) {
      updatedImages = [image_url];
    } else if (existingProduct?.image_url) {
      updatedImages = [existingProduct.image_url];
    }

    if (req.files && req.files['images'] && req.files['images'].length > 0) {
      const base64Images = req.files['images'].map(file => fileToBase64(file)).filter(Boolean);
      updatedImages = [...updatedImages, ...base64Images];
    }

    if (updatedImages.length > 0) {
      updateData.images = updatedImages;
      updateData.image_url = updatedImages[0];
    } else if (image_url) {
      updateData.image_url = image_url;
      updateData.images = [image_url];
    }

    // Process videos
    let updatedVideos = [];
    if (existing_videos) {
      try {
        updatedVideos = typeof existing_videos === "string" ? JSON.parse(existing_videos) : existing_videos;
      } catch (e) {
        updatedVideos = [];
      }
    } else if (existingProduct && Array.isArray(existingProduct.videos)) {
      updatedVideos = [...existingProduct.videos];
    }

    if (req.files && req.files['videos'] && req.files['videos'].length > 0) {
      const base64Videos = req.files['videos'].map(file => fileToBase64(file)).filter(Boolean);
      updatedVideos = [...updatedVideos, ...base64Videos];
    }

    if (updatedVideos.length > 0) {
      updateData.videos = updatedVideos;
    }

    let product = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    }
    
    if (!product) {
      product = await Product.findOne({
        $or: [
          { _id: req.params.id },
          { id: isNaN(req.params.id) ? req.params.id : Number(req.params.id) }
        ]
      });

      if (product) {
        Object.assign(product, updateData);
        await product.save();
      } else {
        product = await Product.create({
          name: updateData.name || "Product",
          price: updateData.price || 0,
          original_price: updateData.original_price || updateData.price || 0,
          category: updateData.category || "Casual Sneakers",
          stock: updateData.stock || 0,
          description: updateData.description || "",
          image_url: updateData.image_url || "",
          images: updateData.images || [],
          videos: updateData.videos || [],
          is_featured: updateData.is_featured || false,
          offer: updateData.offer || "",
          sizes: updateData.sizes || ["7", "8", "9", "10", "11", "12"]
        });
      }
    }

    res.json({ success: true, data: product });
  } catch (err) {
    console.error("Product update error:", err);
    res.status(500).json({ success: false, message: "Failed to update product: " + (err.message || "Server error") });
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

// ===== CUSTOMER MESSAGES / SELLER CONTACT =====
app.post("/api/messages", auth, async (req, res) => {
  try {
    const { product_id, product_name, message, user_name, user_email } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message content is required" });
    }
    const newMessage = await Message.create({
      user_id: req.user._id,
      user_name: user_name || req.user.name || "Customer",
      user_email: user_email || req.user.email,
      product_id: product_id || null,
      product_name: product_name || "General Inquiry",
      message: message.trim(),
      status: "Unread"
    });
    res.json({ success: true, data: newMessage, message: "Message sent to seller successfully!" });
  } catch (err) {
    console.error("Error creating message:", err);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
});

app.get("/api/admin/messages", adminAuth, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch messages" });
  }
});

app.put("/api/admin/messages/:id/status", adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Message.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: "Message not found" });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update message status" });
  }
});

app.delete("/api/admin/messages/:id", adminAuth, async (req, res) => {
  try {
    const deleted = await Message.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Message not found" });
    res.json({ success: true, message: "Message deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete message" });
  }
});

// ===== ADMIN USERS =====
app.get("/api/admin/users", adminAuth, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    const allOrders = await Order.find({}, { user_id: 1 });
    const couponLocks = await CouponLock.find({}, { user_id: 1, locked: 1 });
    const orderCountMap = allOrders.reduce((acc, order) => {
      const key = String(order.user_id);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const couponLockMap = couponLocks.reduce((acc, lock) => {
      acc[String(lock.user_id)] = lock.locked;
      return acc;
    }, {});

    const normalizedUsers = users.map((user) => ({
      ...user.toObject(),
      role: getEffectiveRole(user),
      orderCount: orderCountMap[String(user._id)] || 0,
      coupon_locked: couponLockMap[String(user._id)] === true
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

// ===== ADMIN COUPONS =====
app.get("/api/admin/coupons", adminAuth, async (req, res) => {
  try {
    const coupons = await Coupon.find().populate('applicable_product_id', 'name').sort({ created_at: -1 });
    res.json({ success: true, data: coupons });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch coupons" });
  }
});

app.post("/api/admin/coupons", adminAuth, async (req, res) => {
  const { code, discount_type, discount_value, min_order_value, max_discount, is_active, applicable_product_id, target_audience, allowed_user_ids, usage_limit, usage_limit_per_user } = req.body;
  if (!code || !discount_type || !discount_value) return res.status(400).json({ success: false, message: "Missing required fields" });
  try {
    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      discount_type, discount_value: Number(discount_value),
      min_order_value: Number(min_order_value) || 0,
      max_discount: Number(max_discount) || 0,
      is_active: is_active !== false,
      applicable_product_id: applicable_product_id || null,
      target_audience: target_audience || "all",
      allowed_user_ids: Array.isArray(allowed_user_ids) ? allowed_user_ids : [],
      usage_limit: Number(usage_limit) || 0,
      usage_limit_per_user: Number(usage_limit_per_user) || 1
    });
    res.json({ success: true, data: coupon });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: "Coupon code already exists" });
    res.status(500).json({ success: false, message: "Failed to create coupon" });
  }
});

app.put("/api/admin/coupons/:id", adminAuth, async (req, res) => {
  try {
    const { code, discount_type, discount_value, min_order_value, max_discount, is_active, applicable_product_id, target_audience, allowed_user_ids, usage_limit, usage_limit_per_user } = req.body;
    const updateData = {
      code: (code || "").trim().toUpperCase(),
      discount_type, discount_value: Number(discount_value),
      min_order_value: Number(min_order_value) || 0,
      max_discount: Number(max_discount) || 0,
      is_active,
      applicable_product_id: applicable_product_id || null,
      target_audience: target_audience || "all",
      allowed_user_ids: Array.isArray(allowed_user_ids) ? allowed_user_ids : [],
      usage_limit: Number(usage_limit) || 0,
      usage_limit_per_user: Number(usage_limit_per_user) || 1
    };
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
    res.json({ success: true, data: coupon });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update coupon" });
  }
});

app.delete("/api/admin/coupons/:id", adminAuth, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
    res.json({ success: true, message: "Coupon deleted" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to delete coupon" });
  }
});

app.get("/api/admin/coupon-locks", adminAuth, async (req, res) => {
  try {
    const lockedUsers = await CouponLock.find({ locked: true }).sort({ locked_at: -1 });
    const userIds = lockedUsers.map(l => l.user_id);
    const users = await User.find({ _id: { $in: userIds } }).select("name email");
    const userMap = users.reduce((acc, u) => {
      acc[String(u._id)] = u;
      return acc;
    }, {});

    const payload = lockedUsers.map(lock => {
      const owner = userMap[String(lock.user_id)];
      return {
        ...lock.toObject(),
        id: lock._id,
        user_name: owner?.name || "Customer",
        user_email: owner?.email || "-"
      };
    });

    res.json({ success: true, data: payload, count: payload.length });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch coupon locks" });
  }
});

app.post("/api/admin/coupon-locks/:userId/unlock", adminAuth, async (req, res) => {
  try {
    const lock = await CouponLock.findOneAndUpdate(
      { user_id: req.params.userId },
      { $set: { locked: false } },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: lock, message: "Coupon permission granted" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to unlock coupon" });
  }
});

app.post("/api/admin/coupon-locks/:userId/lock", adminAuth, async (req, res) => {
  try {
    const lock = await CouponLock.findOneAndUpdate(
      { user_id: req.params.userId },
      {
        $set: {
          locked: true,
          locked_at: new Date()
        }
      },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: lock, message: "Coupon access revoked" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to lock coupon" });
  }
});

app.get("/api/coupon-locks/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.json({ success: true, data: { locked: false } });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.json({ success: true, data: { locked: false } });
    }

    const lock = await CouponLock.findOne({ user_id: String(user._id) });
    return res.json({
      success: true,
      data: {
        locked: lock ? lock.locked : false,
        last_coupon_used: lock ? lock.last_coupon_used : "",
        locked_at: lock ? lock.locked_at : null
      }
    });
  } catch {
    return res.json({ success: true, data: { locked: false } });
  }
});

// ===== ADS =====
app.get("/api/ads/active", async (req, res) => {
  try {
    const now = new Date();
    // serve from in-memory cache when fresh
    if (adsCache.data && Date.now() < adsCache.expires) {
      return res.json({ success: true, data: adsCache.data });
    }

    const activeAds = await Ad.find({
        is_active: true,
        $or: [
          { start_date: null, end_date: null },
          { start_date: { $lte: now }, end_date: null },
          { start_date: null, end_date: { $gte: now } },
          { start_date: { $lte: now }, end_date: { $gte: now } }
        ]
      }).sort({ priority: -1, createdAt: -1 }).lean();

    adsCache = { data: activeAds, expires: Date.now() + ADS_CACHE_TTL };
    res.json({ success: true, data: activeAds });
  } catch (err) {
    console.error("Error fetching active ads:", err);
    res.status(500).json({ success: false, message: "Failed to fetch active ads" });
  }
});

app.get("/api/admin/ads", adminAuth, async (req, res) => {
  try {
    const ads = await Ad.find().sort({ priority: -1, createdAt: -1 });
    res.json({ success: true, data: ads });
  } catch (err) {
    console.error("Error fetching admin ads:", err);
    res.status(500).json({ success: false, message: "Failed to fetch ads" });
  }
});

app.post("/api/admin/ads", adminAuth, async (req, res) => {
  try {
    const { title, message, image_url, link_url, button_text, display_type, is_active, priority, start_date, end_date, target_audience } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: "Title and message are required" });
    }
    const newAd = await Ad.create({
      title: title.trim(),
      message: message.trim(),
      image_url: image_url || "",
      link_url: link_url || "",
      button_text: button_text || "Shop Now",
      display_type: display_type || "banner",
      is_active: is_active !== false,
      priority: Number(priority) || 0,
      start_date: start_date ? new Date(start_date) : null,
      end_date: end_date ? new Date(end_date) : null,
      target_audience: target_audience || "all"
    });
    // invalidate ads cache
    adsCache.expires = 0;
    res.json({ success: true, data: newAd });
  } catch (err) {
    console.error("Error creating ad:", err);
    res.status(500).json({ success: false, message: "Failed to create ad" });
  }
});

app.put("/api/admin/ads/:id", adminAuth, async (req, res) => {
  try {
    const { title, message, image_url, link_url, button_text, display_type, is_active, priority, start_date, end_date, target_audience } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: "Title and message are required" });
    }
    const updateData = {
      title: title.trim(),
      message: message.trim(),
      image_url: image_url || "",
      link_url: link_url || "",
      button_text: button_text || "Shop Now",
      display_type: display_type || "banner",
      is_active: is_active !== false,
      priority: Number(priority) || 0,
      start_date: start_date ? new Date(start_date) : null,
      end_date: end_date ? new Date(end_date) : null,
      target_audience: target_audience || "all"
    };
    const updatedAd = await Ad.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!updatedAd) {
      return res.status(404).json({ success: false, message: "Ad not found" });
    }
    adsCache.expires = 0;
    res.json({ success: true, data: updatedAd });
  } catch (err) {
    console.error("Error updating ad:", err);
    res.status(500).json({ success: false, message: "Failed to update ad" });
  }
});

app.delete("/api/admin/ads/:id", adminAuth, async (req, res) => {
  try {
    const deletedAd = await Ad.findByIdAndDelete(req.params.id);
    if (!deletedAd) {
      return res.status(404).json({ success: false, message: "Ad not found" });
    }
    adsCache.expires = 0;
    res.json({ success: true, message: "Ad deleted successfully" });
  } catch (err) {
    console.error("Error deleting ad:", err);
    res.status(500).json({ success: false, message: "Failed to delete ad" });
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

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`⚠️ Port ${PORT} is already in use! Your backend server is ALREADY running on port ${PORT}.`);
      } else {
        console.error("❌ Server error:", err);
      }
    });

  } catch (err) {
    console.error("❌ DB Connection Failed:", err);
    process.exit(1);
  }
}

startServer();
