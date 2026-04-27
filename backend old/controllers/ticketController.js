const Ticket = require('../models/Ticket');
const ParchiType = require('../models/ParchiType');

exports.createTicket = async (req, res) => {
  try {
    const { parchiTypeId } = req.body;
    if (!parchiTypeId) return res.status(400).json({ success: false, message: 'Parchi type required' });

    // Atomically increment serial number - concurrency safe
    const parchiType = await ParchiType.findOneAndUpdate(
      { _id: parchiTypeId, isActive: true },
      { $inc: { currentSerial: 1 } },
      { new: true }
    );

    if (!parchiType) {
      return res.status(404).json({ success: false, message: 'Parchi type not found or inactive' });
    }

    const paddedSerial = String(parchiType.currentSerial).padStart(6, '0');
    const serialNumber = parchiType.prefix
      ? `${parchiType.prefix}-${paddedSerial}`
      : paddedSerial;

    const ticket = await Ticket.create({
      serialNumber,
      parchiTypeId: parchiType._id,
      parchiTypeName: parchiType.name,
      amount: parchiType.amount,
      operatorId: req.user._id,
      operatorName: req.user.name,
    });

    res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTickets = async (req, res) => {
  try {
    const { page = 1, limit = 20, operatorId, parchiTypeId, startDate, endDate } = req.query;
    const filter = {};

    if (req.user.role === 'operator') filter.operatorId = req.user._id;
    else if (operatorId) filter.operatorId = operatorId;

    if (parchiTypeId) filter.parchiTypeId = parchiTypeId;
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
