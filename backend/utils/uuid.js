const { randomUUID } = require('crypto');

function generateId() {
  return randomUUID();
}

function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
}

module.exports = {
  generateId,
  generateOrderNumber,
};

