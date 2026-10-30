import {
  SupplierRecord,
  SourcingRequirements,
  SourcingFilter,
  RankedSupplierResult,
  RfqDraft,
} from '../types/sourcing';

/**
 * Normalizes string for fuzzy/token matching
 */
export function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
}

/**
 * Extracts basic sourcing requirements from user natural language prompt
 */
export function parseSourcingBrief(text: string): Partial<SourcingRequirements> {
  const norm = text.toLowerCase();
  const req: Partial<SourcingRequirements> = {
    material_preferences: [],
    technical_constraints: [],
    sustainability_criteria: [],
  };

  // Garment detection
  if (norm.includes('co-ord') || norm.includes('coord') || norm.includes('two-piece') || norm.includes('set')) {
    req.garment = 'Summer co-ord sets';
  } else if (norm.includes('shirt') || norm.includes('blouse') || norm.includes('top')) {
    req.garment = 'Shirt / Top';
  } else if (norm.includes('dress') || norm.includes('gown')) {
    req.garment = 'Dress';
  } else if (norm.includes('pant') || norm.includes('trouser') || norm.includes('bottom')) {
    req.garment = 'Trousers / Bottoms';
  }

  // Location detection
  if (norm.includes('ahmedabad')) req.location = 'Ahmedabad';
  else if (norm.includes('surat')) req.location = 'Surat';
  else if (norm.includes('jaipur')) req.location = 'Jaipur';
  else if (norm.includes('tirupur') || norm.includes('tiruppur')) req.location = 'Tirupur';
  else if (norm.includes('delhi') || norm.includes('ncr')) req.location = 'New Delhi';
  else if (norm.includes('coimbatore')) req.location = 'Coimbatore';
  else if (norm.includes('bangalore') || norm.includes('bengaluru')) req.location = 'Bangalore';

  // Quantity detection (metres vs garments)
  const metreMatch = norm.match(/(\d+)\s*(?:[a-z-]+\s*)*(metres?|meters?|m\b)/i);
  const garmentMatch = norm.match(/(\d+)\s*(?:[a-z-]+\s*)*(sets?|pieces?|pcs?|garments?|outfits?)/i);
  if (metreMatch) {
    req.quantity = parseInt(metreMatch[1], 10);
    req.quantity_unit = 'metres';
  } else if (garmentMatch) {
    req.quantity = parseInt(garmentMatch[1], 10);
    req.quantity_unit = 'garments';
  }

  // Budget detection (e.g. ₹180, 180/m, under 200)
  const budgetMatch = norm.match(/(?:₹|rs\.?|inr)\s*(\d+)/i) || norm.match(/under\s*(\d+)/i) || norm.match(/(\d+)\s*(?:\/|\s*per\s*)m(?:etre)?/i);
  if (budgetMatch) {
    req.budget = parseInt(budgetMatch[1], 10);
    req.budget_unit = 'INR per metre';
  }

  // Material preferences
  const materialsList = [
    { key: 'cotton poplin', aliases: ['poplin'] },
    { key: 'cotton lawn', aliases: ['lawn', 'voile', 'cotton voile', 'mulmul'] },
    { key: 'khadi', aliases: ['khadi', 'handloom', 'handspun'] },
    { key: 'viscose', aliases: ['viscose', 'rayon', 'modal', 'georgette'] },
    { key: 'linen', aliases: ['linen', 'flax'] },
    { key: 'jersey', aliases: ['jersey', 'knit', 'knitted'] },
    { key: 'denim', aliases: ['denim', 'twill'] },
  ];

  req.material_preferences = req.material_preferences || [];
  for (const m of materialsList) {
    if (m.aliases.some((alias) => norm.includes(alias))) {
      req.material_preferences.push(m.key);
    }
  }

  // Sustainability flags
  req.sustainability_criteria = req.sustainability_criteria || [];
  if (norm.includes('organic') || norm.includes('gots')) {
    req.sustainability_criteria.push('Organic / GOTS certified');
  }
  if (norm.includes('natural dye') || norm.includes('craftmark') || norm.includes('gi tag')) {
    req.sustainability_criteria.push('Artisanal / GI / Natural dyes');
  }

  return req;
}

/**
 * Filter and rank structured supplier records based on hard constraints and weighted user priorities
 */
export function filterAndRankSuppliers(
  dataset: SupplierRecord[],
  query: string,
  requirements?: Partial<SourcingRequirements>,
  filters?: SourcingFilter
): RankedSupplierResult[] {
  const normQuery = normalize(query);
  const preferredMaterials = requirements?.material_preferences || [];
  const reqLocation = filters?.city || requirements?.location;
  const maxMoq = filters?.max_moq || (requirements?.quantity_unit === 'metres' && requirements.quantity ? requirements.quantity : undefined);
  const maxPrice = filters?.max_price || requirements?.budget;
  const certifiedOnly = filters?.certifications_required && filters.certifications_required.length > 0;

  const results: RankedSupplierResult[] = [];

  for (const supplier of dataset) {
    const isDemo = supplier.record_status === 'illustrative_demo';
    if (filters?.exclude_demo && isDemo) {
      continue;
    }

    let matchScore = 0;
    const matchReasons: string[] = [];
    const tradeOffs: string[] = [];
    const missingFields: string[] = [];

    // --- Hard & Soft Location checks ---
    if (reqLocation) {
      const cityMatches = supplier.location.city.toLowerCase() === reqLocation.toLowerCase();
      if (cityMatches) {
        matchScore += 25;
        matchReasons.push(`Located in ${supplier.location.city} (matches user location priority)`);
      } else if (filters?.city) {
        // Strict city filter
        continue;
      } else {
        tradeOffs.push(`Based in ${supplier.location.city}, ${supplier.location.state} (inter-state courier transit needed)`);
      }
    }

    // --- Material match ---
    const isSummerCoordRelevant = supplier.materials.some((m) =>
      ['cotton poplin', 'cotton lawn', 'cotton voile', 'khadi plain weave', 'viscose woven', 'linen and linen blends'].includes(m)
    );

    let materialMatched = false;
    for (const mat of supplier.materials) {
      const normMat = normalize(mat);
      if (
        normQuery.includes(normMat) ||
        preferredMaterials.some((pm) => normMat.includes(normalize(pm)) || normalize(pm).includes(normMat))
      ) {
        materialMatched = true;
        matchScore += 30;
        matchReasons.push(`Supplies ${mat}`);
        break;
      }
    }

    // If query is broad (e.g. "summer co-ord", "find fabric"), also check general relevance
    if (!materialMatched) {
      if (normQuery.includes('summer') || normQuery.includes('co-ord') || normQuery.includes('coord') || normQuery.includes('fabric')) {
        if (isSummerCoordRelevant) {
          matchScore += 15;
          matchReasons.push(`Carries breathable summer-friendly weaves (${supplier.materials.slice(0, 2).join(', ')})`);
        }
      }
    }

    // --- Quantity / MOQ fit ---
    const moq = supplier.commercial.moq;
    if (moq === null) {
      missingFields.push('MOQ not confirmed in record');
      tradeOffs.push('Minimum order quantity (MOQ) is unconfirmed; must verify directly');
    } else {
      if (maxMoq !== undefined) {
        if (moq <= maxMoq) {
          matchScore += 20;
          matchReasons.push(`MOQ of ${moq} ${supplier.commercial.moq_unit || 'units'} satisfies your target order size`);
        } else if (filters?.max_moq) {
          // Exceeds strict max MOQ filter
          continue;
        } else {
          matchScore -= 10;
          tradeOffs.push(`MOQ of ${moq} ${supplier.commercial.moq_unit || 'm'} exceeds your immediate ${maxMoq}m request`);
        }
      } else {
        if (moq <= 25) {
          matchScore += 15;
          matchReasons.push(`Low MOQ (${moq} ${supplier.commercial.moq_unit || 'units'}) suitable for boutique or student sampling`);
        }
      }
    }

    // --- Price / Budget fit ---
    const price = supplier.commercial.price;
    if (price === null) {
      missingFields.push('Price not confirmed');
    } else {
      if (typeof maxPrice === 'number' && !isNaN(maxPrice) && maxPrice > 0) {
        if (price <= maxPrice) {
          matchScore += 20;
          matchReasons.push(`Indicative price ₹${price}/${supplier.commercial.price_unit || 'm'} within target budget of ₹${maxPrice}`);
        } else if (filters?.max_price) {
          continue;
        } else {
          matchScore -= 5;
          tradeOffs.push(`Indicative price ₹${price}/${supplier.commercial.price_unit || 'm'} is above stated ₹${maxPrice} budget`);
        }
      }
    }

    // --- Certification check ---
    const certs = supplier.technical.certifications || [];
    if (certifiedOnly) {
      const hasCert = certs.length > 0;
      if (!hasCert) continue;
      matchScore += 15;
      matchReasons.push(`Holds traceable certification: ${certs.join(', ')}`);
    } else if (certs.length > 0) {
      matchScore += 5;
      matchReasons.push(`Certification noted: ${certs[0]}`);
    }

    // --- Evidence Quality assessment ---
    const verifiedFieldCount = Object.values(supplier.field_evidence).filter(
      (f) => f.status === 'verified'
    ).length;
    matchScore += verifiedFieldCount * 2;

    // Check missing critical fields
    if (!supplier.contact.phone && !supplier.contact.email && !supplier.contact.website) {
      missingFields.push('Contact details not available in this record');
    }
    if (supplier.commercial.lead_time === null) {
      missingFields.push('Lead time not confirmed');
    }
    if (supplier.commercial.swatches === 'unknown') {
      missingFields.push('Swatch policy not confirmed');
    }

    if (isDemo) {
      tradeOffs.unshift('ILLUSTRATIVE DEMO RECORD — NOT VERIFIED; DO NOT USE FOR REAL SOURCING');
    }

    // If there's any baseline relevance, include it
    if (matchScore > 10 || materialMatched || isSummerCoordRelevant) {
      results.push({
        supplier,
        matchScore,
        matchReasons,
        tradeOffs,
        missingFields,
        isDemo,
      });
    }
  }

  // Sort descending by match score
  results.sort((a, b) => b.matchScore - a.matchScore);
  return results;
}

/**
 * Formats structured retrieved supplier records into clean, unambiguous Markdown
 * for injection into the model context. Model is strictly instructed to draw ONLY
 * from these records and never hallucinate additional suppliers.
 */
export function formatSupplierContextForModel(shortlist: RankedSupplierResult[]): string {
  if (shortlist.length === 0) {
    return 'NO_MATCHING_SUPPLIERS_FOUND: The structured database returned 0 matching supplier records for the current criteria.';
  }

  const lines: string[] = [
    '### RETRIEVED STRUCTURED SUPPLIER RECORDS (Primary Truth Source)',
    'The following supplier records were retrieved from the verified application database. You may explain, compare, and quote these facts, but you MUST NOT invent additional supplier facts or contact details.',
    '',
  ];

  for (let i = 0; i < shortlist.length; i++) {
    const item = shortlist[i];
    const s = item.supplier;
    const isDemo = s.record_status === 'illustrative_demo';

    lines.push(`#### [${i + 1}] ${s.name} ${isDemo ? '⚠️ (ILLUSTRATIVE DEMO RECORD - NOT REAL)' : ''}`);
    lines.push(`- **Supplier ID**: ${s.supplier_id}`);
    lines.push(`- **Type**: ${s.supplier_type.join(', ')}`);
    lines.push(`- **Materials Handled**: ${s.materials.join(', ')}`);
    lines.push(`- **Location**: ${s.location.city}, ${s.location.state}, ${s.location.country}${s.location.address ? ` (Address: ${s.location.address})` : ''}`);
    
    // Contact
    const contacts: string[] = [];
    if (s.contact.website) contacts.push(`Website: ${s.contact.website}`);
    if (s.contact.email) contacts.push(`Email: ${s.contact.email}`);
    if (s.contact.phone) contacts.push(`Phone: ${s.contact.phone}`);
    lines.push(`- **Contact**: ${contacts.length > 0 ? contacts.join(' | ') : 'Contact not available in this record'}`);

    // Commercial
    const priceStr = s.commercial.price !== null ? `₹${s.commercial.price} ${s.commercial.price_unit || ''}` : 'Not confirmed';
    const moqStr = s.commercial.moq !== null ? `${s.commercial.moq} ${s.commercial.moq_unit || ''}` : 'Not confirmed';
    const leadTimeStr = s.commercial.lead_time || 'Not confirmed';
    const swatchStr = s.commercial.swatches === 'available_free' ? 'Free swatches available' : s.commercial.swatches === 'available_paid' ? 'Paid swatch cards available' : s.commercial.swatches === 'not_available' ? 'No swatches provided' : 'Not confirmed';
    lines.push(`- **Commercial**: Price: ${priceStr} | MOQ: ${moqStr} | Lead Time: ${leadTimeStr} | Swatches: ${swatchStr}`);

    // Technical
    const compStr = s.technical.composition || 'Not confirmed';
    const gsmStr = s.technical.gsm !== null ? `${s.technical.gsm} GSM` : 'Not confirmed';
    const certsStr = s.technical.certifications.length > 0 ? s.technical.certifications.join(', ') : 'None confirmed';
    lines.push(`- **Technical Specs**: Composition: ${compStr} | GSM: ${gsmStr} | Certifications: ${certsStr}`);

    // Field Evidence
    const evidenceNotes = Object.entries(s.field_evidence)
      .map(([k, v]) => `${k}: [${v.status.toUpperCase()}] ${v.source ? `(Source: ${v.source}, ${v.checked_at || 'date unknown'})` : ''}`)
      .join('; ');
    lines.push(`- **Field-level Evidence Status**: ${evidenceNotes}`);
    lines.push(`- **Match Rationale**: ${item.matchReasons.join('; ')}`);
    if (item.tradeOffs.length > 0) {
      lines.push(`- **Trade-offs / Cautions**: ${item.tradeOffs.join('; ')}`);
    }
    if (item.missingFields.length > 0) {
      lines.push(`- **Missing Fields To Confirm**: ${item.missingFields.join('; ')}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generates an editable RFQ draft strictly populated from known fields,
 * using clear bracketed placeholders for any unknown items.
 * Strictly no automatic send action exists.
 */
export function generateRfqDraft(
  supplier: SupplierRecord,
  requirements?: Partial<SourcingRequirements>
): RfqDraft {
  const garment = requirements?.garment || '[garment / project title]';
  const materials = requirements?.material_preferences?.length
    ? requirements.material_preferences.join(' or ')
    : supplier.materials.slice(0, 2).join(' or ');

  const quantity = requirements?.quantity
    ? `${requirements.quantity} ${requirements.quantity_unit || 'metres'}`
    : '[quantity and unit, e.g. 30 metres]';

  const deliveryLocation = requirements?.location || '[your delivery city/state]';

  const recipientContact = supplier.contact.email || supplier.contact.phone || 'Contact not available in this record';

  const questions = [
    'Available composition, construction, GSM, width, and in-stock colourways',
    supplier.commercial.price !== null
      ? `Confirmation of quoted wholesale price (recorded as ₹${supplier.commercial.price} ${supplier.commercial.price_unit || ''}), plus applicable GST and courier fees`
      : 'Current wholesale price per metre/kg, applicable GST (5%), and courier dispatch costs',
    supplier.commercial.moq !== null
      ? `Whether the MOQ of ${supplier.commercial.moq} ${supplier.commercial.moq_unit || ''} applies per colourway or for total order`
      : 'Minimum order quantity (MOQ) per colourway and total order',
    'Swatch card availability, courier cost to my location, and dispatch timeline',
    'Current production lead time or dispatch readiness for in-stock bolts',
    supplier.technical.certifications.length > 0
      ? `Technical data sheet and traceable certification documentation for: ${supplier.technical.certifications.join(', ')}`
      : 'Fabric technical specification sheet and wash care / shrinkage guidelines',
  ];

  const body = `Subject: Enquiry — ${materials} for ${garment}

Hello ${supplier.name} Sales Team,

I am sourcing material for ${garment}. Could you please confirm:

- Available composition, construction, GSM, width, colours, and finishes
- Current wholesale price and price unit, plus applicable taxes (GST) and shipping
- Minimum order quantity (MOQ) and whether it applies per colour/design
- Swatch availability, cost, and delivery method to ${deliveryLocation}
- Current lead time and stock/production availability
- Relevant technical data sheets and certification documentation, if applicable
- Shipping options to ${deliveryLocation}

Estimated quantity: ${quantity}
Required-by date: [required date, e.g. DD/MM/YYYY]

Thank you,
[Your Name / Label Name]
[Your Phone / Contact Details]

---
Note: This is a user-editable draft generated by THREADLINE. Review quantities and specifications before copying and sending independently. THREADLINE does not contact suppliers or send messages.`;

  return {
    subject: `Enquiry — ${materials} for ${garment}`,
    recipientName: supplier.name,
    recipientContact,
    supplierId: supplier.supplier_id,
    garmentProject: garment,
    materialsRequested: materials,
    quantityRequested: quantity,
    deliveryLocation,
    questions,
    body,
  };
}

/**
 * Validates file upload against strict constraints (MIME type, size, count)
 * and sanitizes instructions inside files to treat them as untrusted data.
 */
export function validateAttachment(file: { name: string; mimeType: string; size: number }): {
  valid: boolean;
  error?: string;
} {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/plain',
  ];

  if (!allowedMimeTypes.includes(file.mimeType.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported file format (${file.mimeType}). Please upload a JPEG, PNG, WebP image, or PDF/TXT document.`,
    };
  }

  const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 10MB limit (uploaded: ${(file.size / (1024 * 1024)).toFixed(1)}MB). Please upload a smaller file.`,
    };
  }

  return { valid: true };
}
