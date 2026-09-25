import express from 'express';
import db from '../db';
import { applyStockPositionDelta } from '../services/stockPositions';
import {
  getAvailableToReserve,
  syncStockBalanceReservedQuantity
} from '../services/stockReservations';

const router = express.Router();

// 1. Get all inventory items for a company (including active lots, serials count, and composition stats)
router.get('/items', (req, res) => {
  const { companyId } = req.query;
  if (!companyId) return res.status(400).json({ error: 'Company ID is required' });

  const items = db.prepare(`
    SELECT 
      i.*, 
      COALESCE(SUM(b.quantity), 0) as total_quantity,
      COALESCE(SUM(b.reserved_quantity), 0) as total_reserved,
      COALESCE(MAX(b.average_cost), i.cost_price, 0) as average_cost,
      (SELECT COUNT(*) FROM stock_lots l WHERE l.item_id = i.id AND l.status = 'active') as active_lots_count,
      (SELECT COUNT(*) FROM stock_serials s WHERE s.item_id = i.id AND s.status = 'in_stock') as in_stock_serials_count,
      (SELECT COUNT(*) FROM item_compositions c WHERE c.parent_item_id = i.id) as composition_count
    FROM inventory_items i
    LEFT JOIN stock_balances b ON i.id = b.item_id
    WHERE i.company_id = ?
    GROUP BY i.id
    ORDER BY i.description ASC
  `).all(companyId);

  res.json(items);
});

// 2. Create or update inventory item (Cadastro Mestre com rastreabilidade configurável)
router.post('/items', (req, res) => {
  const { 
    id, 
    company_id, 
    companyId,
    code, 
    description, 
    category, 
    unit, 
    ncm, 
    min_stock, 
    minStock,
    max_stock,
    maxStock,
    status,
    item_type,
    itemType,
    tracks_batch,
    tracksBatch,
    tracks_serial,
    tracksSerial,
    tracks_expiry,
    tracksExpiry,
    tracks_manufacturing_date,
    tracksManufacturingDate,
    is_composite,
    isComposite,
    physical_location,
    location,
    validity_alert_days,
    validityAlertDays,
    cost_price,
    costPrice,
    selling_price,
    sellingPrice,
    min_selling_price,
    minSellingPrice,
    cest,
    tax_regime,
    taxRegime,
    origin,
    cfop,
    observations,
    batches,
    components
  } = req.body;

  const finalCompanyId = company_id || companyId;
  if (!finalCompanyId) return res.status(400).json({ error: 'Company ID is required' });
  if (!code || !description) return res.status(400).json({ error: 'Code and description are required' });

  const itemId = id || `prod_${Date.now()}`;
  const finalMinStock = min_stock !== undefined ? min_stock : (minStock || 0);
  const finalMaxStock = max_stock !== undefined ? max_stock : (maxStock || 0);
  const finalStatus = status || 'active';
  
  // Normalizar item_type para 'sale', 'part', 'consumable' mantendo compatibilidade
  let rawItemType = item_type || itemType || 'sale';
  if (rawItemType === 'simple' || rawItemType === 'batch' || rawItemType === 'serial' || rawItemType === 'kit') {
    rawItemType = 'sale';
  } else if (rawItemType === 'raw_material') {
    rawItemType = 'consumable';
  }
  const finalItemType = (rawItemType === 'part' || rawItemType === 'consumable' || rawItemType === 'sale') ? rawItemType : 'sale';

  // Controles de rastreabilidade e composição independentes
  const finalTracksBatch = (tracks_batch || tracksBatch) ? 1 : 0;
  const finalTracksSerial = (tracks_serial || tracksSerial) ? 1 : 0;
  const finalTracksExpiry = (tracks_expiry || tracksExpiry) ? 1 : 0;
  const finalTracksMfgDate = (tracks_manufacturing_date || tracksManufacturingDate) ? 1 : 0;
  const finalIsComposite = (is_composite || isComposite) ? 1 : 0;
  const finalLocation = physical_location || location || null;
  const finalValidityDays = validity_alert_days !== undefined ? validity_alert_days : (validityAlertDays || 0);
  const finalCostPrice = cost_price !== undefined ? cost_price : (costPrice || 0);
  const finalSellingPrice = selling_price !== undefined ? selling_price : (sellingPrice || 0);
  const finalMinSellingPrice = min_selling_price !== undefined ? min_selling_price : (minSellingPrice || 0);
  const finalTaxRegime = tax_regime || taxRegime || null;

  try {
    const db_exec = db.transaction(() => {
      const existing = db.prepare('SELECT id FROM inventory_items WHERE id = ?').get(itemId);

      if (existing) {
        db.prepare(`
          UPDATE inventory_items SET
            code = ?,
            description = ?,
            category = ?,
            unit = ?,
            ncm = ?,
            min_stock = ?,
            max_stock = ?,
            status = ?,
            item_type = ?,
            tracks_batch = ?,
            tracks_serial = ?,
            tracks_expiry = ?,
            tracks_manufacturing_date = ?,
            is_composite = ?,
            physical_location = ?,
            validity_alert_days = ?,
            cost_price = ?,
            selling_price = ?,
            min_selling_price = ?,
            cest = ?,
            tax_regime = ?,
            origin = ?,
            cfop = ?,
            observations = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(
          code, description, category || null, unit || 'UN', ncm || null,
          finalMinStock, finalMaxStock, finalStatus, finalItemType,
          finalTracksBatch, finalTracksSerial, finalTracksExpiry, finalTracksMfgDate,
          finalIsComposite, finalLocation, finalValidityDays, finalCostPrice,
          finalSellingPrice, finalMinSellingPrice, cest || null,
          finalTaxRegime, origin || null, cfop || null,
          observations || null, itemId
        );
      } else {
        db.prepare(`
          INSERT INTO inventory_items (
            id, company_id, code, description, category, unit, ncm, min_stock, max_stock, status,
            item_type, tracks_batch, tracks_serial, tracks_expiry, tracks_manufacturing_date, is_composite, physical_location,
            validity_alert_days, cost_price, selling_price, min_selling_price,
            cest, tax_regime, origin, cfop, observations, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(
          itemId, finalCompanyId, code, description, category || null, unit || 'UN', ncm || null,
          finalMinStock, finalMaxStock, finalStatus, finalItemType,
          finalTracksBatch, finalTracksSerial, finalTracksExpiry, finalTracksMfgDate,
          finalIsComposite, finalLocation, finalValidityDays, finalCostPrice,
          finalSellingPrice, finalMinSellingPrice, cest || null,
          finalTaxRegime, origin || null, cfop || null, observations || null
        );

        // Ensure at least one stock_balance record for default branch if branches exist
        const branch = db.prepare('SELECT id FROM branches WHERE company_id = ? LIMIT 1').get(finalCompanyId) as any;
        if (branch) {
          const balanceExists = db.prepare('SELECT 1 FROM stock_balances WHERE branch_id = ? AND item_id = ?').get(branch.id, itemId);
          if (!balanceExists) {
            db.prepare('INSERT INTO stock_balances (branch_id, item_id, quantity, reserved_quantity, average_cost) VALUES (?, ?, 0, 0, ?)').run(
              branch.id, itemId, finalCostPrice
            );
          }
        }
      }

      // If batches provided, synchronize with stock_lots without overriding balance
      if (Array.isArray(batches)) {
        const branch = db.prepare('SELECT id FROM branches WHERE company_id = ? LIMIT 1').get(finalCompanyId) as any;
        const branchId = branch ? branch.id : 'bran_1';

        for (const b of batches) {
          if (!b.batchNumber && !b.lot_number) continue;
          const lotNum = b.batchNumber || b.lot_number;
          const lotId = b.id && !b.id.startsWith('BATCH-') && !b.id.startsWith('LOT-') ? b.id : `lot_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
          const existingLot = db.prepare('SELECT id, quantity FROM stock_lots WHERE item_id = ? AND lot_number = ?').get(itemId, lotNum) as any;
          
          if (existingLot) {
            db.prepare(`
              UPDATE stock_lots SET
                manufacturing_date = ?,
                expiry_date = ?,
                status = ?,
                notes = ?,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `).run(
              b.manufacturingDate || b.manufacturing_date || null,
              b.expiryDate || b.expiry_date || null,
              b.status || 'active',
              b.observations || b.notes || null,
              existingLot.id
            );
          } else {
            db.prepare(`
              INSERT INTO stock_lots (
                id, company_id, branch_id, item_id, lot_number, manufacturing_date, expiry_date, quantity, status, notes
              ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
            `).run(
              lotId, finalCompanyId, branchId, itemId, lotNum,
              b.manufacturingDate || b.manufacturing_date || null,
              b.expiryDate || b.expiry_date || null,
              b.status || 'active',
              b.observations || b.notes || null
            );
          }
        }
      }

      // If components provided (BOM), synchronize with item_compositions
      if (Array.isArray(components)) {
        db.prepare('DELETE FROM item_compositions WHERE parent_item_id = ?').run(itemId);
        for (const c of components) {
          if (!c.component_item_id && !c.id) continue;
          const compItemId = c.component_item_id || c.id;
          const compId = `comp_${itemId}_${compItemId}`;
          db.prepare(`
            INSERT INTO item_compositions (id, parent_item_id, component_item_id, quantity, unit, notes)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(compId, itemId, compItemId, c.quantity || 1, c.unit || 'UN', c.notes || null);
        }
      }
    });

    db_exec();
    const updated = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(itemId);
    res.json(updated);
  } catch (err: any) {
    console.error('Error saving inventory item:', err);
    res.status(500).json({ error: err.message || 'Failed to save item' });
  }
});

// 3. Single item details with lots, serials, and composition
router.get('/items/:id', (req, res) => {
  const { id } = req.params;
  const item = db.prepare(`
    SELECT 
      i.*, 
      COALESCE(SUM(b.quantity), 0) as total_quantity,
      COALESCE(SUM(b.reserved_quantity), 0) as total_reserved,
      COALESCE(MAX(b.average_cost), i.cost_price, 0) as average_cost
    FROM inventory_items i
    LEFT JOIN stock_balances b ON i.id = b.item_id
    WHERE i.id = ?
    GROUP BY i.id
  `).get(id) as any;

  if (!item) return res.status(404).json({ error: 'Item not found' });

  const lots = db.prepare(`
    SELECT l.*, b.name as branch_name 
    FROM stock_lots l
    LEFT JOIN branches b ON l.branch_id = b.id
    WHERE l.item_id = ?
    ORDER BY l.expiry_date ASC, l.created_at DESC
  `).all(id);

  const serials = db.prepare(`
    SELECT s.*, l.lot_number, b.name as branch_name
    FROM stock_serials s
    LEFT JOIN stock_lots l ON s.lot_id = l.id
    LEFT JOIN branches b ON s.branch_id = b.id
    WHERE s.item_id = ?
    ORDER BY s.serial_number ASC
  `).all(id);

  const composition = db.prepare(`
    SELECT 
      c.*, 
      ci.code as component_code, 
      ci.description as component_description, 
      ci.category as component_category,
      ci.unit as component_unit,
      COALESCE(ci.cost_price, 0) as cost_price
    FROM item_compositions c
    JOIN inventory_items ci ON c.component_item_id = ci.id
    WHERE c.parent_item_id = ?
  `).all(id);

  res.json({ ...item, lots, serials, composition });
});

// 4. Get lots for an item
router.get('/items/:id/lots', (req, res) => {
  const { id } = req.params;
  const lots = db.prepare(`
    SELECT l.*, b.name as branch_name 
    FROM stock_lots l
    LEFT JOIN branches b ON l.branch_id = b.id
    WHERE l.item_id = ?
    ORDER BY l.expiry_date ASC, l.created_at DESC
  `).all(id);

  res.json(lots);
});

// 5. Create or update a lot
router.post('/items/:id/lots', (req, res) => {
  const { id: itemId } = req.params;
  const { 
    id, 
    company_id, 
    branch_id, 
    lot_number, 
    manufacturing_date, 
    expiry_date, 
    physical_location, 
    status, 
    notes 
  } = req.body;

  if (!lot_number) return res.status(400).json({ error: 'Lot number is required' });

  const lotId = id || `lot_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const existing = db.prepare('SELECT id, quantity FROM stock_lots WHERE id = ?').get(lotId) as any;

  try {
    if (existing) {
      db.prepare(`
        UPDATE stock_lots SET
          lot_number = ?,
          manufacturing_date = ?,
          expiry_date = ?,
          physical_location = ?,
          status = ?,
          notes = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        lot_number, manufacturing_date || null, expiry_date || null,
        physical_location || null, status || 'active',
        notes || null, lotId
      );
    } else {
      const item = db.prepare('SELECT company_id FROM inventory_items WHERE id = ?').get(itemId) as any;
      const compId = company_id || (item ? item.company_id : 'comp_1');
      const branch = db.prepare('SELECT id FROM branches WHERE company_id = ? LIMIT 1').get(compId) as any;
      const branchId = branch_id || (branch ? branch.id : 'bran_1');

      // Saldo do lote inicializa em 0 (saldo operacional agregado permanece em stock_balances)
      db.prepare(`
        INSERT INTO stock_lots (
          id, company_id, branch_id, item_id, lot_number, manufacturing_date, expiry_date,
          quantity, physical_location, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
      `).run(
        lotId, compId, branchId, itemId, lot_number,
        manufacturing_date || null, expiry_date || null,
        physical_location || null, status || 'active', notes || null
      );
    }

    const saved = db.prepare('SELECT * FROM stock_lots WHERE id = ?').get(lotId);
    res.json(saved);
  } catch (err: any) {
    console.error('Error saving lot:', err);
    res.status(500).json({ error: err.message || 'Failed to save lot' });
  }
});

// 6. Get serial numbers for an item
router.get('/items/:id/serials', (req, res) => {
  const { id } = req.params;
  const serials = db.prepare(`
    SELECT s.*, l.lot_number, b.name as branch_name
    FROM stock_serials s
    LEFT JOIN stock_lots l ON s.lot_id = l.id
    LEFT JOIN branches b ON s.branch_id = b.id
    WHERE s.item_id = ?
    ORDER BY s.serial_number ASC
  `).all(id);

  res.json(serials);
});

// 7. Create or update serial number
router.post('/items/:id/serials', (req, res) => {
  const { id: itemId } = req.params;
  const { id, company_id, branch_id, lot_id, serial_number, physical_location, status, notes } = req.body;

  if (!serial_number) return res.status(400).json({ error: 'Serial number is required' });

  const serialId = id || `ser_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const existing = db.prepare('SELECT id FROM stock_serials WHERE id = ?').get(serialId);

  const item = db.prepare('SELECT company_id FROM inventory_items WHERE id = ?').get(itemId) as any;
  const compId = company_id || (item ? item.company_id : 'comp_1');

  // Proteção contra duplicação de número de série para o produto nesta empresa
  const duplicate = db.prepare(`
    SELECT id FROM stock_serials 
    WHERE company_id = ? AND item_id = ? AND serial_number = ? AND id != ?
  `).get(compId, itemId, serial_number, serialId);

  if (duplicate) {
    return res.status(400).json({ error: 'Número de série já cadastrado para este produto.' });
  }

  try {
    if (existing) {
      db.prepare(`
        UPDATE stock_serials SET
          lot_id = ?,
          serial_number = ?,
          physical_location = ?,
          status = ?,
          notes = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(lot_id || null, serial_number, physical_location || null, status || 'in_stock', notes || null, serialId);
    } else {
      const branch = db.prepare('SELECT id FROM branches WHERE company_id = ? LIMIT 1').get(compId) as any;
      const branchId = branch_id || (branch ? branch.id : 'bran_1');

      db.prepare(`
        INSERT INTO stock_serials (
          id, company_id, branch_id, item_id, lot_id, serial_number, physical_location, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        serialId, compId, branchId, itemId, lot_id || null, serial_number,
        physical_location || null, status || 'in_stock', notes || null
      );
    }

    const saved = db.prepare('SELECT * FROM stock_serials WHERE id = ?').get(serialId);
    res.json(saved);
  } catch (err: any) {
    console.error('Error saving serial:', err);
    res.status(500).json({ error: err.message || 'Failed to save serial' });
  }
});

// 8. Get composition (BOM) for an item
router.get('/items/:id/composition', (req, res) => {
  const { id } = req.params;
  const composition = db.prepare(`
    SELECT 
      c.*, 
      ci.code as component_code, 
      ci.description as component_description, 
      ci.category as component_category,
      ci.unit as component_unit,
      COALESCE(ci.cost_price, 0) as cost_price
    FROM item_compositions c
    JOIN inventory_items ci ON c.component_item_id = ci.id
    WHERE c.parent_item_id = ?
  `).all(id);

  res.json(composition);
});

// 9. Save composition (BOM) for an item
router.post('/items/:id/composition', (req, res) => {
  const { id: parentId } = req.params;
  const { components } = req.body;

  if (!Array.isArray(components)) {
    return res.status(400).json({ error: 'Components array is required' });
  }

  try {
    db.transaction(() => {
      db.prepare('DELETE FROM item_compositions WHERE parent_item_id = ?').run(parentId);
      for (const comp of components) {
        const compItemId = comp.component_item_id || comp.id;
        if (!compItemId) continue;
        const compId = `comp_${parentId}_${compItemId}_${Date.now()}`;
        db.prepare(`
          INSERT INTO item_compositions (id, parent_item_id, component_item_id, quantity, unit, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(compId, parentId, compItemId, comp.quantity || 1, comp.unit || 'UN', comp.notes || null);
      }
      db.prepare('UPDATE inventory_items SET is_composite = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(parentId);
    })();

    res.json({ success: true, count: components.length });
  } catch (err: any) {
    console.error('Error saving composition:', err);
    res.status(500).json({ error: err.message || 'Failed to save composition' });
  }
});

// 10. Traceable Reservations: List
router.get('/reservations', (req, res) => {
  const { companyId, itemId, status } = req.query;
  let query = `
    SELECT 
      r.*, 
      i.code as item_code, 
      i.description as item_description,
      l.lot_number,
      s.serial_number,
      b.name as branch_name
    FROM stock_reservations r
    JOIN inventory_items i ON r.item_id = i.id
    LEFT JOIN stock_lots l ON r.lot_id = l.id
    LEFT JOIN stock_serials s ON r.serial_id = s.id
    LEFT JOIN branches b ON r.branch_id = b.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (companyId) {
    query += ' AND r.company_id = ?';
    params.push(companyId);
  }
  if (itemId) {
    query += ' AND r.item_id = ?';
    params.push(itemId);
  }
  if (status) {
    query += ' AND r.status = ?';
    params.push(status);
  }
  query += ' ORDER BY r.created_at DESC';

  const reservations = db.prepare(query).all(...params);
  res.json(reservations);
});

// 11. Traceable Reservations: Create with real availability validation and sync
router.post('/reservations', (req, res) => {
  const { companyId, branchId, itemId, lotId, serialId, quantity, referenceType, referenceId, notes, createdBy } = req.body;
  if (!itemId || !quantity) return res.status(400).json({ error: 'Item ID and quantity are required' });
  const requestedQty = Number(quantity);
  if (isNaN(requestedQty) || requestedQty <= 0) {
    return res.status(400).json({ error: 'Quantidade deve ser maior que zero.' });
  }

  const item = db.prepare('SELECT company_id, code, description FROM inventory_items WHERE id = ?').get(itemId) as any;
  if (!item) return res.status(404).json({ error: 'Produto não encontrado.' });
  const compId = companyId || item.company_id || 'comp_1';
  const branch = db.prepare('SELECT id FROM branches WHERE company_id = ? LIMIT 1').get(compId) as any;
  const branId = branchId || (branch ? branch.id : 'bran_1');

  // Validar disponibilidade real
  const availableToReserve = getAvailableToReserve(branId, itemId, db);
  if (availableToReserve < requestedQty) {
    return res.status(400).json({
      error: `Estoque insuficiente para reserva manual: disponível ${availableToReserve}, solicitado ${requestedQty}, falta ${requestedQty - availableToReserve}`
    });
  }

  const id = `res_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

  try {
    const db_exec = db.transaction(() => {
      db.prepare(`
        INSERT INTO stock_reservations (
          id, company_id, branch_id, item_id, lot_id, serial_id, quantity, reference_type, reference_id, status, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
      `).run(
        id, compId, branId, itemId, lotId || null, serialId || null,
        requestedQty, referenceType || 'manual', referenceId || null, notes || null, createdBy || 'user_1'
      );

      syncStockBalanceReservedQuantity(branId, itemId, db);
    });

    db_exec();

    const saved = db.prepare('SELECT * FROM stock_reservations WHERE id = ?').get(id);
    res.json(saved);
  } catch (err: any) {
    console.error('Error creating reservation:', err);
    res.status(500).json({ error: err.message || 'Failed to create reservation' });
  }
});

// 11.1 Cancel manual reservation
router.put('/reservations/:id/cancel', (req, res) => {
  const { id } = req.params;
  const reservation = db.prepare('SELECT * FROM stock_reservations WHERE id = ?').get(id) as any;
  if (!reservation) return res.status(404).json({ error: 'Reserva não encontrada.' });
  if (reservation.status !== 'active') {
    return res.status(400).json({ error: 'Apenas reservas ativas podem ser canceladas.' });
  }

  try {
    const db_exec = db.transaction(() => {
      db.prepare("UPDATE stock_reservations SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
      syncStockBalanceReservedQuantity(reservation.branch_id, reservation.item_id, db);
    });

    db_exec();
    res.json({ success: true, message: 'Reserva cancelada com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Falha ao cancelar reserva' });
  }
});

// 12. Kit Assemblies & Genealogy: List
router.get('/assemblies', (req, res) => {
  const { companyId, parentItemId } = req.query;
  let query = `
    SELECT 
      ka.*, 
      pi.code as parent_code, 
      pi.description as parent_description,
      l.lot_number as output_lot_number,
      s.serial_number as output_serial_number
    FROM kit_assemblies ka
    JOIN inventory_items pi ON ka.parent_item_id = pi.id
    LEFT JOIN stock_lots l ON ka.output_lot_id = l.id
    LEFT JOIN stock_serials s ON ka.output_serial_id = s.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (companyId) {
    query += ' AND ka.company_id = ?';
    params.push(companyId);
  }
  if (parentItemId) {
    query += ' AND ka.parent_item_id = ?';
    params.push(parentItemId);
  }
  query += ' ORDER BY ka.created_at DESC';

  const assemblies = db.prepare(query).all(...params) as any[];
  for (const a of assemblies) {
    a.consumed_items = db.prepare(`
      SELECT 
        kai.*, 
        ci.code as component_code, 
        ci.description as component_description,
        cl.lot_number as consumed_lot_number,
        cs.serial_number as consumed_serial_number
      FROM kit_assembly_items kai
      JOIN inventory_items ci ON kai.component_item_id = ci.id
      LEFT JOIN stock_lots cl ON kai.consumed_lot_id = cl.id
      LEFT JOIN stock_serials cs ON kai.consumed_serial_id = cs.id
      WHERE kai.assembly_id = ?
    `).all(a.id);
  }

  res.json(assemblies);
});

// 13. Kit Assemblies & Genealogy: Record kit assembly (bloqueado até implementação transacional de estoque)
router.post('/assemblies', (req, res) => {
  return res.status(409).json({
    error: 'A montagem física de kits ainda não está habilitada. A estrutura de BOM e genealogia está disponível, mas a conclusão dependerá da implementação transacional de movimentação de estoque.'
  });
});

// 14. Get stock balance for a specific branch
router.get('/balance/:branchId', (req, res) => {
  const { branchId } = req.params;
  const balances = db.prepare(`
    SELECT i.code, i.description, b.quantity, b.reserved_quantity, b.average_cost
    FROM stock_balances b
    JOIN inventory_items i ON b.item_id = i.id
    WHERE b.branch_id = ?
  `).all(branchId);

  res.json(balances);
});

// 15. Register stock entry (with support for lots, serials, and structured reasons)
router.post('/entry', (req, res) => {
  const { 
    itemId, 
    branchId, 
    quantity, 
    cost, 
    reason, 
    reference, 
    userId,
    lotId,
    lotNumber,
    serialId,
    serialNumber,
    movementReason,
    sourceLocation,
    destinationLocation
  } = req.body;
  
  const db_exec = db.transaction(() => {
    // 1. Get current balance
    let balance = db.prepare('SELECT quantity FROM stock_balances WHERE branch_id = ? AND item_id = ?').get(branchId, itemId) as { quantity: number } | undefined;
    
    const previousBalance = balance ? balance.quantity : 0;
    const newBalance = previousBalance + quantity;

    // 2. Update or Insert balance
    if (balance) {
      db.prepare('UPDATE stock_balances SET quantity = ?, average_cost = ((average_cost * ?) + (? * ?)) / ? WHERE branch_id = ? AND item_id = ?')
        .run(newBalance, previousBalance, quantity, cost || 0, newBalance, branchId, itemId);
    } else {
      db.prepare('INSERT INTO stock_balances (branch_id, item_id, quantity, average_cost) VALUES (?, ?, ?, ?)')
        .run(branchId, itemId, quantity, cost || 0);
    }

    // 2.3 Apply delta to physical stock positions (SALDO LEGADO / NÃO ALOCADO em AVAILABLE)
    applyStockPositionDelta({
      branchId,
      itemId,
      deltaQuantity: quantity,
      state: 'AVAILABLE',
      lotId: null
    });

    // 2.1 If lot specified or lot number given, resolve lot_id for structured movement tracking
    // (Não atualizamos stock_lots.quantity como segundo saldo operacional nesta etapa)
    let finalLotId = lotId || null;
    if (lotNumber && !finalLotId) {
      const existingLot = db.prepare('SELECT id FROM stock_lots WHERE item_id = ? AND lot_number = ?').get(itemId, lotNumber) as any;
      if (existingLot) {
        finalLotId = existingLot.id;
      }
    }

    // 2.2 If serial specified, update serial status
    let finalSerialId = serialId || null;
    if (serialNumber && !finalSerialId) {
      const existingSerial = db.prepare('SELECT id FROM stock_serials WHERE item_id = ? AND serial_number = ?').get(itemId, serialNumber) as any;
      if (existingSerial) {
        finalSerialId = existingSerial.id;
        db.prepare("UPDATE stock_serials SET status = 'in_stock', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(finalSerialId);
      }
    }

    // 3. Record movement with structured tracking
    db.prepare(`
      INSERT INTO stock_movements (
        id, branch_id, item_id, user_id, type, quantity, previous_balance, new_balance,
        reason, reference_id, lot_id, serial_id, movement_reason, source_location, destination_location, cost
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `mov_${Date.now()}`,
      branchId,
      itemId,
      userId || 'user_1',
      'entry',
      quantity,
      previousBalance,
      newBalance,
      reason,
      reference,
      finalLotId,
      finalSerialId,
      movementReason || 'purchase_entry',
      sourceLocation || null,
      destinationLocation || null,
      cost || 0
    );
  });

  try {
    db_exec();
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to record entry:', error);
    res.status(500).json({ error: 'Failed to record entry' });
  }
});

// 16. Get stock movements for an item
router.get('/movements/:itemId', (req, res) => {
  const { itemId } = req.params;
  const { branchId } = req.query;

  let query = `
    SELECT 
      m.*, 
      u.name as user_name, 
      b.name as branch_name,
      l.lot_number,
      s.serial_number
    FROM stock_movements m
    JOIN users u ON m.user_id = u.id
    JOIN branches b ON m.branch_id = b.id
    LEFT JOIN stock_lots l ON m.lot_id = l.id
    LEFT JOIN stock_serials s ON m.serial_id = s.id
    WHERE m.item_id = ?
  `;
  const params: any[] = [itemId];

  if (branchId) {
    query += " AND m.branch_id = ?";
    params.push(branchId);
  }

  query += " ORDER BY m.created_at DESC LIMIT 50";

  const movements = db.prepare(query).all(...params);
  res.json(movements);
});

// 17. Stock Locations: List
router.get('/locations', (req, res) => {
  const { companyId, branchId } = req.query;
  let query = `
    SELECT 
      l.*, 
      b.name as branch_name,
      p.name as parent_name
    FROM stock_locations l
    LEFT JOIN branches b ON l.branch_id = b.id
    LEFT JOIN stock_locations p ON l.parent_id = p.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (companyId) {
    query += ' AND l.company_id = ?';
    params.push(companyId);
  }
  if (branchId) {
    query += ' AND l.branch_id = ?';
    params.push(branchId);
  }
  query += ' ORDER BY l.name ASC';

  const locations = db.prepare(query).all(...params);
  res.json(locations);
});

// 18. Stock Locations: Create manual physical location
router.post('/locations', (req, res) => {
  const { company_id, branch_id, parent_id, name, code, system_key, status } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nome da localização é obrigatório' });
  }
  if (!branch_id) {
    return res.status(400).json({ error: 'Filial é obrigatória' });
  }

  // Não permitir criação de localização técnica reservada manualmente
  if (system_key && system_key.toUpperCase() === 'LEGACY_UNALLOCATED') {
    return res.status(400).json({ error: "A chave de sistema 'LEGACY_UNALLOCATED' é reservada para a localização técnica do sistema." });
  }

  // 1 & 2. Buscar filial real por branch_id
  const branch = db.prepare('SELECT company_id FROM branches WHERE id = ?').get(branch_id) as any;
  if (!branch) {
    return res.status(400).json({ error: 'Filial informada não foi encontrada.' });
  }

  // 3, 4 & 5. Determinar company_id verdadeiro da filial e validar se fornecido (sem fallback silencioso)
  const trueCompanyId = branch.company_id;
  if (company_id && company_id !== trueCompanyId) {
    return res.status(400).json({ error: 'A empresa informada não corresponde à empresa da filial selecionada.' });
  }
  const resolvedCompanyId = trueCompanyId;

  // Validação de parent_id se fornecido
  if (parent_id) {
    const parent = db.prepare('SELECT * FROM stock_locations WHERE id = ?').get(parent_id) as any;
    if (!parent) {
      return res.status(400).json({ error: 'Localização pai não encontrada.' });
    }
    if (parent.branch_id !== branch_id || parent.company_id !== resolvedCompanyId) {
      return res.status(400).json({ error: 'A localização pai deve pertencer à mesma empresa e filial.' });
    }
  }

  const id = `loc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

  try {
    db.prepare(`
      INSERT INTO stock_locations (
        id, company_id, branch_id, parent_id, name, code, system_key, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      id,
      resolvedCompanyId,
      branch_id,
      parent_id || null,
      name.trim(),
      code ? code.trim() : null,
      system_key ? system_key.trim() : null,
      status || 'active'
    );

    const saved = db.prepare('SELECT * FROM stock_locations WHERE id = ?').get(id);
    res.json(saved);
  } catch (err: any) {
    console.error('Error creating location:', err);
    res.status(500).json({ error: err.message || 'Falha ao criar localização' });
  }
});

// 19. Stock Positions: List physical stock details
router.get('/positions', (req, res) => {
  const { companyId, branchId, itemId, locationId, state } = req.query;
  let query = `
    SELECT 
      p.*, 
      i.code as item_code, 
      i.description as item_description,
      i.unit as item_unit,
      loc.name as location_name,
      loc.system_key as location_system_key,
      l.lot_number,
      b.name as branch_name
    FROM stock_positions p
    JOIN inventory_items i ON p.item_id = i.id
    JOIN stock_locations loc ON p.location_id = loc.id
    LEFT JOIN branches b ON p.branch_id = b.id
    LEFT JOIN stock_lots l ON p.lot_id = l.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (companyId) {
    query += ' AND p.company_id = ?';
    params.push(companyId);
  }
  if (branchId) {
    query += ' AND p.branch_id = ?';
    params.push(branchId);
  }
  if (itemId) {
    query += ' AND p.item_id = ?';
    params.push(itemId);
  }
  if (locationId) {
    query += ' AND p.location_id = ?';
    params.push(locationId);
  }
  if (state) {
    query += ' AND p.state = ?';
    params.push(state);
  }
  query += ' ORDER BY i.description ASC, p.created_at ASC';

  const positions = db.prepare(query).all(...params);
  res.json(positions);
});

export default router;
