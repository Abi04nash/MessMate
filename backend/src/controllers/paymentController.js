import { sendSuccess } from "../utils/apiResponse.js";
import * as paymentService from "../services/paymentService.js";

export async function pay(req, res, next) {
  try {
    const payment = await paymentService.payDirect({
      userId: req.user._id,
      amount: req.body.amount,
      method: req.body.method
    });
    sendSuccess(res, { statusCode: 201, message: "Payment successful", data: { payment } });
  } catch (err) { next(err); }
}

export async function initiate(req, res, next) {
  try {
    const payment = await paymentService.initiatePayment({
      userId: req.user._id, ...req.body
    });
    sendSuccess(res, { statusCode: 201, message: "Payment successful", data: { payment } });
  } catch (err) { next(err); }
}

export async function my(req, res, next) {
  try {
    const payments = await paymentService.listMyPayments(req.user._id);
    sendSuccess(res, { data: { payments } });
  } catch (err) { next(err); }
}

export async function all(req, res, next) {
  try {
    const { items, meta } = await paymentService.listAllPayments(req.query);
    sendSuccess(res, { data: { payments: items }, meta });
  } catch (err) { next(err); }
}

export async function detail(req, res, next) {
  try {
    const payment = await paymentService.getPayment(req.params.id, { userId: req.user._id, role: req.user.role });
    sendSuccess(res, { data: { payment } });
  } catch (err) { next(err); }
}