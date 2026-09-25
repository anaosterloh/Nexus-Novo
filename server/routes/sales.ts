import express from 'express';
import db from '../db';
import { applyStockPositionDelta } from '../services/stockPositions';

const router = express.Router();

// Get all customers for a company
router.get('/customers', (req, res) => {
  const { companyId } = req.query;
  if (!companyId) return res.status(400).json({ error: 'Company ID is required' });

  // Fallback map format to legacy customers expecting format
  const customers = db.prepare(`
    SELECT id, company_id, display_name as name, document, email, phone, status, created_at 
    FROM entities 
    WHERE company_id = ? AND is_customer = 1 AND status = 'active'
  `).all(companyId);
  res.json(customers);
});

// Create a new customer
router.post('/customers', (req, res) => {
  const { companyId, name, document, email, phone } = req.body;
  
  try {
    const id = `cust_${Date.now()}`;
    const runInsert = db.transaction(() => {
      // Create in Entities
      const isQuickRegister = !document ? 1 : 0;
      const reviewStatus = isQuickRegister ? 'pending_review' : 'approved';
      const docStatus = isQuickRegister ? 'pending' : 'not_checked';
      const entityStatus = isQuickRegister ? 'temporary' : 'active';
      
      db.prepare(`
        INSERT INTO entities (id, company_id, display_name, legal_name, document, email, phone, is_customer, created_from, quick_register, review_status, documentation_status, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'legacy_post_customers', ?, ?, ?, ?)
      `).run(id, companyId, name, name, document || null, email || null, phone || null, isQuickRegister, reviewStatus, docStatus, entityStatus);

      // Keep customers in sync if safe to do so
      // 'customers' table has a NOT NULL constraint on document
      if (document) {
        db.prepare(`
          INSERT INTO customers (id, company_id, name, document, email, phone)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(id, companyId, name, document, email, phone);
      }
    });

    runInsert();
    res.json({ success: true, id });
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Documento (CPF/CNPJ) já cadastrado.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Get all sales orders
router.get('/orders', (req, res) => {
  const { companyId, branchId } = req.query;
  if (!companyId) return res.status(400).json({ error: 'Company ID is required' });

  let query = `
    SELECT o.*, c.name as customer_name, u.name as user_name, b.name as branch_name
    FROM sales_orders o
    JOIN customers c ON o.customer_id = c.id
    JOIN users u ON o.user_id = u.id
    JOIN branches b ON o.branch_id = b.id
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

// Get sales order details
router.get('/orders/:orderId', (req, res) => {
  const { orderId } = req.params;

  const order = db.prepare(`
    SELECT o.*, c.name as customer_name, c.document as customer_doc, u.name as user_name, b.name as branch_name
    FROM sales_orders o
    JOIN customers c ON o.customer_id = c.id
    JOIN users u ON o.user_id = u.id
    JOIN branches b ON o.branch_id = b.id
    WHERE o.id = ?
  `).get(orderId) as any;

  if (!order) return res.status(404).json({ error: 'Order not found' });

  const items = db.prepare(`
    SELECT oi.*, i.description as item_name, i.code as item_code
    FROM sales_order_items oi
    JOIN inventory_items i ON oi.item_id = i.id
    WHERE oi.order_id = ?
  `).all(orderId);

  res.json({ ...order, items });
});

// Confirm sales order and deduct stock
router.put('/orders/:orderId/confirm', (req, res) => {
  const { orderId } = req.params;

  const db_exec = db.transaction(() => {
    // 1. Get order and items
    const order = db.prepare('SELECT * FROM sales_orders WHERE id = ?').get(orderId) as any;
    if (!order) throw new Error('Order not found');
    if (order.status !== 'draft') throw new Error('Order is already confirmed or cancelled');

    const items = db.prepare('SELECT * FROM sales_order_items WHERE order_id = ?').all(orderId) as any[];

    // 2. Deduct stock for each item
    for (const item of items) {
      const balance = db.prepare('SELECT quantity FROM stock_balances WHERE branch_id = ? AND item_id = ?').get(order.branch_id, item.item_id) as { quantity: number } | undefined;
      const currentQty = balance ? balance.quantity : 0;
      const newQty = currentQty - item.quantity;

      // Update balance
      db.prepare('UPDATE stock_balances SET quantity = ? WHERE branch_id = ? AND item_id = ?')
        .run(newQty, order.branch_id, item.item_id);

      // Deduct from physical stock positions (SALDO LEGADO / NÃO ALOCADO em AVAILABLE)
      applyStockPositionDelta({
        companyId: order.company_id,
        branchId: order.branch_id,
        itemId: item.item_id,
        deltaQuantity: -item.quantity,
        state: 'AVAILABLE',
        lotId: null
      });

      // Record movement
      db.prepare(`
        INSERT INTO stock_movements (id, branch_id, item_id, user_id, type, quantity, previous_balance, new_balance, reason, reference_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `mov_exit_${Date.now()}_${Math.random()}`,
        order.branch_id,
        item.item_id,
        order.user_id,
        'exit',
        item.quantity,
        currentQty,
        newQty,
        `Venda Pedido ${orderId}`,
        orderId
      );
    }

    // 3. Update order status
    db.prepare("UPDATE sales_orders SET status = 'confirmed' WHERE id = ?").run(orderId);
  });

  try {
    db_exec();
    res.json({ success: true });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Failed to confirm order' });
  }
});

// Create a new sales order
router.post('/orders', (req, res) => {
  const { companyId, branchId, customerId, carrierId, userId, items, notes, installments } = req.body;
  
  const orderId = `ord_${Date.now()}`;
  let totalAmount = 0;

  const db_exec = db.transaction(() => {
    // 1. Create Order
    db.prepare(`
      INSERT INTO sales_orders (id, company_id, branch_id, customer_id, carrier_id, user_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(orderId, companyId, branchId, customerId, carrierId, userId || 'user_1', notes);

    // 2. Add Items and Check Stock
    for (const item of items) {
      const itemTotal = item.quantity * item.unitPrice;
      totalAmount += itemTotal;

      db.prepare(`
        INSERT INTO sales_order_items (id, order_id, item_id, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(`oi_${Date.now()}_${Math.random()}`, orderId, item.itemId, item.quantity, item.unitPrice, itemTotal);

      // Check stock for backorder logic
      const balance = db.prepare('SELECT quantity FROM stock_balances WHERE branch_id = ? AND item_id = ?').get(branchId, item.itemId) as { quantity: number } | undefined;
      const currentQty = balance ? balance.quantity : 0;

      if (currentQty < item.quantity) {
        // Trigger Purchase Request for backorder
        const backorderQty = item.quantity - currentQty;
        db.prepare(`
          INSERT INTO purchase_requests (id, company_id, branch_id, item_id, quantity, reason, requester_id, priority)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `pr_bo_${Date.now()}`,
          companyId,
          branchId,
          item.itemId,
          backorderQty,
          `Backorder do Pedido ${orderId}`,
          userId || 'user_1',
          'high'
        );
      }
    }

    // 3. Update total amount
    db.prepare('UPDATE sales_orders SET total_amount = ? WHERE id = ?').run(totalAmount, orderId);

    // 4. Generate Accounts Receivable
    if (installments && installments.length > 0) {
      for (let i = 0; i < installments.length; i++) {
        const inst = installments[i];
        db.prepare(`
          INSERT INTO accounts_receivable (id, company_id, branch_id, customer_id, order_id, description, amount, due_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `rec_${orderId}_${i+1}`,
          companyId,
          branchId,
          customerId,
          orderId,
          `Venda Pedido ${orderId} - Parcela ${i+1}/${installments.length}`,
          inst.amount,
          inst.dueDate
        );
      }
    } else {
      // Default: 1 installment in 30 days
      db.prepare(`
        INSERT INTO accounts_receivable (id, company_id, branch_id, customer_id, order_id, description, amount, due_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `rec_${orderId}_1`,
        companyId,
        branchId,
        customerId,
        orderId,
        `Venda Pedido ${orderId}`,
        totalAmount,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      );
    }
  });

  try {
    db_exec();
    res.json({ success: true, orderId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create sales order' });
  }
});

export default router;
