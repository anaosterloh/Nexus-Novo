import express from 'express';
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const permissions = db.prepare('SELECT * FROM permissions').all();
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

router.get('/roles', (req, res) => {
  const { companyId } = req.query;
  try {
    const roles = db.prepare('SELECT * FROM roles WHERE company_id = ? OR company_id IS NULL').all(companyId);
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

router.get('/roles/:id/permissions', (req, res) => {
  const { id } = req.params;
  try {
    const perms = db.prepare('SELECT permission_key, allowed FROM role_permissions WHERE role_id = ?').all(id);
    res.json({ permissions: perms.reduce((acc: any, p: any) => ({ ...acc, [p.permission_key]: p.allowed }), {}) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch role permissions' });
  }
});

router.put('/roles/:id/permissions', (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;
  try {
    const stmt = db.prepare('INSERT OR REPLACE INTO role_permissions (role_id, permission_key, allowed) VALUES (?, ?, ?)');
    const transaction = db.transaction((perms) => {
      for (const [key, allowed] of Object.entries(perms)) {
        stmt.run(id, key, allowed ? 1 : 0);
      }
    });
    transaction(permissions);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update role permissions' });
  }
});

router.get('/users/:id/permissions', (req, res) => {
  const { id } = req.params;
  try {
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(id) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Simplification for now: just return empty override permissions
    // In a full implementation, this would combine role permissions + user overrides
    const perms = db.prepare('SELECT permission_key, allowed FROM user_permissions WHERE user_id = ?').all(id);
    res.json({ permissions: perms.reduce((acc: any, p: any) => ({ ...acc, [p.permission_key]: p.allowed }), {}) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user permissions' });
  }
});

router.put('/users/:id/permissions', (req, res) => {
  const { id } = req.params;
  const { permissions, grantedBy } = req.body;
  try {
    const stmt = db.prepare('INSERT OR REPLACE INTO user_permissions (user_id, permission_key, allowed, granted_by, granted_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)');
    const transaction = db.transaction((perms) => {
      for (const [key, allowed] of Object.entries(perms)) {
        stmt.run(id, key, allowed ? 1 : 0, grantedBy || 'system');
      }
    });
    transaction(permissions);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user permissions' });
  }
});

export default router;
