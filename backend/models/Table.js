class Table {
  constructor(data) {
    this.id = data.id;
    this.tableNumber = data.tableNumber;
    this.qrSlug = data.qrSlug;
    this.status = data.status || 'idle';
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
  }

  toJSON() {
    return {
      id: this.id,
      tableNumber: this.tableNumber,
      qrSlug: this.qrSlug,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  updateStatus(newStatus) {
    this.status = newStatus;
    this.updatedAt = Date.now();
  }
}

module.exports = Table;

