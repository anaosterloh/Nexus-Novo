import express from 'express';
import db from '../db';

const router = express.Router();

// Get all suppliers
router.get('/', (req, res) => {
  const { companyId } = req.query;
  if (!companyId) return res.status(400).json({ error: 'Company ID is required' });

  const suppliers = db.prepare('SELECT * FROM suppliers WHERE company_id = ? ORDER BY name ASC').all(companyId);
  res.json(suppliers);
});

// Create a new supplier
router.post('/', (req, res) => {
  const { companyId, name, document, email, phone, category } = req.body;
  
  try {
    const id = `supp_${Date.now()}`;
    db.prepare(`
      INSERT INTO suppliers (id, company_id, name, document, email, phone, category)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, companyId, name, document, email, phone, category);
    
    res.json({ id, name });
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'CNPJ já cadastrado' });
    }
    res.status(500).json({ error: 'Erro ao cadastrar fornecedor' });
  }
});

export default router;
