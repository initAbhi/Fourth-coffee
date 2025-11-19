const { printJobs } = require('../config/database');
const PrintJob = require('../models/PrintJob');
const { generateId } = require('../utils/uuid');

let instance = null;

class PrinterService {
  constructor(io) {
    this.io = io;
    this.printQueue = [];
    this.isProcessing = false;
    this.printerStatus = 'online';
    this.lastSuccess = null;
    this.lastError = null;
    instance = this;
  }

  // Simulate printer health
  getHealth() {
    return {
      status: this.printerStatus,
      queueLength: this.printQueue.length,
      lastSuccess: this.lastSuccess,
      lastError: this.lastError,
    };
  }

  // Queue a print job
  queuePrint(orderId) {
    if (!printJobs.has(orderId)) {
      const job = new PrintJob({
        orderId,
        status: 'queued',
        message: 'Waiting to print',
      });
      printJobs.set(orderId, job);
    }

    this.printQueue.push(orderId);
    this.io.emit('printer:update', {
      orderId,
      status: 'queued',
      health: this.getHealth(),
    });

    this.processQueue();
  }

  // Process print queue
  async processQueue() {
    if (this.isProcessing || this.printQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.printQueue.length > 0) {
      const orderId = this.printQueue.shift();
      await this.print(orderId);
    }

    this.isProcessing = false;
  }

  // Simulate printing
  async print(orderId, attempt = 0) {
    const job = printJobs.get(orderId);
    if (!job) return;

    // Simulate offline state (10% chance)
    if (Math.random() < 0.1 && attempt === 0) {
      this.printerStatus = 'offline';
      this.lastError = 'Printer offline';
      job.updateStatus('offline', 'Printer offline — queued');
      this.io.emit('printer:update', {
        orderId,
        status: 'offline',
        health: this.getHealth(),
      });
      // Retry after 5 seconds
      setTimeout(() => {
        this.printerStatus = 'online';
        this.queuePrint(orderId);
      }, 5000);
      return;
    }

    job.updateStatus('printing', 'Printing KOT...');
    this.io.emit('printer:update', {
      orderId,
      status: 'printing',
      health: this.getHealth(),
    });

    // Simulate print delay
    const delay = 1000 + attempt * 500;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Simulate print failure (15% chance, max 3 attempts)
    const shouldFail = attempt < 3 && Math.random() < 0.15;

    if (shouldFail) {
      job.updateStatus('failed', 'Print failed — retrying');
      this.printerStatus = 'degraded';
      this.lastError = 'Print failed';
      this.io.emit('printer:update', {
        orderId,
        status: 'failed',
        health: this.getHealth(),
      });

      // Retry with exponential backoff
      setTimeout(() => {
        this.print(orderId, attempt + 1);
      }, Math.pow(2, attempt) * 1000);
      return;
    }

    // Success
    job.updateStatus('success', 'Printed successfully');
    this.printerStatus = 'online';
    this.lastSuccess = Date.now();
    this.lastError = null;
    this.io.emit('printer:update', {
      orderId,
      status: 'success',
      health: this.getHealth(),
    });
  }

  // Retry a failed print job
  retryPrint(orderId) {
    const job = printJobs.get(orderId);
    if (!job) return false;

    if (job.status === 'failed' || job.status === 'offline') {
      this.queuePrint(orderId);
      return true;
    }

    return false;
  }

  // Get print status for an order
  getPrintStatus(orderId) {
    const job = printJobs.get(orderId);
    return job ? job.toJSON() : null;
  }
}

module.exports = PrinterService;
module.exports.getInstance = () => instance;

