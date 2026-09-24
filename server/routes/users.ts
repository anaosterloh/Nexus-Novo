import { Router } from 'express';
import db from '../db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', (req, res) => {
  const users = db.prepare('SELECT id, company_id, name, email, role, status, last_login_at, created_at FROM users').all();
  res.json(users);
});

router.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, reason, endActiveSessions, updated_by } = req.body;
  
  db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
  
  if (status === 'blocked' || endActiveSessions) {
    db.prepare('UPDATE user_sessions SET status = \'ended\', ended_at = CURRENT_TIMESTAMP, ended_reason = \'admin_action\' WHERE user_id = ? AND status = \'active\'').run(id);
    db.prepare('INSERT INTO security_events (id, user_id, event_type, description) VALUES (?, ?, ?, ?)').run(
      uuidv4(), id, 'user_blocked', 'User ' + status + ' by ' + updated_by
    );
  }
  
  db.prepare('INSERT INTO audit_logs (id, user_id, module, action, target_id, target_type, description, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    uuidv4(), updated_by, 'users', 'update_status', id, 'user', 'Status changed to ' + status, reason
  );
  
  res.json({ success: true });
});

router.post('/:id/reset-pin', (req, res) => {
  const { id } = req.params;
  const { updated_by } = req.body;
  
  // Temporary hardcoded default PIN for reset
  const tempPin = '1234';
  const hashedPin = bcrypt.hashSync(tempPin, 10);
  
  db.prepare('UPDATE users SET pin_hash = ?, pin_failed_attempts = 0, pin_reset_required = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hashedPin, id);
  
  db.prepare('INSERT INTO security_events (id, user_id, event_type, description) VALUES (?, ?, ?, ?)').run(
    uuidv4(), id, 'pin_reset', 'PIN reset by ' + updated_by
  );
  
  db.prepare('INSERT INTO audit_logs (id, user_id, module, action, target_id, target_type, description) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    uuidv4(), updated_by, 'users', 'reset_pin', id, 'user', 'PIN reset to default'
  );
  
  res.json({ success: true, tempPin });
});

router.post('/:id/end-sessions', (req, res) => {
  const { id } = req.params;
  const { updated_by } = req.body;
  
  db.prepare('UPDATE user_sessions SET status = \'ended\', ended_at = CURRENT_TIMESTAMP, ended_reason = \'admin_terminated\' WHERE user_id = ? AND status = \'active\'').run(id);
  
  db.prepare('INSERT INTO audit_logs (id, user_id, module, action, target_id, target_type, description) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    uuidv4(), updated_by, 'users', 'end_sessions', id, 'user', 'Sessions terminated by admin'
  );
  
  res.json({ success: true });
});

export default router;
