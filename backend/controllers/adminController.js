const pool = require('../config/db');
const { generateId } = require('../utils/uuid');

class AdminController {
  // Get global dashboard metrics (Sky View)
  async getGlobalDashboard(req, res) {
    try {
      // Calculate global averages for all metrics
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastWeek = new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get all orders for current week
      const currentWeekOrders = await pool.query(
        `SELECT * FROM orders 
         WHERE created_at >= $1 AND created_at < $2 
         AND payment_status = 'paid'`,
        [weekAgo, now]
      );

      // Get all orders for last week
      const lastWeekOrders = await pool.query(
        `SELECT * FROM orders 
         WHERE created_at >= $1 AND created_at < $2 
         AND payment_status = 'paid'`,
        [lastWeek, weekAgo]
      );

      // Calculate profitability metrics
      const currentRevenue = currentWeekOrders.rows.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
      const lastWeekRevenue = lastWeekOrders.rows.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
      const revenueDelta = lastWeekRevenue > 0 ? ((currentRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0;

      // Calculate profit (simplified: assume 60% margin)
      const currentProfit = currentRevenue * 0.6;
      const lastWeekProfit = lastWeekRevenue * 0.6;
      const profitDelta = lastWeekProfit > 0 ? ((currentProfit - lastWeekProfit) / lastWeekProfit) * 100 : 0;

      // Profitability Health Score (0-100)
      const profitabilityScore = Math.min(100, Math.max(0, 50 + (profitDelta * 0.5)));

      // Inventory Health Score (based on central inventory)
      const inventoryData = await pool.query(
        `SELECT 
          COUNT(*) as total_skus,
          SUM(CASE WHEN status = 'low_stock' OR status = 'out_of_stock' THEN 1 ELSE 0 END) as low_stock_count,
          AVG(freshness_percentage) as avg_freshness
         FROM central_inventory`
      );
      const invRow = inventoryData.rows[0];
      const lowStockRatio = invRow.total_skus > 0 ? (invRow.low_stock_count / invRow.total_skus) : 0;
      const inventoryScore = Math.min(100, Math.max(0, (parseFloat(invRow.avg_freshness || 100)) - (lowStockRatio * 30)));

      // Customer Satisfaction Score (based on feedback)
      const feedbackData = await pool.query(
        `SELECT AVG(rating) as avg_rating, COUNT(*) as feedback_count
         FROM customer_feedback
         WHERE created_at >= $1`,
        [weekAgo]
      );
      const avgRating = parseFloat(feedbackData.rows[0].avg_rating || 3.5);
      const satisfactionScore = Math.min(100, (avgRating / 5) * 100);

      // Get all cafes with their metrics
      const cafes = await pool.query('SELECT * FROM cafes WHERE is_active = TRUE');
      const cafeMetrics = [];

      // For now, since we don't have cafe_id in orders, we'll distribute orders evenly or use all orders
      // In production, orders should be linked to cafes
      const ordersPerCafe = Math.floor(currentWeekOrders.rows.length / Math.max(cafes.rows.length, 1));
      
      for (let i = 0; i < cafes.rows.length; i++) {
        const cafe = cafes.rows[i];
        // Distribute orders evenly for demo purposes
        const startIdx = i * ordersPerCafe;
        const endIdx = i === cafes.rows.length - 1 ? currentWeekOrders.rows.length : (i + 1) * ordersPerCafe;
        const cafeOrders = currentWeekOrders.rows.slice(startIdx, endIdx);
        const cafeRevenue = cafeOrders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
        const cafeProfit = cafeRevenue * 0.6;

        // Calculate cafe-specific scores (simplified)
        const cafeProfitabilityScore = cafeRevenue > 0 ? Math.min(100, Math.max(0, 50 + ((cafeRevenue / Math.max(currentRevenue, 1)) * 50))) : 50;
        const cafeInventoryScore = inventoryScore; // Use global for now
        const cafeSatisfactionScore = satisfactionScore; // Use global for now

        const overallHealth = (cafeProfitabilityScore + cafeInventoryScore + cafeSatisfactionScore) / 3;

        cafeMetrics.push({
          id: cafe.id,
          name: cafe.name,
          location: cafe.address,
          managerName: cafe.manager_name,
          profitabilityScore: Math.round(cafeProfitabilityScore),
          inventoryScore: Math.round(cafeInventoryScore),
          satisfactionScore: Math.round(cafeSatisfactionScore),
          overallHealth: Math.round(overallHealth),
          revenue: cafeRevenue,
          profit: cafeProfit,
          orderCount: cafeOrders.length,
        });
      }

      res.json({
        success: true,
        data: {
          globalMetrics: {
            profitability: {
              score: Math.round(profitabilityScore),
              delta: Math.round(profitDelta * 10) / 10,
              revenue: currentRevenue,
              profit: currentProfit,
            },
            inventory: {
              score: Math.round(inventoryScore),
              avgFreshness: parseFloat(invRow.avg_freshness || 100),
              lowStockCount: parseInt(invRow.low_stock_count || 0),
              totalSKUs: parseInt(invRow.total_skus || 0),
            },
            satisfaction: {
              score: Math.round(satisfactionScore),
              avgRating: avgRating,
              feedbackCount: parseInt(feedbackData.rows[0].feedback_count || 0),
            },
          },
          cafes: cafeMetrics,
          lastUpdated: new Date().toISOString(),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get cafe detail metrics
  async getCafeDetail(req, res) {
    try {
      const { cafeId } = req.params;
      const { period = 'week' } = req.query;

      // Get cafe info
      const cafeResult = await pool.query('SELECT * FROM cafes WHERE id = $1', [cafeId]);
      if (cafeResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Cafe not found',
        });
      }
      const cafe = cafeResult.rows[0];

      // Calculate date range
      const now = new Date();
      let startDate, endDate, previousStartDate, previousEndDate;
      
      if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo;
        endDate = now;
        previousStartDate = new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousEndDate = weekAgo;
      } else if (period === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthAgo;
        endDate = now;
        previousStartDate = new Date(monthAgo.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousEndDate = monthAgo;
      } else {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
      }

      // Get orders for current period
      const ordersResult = await pool.query(
        `SELECT * FROM orders 
         WHERE created_at >= $1 AND created_at < $2 
         AND payment_status = 'paid'
         ORDER BY created_at DESC`,
        [startDate, endDate]
      );

      // Get orders for previous period
      const previousOrdersResult = await pool.query(
        `SELECT * FROM orders 
         WHERE created_at >= $1 AND created_at < $2 
         AND payment_status = 'paid'`,
        [previousStartDate, previousEndDate]
      );

      const orders = ordersResult.rows;
      const previousOrders = previousOrdersResult.rows;

      // Calculate profitability metrics
      const revenue = orders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
      const previousRevenue = previousOrders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
      const revenueDelta = previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0;

      const profit = revenue * 0.6; // Simplified margin
      const previousProfit = previousRevenue * 0.6;
      const profitDelta = previousProfit > 0 ? ((profit - previousProfit) / previousProfit) * 100 : 0;

      // Calculate AOV
      const aov = orders.length > 0 ? revenue / orders.length : 0;
      const previousAov = previousOrders.length > 0 ? previousRevenue / previousOrders.length : 0;
      const aovDelta = previousAov > 0 ? ((aov - previousAov) / previousAov) * 100 : 0;

      // Get refunds
      const refundsResult = await pool.query(
        `SELECT SUM(amount) as total_refunds, COUNT(*) as refund_count
         FROM refunds
         WHERE created_at >= $1 AND created_at < $2 AND status = 'approved'`,
        [startDate, endDate]
      );
      const totalRefunds = parseFloat(refundsResult.rows[0].total_refunds || 0);
      const refundRate = revenue > 0 ? (totalRefunds / revenue) * 100 : 0;

      // Calculate items sold
      let totalItems = 0;
      orders.forEach(order => {
        const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
        items.forEach(item => {
          totalItems += item.quantity || 0;
        });
      });

      // Product performance
      const productPerformance = {};
      orders.forEach(order => {
        const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
        items.forEach(item => {
          if (!productPerformance[item.name]) {
            productPerformance[item.name] = {
              name: item.name,
              sku: item.sku || 'N/A',
              unitsSold: 0,
              totalRevenue: 0,
              avgPrice: 0,
              costPrice: item.costPrice || item.price * 0.4, // Assume 40% cost
              margin: 0,
              profit: 0,
            };
          }
          productPerformance[item.name].unitsSold += item.quantity || 0;
          productPerformance[item.name].totalRevenue += (item.price || 0) * (item.quantity || 0);
        });
      });

      // Calculate margins and profits
      Object.keys(productPerformance).forEach(name => {
        const product = productPerformance[name];
        product.avgPrice = product.unitsSold > 0 ? product.totalRevenue / product.unitsSold : 0;
        product.margin = product.avgPrice - product.costPrice;
        product.marginPercent = product.avgPrice > 0 ? (product.margin / product.avgPrice) * 100 : 0;
        product.profit = product.margin * product.unitsSold;
      });

      // Sort by profit contribution
      const productPerformanceArray = Object.values(productPerformance)
        .sort((a, b) => b.profit - a.profit)
        .map((product, index) => ({
          ...product,
          rank: index + 1,
          profitContribution: profit > 0 ? (product.profit / profit) * 100 : 0,
        }));

      // Inventory metrics
      const inventoryResult = await pool.query(
        `SELECT 
          COUNT(*) as total_skus,
          AVG(freshness_percentage) as avg_freshness,
          SUM(CASE WHEN status = 'low_stock' THEN 1 ELSE 0 END) as low_stock_count,
          SUM(CASE WHEN expiry_date < CURRENT_TIMESTAMP + INTERVAL '3 days' THEN 1 ELSE 0 END) as expiring_soon
         FROM central_inventory`
      );
      const invRow = inventoryResult.rows[0];

      // Customer satisfaction metrics
      const feedbackResult = await pool.query(
        `SELECT 
          AVG(rating) as avg_rating,
          COUNT(*) as feedback_count,
          SUM(CASE WHEN is_complaint = TRUE THEN 1 ELSE 0 END) as complaint_count
         FROM customer_feedback
         WHERE created_at >= $1 AND created_at < $2`,
        [startDate, endDate]
      );
      const feedbackRow = feedbackResult.rows[0];
      const avgRating = parseFloat(feedbackRow.avg_rating || 3.5);
      const satisfactionScore = (avgRating / 5) * 100;
      const complaintsPer100Orders = orders.length > 0 ? (parseInt(feedbackRow.complaint_count || 0) / orders.length) * 100 : 0;

      // Revenue trend (daily breakdown)
      const revenueTrend = [];
      const daysDiff = Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000));
      for (let i = 0; i < daysDiff; i++) {
        const dayStart = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        const dayOrders = orders.filter(o => {
          const orderDate = new Date(o.created_at);
          return orderDate >= dayStart && orderDate < dayEnd;
        });
        const dayRevenue = dayOrders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
        revenueTrend.push({
          date: dayStart.toISOString().split('T')[0],
          revenue: dayRevenue,
          orders: dayOrders.length,
        });
      }

      res.json({
        success: true,
        data: {
          cafe: {
            id: cafe.id,
            name: cafe.name,
            address: cafe.address,
            managerName: cafe.manager_name,
            managerPhone: cafe.manager_phone,
            totalEmployees: cafe.total_employees,
            lastSync: cafe.last_sync,
          },
          profitability: {
            overview: {
              totalRevenue: revenue,
              revenueDelta: Math.round(revenueDelta * 10) / 10,
              totalProfit: profit,
              profitDelta: Math.round(profitDelta * 10) / 10,
              aov: Math.round(aov * 100) / 100,
              aovDelta: Math.round(aovDelta * 10) / 10,
              orderCount: orders.length,
              totalItemsSold: totalItems,
              grossMargin: 60, // Simplified
              refundRate: Math.round(refundRate * 100) / 100,
            },
            productPerformance: productPerformanceArray,
            revenueTrend,
          },
          inventory: {
            freshnessScore: Math.round(parseFloat(invRow.avg_freshness || 100)),
            wastageScore: 0, // TODO: Calculate from wastage_log
            activeSKUs: parseInt(invRow.total_skus || 0),
            lowStockAlerts: parseInt(invRow.low_stock_count || 0),
            expiringSoon: parseInt(invRow.expiring_soon || 0),
          },
          satisfaction: {
            score: Math.round(satisfactionScore),
            avgRating: Math.round(avgRating * 10) / 10,
            feedbackCount: parseInt(feedbackRow.feedback_count || 0),
            complaintsPer100Orders: Math.round(complaintsPer100Orders * 10) / 10,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get cafes list
  async getCafes(req, res) {
    try {
      const result = await pool.query(
        'SELECT * FROM cafes WHERE is_active = TRUE ORDER BY name'
      );
      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new AdminController();

