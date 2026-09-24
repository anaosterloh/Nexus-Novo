import express from 'express';
import db from '../db';

const router = express.Router();

// Get all purchase requests for a company
router.get('/', (req, res) => {
  const { companyId } = req.query;
  if (!companyId) return res.status(400).json({ error: 'Company ID is required' });

  const requests = db.prepare(`
    SELECT pr.*, i.description as item_name, i.code as item_code, b.name as branch_name, u.name as requester_name
    FROM purchase_requests pr
    JOIN inventory_items i ON pr.item_id = i.id
    JOIN branches b ON pr.branch_id = b.id
    JOIN users u ON pr.requester_id = u.id
    WHERE pr.company_id = ?
    ORDER BY pr.created_at DESC
  `).all(companyId);

  res.json(requests);
});

// Create a new purchase request (e.g. from backorder)
router.post('/', (req, res) => {
  const { companyId, branchId, itemId, quantity, reason, requesterId, priority } = req.body;
  
  try {
    db.prepare(`
      INSERT INTO purchase_requests (id, company_id, branch_id, item_id, quantity, reason, requester_id, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `pr_${Date.now()}`,
      companyId,
      branchId,
      itemId,
      quantity,
      reason,
      requesterId || 'user_1',
      priority || 'normal'
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create purchase request' });
  }
});

export default router;
