const express = require('express');
const router = express.Router();
const adminMessagesController = require('../controllers/adminMessagesController');

router.get('/', adminMessagesController.getMessages);
router.get('/unread-count', adminMessagesController.getUnreadCount);
router.post('/', adminMessagesController.createMessage);
router.patch('/:id/read', adminMessagesController.markAsRead);

module.exports = router;

