"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { connectToDB } from "@/lib/db/connect";
import User from "@/models/User.model";
import { registerSchema } from "@/lib/validations/user.schema";

export interface RegisterState {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
    general?: string[];
  };
  success?: boolean;
}

export async function registerAction(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const rawData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  // Validate input through Zod schema
  const parsed = registerSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors as RegisterState["errors"],
    };
  }

  const { name, email, password } = parsed.data;

  // Confirm password match
  if (rawData.confirmPassword !== password) {
    return {
      errors: { confirmPassword: ["Passwords do not match"] },
    };
  }

  await connectToDB();

  // Check if email already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() }).lean();
  if (existingUser) {
    return {
      errors: { email: ["An account with this email already exists"] },
    };
  }

  // Hash the password server-side — plaintext never stored or logged
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user with customer role — role is NEVER trusted from client
  await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: "customer",
  });

  redirect("/login?registered=true");
}
