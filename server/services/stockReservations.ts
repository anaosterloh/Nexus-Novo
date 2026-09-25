import db from '../db';

export interface InsufficientStockItem {
  itemId: string;
  itemCode: string;
  itemDescription: string;
  requestedQuantity: number;
  availablePhysical: number;
  activeReserved: number;
  availableQuantity: number;
  missingQuantity: number;
}

/**
 * Consulta a quantidade física em posições com estado 'AVAILABLE'
 * Exclui estados 'QUARANTINE', 'MAINTENANCE', 'PENDING_DISPOSAL'.
 */
export function getAvailablePhysicalQuantity(branchId: string, itemId: string, database: any = db): number {
  const row = database.prepare(`
    SELECT COALESCE(SUM(quantity), 0) as total 
    FROM stock_positions 
    WHERE branch_id = ? AND item_id = ? AND state = 'AVAILABLE'
  `).get(branchId, itemId) as { total: number } | undefined;
  return row ? Number(row.total) : 0;
}

/**
 * Consulta a soma de todas as reservas ativas para o item na filial.
 */
export function getActiveReservedQuantity(branchId: string, itemId: string, database: any = db): number {
  const row = database.prepare(`
    SELECT COALESCE(SUM(quantity), 0) as total 
    FROM stock_reservations 
    WHERE branch_id = ? AND item_id = ? AND status = 'active'
  `).get(branchId, itemId) as { total: number } | undefined;
  return row ? Number(row.total) : 0;
}

/**
 * Disponibilidade real para nova reserva:
 * availablePhysical (em stock_positions state = 'AVAILABLE') - activeReserved (em stock_reservations status = 'active')
 */
export function getAvailableToReserve(branchId: string, itemId: string, database: any = db): number {
  const physical = getAvailablePhysicalQuantity(branchId, itemId, database);
  const reserved = getActiveReservedQuantity(branchId, itemId, database);
  return physical - reserved;
}

/**
 * Recalcula o agregado de compatibilidade stock_balances.reserved_quantity
 * a partir das reservas detalhadas ativas em stock_reservations.
 */
export function syncStockBalanceReservedQuantity(branchId: string, itemId: string, database: any = db): number {
  const totalActive = getActiveReservedQuantity(branchId, itemId, database);
  const exists = database.prepare('SELECT 1 FROM stock_balances WHERE branch_id = ? AND item_id = ?').get(branchId, itemId);

  if (exists) {
    database.prepare(`
      UPDATE stock_balances 
      SET reserved_quantity = ? 
      WHERE branch_id = ? AND item_id = ?
    `).run(totalActive, branchId, itemId);
  } else {
    database.prepare(`
      INSERT INTO stock_balances (branch_id, item_id, quantity, reserved_quantity, average_cost)
      VALUES (?, ?, 0, ?, 0)
    `).run(branchId, itemId, totalActive);
  }

  return totalActive;
}

/**
 * Verifica a disponibilidade real de todos os itens de uma lista (Tudo ou Nada).
 * Se o mesmo item aparecer em múltiplas linhas, as quantidades solicitadas são agregadas.
 */
export function checkItemsAvailability(
  branchId: string,
  items: { itemId: string; quantity: number }[],
  database: any = db
): { sufficient: boolean; insufficientItems: InsufficientStockItem[] } {
  // 1. Agrupar quantidades solicitadas por itemId
  const requestedTotals = new Map<string, number>();
  for (const item of items) {
    const current = requestedTotals.get(item.itemId) || 0;
    requestedTotals.set(item.itemId, current + Number(item.quantity));
  }

  const insufficientItems: InsufficientStockItem[] = [];

  // 2. Verificar disponibilidade real de cada item único
  for (const [itemId, requestedQuantity] of requestedTotals.entries()) {
    const itemData = database.prepare('SELECT code, description FROM inventory_items WHERE id = ?').get(itemId) as any;
    const itemCode = itemData ? itemData.code : itemId;
    const itemDescription = itemData ? itemData.description : '';

    const availablePhysical = getAvailablePhysicalQuantity(branchId, itemId, database);
    const activeReserved = getActiveReservedQuantity(branchId, itemId, database);
    const availableQuantity = availablePhysical - activeReserved;

    if (availableQuantity < requestedQuantity) {
      insufficientItems.push({
        itemId,
        itemCode,
        itemDescription,
        requestedQuantity,
        availablePhysical,
        activeReserved,
        availableQuantity,
        missingQuantity: requestedQuantity - availableQuantity
      });
    }
  }

  return {
    sufficient: insufficientItems.length === 0,
    insufficientItems
  };
}

/**
 * Cria reservas ativas para um pedido de venda e sincroniza stock_balances.reserved_quantity.
 * Deve ser executado dentro de uma transação SQLite.
 */
export function createSalesOrderReservations(
  order: { id: string; company_id: string; branch_id: string; user_id?: string },
  items: { item_id: string; quantity: number }[],
  database: any = db
): void {
  // Agrupar itens por item_id para criar reservas limpas por produto no pedido
  const grouped = new Map<string, number>();
  for (const item of items) {
    const cur = grouped.get(item.item_id) || 0;
    grouped.set(item.item_id, cur + Number(item.quantity));
  }

  for (const [itemId, qty] of grouped.entries()) {
    const resId = `res_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    database.prepare(`
      INSERT INTO stock_reservations (
        id, company_id, branch_id, item_id, lot_id, serial_id, quantity, reference_type, reference_id, status, notes, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, NULL, NULL, ?, 'sales_order', ?, 'active', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      resId,
      order.company_id,
      order.branch_id,
      itemId,
      qty,
      order.id,
      `Reserva comercial do Pedido ${order.id}`,
      order.user_id || 'user_1'
    );

    // Recalcula o agregado de compatibilidade
    syncStockBalanceReservedQuantity(order.branch_id, itemId, database);
  }
}

/**
 * Libera todas as reservas ativas associadas a um pedido de venda (status -> 'cancelled')
 * e sincroniza stock_balances.reserved_quantity.
 * Deve ser executado dentro de uma transação SQLite.
 */
export function cancelSalesOrderReservations(
  orderId: string,
  database: any = db
): { cancelledCount: number; affectedItems: string[] } {
  const activeReservations = database.prepare(`
    SELECT id, branch_id, item_id 
    FROM stock_reservations 
    WHERE reference_type = 'sales_order' AND reference_id = ? AND status = 'active'
  `).all(orderId) as any[];

  if (activeReservations.length === 0) {
    return { cancelledCount: 0, affectedItems: [] };
  }

  database.prepare(`
    UPDATE stock_reservations 
    SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
    WHERE reference_type = 'sales_order' AND reference_id = ? AND status = 'active'
  `).run(orderId);

  const affectedItems = new Set<string>();
  for (const res of activeReservations) {
    affectedItems.add(res.item_id);
    syncStockBalanceReservedQuantity(res.branch_id, res.item_id, database);
  }

  return {
    cancelledCount: activeReservations.length,
    affectedItems: Array.from(affectedItems)
  };
}

/**
 * Consome reservas ativas associadas a um pedido de venda no momento do envio (status -> 'fulfilled')
 * e sincroniza stock_balances.reserved_quantity.
 * Deve ser executado dentro de uma transação SQLite.
 */
export function fulfillSalesOrderReservations(
  orderId: string,
  database: any = db
): { fulfilledCount: number; affectedItems: string[] } {
  const activeReservations = database.prepare(`
    SELECT id, branch_id, item_id 
    FROM stock_reservations 
    WHERE reference_type = 'sales_order' AND reference_id = ? AND status = 'active'
  `).all(orderId) as any[];

  if (activeReservations.length === 0) {
    return { fulfilledCount: 0, affectedItems: [] };
  }

  database.prepare(`
    UPDATE stock_reservations 
    SET status = 'fulfilled', updated_at = CURRENT_TIMESTAMP 
    WHERE reference_type = 'sales_order' AND reference_id = ? AND status = 'active'
  `).run(orderId);

  const affectedItems = new Set<string>();
  for (const res of activeReservations) {
    affectedItems.add(res.item_id);
    syncStockBalanceReservedQuantity(res.branch_id, res.item_id, database);
  }

  return {
    fulfilledCount: activeReservations.length,
    affectedItems: Array.from(affectedItems)
  };
}
