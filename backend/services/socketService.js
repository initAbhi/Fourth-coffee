let instance = null;

class SocketService {
  constructor(io) {
    this.io = io;
    this.setupSocketHandlers();
    instance = this;
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Send initial state
      socket.emit('initial-state', {
        message: 'Connected to CafeFlow backend',
        timestamp: Date.now(),
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });

      // Join cashier room for real-time updates
      socket.on('join:cashier', () => {
        socket.join('cashier');
        console.log('Cashier joined:', socket.id);
      });

      // Join kitchen room for KOT updates
      socket.on('join:kitchen', () => {
        socket.join('kitchen');
        console.log('Kitchen joined:', socket.id);
      });
    });
  }

  // Emit order update to cashiers
  emitOrderUpdate(order) {
    this.io.to('cashier').emit('order:update', order);
  }

  // Emit new order notification
  emitNewOrder(order) {
    this.io.to('cashier').emit('order:new', order);
  }

  // Emit KOT update to kitchen
  emitKOTUpdate(order, printStatus) {
    this.io.to('kitchen').emit('kot:update', {
      order,
      printStatus,
    });
  }
}

module.exports = SocketService;
module.exports.getInstance = () => instance;

