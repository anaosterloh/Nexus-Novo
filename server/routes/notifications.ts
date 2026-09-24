import { Router } from 'express';
import db from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', (req, res) => {
  try {
    const { companyId, userId, role, department } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }

    let query = `
      SELECT * FROM notifications 
      WHERE company_id = ? 
      AND status != 'archived'
      AND (snoozed_until IS NULL OR snoozed_until <= CURRENT_TIMESTAMP)
      AND (
        (scope = 'user' AND target_user_id = ?) OR
        (scope = 'role' AND target_role = ?) OR
        (scope = 'department' AND target_department = ?) OR
        (scope = 'company') OR
        (scope = 'global')
      )
    `;
    const params = [companyId, userId || '', role || '', department || ''];

    // Order by priority (blocking > urgent > warning > info), then created_at desc
    query += `
      ORDER BY 
        CASE 
          WHEN type = 'blocking' THEN 1
          WHEN type = 'urgent' THEN 2
          WHEN type = 'warning' THEN 3
          ELSE 4
        END,
        priority DESC,
        created_at DESC
    `;

    const notifications = db.prepare(query).all(...params);
    res.json(notifications);
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.post('/', (req, res) => {
  try {
    const {
      companyId,
      title,
      message,
      type = 'info',
      scope = 'user',
      target_user_id,
      target_role,
      target_department,
      priority = 0,
      requires_response = 0,
      created_by,
      created_by_name,
      source_module,
      source_type,
      source_id
    } = req.body;

    if (!companyId || !title || !message) {
      return res.status(400).json({ error: 'companyId, title, and message are required' });
    }

    const id = `notif_${uuidv4()}`;
    
    db.prepare(`
      INSERT INTO notifications (
        id, company_id, title, message, type, scope, 
        target_user_id, target_role, target_department,
        priority, requires_response, created_by, created_by_name,
        source_module, source_type, source_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, companyId, title, message, type, scope,
      target_user_id || null, target_role || null, target_department || null,
      priority, requires_response ? 1 : 0, created_by || null, created_by_name || null,
      source_module || null, source_type || null, source_id || null
    );

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, company_id, action, module, target_type, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), created_by || 'system', companyId, 'create_notification', 'notifications', 'notification', title);

    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
    res.status(201).json(notification);
  } catch (error: any) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

router.patch('/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("UPDATE notifications SET status = 'read', read_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

router.patch('/:id/unread', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("UPDATE notifications SET status = 'unread', read_at = NULL WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to mark as unread' });
  }
});

router.patch('/:id/snooze', (req, res) => {
  try {
    const { id } = req.params;
    const { snoozed_until } = req.body;
    db.prepare("UPDATE notifications SET status = 'snoozed', snoozed_until = ? WHERE id = ?").run(snoozed_until, id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to snooze' });
  }
});

router.patch('/:id/resolve', (req, res) => {
  try {
    const { id } = req.params;
    const { response_text, companyId } = req.body;
    db.prepare("UPDATE notifications SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP, response_text = ? WHERE id = ?").run(response_text || null, id);
    
    if (companyId) {
      db.prepare(`
        INSERT INTO audit_logs (id, user_id, company_id, action, module, target_type, target_id, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), 'system', companyId, 'resolve_notification', 'notifications', 'notification', id, `Resolved notif ${id}`);
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to resolve' });
  }
});

router.patch('/:id/archive', (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.body;
    db.prepare("UPDATE notifications SET status = 'archived', archived_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);

    if (companyId) {
      db.prepare(`
        INSERT INTO audit_logs (id, user_id, company_id, action, module, target_type, target_id, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), 'system', companyId, 'archive_notification', 'notifications', 'notification', id, `Archived notif ${id}`);
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to archive' });
  }
});

router.get('/summary', (req, res) => {
  try {
    const { companyId, userId, role, department } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }

    const unreadCount = (db.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE company_id = ? 
      AND status = 'unread'
      AND (snoozed_until IS NULL OR snoozed_until <= CURRENT_TIMESTAMP)
      AND (
        (scope = 'user' AND target_user_id = ?) OR
        (scope = 'role' AND target_role = ?) OR
        (scope = 'department' AND target_department = ?) OR
        (scope = 'company') OR
        (scope = 'global')
      )
    `).get(companyId, userId || '', role || '', department || '') as any).count;

    const urgentCount = (db.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE company_id = ? 
      AND type = 'urgent'
      AND status NOT IN ('resolved', 'archived')
      AND (snoozed_until IS NULL OR snoozed_until <= CURRENT_TIMESTAMP)
      AND (
        (scope = 'user' AND target_user_id = ?) OR
        (scope = 'role' AND target_role = ?) OR
        (scope = 'department' AND target_department = ?) OR
        (scope = 'company') OR
        (scope = 'global')
      )
    `).get(companyId, userId || '', role || '', department || '') as any).count;

    const blockingCount = (db.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE company_id = ? 
      AND type = 'blocking'
      AND status NOT IN ('resolved', 'archived')
      AND (snoozed_until IS NULL OR snoozed_until <= CURRENT_TIMESTAMP)
      AND (
        (scope = 'user' AND target_user_id = ?) OR
        (scope = 'role' AND target_role = ?) OR
        (scope = 'department' AND target_department = ?) OR
        (scope = 'company') OR
        (scope = 'global')
      )
    `).get(companyId, userId || '', role || '', department || '') as any).count;

    const snoozedCount = (db.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE company_id = ? 
      AND status = 'snoozed'
      AND snoozed_until > CURRENT_TIMESTAMP
      AND (
        (scope = 'user' AND target_user_id = ?) OR
        (scope = 'role' AND target_role = ?) OR
        (scope = 'department' AND target_department = ?) OR
        (scope = 'company') OR
        (scope = 'global')
      )
    `).get(companyId, userId || '', role || '', department || '') as any).count;

    const resolvedTodayCount = (db.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE company_id = ? 
      AND status = 'resolved'
      AND resolved_at >= date('now')
      AND (
        (scope = 'user' AND target_user_id = ?) OR
        (scope = 'role' AND target_role = ?) OR
        (scope = 'department' AND target_department = ?) OR
        (scope = 'company') OR
        (scope = 'global')
      )
    `).get(companyId, userId || '', role || '', department || '') as any).count;

    res.json({
      unread: unreadCount,
      urgent: urgentCount,
      blocking: blockingCount,
      snoozed: snoozedCount,
      resolvedToday: resolvedTodayCount
    });

  } catch (error: any) {
    console.error('Error fetching notification summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

export default router;
