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

export interface ReservationMismatchDetail {
  itemId: string;
  itemCode?: string;
  itemDescription?: string;
  requiredQuantity: number;
  reservedQuantity: number;
  difference: number;
  reason: 'MISSING_RESERVATION' | 'PARTIAL_RESERVATION' | 'EXCESS_RESERVATION' | 'UNEXPECTED_ITEM';
}

export interface ValidateOrderReservationsResult {
  valid: boolean;
  error?: string;
  details: ReservationMismatchDetail[];
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

/**
 * Valida integralmente se as reservas ativas correspondem exatamente às necessidades do pedido de venda.
 * Exige correspondência exata por item e contexto (empresa, filial, pedido), bloqueando divergências.
 */
export function validateSalesOrderActiveReservations(
  order: { id: string; company_id: string; branch_id: string },
  items: { item_id: string; quantity: number }[],
  database: any = db
): ValidateOrderReservationsResult {
  // 1. Agrupar itens do pedido por item_id
  const requiredMap = new Map<string, number>();
  for (const item of items) {
    const cur = requiredMap.get(item.item_id) || 0;
    requiredMap.set(item.item_id, cur + Number(item.quantity));
  }

  // 2. Buscar reservas ativas do pedido
  const activeReservations = database.prepare(`
    SELECT * FROM stock_reservations
    WHERE reference_type = 'sales_order'
      AND reference_id = ?
      AND status = 'active'
  `).all(order.id) as any[];

  // 3. Validar integridade estrutural (contexto de filial e empresa)
  for (const res of activeReservations) {
    if (res.company_id !== order.company_id || res.branch_id !== order.branch_id) {
      return {
        valid: false,
        error: `Inconsistência de contexto na reserva ${res.id}: empresa ou filial da reserva difere do pedido de venda.`,
        details: []
      };
    }
  }

  // 4. Agrupar quantidades reservadas ativas por item_id
  const reservedMap = new Map<string, number>();
  for (const res of activeReservations) {
    const cur = reservedMap.get(res.item_id) || 0;
    reservedMap.set(res.item_id, cur + Number(res.quantity));
  }

  const details: ReservationMismatchDetail[] = [];
  const allItemIds = new Set<string>([...requiredMap.keys(), ...reservedMap.keys()]);

  for (const itemId of allItemIds) {
    const req = requiredMap.get(itemId) || 0;
    const res = reservedMap.get(itemId) || 0;
    const diff = res - req;

    if (Math.abs(diff) > 0.00001) {
      const itemData = database.prepare('SELECT code, description FROM inventory_items WHERE id = ?').get(itemId) as any;
      let reason: ReservationMismatchDetail['reason'] = 'PARTIAL_RESERVATION';
      if (req > 0 && res === 0) {
        reason = 'MISSING_RESERVATION';
      } else if (req === 0 && res > 0) {
        reason = 'UNEXPECTED_ITEM';
      } else if (res < req) {
        reason = 'PARTIAL_RESERVATION';
      } else {
        reason = 'EXCESS_RESERVATION';
      }

      details.push({
        itemId,
        itemCode: itemData ? itemData.code : itemId,
        itemDescription: itemData ? itemData.description : '',
        requiredQuantity: req,
        reservedQuantity: res,
        difference: diff,
        reason
      });
    }
  }

  if (details.length > 0) {
    const descriptions = details.map(d => {
      const label = d.itemDescription || d.itemCode || d.itemId;
      if (d.reason === 'MISSING_RESERVATION') {
        return `${label}: necessário ${d.requiredQuantity}, nenhuma reserva ativa encontrada`;
      }
      if (d.reason === 'PARTIAL_RESERVATION') {
        return `${label}: necessário ${d.requiredQuantity}, reservado ${d.reservedQuantity} (falta ${Math.abs(d.difference)})`;
      }
      if (d.reason === 'EXCESS_RESERVATION') {
        return `${label}: necessário ${d.requiredQuantity}, reservado ${d.reservedQuantity} (excesso ${d.difference})`;
      }
      return `${label}: item inesperado com reserva ativa ${d.reservedQuantity} não presente no pedido`;
    }).join('; ');

    return {
      valid: false,
      error: `Não foi possível enviar o pedido porque as reservas ativas não correspondem integralmente aos itens do pedido: ${descriptions}. Nenhuma movimentação física foi realizada.`,
      details
    };
  }

  return {
    valid: true,
    details: []
  };
}
