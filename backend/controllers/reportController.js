const Ticket = require('../models/Ticket');
const User = require('../models/User');
const ParchiType = require('../models/ParchiType');

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalTickets, todayTickets, monthTickets, totalRevenueAgg, todayRevenueAgg, monthRevenueAgg, recentTickets, ticketsByType] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ createdAt: { $gte: today, $lte: todayEnd } }),
      Ticket.countDocuments({ createdAt: { $gte: thisMonthStart } }),
      Ticket.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Ticket.aggregate([{ $match: { createdAt: { $gte: today, $lte: todayEnd } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Ticket.aggregate([{ $match: { createdAt: { $gte: thisMonthStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Ticket.find().sort({ createdAt: -1 }).limit(10).populate('operatorId', 'name'),
      Ticket.aggregate([
        { $group: { _id: '$parchiTypeId', name: { $first: '$parchiTypeName' }, count: { $sum: 1 }, revenue: { $sum: '$amount' } } },
        { $sort: { count: -1 } }
      ])
    ]);

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const dEnd = new Date(d);
      dEnd.setHours(23, 59, 59, 999);
      const dayTickets = await Ticket.aggregate([
        { $match: { createdAt: { $gte: d, $lte: dEnd } } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$amount' } } }
      ]);
      last7Days.push({
        date: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
        count: dayTickets[0]?.count || 0,
        revenue: dayTickets[0]?.revenue || 0,
      });
    }

    res.json({
      success: true,
      data: {
        totalTickets,
        todayTickets,
        monthTickets,
        totalRevenue: totalRevenueAgg[0]?.total || 0,
        todayRevenue: todayRevenueAgg[0]?.total || 0,
        monthRevenue: monthRevenueAgg[0]?.total || 0,
        recentTickets,
        ticketsByType,
        last7Days,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOperatorStats = async (req, res) => {
  try {
    const stats = await Ticket.aggregate([
      { $group: { _id: '$operatorId', name: { $first: '$operatorName' }, count: { $sum: 1 }, revenue: { $sum: '$amount' } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDailyReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};
    if (startDate) match.createdAt = { $gte: new Date(startDate) };
    if (endDate) {
      if (!match.createdAt) match.createdAt = {};
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      match.createdAt.$lte = end;
    }

    const daily = await Ticket.aggregate([
      { $match: match },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        revenue: { $sum: '$amount' }
      }},
      { $sort: { _id: -1 } }
    ]);
    res.json({ success: true, data: daily });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
