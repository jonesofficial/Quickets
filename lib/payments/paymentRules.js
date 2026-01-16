// lib/payments/paymentRules.js

const ALLOWED_TRANSITIONS = {
  INITIATED: ["PENDING", "CANCELLED"],
  PENDING: ["SUCCESS", "FAILED", "EXPIRED"],
  FAILED: ["PENDING", "CANCELLED"],
  SUCCESS: [],
};

function canTransition(from, to) {
  return ALLOWED_TRANSITIONS[from]?.includes(to);
}

module.exports = { canTransition };
