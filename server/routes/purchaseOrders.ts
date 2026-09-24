import express from 'express';
import db from '../db';

const router = express.Router();

// Get all purchase orders
router.get('/', (req, res) => {
  const { companyId, branchId } = req.query;
  if (!companyId) return res.status(400).json({ error: 'Company ID is required' });

  let query = `
    SELECT o.*, u.name as user_name
    FROM purchase_orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.company_id = ?
  `;
  const params: any[] = [companyId];

  if (branchId) {
    query += " AND o.branch_id = ?";
    params.push(branchId);
  }

  query += " ORDER BY o.created_at DESC";

  const orders = db.prepare(query).all(...params);
  res.json(orders);
});

// Create a new purchase order
router.post('/', (req, res) => {
  const { companyId, branchId, supplierId, carrierId, items, notes, installments } = req.body;
  const userId = 'user_1'; // Hardcoded for now

  const orderId = `po_${Date.now()}`;
  
  const db_exec = db.transaction(() => {
    // 1. Create order
    db.prepare(`
      INSERT INTO purchase_orders (id, company_id, branch_id, supplier_id, carrier_id, user_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(orderId, companyId, branchId, supplierId, carrierId, userId, notes);

    let totalAmount = 0;

    // 2. Create items
    for (const item of items) {
      const itemTotal = item.quantity * item.unitCost;
      totalAmount += itemTotal;
      
      db.prepare(`
        INSERT INTO purchase_order_items (id, order_id, item_id, quantity, unit_cost, total_cost)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(`poi_${Date.now()}_${Math.random()}`, orderId, item.itemId, item.quantity, item.unitCost, itemTotal);
    }

    // 3. Update total amount
    db.prepare('UPDATE purchase_orders SET total_amount = ? WHERE id = ?').run(totalAmount, orderId);
  });

  try {
    db_exec();
    res.json({ success: true, id: orderId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

// Confirm purchase order, move stock and generate Accounts Payable
router.put('/:orderId/confirm', (req, res) => {
  const { orderId } = req.params;
  const { installments } = req.body; // Array of { dueDate, amount }

  const db_exec = db.transaction(() => {
    const order = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(orderId) as any;
    if (!order) throw new Error('Order not found');
    if (order.status !== 'draft') throw new Error('Order is already confirmed');

    // 1. Update status
    db.prepare("UPDATE purchase_orders SET status = 'confirmed' WHERE id = ?").run(orderId);

    // 2. Move Stock (Entry)
    const items = db.prepare('SELECT * FROM purchase_order_items WHERE order_id = ?').all(orderId) as any[];
    for (const item of items) {
      const balance = db.prepare('SELECT quantity FROM stock_balances WHERE branch_id = ? AND item_id = ?').get(order.branch_id, item.item_id) as { quantity: number } | undefined;
      const currentQty = balance ? balance.quantity : 0;
      const newQty = currentQty + item.quantity;

      // Update or Insert balance
      if (balance) {
        db.prepare('UPDATE stock_balances SET quantity = ? WHERE branch_id = ? AND item_id = ?')
          .run(newQty, order.branch_id, item.item_id);
      } else {
        db.prepare('INSERT INTO stock_balances (branch_id, item_id, quantity) VALUES (?, ?, ?)')
          .run(order.branch_id, item.item_id, newQty);
      }

      // Record movement
      db.prepare(`
        INSERT INTO stock_movements (id, branch_id, item_id, user_id, type, quantity, previous_balance, new_balance, reason, reference_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `mov_entry_${Date.now()}_${Math.random()}`,
        order.branch_id,
        item.item_id,
        order.user_id,
        'entry',
        item.quantity,
        currentQty,
        newQty,
        `Compra Pedido ${orderId}`,
        orderId
      );
    }

    // 3. Generate Accounts Payable
    if (installments && installments.length > 0) {
      for (let i = 0; i < installments.length; i++) {
        const inst = installments[i];
        db.prepare(`
          INSERT INTO accounts_payable (id, company_id, branch_id, description, amount, due_date)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          `pay_${orderId}_${i+1}`,
          order.company_id,
          order.branch_id,
          `Compra Pedido ${orderId} - Parcela ${i+1}/${installments.length}`,
          inst.amount,
          inst.dueDate
        );
      }
    } else {
      // Default: 1 installment in 30 days
      db.prepare(`
        INSERT INTO accounts_payable (id, company_id, branch_id, description, amount, due_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        `pay_${orderId}_1`,
        order.company_id,
        order.branch_id,
        `Compra Pedido ${orderId}`,
        order.total_amount,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      );
    }
  });

  try {
    db_exec();
    res.json({ success: true });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
