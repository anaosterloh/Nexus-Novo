import express from 'express';
import db from '../db';

const router = express.Router();

// Get all carriers
router.get('/', (req, res) => {
  const { companyId } = req.query;
  if (!companyId) return res.status(400).json({ error: 'Company ID is required' });

  const carriers = db.prepare('SELECT * FROM carriers WHERE company_id = ? ORDER BY name ASC').all(companyId);
  res.json(carriers);
});

// Create a new carrier
router.post('/', (req, res) => {
  const { companyId, name, document, email, phone, region } = req.body;
  
  try {
    const id = `car_${Date.now()}`;
    db.prepare(`
      INSERT INTO carriers (id, company_id, name, document, email, phone, region)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, companyId, name, document, email, phone, region);
    
    res.json({ id, name });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao cadastrar transportadora' });
  }
});

export default router;
