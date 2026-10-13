import { DOCUMENT_TEMPLATES, DocumentTemplate, DocumentFieldDef } from '../../data/templates.tsx';
import { CaseRecord, EvidenceRecord } from '../../types/database.ts';

/**
 * Retrieves a document template by ID or alias.
 */
export function getTemplateById(templateId: string): DocumentTemplate | null {
  if (!templateId) return null;
  const cleanId = templateId.trim().toLowerCase();

  return (
    DOCUMENT_TEMPLATES.find(
      (tmpl) =>
        tmpl.id.toLowerCase() === cleanId ||
        tmpl.aliases?.some((alias) => alias.toLowerCase() === cleanId)
    ) || null
  );
}

/**
 * Automatically pre-fills template fields based on the case, officer profile, and selected evidence.
 */
export function prefillDocumentFields(
  template: DocumentTemplate,
  context: {
    caseRecord?: CaseRecord | null;
    profile?: any;
    evidence?: EvidenceRecord | null;
  }
): Record<string, any> {
  const result: Record<string, any> = {};
  const { caseRecord, profile, evidence } = context;

  template.fields.forEach((field) => {
    // 1. Check default value
    if (field.defaultValue !== undefined) {
      result[field.key] = field.defaultValue;
    }

    // 2. Resolve source
    if (field.source) {
      const src = field.source.trim();

      if (src === 'case.caseNo' && caseRecord?.caseNo) {
        result[field.key] = caseRecord.caseNo;
      } else if (src === 'case.firNo' && caseRecord?.firNo) {
        result[field.key] = caseRecord.firNo;
      } else if (src === 'case.policeStation' && caseRecord?.policeStation) {
        result[field.key] = caseRecord.policeStation;
      } else if (src === 'case.complainantName' && caseRecord?.complainantName) {
        result[field.key] = caseRecord.complainantName;
      } else if (src === 'case.summary' && caseRecord?.summary) {
        result[field.key] = caseRecord.summary;
      } else if (src === 'case.accusedNames[0]' && caseRecord?.accusedNames?.[0]) {
        result[field.key] = caseRecord.accusedNames[0];
      } else if (src === 'profile.name' && profile?.name) {
        const title = profile.rank ? `${profile.rank} ` : '';
        result[field.key] = `${title}${profile.name}`;
      } else if (src === 'profile.station' && profile?.station) {
        result[field.key] = profile.station;
      } else if (src === 'evidence.sha256' && evidence?.sha256) {
        result[field.key] = evidence.sha256;
      }
    }
  });

  return result;
}

/**
 * Validates document fields against required rules.
 */
export function validateDocumentFields(
  template: DocumentTemplate,
  fields: Record<string, any>
): {
  valid: boolean;
  missingFields: Array<{ key: string; label_en: string; label_mr: string }>;
} {
  const missing: Array<{ key: string; label_en: string; label_mr: string }> = [];

  template.fields.forEach((field) => {
    if (field.required) {
      const val = fields[field.key];
      if (val === undefined || val === null || String(val).trim() === '') {
        missing.push({
          key: field.key,
          label_en: field.label_en,
          label_mr: field.label_mr,
        });
      }
    }
  });

  return {
    valid: missing.length === 0,
    missingFields: missing,
  };
}
