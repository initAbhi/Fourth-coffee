class Order {
  constructor(data) {
    this.id = data.id;
    this.orderNumber = data.orderNumber;
    this.tableId = data.tableId;
    this.tableNumber = data.tableNumber;
    this.items = data.items || [];
    this.total = data.total || 0;
    this.status = data.status || 'pending';
    this.paymentMethod = data.paymentMethod;
    this.customerName = data.customerName;
    this.customerPhone = data.customerPhone;
    this.customerNotes = data.customerNotes;
    this.createdAt = data.createdAt || Date.now();
    this.approvedAt = data.approvedAt;
    this.servedAt = data.servedAt;
    this.timeline = data.timeline || [];
  }

  toJSON() {
    return {
      id: this.id,
      orderNumber: this.orderNumber,
      tableId: this.tableId,
      tableNumber: this.tableNumber,
      items: this.items,
      total: this.total,
      status: this.status,
      paymentMethod: this.paymentMethod,
      customerName: this.customerName,
      customerPhone: this.customerPhone,
      customerNotes: this.customerNotes,
      createdAt: this.createdAt,
      approvedAt: this.approvedAt,
      servedAt: this.servedAt,
      timeline: this.timeline,
    };
  }

  addTimelineEntry(action, actor = 'System', notes = '') {
    this.timeline.push({
      action,
      actor,
      notes,
      timestamp: Date.now(),
    });
  }

  approve(actor = 'Cashier') {
    this.status = 'approved';
    this.approvedAt = Date.now();
    this.addTimelineEntry('Order Approved', actor);
  }

  reject(actor = 'Cashier', reason = '') {
    this.status = 'rejected';
    this.addTimelineEntry('Order Rejected', actor, reason);
  }

  markServed(actor = 'Cashier') {
    this.status = 'served';
    this.servedAt = Date.now();
    this.addTimelineEntry('Order Served', actor);
  }
}

module.exports = Order;

