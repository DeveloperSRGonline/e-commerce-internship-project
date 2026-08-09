# Actionable Implementation Guide — E-Commerce Platform

> **Based on:** `Project-context.md` · `Architecture.md` · `Database-schema.md` · `Roadmap.md` · `Project-rules.md`
>
> **How to use this file:** Work strictly top-to-bottom. Never start a phase until every exit criterion of the previous phase is verified as true. Each step is intentionally atomic — one thing, done and confirmed, before the next.

---

## Cross-Phase Rules (Apply at Every Step)

These rules from `project-rules.md` are not phase-specific. Check them before committing any change:

- [ ] No Route Handler or Server Action ever writes a `price`, `total`, or `stock` taken from client input.
- [ ] No `Order` snapshot fields (`nameSnapshot`, `priceSnapshot`, `shippingAddressSnapshot`) are ever updated after creation.
- [ ] Every Mongoose model has a corresponding Zod schema in `lib/validations/`. Write them together, never separately.
- [ ] Every admin-only Route Handler independently checks `session.user.role === "admin"`, even if middleware already blocked the route.
- [ ] No hard delete of a `Product` referenced by any `Order`. Always soft-delete (`isActive: false`).
- [ ] No secret key appears in any client-bundled file or in version control.
- [ ] Every foreign-key reference field (`categoryId`, `userId`, `productId`) has an index.
- [ ] Order status transitions follow the state machine only (`pending → confirmed → shipped → delivered`, or `pending/confirmed → cancelled`).
- [ ] Currency values stored in whole **paise** (integer). Display as `₹` only in the UI layer.
- [ ] Dates stored as native `Date` (UTC). Format for IST display only at the presentation layer.
- [ ] Error responses always use `{ success: false, error: { code, message } }` — never expose raw Mongoose errors.
- [ ] Types inferred from Zod schemas via `z.infer<typeof schema>` — never duplicate type definitions.

---

## Phase 0 — Foundation & Environment

**Goal:** A running skeleton with zero business logic, but every external service connected and verified.

### 0.1 — Initialize the Next.js Project

- [x] **0.1.1** Run `npx create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"` inside the project root. Use `./` to initialize in the current directory.
- [x] **0.1.2** Verify the generated folder structure matches the layout defined in `architecture.md § 4` — specifically confirm that `app/`, `lib/`, `models/`, `components/`, `scripts/`, and `types/` directories are present (create any missing ones manually).
- [x] **0.1.3** Confirm the app starts cleanly: run `npm run dev`, open `http://localhost:3000`, and verify the default Next.js page loads with zero console errors.
- [x] **0.1.4** Delete the default boilerplate content from `app/page.tsx` and `app/globals.css` — replace with a minimal placeholder `<h1>E-Commerce App — Phase 0</h1>` so the shell is clean.

### 0.2 — Scaffold the Folder Structure

- [x] **0.2.1** Create `app/(customer)/` route group directory.
- [x] **0.2.2** Create `app/(admin)/admin/` directory.
- [x] **0.2.3** Create `app/(auth)/login/` and `app/(auth)/register/` directories.
- [x] **0.2.4** Create `app/api/` directory with sub-paths matching `architecture.md § 2` — specifically:
  - `app/api/auth/[...nextauth]/`
  - `app/api/products/`
  - `app/api/products/[slug]/`
  - `app/api/products/[id]/reviews/`
  - `app/api/categories/`
  - `app/api/cart/`
  - `app/api/cart/items/`
  - `app/api/cart/items/[productId]/`
  - `app/api/checkout/initiate/`
  - `app/api/checkout/confirm/`
  - `app/api/orders/`
  - `app/api/orders/[id]/`
  - `app/api/admin/products/`
  - `app/api/admin/products/[id]/`
  - `app/api/admin/categories/`
  - `app/api/admin/categories/[id]/`
  - `app/api/admin/upload/`
  - `app/api/admin/orders/`
  - `app/api/admin/orders/[id]/status/`
  - `app/api/admin/analytics/top-customers/`
  - `app/api/admin/analytics/top-products/`
  - `app/api/admin/analytics/revenue/`
  - `app/api/admin/analytics/low-stock/`
  - `app/api/admin/analytics/customer/[id]/orders/`
- [x] **0.2.5** Create `lib/db/`, `lib/validations/` directories.
- [x] **0.2.6** Create `models/` directory.
- [x] **0.2.7** Create `components/ui/`, `components/product/`, `components/cart/`, `components/checkout/`, `components/admin/` directories.
- [x] **0.2.8** Create `scripts/` directory.
- [x] **0.2.9** Create `types/index.ts` with an empty export — a placeholder so the import path resolves.

### 0.3 — Install Dependencies

- [x] **0.3.1** Install runtime dependencies: `npm install mongoose next-auth@beta @auth/mongodb-adapter zod cloudinary razorpay bcryptjs`.
- [x] **0.3.2** Install type definitions: `npm install -D @types/bcryptjs`.
- [x] **0.3.3** Confirm `package.json` reflects all installed packages. Check for any peer-dependency warnings in the install output and resolve them before continuing.

### 0.4 — Environment Variables

- [x] **0.4.1** Create `.env.local` in the project root. This file must **never** be committed.
- [x] **0.4.2** Add `.env.local` to `.gitignore` (verify it is already there from `create-next-app`, if not — add it explicitly).
- [x] **0.4.3** Add these variable stubs to `.env.local` (values filled in subsequent steps):
  ```
  MONGODB_URI=
  NEXTAUTH_URL=http://localhost:3000
  NEXTAUTH_SECRET=
  CLOUDINARY_CLOUD_NAME=
  CLOUDINARY_API_KEY=
  CLOUDINARY_API_SECRET=
  RAZORPAY_KEY_ID=
  RAZORPAY_KEY_SECRET=
  NEXT_PUBLIC_RAZORPAY_KEY_ID=
  ```
  > **Rule from `project-rules.md § 2.5`:** Only `NEXT_PUBLIC_*` variables are exposed to the browser. All secret keys (`CLOUDINARY_API_SECRET`, `RAZORPAY_KEY_SECRET`, `NEXTAUTH_SECRET`, `MONGODB_URI`) must remain server-only (no `NEXT_PUBLIC_` prefix).

### 0.5 — MongoDB Atlas Setup

- [x] **0.5.1** Create a free-tier MongoDB Atlas cluster (M0). Name it descriptively (e.g., `ecommerce-dev`).
- [x] **0.5.2** Create a database user with a strong password. Store the username and password — they will go into the connection string.
- [x] **0.5.3** Whitelist your current IP (or `0.0.0.0/0` for development convenience — restrict this before production).
- [x] **0.5.4** Copy the connection string from Atlas. It looks like: `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/<dbname>?retryWrites=true&w=majority`. Replace `<dbname>` with `ecommerce`. Paste as value of `MONGODB_URI` in `.env.local`.

### 0.6 — Mongoose Connection Singleton

- [x] **0.6.1** Create `lib/db/connect.ts`. Implement the **singleton pattern** — on cold start, open one Mongoose connection; on subsequent calls (Next.js hot-reload or repeated RSC renders), reuse the cached connection. The standard implementation:

  ```typescript
  // lib/db/connect.ts
  import mongoose from "mongoose";

  const MONGODB_URI = process.env.MONGODB_URI!;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  }

  declare global {
    var mongooseCache: MongooseCache;
  }

  const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
  global.mongooseCache = cached;

  export async function connectToDB(): Promise<typeof mongoose> {
    if (cached.conn) return cached.conn;
    if (!cached.promise) {
      cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
    }
    cached.conn = await cached.promise;
    return cached.conn;
  }
  ```

- [x] **0.6.2** Create a test Route Handler at `app/api/test-db/route.ts` that calls `connectToDB()`, writes a document to a temporary `test` collection, reads it back, deletes it, and returns `{ success: true, message: "MongoDB connection verified" }`.
- [x] **0.6.3** Run `npm run dev`, visit `http://localhost:3000/api/test-db`, verify the `success: true` response in the browser. Confirm in the Atlas UI that the connection shows under "Metrics".
- [x] **0.6.4** Delete `app/api/test-db/` — it was a verification-only artifact.

### 0.7 — Cloudinary Setup

- [x] **0.7.1** Create a Cloudinary account at `cloudinary.com`. Note the Cloud Name, API Key, and API Secret from the Dashboard.
- [x] **0.7.2** Fill in `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in `.env.local`.
- [x] **0.7.3** Create `lib/cloudinary.ts` — configure the Cloudinary SDK and export an `uploadImage` helper:

  ```typescript
  // lib/cloudinary.ts
  import { v2 as cloudinary } from "cloudinary";

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  export async function uploadImage(fileBuffer: Buffer, folder = "ecommerce-products") {
    return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "image" },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );
      stream.end(fileBuffer);
    });
  }

  export default cloudinary;
  ```

- [x] **0.7.4** Manually verify: use the Cloudinary web UI to upload one test image. Confirm the URL format is `https://res.cloudinary.com/<cloud_name>/image/upload/...`. This confirms the account is active and the SDK config will work.

### 0.8 — Razorpay Setup

- [x] **0.8.1** Create a Razorpay account. Navigate to the **Test Mode** API keys section (not Live). Copy the Key ID and Key Secret.
- [x] **0.8.2** Fill in `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID` (Key ID only — same value as `RAZORPAY_KEY_ID` but prefixed for browser access) in `.env.local`.
- [x] **0.8.3** Create `lib/razorpay.ts` — initialize the Razorpay client and export the signature verification utility:

  ```typescript
  // lib/razorpay.ts
  import Razorpay from "razorpay";
  import crypto from "crypto";

  export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  export function verifyRazorpaySignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): boolean {
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");
    return expectedSignature === razorpaySignature;
  }
  ```

- [x] **0.8.4** Verify the test key is retrievable: `console.log(process.env.RAZORPAY_KEY_ID)` in a temporary server component, confirm it prints the key ID (not `undefined`). Remove the log after verification.

### 0.9 — NEXTAUTH_SECRET

- [x] **0.9.1** Generate a strong random secret: run `openssl rand -base64 32` (or use `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`) in the terminal. Paste the output as value of `NEXTAUTH_SECRET` in `.env.local`.

### Phase 0 Exit Criteria Checklist

- [x] App boots with `npm run dev` and zero console errors.
- [x] `GET /api/test-db` returned `{ success: true }` proving MongoDB Atlas round-trip works.
- [x] A test image upload to Cloudinary completes and a CDN URL is retrievable.
- [x] `RAZORPAY_KEY_ID` is readable on the server side (not `undefined`).
- [x] `.env.local` is listed in `.gitignore` and not tracked by git (`git status` confirms it is untracked/ignored).

---

## Phase 1 — Schema & Seed Data

**Goal:** All six Mongoose models exist exactly per `database-schema.md`, all indexes applied, seed data populated with realistic Indian data.

### 1.1 — `User` Model

- [x] **1.1.1** Create `models/User.model.ts`. Define the Mongoose schema with all fields from `database-schema.md § 2.1`:
  - `name`: String, required.
  - `email`: String, required, unique, lowercase-normalized (use `lowercase: true` in Mongoose).
  - `passwordHash`: String, optional (null for OAuth users).
  - `role`: String enum `["customer", "admin"]`, default `"customer"`.
  - `addresses`: Array of embedded sub-schema with fields: `label`, `line1`, `line2` (optional), `city`, `state`, `pincode`, `isDefault`.
  - Enable Mongoose `timestamps: true` for `createdAt`/`updatedAt`.
- [x] **1.1.2** Apply indexes on `User`:
  - `{ email: 1 }` — unique.
  - `{ role: 1 }` — single.
- [x] **1.1.3** Export the model using the `mongoose.models.User || mongoose.model("User", userSchema)` guard pattern (prevents model re-registration on hot-reload in Next.js dev mode).

### 1.2 — `User` Zod Schema

- [x] **1.2.1** Create `lib/validations/user.schema.ts`. Define a Zod schema matching the User model fields. Export:
  - `registerSchema` — for the registration form payload (name, email, password — not passwordHash, that's server-side derived).
  - `loginSchema` — for the login form payload (email, password).
  - `addressSchema` — for the embedded address shape.
  - `UserType` — TypeScript type inferred via `z.infer<typeof userZodSchema>`.

### 1.3 — `Category` Model

- [x] **1.3.1** Create `models/Category.model.ts`. Fields from `database-schema.md § 2.2`:
  - `name`: String, required, unique.
  - `slug`: String, required, unique.
  - `description`: String, optional.
  - `timestamps: true`.
- [x] **1.3.2** Apply index: `{ slug: 1 }` — unique.

### 1.4 — `Category` Zod Schema

- [x] **1.4.1** Create `lib/validations/category.schema.ts` with a schema matching the Category model. Export `createCategorySchema`, `updateCategorySchema`, and the inferred `CategoryType`.

### 1.5 — `Product` Model

- [ ] **1.5.1** Create `models/Product.model.ts`. Fields from `database-schema.md § 2.3`:
  - `name`: String, required.
  - `slug`: String, required, unique.
  - `description`: String, required.
  - `price`: Number, required, min 0. **Stored in paise (integer).**
  - `stock`: Number, required, min 0.
  - `categoryId`: ObjectId, required, ref `"Category"`.
  - `images`: Array of `{ url: String, publicId: String }`.
  - `isActive`: Boolean, default `true`.
  - `ratingAvg`: Number, default 0.
  - `ratingCount`: Number, default 0.
  - `timestamps: true`.
- [ ] **1.5.2** Apply all indexes from `database-schema.md § 5`:
  - `{ slug: 1 }` — unique.
  - `{ categoryId: 1 }` — single.
  - `{ price: 1 }` — single.
  - `{ stock: 1 }` — single.
  - `{ name: "text", description: "text" }` — text index (for search).
  - `{ categoryId: 1, price: 1 }` — compound.

### 1.6 — `Product` Zod Schema

- [ ] **1.6.1** Create `lib/validations/product.schema.ts`. Export:
  - `createProductSchema` — all required fields for product creation.
  - `updateProductSchema` — all fields optional (for PATCH).
  - `ProductType` inferred type.

### 1.7 — `Order` Model

- [ ] **1.7.1** Create `models/Order.model.ts`. Fields from `database-schema.md § 2.4`:
  - `userId`: ObjectId, required, ref `"User"`.
  - `items`: Array of embedded `OrderItemSnapshot` sub-schema:
    - `productId`: ObjectId, ref `"Product"`.
    - `nameSnapshot`: String, required. *(Never updated after creation — enforce by having no PATCH route for it.)*
    - `priceSnapshot`: Number, required. *(Same — immutable.)*
    - `quantity`: Number, required, min 1.
    - `lineTotal`: Number, required.
  - `shippingAddressSnapshot`: Embedded address object (copy, not reference) with same fields as `user.addresses`.
  - `subtotal`: Number, required.
  - `tax`: Number, required.
  - `total`: Number, required.
  - `status`: String enum `["pending", "confirmed", "shipped", "delivered", "cancelled"]`, default `"pending"`.
  - `payment`: sub-object:
    - `razorpayOrderId`: String.
    - `razorpayPaymentId`: String.
    - `status`: String enum `["created", "paid", "failed", "refunded"]`, default `"created"`.
  - `timestamps: true`.
- [ ] **1.7.2** Apply all indexes:
  - `{ userId: 1, createdAt: -1 }` — compound.
  - `{ status: 1, createdAt: -1 }` — compound.
  - `{ "payment.razorpayOrderId": 1 }` — single.

### 1.8 — `Order` Zod Schema

- [ ] **1.8.1** Create `lib/validations/order.schema.ts`. Export:
  - `createOrderSchema` — for internal server-side order creation (not client-submitted — still validate the internal shape).
  - `updateOrderStatusSchema` — for the admin status-update PATCH; must include an enum of valid statuses so the state machine can be enforced in the handler.
  - `OrderType` inferred type.

### 1.9 — `Review` Model

- [ ] **1.9.1** Create `models/Review.model.ts`. Fields from `database-schema.md § 2.5`:
  - `productId`: ObjectId, required, ref `"Product"`.
  - `userId`: ObjectId, required, ref `"User"`.
  - `rating`: Number, required, min 1, max 5.
  - `comment`: String, optional.
  - `createdAt`: Date (use `timestamps: { createdAt: true, updatedAt: false }`).
- [ ] **1.9.2** Apply indexes:
  - `{ productId: 1, createdAt: -1 }` — compound.
  - `{ userId: 1, productId: 1 }` — compound + **unique** (prevents one user submitting two reviews for same product).

### 1.10 — `Review` Zod Schema

- [ ] **1.10.1** Create `lib/validations/review.schema.ts`. Export `createReviewSchema` (productId, rating, comment) and `ReviewType`.

### 1.11 — `Cart` Model

- [ ] **1.11.1** Create `models/Cart.model.ts`. Fields from `database-schema.md § 2.6`:
  - `userId`: ObjectId, required, ref `"User"`, **unique** (one cart per user).
  - `items`: Array of `{ productId: ObjectId ref "Product", quantity: Number min 1 }`. **No price stored here** — carts always re-fetch live price.
  - `updatedAt`: Date.
- [ ] **1.11.2** Apply index: `{ userId: 1 }` — unique.

### 1.12 — `Cart` Zod Schema

- [ ] **1.12.1** Create `lib/validations/cart.schema.ts`. Export:
  - `addToCartSchema` — `{ productId: string, quantity: number }`.
  - `updateCartItemSchema` — `{ quantity: number }`.
  - `CartType` inferred type.

### 1.13 — Verify All Models

- [ ] **1.13.1** In a temporary test Route Handler, import all six models and call `connectToDB()`. Confirm zero TypeScript compilation errors: `npx tsc --noEmit`.
- [ ] **1.13.2** Confirm all 6 model files exist: `User.model.ts`, `Category.model.ts`, `Product.model.ts`, `Order.model.ts`, `Review.model.ts`, `Cart.model.ts`.
- [ ] **1.13.3** Confirm all 6 Zod schema files exist: `user.schema.ts`, `category.schema.ts`, `product.schema.ts`, `order.schema.ts`, `review.schema.ts`, `cart.schema.ts`.

### 1.14 — Seed Script

- [ ] **1.14.1** Create `scripts/seed.ts`. Install `ts-node` and `dotenv` as dev dependencies: `npm install -D ts-node dotenv`.
- [ ] **1.14.2** At the top of `seed.ts`, load environment variables with `dotenv/config`, then call `connectToDB()`.
- [ ] **1.14.3** Implement **idempotency guard**: before inserting, call `deleteMany({})` on all collections in reverse dependency order (Reviews → Orders → Carts → Products → Categories → Users). This makes the script safe to re-run against a clean DB.
- [ ] **1.14.4** **Step 1 — Seed Users (10 records):**
  - Use Indian names: e.g., Aditya Sharma, Priya Patel, Rohan Iyer, Sneha Reddy, Vikram Singh, Ananya Nair, Rahul Gupta, Kavya Menon, Arjun Joshi, Meera Desai.
  - One user must have `role: "admin"`, all others `role: "customer"`.
  - Hash a placeholder password for each using `bcryptjs.hash("Password123!", 10)` for `passwordHash`.
  - Embed 1–2 realistic Indian addresses per user with real city/state/pincode combinations (Mumbai 400001, Pune 411001, Bengaluru 560001, Ahmedabad 380001, Nagpur 440001, Jaipur 302001, etc.).
  - Store the inserted `_id`s in a `userIds` array for use in later steps.
- [ ] **1.14.5** **Step 2 — Seed Categories (6 records):**
  - Create categories: Electronics, Fashion, Home & Kitchen, Books, Groceries, Personal Care.
  - Generate `slug` from `name` (lowercase, spaces → hyphens). E.g., `"Home & Kitchen"` → `"home-kitchen"`.
  - Store inserted `_id`s in a `categoryIds` map (name → id) for reference in product seeding.
- [ ] **1.14.6** **Step 3 — Seed Products (20 records):**
  - Assign each product to a `categoryId` from step 2.
  - All prices in **paise** (e.g., ₹299 = `29900`, ₹4999 = `499900`). Stay in the ₹299–₹4,999 range.
  - Content must be vegetarian-appropriate (no meat/non-veg examples).
  - Generate unique `slug` for each product (product name → kebab-case).
  - Set `stock` between 10 and 200 — intentionally set **at least 2 products with stock < 5** (e.g., `stock: 2`, `stock: 3`) so the low-stock analytics query returns real results.
  - `isActive: true` for all except one product (set one to `isActive: false` to test soft-delete handling in analytics).
  - Store inserted `_id`s in a `productIds` array.
- [ ] **1.14.7** **Step 4 — Seed Orders (30 records):**
  - Each order references a real `userId` from step 1 and real `productId`s from step 3.
  - Critically: set `createdAt` to a **historically spread** date across the past 12 months. Use a helper like:
    ```typescript
    function randomPastDate(monthsBack: number): Date {
      const d = new Date();
      d.setMonth(d.getMonth() - Math.floor(Math.random() * monthsBack));
      d.setDate(Math.floor(Math.random() * 28) + 1);
      return d;
    }
    ```
    Distribute across all 12 months so the revenue-by-month chart is non-flat.
  - Populate `items[]` with `nameSnapshot` and `priceSnapshot` copied from the product at seed time (simulating what `checkout/confirm` does at runtime).
  - Compute `lineTotal = priceSnapshot * quantity` (all in paise).
  - Compute `subtotal` as sum of `lineTotal`s, `tax` as 18% of subtotal (GST), `total` as `subtotal + tax`. All in paise.
  - Use a realistic status distribution: ~12 `delivered`, ~6 `shipped`, ~5 `confirmed`, ~4 `pending`, ~3 `cancelled`.
  - For delivered orders, set `payment.status: "paid"`. For cancelled, set `payment.status: "failed"`.
  - Generate a fake `payment.razorpayOrderId` string for each (e.g., `order_seed_${i}`).
- [ ] **1.14.8** Add a `package.json` script: `"seed": "ts-node -r dotenv/config scripts/seed.ts"` and run it: `npm run seed`.
- [ ] **1.14.9** Verify seed success in Atlas: count documents in each collection. Confirm: 10 users, 6 categories, 20 products, 30 orders.

### 1.15 — Verify Indexes

- [ ] **1.15.1** Connect to Atlas using MongoDB Compass or the Atlas UI. For the `products` collection, run `db.products.getIndexes()`. Confirm all 6 planned indexes appear (slug unique, categoryId, price, stock, text, compound categoryId+price).
- [ ] **1.15.2** For the `orders` collection, confirm 3 indexes: `{ userId, createdAt }`, `{ status, createdAt }`, `{ payment.razorpayOrderId }`.
- [ ] **1.15.3** For `reviews`, confirm 2 indexes: `{ productId, createdAt }` and `{ userId, productId }` unique.
- [ ] **1.15.4** For `carts`, confirm `{ userId: 1 }` unique index.

### Phase 1 Exit Criteria Checklist

- [ ] Seed script runs idempotently (run it twice — second run produces same document counts without duplicate errors).
- [ ] `db.products.getIndexes()` and equivalent checks confirm every planned index exists.
- [ ] Spot-check one seeded order in Atlas: confirm `items[].nameSnapshot` and `items[].priceSnapshot` are populated and match the product's name/price at seed time.
- [ ] All 6 models and all 6 Zod schemas exist and compile without TypeScript errors (`npx tsc --noEmit` passes).

---

## Phase 2 — Auth & RBAC

**Goal:** Login/logout works for both roles, and route protection is enforced exactly per `project-context.md § 7`.

### 2.1 — Configure Auth.js

- [ ] **2.1.1** Create `lib/auth.ts`. Configure Auth.js (NextAuth v5 beta) with:
  - **Credentials provider** — accepts `email` and `password`, looks up the user by email using the `User` model, compares `passwordHash` using `bcryptjs.compare()`. Returns the user object on success, `null` on failure.
  - **Session strategy: `database`** — sessions stored in MongoDB via the MongoDB adapter. Per `project-context.md § 7.2`: database sessions allow server-side invalidation.
  - **MongoDB adapter** — use `@auth/mongodb-adapter` connected to the same Atlas cluster.
  - **Callbacks:**
    - `jwt` callback: add `userId` and `role` from the database user into the token.
    - `session` callback: expose `session.user.userId` and `session.user.role` so they are available server-side.
  - Only `userId` and `role` go into the session — no address, no payment data.
- [ ] **2.1.2** Create `app/api/auth/[...nextauth]/route.ts`. Export the `handlers` from `lib/auth.ts` as GET and POST.
- [ ] **2.1.3** Extend the NextAuth TypeScript types to include `userId` and `role` on the session user. Create or update `types/index.ts`:
  ```typescript
  declare module "next-auth" {
    interface Session {
      user: {
        userId: string;
        role: "customer" | "admin";
        name?: string | null;
        email?: string | null;
      };
    }
  }
  ```

### 2.2 — Middleware (Route Protection)

- [ ] **2.2.1** Create `middleware.ts` at the project root (not inside `app/`). This is the Auth gate described in `project-context.md § 7.3`.
- [ ] **2.2.2** Implement the full route protection matrix:

  | Route Pattern | Rule |
  |---|---|
  | `/`, `/products/*`, `/categories/*` | Public — no gate |
  | `/cart`, `/checkout`, `/orders/*` | Require authenticated session — redirect to `/login` if missing |
  | `/admin/*` | Require `session.user.role === "admin"` — return 403 if role mismatch |
  | `/api/cart/*`, `/api/checkout/*`, `/api/orders/*` | Require authenticated session |
  | `/api/admin/*` | Require authenticated session (role checked again inside handlers) |

- [ ] **2.2.3** Set the `config.matcher` array to include all protected path prefixes. **Do not** use a broad `"/((?!_next|favicon).*)"` matcher — be explicit to avoid accidentally gating static files.

### 2.3 — Admin Route Handler Defense-in-Depth

- [ ] **2.3.1** Create a reusable server-side auth guard utility in `lib/auth.ts` or `lib/auth-helpers.ts`:
  ```typescript
  export async function requireAdmin(request: Request) {
    const session = await auth(); // Auth.js server-side session getter
    if (!session || session.user.role !== "admin") {
      return Response.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Admin access required" } },
        { status: 403 }
      );
    }
    return null; // null = authorized, proceed
  }
  ```
- [ ] **2.3.2** Plan to call this utility at the top of every admin Route Handler before any database operation. This is the second defense layer beyond middleware.

### 2.4 — Register Page

- [ ] **2.4.1** Create `app/(auth)/register/page.tsx`. Build a server-rendered form with fields: `name`, `email`, `password`, `confirmPassword`.
- [ ] **2.4.2** Create a Server Action (or Route Handler) for registration:
  - Validate the input through `registerSchema` from `lib/validations/user.schema.ts` first.
  - Check if email already exists in the `users` collection. Return a user-friendly error if so.
  - Hash the password: `const passwordHash = await bcrypt.hash(password, 10)`.
  - Create the user with `role: "customer"` (never trust a client-submitted role).
  - Redirect to `/login` on success.
- [ ] **2.4.3** Ensure the plaintext password is never logged, even in dev.

### 2.5 — Login Page

- [ ] **2.5.1** Create `app/(auth)/login/page.tsx`. Build a form with `email` and `password` fields.
- [ ] **2.5.2** On submit, call Auth.js `signIn("credentials", { email, password, redirect: false })`. Handle the response: on `error`, display a user-friendly message ("Invalid email or password" — never indicate which field is wrong, to prevent user enumeration). On success, redirect to `/`.
- [ ] **2.5.3** Create a visible "Logout" button/link (in the nav or header) that calls Auth.js `signOut()`.

### 2.6 — Session Access Helpers

- [ ] **2.6.1** Confirm that RSC pages and Route Handlers can call `auth()` from `lib/auth.ts` (Auth.js v5 server-side session helper) to get the current session.
- [ ] **2.6.2** Confirm that client components can use the `useSession()` hook from `next-auth/react` (wrapped in a `SessionProvider` in `app/layout.tsx`). Add `SessionProvider` to the root layout.

### Phase 2 Exit Criteria Checklist

- [ ] A customer account navigating to `/admin` is redirected (302) or shown a 403 page. Verify via browser navigation AND via `curl -H "Cookie: ..." http://localhost:3000/admin` showing the gate works at the HTTP level.
- [ ] A customer calling `POST /api/admin/products` directly receives `{ success: false, error: { code: "UNAUTHORIZED" } }` — not a 200.
- [ ] An admin account can access `/admin` and all customer areas without being blocked.
- [ ] Session data (`userId`, `role`) survives a hard page refresh (F5) without the user being logged out.
- [ ] Registering a new account with an already-used email returns a clear error.

---

## Phase 3 — Catalog (Browse, Search, Filter)

**Goal:** Public-facing product discovery fully functional, built on RSC data fetching with MongoDB index-backed queries.

### 3.1 — Products List Route Handler

- [ ] **3.1.1** Create `app/api/products/route.ts` (GET). Implement query parameter handling:
  - `?page` (default 1) and `?limit` (default 12) for pagination.
  - `?category` — filter by category slug (first resolve slug → `_id`, then filter by `categoryId`).
  - `?minPrice` and `?maxPrice` — price range filter (values from client treated as paise integers).
  - `?sort` — accepts `"price_asc"`, `"price_desc"`, `"newest"`.
  - `?q` — text search using `{ $text: { $search: q } }` against the `products` text index.
- [ ] **3.1.2** Always filter by `isActive: true` — soft-deleted products never appear in the public catalog.
- [ ] **3.1.3** Use Mongoose `.populate("categoryId", "name slug")` to include category name in the response without an extra query.
- [ ] **3.1.4** Return the consistent API envelope: `{ success: true, data: { products: [...], total, page, totalPages } }`.
- [ ] **3.1.5** Validate all query params through Zod before building the MongoDB query. Reject invalid `sort` values, non-numeric price inputs, etc.

### 3.2 — Single Product Route Handler

- [ ] **3.2.1** Create `app/api/products/[slug]/route.ts` (GET).
- [ ] **3.2.2** Look up by `slug`, filter `isActive: true`. Return `404` with the error envelope if not found.
- [ ] **3.2.3** Populate `categoryId` to return category name/slug.
- [ ] **3.2.4** Include `ratingAvg` and `ratingCount` from the product document (no need to query reviews for catalog display — this is the payoff of denormalization per `project-rules.md § 3`).

### 3.3 — Categories Route Handler

- [ ] **3.3.1** Create `app/api/categories/route.ts` (GET). Return all categories sorted alphabetically. Simple — no pagination needed (bounded collection).

### 3.4 — Reviews Route Handler (Read)

- [ ] **3.4.1** Create `app/api/products/[id]/reviews/route.ts` (GET). Return paginated reviews for a product, sorted newest first, using the `{ productId: 1, createdAt: -1 }` index.
- [ ] **3.4.2** Populate `userId` to return reviewer name (not email).

### 3.5 — Catalog Listing Page (RSC)

- [ ] **3.5.1** Create `app/(customer)/products/page.tsx` as a **React Server Component**. Fetch product data directly from the `Product` model (not via `/api/products`) — RSC fetches on the server with no exposed API call.
- [ ] **3.5.2** Read `searchParams` from the page props (Next.js App Router passes query params as `searchParams` to page components). Pass to the data-fetching function.
- [ ] **3.5.3** Build and render:
  - **Filter sidebar** (or top bar): category dropdown, price range inputs, sort selector.
  - **Product grid**: card per product showing image (Cloudinary URL), name, price (formatted as `₹`, dividing paise by 100), category, and star rating.
  - **Pagination controls** — "Previous" / "Next" links using `?page=` query param.
- [ ] **3.5.4** Wrap filter controls in a Client Component (e.g., `components/product/FilterBar.tsx`) since they require `onChange` interactivity. The page shell itself stays an RSC.
- [ ] **3.5.5** Implement text search: a search bar that updates `?q=` in the URL. On submission, the RSC re-renders with the new query.

### 3.6 — Product Detail Page (RSC)

- [ ] **3.6.1** Create `app/(customer)/products/[slug]/page.tsx` as an RSC. Fetch the full product document by slug.
- [ ] **3.6.2** Render:
  - Product image gallery (images from Cloudinary URLs).
  - Name, description, price (formatted INR).
  - Stock status: "In Stock" if `stock > 0`, "Out of Stock" otherwise.
  - Category name (linked to category page).
  - Star rating display using `ratingAvg` and `ratingCount`.
  - Reviews list (fetched separately — second query to `Review` collection).
  - "Add to Cart" button (Client Component — requires `onClick`).
- [ ] **3.6.3** Return a 404 page (`notFound()` from `next/navigation`) if product not found or `isActive: false`.

### 3.7 — Category Listing Page (RSC)

- [ ] **3.7.1** Create `app/(customer)/categories/[slug]/page.tsx`. Fetch the category by slug, then fetch products in that category. Reuse the product grid component.
- [ ] **3.7.2** Return 404 if the category slug doesn't exist.

### Phase 3 Exit Criteria Checklist

- [ ] Searching a seeded product name (e.g., "Basmati") returns that product on the catalog page.
- [ ] Filtering by a category and price range produces correct results. Verify with MongoDB Compass that the query uses the `{ categoryId: 1, price: 1 }` index via `explain()` — look for `IXSCAN`, not `COLLSCAN`.
- [ ] The text search query uses the text index — confirm via `explain()`.
- [ ] A soft-deleted product (`isActive: false`) does not appear in any catalog or search result.
- [ ] Product detail page renders correctly for a seeded product including image URL, price in INR, and rating.

---

## Phase 4 — Cart & Checkout

**Goal:** The full checkout sequence from `architecture.md § 3.2` works end-to-end against Razorpay test mode, with server-authoritative pricing at every step.

### 4.1 — Get Cart Route Handler

- [ ] **4.1.1** Create `app/api/cart/route.ts` (GET). Require authentication (call `auth()`, return 401 if no session).
- [ ] **4.1.2** Find or create the user's cart by `userId`. If no cart exists, return an empty cart object.
- [ ] **4.1.3** **Live re-price on every cart read** (per `database-schema.md § 2.6` and `project-rules.md § 3`): for each item in `cart.items`, fetch the corresponding `Product` document and return `{ productId, name, price, stock, quantity, lineTotal }` where `price` is the live product price — never stored on the cart. This means one `Product.find({ _id: { $in: productIds } })` query per cart read.
- [ ] **4.1.4** If a product in the cart is now `isActive: false` or deleted, mark it as unavailable in the response (don't silently include stale data).

### 4.2 — Add Item to Cart

- [ ] **4.2.1** Create `app/api/cart/items/route.ts` (POST). Validate body with `addToCartSchema` (productId, quantity).
- [ ] **4.2.2** Verify the product exists and `isActive: true`. Return 404 if not.
- [ ] **4.2.3** Check that `quantity` doesn't exceed `product.stock`. Return 400 with a clear message if it does.
- [ ] **4.2.4** Upsert the cart item: if `productId` already exists in `cart.items`, update quantity; otherwise, push a new item.
- [ ] **4.2.5** **Never store price in the cart document.** Only `productId` and `quantity` are persisted.

### 4.3 — Update Cart Item Quantity

- [ ] **4.3.1** Create `app/api/cart/items/[productId]/route.ts` (PATCH). Validate body with `updateCartItemSchema`.
- [ ] **4.3.2** Re-fetch live stock before allowing the update. If requested quantity > stock, return 400.
- [ ] **4.3.3** Update the `quantity` for the matching `productId` in `cart.items`.

### 4.4 — Remove Cart Item

- [ ] **4.4.1** Add DELETE handler to `app/api/cart/items/[productId]/route.ts`. Pull the item with the matching `productId` from `cart.items` using `$pull`.

### 4.5 — Cart UI Page

- [ ] **4.5.1** Create `app/(customer)/cart/page.tsx`. This is a protected route (middleware already gates it).
- [ ] **4.5.2** Display the live-priced cart returned by `GET /api/cart`: product image, name, live unit price, quantity selector, line total, and a cart total.
- [ ] **4.5.3** Quantity update and remove operations are client-side interactions using the PATCH and DELETE handlers.
- [ ] **4.5.4** Display a clear "Out of Stock" or "Unavailable" label for any cart item that is no longer valid (using the `isActive` flag from the live-priced cart response).
- [ ] **4.5.5** "Proceed to Checkout" button navigates to `/checkout`.

### 4.6 — Checkout Initiate Route Handler

- [ ] **4.6.1** Create `app/api/checkout/initiate/route.ts` (POST). This implements the first half of the sequence from `architecture.md § 3.2`.
- [ ] **4.6.2** Require authentication. Get `userId` from `session.user.userId`.
- [ ] **4.6.3** Fetch the user's `Cart` document (no body input needed — cart is identified by session).
- [ ] **4.6.4** For each item in the cart, fetch the live `Product` document by `productId`. Build the server-side `lineItems` array with **current** `product.price`, **never** any client-submitted price.
- [ ] **4.6.5** Validate: each product must exist, `isActive: true`, and `product.stock >= item.quantity`. On any failure, return 400 with the specific product name and reason.
- [ ] **4.6.6** Compute `subtotal`, `tax` (18% GST), `total` entirely on the server. All in paise.
- [ ] **4.6.7** Create a Razorpay test order: `razorpay.orders.create({ amount: total, currency: "INR", receipt: <unique_id> })`. The `amount` here is the server-computed total. Store the returned `razorpayOrderId`.
- [ ] **4.6.8** Persist a "pending checkout intent" document (or extend `Order` with a `checkoutIntent` sub-document) linking `razorpayOrderId` to the server-computed `total` and the draft `lineItems` snapshot. This is needed so `confirm` can verify the amount without trusting the client.
- [ ] **4.6.9** Return to the client: `{ razorpayOrderId, amount, key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID }`. The client uses these to open the Razorpay checkout widget.

### 4.7 — Checkout Confirm Route Handler

- [ ] **4.7.1** Create `app/api/checkout/confirm/route.ts` (POST). This implements the second half of `architecture.md § 3.2`.
- [ ] **4.7.2** Accept body: `{ razorpayOrderId, razorpayPaymentId, razorpaySignature }`. Validate with Zod.
- [ ] **4.7.3** **Signature verification (Step 1 — Payment legitimacy):** call `verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)` from `lib/razorpay.ts`. If invalid, return 400 immediately — do not create any order.
- [ ] **4.7.4** **Re-fetch stock (Step 2 — Race condition guard):** fetch all products in the cart again. Re-check that each `product.stock >= requestedQuantity`. This re-validation happens here because another buyer may have purchased the last units between `initiate` (which happened minutes ago) and `confirm`.
- [ ] **4.7.5** If stock is now insufficient: flag the payment for refund in Razorpay test mode (log this for demo), return 409 Conflict with a clear message. Do **not** create the order.
- [ ] **4.7.6** **Atomic order creation (Step 3 — The transaction):** Open a Mongoose session (`mongoose.startSession()`) and run a transaction containing:
  1. Create the `Order` document with all snapshot fields: `nameSnapshot`, `priceSnapshot`, `lineTotal` (all server-computed), `shippingAddressSnapshot` (copy of the user's selected address from the database — not from client), `subtotal`, `tax`, `total`, `status: "pending"`, `payment.razorpayOrderId`, `payment.razorpayPaymentId`, `payment.status: "paid"`.
  2. Decrement `Product.stock` by `quantity` for each purchased item using `{ $inc: { stock: -quantity } }` with a guard `{ stock: { $gte: quantity } }`. If any decrement fails (race condition), abort the entire transaction.
  3. Clear the user's `Cart.items` array (`Cart.updateOne({ userId }, { $set: { items: [] } })`).
- [ ] **4.7.7** On transaction commit, return 201 with `{ success: true, data: { orderId: order._id } }`.
- [ ] **4.7.8** On any transaction failure, return 500 with the error envelope. Never partially commit.

### 4.8 — Checkout Page (UI)

- [ ] **4.8.1** Create `app/(customer)/checkout/page.tsx`.
- [ ] **4.8.2** Show order summary (live-priced cart data fetched server-side).
- [ ] **4.8.3** Show address selection: let the user pick from their saved `user.addresses`. This is the address that will be used to populate `shippingAddressSnapshot` — the server copies it from the DB, not from client input.
- [ ] **4.8.4** "Pay Now" button: calls `POST /api/checkout/initiate`, receives `{ razorpayOrderId, amount, key }`, then opens the Razorpay checkout widget (`window.Razorpay`). On widget success, calls `POST /api/checkout/confirm` with the payment IDs.
- [ ] **4.8.5** Load the Razorpay checkout script (`<Script src="https://checkout.razorpay.com/v1/checkout.js" />`) in this page or globally.

### 4.9 — Order History Pages

- [ ] **4.9.1** Create `app/api/orders/route.ts` (GET). Return the current user's orders sorted newest first using the `{ userId: 1, createdAt: -1 }` index. Paginated.
- [ ] **4.9.2** Create `app/api/orders/[id]/route.ts` (GET). Return a single order — verify `order.userId === session.user.userId` before returning (ownership check). Return 403 if not the owner.
- [ ] **4.9.3** Create `app/(customer)/orders/page.tsx` — order history listing: order ID (truncated), date, total (formatted INR), status badge.
- [ ] **4.9.4** Create `app/(customer)/orders/[id]/page.tsx` — order detail. Display snapshot data: `items[].nameSnapshot`, `items[].priceSnapshot`, `items[].quantity`, `items[].lineTotal`. Display `shippingAddressSnapshot`. Display `subtotal`, `tax`, `total`. Display payment status. **This data must come from the snapshot fields, never from a live product lookup** — this is the snapshot pattern proving its value.

### Phase 4 Exit Criteria Checklist

- [ ] **Tamper test:** using browser DevTools, intercept the `POST /api/checkout/initiate` call and attempt to modify the response `amount`. Verify the server-computed total is what gets charged and stored — client manipulation has no effect.
- [ ] **Race condition test:** open two browser windows with the same low-stock product (stock = 1) in the cart. Simultaneously click "Pay Now" in both. Verify exactly one order is created and the other receives a 409. Check the DB: `product.stock` should be 0, not -1.
- [ ] **Snapshot integrity test:** complete a purchase, then edit the product's name and price via admin. View the order in `/orders/[id]` — confirm it still shows the original name and price, not the updated ones.
- [ ] Order history page shows all orders for the logged-in user.
- [ ] Visiting another user's order URL (`/orders/[other_user_order_id]`) returns 403.

---

## Phase 5 — Admin Console

**Goal:** Admins can fully manage the catalog and order lifecycle without touching the database directly.

### 5.1 — Admin Auth Guard (Applied to Every Handler Below)

- [ ] **5.1.1** Every admin Route Handler in this phase must call `requireAdmin(request)` (defined in Phase 2.3) at the very top before touching any database model. This is the handler-level defense-in-depth per `project-rules.md § 4` invariant #4.

### 5.2 — Product CRUD Route Handlers

- [ ] **5.2.1** Create `app/api/admin/products/route.ts` (POST — Create Product):
  - Validate body with `createProductSchema` from `lib/validations/product.schema.ts`.
  - Auto-generate `slug` from `name` (kebab-case) — server-side, not from client.
  - Verify `categoryId` exists in the `categories` collection before creating. Return 400 if not.
  - Require `requireAdmin` guard.
  - Return 201 with the new product.
- [ ] **5.2.2** Create `app/api/admin/products/[id]/route.ts` (PATCH — Update Product):
  - Validate body with `updateProductSchema`.
  - If `name` is updated, regenerate `slug`.
  - If `categoryId` is updated, verify the new category exists.
  - Require `requireAdmin` guard.
- [ ] **5.2.3** Add DELETE handler to `app/api/admin/products/[id]/route.ts`:
  - **Never hard-delete** if any `Order` contains `items[].productId` referencing this product (per `project-rules.md § 2.7`). Check with: `Order.findOne({ "items.productId": id })`.
  - If referenced by any order: set `isActive: false` (soft-delete). Return a 200 with a message explaining the product was deactivated, not deleted.
  - If no order references exist: proceed with hard delete.
  - Require `requireAdmin` guard.

### 5.3 — Image Upload Route Handler

- [ ] **5.3.1** Create `app/api/admin/upload/route.ts` (POST).
- [ ] **5.3.2** Parse the `multipart/form-data` body to extract the file. Use the native Request `formData()` API.
- [ ] **5.3.3** Validate: file must be an image type (`image/jpeg`, `image/png`, `image/webp`, `image/gif`). Reject with 400 if not. Enforce a max file size (e.g., 5MB). Per `project-rules.md § 2.9`.
- [ ] **5.3.4** Convert the file to a Buffer and pass to `uploadImage()` from `lib/cloudinary.ts`.
- [ ] **5.3.5** Return `{ success: true, data: { url, publicId } }`. The admin UI attaches this URL/publicId to the product form before submitting to the product create/update handler.
- [ ] **5.3.6** Require `requireAdmin` guard.

### 5.4 — Category CRUD Route Handlers

- [ ] **5.4.1** Create `app/api/admin/categories/route.ts` (POST — Create Category):
  - Validate with `createCategorySchema`.
  - Auto-generate `slug` from `name` server-side.
  - Check for name uniqueness (Mongoose will also enforce it, but provide a user-friendly error before letting Mongoose throw).
- [ ] **5.4.2** Create `app/api/admin/categories/[id]/route.ts` (PATCH — Update Category):
  - Validate with `updateCategorySchema`.
  - If `name` is updated, regenerate `slug`.
- [ ] **5.4.3** Add DELETE handler for categories:
  - **Referential integrity guard (per `project-rules.md § 2.7`):** before deleting, check if any product references this `categoryId`: `Product.findOne({ categoryId: id, isActive: true })`. If any active product is found, return 400 with a clear error: "Cannot delete category: X active products are assigned to it. Reassign or delete the products first."
  - Only delete if no products reference it.

### 5.5 — Order Management Route Handlers

- [ ] **5.5.1** Create `app/api/admin/orders/route.ts` (GET — List All Orders):
  - Filter by `?status` query param.
  - Filter by `?fromDate` / `?toDate` query params.
  - Sort by `createdAt: -1`.
  - Paginate.
  - Use the `{ status: 1, createdAt: -1 }` compound index.
  - Populate `userId` to return customer name/email.
- [ ] **5.5.2** Create `app/api/admin/orders/[id]/status/route.ts` (PATCH — Update Order Status):
  - Validate the new status through `updateOrderStatusSchema`.
  - **Enforce the state machine** (`architecture.md § 3.4`): define a valid-transitions map:
    ```typescript
    const validTransitions: Record<string, string[]> = {
      pending:   ["confirmed", "cancelled"],
      confirmed: ["shipped",   "cancelled"],
      shipped:   ["delivered"],
      delivered: [],
      cancelled: [],
    };
    ```
  - Fetch the current order to get `currentStatus`. If `newStatus` is not in `validTransitions[currentStatus]`, return 400 with: `"Invalid transition: ${currentStatus} → ${newStatus}"`.
  - Update `order.status` and return 200.
  - Require `requireAdmin` guard.

### 5.6 — Admin UI Pages

- [ ] **5.6.1** Create `app/(admin)/admin/page.tsx` — placeholder for the analytics dashboard (built in Phase 6). For now, render a "Admin Dashboard — Analytics coming in Phase 6" message.
- [ ] **5.6.2** Create `app/(admin)/admin/products/page.tsx`:
  - Fetch all products (including inactive ones) from the `Product` model.
  - Render a data table: name, price (INR), stock, category, active status, created date.
  - "Create Product" button opens a form/modal.
  - "Edit" button per row opens a pre-filled form.
  - "Delete / Deactivate" button per row (calls the DELETE handler; UI reflects soft-delete vs hard-delete based on the response message).
  - Image upload: a file input that first calls `POST /api/admin/upload`, gets back `{ url, publicId }`, then includes those in the product create/update form.
- [ ] **5.6.3** Create `app/(admin)/admin/categories/page.tsx`:
  - Fetch all categories.
  - Render table: name, slug, description.
  - Create/Edit forms.
  - Delete button — on 400 response (products exist), display the error message from the API.
- [ ] **5.6.4** Create `app/(admin)/admin/orders/page.tsx`:
  - Fetch all orders with status filter dropdown.
  - Render table: order ID, customer name, total (INR), status badge, created date.
  - Per row: a "Update Status" dropdown that shows only the valid next states (client-side convenience; server still validates).

### Phase 5 Exit Criteria Checklist

- [ ] A product created via the admin UI is immediately visible in the public catalog at `/products`.
- [ ] Attempting to update an order status with an invalid transition (e.g., `delivered → pending`) is rejected with a 400 from the server — not just hidden in the UI.
- [ ] Attempting to delete a category that has active products returns a 400 with a clear message. The category is not deleted.
- [ ] Uploading a non-image file to `POST /api/admin/upload` returns a 400 (not a Cloudinary error).
- [ ] Directly calling `POST /api/admin/products` with a valid body but a customer session returns 403.

---

## Phase 6 — Analytics Dashboard

**Goal:** All five aggregation queries implemented and rendered as admin-only dashboard widgets.

### 6.1 — Top 5 Highest-Spending Customers

- [ ] **6.1.1** Create `app/api/admin/analytics/top-customers/route.ts` (GET).
- [ ] **6.1.2** Implement the aggregation from `database-schema.md § 7.1` exactly:
  - `$match { status: { $ne: "cancelled" } }` first (before `$group`) to exclude cancelled orders from spend calculations.
  - `$group` by `userId`, `$sum` the `total` field, count orders.
  - `$sort` by `totalSpent` descending.
  - `$limit 5`.
  - `$lookup` into `users` to get name and email.
  - `$unwind` the looked-up user.
  - `$project` to shape the output.
- [ ] **6.1.3** Return the result. Require `requireAdmin` guard.

### 6.2 — Top 10 Best-Selling Products

- [ ] **6.2.1** Create `app/api/admin/analytics/top-products/route.ts` (GET).
- [ ] **6.2.2** Implement the aggregation from `database-schema.md § 7.2`:
  - `$match { status: { $ne: "cancelled" } }`.
  - `$unwind "$items"` — required because quantity is per line item, not per order.
  - `$group` by `items.productId`, `$sum` quantity and lineTotal.
  - `$sort`, `$limit 10`.
  - `$lookup` into `products` using `preserveNullAndEmptyArrays: true` on the unwind.
  - `$project` with `$ifNull: ["$product.name", "Discontinued Product"]` — the fallback for deleted/deactivated products.
- [ ] **6.2.3** Require `requireAdmin` guard.

### 6.3 — 12-Month Revenue Breakdown

- [ ] **6.3.1** Create `app/api/admin/analytics/revenue/route.ts` (GET).
- [ ] **6.3.2** Implement the aggregation from `database-schema.md § 7.3`:
  - Compute `twelveMonthsAgo = new Date(); twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1)`.
  - `$match { status: { $ne: "cancelled" }, createdAt: { $gte: twelveMonthsAgo } }`.
  - `$group` by `{ year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }`, `$sum` total, count orders.
  - `$sort { "_id.year": 1, "_id.month": 1 }`.
  - `$project` to flatten year/month to top-level.
- [ ] **6.3.3** Require `requireAdmin` guard.

### 6.4 — Low-Stock Alert

- [ ] **6.4.1** Create `app/api/admin/analytics/low-stock/route.ts` (GET).
- [ ] **6.4.2** Implement the aggregation from `database-schema.md § 7.4`:
  - `$match { isActive: true, stock: { $lt: 5 } }`.
  - `$sort { stock: 1 }`.
  - `$project` name, stock, categoryId.
  - Uses the `{ stock: 1 }` index.
- [ ] **6.4.3** Require `requireAdmin` guard.

### 6.5 — Customer Order History Lookup

- [ ] **6.5.1** Create `app/api/admin/analytics/customer/[id]/orders/route.ts` (GET).
- [ ] **6.5.2** Implement the aggregation from `database-schema.md § 7.5`:
  - `$match { userId: new mongoose.Types.ObjectId(id) }`.
  - `$sort { createdAt: -1 }`.
  - `$project` order status, total, createdAt, itemCount (`{ $size: "$items" }`), full items array.
  - No `$lookup` needed — snapshot data is self-contained.
  - Uses the `{ userId: 1, createdAt: -1 }` compound index.
- [ ] **6.5.3** Require `requireAdmin` guard.

### 6.6 — Analytics Dashboard UI

- [ ] **6.6.1** Update `app/(admin)/admin/page.tsx` to become the full analytics dashboard. Fetch all five analytics endpoints from the server side (RSC) or via client-side `useEffect`.
- [ ] **6.6.2** Render **Top Customers** as a table: rank, name, email, order count, total spent (formatted INR).
- [ ] **6.6.3** Render **Top Products** as a table: rank, product name (with "Discontinued Product" fallback shown visually distinct), quantity sold, revenue.
- [ ] **6.6.4** Render **Revenue by Month** as a bar chart or line chart. Install a charting library: `npm install recharts`. Configure:
  - X-axis: month labels (e.g., "Aug 2025").
  - Y-axis: revenue in INR.
  - Each bar/point represents one month from the 12-month window.
- [ ] **6.6.5** Render **Low Stock Alert** as a highlighted alert list: product name, current stock count (color-coded: red for stock < 2, orange for stock < 5).
- [ ] **6.6.6** Render **Customer Lookup**: a search input for customer ID or email. On submit, fetch and display that customer's full order history from `customer/[id]/orders`.

### Phase 6 Exit Criteria Checklist

- [ ] Revenue-by-month chart shows **non-uniform variation** across the trailing 12 months — confirms the seed data historical date spread was done correctly in Phase 1.14.7.
- [ ] The Top Products query includes at least one entry showing "Discontinued Product" — confirm by manually setting one seeded product to `isActive: false` and verifying the analytics still show it by its `$ifNull` fallback name (not a crash or null).
- [ ] All five analytics endpoints require an admin session — calling them with a customer token returns 403.
- [ ] Low-stock alert list shows the products intentionally seeded with `stock < 5` in Phase 1.14.6.

---

## Phase 7 — Hardening, Polish & Deployment

**Goal:** Production-quality, portfolio-grade artifact. Every rule in `project-rules.md` demonstrably true.

### 7.1 — Full `project-rules.md` Compliance Audit

- [ ] **7.1.1** Walk through each of the 8 non-negotiable invariants in `project-rules.md § 4` and verify each:
  1. Grep the codebase for any Route Handler or Server Action that reads `price`, `total`, or `stock` from `req.body` and writes it directly. Must be zero results.
  2. Verify there is no PATCH/PUT route for `Order.items` anywhere in the codebase. Confirm only the checkout/confirm handler writes `nameSnapshot`, `priceSnapshot`, `shippingAddressSnapshot`.
  3. For each Mongoose model file, confirm a corresponding Zod schema file exists in `lib/validations/`.
  4. For each `app/api/admin/**` route file, confirm a `requireAdmin()` call appears before any `await Model.` call.
  5. Confirm the `DELETE /api/admin/products/[id]` handler always checks for order references before hard-deleting.
  6. Run `grep -r "MONGODB_URI\|CLOUDINARY_API_SECRET\|RAZORPAY_KEY_SECRET\|NEXTAUTH_SECRET" app/ components/` — confirm zero results (secrets must not appear in client bundles; they must only be in `lib/` server-only files).
  7. Run `db.products.getIndexes()` again — confirm all foreign-key fields are still indexed after Phase 3–5 additions.
  8. Review the order status state machine handler — confirm the `validTransitions` map is exhaustive and the handler returns 400 on any unrecognized transition.

### 7.2 — Rate Limiting on Auth Routes

- [ ] **7.2.1** Install a lightweight rate-limiting library compatible with Next.js serverless: `npm install @upstash/ratelimit @upstash/redis` (or an alternative like `next-rate-limit`).
- [ ] **7.2.2** Apply rate limiting to the login endpoint and the registration endpoint. Limit to ~5 attempts per 15 minutes per IP.
- [ ] **7.2.3** Return 429 Too Many Requests with the error envelope: `{ success: false, error: { code: "RATE_LIMITED", message: "Too many attempts. Try again later." } }`.

### 7.3 — Input Validation Final Pass

- [ ] **7.3.1** For every Route Handler file in `app/api/`, confirm that request body parsing is immediately followed by Zod validation before any `await Model.` call. No exceptions.
- [ ] **7.3.2** For every Server Action, confirm Zod validation is the first operation.
- [ ] **7.3.3** Confirm all validation error responses use the standard `{ success: false, error: { code, message } }` envelope — never a raw Mongoose validation error object.

### 7.4 — Responsive & Mobile Pass

- [ ] **7.4.1** Open every customer-facing page (`/`, `/products`, `/products/[slug]`, `/categories/[slug]`, `/cart`, `/checkout`, `/orders`, `/orders/[id]`, `/login`, `/register`) in Chrome DevTools at 375px (iPhone SE) and 768px (iPad). Fix any overflow, unreadable text, or broken layout.
- [ ] **7.4.2** Ensure touch targets (buttons, links) are at minimum 44×44px.
- [ ] **7.4.3** Verify the navigation/header is usable on mobile (hamburger menu or simplified nav).

### 7.5 — Loading & Error States

- [ ] **7.5.1** Add `loading.tsx` co-located with every page that fetches data (Next.js App Router automatically shows this during RSC data fetch). Show a skeleton or spinner.
- [ ] **7.5.2** Add `error.tsx` co-located with every page. Must include a "Try Again" button that calls `reset()` from the Next.js error boundary props.
- [ ] **7.5.3** For client-side data fetches (cart updates, checkout), show loading states on buttons (disable + spinner) during the async operation. Prevent double-submission.
- [ ] **7.5.4** Verify that no unhandled promise rejections appear in the browser console under any user flow. Test by briefly disconnecting from the internet while on the catalog page.

### 7.6 — Secrets Audit

- [ ] **7.6.1** Run `git log --all --full-history -- .env.local` — confirm `.env.local` was never committed.
- [ ] **7.6.2** Run `grep -r "mongodb+srv\|rzp_test\|cloudinary.com/upload" . --exclude-dir={.git,node_modules}` — confirm no hardcoded credentials appear in any source file.
- [ ] **7.6.3** Confirm `NEXTAUTH_SECRET` in production will be a different value from the development secret (document this in the README).

### 7.7 — Production Deployment

- [ ] **7.7.1** Push the codebase to a GitHub repository (public or private).
- [ ] **7.7.2** Connect the GitHub repo to Vercel. Vercel auto-detects Next.js.
- [ ] **7.7.3** In the Vercel dashboard, add all environment variables from `.env.local`. Update `NEXTAUTH_URL` to the Vercel deployment URL (e.g., `https://your-app.vercel.app`). Generate a new, separate `NEXTAUTH_SECRET` for production.
- [ ] **7.7.4** Update the MongoDB Atlas cluster's IP allowlist to include Vercel's outbound IP ranges (or allow all `0.0.0.0/0` for a portfolio project — document the trade-off).
- [ ] **7.7.5** Trigger a Vercel deploy. Monitor the build logs for any TypeScript or module errors.
- [ ] **7.7.6** On the live deployment, verify MongoDB Atlas connectivity by calling any endpoint that reads from the DB (e.g., `GET /api/categories`) and confirming it returns seeded data.
- [ ] **7.7.7** Run the seed script against the production database once: `MONGODB_URI=<production_uri> npm run seed`. Verify counts in Atlas.

### 7.8 — README

- [ ] **7.8.1** Create `README.md` in the project root with the following sections:
  - **Project Overview:** What this is, what it demonstrates (schema design under application pressure, server-authoritative checkout, RBAC, aggregation analytics).
  - **Tech Stack:** Next.js App Router, TypeScript, Tailwind, MongoDB Atlas, Mongoose, Auth.js, Zod, Cloudinary, Razorpay (test mode).
  - **Architecture Summary:** 2–3 paragraphs covering the modular monolith structure, the RSC/Server Action/Route Handler decision rules, and the checkout security model.
  - **Local Setup Instructions:** step-by-step from `git clone` → `npm install` → `.env.local` configuration → `npm run seed` → `npm run dev`.
  - **Seed Credentials:** list the seeded admin email/password and one customer email/password for demo purposes (these are test credentials only).
  - **Links:** link to the live Vercel deployment and back to this PRD document set.
- [ ] **7.8.2** Confirm the README renders correctly on GitHub.

### Phase 7 Exit Criteria Checklist

- [ ] **Full customer journey test (cold, unauthenticated user on a fresh deploy):**
  1. Visit the live URL — catalog loads with seeded products. Zero console errors.
  2. Register a new account.
  3. Browse the catalog, filter by category and price.
  4. Search for a product by name.
  5. Open a product detail page.
  6. Add to cart.
  7. Proceed to checkout, select a shipping address, complete test payment in Razorpay widget.
  8. View order confirmation page.
  9. View order history — snapshot data displayed correctly.
- [ ] **Full admin journey test (admin account on same fresh deploy):**
  1. Log in with the seeded admin account.
  2. Create a new category.
  3. Create a new product assigned to that category, including image upload.
  4. Verify the product appears on the public catalog without needing to refresh manually.
  5. Update an order status: `pending → confirmed`.
  6. View analytics dashboard — confirm the revenue chart shows historical variation.
  7. View the low-stock alert — confirm products with `stock < 5` appear.

---

## Appendix: Quick Reference

### Complete File Creation Checklist

| File | Phase |
|---|---|
| `lib/db/connect.ts` | 0 |
| `lib/cloudinary.ts` | 0 |
| `lib/razorpay.ts` | 0 |
| `lib/auth.ts` | 2 |
| `lib/validations/user.schema.ts` | 1 |
| `lib/validations/category.schema.ts` | 1 |
| `lib/validations/product.schema.ts` | 1 |
| `lib/validations/order.schema.ts` | 1 |
| `lib/validations/review.schema.ts` | 1 |
| `lib/validations/cart.schema.ts` | 1 |
| `models/User.model.ts` | 1 |
| `models/Category.model.ts` | 1 |
| `models/Product.model.ts` | 1 |
| `models/Order.model.ts` | 1 |
| `models/Review.model.ts` | 1 |
| `models/Cart.model.ts` | 1 |
| `scripts/seed.ts` | 1 |
| `middleware.ts` | 2 |
| `app/api/auth/[...nextauth]/route.ts` | 2 |
| `app/(auth)/login/page.tsx` | 2 |
| `app/(auth)/register/page.tsx` | 2 |
| `app/api/products/route.ts` | 3 |
| `app/api/products/[slug]/route.ts` | 3 |
| `app/api/categories/route.ts` | 3 |
| `app/api/products/[id]/reviews/route.ts` | 3 |
| `app/(customer)/products/page.tsx` | 3 |
| `app/(customer)/products/[slug]/page.tsx` | 3 |
| `app/(customer)/categories/[slug]/page.tsx` | 3 |
| `app/api/cart/route.ts` | 4 |
| `app/api/cart/items/route.ts` | 4 |
| `app/api/cart/items/[productId]/route.ts` | 4 |
| `app/api/checkout/initiate/route.ts` | 4 |
| `app/api/checkout/confirm/route.ts` | 4 |
| `app/api/orders/route.ts` | 4 |
| `app/api/orders/[id]/route.ts` | 4 |
| `app/(customer)/cart/page.tsx` | 4 |
| `app/(customer)/checkout/page.tsx` | 4 |
| `app/(customer)/orders/page.tsx` | 4 |
| `app/(customer)/orders/[id]/page.tsx` | 4 |
| `app/api/admin/products/route.ts` | 5 |
| `app/api/admin/products/[id]/route.ts` | 5 |
| `app/api/admin/upload/route.ts` | 5 |
| `app/api/admin/categories/route.ts` | 5 |
| `app/api/admin/categories/[id]/route.ts` | 5 |
| `app/api/admin/orders/route.ts` | 5 |
| `app/api/admin/orders/[id]/status/route.ts` | 5 |
| `app/(admin)/admin/page.tsx` | 5 → 6 |
| `app/(admin)/admin/products/page.tsx` | 5 |
| `app/(admin)/admin/categories/page.tsx` | 5 |
| `app/(admin)/admin/orders/page.tsx` | 5 |
| `app/api/admin/analytics/top-customers/route.ts` | 6 |
| `app/api/admin/analytics/top-products/route.ts` | 6 |
| `app/api/admin/analytics/revenue/route.ts` | 6 |
| `app/api/admin/analytics/low-stock/route.ts` | 6 |
| `app/api/admin/analytics/customer/[id]/orders/route.ts` | 6 |
| `README.md` | 7 |

### Key Architectural Decisions (Quick Recall)

| Decision | Rule |
|---|---|
| Cart stores no price | Only `productId` + `quantity`. Live price fetched on every cart read. |
| Order snapshots price | `nameSnapshot`, `priceSnapshot`, `shippingAddressSnapshot` written once at `checkout/confirm`, never updated. |
| Double RBAC check | Middleware gates the page; handler independently checks `session.user.role`. |
| Soft-delete products | `isActive: false` — never hard-delete if any order references the product. |
| Block category delete | If any active product has `categoryId` pointing to it, reject the delete. |
| Server computes totals | `checkout/initiate` fetches live product prices, ignores any client-submitted amount. |
| Transaction at confirm | `Order` create + `Product.stock` decrement + `Cart` clear are one atomic MongoDB transaction. |
| Re-validate at confirm | Stock is re-checked at `checkout/confirm` because time passes during Razorpay widget interaction. |

---

*This document is derived from all five PRD files. Any conflict between this file and the PRDs should be resolved in favor of the PRD set, not this document.*
