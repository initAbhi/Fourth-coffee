class Cashier {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.name = data.name;
    this.passwordHash = data.passwordHash; // In production, use bcrypt
    this.role = data.role || 'cashier';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || Date.now();
    this.lastLogin = data.lastLogin;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      role: this.role,
      isActive: this.isActive,
      createdAt: this.createdAt,
      lastLogin: this.lastLogin,
    };
  }

  updateLastLogin() {
    this.lastLogin = Date.now();
  }

  verifyPassword(password) {
    // Simple password check (in production, use bcrypt.compare)
    return this.passwordHash === password;
  }
}

module.exports = Cashier;

