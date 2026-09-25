import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { migrateStockBalancesToPositions } from './services/stockPositions';

let dirName: string;
try {
  if (typeof __dirname !== 'undefined' && __dirname) {
    dirName = __dirname;
  } else {
    // Fallback for ESM or environments without __dirname
    dirName = path.dirname(fileURLToPath(import.meta.url));
  }
} catch (e) {
  dirName = path.join(process.cwd(), 'server');
}

const db = new Database(path.join(dirName, 'nexus_erp.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

export function initDb() {
  // Companies (Tenants)
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cnpj TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Branches
  db.exec(`
    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (company_id) REFERENCES companies(id)
    )
  `);

  // Users
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Adicionar colunas novas à tabela users de forma segura
  const addColumnIfNotExists = (tableName: string, columnName: string, columnDef: string) => {
    const info = db.prepare(`PRAGMA table_info(${tableName})`).all() as any[];
    if (!info.some(col => col.name === columnName)) {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
    }
  };

  addColumnIfNotExists('users', 'company_id', 'TEXT');
  addColumnIfNotExists('users', 'username', 'TEXT');
  addColumnIfNotExists('users', 'pin_hash', 'TEXT');
  addColumnIfNotExists('users', 'pin_reset_required', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('users', 'pin_failed_attempts', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('users', 'last_login_at', 'DATETIME');
  addColumnIfNotExists('users', 'last_active_at', 'DATETIME');
  addColumnIfNotExists('users', 'must_change_password', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('users', 'updated_at', 'DATETIME');

  db.exec('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');

  // Backfill updated_at safely
  db.exec('UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL');

  // Roles e Permissões
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      company_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      level INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS permissions (
      key TEXT PRIMARY KEY,
      label_pt TEXT NOT NULL,
      label_en TEXT,
      description TEXT,
      module TEXT,
      critical INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id TEXT NOT NULL,
      permission_key TEXT NOT NULL,
      allowed INTEGER DEFAULT 1,
      PRIMARY KEY(role_id, permission_key)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_permissions (
      user_id TEXT NOT NULL,
      permission_key TEXT NOT NULL,
      allowed INTEGER DEFAULT 1,
      reason TEXT,
      granted_by TEXT,
      granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(user_id, permission_key)
    )
  `);

  // Sessões
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      company_id TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen_at DATETIME,
      expires_at DATETIME,
      ended_at DATETIME,
      ended_reason TEXT,
      user_agent TEXT,
      ip_address TEXT
    )
  `);

  // PIN e Ações
  db.exec(`
    CREATE TABLE IF NOT EXISTS critical_actions_config (
      id TEXT PRIMARY KEY,
      company_id TEXT,
      action_key TEXT NOT NULL,
      label_pt TEXT NOT NULL,
      module TEXT,
      requires_pin INTEGER DEFAULT 1,
      pin_validity_minutes INTEGER DEFAULT 5,
      enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS pin_confirmations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      company_id TEXT,
      action_group TEXT,
      confirmed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      valid_until DATETIME,
      status TEXT DEFAULT 'active'
    )
  `);

  // Auditoria
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      company_id TEXT,
      user_id TEXT,
      user_name TEXT,
      module TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      entity_id TEXT,
      old_value TEXT,
      new_value TEXT,
      description TEXT,
      reason TEXT,
      requires_pin INTEGER DEFAULT 0,
      pin_verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS security_events (
      id TEXT PRIMARY KEY,
      company_id TEXT,
      user_id TEXT,
      user_name TEXT,
      event_type TEXT NOT NULL,
      severity TEXT DEFAULT 'info',
      description TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User Company Access (Multi-company logic)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_company_access (
      user_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      PRIMARY KEY (user_id, company_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (company_id) REFERENCES companies(id)
    )
  `);

  // Inventory Items (Products)
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      code TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT,
      unit TEXT NOT NULL,
      ncm TEXT,
      min_stock REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(company_id, code),
      FOREIGN KEY (company_id) REFERENCES companies(id)
    )
  `);

  // Stock Balances (per branch)
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_balances (
      branch_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      quantity REAL DEFAULT 0,
      reserved_quantity REAL DEFAULT 0,
      average_cost REAL DEFAULT 0,
      PRIMARY KEY (branch_id, item_id),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (item_id) REFERENCES inventory_items(id)
    )
  `);

  // Stock Movements (Logs)
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL, -- 'entry', 'exit', 'transfer', 'adjustment'
      quantity REAL NOT NULL,
      previous_balance REAL NOT NULL,
      new_balance REAL NOT NULL,
      reason TEXT,
      reference_id TEXT, -- ID of the order, OS, etc.
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (item_id) REFERENCES inventory_items(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // --- FUNDAÇÃO DE DADOS PARA ESTOQUE RASTREÁVEL ---
  // 1. Ampliação segura de inventory_items
  addColumnIfNotExists('inventory_items', 'item_type', "TEXT DEFAULT 'sale'"); // Classificação: 'sale', 'part', 'consumable'
  addColumnIfNotExists('inventory_items', 'tracks_batch', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('inventory_items', 'tracks_serial', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('inventory_items', 'tracks_expiry', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('inventory_items', 'tracks_manufacturing_date', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('inventory_items', 'is_composite', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('inventory_items', 'physical_location', 'TEXT');
  addColumnIfNotExists('inventory_items', 'validity_alert_days', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('inventory_items', 'cost_price', 'REAL DEFAULT 0');
  addColumnIfNotExists('inventory_items', 'selling_price', 'REAL DEFAULT 0');
  addColumnIfNotExists('inventory_items', 'min_selling_price', 'REAL DEFAULT 0');
  addColumnIfNotExists('inventory_items', 'max_stock', 'REAL DEFAULT 0');
  addColumnIfNotExists('inventory_items', 'cest', 'TEXT');
  addColumnIfNotExists('inventory_items', 'tax_regime', 'TEXT');
  addColumnIfNotExists('inventory_items', 'origin', 'TEXT');
  addColumnIfNotExists('inventory_items', 'cfop', 'TEXT');
  addColumnIfNotExists('inventory_items', 'observations', 'TEXT');
  addColumnIfNotExists('inventory_items', 'updated_at', 'DATETIME');

  // Transição segura de dados legados: separar classificação operacional de rastreabilidade
  try {
    db.exec(`
      UPDATE inventory_items SET tracks_batch = 1 WHERE item_type = 'batch' AND (tracks_batch IS NULL OR tracks_batch = 0);
      UPDATE inventory_items SET tracks_serial = 1 WHERE item_type = 'serial' AND (tracks_serial IS NULL OR tracks_serial = 0);
      UPDATE inventory_items SET is_composite = 1 WHERE item_type = 'kit' AND (is_composite IS NULL OR is_composite = 0);
      UPDATE inventory_items SET item_type = 'consumable' WHERE item_type = 'raw_material';
      UPDATE inventory_items SET item_type = 'sale' WHERE item_type IN ('simple', 'batch', 'serial', 'kit');
      UPDATE inventory_items SET item_type = 'sale' WHERE item_type IS NULL OR item_type = '';
    `);
  } catch (e) {
    console.error('Falha na migração suave de item_type:', e);
  }

  // 2. Ampliação segura de stock_movements (motivos estruturados e rastreabilidade)
  addColumnIfNotExists('stock_movements', 'lot_id', 'TEXT');
  addColumnIfNotExists('stock_movements', 'serial_id', 'TEXT');
  addColumnIfNotExists('stock_movements', 'movement_reason', 'TEXT'); // 'purchase_entry', 'sale_exit', 'inventory_adjustment', 'assembly_consumption', 'assembly_output', 'transfer_in', 'transfer_out', 'discard', 'return'
  addColumnIfNotExists('stock_movements', 'source_location', 'TEXT');
  addColumnIfNotExists('stock_movements', 'destination_location', 'TEXT');
  addColumnIfNotExists('stock_movements', 'cost', 'REAL');

  // 3. Lotes de Estoque (Validade, Fabricação, Quarentena, etc.)
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_lots (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      lot_number TEXT NOT NULL,
      manufacturing_date DATE,
      expiry_date DATE,
      quantity REAL DEFAULT 0,
      reserved_quantity REAL DEFAULT 0,
      physical_location TEXT,
      status TEXT DEFAULT 'active', -- 'active', 'blocked', 'quarantine', 'expired', 'exhausted'
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (item_id) REFERENCES inventory_items(id)
    )
  `);

  db.exec('CREATE INDEX IF NOT EXISTS idx_stock_lots_comp ON stock_lots(company_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_stock_lots_item ON stock_lots(item_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_stock_lots_branch ON stock_lots(branch_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_stock_lots_number ON stock_lots(lot_number)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_stock_lots_status ON stock_lots(status)');

  // 4. Números de Série do Estoque (separado estritamente de equipments)
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_serials (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      lot_id TEXT,
      serial_number TEXT NOT NULL,
      physical_location TEXT,
      status TEXT DEFAULT 'in_stock', -- 'in_stock', 'reserved', 'shipped', 'consumed', 'maintenance', 'blocked'
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (item_id) REFERENCES inventory_items(id),
      FOREIGN KEY (lot_id) REFERENCES stock_lots(id)
    )
  `);

  db.exec('CREATE INDEX IF NOT EXISTS idx_stock_serials_comp ON stock_serials(company_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_stock_serials_item ON stock_serials(item_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_stock_serials_lot ON stock_serials(lot_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_stock_serials_num ON stock_serials(serial_number)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_stock_serials_status ON stock_serials(status)');

  // Unicidade de número de série segura para bases existentes com proteção contra falhas de migração
  try {
    const serialDuplicates = db.prepare(`
      SELECT company_id, item_id, serial_number, COUNT(*) as cnt 
      FROM stock_serials 
      GROUP BY company_id, item_id, serial_number 
      HAVING cnt > 1
    `).all() as any[];

    if (serialDuplicates.length === 0) {
      db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_serials_unique ON stock_serials(company_id, item_id, serial_number)');
    } else {
      console.warn(
        `[AVISO ESTOQUE] Existem ${serialDuplicates.length} grupo(s) de números de série duplicados em stock_serials no banco legado. ` +
        `O índice UNIQUE não foi aplicado nesta inicialização para proteger os dados existentes sem exclusão automática. ` +
        `É necessária revisão manual desses registros antes de aplicar a restrição definitiva. ` +
        `A proteção da API continua ativa impedindo novos registros duplicados.`
      );
    }
  } catch (err) {
    console.warn('[AVISO ESTOQUE] Falha ao verificar/aplicar índice de unicidade de stock_serials:', err);
  }

  // 5. Reservas Rastreáveis de Estoque (sem alterar confirmação imediata existente)
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_reservations (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      lot_id TEXT,
      serial_id TEXT,
      quantity REAL NOT NULL,
      reference_type TEXT NOT NULL, -- 'sales_order', 'service_order', 'assembly', 'manual'
      reference_id TEXT,
      status TEXT DEFAULT 'active', -- 'active', 'fulfilled', 'cancelled'
      notes TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (item_id) REFERENCES inventory_items(id),
      FOREIGN KEY (lot_id) REFERENCES stock_lots(id),
      FOREIGN KEY (serial_id) REFERENCES stock_serials(id)
    )
  `);

  db.exec('CREATE INDEX IF NOT EXISTS idx_stock_res_comp ON stock_reservations(company_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_stock_res_item ON stock_reservations(item_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_stock_res_ref ON stock_reservations(reference_type, reference_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_stock_res_status ON stock_reservations(status)');

  // 6. Composição de Produto / BOM (Bill of Materials para Kits e Itens Compostos)
  db.exec(`
    CREATE TABLE IF NOT EXISTS item_compositions (
      id TEXT PRIMARY KEY,
      parent_item_id TEXT NOT NULL,
      component_item_id TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      unit TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_item_id) REFERENCES inventory_items(id),
      FOREIGN KEY (component_item_id) REFERENCES inventory_items(id)
    )
  `);

  db.exec('CREATE INDEX IF NOT EXISTS idx_comp_parent ON item_compositions(parent_item_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_comp_component ON item_compositions(component_item_id)');

  // 7. Montagens de Kits Físicos
  db.exec(`
    CREATE TABLE IF NOT EXISTS kit_assemblies (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      parent_item_id TEXT NOT NULL,
      output_lot_id TEXT,
      output_serial_id TEXT,
      quantity REAL NOT NULL DEFAULT 1,
      status TEXT DEFAULT 'completed', -- 'draft', 'in_progress', 'completed', 'cancelled'
      assembly_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (parent_item_id) REFERENCES inventory_items(id),
      FOREIGN KEY (output_lot_id) REFERENCES stock_lots(id),
      FOREIGN KEY (output_serial_id) REFERENCES stock_serials(id)
    )
  `);

  db.exec('CREATE INDEX IF NOT EXISTS idx_kit_asm_comp ON kit_assemblies(company_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_kit_asm_parent ON kit_assemblies(parent_item_id)');

  // 8. Genealogia dos Componentes Consumidos no Kit
  db.exec(`
    CREATE TABLE IF NOT EXISTS kit_assembly_items (
      id TEXT PRIMARY KEY,
      assembly_id TEXT NOT NULL,
      component_item_id TEXT NOT NULL,
      quantity REAL NOT NULL,
      consumed_lot_id TEXT,
      consumed_serial_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assembly_id) REFERENCES kit_assemblies(id),
      FOREIGN KEY (component_item_id) REFERENCES inventory_items(id),
      FOREIGN KEY (consumed_lot_id) REFERENCES stock_lots(id),
      FOREIGN KEY (consumed_serial_id) REFERENCES stock_serials(id)
    )
  `);

  db.exec('CREATE INDEX IF NOT EXISTS idx_kit_item_asm ON kit_assembly_items(assembly_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_kit_item_comp ON kit_assembly_items(component_item_id)');

  // 9. Localizações Físicas de Estoque (Estrutura física persistente)
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_locations (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      parent_id TEXT,
      name TEXT NOT NULL,
      code TEXT,
      system_key TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (parent_id) REFERENCES stock_locations(id)
    )
  `);

  db.exec('CREATE INDEX IF NOT EXISTS idx_stock_locations_comp ON stock_locations(company_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_stock_locations_branch ON stock_locations(branch_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_stock_locations_parent ON stock_locations(parent_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_stock_locations_syskey ON stock_locations(branch_id, system_key)');

  // 10. Posições Físicas de Estoque (Detalhe físico operacional)
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_positions (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      lot_id TEXT,
      location_id TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'QUARANTINE', 'MAINTENANCE', 'PENDING_DISPOSAL'
      quantity REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (item_id) REFERENCES inventory_items(id),
      FOREIGN KEY (lot_id) REFERENCES stock_lots(id),
      FOREIGN KEY (location_id) REFERENCES stock_locations(id)
    )
  `);

  db.exec('CREATE INDEX IF NOT EXISTS idx_stock_positions_comp ON stock_positions(company_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_stock_positions_branch_item ON stock_positions(branch_id, item_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_stock_positions_location ON stock_positions(location_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_stock_positions_lot ON stock_positions(lot_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_stock_positions_state ON stock_positions(state)');

  // Purchase Requests (Solicitações de Compra)
  db.exec(`
    CREATE TABLE IF NOT EXISTS purchase_requests (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      quantity REAL NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'ordered', 'cancelled'
      priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
      reason TEXT, -- e.g., 'Backorder from Order #123'
      requester_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (item_id) REFERENCES inventory_items(id),
      FOREIGN KEY (requester_id) REFERENCES users(id)
    )
  `);

  // Entities (Cadastro Geral)
  db.exec(`
    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      legal_name TEXT,
      trade_name TEXT,
      display_name TEXT NOT NULL,
      document TEXT,
      email TEXT,
      phone TEXT,
      status TEXT DEFAULT 'active',
      review_status TEXT DEFAULT 'approved',
      documentation_status TEXT DEFAULT 'not_checked',
      financial_status TEXT DEFAULT 'clear',
      operational_status TEXT DEFAULT 'allowed',
      is_customer INTEGER DEFAULT 0,
      is_supplier INTEGER DEFAULT 0,
      is_carrier INTEGER DEFAULT 0,
      is_manufacturer INTEGER DEFAULT 0,
      is_partner INTEGER DEFAULT 0,
      is_prospect INTEGER DEFAULT 0,
      quick_register INTEGER DEFAULT 0,
      duplicate_suspect INTEGER DEFAULT 0,
      document_notes TEXT,
      internal_notes TEXT,
      created_from TEXT,
      created_by TEXT,
      reviewed_by TEXT,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    )
  `);

  db.exec('CREATE INDEX IF NOT EXISTS idx_ent_comp ON entities(company_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_ent_doc ON entities(document)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_ent_disp_name ON entities(display_name)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_ent_trade_name ON entities(trade_name)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_ent_legal_name ON entities(legal_name)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_ent_is_customer ON entities(is_customer)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_ent_is_supplier ON entities(is_supplier)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_ent_status ON entities(status)');
  
  // System Parameters
  // Fix primary key by recreating the table if it has the old schema -> actually we can't DROP.
  // We can rename it and recreate.
  try {
    const tableInfo = db.prepare("PRAGMA table_info(system_parameters)").all() as any[];
    const pkCols = tableInfo.filter(c => c.pk > 0);
    if (pkCols.length === 1 && pkCols[0].name === 'key') {
      db.exec('ALTER TABLE system_parameters RENAME TO z_old_sys_params_' + Date.now());
    }
  } catch (e) {
    // disregard
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS system_parameters (
      key TEXT,
      company_id TEXT NOT NULL,
      value TEXT,
      category TEXT,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT,
      PRIMARY KEY (key, company_id),
      FOREIGN KEY (company_id) REFERENCES companies(id)
    )
  `);

  db.exec('CREATE INDEX IF NOT EXISTS idx_sys_params_comp ON system_parameters(company_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_sys_params_cat ON system_parameters(category)');

  // Customers (Clientes)
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      name TEXT NOT NULL,
      document TEXT UNIQUE NOT NULL, -- CPF/CNPJ
      email TEXT,
      phone TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    )
  `);

  // Suppliers (Fornecedores)
  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      name TEXT NOT NULL,
      document TEXT UNIQUE NOT NULL, -- CNPJ
      email TEXT,
      phone TEXT,
      category TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    )
  `);

  // Carriers (Transportadoras)
  db.exec(`
    CREATE TABLE IF NOT EXISTS carriers (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      name TEXT NOT NULL,
      document TEXT UNIQUE NOT NULL, -- CNPJ
      email TEXT,
      phone TEXT,
      region TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    )
  `);

  // Sales Orders (Pedidos de Venda)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales_orders (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      carrier_id TEXT,
      status TEXT DEFAULT 'draft', -- 'draft', 'confirmed', 'shipped', 'cancelled'
      total_amount REAL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (carrier_id) REFERENCES carriers(id)
    )
  `);

  // Sales Order Items
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales_order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      discount REAL DEFAULT 0,
      total_price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES sales_orders(id),
      FOREIGN KEY (item_id) REFERENCES inventory_items(id)
    )
  `);

  // Accounts Receivable (Contas a Receber)
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts_receivable (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      order_id TEXT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      due_date DATE NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'overdue', 'cancelled'
      payment_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (order_id) REFERENCES sales_orders(id)
    )
  `);

  // Accounts Payable (Contas a Pagar)
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts_payable (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      due_date DATE NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'overdue', 'cancelled'
      payment_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (branch_id) REFERENCES branches(id)
    )
  `);

  // Purchase Orders (Pedidos de Compra)
  db.exec(`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      supplier_id TEXT,
      user_id TEXT NOT NULL,
      carrier_id TEXT,
      total_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'draft', -- 'draft', 'confirmed', 'received', 'cancelled'
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (carrier_id) REFERENCES carriers(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS purchase_order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_cost REAL NOT NULL,
      total_cost REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES purchase_orders(id),
      FOREIGN KEY (item_id) REFERENCES inventory_items(id)
    )
  `);

  // Customer Locations
  db.exec(`
    CREATE TABLE IF NOT EXISTS customer_locations (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      name TEXT NOT NULL,
      address_line TEXT,
      number TEXT,
      complement TEXT,
      district TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      country TEXT DEFAULT 'Brasil',
      reference_note TEXT,
      is_default INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )
  `);

  db.exec('CREATE INDEX IF NOT EXISTS idx_cust_loc_comp ON customer_locations(company_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_cust_loc_cust ON customer_locations(customer_id)');

  // Equipments
  db.exec(`
    CREATE TABLE IF NOT EXISTS equipments (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      branch_id TEXT,
      ownership_type TEXT NOT NULL, -- 'customer' or 'company'
      customer_id TEXT,
      customer_location_id TEXT,
      name TEXT NOT NULL,
      equipment_type TEXT,
      brand TEXT,
      model TEXT,
      serial_number TEXT,
      patrimony TEXT,
      internal_code TEXT,
      operational_status TEXT DEFAULT 'active', -- 'active', 'inactive', 'maintenance', 'blocked', 'discarded'
      informative_status TEXT, 
      location_description TEXT,
      public_notes TEXT,
      internal_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (customer_location_id) REFERENCES customer_locations(id)
    )
  `);

  db.exec('CREATE INDEX IF NOT EXISTS idx_eq_comp ON equipments(company_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_eq_branch ON equipments(branch_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_eq_cust ON equipments(customer_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_eq_owner ON equipments(ownership_type)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_eq_serial ON equipments(serial_number)');

  // Equipment History
  db.exec(`
    CREATE TABLE IF NOT EXISTS equipment_history (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      equipment_id TEXT NOT NULL,
      action TEXT NOT NULL,
      description TEXT,
      created_by TEXT, -- user_id (TODO: once auth is real)
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (equipment_id) REFERENCES equipments(id)
    )
  `);

  db.exec('CREATE INDEX IF NOT EXISTS idx_eq_hist_comp ON equipment_history(company_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_eq_hist_eq ON equipment_history(equipment_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_eq_hist_date ON equipment_history(created_at)');

  // Notifications
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      status TEXT DEFAULT 'unread',
      scope TEXT DEFAULT 'user',
      target_user_id TEXT,
      target_role TEXT,
      target_department TEXT,
      source_module TEXT,
      source_type TEXT,
      source_id TEXT,
      priority INTEGER DEFAULT 0,
      requires_response INTEGER DEFAULT 0,
      response_text TEXT,
      created_by TEXT,
      created_by_name TEXT,
      read_at DATETIME,
      snoozed_until DATETIME,
      resolved_at DATETIME,
      archived_at DATETIME,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.exec('CREATE INDEX IF NOT EXISTS idx_notif_comp ON notifications(company_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(target_user_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_notif_role ON notifications(target_role)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_notif_dept ON notifications(target_department)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_notif_status ON notifications(status)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_notif_type ON notifications(type)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_notif_created ON notifications(created_at)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_notif_snoozed ON notifications(snoozed_until)');

  // Seed initial data if empty
  const companyCount = db.prepare('SELECT COUNT(*) as count FROM companies').get() as { count: number };
  if (companyCount.count === 0) {
    const companyId = 'comp_1';
    db.prepare('INSERT INTO companies (id, name, cnpj) VALUES (?, ?, ?)').run(companyId, 'Nexus Matriz', '12.345.678/0001-90');
    db.prepare('INSERT INTO branches (id, company_id, name) VALUES (?, ?, ?)').run('bran_1', companyId, 'Sede São Paulo');
    db.prepare('INSERT INTO branches (id, company_id, name) VALUES (?, ?, ?)').run('bran_2', companyId, 'Filial Rio');
    
    const userId = 'user_1';
    db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)').run(
      userId, 'Admin Nexus', 'admin@nexus.erp', 'password123', 'admin'
    );
    db.prepare('INSERT INTO user_company_access (user_id, company_id) VALUES (?, ?)').run(userId, companyId);

    // Initial System Parameters
    const defaultParams = [
      { key: 'system_name', val: 'Nexus ERP', cat: 'geral', desc: 'Nome personalizado do sistema' },
      { key: 'session_timeout', val: '60', cat: 'geral', desc: 'Tempo de expiração da sessão em minutos' },
      { key: 'finance_interest_rate', val: '1.00', cat: 'financeiro', desc: 'Juros de mora mensal (%)' },
      { key: 'finance_late_fee', val: '2.00', cat: 'financeiro', desc: 'Multa por atraso (%)' },
      { key: 'finance_grace_period', val: '0', cat: 'financeiro', desc: 'Dias de carência para multa' },
      { key: 'finance_auto_billing', val: 'true', cat: 'financeiro', desc: 'Gerar boletos automaticamente' },
      { key: 'finance_block_delinquents', val: 'true', cat: 'financeiro', desc: 'Bloquear clientes inadimplentes' },
      { key: 'sales_max_discount', val: '10.00', cat: 'vendas', desc: 'Desconto máximo permitido (%)' },
      { key: 'sales_quote_validity', val: '7', cat: 'vendas', desc: 'Validade padrão de orçamentos (dias)' },
      { key: 'sales_require_seller', val: 'true', cat: 'vendas', desc: 'Exigir vendedor no pedido' },
      { key: 'sales_allow_negative_stock', val: 'false', cat: 'vendas', desc: 'Permitir venda com estoque negativo' },
      { key: 'inventory_update_cost_on_entry', val: 'true', cat: 'compras', desc: 'Atualizar preço de custo na entrada' },
      { key: 'inventory_default_margin', val: '30', cat: 'compras', desc: 'Margem de lucro padrão para novos produtos (%)' }
    ];

    for (const p of defaultParams) {
      db.prepare('INSERT INTO system_parameters (key, company_id, value, category, description) VALUES (?, ?, ?, ?, ?)').run(
        p.key, companyId, p.val, p.cat, p.desc
      );
    }

    // Sample Products
    const products = [
      { id: 'prod_1', code: 'P001', desc: 'Notebook Dell Vostro', cat: 'Informática', unit: 'UN' },
      { id: 'prod_2', code: 'P002', desc: 'Monitor LG 24"', cat: 'Informática', unit: 'UN' },
      { id: 'prod_3', code: 'P003', desc: 'Cadeira Ergonômica', cat: 'Móveis', unit: 'UN' },
      { id: 'prod_4', code: 'P004', desc: 'Teclado Mecânico RGB', cat: 'Informática', unit: 'UN' },
      { id: 'prod_5', code: 'P005', desc: 'Mesa de Escritório L', cat: 'Móveis', unit: 'UN' },
    ];

    for (const p of products) {
      db.prepare('INSERT INTO inventory_items (id, company_id, code, description, category, unit) VALUES (?, ?, ?, ?, ?, ?)').run(
        p.id, companyId, p.code, p.desc, p.cat, p.unit
      );
      // Initial balance
      db.prepare('INSERT INTO stock_balances (branch_id, item_id, quantity) VALUES (?, ?, ?)').run(
        'bran_1', p.id, Math.floor(Math.random() * 50) + 10
      );
    }

    // Sample Customers
    const customers = [
      { id: 'cust_1', name: 'João Silva', doc: '123.456.789-00', email: 'joao@email.com' },
      { id: 'cust_2', name: 'Empresa ABC Ltda', doc: '98.765.432/0001-10', email: 'contato@abc.com' },
      { id: 'cust_3', name: 'Maria Oliveira', doc: '456.789.123-11', email: 'maria@email.com' },
      { id: 'cust_4', name: 'Tech Solutions SA', doc: '11.222.333/0001-44', email: 'financeiro@techsol.com' },
    ];

    for (const c of customers) {
      db.prepare('INSERT INTO customers (id, company_id, name, document, email) VALUES (?, ?, ?, ?, ?)').run(
        c.id, companyId, c.name, c.doc, c.email
      );
    }

    // Sample Suppliers
    const suppliers = [
      { id: 'supp_1', name: 'Distribuidora Tech', doc: '10.200.300/0001-01', email: 'vendas@disttech.com', cat: 'Informática' },
      { id: 'supp_2', name: 'Móveis & Cia', doc: '20.300.400/0001-02', email: 'comercial@moveiscia.com', cat: 'Móveis' },
      { id: 'supp_3', name: 'Papelaria Central', doc: '30.400.500/0001-03', email: 'pedidos@papelariacentral.com', cat: 'Escritório' },
    ];

    for (const s of suppliers) {
      db.prepare('INSERT INTO suppliers (id, company_id, name, document, email, category) VALUES (?, ?, ?, ?, ?, ?)').run(
        s.id, companyId, s.name, s.doc, s.email, s.cat
      );
    }

    // Sample Carriers
    const carriers = [
      { id: 'car_1', name: 'TransRápido Logística', doc: '11.222.333/0001-44', email: 'contato@transrapido.com', region: 'Sudeste' },
      { id: 'car_2', name: 'Brasil Express', doc: '22.333.444/0001-55', email: 'vendas@brasilexpress.com.br', region: 'Nacional' },
      { id: 'car_3', name: 'Sul Transportes', doc: '33.444.555/0001-66', email: 'sac@sultrans.com', region: 'Sul' },
    ];

    for (const car of carriers) {
      db.prepare('INSERT INTO carriers (id, company_id, name, document, email, region) VALUES (?, ?, ?, ?, ?, ?)').run(
        car.id, companyId, car.name, car.doc, car.email, car.region
      );
    }

    // Sample Sales Orders
    const salesOrders = [
      { id: 'sale_1', cust: 'cust_1', amount: 3500, status: 'confirmed' },
      { id: 'sale_2', cust: 'cust_2', amount: 1200, status: 'draft' },
      { id: 'sale_3', cust: 'cust_3', amount: 850, status: 'confirmed' },
    ];

    for (const s of salesOrders) {
      db.prepare('INSERT INTO sales_orders (id, company_id, branch_id, customer_id, user_id, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        s.id, companyId, 'bran_1', s.cust, userId, s.amount, s.status
      );
      
      // Accounts Receivable for confirmed orders
      if (s.status === 'confirmed') {
        db.prepare(`
          INSERT INTO accounts_receivable (id, company_id, branch_id, customer_id, order_id, description, amount, due_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `rec_${s.id}`, companyId, 'bran_1', s.cust, s.id, `Venda Pedido ${s.id}`, s.amount, '2026-03-25'
        );
      }
    }

    // Sample Purchase Requests
    const purchaseRequests = [
      { id: 'req_1', item: 'prod_1', qty: 5, priority: 'high' },
      { id: 'req_2', item: 'prod_3', qty: 10, priority: 'normal' },
      { id: 'req_3', item: 'prod_2', qty: 2, priority: 'urgent' },
    ];

    for (const r of purchaseRequests) {
      db.prepare('INSERT INTO purchase_requests (id, company_id, branch_id, item_id, quantity, priority, requester_id) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        r.id, companyId, 'bran_1', r.item, r.qty, r.priority, userId
      );
    }

    // Sample Accounts Payable
    const payables = [
      { id: 'pay_1', desc: 'Aluguel Galpão', amount: 5000, due: '2026-03-05' },
      { id: 'pay_2', desc: 'Energia Elétrica', amount: 850, due: '2026-03-10' },
      { id: 'pay_3', desc: 'Internet Fibra', amount: 299, due: '2026-03-15' },
    ];

    for (const p of payables) {
      db.prepare(`
        INSERT INTO accounts_payable (id, company_id, branch_id, description, amount, due_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(`pay_${p.id}`, companyId, 'bran_1', p.desc, p.amount, p.due);
    }

    // One more receivable
    db.prepare(`
      INSERT INTO accounts_receivable (id, company_id, branch_id, customer_id, description, amount, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'rec_manual_1', companyId, 'bran_1', 'cust_4', 'Serviço de Consultoria', 1500, '2026-04-01'
    );
  }

  // Seed users and permissions if missing
  const seedUsers = () => {
    try {
      const hashPassword = (pwd: string) => bcrypt.hashSync(pwd, 10);
      const hashPin = (pin: string) => bcrypt.hashSync(pin, 10);

      const roles = [
        { id: 'admin', name: 'Administrador' },
        { id: 'sales', name: 'Vendas' },
        { id: 'finance', name: 'Financeiro' },
        { id: 'technical', name: 'Técnico' }
      ];
      
      const companyId = 'comp_1';

      for (const r of roles) {
        db.prepare('INSERT OR IGNORE INTO roles (id, company_id, name) VALUES (?, ?, ?)').run(r.id, companyId, r.name);
      }

      const testUsers = [
        { id: 'user_admin', username: 'admin', name: 'Admin Nexus', email: 'admin@nexus.local', password: 'admin123', pin: '0000', role: 'admin' },
        { id: 'user_sales', username: 'vendas', name: 'Vendedor Teste', email: 'vendas@nexus.local', password: 'vendas123', pin: '1111', role: 'sales' },
        { id: 'user_finance', username: 'financeiro', name: 'Financeiro Teste', email: 'financeiro@nexus.local', password: 'financeiro123', pin: '2222', role: 'finance' },
        { id: 'user_technical', username: 'tecnico', name: 'Técnico Teste', email: 'tecnico@nexus.local', password: 'tecnico123', pin: '3333', role: 'technical' }
      ];

      for (const u of testUsers) {
        // Prevent duplicate emails/usernames if they belong to different IDs
        db.prepare('DELETE FROM users WHERE (email = ? OR username = ?) AND id != ?').run(u.email, u.username, u.id);

        const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(u.id);
        const passHash = hashPassword(u.password);
        const pinHashVal = hashPin(u.pin);
        if (existing) {
          db.prepare(`
            UPDATE users SET 
              company_id = ?, username = ?, name = ?, email = ?, password = ?, pin_hash = ?, role = ?, status = 'active', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(companyId, u.username, u.name, u.email, passHash, pinHashVal, u.role, u.id);
          db.prepare('INSERT OR IGNORE INTO user_company_access (user_id, company_id) VALUES (?, ?)').run(u.id, companyId);
        } else {
          db.prepare(`
            INSERT INTO users (id, company_id, username, name, email, password, pin_hash, role, status, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
          `).run(u.id, companyId, u.username, u.name, u.email, passHash, pinHashVal, u.role);
          db.prepare('INSERT OR IGNORE INTO user_company_access (user_id, company_id) VALUES (?, ?)').run(u.id, companyId);
        }
      }

      const criticalActions = [
        { key: 'approve_entity', label: 'Aprovar Cadastro', module: 'entities' },
        { key: 'reject_entity', label: 'Reprovar Cadastro', module: 'entities' },
        { key: 'request_entity_correction', label: 'Solicitar Correção de Cadastro', module: 'entities' },
        { key: 'block_entity', label: 'Bloquear Entidade', module: 'entities' },
        { key: 'unblock_entity', label: 'Desbloquear Entidade', module: 'entities' },
      ];

      for (const action of criticalActions) {
        db.prepare('INSERT OR IGNORE INTO critical_actions_config (id, company_id, action_key, label_pt, module) VALUES (?, ?, ?, ?, ?)').run(
          'action_' + action.key, companyId, action.key, action.label, action.module
        );
      }
    } catch (e) {
      console.error('Failed to seed users', e);
    }
  };
  seedUsers();

  // --- MIGRAÇÃO SEGURA PARA ENTITIES ---
  const migrateToEntities = () => {
    // Migrate Customers
    const legacyCustomers = db.prepare('SELECT * FROM customers').all() as any[];
    for (const customer of legacyCustomers) {
      const existing = db.prepare('SELECT id FROM entities WHERE id = ?').get(customer.id);
      if (!existing) {
        // Also check by document if not null
        let byDoc = null;
        if (customer.document) {
          byDoc = db.prepare('SELECT id FROM entities WHERE company_id = ? AND document = ?').get(customer.company_id, customer.document);
        }
        
        if (byDoc) {
          db.prepare('UPDATE entities SET is_customer = 1 WHERE id = ?').run((byDoc as any).id);
        } else {
          db.prepare(`
            INSERT INTO entities (
              id, company_id, display_name, legal_name, document, email, phone, status, review_status, created_from, is_customer
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved', 'legacy_customers', 1)
          `).run(
            customer.id, customer.company_id, customer.name, customer.name, customer.document, customer.email, customer.phone, customer.status
          );
        }
      } else {
        db.prepare('UPDATE entities SET is_customer = 1 WHERE id = ?').run(customer.id);
      }
    }

    // Migrate Suppliers
    const legacySuppliers = db.prepare('SELECT * FROM suppliers').all() as any[];
    for (const supplier of legacySuppliers) {
      const existing = db.prepare('SELECT id FROM entities WHERE id = ?').get(supplier.id);
      if (!existing) {
        let byDoc = null;
        if (supplier.document) {
          byDoc = db.prepare('SELECT id FROM entities WHERE company_id = ? AND document = ?').get(supplier.company_id, supplier.document);
        }
        
        if (byDoc) {
          db.prepare('UPDATE entities SET is_supplier = 1 WHERE id = ?').run((byDoc as any).id);
        } else {
          db.prepare(`
            INSERT INTO entities (
              id, company_id, display_name, legal_name, document, email, phone, status, review_status, created_from, is_supplier
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved', 'legacy_suppliers', 1)
          `).run(
            supplier.id, supplier.company_id, supplier.name, supplier.name, supplier.document, supplier.email, supplier.phone, supplier.status
          );
        }
      } else {
        db.prepare('UPDATE entities SET is_supplier = 1 WHERE id = ?').run(supplier.id);
      }
    }

    // Migrate Carriers
    const legacyCarriers = db.prepare('SELECT * FROM carriers').all() as any[];
    for (const carrier of legacyCarriers) {
      const existing = db.prepare('SELECT id FROM entities WHERE id = ?').get(carrier.id);
      if (!existing) {
        let byDoc = null;
        if (carrier.document) {
          byDoc = db.prepare('SELECT id FROM entities WHERE company_id = ? AND document = ?').get(carrier.company_id, carrier.document);
        }
        
        if (byDoc) {
          db.prepare('UPDATE entities SET is_carrier = 1 WHERE id = ?').run((byDoc as any).id);
        } else {
          db.prepare(`
            INSERT INTO entities (
              id, company_id, display_name, legal_name, document, email, phone, status, review_status, created_from, is_carrier
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved', 'legacy_carriers', 1)
          `).run(
            carrier.id, carrier.company_id, carrier.name, carrier.name, carrier.document, carrier.email, carrier.phone, carrier.status
          );
        }
      } else {
        db.prepare('UPDATE entities SET is_carrier = 1 WHERE id = ?').run(carrier.id);
      }
    }
  };

  const seedNotificationParams = () => {
    const defaultParams = [
      { key: 'notification_history_days', val: '30', cat: 'comunicacoes', desc: 'Dias de histórico de notificações antes de arquivar' },
      { key: 'strong_alert_interval_days', val: '7', cat: 'comunicacoes', desc: 'Intervalo de dias para repetir alertas bloqueantes' },
      { key: 'quick_register_expiration_days', val: '15', cat: 'comunicacoes', desc: 'Dias para expirar cadastros rápidos sem revisão' }
    ];
    
    const companies = db.prepare('SELECT id FROM companies').all() as any[];
    for (const comp of companies) {
      for (const p of defaultParams) {
        db.prepare('INSERT OR IGNORE INTO system_parameters (key, company_id, value, category, description) VALUES (?, ?, ?, ?, ?)').run(
          p.key, comp.id, p.val, p.cat, p.desc
        );
      }
    }
  };

  const seedTraceableStockFoundation = () => {
    try {
      const companyId = 'comp_1';
      const branchId = 'bran_1';

      // Atualiza prod_1 como rastreado por serial se ainda estiver default
      db.prepare(`
        UPDATE inventory_items 
        SET item_type = 'serial', tracks_serial = 1, physical_location = 'Prateleira A1'
        WHERE id = 'prod_1' AND (item_type IS NULL OR item_type = 'simple')
      `).run();

      // Atualiza prod_2 como rastreado por lote se ainda estiver default
      db.prepare(`
        UPDATE inventory_items 
        SET item_type = 'batch', tracks_batch = 1, validity_alert_days = 60, physical_location = 'Corredor B2'
        WHERE id = 'prod_2' AND (item_type IS NULL OR item_type = 'simple')
      `).run();

      // Cria produto Kit exemplo se não existir
      db.prepare(`
        INSERT OR IGNORE INTO inventory_items (
          id, company_id, code, description, category, unit, min_stock, max_stock, status,
          item_type, tracks_batch, tracks_serial, is_composite, physical_location, cost_price, selling_price
        ) VALUES (
          'prod_kit_1', ?, 'KIT-001', 'Kit Estação de Trabalho Nexus Pro', 'Informática', 'KT', 2, 20, 'active',
          'kit', 0, 0, 1, 'Bancada Montagem 1', 3200.00, 5490.00
        )
      `).run(companyId);

      // Saldo do kit (preservando estrutura de stock_balances)
      db.prepare(`
        INSERT OR IGNORE INTO stock_balances (branch_id, item_id, quantity, reserved_quantity, average_cost)
        VALUES (?, 'prod_kit_1', 3, 0, 3200.00)
      `).run(branchId);

      // Composição (BOM) do Kit: Notebook (prod_1) + Monitor (prod_2) + Teclado (prod_4)
      db.prepare(`
        INSERT OR IGNORE INTO item_compositions (id, parent_item_id, component_item_id, quantity, unit, notes)
        VALUES 
          ('comp_kit1_prod1', 'prod_kit_1', 'prod_1', 1, 'UN', 'Notebook principal'),
          ('comp_kit1_prod2', 'prod_kit_1', 'prod_2', 1, 'UN', 'Monitor complementar'),
          ('comp_kit1_prod4', 'prod_kit_1', 'prod_4', 1, 'UN', 'Teclado de periférico')
      `).run();

      // Lotes amostra para prod_2 (Monitor)
      db.prepare(`
        INSERT OR IGNORE INTO stock_lots (
          id, company_id, branch_id, item_id, lot_number, manufacturing_date, expiry_date, quantity, physical_location, status, notes
        ) VALUES 
          ('lot_lg_001', ?, ?, 'prod_2', 'LOT-LG-2024-A', '2024-01-10', '2026-01-10', 10, 'Corredor B2 - Gaveta 1', 'active', 'Lote de importação lote 1'),
          ('lot_lg_002', ?, ?, 'prod_2', 'LOT-LG-2024-B', '2024-03-15', '2026-03-15', 15, 'Corredor B2 - Gaveta 2', 'active', 'Lote de importação lote 2')
      `).run(companyId, branchId, companyId, branchId);

      // Seriais amostra para prod_1 (Notebook)
      db.prepare(`
        INSERT OR IGNORE INTO stock_serials (
          id, company_id, branch_id, item_id, serial_number, physical_location, status, notes
        ) VALUES 
          ('ser_dell_001', ?, ?, 'prod_1', 'SN-DELL-9081-BR', 'Prateleira A1', 'in_stock', 'Testado no recebimento'),
          ('ser_dell_002', ?, ?, 'prod_1', 'SN-DELL-9082-BR', 'Prateleira A1', 'in_stock', 'Testado no recebimento'),
          ('ser_dell_003', ?, ?, 'prod_1', 'SN-DELL-9083-BR', 'Prateleira A1', 'in_stock', 'Testado no recebimento')
      `).run(companyId, branchId, companyId, branchId, companyId, branchId);

      // Amostra de Genealogia de Kit montado
      db.prepare(`
        INSERT OR IGNORE INTO kit_assemblies (
          id, company_id, branch_id, parent_item_id, quantity, status, notes, created_by
        ) VALUES (
          'asm_demo_1', ?, ?, 'prod_kit_1', 1, 'completed', 'Montagem inicial homologada', 'user_1'
        )
      `).run(companyId, branchId);

      db.prepare(`
        INSERT OR IGNORE INTO kit_assembly_items (
          id, assembly_id, component_item_id, quantity, consumed_lot_id, consumed_serial_id
        ) VALUES 
          ('kai_demo_1', 'asm_demo_1', 'prod_1', 1, NULL, 'ser_dell_001'),
          ('kai_demo_2', 'asm_demo_1', 'prod_2', 1, 'lot_lg_001', NULL),
          ('kai_demo_3', 'asm_demo_1', 'prod_4', 1, NULL, NULL)
      `).run();
    } catch (e) {
      console.error('Failed to seed traceable stock foundation:', e);
    }
  };

  seedNotificationParams();
  migrateToEntities();
  // Migração segura e idempotente de stock_balances para stock_positions (SALDO LEGADO / NÃO ALOCADO)
  migrateStockBalancesToPositions(db);
  // seedTraceableStockFoundation() desativado na inicialização padrão conforme especificação
}

export default db;
