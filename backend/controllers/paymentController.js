const paymentService = require('../services/paymentService');
const orderService = require('../services/orderService');
const customerService = require('../services/customerService');

class PaymentController {
  // Create Razorpay order
  async createOrder(req, res) {
    try {
      const { amount, currency = 'INR' } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount is required and must be greater than 0',
        });
      }

      const razorpayOrder = await paymentService.createRazorpayOrder(amount, currency);

      res.json({
        success: true,
        data: razorpayOrder,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Verify payment and create order
  async verifyPayment(req, res) {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        orderDetails,
        customerInfo,
        tableId,
        tableNumber,
        isCashierOrder = false,
        confirmedBy,
      } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          error: 'Razorpay payment details are required',
        });
      }

      // Verify payment signature
      const isVerified = paymentService.verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (!isVerified) {
        return res.json({
          success: false,
          isVerified: false,
          error: 'Payment signature verification failed',
        });
      }

      // If orderDetails is provided, create order
      if (orderDetails) {
        try {
          const { items, total, customizations, customerPhone, customerName } = orderDetails;

          // Get or create customer
          let customerId = null;
          if (customerPhone) {
            let customer = await customerService.getCustomerByPhone(customerPhone);
            if (!customer) {
              customer = await customerService.createCustomer({
                phone: customerPhone,
                name: customerName || 'Guest Customer',
              });
            }
            customerId = customer.id;
          }

          // Create order
          const orderData = {
            tableId,
            tableNumber,
            items,
            customizations: customizations || [],
            total,
            paymentMethod: 'Razorpay',
            customerName,
            customerPhone,
            isCashierOrder,
            confirmedBy,
          };

          const order = await orderService.createOrder(orderData);

          // Create payment record
          await paymentService.createPaymentRecord({
            orderId: order.id,
            customerId,
            amount: total,
            paymentMethod: 'Razorpay',
            paymentType: 'razorpay',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            gateway: 'razorpay',
            status: 'completed',
            currency: 'INR',
            confirmedBy: confirmedBy || (isCashierOrder ? 'Cashier' : 'Customer'),
          });

          // Award loyalty points (1 point = ₹1)
          if (customerId && total > 0) {
            const points = Math.floor(total);
            if (points > 0) {
              await customerService.addLoyaltyPoints(
                customerId,
                points,
                order.id,
                `Points earned for order ${order.orderNumber}`
              );
            }
          }

          return res.json({
            success: true,
            isVerified: true,
            data: {
              orderId: order.id,
              orderNumber: order.orderNumber,
              razorpay_order_id,
              razorpay_payment_id,
            },
          });
        } catch (error) {
          console.error('Error creating order after payment:', error);
          return res.status(500).json({
            success: false,
            isVerified: true,
            error: 'Payment verified but order creation failed',
            message: error.message,
          });
        }
      } else {
        // Just verify payment without creating order
        return res.json({
          success: true,
          isVerified: true,
          message: 'Payment verified successfully',
        });
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Verify payment for existing order
  async verifyPaymentForOrder(req, res) {
    try {
      const { orderId } = req.params;
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        confirmedBy,
      } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          error: 'Razorpay payment details are required',
        });
      }

      // Verify payment signature
      const isVerified = paymentService.verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (!isVerified) {
        return res.json({
          success: false,
          isVerified: false,
          error: 'Payment signature verification failed',
        });
      }

      // Get order
      const order = await orderService.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        });
      }

      // Create payment record
      await paymentService.createPaymentRecord({
        orderId: order.id,
        customerId: order.customerId,
        amount: order.total,
        paymentMethod: 'Razorpay',
        paymentType: 'razorpay',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        gateway: 'razorpay',
        status: 'completed',
        currency: 'INR',
        confirmedBy: confirmedBy || 'Cashier',
      });

      // Update order payment status
      await orderService.confirmPayment(orderId, {
        paymentMethod: 'Razorpay',
        confirmedBy: confirmedBy || 'Cashier',
      });

      return res.json({
        success: true,
        isVerified: true,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          razorpay_order_id,
          razorpay_payment_id,
        },
      });
    } catch (error) {
      console.error('Payment verification error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new PaymentController();

