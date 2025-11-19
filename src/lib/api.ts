const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.0.106:4000/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Tables
  async getTables() {
    return this.request<any[]>('/tables');
  }

  async createTable(data: { tableNumber: string; qrSlug?: string }) {
    return this.request<any>('/tables', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTableById(id: string) {
    return this.request<any>(`/tables/${id}`);
  }

  async getTableBySlug(slug: string) {
    return this.request<any>(`/tables/slug/${slug}`);
  }

  async createTable(data: { tableNumber: string; qrSlug?: string }) {
    return this.request<any>('/tables', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTableStatus(id: string, status: string) {
    return this.request<any>(`/tables/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async resetTable(id: string) {
    return this.request<any>(`/tables/${id}/reset`, {
      method: 'POST',
    });
  }

  // Orders
  async getOrders(params?: { status?: string; tableId?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.tableId) query.append('tableId', params.tableId);
    const queryString = query.toString();
    return this.request<any[]>(`/orders${queryString ? `?${queryString}` : ''}`);
  }

  async getOrderById(id: string) {
    return this.request<any>(`/orders/${id}`);
  }

  async createOrder(data: {
    table: string;
    items: Array<{ name: string; quantity: number; price: number; modifiers?: string[] }>;
    total: number;
    paymentMethod?: string;
    customerName?: string;
    customerPhone?: string;
    customerNotes?: string;
    customizations?: Array<{ type: string; value: string }>;
    isCashierOrder?: boolean;
    confirmedBy?: string;
  }) {
    return this.request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async confirmPayment(orderId: string, data: {
    paymentMethod: string;
    isManualFlag?: boolean;
    cardMachineUsed?: boolean;
    notes?: string;
    confirmedBy?: string;
  }) {
    return this.request<any>(`/orders/${orderId}/payment`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTablesWithPaymentStatus() {
    return this.request<any[]>('/orders/tables/payment-status');
  }

  async confirmOrder(id: string, actor?: string) {
    return this.request<any>(`/orders/${id}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ actor }),
    });
  }

  async rejectOrder(id: string, reason?: string, actor?: string) {
    return this.request<any>(`/orders/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, actor }),
    });
  }

  async markOrderServed(id: string, actor?: string) {
    return this.request<any>(`/orders/${id}/serve`, {
      method: 'POST',
      body: JSON.stringify({ actor }),
    });
  }

  // Printer
  async getPrinterHealth() {
    return this.request<any>('/printer/health');
  }

  async getPrintStatus(orderId: string) {
    return this.request<any>(`/printer/status/${orderId}`);
  }

  async retryPrint(orderId: string) {
    return this.request<any>(`/printer/retry/${orderId}`, {
      method: 'POST',
    });
  }

  // QR Codes
  async getQRCodeForTable(tableId: string) {
    return this.request<{
      qrCode: string;
      url: string;
      tableNumber: string;
      tableSlug: string;
    }>(`/qr/table/${tableId}`);
  }

  async getAllQRCodes() {
    return this.request<Array<{
      tableId: string;
      tableNumber: string;
      tableSlug: string;
      qrCode: string;
      url: string;
    }>>('/qr/all');
  }

  async getQRCodeInfo(tableId: string) {
    return this.request<{
      url: string;
      tableNumber: string;
      tableSlug: string;
    }>(`/qr/table/${tableId}/info`);
  }

  // Authentication
  async login(userId: string, password: string) {
    return this.request<{
      sessionId: string;
      cashier: {
        id: string;
        userId: string;
        name: string;
        role: string;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ userId, password }),
    });
  }

  async verifySession(sessionId: string) {
    return this.request<{
      cashier: {
        userId: string;
        name: string;
        role: string;
      };
    }>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }

  async logout(sessionId: string) {
    return this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }

  // Customers
  async getCustomerProfile(customerId: string) {
    return this.request<any>(`/customers/${customerId}/profile`);
  }

  async getCustomerByPhone(phone: string) {
    return this.request<any>(`/customers/phone/${phone}`);
  }

  async getLoyaltyPointTransactions(customerId: string, limit?: number) {
    const query = limit ? `?limit=${limit}` : '';
    return this.request<any[]>(`/customers/${customerId}/loyalty-points${query}`);
  }

  // Top-up offers
  async getTopupOffers() {
    return this.request<any[]>('/topup/offers');
  }

  async processTopup(customerId: string, amount: number, offerId?: string) {
    return this.request<any>('/topup/process', {
      method: 'POST',
      body: JSON.stringify({ customerId, amount, offerId }),
    });
  }

  // Refunds
  async getRefunds(params?: { status?: string; orderId?: string; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.orderId) query.append('orderId', params.orderId);
    if (params?.limit) query.append('limit', params.limit.toString());
    const queryString = query.toString();
    return this.request<any[]>(`/refunds${queryString ? `?${queryString}` : ''}`);
  }

  async getRefundById(id: string) {
    return this.request<any>(`/refunds/${id}`);
  }

  async createRefundRequest(data: {
    orderId: string;
    amount?: number;
    reason: string;
    requestedBy: string;
  }) {
    return this.request<any>('/refunds', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approveRefund(refundId: string, approvedBy: string) {
    return this.request<any>(`/refunds/${refundId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approvedBy }),
    });
  }

  async rejectRefund(refundId: string, rejectedBy: string, rejectionReason: string) {
    return this.request<any>(`/refunds/${refundId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectedBy, rejectionReason }),
    });
  }

  // Reports
  async generateDailyReport(date?: string) {
    const query = date ? `?date=${date}` : '';
    return this.request<any>(`/reports/daily${query}`);
  }

  async generateWeeklyReport(startDate?: string) {
    const query = startDate ? `?startDate=${startDate}` : '';
    return this.request<any>(`/reports/weekly${query}`);
  }

  async generateMonthlyReport(year?: number, month?: number) {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<any>(`/reports/monthly${query}`);
  }

  async getSavedReports(reportType?: string, limit?: number) {
    const params = new URLSearchParams();
    if (reportType) params.append('reportType', reportType);
    if (limit) params.append('limit', limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/reports/saved${query}`);
  }

  // Products
  async getProducts(params?: { category?: string; popular?: boolean }) {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.popular) query.append('popular', 'true');
    const queryString = query.toString();
    return this.request<any[]>(`/products${queryString ? `?${queryString}` : ''}`);
  }

  async getProductById(id: string) {
    return this.request<any>(`/products/${id}`);
  }

  async getCategories() {
    return this.request<any[]>('/products/categories');
  }

  async getProductOptions(type?: string) {
    const query = type ? `?type=${type}` : '';
    return this.request<any[]>(`/products/options${query}`);
  }

  // Customer Authentication
  async customerLogin(phone: string, name?: string) {
    return this.request<{
      sessionId: string;
      customer: {
        id: string;
        phone: string;
        name: string;
      };
      loyaltyPoints: any;
      wallet: any;
    }>('/customer-auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, name }),
    });
  }

  async verifyCustomerSession(sessionId: string) {
    return this.request<{
      customer: {
        id: string;
        phone: string;
        name: string;
      };
    }>('/customer-auth/verify', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }

  // Wastage
  async getWastageEntries(params?: { limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    const queryString = query.toString();
    return this.request<any[]>(`/wastage${queryString ? `?${queryString}` : ''}`);
  }

  async createWastageEntry(data: {
    itemName: string;
    category: string;
    quantity: number;
    unit?: string;
    reason: string;
    recordedBy?: string;
  }) {
    return this.request<any>('/wastage', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteWastageEntry(id: string) {
    return this.request<any>(`/wastage/${id}`, {
      method: 'DELETE',
    });
  }

  // Audit Trail
  async getAuditLogs(params?: {
    limit?: number;
    offset?: number;
    action?: string;
    actor?: string;
    entityType?: string;
    search?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    if (params?.action) query.append('action', params.action);
    if (params?.actor) query.append('actor', params.actor);
    if (params?.entityType) query.append('entityType', params.entityType);
    if (params?.search) query.append('search', params.search);
    const queryString = query.toString();
    return this.request<any[]>(`/audit-trail${queryString ? `?${queryString}` : ''}`);
  }

  async getAuditFilterOptions() {
    return this.request<{
      actions: string[];
      actors: string[];
      entityTypes: string[];
    }>('/audit-trail/filters');
  }

  async createAuditLog(data: {
    action: string;
    actor: string;
    entityType: string;
    entityId: string;
    details?: string;
    ipAddress?: string;
  }) {
    return this.request<any>('/audit-trail', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin Messages
  async getMessages(params?: {
    to?: string;
    read?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.to) query.append('to', params.to);
    if (params?.read !== undefined) query.append('read', params.read.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    const queryString = query.toString();
    return this.request<any[]>(`/admin-messages${queryString ? `?${queryString}` : ''}`);
  }

  async createMessage(data: {
    fromUser: string;
    toUser: string;
    subject: string;
    message: string;
    priority?: 'low' | 'medium' | 'high';
  }) {
    return this.request<any>('/admin-messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async markMessageAsRead(id: string) {
    return this.request<any>(`/admin-messages/${id}/read`, {
      method: 'PATCH',
    });
  }

  async getUnreadMessageCount(to?: string) {
    const query = to ? `?to=${to}` : '';
    return this.request<{ count: number }>(`/admin-messages/unread-count${query}`);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

