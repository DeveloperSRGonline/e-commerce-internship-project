# Project Rules — E-Commerce Platform (PRD)

**Document type:** Product/Project Requirements Document (PRD) — Part 5 of 5
**Companion documents:** `project-context.md`, `architecture.md`, `database-schema.md`, `roadmap.md`
**Covers:** Security & Performance Trade-offs, Non-Negotiable Invariants, Engineering Conventions

---

## 1. Purpose of This Document

The other four PRD files describe *what* to build and *why*. This file is the enforcement layer — the rules that must hold true regardless of which phase of `roadmap.md` is being worked on. Anything here overrides convenience during implementation.

---

## 2. Security Rules (Non-Negotiable)

### 2.1 Server-Authoritative Pricing — The Prime Rule

Every price, stock count, and computed total that ends up in an `Order` document must originate from a server-side read of the current `Product` document (or, for display of past orders, from the snapshot) — **never** from a client-submitted value. This is enforced at every checkout boundary described in `architecture.md` § 3. Any future feature (bulk discounts, promo codes) must extend the server-side computation, never accept a client-computed total as-is.

### 2.2 Input Validation at Every Boundary

Every Route Handler and Server Action that accepts external input validates it through the corresponding Zod schema in `lib/validations/` **before** touching Mongoose. Mongoose-level validators are a second line of defense, not the first — Zod runs first so malformed input never reaches a database write attempt, and so error messages returned to the client are consistent and controlled rather than leaking Mongoose/MongoDB internals.

### 2.3 RBAC Defense-in-Depth

As established in `project-context.md` § 7.4: middleware gates pages, but every admin-mutating Route Handler independently re-verifies `session.user.role === "admin"` before executing. No handler trusts that middleware already filtered the request.

### 2.4 Payment Signature Verification

`checkout/confirm` must verify the Razorpay signature server-side using HMAC with the secret key before treating a payment as valid — the `razorpaySignature` sent from the client is not trusted on its face, it is *cryptographically checked*. An order is never created on the strength of a client claiming "payment succeeded."

### 2.5 Secrets Management

- All credentials (MongoDB URI, Auth.js secret, Cloudinary API secret, Razorpay key secret) live in `.env.local` / deployment environment variables — never committed, never hardcoded, never logged.
- `NEXTAUTH_SECRET` is a long random value, unique per environment (dev secret ≠ production secret).
- Cloudinary and Razorpay client-side keys (the *public* key IDs) are the only credentials ever exposed to the browser; secret keys stay server-only.

### 2.6 Password Handling

If the credentials provider is used, passwords are hashed (bcrypt or equivalent) before storage — `passwordHash` is never the plaintext password, and plaintext passwords are never logged, even in development console output.

### 2.7 Referential Integrity on Delete

- **Categories:** deleting a category is blocked while any `Product` still references it (`categoryId`) — the admin must reassign or delete dependent products first. Prevents orphaned `categoryId` references breaking catalog filters.
- **Products:** are never hard-deleted once any `Order` references them (directly or via `items[].productId`) — deletion is a soft toggle (`isActive: false`), because a hard delete would break the `$lookup` fallback logic in the analytics pipelines (`database-schema.md` § 7.2) and would contradict the entire snapshot-pattern rationale of preserving purchase history integrity.
- **Users:** account deletion (if ever implemented) must never cascade-delete `Orders` — order records are financial history that outlives the account relationship; this is treated as out of v1 scope specifically because it needs its own retention-policy decision, not because it's unimportant.

### 2.8 Rate Limiting (Minimum Bar)

Login and registration routes carry basic rate limiting (per-IP or per-email attempt throttling) to reduce brute-force risk — flagged as a Phase 7 hardening task in `roadmap.md`, not deferred indefinitely, because it's cheap to add and meaningfully reduces a real attack surface.

### 2.9 Upload Validation

Image uploads to Cloudinary are restricted server-side by file type (image formats only) and size limit before being forwarded — the upload Route Handler is a gate, not a transparent proxy.

---

## 3. Performance Trade-offs

Every architectural choice in this project set has a cost. This section states them honestly rather than pretending the design is free.

| Decision | Benefit | Cost / Trade-off |
|---|---|---|
| Snapshot embedding in `Orders` | Instant order-history reads with zero joins; guaranteed historical accuracy | Slight data duplication (product name/price stored twice — once live, once snapshotted); acceptable because orders are read far more often than products change, and the duplication is the entire point (§ 4 of `database-schema.md`) |
| Referencing `Category` instead of embedding | Category rename is a single-document update, not a mass rewrite across products | Every catalog page needs a `$lookup`/populate to show category name — mitigated by the `{ categoryId: 1 }` index, and acceptable because category data is small and the join is cheap |
| Referencing `Reviews` instead of embedding | `Products` collection stays small and fast for the highest-read-frequency queries (catalog browsing) | Product detail pages need a second query for reviews rather than getting them "for free" in the product read — mitigated by denormalized `ratingAvg`/`ratingCount` on `Product`, so the *common* case (show star rating on a catalog card) never needs the reviews collection at all; only the full review list on the detail page does |
| Multi-document transactions on checkout | Guarantees no overselling, no partial-write corruption | Transactions have higher latency than single-document writes and require a replica set (Atlas provides this by default) — acceptable because checkout is a low-frequency, correctness-critical path, not a high-throughput one |
| Live re-pricing on every cart read | Cart always shows accurate, current prices | One extra `Product` lookup per cart view — negligible at this scale, and the alternative (stale cached prices) is a worse user-facing bug than a marginal query cost |
| Denormalized `ratingAvg`/`ratingCount` | Avoids aggregating the full reviews collection on every catalog render | Must be kept in sync on every new review write (a small write-path complexity cost) — accepted because catalog reads vastly outnumber review submissions |
| No Redis cache layer (v1) | Simpler infrastructure, one fewer moving part to operate/debug | Every catalog request hits MongoDB directly — acceptable at portfolio/demo traffic levels; explicitly flagged in `roadmap.md` as the first thing to add if real traffic ever demanded it |

### 3.1 General Performance Principle Applied

Optimize for the **read pattern that happens most often** (catalog browsing), and accept marginally more expensive **low-frequency, high-stakes** operations (checkout) in exchange for correctness guarantees. This is why the design spends its "complexity budget" on transactions at checkout but deliberately avoids premature caching infrastructure for reads that are already fast enough with proper indexing.

---

## 4. Non-Negotiable Invariants (Quick Reference)

These are the rules a code review should reject a PR for violating, regardless of how the feature is framed:

1. No Route Handler or Server Action ever writes a `price`, `total`, or `stock` value taken directly from client input.
2. No `Order.items[].nameSnapshot` / `priceSnapshot` / `shippingAddressSnapshot` field is ever updated after initial creation — no route exists to edit them, ever.
3. Every Mongoose model has a corresponding Zod schema, and every write path validates through it first.
4. Every admin-only Route Handler independently checks `session.user.role`, even if middleware already gated the route.
5. No hard delete of a `Product` that is referenced by any existing `Order`.
6. No secret key (Mongoose URI, Auth secret, Cloudinary secret, Razorpay secret) appears in client-bundled code or version control.
7. Every foreign-key-style reference field (`categoryId`, `userId`, `productId` across collections) has a corresponding index, per `database-schema.md` § 5.
8. Order status transitions only move along the state machine defined in `architecture.md` § 3.4 — never arbitrarily set.

---

## 5. Engineering Conventions

| Area | Convention |
|---|---|
| Naming | camelCase for fields/variables, PascalCase for Mongoose models/TS types/React components, kebab-case for route folders/URLs |
| Currency values | Stored and computed in whole paise (integer) internally where feasible to avoid floating-point rounding errors in totals; displayed as formatted INR (`₹`) in the UI layer only |
| Dates | Stored as native `Date` (UTC) in MongoDB; formatted for IST display at the presentation layer only — never stored pre-formatted as strings |
| Error responses | Always the `{ success: false, error: { code, message } }` envelope from `architecture.md` § 2 — never a raw stack trace or Mongoose error object returned to the client |
| Zod ↔ TypeScript | Types are inferred from Zod schemas (`z.infer<typeof schema>`) wherever the same shape is used for both validation and typing — avoids maintaining two parallel definitions that can drift |
| Commits | One logical change per commit; commit messages describe *why*, not just *what*, in line with the project's broader engineering-judgment philosophy over copy-paste implementation |

---

## 6. How This Document Set Fits Together

```
project-context.md   →  what & why (product scope, stack reasoning, roles)
architecture.md       →  how it's wired (system design, API contracts, checkout flow, folders)
database-schema.md    →  how data is shaped (collections, embed/reference calls, snapshot, indexes, seed, analytics)
roadmap.md            →  in what order it gets built, with proof-of-done criteria per phase
project-rules.md      →  the rules that must hold true across all of the above, at every phase
```

Any implementation decision that isn't explicitly covered by one of these five files should be resolved by asking: *does this violate the server-authority principle, the snapshot-immutability principle, or the embed/reference heuristic already established?* If yes, it needs a documented exception here before it's built, not after.