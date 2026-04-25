const express = require('express');
const router = express.Router();
const { createTicket, getTickets } = require('../controllers/ticketController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createTicket);
router.get('/', protect, getTickets);

module.exports = router;
