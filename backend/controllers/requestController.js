const Request = require('../models/Request');
const { validateRequest } = require('../utils/validation');

const requestController = {
  // Create a new request (deposit or withdraw)
  async createRequest(req, res) {
    try {
      const { type, smp_amount, usdt_amount, address_wallet } = req.body;
      const user_id = req.user.id;

      // Validate request data
      const validation = validateRequest({
        type,
        smp_amount,
        usdt_amount,
        address_wallet
      });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      // Create the request
      const request = await Request.create({
        user_id,
        type,
        smp_amount: parseFloat(smp_amount),
        usdt_amount: parseFloat(usdt_amount),
        address_wallet
      });

      res.status(201).json({
        success: true,
        message: 'Request created successfully',
        data: {
          id: request.id,
          type: request.type,
          smp_amount: request.smp_amount,
          usdt_amount: request.usdt_amount,
          address_wallet: request.address_wallet,
          status: request.status,
          created_at: request.created_at
        }
      });

    } catch (error) {
      console.error('Error creating request:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get user's requests
  async getUserRequests(req, res) {
    try {
      const user_id = req.user.id;
      const requests = await Request.findByUserId(user_id);

      res.json({
        success: true,
        data: requests
      });

    } catch (error) {
      console.error('Error fetching user requests:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get specific request by ID
  async getRequestById(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      const request = await Request.findById(id);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Request not found'
        });
      }

      // Check if user owns this request (unless admin)
      if (request.user_id !== user_id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: request
      });

    } catch (error) {
      console.error('Error fetching request:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Update request status (admin only)
  async updateRequestStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      // Validate status
      const validStatuses = ['pending', 'success', 'failed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be pending, success, or failed'
        });
      }

      const request = await Request.findById(id);
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Request not found'
        });
      }

      const updated = await Request.updateStatus(id, status);

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'Failed to update request status'
        });
      }

      res.json({
        success: true,
        message: 'Request status updated successfully',
        data: { id, status }
      });

    } catch (error) {
      console.error('Error updating request status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get all requests (admin only)
  async getAllRequests(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const requests = await Request.getAll();

      res.json({
        success: true,
        data: requests
      });

    } catch (error) {
      console.error('Error fetching all requests:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get pending requests (admin only)
  async getPendingRequests(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const requests = await Request.getPendingRequests();

      res.json({
        success: true,
        data: requests
      });

    } catch (error) {
      console.error('Error fetching pending requests:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
};

module.exports = requestController; 