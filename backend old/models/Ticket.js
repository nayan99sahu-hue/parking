const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  serialNumber: { type: String, required: true, unique: true },
  parchiTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParchiType', required: true },
  parchiTypeName: { type: String, required: true },
  amount: { type: Number, required: true },
  operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  operatorName: { type: String, required: true },
}, { timestamps: true });

ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ operatorId: 1 });
ticketSchema.index({ parchiTypeId: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
