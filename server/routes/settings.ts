import express from 'express';
import db from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all system parameters for a company
router.get('/parameters', (req, res) => {
  try {
    const companyId = req.query.companyId as string;
    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }

    const parameters = db.prepare('SELECT * FROM system_parameters WHERE company_id = ?').all(companyId);
    res.json(parameters);
  } catch (error) {
    console.error('Error fetching system parameters:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a single parameter
router.post('/parameters', (req, res) => {
  try {
    const { companyId, key, value, category, description, userId } = req.body;
    
    if (!companyId || !key) {
      return res.status(400).json({ error: 'companyId and key are required' });
    }

    const existing = db.prepare('SELECT key FROM system_parameters WHERE key = ? AND company_id = ?').get(key, companyId);
    
    if (existing) {
      db.prepare(`
        UPDATE system_parameters 
        SET value = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ? 
        WHERE key = ? AND company_id = ?
      `).run(String(value), userId || null, key, companyId);
    } else {
      db.prepare(`
        INSERT INTO system_parameters (key, company_id, value, category, description, updated_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(key, companyId, String(value), category || 'geral', description || null, userId || null);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating system parameter:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk update parameters
router.post('/parameters/bulk', (req, res) => {
  try {
    const { companyId, parameters, userId } = req.body;
    
    if (!companyId || !Array.isArray(parameters)) {
      return res.status(400).json({ error: 'companyId and parameters array are required' });
    }

    const updateStmt = db.prepare(`
      UPDATE system_parameters 
      SET value = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ? 
      WHERE key = ? AND company_id = ?
    `);

    const insertStmt = db.prepare(`
      INSERT INTO system_parameters (key, company_id, value, category, description, updated_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((params) => {
      let changesMade = 0;
      for (const p of params) {
        // Prevent saving sensitive secrets in plain text for this phase
        if (p.key === 'mail_pass' || p.key === 'msg_token') {
          continue;
        }

        const existing = db.prepare('SELECT value FROM system_parameters WHERE key = ? AND company_id = ?').get(p.key, companyId) as any;
        if (existing) {
          if (existing.value !== String(p.value)) {
            updateStmt.run(String(p.value), userId || null, p.key, companyId);
            changesMade++;
            
            // Log if userId exists
            if (userId && existing.value !== String(p.value)) {
              db.prepare('INSERT INTO audit_logs (id, user_id, company_id, action, module, target_type, target_id, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
                uuidv4(), userId, companyId, 'update_parameter', 'settings', 'system_parameter', p.key, JSON.stringify({ value: existing.value }), JSON.stringify({ value: String(p.value) })
              );
            }
          }
        } else {
          insertStmt.run(p.key, companyId, String(p.value), p.category || 'geral', p.description || null, userId || null);
          changesMade++;
          
          if (userId) {
            db.prepare('INSERT INTO audit_logs (id, user_id, company_id, action, module, target_type, target_id, new_value) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
              uuidv4(), userId, companyId, 'create_parameter', 'settings', 'system_parameter', p.key, JSON.stringify({ value: String(p.value) })
            );
          }
        }
      }
      return changesMade;
    });

    const changes = transaction(parameters);
    
    if (changes > 0 && userId) {
      db.prepare('INSERT INTO security_events (id, user_id, company_id, event_type, severity, description) VALUES (?, ?, ?, ?, ?, ?)').run(
        uuidv4(), userId, companyId, 'system_parameters_updated', 'warning', `Updated ${changes} system parameters`
      );
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error bulk updating system parameters:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
