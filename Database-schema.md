# Database Schema — E-Commerce Platform (PRD)

**Document type:** Product/Project Requirements Document (PRD) — Part 3 of 5
**Companion documents:** `project-context.md`, `architecture.md`, `roadmap.md`, `project-rules.md`
**Covers:** Collection design, Embedding vs Referencing, Snapshot Pattern, Indexing Strategy, Seed Data Strategy, Analytics Logic

---

## 1. Collection Overview

| Collection | Type | Purpose |
|---|---|---|
| `users` | Core | Accounts, roles, embedded bounded addresses |
| `products` | Core | Catalog items |
| `orders` | Core | Immutable purchase records with embedded snapshots |
| `categories` | Bonus | Product taxonomy |
| `reviews` | Bonus | Customer product feedback |
| `carts` | Bonus | Active pre-purchase state, one per user |

---

## 2. Collection Design

### 2.1 `users`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `name` | String | required |
| `email` | String | required, unique, lowercase-normalized |
| `passwordHash` | String | only for credentials provider; null if OAuth |
| `role` | String enum | `"customer"` \| `"admin"`, default `"customer"` |
| `addresses` | Array\<EmbeddedAddress\> | **embedded** — bounded list, see § 3 |
| `addresses[].label` | String | e.g. "Home", "Work" |
| `addresses[].line1` | String | |
| `addresses[].line2` | String | optional |
| `addresses[].city` | String | |
| `addresses[].state` | String | |
| `addresses[].pincode` | String | |
| `addresses[].isDefault` | Boolean | |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

### 2.2 `categories`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `name` | String | required, unique |
| `slug` | String | required, unique, URL-safe |
| `description` | String | optional |
| `createdAt` / `updatedAt` | Date | |

### 2.3 `products`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `name` | String | required |
| `slug` | String | required, unique |
| `description` | String | required |
| `price` | Number | required, in INR (paise-precision integer recommended — see `project-rules.md`) |
| `stock` | Number | required, >= 0 |
| `categoryId` | ObjectId | **referenced** → `categories._id`, see § 3 |
| `images` | Array\<{ url, publicId }\> | Cloudinary references only, no binary data |
| `isActive` | Boolean | default `true` — used for soft-delete (see § 3.6 referential integrity) |
| `ratingAvg` | Number | denormalized, recalculated on new review (see § 2.5) |
| `ratingCount` | Number | denormalized |
| `createdAt` / `updatedAt` | Date | |

### 2.4 `orders`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `userId` | ObjectId | **referenced** → `users._id` |
| `items` | Array\<OrderItemSnapshot\> | **embedded snapshot** — see § 4 |
| `items[].productId` | ObjectId | reference retained for lookups, but never re-queried for display |
| `items[].nameSnapshot` | String | product name **at time of purchase** |
| `items[].priceSnapshot` | Number | unit price **at time of purchase** |
| `items[].quantity` | Number | |
| `items[].lineTotal` | Number | `priceSnapshot * quantity`, computed server-side |
| `shippingAddressSnapshot` | EmbeddedAddress | **copy** of the address used, not a reference to `users.addresses` |
| `subtotal` | Number | server-computed |
| `tax` | Number | server-computed |
| `total` | Number | server-computed, matches amount charged via Razorpay |
| `status` | String enum | `"pending"` \| `"confirmed"` \| `"shipped"` \| `"delivered"` \| `"cancelled"` |
| `payment.razorpayOrderId` | String | |
| `payment.razorpayPaymentId` | String | |
| `payment.status` | String enum | `"created"` \| `"paid"` \| `"failed"` \| `"refunded"` |
| `createdAt` / `updatedAt` | Date | `createdAt` is the purchase timestamp used for all revenue analytics |

### 2.5 `reviews`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `productId` | ObjectId | **referenced** → `products._id` |
| `userId` | ObjectId | **referenced** → `users._id` |
| `rating` | Number | 1–5, required |
| `comment` | String | optional |
| `createdAt` | Date | |

Not embedded in `products` because review count is unbounded (a popular product could accumulate thousands of reviews — see § 3 rationale). `product.ratingAvg`/`ratingCount` are denormalized aggregates updated on write, giving fast catalog-page rendering without embedding the full review list.

### 2.6 `carts`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `userId` | ObjectId | **referenced** → `users._id`, unique (one cart per user) |
| `items` | Array\<{ productId, quantity }\> | **embedded** — bounded (a cart realistically has a handful of line items), and always **live-priced** by re-fetching the referenced product — the cart itself stores no price, precisely because it is not a purchase record (contrast with `orders.items`, which snapshots price deliberately) |
| `updatedAt` | Date | |

---

## 3. Embedding vs Referencing Decisions

This is the central data-modeling exercise inherited from the original assignment, now justified against real access patterns rather than abstract preference.

| Relationship | Decision | Why |
|---|---|---|
| `User` → `Addresses` | **Embed** | Bounded (a user realistically has 1–5 addresses), always accessed *with* the user (checkout address picker loads all addresses in one read), no independent lifecycle — an address has no meaning outside its owning user. Classic "embed the bounded, always-co-accessed, no-independent-query-need" case. |
| `Product` → `Category` | **Reference** | Many-to-one, unbounded on the "many" side (a category can have hundreds of products), and categories are queried independently (category listing pages, admin category management) — embedding the category into every product would duplicate category data across hundreds of documents and require a multi-document update if a category is renamed. |
| `Order` → `Product` (purchased items) | **Reference id + Embed snapshot** | This is the hybrid case, detailed fully in § 4. The reference (`productId`) is retained for analytics joins (e.g., "top-selling products" needs to group by product identity), but the *display data* (name, price) is embedded as a snapshot because it must never change after purchase. |
| `Order` → `User` | **Reference** | One-to-many, unbounded on the "many" side (a user can have hundreds of orders over time) — embedding orders into the user document would produce unbounded document growth and blow past MongoDB's 16MB document size limit for active customers. |
| `Order` → `Shipping Address` | **Embed (copy, not reference)** | Deliberately *not* a reference into `users.addresses`, even though that would seem DRY. If the user edits or deletes that address after ordering, the order must still show where the package was actually sent. This is the same immutability argument as the product snapshot — see § 4. |
| `Product` → `Reviews` | **Reference** | Unbounded one-to-many (popular products can have thousands of reviews) — embedding would risk unbounded document growth on `products`, which is also the highest-read-frequency collection in the app (every catalog page load touches it). Keeping reviews separate keeps the hot `products` collection small and fast. |
| `Cart` → `Product` (cart items) | **Reference, no snapshot** | Unlike orders, a cart is *not* a purchase record — it's a live shopping intent. Cart items should always reflect **current** price and stock (if a product's price drops while it's in someone's cart, they should see the new price), so referencing (and re-fetching live data on cart read) is correct here, and snapshotting would be actively wrong. |
| `User` → `Cart` | **Reference (1:1)** | Kept as a separate collection rather than embedded on `User` because cart items change far more frequently than user profile data — separating write-hot data (cart) from write-cold data (user profile) avoids unnecessary document rewrites and lock contention on the user document. |

### 3.1 Summary Heuristic Applied Throughout

> **Embed when:** the child is bounded in size, always read together with the parent, and has no independent query/lifecycle need.
> **Reference when:** the child is unbounded, queried independently, or has its own lifecycle (created/updated/deleted on its own schedule).
> **Embed a snapshot (hybrid) when:** the relationship must be historically frozen at a point in time, even though the live entity continues to change.

---

## 4. The Snapshot Pattern Implementation

### 4.1 The Problem It Solves

Without snapshotting, an `Order` document referencing `Product` by ID alone would mean: every time someone views an old order, the app re-fetches the *current* product to display name/price. This breaks in three concrete ways:

1. **Price changes.** If a product's price increases after purchase, a naive reference-only order would retroactively show the *new* price on a receipt from three months ago — a factually wrong financial record.
2. **Product edits.** If an admin renames "Basmati Rice 5kg" to "Premium Basmati Rice 5kg," old order history should still reflect what the customer actually saw and bought.
3. **Product deletion.** If a product is discontinued and removed, a reference-only order would show a broken link or `null` for a legitimately completed purchase — order history must survive the referenced entity's deletion entirely.

### 4.2 Why Immutability Matters Here Specifically

An order is a **financial and legal record**, not a live view of the catalog. The moment payment is confirmed, the "what did the customer buy and for how much" question must have exactly one permanent answer, independent of anything that happens to the `products` collection afterward. This is the same principle behind invoices in any real commerce system: an invoice PDF doesn't regenerate itself when the vendor's price list changes.

### 4.3 What Gets Snapshotted

- `items[].nameSnapshot`, `items[].priceSnapshot` — frozen at the moment `checkout/confirm` succeeds (see `architecture.md` § 3.2).
- `shippingAddressSnapshot` — a full copy of the address object, not a pointer to `users.addresses[i]`.
- `subtotal`, `tax`, `total` — computed once, at confirmation, and never recalculated afterward.

### 4.4 What Is *Not* Snapshotted (and Why)

- `items[].productId` is retained as a live reference — not for display, but so analytics (§ 6) can `$group` by actual product identity even across name changes, and so admins can navigate from an order line item to the current product page if it still exists.
- Order `status` is intentionally mutable (that's the whole point of the lifecycle in `architecture.md` § 3.4) — snapshotting applies to *what was purchased*, not to *the order's own operational state*.

### 4.5 Enforcement

Snapshot fields are written exactly once, inside the `checkout/confirm` transaction, and the Mongoose schema marks them with no update path elsewhere in the codebase — there is no `PATCH /api/orders/[id]/items` route, by design (see `project-rules.md` for the full list of non-negotiable invariants).

---

## 5. Indexing Strategy

| Collection | Index | Type | Purpose |
|---|---|---|---|
| `users` | `{ email: 1 }` | Unique | Enforce one account per email; fast login lookup |
| `users` | `{ role: 1 }` | Single | Fast admin listing/filtering by role |
| `products` | `{ slug: 1 }` | Unique | Product detail page lookup by URL slug |
| `products` | `{ categoryId: 1 }` | Single | Category-filtered catalog queries |
| `products` | `{ price: 1 }` | Single | Price-range filter / sort-by-price queries |
| `products` | `{ stock: 1 }` | Single | Powers the low-stock analytics query (§ 6.4) |
| `products` | `{ name: "text", description: "text" }` | Text | Catalog search feature |
| `products` | `{ categoryId: 1, price: 1 }` | Compound | Supports the common combined query "products in category X sorted/filtered by price" without an in-memory sort |
| `categories` | `{ slug: 1 }` | Unique | Category page lookup |
| `orders` | `{ userId: 1, createdAt: -1 }` | Compound | "My orders, newest first" — the single most common order query |
| `orders` | `{ status: 1, createdAt: -1 }` | Compound | Admin order management filtered/sorted by status and recency |
| `orders` | `{ "payment.razorpayOrderId": 1 }` | Single | Fast lookup during `checkout/confirm` signature verification |
| `reviews` | `{ productId: 1, createdAt: -1 }` | Compound | "Reviews for this product, newest first" |
| `reviews` | `{ userId: 1, productId: 1 }` | Compound, Unique | Prevents duplicate reviews from the same user on the same product |
| `carts` | `{ userId: 1 }` | Unique | One cart per user, fast cart lookup on login |

### 5.1 Indexing Principles Applied

- **Every foreign-key-style reference field is indexed** (`categoryId`, `userId`, `productId`) — unindexed reference lookups are the single most common source of slow queries in document databases, since Mongo has no automatic FK indexing the way some relational engines optimize joins.
- **Compound indexes follow the ESR rule** (Equality, Sort, Range) where applicable — e.g., `{ userId: 1, createdAt: -1 }` puts the equality filter (`userId`) first and the sort field second, matching how MongoDB can actually use the index for both filtering and ordering in one pass.
- **The text index is single-purpose** — only on `products`, since search is not required on any other collection in v1.
- **No index on `orders.items` or `products.description` beyond the text index** — indexing large embedded arrays or long free-text fields for equality/range lookups provides little benefit and inflates index storage size.

---

## 6. Seed Data Strategy

### 6.1 Sequencing (Strict Order — Dependencies Must Exist First)

```
1. Users        (10 records)
2. Categories   (created before products, since products reference categoryId)
3. Products     (20 records, each assigned a categoryId from step 2)
4. Orders       (30 records, each referencing real userIds + productIds from steps 1 & 3,
                 with historical createdAt dates spread across the past 12 months
                 so the revenue-by-month analytics query has real data to aggregate)
```

This sequencing is enforced in `scripts/seed.ts` (see `architecture.md` folder structure) as a linear async script — categories and products are awaited and their inserted `_id`s captured before order documents are constructed, since orders cannot snapshot a product that doesn't yet exist.

### 6.2 Realism Requirements

| Aspect | Requirement |
|---|---|
| Currency | All prices in INR, realistic Indian retail price points (e.g., ₹299–₹4,999 range depending on category) |
| Names | Indian names for the 10 seed users (e.g., Aditya Sharma, Priya Patel, Rohan Iyer, Sneha Reddy) |
| Cities/Addresses | Real Indian cities across seed addresses (Mumbai, Pune, Bengaluru, Ahmedabad, Nagpur, Jaipur) with plausible pincodes |
| Product Categories | Vegetarian-appropriate, general retail categories only — e.g., Electronics, Fashion, Home & Kitchen, Books, Groceries, Personal Care (no meat/non-veg product examples per project content constraints) |
| Order Dates | Spread across the trailing 12 months, non-uniform (some months with more orders than others) so the monthly revenue chart isn't a flat line — this specifically exists to make the analytics in § 6.3 below produce meaningful, presentable output |
| Order Status Mix | A realistic distribution across `delivered`, `shipped`, `confirmed`, `pending`, and a few `cancelled`, so admin order-management filtering has something to filter |

### 6.3 Why This Matters Beyond "Having Data"

The seed data isn't just for populating an empty UI — it's the **test fixture for the analytics layer** (§ 7). "12-month revenue breakdown" is meaningless against orders all created today; the seed script's historical date distribution is what makes that aggregation demonstrably correct rather than trivially correct.

---

## 7. Analytics Logic (MongoDB Aggregation)

All five required analytics queries, expressed as aggregation pipeline stages (conceptual/pseudocode form — not application code, per project scope).

### 7.1 Top 5 Highest-Spending Customers

```
db.orders.aggregate([
  { $match: { status: { $ne: "cancelled" } } },
  { $group: {
      _id: "$userId",
      totalSpent: { $sum: "$total" },
      orderCount: { $sum: 1 }
  }},
  { $sort: { totalSpent: -1 } },
  { $limit: 5 },
  { $lookup: {
      from: "users",
      localField: "_id",
      foreignField: "_id",
      as: "user"
  }},
  { $unwind: "$user" },
  { $project: {
      _id: 0,
      userId: "$_id",
      name: "$user.name",
      email: "$user.email",
      totalSpent: 1,
      orderCount: 1
  }}
])
```

**Design notes:** `$match` excludes cancelled orders first (a cancelled order's `total` should not count as "spend") — filtering before grouping is both correct and a performance win (smaller input to `$group`). Uses the `{ userId: 1, createdAt: -1 }` index for the initial scan.

### 7.2 Top 10 Best-Selling Products by Quantity

```
db.orders.aggregate([
  { $match: { status: { $ne: "cancelled" } } },
  { $unwind: "$items" },
  { $group: {
      _id: "$items.productId",
      totalQuantitySold: { $sum: "$items.quantity" },
      totalRevenue: { $sum: "$items.lineTotal" }
  }},
  { $sort: { totalQuantitySold: -1 } },
  { $limit: 10 },
  { $lookup: {
      from: "products",
      localField: "_id",
      foreignField: "_id",
      as: "product"
  }},
  { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
  { $project: {
      _id: 0,
      productId: "$_id",
      // Falls back to the snapshot name if the product was deleted/deactivated,
      // demonstrating exactly why the snapshot pattern (Section 4) matters for analytics too.
      name: { $ifNull: ["$product.name", "Discontinued Product"] },
      totalQuantitySold: 1,
      totalRevenue: 1
  }}
])
```

**Design notes:** `$unwind` on `items` is necessary because quantity sold is per line item, not per order. `preserveNullAndEmptyArrays: true` on the `$lookup` unwind ensures a discontinued product (deleted from `products`) doesn't silently disappear from historical best-seller reporting — this is a direct payoff of retaining `productId` as a live reference alongside the snapshot (§ 3, hybrid decision).

### 7.3 12-Month Revenue Breakdown by Month

```
db.orders.aggregate([
  { $match: {
      status: { $ne: "cancelled" },
      createdAt: { $gte: <twelveMonthsAgoDate> }
  }},
  { $group: {
      _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
      revenue: { $sum: "$total" },
      orderCount: { $sum: 1 }
  }},
  { $sort: { "_id.year": 1, "_id.month": 1 } },
  { $project: {
      _id: 0,
      year: "$_id.year",
      month: "$_id.month",
      revenue: 1,
      orderCount: 1
  }}
])
```

**Design notes:** Grouping key is a compound `{ year, month }` object rather than a formatted string, avoiding string-formatting inconsistencies and enabling correct chronological `$sort`. The `createdAt` range filter uses the `{ status: 1, createdAt: -1 }` compound index.

### 7.4 Critically Low Stock Products (< 5)

```
db.products.aggregate([
  { $match: { isActive: true, stock: { $lt: 5 } } },
  { $sort: { stock: 1 } },
  { $project: {
      _id: 1,
      name: 1,
      stock: 1,
      categoryId: 1
  }}
])
```

**Design notes:** Simple enough that a plain `find()` with `.sort()` would also work — included as an aggregation here for consistency with the admin analytics API surface, and because it's a natural extension point (e.g., adding a `$lookup` to include category name in the alert list later). Uses the `{ stock: 1 }` index directly.

### 7.5 Specific Customer's Complete Order History

```
db.orders.aggregate([
  { $match: { userId: <ObjectId(customerId)> } },
  { $sort: { createdAt: -1 } },
  { $project: {
      _id: 1,
      status: 1,
      total: 1,
      createdAt: 1,
      itemCount: { $size: "$items" },
      items: 1  // full snapshot data — this IS the historical record, per Section 4
  }}
])
```

**Design notes:** No `$lookup` into `products` needed at all — this is the clearest demonstration of the snapshot pattern paying off: the customer's complete purchase history, including exact historical names and prices, is fully reconstructable from the `orders` collection alone. Uses the `{ userId: 1, createdAt: -1 }` compound index for both the filter and the sort in a single index scan.

---

*Continue to `roadmap.md` for phased development sequencing, and `project-rules.md` for security, performance, and engineering conventions.*