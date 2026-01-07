function formatAmount(amount) {
  return `₹${Number(amount).toFixed(2)}`;
}

function now() {
  return Date.now();
}

module.exports = {
  formatAmount,
  now,
};
