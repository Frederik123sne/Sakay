// node/controllers/contact.controller.js
// Contact Us Controller - Handles contact form submissions

const ContactModel = require('../models/contact.model');

class ContactController {
  /**
   * Submit a contact form message
   * POST /api/passenger/contact OR /api/driver/contact
   */
  static async submitMessage(req, res) {
    try {
      const { name, email, message } = req.body;

      // Validation
      if (!name || !email || !message) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required (name, email, message)'
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // Name validation (2-100 characters)
      if (name.trim().length < 2 || name.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Name must be between 2 and 100 characters'
        });
      }

      // Message validation (10-1000 characters)
      if (message.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Message must be at least 10 characters long'
        });
      }

      if (message.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Message must not exceed 1000 characters'
        });
      }

      // Create message
      const newMessage = await ContactModel.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        message: message.trim()
      });

      return res.status(201).json({
        success: true,
        message: 'Your message has been sent successfully. We will get back to you soon!',
        data: {
          messageID: newMessage.messageID,
          created_at: newMessage.created_at
        }
      });

    } catch (error) {
      console.error('Error submitting contact message:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit message. Please try again later.'
      });
    }
  }

  /**
   * Get all messages (Admin only)
   * GET /api/admin/contact/messages
   */
  static async getAllMessages(req, res) {
    try {
      const { status, dateFrom, dateTo } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;

      const messages = await ContactModel.getAll(filters);

      return res.status(200).json({
        success: true,
        data: messages,
        count: messages.length
      });

    } catch (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch messages'
      });
    }
  }

  /**
   * Get message by ID (Admin only)
   * GET /api/admin/contact/messages/:messageID
   */
  static async getMessageById(req, res) {
    try {
      const { messageID } = req.params;

      const message = await ContactModel.getById(messageID);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      // Mark as read if status is 'new'
      if (message.status === 'new') {
        await ContactModel.updateStatus(messageID, 'read');
        message.status = 'read';
      }

      return res.status(200).json({
        success: true,
        data: message
      });

    } catch (error) {
      console.error('Error fetching message:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch message'
      });
    }
  }

  /**
   * Update message status (Admin only)
   * PUT /api/admin/contact/messages/:messageID/status
   */
  static async updateMessageStatus(req, res) {
    try {
      const { messageID } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      const validStatuses = ['new', 'read', 'replied'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be: new, read, or replied'
        });
      }

      const updated = await ContactModel.updateStatus(messageID, status);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Message status updated successfully'
      });

    } catch (error) {
      console.error('Error updating message status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update message status'
      });
    }
  }

  /**
   * Delete message (Admin only)
   * DELETE /api/admin/contact/messages/:messageID
   */
  static async deleteMessage(req, res) {
    try {
      const { messageID } = req.params;

      const deleted = await ContactModel.delete(messageID);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Message deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting message:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete message'
      });
    }
  }

  /**
   * Get message statistics (Admin only)
   * GET /api/admin/contact/stats
   */
  static async getStatistics(req, res) {
    try {
      const stats = await ContactModel.getCountByStatus();

      return res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error fetching statistics:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics'
      });
    }
  }
}

module.exports = ContactController;