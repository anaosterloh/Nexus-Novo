import { Router } from 'express';
import db from '../db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/login', (req, res) => {
  const loginIdentifier = String(req.body.login || req.body.email || '').trim().toLowerCase();
  const passwordInput = String(req.body.password || '').trim();

  if (!loginIdentifier || !passwordInput) return res.status(400).json({ error: 'Email/Username and password required' });

  try {
    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?').get(loginIdentifier, loginIdentifier) as any;
    if (!user) {
      db.prepare('INSERT INTO security_events (id, event_type, description) VALUES (?, ?, ?)').run(uuidv4(), 'login_failed', 'Failed login for ' + loginIdentifier);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      db.prepare('INSERT INTO security_events (id, user_id, event_type, description) VALUES (?, ?, ?, ?)').run(uuidv4(), user.id, 'login_failed', 'Blocked user ' + loginIdentifier);
      return res.status(401).json({ error: 'User is not active' });
    }

    const isValid = bcrypt.compareSync(passwordInput, user.password);
    if (!isValid) {
      db.prepare('INSERT INTO security_events (id, user_id, event_type, description) VALUES (?, ?, ?, ?)').run(uuidv4(), user.id, 'login_failed', 'Invalid password for ' + loginIdentifier);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const sessionId = uuidv4();
    const companyId = user.company_id || 'comp_1';

    db.prepare('INSERT INTO user_sessions (id, user_id, company_id, user_agent, ip_address, expires_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\', \'+12 hours\'))').run(sessionId, user.id, companyId, req.headers['user-agent'] || '', req.ip || '');

    db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    db.prepare('INSERT INTO security_events (id, user_id, user_name, company_id, event_type, description) VALUES (?, ?, ?, ?, ?, ?)').run(
      uuidv4(), user.id, user.name, companyId, 'login_success', 'Successful login'
    );

    const { password: _, pin_hash, ...safeUser } = user;
    res.json({ user: safeUser, session: sessionId, permissions: {} });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', (req, res) => {
  try {
    const { sessionId } = req.body;
    if (sessionId) {
      db.prepare('UPDATE user_sessions SET status = \'ended\', ended_at = CURRENT_TIMESTAMP, ended_reason = \'user_logout\' WHERE id = ?').run(sessionId);
      const session = db.prepare('SELECT user_id, company_id FROM user_sessions WHERE id = ?').get(sessionId) as any;
      if (session) {
        db.prepare('INSERT INTO security_events (id, user_id, company_id, event_type, severity, description) VALUES (?, ?, ?, ?, ?, ?)').run(
          uuidv4(), session.user_id, session.company_id, 'logout', 'info', 'User logged out'
        );
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.json({ success: true }); // Return success anyway to clear frontend session
  }
});

router.get('/me', (req, res) => {
  const sessionId = req.headers.authorization?.split(' ')[1] || req.query.sessionId;
  if (!sessionId) return res.status(401).json({ error: 'No session' });

  try {
    const session = db.prepare('SELECT * FROM user_sessions WHERE id = ? AND status = \'active\' AND expires_at > CURRENT_TIMESTAMP').get(sessionId) as any;
    if (!session) return res.status(401).json({ error: 'Invalid or expired session' });

    db.prepare('UPDATE user_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?').run(sessionId);
    db.prepare('UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = ?').run(session.user_id);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id) as any;
    if (!user || user.status !== 'active') return res.status(401).json({ error: 'User unavailable' });

    const { password: _, pin_hash, ...safeUser } = user;
    
    let permsDict: Record<string, boolean> = {};
    try {
      const rolePerms = db.prepare('SELECT permission_key, allowed FROM role_permissions WHERE role_id = ?').all(user.role);
      const userPerms = db.prepare('SELECT permission_key, allowed FROM user_permissions WHERE user_id = ?').all(user.id);
      
      for (const p of rolePerms as any[]) permsDict[p.permission_key] = !!p.allowed;
      for (const p of userPerms as any[]) permsDict[p.permission_key] = !!p.allowed; // override
    } catch (permError) {
      // Ignored if permissions tables do not exist yet.
    }

    res.json({ user: safeUser, session: session.id, permissions: permsDict });
  } catch (error) {
    console.error("Auth /me error:", error);
    res.status(401).json({ error: 'Failed to authenticate session' });
  }
});

router.post('/verify-pin', (req, res) => {
  const { userId, companyId, pin, actionKey, actionGroup } = req.body;
  if (!userId || !pin) return res.status(400).json({ error: 'Missing pin details' });

  const user = db.prepare('SELECT pin_hash, pin_failed_attempts FROM users WHERE id = ?').get(userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.pin_failed_attempts >= 3) {
    return res.status(403).json({ error: 'PIN bloqueado devido a múltiplas falhas' });
  }

  const isValid = bcrypt.compareSync(pin, user.pin_hash);
  if (!isValid) {
    const attempts = user.pin_failed_attempts + 1;
    db.prepare('UPDATE users SET pin_failed_attempts = ? WHERE id = ?').run(attempts, userId);
    
    const eventType = attempts >= 3 ? 'pin_blocked' : 'pin_failed';
    const severity = attempts >= 3 ? 'high' : 'medium';
    const description = 'Invalid PIN attempt ' + attempts;
    
    db.prepare('INSERT INTO security_events (id, user_id, company_id, event_type, severity, description) VALUES (?, ?, ?, ?, ?, ?)').run(
      uuidv4(), userId, companyId, eventType, severity, description
    );

    // Create notification for admin
    const notifId = `notif_${uuidv4()}`;
    db.prepare(`
      INSERT INTO notifications (
        id, company_id, title, message, type, scope, target_role, priority, source_module, source_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      notifId, companyId, 
      attempts >= 3 ? 'PIN Bloqueado' : 'Falha de PIN',
      `O usuário teve ${attempts} tentativa(s) falha(s) de PIN.`,
      attempts >= 3 ? 'urgent' : 'warning',
      'role', 'admin', attempts >= 3 ? 1 : 0, 'security', eventType
    );

    if (attempts >= 3) {
      return res.status(403).json({ error: 'PIN bloqueado devido a múltiplas falhas' });
    }
    return res.status(401).json({ error: 'PIN incorreto' });
  }

  // Success
  db.prepare('UPDATE users SET pin_failed_attempts = 0 WHERE id = ?').run(userId);
  
  if (actionGroup) {
    db.prepare('INSERT INTO pin_confirmations (id, user_id, company_id, action_group, valid_until) VALUES (?, ?, ?, ?, datetime(\'now\', \'+5 minutes\'))').run(uuidv4(), userId, companyId, actionGroup);
  }

  res.json({ success: true });
});

router.post('/check-pin-required', (req, res) => {
  const { userId, companyId, actionKey, actionGroup } = req.body;
  if (!userId || !actionKey) return res.status(400).json({ error: 'Missing parameters' });

  try {
    const config = db.prepare('SELECT * FROM critical_actions_config WHERE action_key = ?').get(actionKey) as any;
    if (!config || config.requires_pin === 0 || config.enabled === 0) {
      return res.json({ required: false, alreadyConfirmed: false });
    }

    if (actionGroup) {
      const activeConf = db.prepare('SELECT * FROM pin_confirmations WHERE user_id = ? AND action_group = ? AND status = \'active\' AND valid_until > datetime(\'now\')').get(userId, actionGroup) as any;
      if (activeConf) {
        return res.json({ required: true, alreadyConfirmed: true, validUntil: activeConf.valid_until });
      }
    }

    res.json({ required: true, alreadyConfirmed: false });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check PIN requirement' });
  }
});

export default router;
