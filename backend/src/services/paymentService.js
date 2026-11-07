import crypto from "node:crypto";
import { Payment } from "../models/Payment.js";
import { Bill } from "../models/Bill.js";
import { ApiError } from "../utils/ApiError.js";
import * as provider from "./paymentProvider.js";
import * as billingService from "./billingService.js";
import { parsePagination, buildMeta } from "../utils/pagination.js";

export async function payDirect({ userId, amount, method }) {
  const running = await billingService.getRunningBill(userId);

  if (running.outstanding <= 0) {
    throw new ApiError(400, `No outstanding balance. Total: Rs. ${running.total}, Paid: Rs. ${running.totalPaid}.`);
  }
  if (amount > running.outstanding + 0.01) {
    throw new ApiError(400, `Amount Rs. ${amount} exceeds outstanding Rs. ${running.outstanding}`);
  }
  if (amount <= 0) {
    throw new ApiError(400, "Amount must be greater than 0");
  }

  const charge = provider.charge({ amount, userId, billId: null });

  return Payment.create({
    user: userId,
    amount,
    method,
    provider: charge.provider,
    providerRef: charge.providerRef,
    status: charge.status,
    paidAt: charge.paidAt,
    metadata: { type: "direct", month: running.month, year: running.year }
  });
}

export async function initiatePayment({ userId, billId, amount, method }) {
  const bill = await Bill.findById(billId);
  if (!bill) throw new ApiError(404, "Bill not found");
  if (String(bill.user) !== String(userId)) throw new ApiError(403, "Not your bill");
  if (bill.status === "paid") throw new ApiError(409, "Bill already paid");
  if (amount > bill.outstanding) throw new ApiError(400, "Amount exceeds outstanding");

  const charge = provider.charge({ amount, userId, billId });
  const payment = await Payment.create({
    user: userId, bill: bill._id, amount, method,
    provider: charge.provider, providerRef: charge.providerRef,
    status: charge.status, paidAt: charge.paidAt, metadata: charge.metadata
  });

  bill.amountPaid = (bill.amountPaid || 0) + amount;
  bill.outstanding = Math.max(0, bill.total - bill.amountPaid);
  bill.status = bill.outstanding === 0 ? "paid" : "partially_paid";
  await bill.save();
  return payment;
}

export async function listMyPayments(userId) {
  return Payment.find({ user: userId }).sort({ createdAt: -1 }).limit(50).lean();
}

export async function listAllPayments(query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.method) filter.method = query.method;

  const [items, total] = await Promise.all([
    Payment.find(filter).populate("user", "name email studentId").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Payment.countDocuments(filter)
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function getPayment(paymentId, { userId, role }) {
  const p = await Payment.findById(paymentId).populate("bill", "month year total").lean();
  if (!p) throw new ApiError(404, "Payment not found");
  if (role === "student" && String(p.user) !== String(userId)) throw new ApiError(403, "Not your payment");
  return p;
}