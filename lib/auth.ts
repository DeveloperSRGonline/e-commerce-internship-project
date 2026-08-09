import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import { connectToDB } from "@/lib/db/connect";
import User from "@/models/User.model";
import { loginSchema } from "@/lib/validations/user.schema";

// ──────────────────────────────────────────────────────────────────────────────
// MongoDB client for the adapter (uses native driver, not Mongoose)
// ──────────────────────────────────────────────────────────────────────────────
const client = new MongoClient(process.env.MONGODB_URI!);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(client),
  session: {
    // Database strategy per project-context.md § 7.2: allows server-side invalidation
    strategy: "database",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate input shape first
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        await connectToDB();

        // Look up user by email
        const user = await User.findOne({ email: email.toLowerCase() }).lean();
        if (!user || !user.passwordHash) return null;

        // Compare password hash
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        // Return minimal user object — only what goes into the token/session
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // user is the DB user from the adapter (database strategy)
      if (user && session.user) {
        // Load role from database (adapter user may not have role)
        await connectToDB();
        const dbUser = await User.findById(user.id).lean();
        session.user.userId = user.id;
        session.user.role = (dbUser?.role ?? "customer") as "customer" | "admin";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  trustHost: true,
});

// ──────────────────────────────────────────────────────────────────────────────
// Admin auth guard — call at the top of every admin Route Handler
// Returns a Response (error) if unauthorized, or null if authorized
// ──────────────────────────────────────────────────────────────────────────────
export async function requireAdmin(): Promise<Response | null> {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return Response.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Admin access required" },
      },
      { status: 403 }
    );
  }
  return null; // null = authorized, proceed
}

// ──────────────────────────────────────────────────────────────────────────────
// Customer auth guard — call at the top of customer-only Route Handlers
// Returns null if not authenticated, or the session object if authenticated
// ──────────────────────────────────────────────────────────────────────────────
export async function requireAuth(): Promise<{
  userId: string;
  role: "customer" | "admin";
} | null> {
  const session = await auth();
  if (!session?.user?.userId) {
    return null;
  }
  return { userId: session.user.userId, role: session.user.role };
}
