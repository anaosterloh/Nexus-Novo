import express from 'express';
import db from '../db';
import { applyStockPositionDelta, applyStockPositionDeltaById } from '../services/stockPositions';
import {
  checkItemsAvailability,
  createSalesOrderReservations,
  cancelSalesOrderReservations,
  fulfillSalesOrderReservations,
  validateSalesOrderActiveReservations
} from '../services/stockReservations';
import {
  getOrderPickingSummary,
  getPickingPositionOptions,
  getPickingSerialOptions,
  createPickingAllocation,
  cancelPickingAllocation,
  cancelOrderPickingAllocations,
  validateAndGetCompletePickingAllocations
} from '../services/picking';

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

// Confirm sales order and reserve stock (NO physical deduction, all-or-nothing check)
router.put('/orders/:orderId/confirm', (req, res) => {
  const { orderId } = req.params;

  try {
    const db_exec = db.transaction(() => {
      // 1. Get order and items
      const order = db.prepare('SELECT * FROM sales_orders WHERE id = ?').get(orderId) as any;
      if (!order) throw new Error('Order not found');
      if (order.status !== 'draft') {
        throw new Error('Apenas pedidos em rascunho (draft) podem ser confirmados.');
      }

      const items = db.prepare(`
        SELECT oi.*, i.code as item_code, i.description as item_name
        FROM sales_order_items oi
        JOIN inventory_items i ON oi.item_id = i.id
        WHERE oi.order_id = ?
      `).all(orderId) as any[];

      if (!items || items.length === 0) {
        throw new Error('O pedido não possui itens para confirmação.');
      }

      // 2. Check stock availability (All or Nothing)
      const availability = checkItemsAvailability(
        order.branch_id,
        items.map(i => ({ itemId: i.item_id, quantity: i.quantity })),
        db
      );

      if (!availability.sufficient) {
        const details = availability.insufficientItems.map(ins =>
          `${ins.itemDescription || ins.itemCode}: solicitado ${ins.requestedQuantity}, disponível ${ins.availableQuantity}, falta ${ins.missingQuantity}`
        ).join('; ');
        const err: any = new Error(`Estoque insuficiente para confirmar o pedido: ${details}`);
        err.code = 'INSUFFICIENT_STOCK';
        err.details = availability.insufficientItems;
        throw err;
      }

      // 3. Create active reservations and sync reserved_quantity
      createSalesOrderReservations(order, items, db);

      // 4. Update order status
      db.prepare(`
        UPDATE sales_orders 
        SET status = 'confirmed', stock_flow_mode = 'reservation_v1' 
        WHERE id = ?
      `).run(orderId);
    });

    db_exec();
    res.json({ success: true, message: 'Pedido confirmado e estoque reservado com sucesso.' });
  } catch (error: any) {
    console.error('Error confirming order:', error);
    res.status(400).json({
      error: error.message || 'Failed to confirm order',
      code: error.code,
      details: error.details
    });
  }
});

// Cancel sales order and release reservations (if reservation_v1)
router.put('/orders/:orderId/cancel', (req, res) => {
  const { orderId } = req.params;

  try {
    const db_exec = db.transaction(() => {
      const order = db.prepare('SELECT * FROM sales_orders WHERE id = ?').get(orderId) as any;
      if (!order) throw new Error('Order not found');
      if (order.status === 'cancelled') {
        throw new Error('Pedido já está cancelado.');
      }
      if (order.status === 'shipped') {
        throw new Error('Não é possível cancelar um pedido que já foi enviado.');
      }

      if (order.status === 'confirmed') {
        if (order.stock_flow_mode === 'legacy_physical_deducted') {
          throw new Error('Cancelamento automático bloqueado: este pedido foi confirmado no fluxo legado com baixa física direta já realizada. É necessária revisão manual ou processo de devolução para estornar o estoque físico.');
        }

        // Fluxo novo (reservation_v1): cancelar alocações ativas de picking, liberar seriais e cancelar reservas
        cancelOrderPickingAllocations(orderId, db);
        cancelSalesOrderReservations(orderId, db);
        db.prepare("UPDATE sales_orders SET status = 'cancelled' WHERE id = ?").run(orderId);
      } else if (order.status === 'draft') {
        db.prepare("UPDATE sales_orders SET status = 'cancelled' WHERE id = ?").run(orderId);
      }
    });

    db_exec();
    res.json({ success: true, message: 'Pedido cancelado e reservas liberadas com sucesso.' });
  } catch (error: any) {
    console.error('Error cancelling order:', error);
    res.status(400).json({ error: error.message || 'Falha ao cancelar pedido' });
  }
});

// Ship sales order: consume exact picking allocations and deduct physical stock (or simply transition if legacy)
router.put('/orders/:orderId/ship', (req, res) => {
  const { orderId } = req.params;

  try {
    const db_exec = db.transaction(() => {
      const order = db.prepare('SELECT * FROM sales_orders WHERE id = ?').get(orderId) as any;
      if (!order) throw new Error('Order not found');
      if (order.status !== 'confirmed') {
        throw new Error('Apenas pedidos confirmados podem ser enviados.');
      }

      // Pedido legado: baixa física já ocorreu na confirmação antiga
      if (order.stock_flow_mode === 'legacy_physical_deducted') {
        db.prepare("UPDATE sales_orders SET status = 'shipped' WHERE id = ?").run(orderId);
        return;
      }

      // Pedido novo (reservation_v1):
      const items = db.prepare(`
        SELECT oi.*, i.code as item_code, i.description as item_name, i.tracks_batch, i.tracks_serial
        FROM sales_order_items oi
        JOIN inventory_items i ON oi.item_id = i.id
        WHERE oi.order_id = ?
      `).all(orderId) as any[];

      // 1. Validar reservas comerciais ativas integralmente
      const reservationValidation = validateSalesOrderActiveReservations(order, items, db);
      if (!reservationValidation.valid) {
        const err: any = new Error(reservationValidation.error || 'Reservas ativas não correspondem integralmente aos itens do pedido.');
        err.code = 'RESERVATION_MISMATCH';
        err.details = reservationValidation.details;
        throw err;
      }

      // 2. Validar Picking Completo antes de qualquer baixa física
      const pickingValidation = validateAndGetCompletePickingAllocations(order, db);
      if (!pickingValidation.valid) {
        const err: any = new Error(pickingValidation.error || 'Separação física de picking incompleta ou inconsistente.');
        err.code = 'PICKING_INCOMPLETE';
        throw err;
      }

      const activeAllocations = pickingValidation.allocations;

      // 3. Executar baixa física EXATA por posição (applyStockPositionDeltaById) e registrar movimentos
      for (const alloc of activeAllocations) {
        const allocQty = Number(alloc.quantity);

        // Baixa na posição física exata
        applyStockPositionDeltaById({
          positionId: alloc.position_id,
          deltaQuantity: -allocQty,
          expectedBranchId: order.branch_id,
          expectedItemId: alloc.item_id,
          expectedState: 'AVAILABLE'
        }, db);

        // Obter localização física para source_location de auditoria
        const posInfo = db.prepare('SELECT location_id FROM stock_positions WHERE id = ?').get(alloc.position_id) as any;

        // Registrar saída física estruturada em stock_movements com sale_exit e rastreabilidade de lote/serial/origem
        db.prepare(`
          INSERT INTO stock_movements (
            id, branch_id, item_id, user_id, type, quantity, previous_balance, new_balance, reason, reference_id, movement_reason, lot_id, serial_id, source_location
          ) VALUES (?, ?, ?, ?, 'exit', ?, 0, 0, ?, ?, 'sale_exit', ?, ?, ?)
        `).run(
          `mov_exit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          order.branch_id,
          alloc.item_id,
          order.user_id,
          allocQty,
          `Venda Pedido ${orderId}`,
          orderId,
          alloc.lot_id || null,
          alloc.serial_id || null,
          posInfo ? posInfo.location_id : null
        );

        // Se a alocação contiver serial: atualizar status -> 'shipped' e position_id -> NULL
        if (alloc.serial_id) {
          db.prepare(`
            UPDATE stock_serials 
            SET status = 'shipped', position_id = NULL, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
          `).run(alloc.serial_id);
        }
      }

      // 4. Atualizar agregado stock_balances por item
      const itemTotals = new Map<string, number>();
      for (const alloc of activeAllocations) {
        itemTotals.set(alloc.item_id, (itemTotals.get(alloc.item_id) || 0) + Number(alloc.quantity));
      }

      for (const [itemId, totalShipped] of itemTotals.entries()) {
        const bal = db.prepare('SELECT quantity FROM stock_balances WHERE branch_id = ? AND item_id = ?').get(order.branch_id, itemId) as any;
        const curBal = bal ? Number(bal.quantity) : 0;
        const newBal = curBal - totalShipped;

        db.prepare('UPDATE stock_balances SET quantity = ? WHERE branch_id = ? AND item_id = ?')
          .run(newBal, order.branch_id, itemId);

        // Atualizar previous_balance e new_balance nos movimentos criados para esse item no pedido
        db.prepare(`
          UPDATE stock_movements 
          SET previous_balance = ?, new_balance = ? 
          WHERE reference_id = ? AND item_id = ? AND movement_reason = 'sale_exit'
        `).run(curBal, newBal, orderId, itemId);
      }

      // 5. Marcar alocações como fulfilled
      db.prepare(`
        UPDATE picking_allocations 
        SET status = 'fulfilled', fulfilled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
        WHERE id IN (${activeAllocations.map(() => '?').join(',')})
      `).run(...activeAllocations.map(a => a.id));

      // 6. Marcar reservas como fulfilled e sincronizar reserved_quantity
      fulfillSalesOrderReservations(orderId, db);

      // 7. Atualizar status do pedido para shipped
      db.prepare("UPDATE sales_orders SET status = 'shipped' WHERE id = ?").run(orderId);
    });

    db_exec();
    res.json({ success: true, message: 'Pedido enviado com sucesso e estoque físico baixado a partir da separação.' });
  } catch (error: any) {
    console.error('Error shipping order:', error);
    res.status(400).json({ error: error.message || 'Falha ao enviar pedido' });
  }
});

// ==========================================
// ROTAS DE SEPARAÇÃO / PICKING
// ==========================================

// Resumo do Picking do Pedido
router.get('/orders/:orderId/picking', (req, res) => {
  const { orderId } = req.params;
  try {
    const summary = getOrderPickingSummary(orderId, db);
    res.json(summary);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao carregar resumo de separação.' });
  }
});

// Opções físicas elegíveis para Picking
router.get('/orders/:orderId/picking/options', (req, res) => {
  const { reservationId, positionId } = req.query as { reservationId?: string; positionId?: string };
  if (!reservationId) {
    return res.status(400).json({ error: 'reservationId é obrigatório.' });
  }

  try {
    const { reservation, item, options } = getPickingPositionOptions(reservationId, db);
    let serialOptions: any[] = [];
    if (item.tracks_serial === 1) {
      serialOptions = getPickingSerialOptions({ reservationId, positionId }, db);
    }

    res.json({
      reservationId,
      item,
      positions: options,
      serials: serialOptions
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao buscar opções físicas para separação.' });
  }
});

// Criar alocação de Picking
router.post('/orders/:orderId/picking/allocations', (req, res) => {
  const { orderId } = req.params;
  const { reservationId, positionId, quantity, serialId, userId } = req.body;

  if (!reservationId || !positionId || quantity === undefined) {
    return res.status(400).json({ error: 'reservationId, positionId e quantity são obrigatórios.' });
  }

  try {
    let result: any;
    const db_exec = db.transaction(() => {
      result = createPickingAllocation({
        orderId,
        reservationId,
        positionId,
        quantity: Number(quantity),
        serialId: serialId || null,
        userId
      }, db);
    });

    db_exec();
    res.json({ success: true, allocation: result.allocation });
  } catch (err: any) {
    console.error('Error creating picking allocation:', err);
    res.status(400).json({ error: err.message || 'Falha ao criar alocação de separação.' });
  }
});

// Cancelar/liberar uma alocação de Picking
router.put('/orders/:orderId/picking/allocations/:allocationId/cancel', (req, res) => {
  const { orderId, allocationId } = req.params;

  try {
    let result: any;
    const db_exec = db.transaction(() => {
      result = cancelPickingAllocation({ orderId, allocationId }, db);
    });

    db_exec();
    res.json(result);
  } catch (err: any) {
    console.error('Error cancelling picking allocation:', err);
    res.status(400).json({ error: err.message || 'Falha ao liberar alocação de separação.' });
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
