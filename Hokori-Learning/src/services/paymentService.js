import api from "../configs/axios";

// Checkout from cart (creates PayOS payment link or enrolls free courses)
export async function checkout(cartId, courseIds = null) {
  try {
    const res = await api.post("payment/checkout", {
      cartId,
      courseIds: courseIds && courseIds.length ? courseIds : null,
    });
    return res.data; // Expect shape per .md spec
  } catch (err) {
    const status = err.response?.status;
    const message = err.normalizedMessage || err.message || "Checkout failed";
    const error = { status, message };
    throw error;
  }
}

// Payment history for current user
export async function getMyPayments({ page = 0, size = 20, sort = "createdAt,desc" } = {}) {
  try {
    const res = await api.get(`payment/my-payments`, {
      params: { page, size, sort },
    });
    return res.data?.data; // Page<PaymentResponse>
  } catch (err) {
    const message = err.normalizedMessage || err.message || "Failed to load payments";
    throw new Error(message);
  }
}

// Payment detail by ID
export async function getPaymentById(paymentId) {
  try {
    const res = await api.get(`payment/${paymentId}`);
    return res.data?.data;
  } catch (err) {
    const message = err.normalizedMessage || err.message || "Failed to load payment";
    throw new Error(message);
  }
}

// Payment detail by orderCode (used on returnUrl/cancelUrl)
export async function getPaymentByOrderCode(orderCode) {
  try {
    const res = await api.get(`payment/order/${orderCode}`);
    return res.data?.data;
  } catch (err) {
    const message = err.normalizedMessage || err.message || "Failed to load payment by order";
    throw new Error(message);
  }
}
