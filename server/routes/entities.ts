import express from 'express';
import db from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/', (req, res) => {
  const { companyId, role, search, status } = req.query;
  if (!companyId) return res.status(400).json({ error: 'Company ID is required' });

  let query = "SELECT * FROM entities WHERE company_id = ?";
  const params: any[] = [companyId];

  if (role) {
    if (role === 'customer') query += " AND is_customer = 1";
    if (role === 'supplier') query += " AND is_supplier = 1";
    if (role === 'carrier') query += " AND is_carrier = 1";
    if (role === 'manufacturer') query += " AND is_manufacturer = 1";
    if (role === 'partner') query += " AND is_partner = 1";
    if (role === 'prospect') query += " AND is_prospect = 1";
  }

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }

  if (search) {
    query += " AND (display_name LIKE ? OR legal_name LIKE ? OR trade_name LIKE ? OR document LIKE ? OR email LIKE ? OR phone LIKE ?)";
    const wildcard = `%${search}%`;
    params.push(wildcard, wildcard, wildcard, wildcard, wildcard, wildcard);
  }

  const entities = db.prepare(query).all(...params);
  res.json(entities);
});

router.get('/suggestions', (req, res) => {
  const { companyId, q } = req.query;
  if (!companyId) return res.status(400).json({ error: 'Company ID is required' });
  if (!q || typeof q !== 'string' || q.length < 3) {
    return res.json({ suggestions: [] });
  }

  const wildcard = `%${q}%`;
  
  // Basic matching
  const matches = db.prepare(`
    SELECT id, display_name, legal_name, trade_name, document, email, phone
    FROM entities
    WHERE company_id = ?
    AND (display_name LIKE ? OR legal_name LIKE ? OR document = ? OR email = ? OR phone = ?)
  `).all(companyId, wildcard, wildcard, q, q, q) as any[];

  const suggestions = matches.map(m => {
    let strength = 'weak';
    let reason = 'Nome semelhante';
    
    if (m.document === q || m.email === q) {
      strength = 'strong';
      reason = m.document === q ? 'Documento idêntico' : 'Email idêntico';
    } else if (m.phone === q) {
      strength = 'suspect';
      reason = 'Telefone idêntico';
    } else if (m.display_name.toLowerCase() === q.toLowerCase()) {
      strength = 'strong';
      reason = 'Nome idêntico';
    }

    return { ...m, strength, reason };
  });

  res.json({ suggestions });
});

router.get('/pending-review', (req, res) => {
  const { companyId } = req.query;
  if (!companyId) return res.status(400).json({ error: 'Company ID is required' });

  const query = `
    SELECT * FROM entities 
    WHERE company_id = ? 
    AND (review_status = 'pending_review' OR status = 'temporary' OR documentation_status = 'pending' OR duplicate_suspect = 1)
    ORDER BY quick_register DESC, created_at DESC
  `;
  
  const entities = db.prepare(query).all(companyId);
  res.json(entities);
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const { companyId } = req.query;
  
  const entity = db.prepare('SELECT * FROM entities WHERE id = ? AND company_id = ?').get(id, companyId);
  if (!entity) return res.status(404).json({ error: 'Entity not found' });
  
  res.json(entity);
});

router.post('/', (req, res) => {
  const { companyId, display_name, legal_name, trade_name, document, email, phone, roles, quick_register, document_notes, internal_notes } = req.body;
  if (!companyId || !display_name) return res.status(400).json({ error: 'Company ID and display name are required' });

  // Duplication check (Strong)
  if (document) {
    const existing = db.prepare('SELECT * FROM entities WHERE company_id = ? AND document = ?').get(companyId, document);
    if (existing) {
      return res.status(409).json({ error: 'Já existe um cadastro com este CPF/CNPJ.', entity: existing });
    }
  }
  if (email) {
    const existingEmail = db.prepare('SELECT * FROM entities WHERE company_id = ? AND email = ?').get(companyId, email);
    if (existingEmail) {
      return res.status(409).json({ error: 'Já existe um cadastro com este E-mail.', entity: existingEmail });
    }
  }

  const id = `ent_${Date.now()}`;
  const isCustomer = roles?.includes('customer') ? 1 : 0;
  const isSupplier = roles?.includes('supplier') ? 1 : 0;
  const isCarrier = roles?.includes('carrier') ? 1 : 0;
  const isManufacturer = roles?.includes('manufacturer') ? 1 : 0;
  const isPartner = roles?.includes('partner') ? 1 : 0;
  const isProspect = roles?.includes('prospect') ? 1 : 0;

  const isQuick = quick_register ? 1 : (!document ? 1 : 0);
  const reviewStatus = isQuick ? 'pending_review' : 'approved';
  const docStatus = isQuick ? 'pending' : 'not_checked';
  const status = isQuick ? 'temporary' : 'active';

  try {
    db.prepare(`
      INSERT INTO entities (
        id, company_id, display_name, legal_name, trade_name, document, email, phone, 
        is_customer, is_supplier, is_carrier, is_manufacturer, is_partner, is_prospect,
        quick_register, review_status, documentation_status, status, document_notes, internal_notes, created_from
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual_entity')
    `).run(
      id, companyId, display_name, legal_name, trade_name, document || null, email || null, phone || null,
      isCustomer, isSupplier, isCarrier, isManufacturer, isPartner, isProspect,
      isQuick, reviewStatus, docStatus, status, document_notes, internal_notes
    );
    res.json({ success: true, id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create entity' });
  }
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { display_name, legal_name, trade_name, document, email, phone, document_notes, internal_notes } = req.body;
  
  try {
    db.prepare(`
      UPDATE entities 
      SET display_name = ?, legal_name = ?, trade_name = ?, document = ?, email = ?, phone = ?, document_notes = ?, internal_notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(display_name, legal_name, trade_name, document || null, email || null, phone || null, document_notes, internal_notes, id);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update entity' });
  }
});

router.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, review_status, documentation_status, financial_status, operational_status } = req.body;
  
  try {
    const updates: string[] = [];
    const params: any[] = [];

    if (status !== undefined) { updates.push("status = ?"); params.push(status); }
    if (review_status !== undefined) { updates.push("review_status = ?"); params.push(review_status); }
    if (documentation_status !== undefined) { updates.push("documentation_status = ?"); params.push(documentation_status); }
    if (financial_status !== undefined) { updates.push("financial_status = ?"); params.push(financial_status); }
    if (operational_status !== undefined) { updates.push("operational_status = ?"); params.push(operational_status); }

    if (updates.length > 0) {
      params.push(id);
      db.prepare(`UPDATE entities SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...params);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update entity status' });
  }
});

router.patch('/:id/roles', (req, res) => {
  const { id } = req.params;
  const { is_customer, is_supplier, is_carrier, is_manufacturer, is_partner, is_prospect } = req.body;
  
  try {
    db.prepare(`
      UPDATE entities 
      SET is_customer = COALESCE(?, is_customer),
          is_supplier = COALESCE(?, is_supplier),
          is_carrier = COALESCE(?, is_carrier),
          is_manufacturer = COALESCE(?, is_manufacturer),
          is_partner = COALESCE(?, is_partner),
          is_prospect = COALESCE(?, is_prospect),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(is_customer, is_supplier, is_carrier, is_manufacturer, is_partner, is_prospect, id);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update entity roles' });
  }
});

router.patch('/:id/review', (req, res) => {
  const { id } = req.params;
  const { companyId, review_status, documentation_status, status, reviewed_by, internal_notes, document_notes } = req.body;
  const sessionId = req.headers.authorization?.split(' ')[1];
  const session = sessionId ? db.prepare('SELECT user_id FROM user_sessions WHERE id = ?').get(sessionId) as any : null;
  const userId = session?.user_id || reviewed_by || 'system';
  
  if (!companyId) return res.status(400).json({ error: 'Company ID is required' });

  let actionKey = '';
  if (review_status === 'approved') actionKey = 'approve_entity';
  else if (review_status === 'rejected') actionKey = 'reject_entity';
  else if (review_status === 'needs_correction') actionKey = 'request_entity_correction';

  try {
    let requiresPin = 0;
    let pinVerified = 0;

    if (actionKey && userId !== 'system') {
      const config = db.prepare('SELECT * FROM critical_actions_config WHERE action_key = ? AND company_id = ?').get(actionKey, companyId) as any;
      if (config && config.requires_pin === 1 && config.enabled === 1) {
        requiresPin = 1;
        const activeConf = db.prepare('SELECT * FROM pin_confirmations WHERE user_id = ? AND action_group = ? AND status = \'active\' AND valid_until > datetime(\'now\')').get(userId, 'entities');
        if (!activeConf) {
          return res.status(403).json({ error: 'PIN_REQUIRED', actionKey, actionGroup: 'entities' });
        }
        pinVerified = 1;
      }
    }

    const entity: any = db.prepare('SELECT * FROM entities WHERE id = ? AND company_id = ?').get(id, companyId);
    if (!entity) return res.status(404).json({ error: 'Entity not found' });

    let finalStatus = entity.status;
    let finalDocStatus = entity.documentation_status;
    let finalInternalNotes = internal_notes !== undefined ? internal_notes : entity.internal_notes;
    let finalDocumentNotes = document_notes !== undefined ? document_notes : entity.document_notes;
    let reviewedAt = null;
    const finalReviewedBy = userId;

    if (review_status === 'approved') {
      if (finalStatus !== 'blocked') finalStatus = 'active';
      reviewedAt = new Date().toISOString();
      if (documentation_status) finalDocStatus = documentation_status;
    } else if (review_status === 'rejected') {
      finalStatus = 'rejected';
      reviewedAt = new Date().toISOString();
    } else if (review_status === 'needs_correction') {
      finalDocStatus = 'incomplete';
    }

    if (status) finalStatus = status;

    db.prepare(`
      UPDATE entities 
      SET review_status = ?, status = ?, documentation_status = ?, reviewed_by = ?, reviewed_at = ?, internal_notes = ?, document_notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND company_id = ?
    `).run(review_status, finalStatus, finalDocStatus, finalReviewedBy, reviewedAt, finalInternalNotes, finalDocumentNotes, id, companyId);
    
    db.prepare('INSERT INTO audit_logs (id, company_id, user_id, module, action, target_id, target_type, description, reason, requires_pin, pin_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(uuidv4(), companyId, finalReviewedBy, 'entities', 'review_entity', id, 'entity', 'Review status updated to ' + review_status, internal_notes || '', requiresPin, pinVerified);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to review entity' });
  }
});

router.patch('/:id/block', (req, res) => {
  const { id } = req.params;
  const { companyId, blocked, reason, updated_by } = req.body;
  const sessionId = req.headers.authorization?.split(' ')[1];
  const session = sessionId ? db.prepare('SELECT user_id FROM user_sessions WHERE id = ?').get(sessionId) as any : null;
  const userId = session?.user_id || updated_by || 'system';
  
  if (!companyId) return res.status(400).json({ error: 'Company ID is required' });

  const actionKey = blocked ? 'block_entity' : 'unblock_entity';

  try {
    let requiresPin = 0;
    let pinVerified = 0;

    if (userId !== 'system') {
      const config = db.prepare('SELECT * FROM critical_actions_config WHERE action_key = ? AND company_id = ?').get(actionKey, companyId) as any;
      if (config && config.requires_pin === 1 && config.enabled === 1) {
        requiresPin = 1;
        const activeConf = db.prepare('SELECT * FROM pin_confirmations WHERE user_id = ? AND action_group = ? AND status = \'active\' AND valid_until > datetime(\'now\')').get(userId, 'entities');
        if (!activeConf) {
          return res.status(403).json({ error: 'PIN_REQUIRED', actionKey, actionGroup: 'entities' });
        }
        pinVerified = 1;
      }
    }

    const entity: any = db.prepare('SELECT * FROM entities WHERE id = ? AND company_id = ?').get(id, companyId);
    if (!entity) return res.status(404).json({ error: 'Entity not found' });

    let finalOperationalStatus = blocked ? 'blocked' : 'allowed';
    let finalStatus = blocked ? 'blocked' : (entity.review_status === 'approved' ? 'active' : 'temporary');
    let finalInternalNotes = entity.internal_notes || '';

    if (blocked && reason) {
      const blockNote = '[BLOQUEADO: ' + new Date().toLocaleDateString('pt-BR') + '] ' + reason;
      finalInternalNotes = finalInternalNotes ? finalInternalNotes + '\n' + blockNote : blockNote;
    } else if (!blocked && reason) {
      const unblockNote = '[DESBLOQUEADO: ' + new Date().toLocaleDateString('pt-BR') + '] ' + reason;
      finalInternalNotes = finalInternalNotes ? finalInternalNotes + '\n' + unblockNote : unblockNote;
    }

    db.prepare(`
      UPDATE entities 
      SET operational_status = ?, status = ?, internal_notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND company_id = ?
    `).run(finalOperationalStatus, finalStatus, finalInternalNotes, id, companyId);
    
    db.prepare('INSERT INTO audit_logs (id, company_id, user_id, module, action, target_id, target_type, description, reason, requires_pin, pin_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(uuidv4(), companyId, userId, 'entities', blocked ? 'block_entity' : 'unblock_entity', id, 'entity', blocked ? 'Entity blocked' : 'Entity unblocked', reason || '', requiresPin, pinVerified);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to block/unblock entity' });
  }
});

export default router;
