import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/logs', (req, res) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100').all();
  res.json(logs);
});

router.get('/security', (req, res) => {
  const events = db.prepare('SELECT * FROM security_events ORDER BY created_at DESC LIMIT 100').all();
  res.json(events);
});

export default router;
