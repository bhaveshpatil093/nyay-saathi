import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Award,
  Users,
  Code2,
  Mail,
  Copy,
  Check,
  Send,
  ExternalLink,
  ChevronLeft,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { useToast } from '../../components/ui/Toast.tsx';

export const AboutPage: React.FC = () => {
  const { language } = useApp();
  const { success: toastSuccess } = useToast();
  const navigate = useNavigate();

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackEmailInput, setFeedbackEmailInput] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const officialEmailPlaceholder = 'feedback.nyaysaathi@mahapolice.gov.in';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(officialEmailPlaceholder);
    setCopiedEmail(true);
    toastSuccess(
      language === 'mr' ? 'ईमेल पत्ता कॉपी केला!' : 'Feedback email copied to clipboard!'
    );
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSubmitted(true);
    toastSuccess(
      language === 'mr'
        ? 'अभिप्राय नोंदवला गेला! धन्यवाद.'
        : 'Feedback recorded locally. Thank you!'
    );
    setFeedbackText('');
  };

  const openLibraries = [
    {
      name: 'React',
      version: '18.x',
      license: 'MIT',
      description: 'Declarative component-driven user interface library',
      url: 'https://react.dev',
    },
    {
      name: 'Vite',
      version: '6.x',
      license: 'MIT',
      description: 'Next-generation ultra-fast frontend build tooling',
      url: 'https://vitejs.dev',
    },
    {
      name: 'Lucide React',
      version: '0.4x',
      license: 'ISC',
      description: 'Consistent, accessible SVG icon system for UI indicators',
      url: 'https://lucide.dev',
    },
    {
      name: 'Tailwind CSS',
      version: '4.x',
      license: 'MIT',
      description: 'Utility-first styling framework with theme tokens',
      url: 'https://tailwindcss.com',
    },
    {
      name: 'idb (IndexedDB Wrapper)',
      version: '8.x',
      license: 'ISC',
      description: 'Promise-based typed client storage for offline reliability',
      url: 'https://github.com/jakearchibald/idb',
    },
    {
      name: 'React Router',
      version: '7.x',
      license: 'MIT',
      description: 'Client-side routing engine with HashRouter compatibility',
      url: 'https://reactrouter.com',
    },
  ];

  return (
    <div className="flex-1 flex flex-col p-4 max-w-4xl mx-auto w-full gap-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-navy-700 pb-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{language === 'mr' ? 'मागे जा' : 'Back'}</span>
        </button>
        <span className="text-xs font-mono text-saffron bg-navy-700/60 px-2.5 py-1 rounded-full border border-saffron/20">
          v1.0.0 Prototype
        </span>
      </div>

      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-700/80 to-navy-900 border border-saffron/30 p-6 shadow-xl flex flex-col sm:flex-row items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-navy-700 border-2 border-saffron/50 flex items-center justify-center shrink-0 shadow-lg text-saffron">
          <Shield className="w-10 h-10" />
        </div>
        <div className="text-center sm:text-left space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-saffron/20 border border-saffron/40 text-[11px] font-bold text-saffron mb-1">
            <Award className="w-3.5 h-3.5" />
            <span>Seva First Innovation Challenge 2026</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide">
            {language === 'mr' ? 'न्यायसाथी (NyaySaathi)' : 'NyaySaathi (न्यायसाथी)'}
          </h1>
          <p className="text-xs text-muted leading-relaxed max-w-xl">
            {language === 'mr'
              ? 'महाराष्ट्र पोलीस दलासाठी नवीन फौजदारी कायदे (BNS, BNSS, BSA 2023) अंतर्गत संपूर्ण ऑफलाइन निर्णय-सहाय्य, डिजिटल जप्ती पंचनामा आणि अनुपालन प्रणाली.'
              : 'Offline-First Legal Decision Support & Digital Evidence Integrity System for Maharashtra Police under BNS, BNSS, and BSA 2023.'}
          </p>
        </div>
      </div>

      {/* Challenge & Zone Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-navy-700/30 border border-muted/20 space-y-1">
          <div className="text-[11px] font-semibold text-muted flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-saffron" />
            <span>{language === 'mr' ? 'इनोव्हेशन आव्हान' : 'Innovation Challenge'}</span>
          </div>
          <div className="text-sm font-bold text-white">Seva First 2026</div>
          <div className="text-xs text-muted">
            {language === 'mr' ? 'महाराष्ट्र झोन' : 'Maharashtra Zone'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-navy-700/30 border border-muted/20 space-y-1">
          <div className="text-[11px] font-semibold text-muted flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-india-green" />
            <span>{language === 'mr' ? 'क्षेत्र / थीम' : 'Domain & Theme'}</span>
          </div>
          <div className="text-sm font-bold text-white">Law & Order</div>
          <div className="text-xs text-muted">
            {language === 'mr' ? 'कायदा आणि सुव्यवस्था' : 'Police Administration & Citizen Rights'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-navy-700/30 border border-muted/20 space-y-1">
          <div className="text-[11px] font-semibold text-muted flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-saffron" />
            <span>{language === 'mr' ? 'टीम लीड' : 'Team Lead'}</span>
          </div>
          <div className="text-sm font-bold text-white">Bhavesh Diwakar Patil</div>
          <div className="text-xs text-muted">Lead Developer & Systems Architect</div>
        </div>
      </div>

      {/* Open Source Licenses */}
      <div className="p-5 rounded-2xl bg-navy-700/20 border border-navy-700 space-y-3">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-saffron" />
          <h2 className="text-sm font-bold text-white">
            {language === 'mr'
              ? 'वापरलेली मुक्त स्रोत ग्रंथालये आणि परवाने'
              : 'Open Source Software & Licenses'}
          </h2>
        </div>
        <p className="text-xs text-muted">
          {language === 'mr'
            ? 'न्यायसाथी खालील मुक्त स्रोत ग्रंथालयांवर आधारित आहे, जे त्यांच्या संबंधित परवान्यांनुसार वापरले जातात.'
            : 'NyaySaathi is built using the following open-source libraries under permissive MIT and ISC licenses.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {openLibraries.map((lib) => (
            <div
              key={lib.name}
              className="p-3 rounded-xl bg-navy-900/60 border border-muted/15 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{lib.name}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-navy-700 border border-muted/20 text-saffron">
                    {lib.license}
                  </span>
                </div>
                <p className="text-[11px] text-muted mt-1 leading-normal">{lib.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official Feedback Section */}
      <div className="p-5 rounded-2xl bg-navy-700/20 border border-navy-700 space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-saffron" />
          <h2 className="text-sm font-bold text-white">
            {language === 'mr' ? 'अभिप्राय आणि संपर्क' : 'Feedback & Contact'}
          </h2>
        </div>

        {/* Feedback email display with copy */}
        <div className="p-3.5 rounded-xl bg-navy-900/80 border border-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-[11px] text-muted font-medium">
              {language === 'mr' ? 'अधिकृत संपर्क ईमेल पत्ता' : 'Designated Feedback Email'}
            </div>
            <div className="text-xs font-mono font-bold text-white select-all">
              {officialEmailPlaceholder}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyEmail}
            className="px-3 py-1.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors self-start sm:self-center"
          >
            {copiedEmail ? (
              <>
                <Check className="w-3.5 h-3.5 text-india-green" />
                <span className="text-india-green">{language === 'mr' ? 'कॉपी केले' : 'Copied'}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-saffron" />
                <span>{language === 'mr' ? 'कॉपी करा' : 'Copy Email'}</span>
              </>
            )}
          </button>
        </div>

        {/* Feedback Form */}
        <form onSubmit={handleSendFeedback} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1">
              {language === 'mr' ? 'तुमचा ईमेल (पर्यायी)' : 'Your Email (Optional)'}
            </label>
            <input
              type="email"
              value={feedbackEmailInput}
              onChange={(e) => setFeedbackEmailInput(e.target.value)}
              placeholder="officer@mahapolice.gov.in"
              className="w-full bg-navy-900 border border-muted/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-saffron"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1">
              {language === 'mr' ? 'अभिप्राय किंवा सूचना *' : 'Feedback or Suggestions *'}
            </label>
            <textarea
              required
              rows={3}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder={
                language === 'mr'
                  ? 'अॅपमधील सुधारणा किंवा सूचना येथे लिहा...'
                  : 'Share feedback regarding BNS mapping, checklist steps, or digital evidence handling...'
              }
              className="w-full bg-navy-900 border border-muted/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-saffron"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-saffron hover:bg-saffron-600 text-navy-900 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-98"
          >
            <Send className="w-3.5 h-3.5" />
            {language === 'mr' ? 'अभिप्राय पाठवा' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
};
