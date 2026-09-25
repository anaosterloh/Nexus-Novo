import db from '../db';

export interface PickingSummaryItem {
  reservationId: string;
  itemId: string;
  itemCode: string;
  itemDescription: string;
  tracksBatch: boolean;
  tracksSerial: boolean;
  requiredQuantity: number;
  pickedQuantity: number;
  remainingQuantity: number;
  status: 'not_started' | 'partial' | 'complete';
  allocations: PickingAllocationDTO[];
}

export interface PickingAllocationDTO {
  id: string;
  reservationId: string;
  positionId: string;
  locationName: string;
  locationCode?: string;
  lotId?: string | null;
  lotNumber?: string | null;
  serialId?: string | null;
  serialNumber?: string | null;
  quantity: number;
  status: string;
  pickedBy?: string | null;
  pickedAt?: string | null;
}

export interface OrderPickingSummary {
  orderId: string;
  status: string;
  stockFlowMode?: string;
  items: PickingSummaryItem[];
  canShip: boolean;
  allComplete: boolean;
  totalRequired: number;
  totalPicked: number;
}

export interface PickingPositionOption {
  positionId: string;
  locationId: string;
  locationName: string;
  locationCode?: string;
  physicalQuantity: number;
  allocatedQuantity: number;
  availableForPicking: number;
  lotId?: string | null;
  lotNumber?: string | null;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
  lotStatus?: string | null;
}

export interface PickingSerialOption {
  serialId: string;
  serialNumber: string;
  lotId?: string | null;
  lotNumber?: string | null;
  positionId?: string | null;
  locationName?: string | null;
  status: string;
}

/**
 * Calcula a quantidade de uma posição física atualmente comprometida em alocações de picking ativas.
 */
export function getActiveAllocatedQuantityAtPosition(positionId: string, database: any = db): number {
  const row = database.prepare(`
    SELECT COALESCE(SUM(quantity), 0) as total
    FROM picking_allocations
    WHERE position_id = ? AND status = 'active'
  `).get(positionId) as { total: number } | undefined;
  return row ? Number(row.total) : 0;
}

/**
 * Calcula a disponibilidade física de uma posição para nova alocação de picking:
 * stock_positions.quantity - SUM(picking_allocations active naquela posição).
 */
export function getAvailableForPickingAtPosition(positionId: string, database: any = db): number {
  const pos = database.prepare('SELECT quantity, state FROM stock_positions WHERE id = ?').get(positionId) as { quantity: number; state: string } | undefined;
  if (!pos || pos.state !== 'AVAILABLE') return 0;
  const activeAllocated = getActiveAllocatedQuantityAtPosition(positionId, database);
  return Math.max(0, Number(pos.quantity) - activeAllocated);
}

/**
 * Retorna as posições físicas elegíveis para picking de uma reserva comercial.
 */
export function getPickingPositionOptions(reservationId: string, database: any = db): {
  reservation: any;
  item: any;
  options: PickingPositionOption[];
} {
  const reservation = database.prepare('SELECT * FROM stock_reservations WHERE id = ?').get(reservationId) as any;
  if (!reservation) {
    throw new Error('Reserva não encontrada');
  }

  const item = database.prepare(`
    SELECT id, code, description, tracks_batch, tracks_serial 
    FROM inventory_items 
    WHERE id = ?
  `).get(reservation.item_id) as any;

  // Buscar posições físicas AVAILABLE para o item na mesma filial e empresa
  const positions = database.prepare(`
    SELECT 
      p.id as position_id,
      p.location_id,
      l.name as location_name,
      l.code as location_code,
      p.quantity as physical_quantity,
      p.lot_id,
      lt.lot_number,
      lt.manufacturing_date,
      lt.expiry_date,
      lt.status as lot_status
    FROM stock_positions p
    JOIN stock_locations l ON p.location_id = l.id
    LEFT JOIN stock_lots lt ON p.lot_id = lt.id
    WHERE p.branch_id = ?
      AND p.company_id = ?
      AND p.item_id = ?
      AND p.state = 'AVAILABLE'
      AND p.quantity > 0
  `).all(reservation.branch_id, reservation.company_id, reservation.item_id) as any[];

  const options: PickingPositionOption[] = [];

  for (const pos of positions) {
    // Se o item exige lote, a posição DEVE ter um lote com status 'active'
    if (item.tracks_batch === 1) {
      if (!pos.lot_id || pos.lot_status !== 'active') {
        continue; // Ignora posições sem lote ou com lote bloqueado/quarentena
      }
    }

    const allocated = getActiveAllocatedQuantityAtPosition(pos.position_id, database);
    const available = Math.max(0, Number(pos.physical_quantity) - allocated);

    if (available > 0) {
      options.push({
        positionId: pos.position_id,
        locationId: pos.location_id,
        locationName: pos.location_name,
        locationCode: pos.location_code,
        physicalQuantity: Number(pos.physical_quantity),
        allocatedQuantity: allocated,
        availableForPicking: available,
        lotId: pos.lot_id,
        lotNumber: pos.lot_number,
        manufacturingDate: pos.manufacturing_date,
        expiryDate: pos.expiry_date,
        lotStatus: pos.lot_status
      });
    }
  }

  return { reservation, item, options };
}

/**
 * Retorna os números de série elegíveis para picking em uma reserva e opcionalmente posição.
 */
export function getPickingSerialOptions(
  params: { reservationId: string; positionId?: string },
  database: any = db
): PickingSerialOption[] {
  const { reservationId, positionId } = params;
  const reservation = database.prepare('SELECT * FROM stock_reservations WHERE id = ?').get(reservationId) as any;
  if (!reservation) {
    throw new Error('Reserva não encontrada');
  }

  let targetLotId: string | null = null;
  if (positionId) {
    const pos = database.prepare('SELECT lot_id FROM stock_positions WHERE id = ?').get(positionId) as any;
    targetLotId = pos ? pos.lot_id : null;
  }

  // Seriais com status = 'in_stock', mesma empresa, filial e item
  let query = `
    SELECT 
      s.id as serial_id,
      s.serial_number,
      s.lot_id,
      lt.lot_number,
      s.position_id,
      l.name as location_name,
      s.status
    FROM stock_serials s
    LEFT JOIN stock_lots lt ON s.lot_id = lt.id
    LEFT JOIN stock_positions p ON s.position_id = p.id
    LEFT JOIN stock_locations l ON p.location_id = l.id
    WHERE s.company_id = ?
      AND s.branch_id = ?
      AND s.item_id = ?
      AND s.status = 'in_stock'
  `;
  const args: any[] = [reservation.company_id, reservation.branch_id, reservation.item_id];

  if (targetLotId) {
    query += ` AND s.lot_id = ?`;
    args.push(targetLotId);
  }

  if (positionId) {
    // Seriais que já pertencem a esta posição OU ainda não possuem posição estruturada (position_id IS NULL)
    query += ` AND (s.position_id = ? OR s.position_id IS NULL)`;
    args.push(positionId);
  }

  const serials = database.prepare(query).all(...args) as any[];

  // Filtrar seriais que por ventura já estejam em picking_allocations ativas
  const activeSerialIds = new Set<string>(
    (database.prepare("SELECT serial_id FROM picking_allocations WHERE status = 'active' AND serial_id IS NOT NULL").all() as any[])
      .map(r => r.serial_id)
  );

  return serials
    .filter(s => !activeSerialIds.has(s.serial_id))
    .map(s => ({
      serialId: s.serial_id,
      serialNumber: s.serial_number,
      lotId: s.lot_id,
      lotNumber: s.lot_number,
      positionId: s.position_id,
      locationName: s.location_name,
      status: s.status
    }));
}

/**
 * Cria uma alocação física de separação / picking para uma reserva de pedido de venda.
 * Executa todas as validações atômicas dentro da transação.
 */
export function createPickingAllocation(
  params: {
    orderId: string;
    reservationId: string;
    positionId: string;
    quantity: number;
    serialId?: string | null;
    userId?: string;
  },
  database: any = db
): { id: string; allocation: any } {
  const { orderId, reservationId, positionId, serialId, userId } = params;
  const requestedQty = Number(params.quantity);

  if (isNaN(requestedQty) || requestedQty <= 0) {
    throw new Error('Quantidade a separar deve ser maior que zero.');
  }

  // 1. Validar pedido
  const order = database.prepare('SELECT * FROM sales_orders WHERE id = ?').get(orderId) as any;
  if (!order) throw new Error('Pedido de venda não encontrado.');
  if (order.status !== 'confirmed') {
    throw new Error('Separação permitida apenas para pedidos confirmados.');
  }
  if (order.stock_flow_mode !== 'reservation_v1') {
    throw new Error('Este pedido foi confirmado no fluxo legado e não opera com separação física.');
  }

  // 2. Validar reserva
  const reservation = database.prepare('SELECT * FROM stock_reservations WHERE id = ?').get(reservationId) as any;
  if (!reservation) throw new Error('Reserva não encontrada.');
  if (reservation.reference_type !== 'sales_order' || reservation.reference_id !== orderId) {
    throw new Error('A reserva não pertence a este pedido de venda.');
  }
  if (reservation.status !== 'active') {
    throw new Error('Apenas reservas comerciais ativas podem receber separação.');
  }
  if (reservation.company_id !== order.company_id || reservation.branch_id !== order.branch_id) {
    throw new Error('Inconsistência de empresa/filial entre a reserva e o pedido.');
  }

  // 3. Carregar item para regras de lote e serial
  const item = database.prepare(`
    SELECT id, code, description, tracks_batch, tracks_serial 
    FROM inventory_items 
    WHERE id = ?
  `).get(reservation.item_id) as any;
  if (!item) throw new Error('Produto da reserva não encontrado.');

  // 4. Validar quantidade restante a separar da reserva
  const alreadyPickedRow = database.prepare(`
    SELECT COALESCE(SUM(quantity), 0) as total
    FROM picking_allocations
    WHERE reservation_id = ? AND status = 'active'
  `).get(reservationId) as { total: number } | undefined;
  const alreadyPicked = alreadyPickedRow ? Number(alreadyPickedRow.total) : 0;
  const remainingToPick = Number(reservation.quantity) - alreadyPicked;

  if (requestedQty > remainingToPick + 0.00001) {
    throw new Error(
      `Quantidade excede o saldo da reserva: necessário ${remainingToPick}, solicitado ${requestedQty}.`
    );
  }

  // 5. Validar posição física
  const position = database.prepare('SELECT * FROM stock_positions WHERE id = ?').get(positionId) as any;
  if (!position) throw new Error('Posição física não encontrada.');
  if (position.branch_id !== order.branch_id || position.company_id !== order.company_id) {
    throw new Error('A posição física selecionada não pertence à mesma empresa/filial do pedido.');
  }
  if (position.item_id !== reservation.item_id) {
    throw new Error('A posição física não contém o mesmo produto da reserva.');
  }
  if (position.state !== 'AVAILABLE') {
    throw new Error(`A posição física não está disponível (estado atual: ${position.state}).`);
  }

  const availableAtPos = getAvailableForPickingAtPosition(positionId, database);
  if (requestedQty > availableAtPos + 0.00001) {
    throw new Error(
      `Disponibilidade física insuficiente na posição: disponível para picking ${availableAtPos}, solicitado ${requestedQty}.`
    );
  }

  // 6. Regras de Lote
  let allocatedLotId = position.lot_id || null;
  if (item.tracks_batch === 1) {
    if (!position.lot_id) {
      throw new Error(`O item "${item.description}" controla lote, mas a posição física selecionada não possui lote associado.`);
    }
    const lot = database.prepare('SELECT * FROM stock_lots WHERE id = ?').get(position.lot_id) as any;
    if (!lot || lot.status !== 'active') {
      throw new Error(`O lote associado à posição (${lot?.lot_number || position.lot_id}) não está ativo para separação.`);
    }
    allocatedLotId = lot.id;
  }

  // 7. Regras de Serial
  let allocatedSerialId: string | null = null;
  if (item.tracks_serial === 1) {
    if (!serialId) {
      throw new Error(`O item "${item.description}" controla número de série. É obrigatório selecionar o serial individual.`);
    }
    if (requestedQty !== 1) {
      throw new Error('Itens serializados devem ser alocados individualmente (quantidade = 1 por serial).');
    }

    const serial = database.prepare('SELECT * FROM stock_serials WHERE id = ?').get(serialId) as any;
    if (!serial) throw new Error('Número de série não encontrado.');
    if (serial.item_id !== reservation.item_id) {
      throw new Error('O número de série não pertence ao produto da reserva.');
    }
    if (serial.branch_id !== order.branch_id || serial.company_id !== order.company_id) {
      throw new Error('O número de série não pertence à mesma empresa/filial do pedido.');
    }
    if (serial.status !== 'in_stock') {
      throw new Error(`O serial ${serial.serial_number} não está disponível em estoque (status atual: ${serial.status}).`);
    }

    // Se o item também controlar lote, validar correspondência
    if (item.tracks_batch === 1 && serial.lot_id) {
      if (serial.lot_id !== position.lot_id) {
        throw new Error(
          `Incompatibilidade entre lote e serial: o serial ${serial.serial_number} pertence ao lote ${serial.lot_id}, mas a posição pertence ao lote ${position.lot_id}.`
        );
      }
    }

    // Regra de Caso A / Caso B para posição do serial
    if (serial.position_id && serial.position_id !== positionId) {
      throw new Error(
        `O serial ${serial.serial_number} está registrado na posição física ${serial.position_id}, diferente da posição selecionada ${positionId}.`
      );
    }

    allocatedSerialId = serial.id;

    // Atualizar serial: status -> 'reserved' e vincular position_id se era NULL
    database.prepare(`
      UPDATE stock_serials 
      SET status = 'reserved', position_id = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(positionId, serial.id);
  } else if (serialId) {
    throw new Error('Não é permitido informar número de série para itens que não controlam serial.');
  }

  // 8. Gravar alocação ativa
  const allocationId = `pick_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  database.prepare(`
    INSERT INTO picking_allocations (
      id, reservation_id, position_id, lot_id, serial_id, quantity, status, picked_by, picked_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(
    allocationId,
    reservationId,
    positionId,
    allocatedLotId,
    allocatedSerialId,
    requestedQty,
    userId || order.user_id || 'user_1'
  );

  const saved = database.prepare('SELECT * FROM picking_allocations WHERE id = ?').get(allocationId);
  return { id: allocationId, allocation: saved };
}

/**
 * Cancela/libera uma alocação física de separação.
 */
export function cancelPickingAllocation(
  params: { orderId: string; allocationId: string },
  database: any = db
): { success: boolean; message: string } {
  const { orderId, allocationId } = params;

  const allocation = database.prepare('SELECT * FROM picking_allocations WHERE id = ?').get(allocationId) as any;
  if (!allocation) throw new Error('Alocação de separação não encontrada.');
  if (allocation.status !== 'active') {
    throw new Error('Apenas alocações ativas podem ser canceladas.');
  }

  const reservation = database.prepare('SELECT * FROM stock_reservations WHERE id = ?').get(allocation.reservation_id) as any;
  if (!reservation || reservation.reference_id !== orderId) {
    throw new Error('A alocação não pertence ao pedido de venda informado.');
  }

  const order = database.prepare('SELECT * FROM sales_orders WHERE id = ?').get(orderId) as any;
  if (!order || order.status !== 'confirmed') {
    throw new Error('Apenas alocações de pedidos confirmados podem ser liberadas.');
  }

  // Se houver serial, devolver status para in_stock preservando position_id
  if (allocation.serial_id) {
    database.prepare(`
      UPDATE stock_serials 
      SET status = 'in_stock', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(allocation.serial_id);
  }

  database.prepare(`
    UPDATE picking_allocations 
    SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(allocationId);

  return { success: true, message: 'Alocação de separação liberada com sucesso.' };
}

/**
 * Libera todas as alocações ativas de um pedido (ex: quando o pedido é cancelado).
 */
export function cancelOrderPickingAllocations(orderId: string, database: any = db): number {
  const activeAllocations = database.prepare(`
    SELECT p.id, p.serial_id
    FROM picking_allocations p
    JOIN stock_reservations r ON p.reservation_id = r.id
    WHERE r.reference_type = 'sales_order'
      AND r.reference_id = ?
      AND p.status = 'active'
  `).all(orderId) as any[];

  for (const alloc of activeAllocations) {
    if (alloc.serial_id) {
      database.prepare(`
        UPDATE stock_serials 
        SET status = 'in_stock', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(alloc.serial_id);
    }
  }

  if (activeAllocations.length > 0) {
    database.prepare(`
      UPDATE picking_allocations 
      SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id IN (
        SELECT p.id FROM picking_allocations p
        JOIN stock_reservations r ON p.reservation_id = r.id
        WHERE r.reference_type = 'sales_order' AND r.reference_id = ? AND p.status = 'active'
      )
    `).run(orderId);
  }

  return activeAllocations.length;
}

/**
 * Retorna o resumo completo de picking de um pedido de venda.
 */
export function getOrderPickingSummary(orderId: string, database: any = db): OrderPickingSummary {
  const order = database.prepare('SELECT id, status, stock_flow_mode FROM sales_orders WHERE id = ?').get(orderId) as any;
  if (!order) throw new Error('Pedido não encontrado.');

  const reservations = database.prepare(`
    SELECT r.*, i.code as item_code, i.description as item_description, i.tracks_batch, i.tracks_serial
    FROM stock_reservations r
    JOIN inventory_items i ON r.item_id = i.id
    WHERE r.reference_type = 'sales_order'
      AND r.reference_id = ?
      AND r.status IN ('active', 'fulfilled')
  `).all(orderId) as any[];

  const items: PickingSummaryItem[] = [];
  let totalRequired = 0;
  let totalPicked = 0;
  let allComplete = reservations.length > 0;

  for (const res of reservations) {
    const allocationsRaw = database.prepare(`
      SELECT 
        pa.id,
        pa.reservation_id,
        pa.position_id,
        l.name as location_name,
        l.code as location_code,
        pa.lot_id,
        lt.lot_number,
        pa.serial_id,
        s.serial_number,
        pa.quantity,
        pa.status,
        pa.picked_by,
        pa.picked_at
      FROM picking_allocations pa
      JOIN stock_positions pos ON pa.position_id = pos.id
      JOIN stock_locations l ON pos.location_id = l.id
      LEFT JOIN stock_lots lt ON pa.lot_id = lt.id
      LEFT JOIN stock_serials s ON pa.serial_id = s.id
      WHERE pa.reservation_id = ?
      ORDER BY pa.created_at ASC
    `).all(res.id) as any[];

    const activeAllocations = allocationsRaw.filter(a => a.status === (order.status === 'shipped' ? 'fulfilled' : 'active'));
    const pickedQty = activeAllocations.reduce((acc, a) => acc + Number(a.quantity), 0);
    const requiredQty = Number(res.quantity);
    const remainingQty = Math.max(0, requiredQty - pickedQty);

    let status: PickingSummaryItem['status'] = 'not_started';
    if (Math.abs(pickedQty - requiredQty) < 0.00001) {
      status = 'complete';
    } else if (pickedQty > 0) {
      status = 'partial';
      allComplete = false;
    } else {
      status = 'not_started';
      allComplete = false;
    }

    totalRequired += requiredQty;
    totalPicked += pickedQty;

    items.push({
      reservationId: res.id,
      itemId: res.item_id,
      itemCode: res.item_code,
      itemDescription: res.item_description,
      tracksBatch: res.tracks_batch === 1,
      tracksSerial: res.tracks_serial === 1,
      requiredQuantity: requiredQty,
      pickedQuantity: pickedQty,
      remainingQuantity: remainingQty,
      status,
      allocations: allocationsRaw.map(a => ({
        id: a.id,
        reservationId: a.reservation_id,
        positionId: a.position_id,
        locationName: a.location_name,
        locationCode: a.location_code,
        lotId: a.lot_id,
        lotNumber: a.lot_number,
        serialId: a.serial_id,
        serialNumber: a.serial_number,
        quantity: Number(a.quantity),
        status: a.status,
        pickedBy: a.picked_by,
        pickedAt: a.picked_at
      }))
    });
  }

  const canShip = order.status === 'confirmed' && reservations.length > 0 && allComplete;

  return {
    orderId,
    status: order.status,
    stockFlowMode: order.stock_flow_mode,
    items,
    canShip,
    allComplete,
    totalRequired,
    totalPicked
  };
}

/**
 * Validação rigorosa do picking completo antes do envio (ship).
 * Retorna as alocações ativas a serem consumidas.
 */
export function validateAndGetCompletePickingAllocations(
  order: { id: string; company_id: string; branch_id: string },
  database: any = db
): {
  valid: boolean;
  error?: string;
  allocations: any[];
} {
  const activeReservations = database.prepare(`
    SELECT * FROM stock_reservations
    WHERE reference_type = 'sales_order'
      AND reference_id = ?
      AND status = 'active'
  `).all(order.id) as any[];

  if (activeReservations.length === 0) {
    return {
      valid: false,
      error: 'Não há reservas ativas para o pedido.',
      allocations: []
    };
  }

  const allAllocations: any[] = [];

  for (const res of activeReservations) {
    const allocations = database.prepare(`
      SELECT pa.*, pos.branch_id, pos.company_id, pos.item_id, pos.state as position_state, pos.quantity as position_physical_quantity
      FROM picking_allocations pa
      JOIN stock_positions pos ON pa.position_id = pos.id
      WHERE pa.reservation_id = ? AND pa.status = 'active'
    `).all(res.id) as any[];

    const sumAllocated = allocations.reduce((acc, a) => acc + Number(a.quantity), 0);
    const required = Number(res.quantity);

    if (Math.abs(sumAllocated - required) > 0.00001) {
      const item = database.prepare('SELECT code, description FROM inventory_items WHERE id = ?').get(res.item_id) as any;
      const itemName = item?.description || item?.code || res.item_id;
      return {
        valid: false,
        error: `Separação física incompleta ou inconsistente para o item "${itemName}": reservado ${required}, separado ${sumAllocated}. Conclua a separação antes do envio.`,
        allocations: []
      };
    }

    // Validar coerência física de cada alocação
    for (const alloc of allocations) {
      if (alloc.branch_id !== order.branch_id || alloc.company_id !== order.company_id) {
        return {
          valid: false,
          error: `A alocação ${alloc.id} pertence a filial/empresa diferente do pedido de venda.`,
          allocations: []
        };
      }
      if (alloc.item_id !== res.item_id) {
        return {
          valid: false,
          error: `A alocação ${alloc.id} faz referência a item diferente da reserva.`,
          allocations: []
        };
      }
      if (alloc.position_state !== 'AVAILABLE') {
        return {
          valid: false,
          error: `A posição física da alocação ${alloc.id} não está no estado AVAILABLE.`,
          allocations: []
        };
      }
      allAllocations.push(alloc);
    }
  }

  // Validar se o total de alocações consumidas por posição física não excede a quantidade física atual da posição
  const posDemand = new Map<string, number>();
  for (const a of allAllocations) {
    posDemand.set(a.position_id, (posDemand.get(a.position_id) || 0) + Number(a.quantity));
  }

  for (const [posId, demand] of posDemand.entries()) {
    const pos = database.prepare('SELECT quantity FROM stock_positions WHERE id = ?').get(posId) as any;
    if (!pos || Number(pos.quantity) < demand - 0.00001) {
      return {
        valid: false,
        error: `Saldo físico insuficiente na posição ${posId} para efetivar o envio: disponível ${pos?.quantity || 0}, demandado ${demand}.`,
        allocations: []
      };
    }
  }

  return {
    valid: true,
    allocations: allAllocations
  };
}
