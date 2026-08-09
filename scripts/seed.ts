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
      name: "Shivam Garade",
      email: "shivamgarade05@gmail.com",
      role: "admin" as const,
      addresses: [
        { label: "Home", line1: "12, Main Street", city: "Pune", state: "Maharashtra", pincode: "411001", isDefault: true },
      ],
    },
  ];

  const insertedUsers = await User.insertMany(
    usersData.map((u) => ({ ...u, passwordHash }))
  );
  const userIds = insertedUsers.map((u) => u._id);
  const customerUserIds = userIds;
  console.log(`👤 Seeded ${insertedUsers.length} user (Shivam Garade)`);

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
    {
      name: "Wireless Bluetooth Earbuds",
      category: "Electronics",
      price: 299900,
      stock: 85,
      description: "Premium earbuds with 30-hour battery life and active noise cancellation. Perfect for commuting and workouts.",
      isActive: true,
      image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80"
    },
    {
      name: "USB-C Fast Charger 65W",
      category: "Electronics",
      price: 149900,
      stock: 120,
      description: "Universal 65W GaN charger compatible with laptops, phones, and tablets. Includes 2m braided cable.",
      isActive: true,
      image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80"
    },
    {
      name: "Mechanical Keyboard TKL",
      category: "Electronics",
      price: 399900,
      stock: 3,
      description: "Tenkeyless mechanical keyboard with tactile blue switches, per-key RGB, and aluminum frame.",
      isActive: true,
      image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80"
    },
    {
      name: "Smart LED Desk Lamp",
      category: "Electronics",
      price: 199900,
      stock: 60,
      description: "Touch-controlled LED desk lamp with 5 color temperatures, USB charging port, and timer function.",
      isActive: true,
      image: "https://images.unsplash.com/photo-1534073828943-f801091bb18c?w=800&auto=format&fit=crop&q=80"
    },

    // Fashion (4)
    {
      name: "Cotton Kurta Set for Men",
      category: "Fashion",
      price: 89900,
      stock: 200,
      description: "Premium handloom cotton kurta-pajama set. Available in classic white and off-white. Ideal for festivals and casual wear.",
      isActive: true,
      image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&auto=format&fit=crop&q=80" // Verified Men's Ethnic Wear / Kurta
    },
    {
      name: "Men's Slim Fit Casual Shirt",
      category: "Fashion",
      price: 119900,
      stock: 150,
      description: "100% premium cotton slim-fit button-down shirt. Comfortable for office, casual outings, and evening wear.",
      isActive: true,
      image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80" // Verified Men's Casual Shirt
    },
    {
      name: "Canvas Sneakers Unisex",
      category: "Fashion",
      price: 129900,
      stock: 2,
      description: "Classic canvas sneakers with rubber sole. Versatile design suitable for everyday casual style.",
      isActive: true,
      image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&auto=format&fit=crop&q=80" // Verified Canvas Sneakers
    },
    {
      name: "Woolen Stole Handwoven",
      category: "Fashion",
      price: 69900,
      stock: 45,
      description: "Handwoven pashmina-blend stole. Lightweight, warm, and available in earth-tone colors.",
      isActive: false,
      image: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&auto=format&fit=crop&q=80" // Verified Woolen Scarf/Stole
    },

    // Home & Kitchen (3)
    {
      name: "Stainless Steel Tiffin Box 3-Tier",
      category: "Home & Kitchen",
      price: 49900,
      stock: 180,
      description: "Leak-proof 3-tier stainless steel tiffin box. BPA-free, dishwasher-safe, with insulated bag.",
      isActive: true,
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80" // Verified Food Container / Tiffin
    },
    {
      name: "Bamboo Cutting Board Set",
      category: "Home & Kitchen",
      price: 89900,
      stock: 95,
      description: "Set of 3 bamboo cutting boards in different sizes. Naturally antimicrobial and eco-friendly.",
      isActive: true,
      image: "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=800&auto=format&fit=crop&q=80"
    },
    {
      name: "Copper Hammered Water Bottle 1L",
      category: "Home & Kitchen",
      price: 79900,
      stock: 70,
      description: "Handcrafted hammered copper water bottle. Naturally purifies water and keeps it cool.",
      isActive: true,
      image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80"
    },

    // Books (3)
    {
      name: "The Intelligent Investor (Hindi)",
      category: "Books",
      price: 49900,
      stock: 130,
      description: "Benjamin Graham's classic investment guide translated in Hindi. Essential reading for every Indian investor.",
      isActive: true,
      image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80"
    },
    {
      name: "Atomic Habits — Pocket Edition",
      category: "Books",
      price: 34900,
      stock: 200,
      description: "Compact edition of James Clear's bestseller. Build better habits and break the bad ones.",
      isActive: true,
      image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&auto=format&fit=crop&q=80"
    },
    {
      name: "Indian History Encyclopedia",
      category: "Books",
      price: 149900,
      stock: 40,
      description: "Comprehensive illustrated encyclopedia of Indian history from ancient times to independence. 800 pages.",
      isActive: true,
      image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80"
    },

    // Groceries (3)
    {
      name: "Premium Basmati Rice 5kg",
      category: "Groceries",
      price: 59900,
      stock: 4,
      description: "Aged long-grain basmati rice from the foothills of the Himalayas. Perfect for biryani and pulao.",
      isActive: true,
      image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80"
    },
    {
      name: "Cold Pressed Coconut Oil 1L",
      category: "Groceries",
      price: 44900,
      stock: 160,
      description: "100% pure cold-pressed virgin coconut oil. Ideal for cooking, skincare, and haircare.",
      isActive: true,
      image: "https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=800&auto=format&fit=crop&q=80"
    },
    {
      name: "Organic Honey 500g",
      category: "Groceries",
      price: 39900,
      stock: 110,
      description: "Wild forest honey collected from Himalayan beehives. No added sugar, raw and unfiltered.",
      isActive: true,
      image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80"
    },

    // Personal Care (3)
    {
      name: "Neem & Tulsi Face Wash 100ml",
      category: "Personal Care",
      price: 29900,
      stock: 250,
      description: "Herbal face wash with neem and tulsi extracts. Controls oil, fights acne, and clears skin.",
      isActive: true,
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80"
    },
    {
      name: "Argan Oil Hair Serum 50ml",
      category: "Personal Care",
      price: 44900,
      stock: 90,
      description: "Lightweight hair serum with Moroccan argan oil. Reduces frizz, adds shine, and nourishes damaged hair.",
      isActive: true,
      image: "https://images.unsplash.com/photo-1608248597266-c89050df9c15?w=800&auto=format&fit=crop&q=80"
    },
    {
      name: "Activated Charcoal Soap Bar",
      category: "Personal Care",
      price: 19900,
      stock: 300,
      description: "Handcrafted activated charcoal soap. Deep cleanses pores, removes toxins, and leaves skin refreshed.",
      isActive: true,
      image: "https://images.unsplash.com/photo-1607006482602-76ca0fd2f88d?w=800&auto=format&fit=crop&q=80"
    },
  ];

  const insertedProducts = await Product.insertMany(
    productsRawData.map((p, idx) => ({
      name: p.name,
      slug: toSlug(p.name),
      category: p.category,
      price: p.price,
      stock: p.stock,
      description: p.description,
      isActive: p.isActive,
      categoryId: categoryMap[p.category],
      images: [{ url: p.image, publicId: `seed_prod_${idx + 1}` }],
      ratingAvg: parseFloat((Math.random() * 2 + 3).toFixed(1)), // 3.0–5.0
      ratingCount: Math.floor(Math.random() * 200) + 5,
    }))
  );
  const productIds = insertedProducts.map((p) => p._id as mongoose.Types.ObjectId);
  console.log(`📦 Seeded ${insertedProducts.length} products`);

  console.log(`📋 Orders: 0 (Fresh store setup)`);
  console.log(`⭐ Reviews: 0 (Fresh store setup)`);

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
