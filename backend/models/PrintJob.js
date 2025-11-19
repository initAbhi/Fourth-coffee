class PrintJob {
  constructor(data) {
    this.orderId = data.orderId;
    this.status = data.status || 'queued';
    this.attempts = data.attempts || 0;
    this.lastAttempt = data.lastAttempt;
    this.lastSuccess = data.lastSuccess;
    this.message = data.message || '';
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
  }

  toJSON() {
    return {
      orderId: this.orderId,
      status: this.status,
      attempts: this.attempts,
      lastAttempt: this.lastAttempt,
      lastSuccess: this.lastSuccess,
      message: this.message,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  updateStatus(newStatus, message = '') {
    this.status = newStatus;
    this.message = message;
    this.updatedAt = Date.now();
    if (newStatus === 'printing' || newStatus === 'failed') {
      this.lastAttempt = Date.now();
      this.attempts += 1;
    }
    if (newStatus === 'success') {
      this.lastSuccess = Date.now();
    }
  }
}

module.exports = PrintJob;

