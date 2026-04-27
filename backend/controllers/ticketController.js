const Ticket = require('../models/Ticket');
const ParchiType = require('../models/ParchiType');
const { v4: uuidv4 } = require('uuid');

// Batch create tickets from serial range
exports.createBatchTickets = async (req, res) => {
  try {
    const { entries, shift } = req.body;
    // entries: [{ parchiTypeId, fromSerial, toSerial }]

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, message: 'Entries array required' });
    }
    if (!shift) {
      return res.status(400).json({ success: false, message: 'Shift is required' });
    }

    const batchId = uuidv4();
    const allTickets = [];
    const summary = [];

    for (const entry of entries) {
      const { parchiTypeId, fromSerial, toSerial } = entry;

      if (!parchiTypeId || fromSerial == null || toSerial == null) {
        return res.status(400).json({ success: false, message: 'parchiTypeId, fromSerial, toSerial required for each entry' });
      }
      if (Number(fromSerial) > Number(toSerial)) {
        return res.status(400).json({ success: false, message: 'fromSerial must be <= toSerial' });
      }

      const parchiType = await ParchiType.findOne({ _id: parchiTypeId, isActive: true });
      if (!parchiType) {
        return res.status(404).json({ success: false, message: `Parchi type not found or inactive: ${parchiTypeId}` });
      }

      const from = Number(fromSerial);
      const to = Number(toSerial);
      const count = to - from + 1;

      const tickets = [];
      for (let serial = from; serial <= to; serial++) {
        const paddedSerial = String(serial).padStart(6, '0');
        const serialNumber = parchiType.prefix
          ? `${parchiType.prefix}-${paddedSerial}`
          : paddedSerial;

        tickets.push({
          serialNumber,
          serialIndex: serial,
          parchiTypeId: parchiType._id,
          parchiTypeName: parchiType.name,
          amount: parchiType.amount,
          operatorId: req.user._id,
          operatorName: req.user.name,
          shift,
          batchId,
        });
      }

      allTickets.push(...tickets);
      summary.push({
        parchiTypeName: parchiType.name,
        prefix: parchiType.prefix,
        fromSerial: from,
        toSerial: to,
        count,
        amount: parchiType.amount,
        totalAmount: count * parchiType.amount,
      });
    }

    // Insert all tickets (will throw on duplicate serial)
    await Ticket.insertMany(allTickets, { ordered: false });

    const grandTotal = summary.reduce((sum, s) => sum + s.totalAmount, 0);

    res.status(201).json({
      success: true,
      batchId,
      summary,
      grandTotal,
      totalTickets: allTickets.length,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Some serial numbers already exist. Please check your ranges.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTickets = async (req, res) => {
  try {
    const { page = 1, limit = 20, operatorId, parchiTypeId, startDate, endDate, shift } = req.query;
    const filter = {};

    if (req.user.role === 'operator') filter.operatorId = req.user._id;
    else if (operatorId) filter.operatorId = operatorId;

    if (parchiTypeId) filter.parchiTypeId = parchiTypeId;
    if (shift) filter.shift = shift;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const total = await Ticket.countDocuments(filter);
    const tickets = await Ticket.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('operatorId', 'name email')
      .populate('parchiTypeId', 'name amount prefix color');

    res.json({
      success: true,
      data: tickets,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get batch summary grouped by batchId (useful for reporting)
exports.getBatchSummary = async (req, res) => {
  try {
    const { startDate, endDate, operatorId, shift } = req.query;
    const match = {};

    if (req.user.role === 'operator') match.operatorId = req.user._id;
    else if (operatorId) match.operatorId = new require('mongoose').Types.ObjectId(operatorId);

    if (shift) match.shift = shift;
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        match.createdAt.$lte = end;
      }
    }

    const batches = await Ticket.aggregate([
      { $match: match },
      { $group: {
        _id: { batchId: '$batchId', parchiTypeId: '$parchiTypeId' },
        parchiTypeName: { $first: '$parchiTypeName' },
        operatorName: { $first: '$operatorName' },
        shift: { $first: '$shift' },
        count: { $sum: 1 },
        revenue: { $sum: '$amount' },
        minSerial: { $min: '$serialIndex' },
        maxSerial: { $max: '$serialIndex' },
        date: { $first: '$createdAt' },
      }},
      { $sort: { date: -1 } }
    ]);

    res.json({ success: true, data: batches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
