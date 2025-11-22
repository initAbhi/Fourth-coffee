// Razorpay Payment Integration Service

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.REACT_APP_RAZORPAY_KEY_ID || '';

interface PaymentOptions {
  amount: number; // Amount in rupees (will be converted to paisa)
  currency: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  customerAddress?: string;
  orderDetails?: any;
  tableId?: string;
  tableNumber?: string;
  isCashierOrder?: boolean;
  confirmedBy?: string;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export const initiateRazorpayPayment = async (
  options: PaymentOptions,
  onSuccess: (response: any) => void,
  onError: (error: any) => void
) => {
  try {
    if (!RAZORPAY_KEY_ID) {
      throw new Error('Razorpay Key ID is not configured');
    }

    // Step 1: Request order from backend
    const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
    const res = await fetch(`${API_URL}/payments/createorder`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        amount: options.amount, 
        currency: options.currency || 'INR' 
      })
    });

    if (!res.ok) {
      throw new Error('Failed to create Razorpay order');
    }

    const orderResponse = await res.json();
    if (!orderResponse.success || !orderResponse.data || !orderResponse.data.id) {
      throw new Error(orderResponse.error || 'Order creation failed');
    }

    const razorpayOrder = orderResponse.data;

    // Step 2: Dynamically load Razorpay if not present
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error('Failed to load Razorpay script');
    }

    // Step 3: Define Razorpay options
    const checkoutOptions = {
      key: RAZORPAY_KEY_ID,
      amount: Math.round(options.amount * 100), // Convert to paisa
      currency: options.currency || 'INR',
      name: 'CafeFlow',
      description: 'Order Payment',
      order_id: razorpayOrder.id,
      prefill: {
        name: options.customerName,
        email: options.customerEmail || '',
        contact: options.customerPhone
      },
      notes: {
        address: options.customerAddress || '',
        table: options.tableNumber || '',
      },
      theme: {
        color: '#563315'
      },
      handler: async function (response: RazorpayResponse) {
        try {
          console.log('Razorpay payment response received:', response);
          
          // Step 4: After payment, verify signature on backend
          const verifyRes = await fetch(`${API_URL}/payments/verifypayment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderDetails: options.orderDetails,
              customerInfo: {
                name: options.customerName,
                email: options.customerEmail,
                phone: options.customerPhone,
                address: options.customerAddress
              },
              tableId: options.tableId,
              tableNumber: options.tableNumber,
              isCashierOrder: options.isCashierOrder || false,
              confirmedBy: options.confirmedBy,
            })
          });

          if (!verifyRes.ok) {
            const errorText = await verifyRes.text();
            console.error('Payment verification HTTP error:', verifyRes.status, errorText);
            throw new Error(`Payment verification failed: ${verifyRes.status} ${errorText}`);
          }

          const verify = await verifyRes.json();
          console.log('Payment verification response:', verify);
          
          if (verify.success && verify.isVerified) {
            console.log('Payment verified successfully:', verify);
            onSuccess({ ...response, ...verify.data });
          } else {
            console.error('Payment verification failed:', verify);
            // Even if verification fails, if payment was made, we should still proceed
            // The backend will handle the error appropriately
            onError({ message: verify.error || 'Payment verification failed', ...verify });
          }
        } catch (err: any) {
          console.error('Payment handler error:', err);
          onError(err);
        }
      },
      modal: {
        ondismiss: function () {
          onError({ message: 'Payment popup closed/cancelled' });
        }
      }
    };

    // Step 5: Open Razorpay
    const rzp = new window.Razorpay(checkoutOptions);
    rzp.open();
  } catch (error: any) {
    onError(error);
  }
};

// Verify payment for existing order
export const verifyPaymentForOrder = async (
  orderId: string,
  paymentResponse: RazorpayResponse,
  confirmedBy?: string
): Promise<any> => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
  
  const res = await fetch(`${API_URL}/payments/verifypayment/${orderId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      razorpay_signature: paymentResponse.razorpay_signature,
      confirmedBy: confirmedBy || 'Cashier',
    })
  });

  return await res.json();
};

