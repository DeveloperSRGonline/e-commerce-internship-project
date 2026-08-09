# Roadmap — E-Commerce Platform (PRD)

**Document type:** Product/Project Requirements Document (PRD) — Part 4 of 5
**Companion documents:** `project-context.md`, `architecture.md`, `database-schema.md`, `project-rules.md`
**Covers:** Development Phases

---

## 1. Phasing Philosophy

Phases are sequenced by **dependency, not by feature glamour**. Auth and schema come before catalog UI, because catalog UI is meaningless without something to browse; checkout comes after cart, because checkout is cart-plus-payment, not a separate system. Each phase has an explicit **exit criteria** — a phase is not "done" because time was spent on it, but because its exit criteria are demonstrably true. This mirrors the project's own anti-tutorial-hell discipline: no moving forward on assumption, only on verified working state.

Analytics is deliberately placed *after* order data exists in real volume (post-seed, post-checkout), not before — an aggregation pipeline is untestable without real documents to aggregate over.

---

## 2. Phase 0 — Foundation & Environment

**Goal:** A running skeleton with no business logic yet, but every external service connected and verified.

**Tasks:**
- Initialize Next.js (App Router, TypeScript, Tailwind) project structure per `architecture.md`.
- Provision MongoDB Atlas cluster, connect via Mongoose singleton (`lib/db/connect.ts`).
- Provision Cloudinary account, verify a manual test upload works end-to-end.
- Provision Razorpay test account, verify a test key pair is retrievable.
- Set up environment variable strategy (`.env.local`, never committed — see `project-rules.md`).

**Exit Criteria:**
- App boots with zero errors.
- A test document can be written to and read from MongoDB Atlas from a Route Handler.
- A test image can be uploaded to Cloudinary and its URL retrieved.

---

## 3. Phase 1 — Schema & Seed Data

**Goal:** All six Mongoose models exist exactly as specified in `database-schema.md`, with indexes applied and seed data populated.

**Tasks:**
- Implement all Mongoose models (`User`, `Product`, `Category`, `Order`, `Review`, `Cart`) with schema-level validators matching the field tables.
- Apply all indexes listed in `database-schema.md` § 5.
- Write corresponding Zod schemas in `lib/validations/` — one-to-one with each model.
- Write and run `scripts/seed.ts` following the strict sequencing (Users → Categories → Products → Orders) with realistic Indian data and historically spread order dates.

**Exit Criteria:**
- Seed script runs idempotently (safe to re-run against a clean DB).
- `db.products.getIndexes()` and equivalent checks confirm every planned index exists.
- Manually spot-checking a seeded order confirms `items[].nameSnapshot`/`priceSnapshot` are populated and independent of the live product state.

---

## 4. Phase 2 — Auth & RBAC

**Goal:** Login/logout works for both roles, and route protection is enforced exactly per `project-context.md` § 7.

**Tasks:**
- Configure Auth.js (credentials provider at minimum, database session strategy, MongoDB adapter).
- Implement `middleware.ts` route protection matrix (public / customer / admin).
- Implement handler-level role re-checks on every admin mutation route (defense-in-depth, per `architecture.md` § 3.4 rationale extended to all admin routes, not just order status).
- Build login/register pages.

**Exit Criteria:**
- A customer account cannot reach `/admin/*` (verified both via direct navigation and direct API call).
- An admin account can reach both customer and admin areas.
- Session persists correctly across a page refresh.

---

## 5. Phase 3 — Catalog (Browse, Search, Filter)

**Goal:** Public-facing product discovery is fully functional, built on RSC data fetching.

**Tasks:**
- Catalog listing page with pagination, category filter, price filter, sort.
- Text search using the `products` text index.
- Product detail page with images (Cloudinary-served), stock status, category, reviews list.
- Category listing/detail pages.

**Exit Criteria:**
- Search returns relevant results against seeded product names/descriptions.
- Filtering by category and price range produces correct, index-backed results (verified via `explain()` showing index usage, not a collection scan).

---

## 6. Phase 4 — Cart & Checkout

**Goal:** The full checkout sequence from `architecture.md` § 3.2 works end-to-end against Razorpay test mode.

**Tasks:**
- Cart Route Handlers (add/update/remove) with live product re-pricing on every cart read (per § 3 hybrid decision — carts never snapshot).
- `/api/checkout/initiate` — server-side recalculation, Razorpay test order creation.
- `/api/checkout/confirm` — signature verification, transactional order creation + stock decrement + cart clear.
- Order confirmation and order history pages.

**Exit Criteria:**
- Manually attempting to tamper with client-sent price/quantity (e.g., via browser devtools network tab) is proven ineffective — server-computed total is what's actually charged and stored, verified by comparison.
- A deliberately triggered stock race (two near-simultaneous checkouts on a low-stock item) results in exactly one successful order, not two.
- Order history displays snapshot data correctly even after the underlying product is edited.

---

## 7. Phase 5 — Admin Console

**Goal:** Admins can fully manage the catalog and order lifecycle without touching the database directly.

**Tasks:**
- Product CRUD UI + Route Handlers, including Cloudinary image upload flow.
- Category CRUD UI + Route Handlers, with the referential-integrity delete guard (`project-rules.md`).
- Order management UI — list, filter by status, update status through the state machine from `architecture.md` § 3.4.

**Exit Criteria:**
- Product created via admin UI is immediately visible in the public catalog.
- Attempting an invalid order status transition (e.g., `delivered → pending`) is rejected server-side, not just hidden in the UI.
- Deleting a category with active products attached is blocked with a clear error, not a silent orphan reference.

---

## 8. Phase 6 — Analytics Dashboard

**Goal:** All five required aggregation queries are implemented and rendered as an admin dashboard.

**Tasks:**
- Implement the five aggregation pipelines exactly as specified in `database-schema.md` § 7.
- Build dashboard UI: top customers table, top products table, revenue-by-month chart, low-stock alert list, per-customer order history lookup.

**Exit Criteria:**
- Revenue-by-month chart shows realistic variation across the trailing 12 months (proof that seed data historical spread was done correctly in Phase 1).
- Best-selling products query correctly handles a deliberately deactivated/deleted product without crashing (proof of the `$ifNull` fallback from § 7.2).

---

## 9. Phase 7 — Hardening, Polish, and Deployment

**Goal:** The application is presentable as a portfolio-grade artifact, not just functionally complete.

**Tasks:**
- Full pass against every rule in `project-rules.md` (validation coverage, error handling, rate limiting on auth routes, secrets audit).
- Responsive/mobile pass on all customer-facing pages.
- Loading and error states for every async data fetch (no unhandled promise rejections, no blank screens on failure).
- Production deployment (e.g., Vercel for the app, MongoDB Atlas production tier, Cloudinary/Razorpay live-adjacent config kept in test mode).
- README with architecture summary, setup instructions, and a link back to this PRD set.

**Exit Criteria:**
- A cold, unauthenticated user can complete the full customer journey (browse → cart → checkout → order history) on a fresh deploy with no console errors.
- A fresh admin account can complete the full admin journey (create category → create product → view it live → update an order status → see it reflected in analytics).

---

## 10. Explicitly Deferred (Future Phases, Not v1)

These are acknowledged as valuable but intentionally out of scope, to prevent scope creep from diluting the core schema-to-production narrative this project is meant to demonstrate:

- Redis caching layer for catalog/session data.
- Coupon/discount code system.
- Wishlist / saved-for-later.
- Multi-vendor support.
- CI/CD pipeline with automated test suite (unit tests on validation schemas and aggregation logic would be the highest-value first addition here).
- Dockerized local dev environment.
- Real (non-test-mode) payment processing.

---

*Continue to `project-rules.md` for the non-negotiable security, performance, and engineering conventions that apply across every phase above.*