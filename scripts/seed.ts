import dotenv from "dotenv";
import path from "path";
// Next.js uses .env.local — dotenv/config only loads .env by default
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectToDB } from "../lib/db/connect";
import User from "../models/User.model";
import Category from "../models/Category.model";
import Product from "../models/Product.model";
import Order from "../models/Order.model";
import Review from "../models/Review.model";
import Cart from "../models/Cart.model";

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[&]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function randomPastDate(monthsBack: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - Math.floor(Math.random() * monthsBack));
  d.setDate(Math.floor(Math.random() * 28) + 1);
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────

async function seed() {
  await connectToDB();
  console.log("✅ Connected to MongoDB");

  // ── Idempotency guard: delete in reverse dependency order ──────────────────
  await Review.deleteMany({});
  await Order.deleteMany({});
  await Cart.deleteMany({});
  await Product.deleteMany({});
  await Category.deleteMany({});
  await User.deleteMany({});
  console.log("🗑️  Cleared all collections");

  // ── Step 1: Seed Users (10 records) ─────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const usersData = [
    {
      name: "Aditya Sharma",
      email: "aditya.sharma@example.com",
      role: "admin" as const,
      addresses: [
        { label: "Home", line1: "12, Shivaji Nagar", city: "Pune", state: "Maharashtra", pincode: "411001", isDefault: true },
        { label: "Office", line1: "101, IT Park", line2: "Phase 2", city: "Pune", state: "Maharashtra", pincode: "411057", isDefault: false },
      ],
    },
    {
      name: "Priya Patel",
      email: "priya.patel@example.com",
      role: "customer" as const,
      addresses: [
        { label: "Home", line1: "45, CG Road", city: "Ahmedabad", state: "Gujarat", pincode: "380001", isDefault: true },
      ],
    },
    {
      name: "Rohan Iyer",
      email: "rohan.iyer@example.com",
      role: "customer" as const,
      addresses: [
        { label: "Home", line1: "7, Indiranagar", line2: "Block B", city: "Bengaluru", state: "Karnataka", pincode: "560001", isDefault: true },
      ],
    },
    {
      name: "Sneha Reddy",
      email: "sneha.reddy@example.com",
      role: "customer" as const,
      addresses: [
        { label: "Home", line1: "23, Banjara Hills", city: "Hyderabad", state: "Telangana", pincode: "500034", isDefault: true },
        { label: "Parent's Home", line1: "55, MG Road", city: "Visakhapatnam", state: "Andhra Pradesh", pincode: "530001", isDefault: false },
      ],
    },
    {
      name: "Vikram Singh",
      email: "vikram.singh@example.com",
      role: "customer" as const,
      addresses: [
        { label: "Home", line1: "8, Rajpur Road", city: "Dehradun", state: "Uttarakhand", pincode: "248001", isDefault: true },
      ],
    },
    {
      name: "Ananya Nair",
      email: "ananya.nair@example.com",
      role: "customer" as const,
      addresses: [
        { label: "Home", line1: "12, Palarivattom", city: "Kochi", state: "Kerala", pincode: "682025", isDefault: true },
      ],
    },
    {
      name: "Rahul Gupta",
      email: "rahul.gupta@example.com",
      role: "customer" as const,
      addresses: [
        { label: "Home", line1: "99, Lajpat Nagar", city: "New Delhi", state: "Delhi", pincode: "110024", isDefault: true },
        { label: "Office", line1: "Floor 5, Cyber Hub", city: "Gurugram", state: "Haryana", pincode: "122001", isDefault: false },
      ],
    },
    {
      name: "Kavya Menon",
      email: "kavya.menon@example.com",
      role: "customer" as const,
      addresses: [
        { label: "Home", line1: "34, Velachery", city: "Chennai", state: "Tamil Nadu", pincode: "600042", isDefault: true },
      ],
    },
    {
      name: "Arjun Joshi",
      email: "arjun.joshi@example.com",
      role: "customer" as const,
      addresses: [
        { label: "Home", line1: "56, Matunga", city: "Mumbai", state: "Maharashtra", pincode: "400019", isDefault: true },
        { label: "Weekend Home", line1: "12, Lonavala", city: "Pune", state: "Maharashtra", pincode: "410401", isDefault: false },
      ],
    },
    {
      name: "Meera Desai",
      email: "meera.desai@example.com",
      role: "customer" as const,
      addresses: [
        { label: "Home", line1: "78, Civil Lines", city: "Nagpur", state: "Maharashtra", pincode: "440001", isDefault: true },
      ],
    },
  ];

  const insertedUsers = await User.insertMany(
    usersData.map((u) => ({ ...u, passwordHash }))
  );
  const userIds = insertedUsers.map((u) => u._id);
  const customerUserIds = insertedUsers.filter((u) => u.role === "customer").map((u) => u._id);
  console.log(`👤 Seeded ${insertedUsers.length} users`);

  // ── Step 2: Seed Categories (6 records) ──────────────────────────────────────
  const categoriesData = [
    { name: "Electronics", description: "Gadgets, devices, and accessories" },
    { name: "Fashion", description: "Clothing, footwear, and lifestyle" },
    { name: "Home & Kitchen", description: "Furniture, decor, and kitchen essentials" },
    { name: "Books", description: "Educational, fiction, and reference books" },
    { name: "Groceries", description: "Daily essentials, snacks, and beverages" },
    { name: "Personal Care", description: "Skincare, haircare, and hygiene products" },
  ];

  const insertedCategories = await Category.insertMany(
    categoriesData.map((c) => ({ ...c, slug: toSlug(c.name) }))
  );

  const categoryMap: Record<string, mongoose.Types.ObjectId> = {};
  insertedCategories.forEach((cat) => {
    categoryMap[cat.name] = cat._id as mongoose.Types.ObjectId;
  });
  console.log(`🗂️  Seeded ${insertedCategories.length} categories`);

  // ── Step 3: Seed Products (20 records) ─────────────────────────────────────
  const productsRawData = [
    // Electronics (4)
    { name: "Wireless Bluetooth Earbuds", category: "Electronics", price: 299900, stock: 85, description: "Premium earbuds with 30-hour battery life and active noise cancellation. Perfect for commuting and workouts.", isActive: true },
    { name: "USB-C Fast Charger 65W", category: "Electronics", price: 149900, stock: 120, description: "Universal 65W GaN charger compatible with laptops, phones, and tablets. Includes 2m braided cable.", isActive: true },
    { name: "Mechanical Keyboard TKL", category: "Electronics", price: 399900, stock: 3, description: "Tenkeyless mechanical keyboard with tactile blue switches, per-key RGB, and aluminum frame.", isActive: true },
    { name: "Smart LED Desk Lamp", category: "Electronics", price: 199900, stock: 60, description: "Touch-controlled LED desk lamp with 5 color temperatures, USB charging port, and timer function.", isActive: true },

    // Fashion (4)
    { name: "Cotton Kurta Set for Men", category: "Fashion", price: 89900, stock: 200, description: "Premium handloom cotton kurta-pajama set. Available in classic white and off-white. Ideal for festivals and casual wear.", isActive: true },
    { name: "Ethnic Printed Kurti for Women", category: "Fashion", price: 74900, stock: 150, description: "Block-print cotton kurti with round neck. Comfortable for daily wear and light occasions.", isActive: true },
    { name: "Canvas Sneakers Unisex", category: "Fashion", price: 129900, stock: 2, description: "Classic canvas sneakers with rubber sole. Versatile design suitable for both men and women.", isActive: true },
    { name: "Woolen Stole Handwoven", category: "Fashion", price: 69900, stock: 45, description: "Handwoven pashmina-blend stole. Lightweight, warm, and available in earth-tone colors.", isActive: false },

    // Home & Kitchen (3)
    { name: "Stainless Steel Tiffin Box 3-Tier", category: "Home & Kitchen", price: 49900, stock: 180, description: "Leak-proof 3-tier stainless steel tiffin box. BPA-free, dishwasher-safe, with insulated bag.", isActive: true },
    { name: "Bamboo Cutting Board Set", category: "Home & Kitchen", price: 89900, stock: 95, description: "Set of 3 bamboo cutting boards in different sizes. Naturally antimicrobial and eco-friendly.", isActive: true },
    { name: "Copper Hammered Water Bottle 1L", category: "Home & Kitchen", price: 79900, stock: 70, description: "Handcrafted hammered copper water bottle. Naturally purifies water and keeps it cool.", isActive: true },

    // Books (3)
    { name: "The Intelligent Investor (Hindi)", category: "Books", price: 49900, stock: 130, description: "Benjamin Graham's classic investment guide translated in Hindi. Essential reading for every Indian investor.", isActive: true },
    { name: "Atomic Habits — Pocket Edition", category: "Books", price: 34900, stock: 200, description: "Compact edition of James Clear's bestseller. Build better habits and break the bad ones.", isActive: true },
    { name: "Indian History Encyclopedia", category: "Books", price: 149900, stock: 40, description: "Comprehensive illustrated encyclopedia of Indian history from ancient times to independence. 800 pages.", isActive: true },

    // Groceries (3)
    { name: "Premium Basmati Rice 5kg", category: "Groceries", price: 59900, stock: 4, description: "Aged long-grain basmati rice from the foothills of the Himalayas. Perfect for biryani and pulao.", isActive: true },
    { name: "Cold Pressed Coconut Oil 1L", category: "Groceries", price: 44900, stock: 160, description: "100% pure cold-pressed virgin coconut oil. Ideal for cooking, skincare, and haircare.", isActive: true },
    { name: "Organic Honey 500g", category: "Groceries", price: 39900, stock: 110, description: "Wild forest honey collected from Himalayan beehives. No added sugar, raw and unfiltered.", isActive: true },

    // Personal Care (3)
    { name: "Neem & Tulsi Face Wash 100ml", category: "Personal Care", price: 29900, stock: 250, description: "Herbal face wash with neem and tulsi extracts. Controls oil, fights acne, and clears skin.", isActive: true },
    { name: "Argan Oil Hair Serum 50ml", category: "Personal Care", price: 44900, stock: 90, description: "Lightweight hair serum with Moroccan argan oil. Reduces frizz, adds shine, and nourishes damaged hair.", isActive: true },
    { name: "Activated Charcoal Soap Bar", category: "Personal Care", price: 19900, stock: 300, description: "Handcrafted activated charcoal soap. Deep cleanses pores, removes toxins, and leaves skin refreshed.", isActive: true },
  ];

  const insertedProducts = await Product.insertMany(
    productsRawData.map((p) => ({
      ...p,
      slug: toSlug(p.name),
      categoryId: categoryMap[p.category],
      images: [],
      ratingAvg: parseFloat((Math.random() * 2 + 3).toFixed(1)), // 3.0–5.0
      ratingCount: Math.floor(Math.random() * 200) + 5,
    }))
  );
  const productIds = insertedProducts.map((p) => p._id as mongoose.Types.ObjectId);
  console.log(`📦 Seeded ${insertedProducts.length} products`);

  // ── Step 4: Seed Orders (30 records) ─────────────────────────────────────────
  // Status distribution: ~12 delivered, ~6 shipped, ~5 confirmed, ~4 pending, ~3 cancelled
  const statusPool: Array<"pending" | "confirmed" | "shipped" | "delivered" | "cancelled"> = [
    "delivered", "delivered", "delivered", "delivered", "delivered", "delivered",
    "delivered", "delivered", "delivered", "delivered", "delivered", "delivered",
    "shipped", "shipped", "shipped", "shipped", "shipped", "shipped",
    "confirmed", "confirmed", "confirmed", "confirmed", "confirmed",
    "pending", "pending", "pending", "pending",
    "cancelled", "cancelled", "cancelled",
  ];

  const ordersData = statusPool.map((status, i) => {
    // Pick 1–3 active products
    const activeProducts = insertedProducts.filter((p) => p.isActive);
    const numItems = Math.floor(Math.random() * 3) + 1;
    const selectedProducts = activeProducts
      .sort(() => Math.random() - 0.5)
      .slice(0, numItems);

    const items = selectedProducts.map((product) => {
      const quantity = Math.floor(Math.random() * 3) + 1;
      const lineTotal = product.price * quantity;
      return {
        productId: product._id,
        nameSnapshot: product.name,
        priceSnapshot: product.price,
        quantity,
        lineTotal,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const tax = Math.round(subtotal * 0.18); // 18% GST
    const total = subtotal + tax;

    const userId = pick(customerUserIds);
    const user = insertedUsers.find((u) => u._id.equals(userId));
    const address: import("../models/User.model").IAddress = user?.addresses?.[0] ?? {
      label: "Home",
      line1: "Default Address",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      isDefault: true,
    };

    return {
      userId,
      items,
      shippingAddressSnapshot: {
        label: address.label,
        line1: address.line1,
        ...(address.line2 ? { line2: address.line2 } : {}),
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        isDefault: address.isDefault,
      },
      subtotal,
      tax,
      total,
      status,
      payment: {
        razorpayOrderId: `order_seed_${i + 1}`,
        razorpayPaymentId: status === "delivered" || status === "shipped" || status === "confirmed"
          ? `pay_seed_${i + 1}` : undefined,
        status: status === "delivered" || status === "shipped" || status === "confirmed"
          ? "paid"
          : status === "cancelled"
          ? "failed"
          : "created",
      },
      createdAt: randomPastDate(12),
    };
  });

  await Order.insertMany(ordersData);
  console.log(`📋 Seeded ${ordersData.length} orders`);

  // ── Step 5: Seed a few Reviews ────────────────────────────────────────────────
  // Add some reviews so ratingAvg and ratingCount are meaningful
  const reviewsData: Array<{
    productId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    rating: number;
    comment?: string;
  }> = [];
  const reviewedCombinations = new Set<string>();

  for (let i = 0; i < 40; i++) {
    const product = pick(insertedProducts.filter((p) => p.isActive));
    const user = pick(customerUserIds);
    const combo = `${product._id}-${user}`;
    if (reviewedCombinations.has(combo)) continue;
    reviewedCombinations.add(combo);

    const rating = Math.floor(Math.random() * 3) + 3; // 3–5
    const comments = [
      "Great quality, very satisfied!",
      "Value for money. Would recommend.",
      "Fast delivery, good packaging.",
      "Exactly as described. Happy with purchase.",
      "Good product but could be better.",
      "Outstanding! Exceeded expectations.",
      "My family loves it. Will buy again.",
    ];

    reviewsData.push({
      productId: product._id as mongoose.Types.ObjectId,
      userId: user as mongoose.Types.ObjectId,
      rating,
      comment: Math.random() > 0.3 ? pick(comments) : undefined,
    });
  }

  await Review.insertMany(reviewsData);
  console.log(`⭐ Seeded ${reviewsData.length} reviews`);

  console.log("\n🎉 Seed complete!");
  console.log("  Users:      ", await User.countDocuments());
  console.log("  Categories: ", await Category.countDocuments());
  console.log("  Products:   ", await Product.countDocuments());
  console.log("  Orders:     ", await Order.countDocuments());
  console.log("  Reviews:    ", await Review.countDocuments());

  await mongoose.disconnect();
  console.log("🔌 Disconnected from MongoDB");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
