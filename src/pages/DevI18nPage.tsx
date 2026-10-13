import React, { useState } from 'react';
import { en } from '../i18n/en.ts';
import { mr } from '../i18n/mr.ts';
import { useI18n, formatDate, formatDateTime, formatNumber, formatLegalSection } from '../i18n/index.ts';
import { Card, SectionTitle, Badge, Button, Input, DisclaimerBanner } from '../components/ui/index.ts';
import { CheckCircle2, AlertTriangle, Globe, Calendar, Hash, Scale, BookOpen } from 'lucide-react';

/**
 * Recursively extracts all dot-notation paths from an object
 */
function getAllPaths(obj: Record<string, unknown>, prefix = ''): string[] {
  let paths: string[] = [];
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      paths = paths.concat(getAllPaths(val as Record<string, unknown>, fullPath));
    } else {
      paths.push(fullPath);
    }
  }
  return paths;
}

/**
 * Checks if a path exists in an object
 */
function hasPath(obj: Record<string, unknown>, path: string): boolean {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return false;
    }
  }
  return current !== undefined;
}

export const DevI18nPage: React.FC = () => {
  const { language, toggleLanguage, t } = useI18n();
  const [testKey, setTestKey] = useState('common.decisionSupport');

  // Audit keys
  const enPaths = getAllPaths(en as unknown as Record<string, unknown>);
  const missingInMr = enPaths.filter(
    (p) => !hasPath(mr as unknown as Record<string, unknown>, p)
  );

  const testDate = new Date(2024, 6, 1, 10, 30); // 1 July 2024 (BNSS enactment date)
  const testNumber = 12450;

  const glossaryEntries = [
    { en: 'FIR', mr: 'प्रथम खबर अहवाल (एफआयआर)' },
    { en: 'Zero FIR', mr: 'झिरो एफआयआर' },
    { en: 'Cognizable offence', mr: 'दखलपात्र गुन्हा' },
    { en: 'Non-cognizable offence', mr: 'अदखलपात्र गुन्हा' },
    { en: 'Investigation', mr: 'तपास' },
    { en: 'Investigating Officer (IO)', mr: 'तपास अधिकारी' },
    { en: 'Complainant / Informant', mr: 'फिर्यादी' },
    { en: 'Accused', mr: 'आरोपी' },
    { en: 'Witness', mr: 'साक्षीदार' },
    { en: 'Arrest', mr: 'अटक' },
    { en: 'Seizure', mr: 'जप्ती' },
    { en: 'Panchnama', mr: 'पंचनामा' },
    { en: 'Chargesheet', mr: 'दोषारोपपत्र' },
    { en: 'Evidence', mr: 'पुरावा' },
    { en: 'Electronic record', mr: 'इलेक्ट्रॉनिक अभिलेख' },
    { en: 'Magistrate', mr: 'दंडाधिकारी' },
    { en: 'Chain of custody', mr: 'ताबा साखळी' },
    { en: 'Hash (Digital fingerprint)', mr: 'हॅश (डिजिटल ठसा)' },
    { en: 'Case', mr: 'प्रकरण' },
    { en: 'Deadline', mr: 'मुदत' },
    { en: 'Checklist', mr: 'तपासणी यादी' },
    { en: 'Certificate', mr: 'प्रमाणपत्र' },
  ];

  return (
    <div className="flex-1 flex flex-col p-4 gap-6 text-white max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <SectionTitle
            title="i18n Localization Diagnostics (#/dev/i18n)"
            subtitle="Dev inspection tool: Verification of Marathi language coverage & Intl formatting"
            badge={<Badge variant="info">Dev Only</Badge>}
          />
          <Button
            size="md"
            variant="secondary"
            onClick={toggleLanguage}
            icon={<Globe className="w-4 h-4" />}
          >
            Active: {language === 'mr' ? 'मराठी (mr)' : 'English (en)'}
          </Button>
        </div>
        <DisclaimerBanner
          type="warning"
          message="Mandatory requirement: All Marathi text must be reviewed by a native speaker before official demonstration."
        />
      </div>

      {/* Coverage Status Card */}
      <Card
        highlighted={missingInMr.length === 0}
        header={
          <div className="flex items-center gap-2">
            {missingInMr.length === 0 ? (
              <CheckCircle2 className="w-5 h-5 text-india-green" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-warning" />
            )}
            <span>Dictionary Coverage Audit</span>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-navy-900 rounded-xl border border-navy-600 flex flex-col">
            <span className="text-xs text-muted">Total English Keys</span>
            <span className="text-2xl font-bold font-mono text-white mt-1">
              {enPaths.length}
            </span>
          </div>
          <div className="p-3 bg-navy-900 rounded-xl border border-navy-600 flex flex-col">
            <span className="text-xs text-muted">Marathi Translated</span>
            <span className="text-2xl font-bold font-mono text-india-green mt-1">
              {enPaths.length - missingInMr.length}
            </span>
          </div>
          <div className="p-3 bg-navy-900 rounded-xl border border-navy-600 flex flex-col">
            <span className="text-xs text-muted">Missing Marathi Keys</span>
            <span
              className={`text-2xl font-bold font-mono mt-1 ${
                missingInMr.length === 0 ? 'text-india-green' : 'text-danger'
              }`}
            >
              {missingInMr.length}
            </span>
          </div>
        </div>

        {missingInMr.length === 0 ? (
          <div className="p-3 bg-india-green/15 border border-india-green/40 rounded-xl text-india-green text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>100% Marathi key coverage. All {enPaths.length} keys mapped successfully.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-danger">
              Missing translation paths:
            </span>
            <div className="p-3 bg-navy-900 rounded-xl border border-danger/40 max-h-40 overflow-y-auto font-mono text-xs text-danger/90">
              {missingInMr.map((p) => (
                <div key={p}>• {p}</div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Intl Formatters Test */}
      <Card
        header={
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-saffron" />
            <span>Intl Formatters (en-IN vs mr-IN)</span>
          </div>
        }
      >
        <div className="flex flex-col gap-4 text-sm">
          <p className="text-muted text-xs">
            Dates and numbers adapt via Intl. Legal sections strictly preserve Latin digits in both languages:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 bg-navy-900 rounded-xl border border-navy-600 flex flex-col gap-1.5">
              <span className="text-saffron font-semibold font-sans">English (en-IN):</span>
              <div>Date: <span className="text-white">{formatDate(testDate, 'en')}</span></div>
              <div>DateTime: <span className="text-white">{formatDateTime(testDate, 'en')}</span></div>
              <div>Number: <span className="text-white">{formatNumber(testNumber, 'en')}</span></div>
              <div>Section: <span className="text-india-green font-bold">{formatLegalSection('BNSS', 173, '3')}</span></div>
            </div>

            <div className="p-3 bg-navy-900 rounded-xl border border-navy-600 flex flex-col gap-1.5">
              <span className="text-saffron font-semibold font-sans">Marathi (mr-IN):</span>
              <div>Date: <span className="text-white">{formatDate(testDate, 'mr')}</span></div>
              <div>DateTime: <span className="text-white">{formatDateTime(testDate, 'mr')}</span></div>
              <div>Number: <span className="text-white">{formatNumber(testNumber, 'mr')}</span></div>
              <div>Section: <span className="text-india-green font-bold">{formatLegalSection('BNSS', 173, '3')}</span></div>
            </div>
          </div>
        </div>
      </Card>

      {/* Live Key Lookup Test */}
      <Card
        header={
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-saffron" />
            <span>Live Key Lookup Test</span>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <Input
            label="Translation Key (dot notation)"
            value={testKey}
            onChange={(e) => setTestKey(e.target.value)}
            placeholder="e.g. common.decisionSupport"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-navy-900 rounded-xl border border-navy-600 flex flex-col gap-1">
              <span className="text-xs text-muted">English (en):</span>
              <span className="text-white font-medium">{t(testKey)}</span>
            </div>
            <div className="p-3 bg-navy-900 rounded-xl border border-navy-600 flex flex-col gap-1">
              <span className="text-xs text-muted">Marathi (mr):</span>
              <span className="text-white font-medium">
                {language === 'mr' ? t(testKey) : '(Toggle to Marathi to preview)'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Standard Legal Glossary Verification */}
      <Card
        header={
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-saffron" />
            <span>Standard Police Glossary Verification</span>
          </div>
        }
      >
        <div className="max-h-72 overflow-y-auto rounded-xl border border-navy-600/60 divide-y divide-navy-600/40">
          {glossaryEntries.map((item, idx) => (
            <div key={idx} className="p-2.5 flex items-center justify-between text-xs bg-navy-900/60 hover:bg-navy-900">
              <span className="text-muted font-medium">{item.en}</span>
              <span className="text-white font-semibold">{item.mr}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
