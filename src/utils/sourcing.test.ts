import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseSourcingBrief,
  filterAndRankSuppliers,
  generateRfqDraft,
  validateAttachment,
  formatSupplierContextForModel,
} from './sourcing';
import { SUPPLIER_DATASET } from '../data/suppliers';

test('parseSourcingBrief extracts garment, location, quantity, and budget accurately', () => {
  const brief = 'I need fabric for 10 summer co-ord sets, relaxed drape, student budget under ₹180 in Ahmedabad';
  const req = parseSourcingBrief(brief);

  assert.equal(req.garment, 'Summer co-ord sets');
  assert.equal(req.location, 'Ahmedabad');
  assert.equal(req.quantity, 10);
  assert.equal(req.quantity_unit, 'garments');
  assert.equal(req.budget, 180);
});

test('parseSourcingBrief distinguishes metres from garments', () => {
  const brief = 'Actually, I need 30 metres, not 30 garments, and my budget is ₹200/metre';
  const req = parseSourcingBrief(brief);

  assert.equal(req.quantity, 30);
  assert.equal(req.quantity_unit, 'metres');
  assert.equal(req.budget, 200);
});

test('filterAndRankSuppliers prioritizes location, material match and MOQ fit', () => {
  const req = {
    garment: 'Summer co-ord sets',
    location: 'Ahmedabad',
    quantity: 15,
    quantity_unit: 'metres',
    material_preferences: ['khadi plain weave', 'cotton lawn'],
  };

  const results = filterAndRankSuppliers(SUPPLIER_DATASET, 'Ahmedabad cotton lawn for co-ords', req);

  assert.ok(results.length > 0, 'Should find matching suppliers');
  // Sabarmati Handloom is located in Ahmedabad, has MOQ 15m, and supplies khadi/lawn
  const topMatch = results[0];
  assert.equal(topMatch.supplier.supplier_id, 'ahmedabad-sabarmati-khadi');
  assert.ok(topMatch.matchReasons.some((r) => r.includes('Ahmedabad')));
  assert.ok(topMatch.matchReasons.some((r) => r.includes('MOQ of 15')));
});

test('filterAndRankSuppliers clearly flags illustrative demo records', () => {
  const results = filterAndRankSuppliers(SUPPLIER_DATASET, 'Apex recycled polyester');
  const demoResult = results.find((r) => r.supplier.supplier_id === 'demo-illustrative-synthetics');
  
  assert.ok(demoResult, 'Demo record should be found when matching query');
  assert.equal(demoResult?.isDemo, true);
  assert.ok(demoResult?.tradeOffs.some((t) => t.includes('ILLUSTRATIVE DEMO RECORD')));
});

test('generateRfqDraft includes bracketed placeholders and has no automated send capability', () => {
  const supplier = SUPPLIER_DATASET[0];
  const req = {
    garment: 'Summer Co-ord',
    location: 'Ahmedabad',
    quantity: 20,
    quantity_unit: 'metres',
    material_preferences: ['Cotton Voile'],
  };

  const draft = generateRfqDraft(supplier, req);

  assert.ok(draft.subject.includes('Cotton Voile'));
  assert.ok(draft.body.includes(supplier.name));
  assert.ok(draft.body.includes('Ahmedabad'));
  assert.ok(draft.body.includes('20 metres'));
  assert.ok(draft.body.includes('THREADLINE does not contact suppliers or send messages'));
  assert.equal(draft.recipientName, supplier.name);
});

test('validateAttachment rejects oversized or unsupported files', () => {
  const validImage = { name: 'swatch.jpg', mimeType: 'image/jpeg', size: 1024 * 500 };
  assert.equal(validateAttachment(validImage).valid, true);

  const oversized = { name: 'huge_scan.pdf', mimeType: 'application/pdf', size: 15 * 1024 * 1024 };
  const resOversized = validateAttachment(oversized);
  assert.equal(resOversized.valid, false);
  assert.ok(resOversized.error?.includes('exceeds'));

  const unsupported = { name: 'archive.zip', mimeType: 'application/zip', size: 1024 };
  const resUnsupported = validateAttachment(unsupported);
  assert.equal(resUnsupported.valid, false);
  assert.ok(resUnsupported.error?.includes('Unsupported file format'));
});

test('formatSupplierContextForModel outputs structured markdown with field evidence and demo warnings', () => {
  const shortlist = filterAndRankSuppliers(SUPPLIER_DATASET, 'Ahmedabad');
  const context = formatSupplierContextForModel(shortlist);

  assert.ok(context.includes('RETRIEVED STRUCTURED SUPPLIER RECORDS'));
  assert.ok(context.includes('Sabarmati Handloom'));
  assert.ok(context.includes('Field-level Evidence Status'));
});
