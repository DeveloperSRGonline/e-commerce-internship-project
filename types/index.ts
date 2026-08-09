// Extend NextAuth session types to include userId and role
// Per actionable.md § 2.1.3
declare module "next-auth" {
  interface Session {
    user: {
      userId: string;
      role: "customer" | "admin";
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role?: "customer" | "admin";
  }
}

export {};
