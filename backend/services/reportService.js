const pool = require('../config/db');
const { generateId } = require('../utils/uuid');

class ReportService {
  // Generate daily report
  async generateDailyReport(date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const startDate = new Date(targetDate + 'T00:00:00');
    const endDate = new Date(targetDate + 'T23:59:59');

    return await this.generateReport('daily', startDate, endDate);
  }

  // Generate weekly report
  async generateWeeklyReport(startDate = null) {
    const date = startDate ? new Date(startDate) : new Date();
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek;
    const weekStart = new Date(date.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return await this.generateReport('weekly', weekStart, weekEnd);
  }

  // Generate monthly report
  async generateMonthlyReport(year = null, month = null) {
    const date = new Date();
    if (year && month) {
      date.setFullYear(year, month - 1, 1);
    }
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    return await this.generateReport('monthly', monthStart, monthEnd);
  }

  // Generate report
  async generateReport(reportType, startDate, endDate) {
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);

    // Revenue summary
    const revenueResult = await pool.query(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(total) as total_revenue,
        SUM(CASE WHEN payment_status = 'paid' THEN total ELSE 0 END) as paid_revenue,
        SUM(CASE WHEN payment_status = 'unpaid' THEN total ELSE 0 END) as unpaid_revenue
      FROM orders
      WHERE created_at >= to_timestamp($1) AND created_at <= to_timestamp($2)`,
      [startTimestamp, endTimestamp]
    );

    // Payment methods breakdown
    const paymentMethodsResult = await pool.query(
      `SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(total) as amount
      FROM orders
      WHERE payment_status = 'paid' 
        AND created_at >= to_timestamp($1) 
        AND created_at <= to_timestamp($2)
      GROUP BY payment_method`,
      [startTimestamp, endTimestamp]
    );

    // Paid vs unpaid tables
    const tablesResult = await pool.query(
      `SELECT 
        COUNT(DISTINCT CASE WHEN payment_status = 'paid' THEN table_id END) as paid_tables,
        COUNT(DISTINCT CASE WHEN payment_status = 'unpaid' THEN table_id END) as unpaid_tables,
        COUNT(DISTINCT table_id) as total_tables_with_orders
      FROM orders
      WHERE created_at >= to_timestamp($1) AND created_at <= to_timestamp($2)
        AND status IN ('pending', 'approved')`,
      [startTimestamp, endTimestamp]
    );

    // Refund logs
    const refundsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_refunds,
        SUM(amount) as total_refund_amount,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_refunds,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_refunds,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_refunds
      FROM refunds
      WHERE created_at >= to_timestamp($1) AND created_at <= to_timestamp($2)`,
      [startTimestamp, endTimestamp]
    );

    // Loyalty points summary
    const loyaltyPointsResult = await pool.query(
      `SELECT 
        SUM(CASE WHEN transaction_type = 'earned' THEN points ELSE 0 END) as total_earned,
        SUM(CASE WHEN transaction_type = 'redeemed' THEN points ELSE 0 END) as total_redeemed,
        COUNT(CASE WHEN transaction_type = 'earned' THEN 1 END) as earned_transactions,
        COUNT(CASE WHEN transaction_type = 'redeemed' THEN 1 END) as redeemed_transactions
      FROM loyalty_point_transactions
      WHERE created_at >= to_timestamp($1) AND created_at <= to_timestamp($2)`,
      [startTimestamp, endTimestamp]
    );

    // Wallet transactions
    const walletResult = await pool.query(
      `SELECT 
        COUNT(CASE WHEN transaction_type = 'topup' THEN 1 END) as total_topups,
        COUNT(CASE WHEN transaction_type = 'topup' AND status = 'pending' THEN 1 END) as pending_topups,
        COUNT(CASE WHEN transaction_type = 'topup' AND status = 'approved' THEN 1 END) as approved_topups,
        SUM(CASE WHEN transaction_type = 'topup' AND status = 'approved' THEN amount ELSE 0 END) as total_topup_amount,
        SUM(CASE WHEN transaction_type = 'payment' THEN amount ELSE 0 END) as total_wallet_payments,
        SUM(CASE WHEN transaction_type = 'refund' THEN amount ELSE 0 END) as total_wallet_refunds
      FROM wallet_transactions
      WHERE created_at >= to_timestamp($1) AND created_at <= to_timestamp($2)`,
      [startTimestamp, endTimestamp]
    );

    // Customization usage trends
    const customizationsResult = await pool.query(
      `SELECT 
        customizations
      FROM orders
      WHERE created_at >= to_timestamp($1) AND created_at <= to_timestamp($2)
        AND customizations IS NOT NULL AND customizations != '[]'::jsonb`,
      [startTimestamp, endTimestamp]
    );

    // Analyze customizations
    const customizationStats = {};
    customizationsResult.rows.forEach(row => {
      const customizations = typeof row.customizations === 'string' 
        ? JSON.parse(row.customizations) 
        : row.customizations;
      
      if (Array.isArray(customizations)) {
        customizations.forEach(custom => {
          if (custom.type) {
            customizationStats[custom.type] = (customizationStats[custom.type] || 0) + 1;
          }
        });
      }
    });

    const report = {
      reportType,
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
      generatedAt: new Date().toISOString(),
      revenue: {
        totalOrders: parseInt(revenueResult.rows[0]?.total_orders || 0),
        totalRevenue: parseFloat(revenueResult.rows[0]?.total_revenue || 0),
        paidRevenue: parseFloat(revenueResult.rows[0]?.paid_revenue || 0),
        unpaidRevenue: parseFloat(revenueResult.rows[0]?.unpaid_revenue || 0),
      },
      paymentMethods: paymentMethodsResult.rows.map(row => ({
        method: row.payment_method,
        count: parseInt(row.count),
        amount: parseFloat(row.amount),
      })),
      tables: {
        paidTables: parseInt(tablesResult.rows[0]?.paid_tables || 0),
        unpaidTables: parseInt(tablesResult.rows[0]?.unpaid_tables || 0),
        totalTablesWithOrders: parseInt(tablesResult.rows[0]?.total_tables_with_orders || 0),
      },
      refunds: {
        total: parseInt(refundsResult.rows[0]?.total_refunds || 0),
        totalAmount: parseFloat(refundsResult.rows[0]?.total_refund_amount || 0),
        approved: parseInt(refundsResult.rows[0]?.approved_refunds || 0),
        pending: parseInt(refundsResult.rows[0]?.pending_refunds || 0),
        rejected: parseInt(refundsResult.rows[0]?.rejected_refunds || 0),
      },
      loyaltyPoints: {
        totalEarned: parseInt(loyaltyPointsResult.rows[0]?.total_earned || 0),
        totalRedeemed: parseInt(loyaltyPointsResult.rows[0]?.total_redeemed || 0),
        earnedTransactions: parseInt(loyaltyPointsResult.rows[0]?.earned_transactions || 0),
        redeemedTransactions: parseInt(loyaltyPointsResult.rows[0]?.redeemed_transactions || 0),
      },
      wallet: {
        totalTopups: parseInt(walletResult.rows[0]?.total_topups || 0),
        pendingTopups: parseInt(walletResult.rows[0]?.pending_topups || 0),
        approvedTopups: parseInt(walletResult.rows[0]?.approved_topups || 0),
        totalTopupAmount: parseFloat(walletResult.rows[0]?.total_topup_amount || 0),
        totalPayments: parseFloat(walletResult.rows[0]?.total_wallet_payments || 0),
        totalRefunds: parseFloat(walletResult.rows[0]?.total_wallet_refunds || 0),
      },
      customizations: customizationStats,
    };

    // Save report to database
    const reportId = generateId();
    await pool.query(
      `INSERT INTO reports (id, report_type, period_start, period_end, data)
       VALUES ($1, $2, to_timestamp($3), to_timestamp($4), $5)`,
      [reportId, reportType, startTimestamp, endTimestamp, JSON.stringify(report)]
    );

    return report;
  }

  // Get saved reports
  async getSavedReports(reportType = null, limit = 50) {
    let query = 'SELECT * FROM reports WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (reportType) {
      query += ` AND report_type = $${paramCount++}`;
      params.push(reportType);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + paramCount;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows.map(row => ({
      id: row.id,
      reportType: row.report_type,
      periodStart: row.period_start,
      periodEnd: row.period_end,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
      createdAt: row.created_at,
      createdBy: row.created_by,
    }));
  }
}

module.exports = new ReportService();

