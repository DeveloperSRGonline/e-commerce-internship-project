import { z } from "zod";

export const addressSchema = z.object({
  label: z.string().min(1, "Label is required"),
  line1: z.string().min(1, "Address Line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(1, "Pincode is required"),
  isDefault: z.boolean().default(false),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const userZodSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  passwordHash: z.string().optional(),
  role: z.enum(["customer", "admin"]).default("customer"),
  addresses: z.array(addressSchema).default([]),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type AddressType = z.infer<typeof addressSchema>;
export type RegisterType = z.infer<typeof registerSchema>;
export type LoginType = z.infer<typeof loginSchema>;
export type UserType = z.infer<typeof userZodSchema>;
