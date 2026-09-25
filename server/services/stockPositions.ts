import db from '../db';

export interface StockLocation {
  id: string;
  company_id: string;
  branch_id: string;
  parent_id?: string | null;
  name: string;
  code?: string | null;
  system_key?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface StockPosition {
  id: string;
  company_id: string;
  branch_id: string;
  item_id: string;
  lot_id?: string | null;
  location_id: string;
  state: 'AVAILABLE' | 'QUARANTINE' | 'MAINTENANCE' | 'PENDING_DISPOSAL';
  quantity: number;
  created_at?: string;
  updated_at?: string;
}

export interface ApplyPositionDeltaParams {
  companyId?: string;
  branchId: string;
  itemId: string;
  locationId?: string;
  state?: 'AVAILABLE' | 'QUARANTINE' | 'MAINTENANCE' | 'PENDING_DISPOSAL';
  lotId?: string | null;
  deltaQuantity: number;
}

export interface ApplyPositionDeltaResult {
  positionId: string;
  previousQuantity: number;
  newQuantity: number;
  locationId: string;
  state: string;
}

/**
 * Obtém ou cria idempotentemente a localização técnica 'SALDO LEGADO / NÃO ALOCADO' para uma filial.
 */
export function getOrCreateLegacyUnallocatedLocation(
  branchId: string,
  companyId?: string,
  database: any = db
): StockLocation {
  const existing = database.prepare(`
    SELECT * FROM stock_locations 
    WHERE branch_id = ? AND system_key = 'LEGACY_UNALLOCATED'
  `).get(branchId) as StockLocation | undefined;

  if (existing) {
    return existing;
  }

  let finalCompanyId = companyId;
  if (!finalCompanyId) {
    const branch = database.prepare('SELECT company_id FROM branches WHERE id = ?').get(branchId) as any;
    finalCompanyId = branch ? branch.company_id : 'comp_1';
  }

  const id = `loc_legacy_${branchId}`;
  database.prepare(`
    INSERT INTO stock_locations (
      id, company_id, branch_id, parent_id, name, code, system_key, status, created_at, updated_at
    ) VALUES (?, ?, ?, NULL, 'SALDO LEGADO / NÃO ALOCADO', 'LEGACY_UNALLOCATED', 'LEGACY_UNALLOCATED', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(id, finalCompanyId, branchId);

  return {
    id,
    company_id: finalCompanyId,
    branch_id: branchId,
    name: 'SALDO LEGADO / NÃO ALOCADO',
    code: 'LEGACY_UNALLOCATED',
    system_key: 'LEGACY_UNALLOCATED',
    status: 'active'
  };
}

/**
 * Aplica um delta na quantidade de uma posição física.
 * Participa da transação SQLite ativa se invocado dentro de db.transaction().
 */
export function applyStockPositionDelta(
  params: ApplyPositionDeltaParams,
  database: any = db
): ApplyPositionDeltaResult {
  const {
    companyId,
    branchId,
    itemId,
    locationId,
    state = 'AVAILABLE',
    lotId = null,
    deltaQuantity
  } = params;

  // Se não foi informada localização, direciona para o saldo técnico não alocado da filial
  const targetLocationId = locationId || getOrCreateLegacyUnallocatedLocation(branchId, companyId, database).id;
  const targetState = state || 'AVAILABLE';

  // Buscar posição existente que corresponda à combinação (branch, item, location, state, lot)
  let existingPosition: any = null;
  if (lotId) {
    existingPosition = database.prepare(`
      SELECT id, quantity, company_id FROM stock_positions 
      WHERE branch_id = ? AND item_id = ? AND location_id = ? AND state = ? AND lot_id = ?
    `).get(branchId, itemId, targetLocationId, targetState, lotId);
  } else {
    existingPosition = database.prepare(`
      SELECT id, quantity, company_id FROM stock_positions 
      WHERE branch_id = ? AND item_id = ? AND location_id = ? AND state = ? AND lot_id IS NULL
    `).get(branchId, itemId, targetLocationId, targetState);
  }

  if (existingPosition) {
    const previousQuantity = Number(existingPosition.quantity) || 0;
    const newQuantity = previousQuantity + deltaQuantity;

    database.prepare(`
      UPDATE stock_positions 
      SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(newQuantity, existingPosition.id);

    if (newQuantity < 0) {
      console.warn(
        `[AVISO ESTOQUE FÍSICO] Posição ${existingPosition.id} (item ${itemId}, filial ${branchId}) resultou em saldo negativo: ${newQuantity}`
      );
    }

    return {
      positionId: existingPosition.id,
      previousQuantity,
      newQuantity,
      locationId: targetLocationId,
      state: targetState
    };
  } else {
    let resolvedCompId = companyId;
    if (!resolvedCompId) {
      const item = database.prepare('SELECT company_id FROM inventory_items WHERE id = ?').get(itemId) as any;
      resolvedCompId = item ? item.company_id : undefined;
    }
    if (!resolvedCompId) {
      const branch = database.prepare('SELECT company_id FROM branches WHERE id = ?').get(branchId) as any;
      resolvedCompId = branch ? branch.company_id : 'comp_1';
    }

    const positionId = `pos_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    database.prepare(`
      INSERT INTO stock_positions (
        id, company_id, branch_id, item_id, lot_id, location_id, state, quantity, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      positionId,
      resolvedCompId,
      branchId,
      itemId,
      lotId || null,
      targetLocationId,
      targetState,
      deltaQuantity
    );

    if (deltaQuantity < 0) {
      console.warn(
        `[AVISO ESTOQUE FÍSICO] Nova posição criada com saldo negativo: ${deltaQuantity} (item ${itemId}, filial ${branchId})`
      );
    }

    return {
      positionId,
      previousQuantity: 0,
      newQuantity: deltaQuantity,
      locationId: targetLocationId,
      state: targetState
    };
  }
}

/**
 * Consulta a soma física de todas as posições de um item em uma filial.
 */
export function getPositionsTotalQuantity(branchId: string, itemId: string, database: any = db): number {
  const row = database.prepare(`
    SELECT COALESCE(SUM(quantity), 0) as total 
    FROM stock_positions 
    WHERE branch_id = ? AND item_id = ?
  `).get(branchId, itemId) as { total: number } | undefined;
  return row ? Number(row.total) : 0;
}

/**
 * Verifica a coerência entre o saldo agregado de compatibilidade (stock_balances)
 * e o detalhe físico de posições (stock_positions).
 */
export function verifyBalanceConsistency(
  branchId: string,
  itemId: string,
  database: any = db
): {
  consistent: boolean;
  balanceQuantity: number;
  positionsQuantity: number;
  difference: number;
} {
  const balanceRow = database.prepare(
    'SELECT quantity FROM stock_balances WHERE branch_id = ? AND item_id = ?'
  ).get(branchId, itemId) as { quantity: number } | undefined;

  const balanceQuantity = balanceRow ? Number(balanceRow.quantity) : 0;
  const positionsQuantity = getPositionsTotalQuantity(branchId, itemId, database);
  const difference = balanceQuantity - positionsQuantity;

  return {
    consistent: Math.abs(difference) < 0.00001,
    balanceQuantity,
    positionsQuantity,
    difference
  };
}

/**
 * Migração segura e idempotente dos saldos existentes em stock_balances para stock_positions.
 */
export function migrateStockBalancesToPositions(database: any = db): {
  totalBalances: number;
  migratedCount: number;
  skippedCount: number;
  negativeBalancesCount: number;
  divergenceCount: number;
} {
  const balances = database.prepare(`
    SELECT b.branch_id, b.item_id, b.quantity, i.company_id
    FROM stock_balances b
    LEFT JOIN inventory_items i ON b.item_id = i.id
  `).all() as any[];

  let migratedCount = 0;
  let skippedCount = 0;
  let negativeBalancesCount = 0;
  let divergenceCount = 0;

  for (const b of balances) {
    const branchId = b.branch_id;
    const itemId = b.item_id;
    const balanceQty = Number(b.quantity) || 0;
    const companyId = b.company_id || 'comp_1';

    // 1. Garante a localização técnica da filial
    const legacyLocation = getOrCreateLegacyUnallocatedLocation(branchId, companyId, database);

    // 2. Verifica se já existe alguma posição para este branch_id + item_id
    const existingPositions = database.prepare(`
      SELECT id, quantity 
      FROM stock_positions 
      WHERE branch_id = ? AND item_id = ?
    `).all(branchId, itemId) as any[];

    if (existingPositions.length === 0) {
      // Cria a posição legado correspondente
      const posId = `pos_legacy_${branchId}_${itemId}`;
      database.prepare(`
        INSERT INTO stock_positions (
          id, company_id, branch_id, item_id, lot_id, location_id, state, quantity, created_at, updated_at
        ) VALUES (?, ?, ?, ?, NULL, ?, 'AVAILABLE', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(posId, companyId, branchId, itemId, legacyLocation.id, balanceQty);

      migratedCount++;

      if (balanceQty < 0) {
        negativeBalancesCount++;
        console.warn(
          `[AVISO ESTOQUE] Item ${itemId} na filial ${branchId} possui saldo agregado negativo (${balanceQty}). A quantidade foi preservada na posição legado para compatibilidade, requer revisão futura.`
        );
      }
    } else {
      skippedCount++;
      const posSum = existingPositions.reduce((acc: number, p: any) => acc + (Number(p.quantity) || 0), 0);
      if (Math.abs(posSum - balanceQty) > 0.00001) {
        divergenceCount++;
        console.warn(
          `[AVISO ESTOQUE] Divergência detectada para o item ${itemId} na filial ${branchId}: soma das posições físicas (${posSum}) difere de stock_balances.quantity (${balanceQty}). Nenhum dado foi alterado silenciosamente.`
        );
      }
    }
  }

  return {
    totalBalances: balances.length,
    migratedCount,
    skippedCount,
    negativeBalancesCount,
    divergenceCount
  };
}
