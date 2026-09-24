import express from 'express';
import db from '../db';
import { randomUUID } from 'crypto';

const router = express.Router();

// Generate ID Helper (using existing patterns or just simple unique strings)
function generateId(prefix: string) {
  return `${prefix}_${randomUUID().replace(/-/g, '').substring(0, 16)}`;
}

// 1. GET /api/equipments
router.get('/', (req, res) => {
  try {
    const { companyId, branchId, ownership, customerId, status, search, limit, offset } = req.query;
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    let query = 'SELECT * FROM equipments WHERE company_id = ?';
    const queryParams: any[] = [companyId];

    if (branchId) {
      query += ' AND branch_id = ?';
      queryParams.push(branchId);
    }

    if (ownership) {
      query += ' AND ownership_type = ?';
      queryParams.push(ownership);
    }

    if (customerId) {
      query += ' AND customer_id = ?';
      queryParams.push(customerId);
    }

    if (status) {
      query += ' AND operational_status = ?';
      queryParams.push(status);
    }

    if (search) {
      query += ' AND (name LIKE ? OR brand LIKE ? OR model LIKE ? OR serial_number LIKE ? OR patrimony LIKE ?)';
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY created_at DESC';

    if (limit) {
      query += ' LIMIT ?';
      queryParams.push(Number(limit));
      if (offset) {
        query += ' OFFSET ?';
        queryParams.push(Number(offset));
      }
    }

    const equipments = db.prepare(query).all(...queryParams);
    res.json(equipments);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// 2. GET /api/equipments/:id
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    const equipment = db.prepare('SELECT * FROM equipments WHERE id = ? AND company_id = ?').get(id, companyId);
    
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    res.json(equipment);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// 3. POST /api/equipments
router.post('/', (req, res) => {
  try {
    const {
      company_id,
      branch_id,
      ownership_type,
      customer_id,
      customer_location_id,
      name,
      equipment_type,
      brand,
      model,
      serial_number,
      patrimony,
      internal_code,
      operational_status,
      informative_status,
      location_description,
      public_notes,
      internal_notes,
      created_by
    } = req.body;

    if (!company_id) return res.status(400).json({ error: 'company_id is required' });
    if (!ownership_type) return res.status(400).json({ error: 'ownership_type is required' });
    if (!name) return res.status(400).json({ error: 'name is required' });

    if (ownership_type === 'customer' && !customer_id) {
      return res.status(400).json({ error: 'customer_id is required when ownership_type is customer' });
    }

    const final_customer_id = ownership_type === 'company' ? null : customer_id;

    // Check serial number duplication if provided
    if (serial_number) {
      let duplicateCheckQuery = 'SELECT id FROM equipments WHERE company_id = ? AND ownership_type = ? AND serial_number = ?';
      const duplicateCheckParams: any[] = [company_id, ownership_type, serial_number];

      if (ownership_type === 'customer' && final_customer_id) {
        duplicateCheckQuery += ' AND customer_id = ?';
        duplicateCheckParams.push(final_customer_id);
      }

      const existing = db.prepare(duplicateCheckQuery).get(...duplicateCheckParams);
      if (existing) {
        return res.status(409).json({ error: 'Serial number already exists for this context' });
      }
    }

    const equipmentId = generateId('eq');
    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO equipments (
          id, company_id, branch_id, ownership_type, customer_id, customer_location_id,
          name, equipment_type, brand, model, serial_number, patrimony,
          internal_code, operational_status, informative_status, location_description,
          public_notes, internal_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        equipmentId, company_id, branch_id || null, ownership_type, final_customer_id, customer_location_id || null,
        name, equipment_type || null, brand || null, model || null, serial_number || null, patrimony || null,
        internal_code || null, operational_status || 'active', informative_status || null, location_description || null,
        public_notes || null, internal_notes || null
      );

      db.prepare(`
        INSERT INTO equipment_history (id, company_id, equipment_id, action, description, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(generateId('hist'), company_id, equipmentId, 'created', 'Equipment registered', created_by || 'system');
    });

    transaction();

    const newEquipment = db.prepare('SELECT * FROM equipments WHERE id = ?').get(equipmentId);
    res.status(201).json(newEquipment);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// 4. PUT /api/equipments/:id
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      company_id,
      branch_id,
      ownership_type,
      customer_id,
      customer_location_id,
      name,
      equipment_type,
      brand,
      model,
      serial_number,
      patrimony,
      internal_code,
      operational_status,
      informative_status,
      location_description,
      public_notes,
      internal_notes,
      updated_by
    } = req.body;

    if (!company_id) return res.status(400).json({ error: 'company_id is required' });

    const equipment = db.prepare('SELECT * FROM equipments WHERE id = ? AND company_id = ?').get(id, company_id) as any;
    if (!equipment) return res.status(404).json({ error: 'Equipment not found' });

    const final_customer_id = ownership_type === 'company' ? null : (customer_id || equipment.customer_id);
    const final_ownership_type = ownership_type || equipment.ownership_type;

    if (serial_number && serial_number !== equipment.serial_number) {
      let duplicateCheckQuery = 'SELECT id FROM equipments WHERE company_id = ? AND ownership_type = ? AND serial_number = ? AND id != ?';
      const duplicateCheckParams: any[] = [company_id, final_ownership_type, serial_number, id];

      if (final_ownership_type === 'customer' && final_customer_id) {
        duplicateCheckQuery += ' AND customer_id = ?';
        duplicateCheckParams.push(final_customer_id);
      }

      const existing = db.prepare(duplicateCheckQuery).get(...duplicateCheckParams);
      if (existing) {
        return res.status(409).json({ error: 'Serial number already exists for this context' });
      }
    }

    const transaction = db.transaction(() => {
      db.prepare(`
        UPDATE equipments SET
          branch_id = COALESCE(?, branch_id),
          ownership_type = COALESCE(?, ownership_type),
          customer_id = ?,
          customer_location_id = ?,
          name = COALESCE(?, name),
          equipment_type = COALESCE(?, equipment_type),
          brand = COALESCE(?, brand),
          model = COALESCE(?, model),
          serial_number = ?,
          patrimony = ?,
          internal_code = ?,
          operational_status = COALESCE(?, operational_status),
          informative_status = ?,
          location_description = ?,
          public_notes = ?,
          internal_notes = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND company_id = ?
      `).run(
        branch_id || null, final_ownership_type, final_customer_id, customer_location_id || null,
        name, equipment_type || null, brand || null, model || null,
        serial_number === '' ? null : (serial_number || equipment.serial_number),
        patrimony === '' ? null : (patrimony || equipment.patrimony),
        internal_code === '' ? null : (internal_code || equipment.internal_code),
        operational_status, informative_status || null, location_description || null,
        public_notes || null, internal_notes || null,
        id, company_id
      );

      db.prepare(`
        INSERT INTO equipment_history (id, company_id, equipment_id, action, description, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(generateId('hist'), company_id, id, 'updated', 'Equipment properties updated', updated_by || 'system');
    });

    transaction();

    const updatedEquipment = db.prepare('SELECT * FROM equipments WHERE id = ?').get(id);
    res.json(updatedEquipment);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// 5. PATCH /api/equipments/:id/status
router.patch('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { company_id, operational_status, updated_by } = req.body;

    if (!company_id) return res.status(400).json({ error: 'company_id is required' });
    if (!operational_status) return res.status(400).json({ error: 'operational_status is required' });

    const validStatuses = ['active', 'inactive', 'maintenance', 'blocked', 'discarded'];
    if (!validStatuses.includes(operational_status)) {
      return res.status(400).json({ error: 'Invalid operational_status value' });
    }

    const equipment = db.prepare('SELECT * FROM equipments WHERE id = ? AND company_id = ?').get(id, company_id) as any;
    if (!equipment) return res.status(404).json({ error: 'Equipment not found' });

    const transaction = db.transaction(() => {
      db.prepare('UPDATE equipments SET operational_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND company_id = ?')
        .run(operational_status, id, company_id);

      db.prepare(`
        INSERT INTO equipment_history (id, company_id, equipment_id, action, description, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(generateId('hist'), company_id, id, 'status_changed', `Status changed from ${equipment.operational_status} to ${operational_status}`, updated_by || 'system');
    });

    transaction();

    res.json({ success: true, operational_status });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// 6. GET /api/customers/:customerId/equipments
// Note: Normally mapped under another router file, but we will handle it here assuming /api/equipments/customer/:customerId or registered appropriately
router.get('/customer/:customerId', (req, res) => {
  try {
    const { customerId } = req.params;
    const { companyId } = req.query;

    if (!companyId) return res.status(400).json({ error: 'Company ID is required' });

    const equipments = db.prepare('SELECT * FROM equipments WHERE customer_id = ? AND company_id = ? AND ownership_type = ? ORDER BY created_at DESC')
      .all(customerId, companyId, 'customer');

    res.json(equipments);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// 7. GET /api/equipments/:id/history
router.get('/:id/history', (req, res) => {
  try {
    const { id } = req.params;
    const { companyId, months = 6, limit, offset } = req.query;

    if (!companyId) return res.status(400).json({ error: 'Company ID is required' });

    let query = `
      SELECT * FROM equipment_history 
      WHERE equipment_id = ? AND company_id = ? 
      AND created_at >= date('now', ?)
      ORDER BY created_at DESC
    `;
    const queryParams: any[] = [id, companyId, `-${Number(months)} months`];

    if (limit) {
      query += ' LIMIT ?';
      queryParams.push(Number(limit));
      if (offset) {
        query += ' OFFSET ?';
        queryParams.push(Number(offset));
      }
    }

    const history = db.prepare(query).all(...queryParams);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

export default router;
