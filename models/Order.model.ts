import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { IAddress } from "./User.model";

export interface IOrderItemSnapshot {
  productId: Types.ObjectId;
  nameSnapshot: string;
  priceSnapshot: number;
  quantity: number;
  lineTotal: number;
}

export interface IPayment {
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: "created" | "paid" | "failed" | "refunded";
}

export interface IOrder extends Document {
  userId: Types.ObjectId;
  items: IOrderItemSnapshot[];
  shippingAddressSnapshot: IAddress;
  subtotal: number;
  tax: number;
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  payment: IPayment;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSnapshotSchema = new Schema<IOrderItemSnapshot>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    nameSnapshot: { type: String, required: true },
    priceSnapshot: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ShippingAddressSnapshotSchema = new Schema<IAddress>(
  {
    label: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const PaymentSchema = new Schema<IPayment>(
  {
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    status: {
      type: String,
      enum: ["created", "paid", "failed", "refunded"],
      default: "created",
    },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [OrderItemSnapshotSchema], required: true },
    shippingAddressSnapshot: { type: ShippingAddressSnapshotSchema, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    payment: { type: PaymentSchema, default: () => ({ status: "created" }) },
  },
  {
    timestamps: true,
  }
);

// Indexes per database-schema.md § 5 & actionable.md § 1.7.2
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ "payment.razorpayOrderId": 1 });

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
