import express from 'express';
import db from '../db';

const router = express.Router();

// Get Accounts Receivable
router.get('/receivable', (req, res) => {
  const { companyId, branchId } = req.query;
  if (!companyId) return res.status(400).json({ error: 'Company ID is required' });

  let query = `
    SELECT r.*, c.name as customer_name
    FROM accounts_receivable r
    JOIN customers c ON r.customer_id = c.id
    WHERE r.company_id = ?
  `;
  const params: any[] = [companyId];

  if (branchId) {
    query += " AND r.branch_id = ?";
    params.push(branchId);
  }

  query += " ORDER BY r.due_date ASC";

  const items = db.prepare(query).all(...params);
  res.json(items);
});

// Get Accounts Payable
router.get('/payable', (req, res) => {
  const { companyId, branchId } = req.query;
  if (!companyId) return res.status(400).json({ error: 'Company ID is required' });

  let query = `SELECT * FROM accounts_payable WHERE company_id = ?`;
  const params: any[] = [companyId];

  if (branchId) {
    query += " AND branch_id = ?";
    params.push(branchId);
  }

  query += " ORDER BY due_date ASC";

  const items = db.prepare(query).all(...params);
  res.json(items);
});

// Pay/Receive account
router.put('/:type/:id/pay', (req, res) => {
  const { type, id } = req.params;
  const table = type === 'receivable' ? 'accounts_receivable' : 'accounts_payable';
  
  try {
    db.prepare(`
      UPDATE ${table} 
      SET status = 'paid', payment_date = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(id);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

export default router;
