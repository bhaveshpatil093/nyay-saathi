import React, { useState, useRef } from 'react';
import {
  Phone,
  Shield,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Printer,
  Download,
  Share2,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Info,
  Scale,
  Sparkles,
  ExternalLink,
  Eye,
  X,
} from 'lucide-react';
import { useI18n } from '../../i18n/index.ts';
import { exportPdf, printDocument, shareDocument } from '../../lib/pdf/index.ts';
import { useToast } from '../../components/ui/Toast.tsx';
import { OfficerSwitchBanner } from '../../components/citizen/OfficerSwitchBanner.tsx';

interface EmergencyContact {
  id: string;
  number: string;
  title_en: string;
  title_mr: string;
  desc_en: string;
  desc_mr: string;
  color: string;
  badge: string;
}

const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'police',
    number: '112',
    title_en: 'Police & National Emergency',
    title_mr: 'पोलीस व राष्ट्रीय आपत्कालीन',
    desc_en: '24x7 all-in-one emergency response for immediate police, fire, or rescue assistance.',
    desc_mr: 'पोलीस, अग्निशामक आणि आपत्कालीन मदतीसाठी २४ तास सुरू असणारा एकात्मिक राष्ट्रीय क्रमांक.',
    color: 'from-blue-600 to-indigo-700 text-white',
    badge: 'Emergency 24x7',
  },
  {
    id: 'cyber',
    number: '1930',
    title_en: 'National Cyber Financial Fraud',
    title_mr: 'सायबर आर्थिक फसवणूक हेल्पलाइन',
    desc_en: 'Call immediately within golden hours to freeze unauthorized bank/UPI transactions.',
    desc_mr: 'फसवणूक झाल्यानंतर खात्यातील पैसे गोठवण्यासाठी पहिल्या १-२ तासांत तात्काळ कॉल करा.',
    color: 'from-rose-600 to-red-700 text-white',
    badge: 'Golden Hour Helpline',
  },
  {
    id: 'women',
    number: '181',
    title_en: 'Women Helpline',
    title_mr: 'महिला हेल्पलाइन',
    desc_en: 'Confidential support, legal guidance, and rescue for women facing violence or distress.',
    desc_mr: 'संकटात सापडलेल्या महिलांसाठी कायदेशीर साहाय्य, समुपदेशन आणि तातडीची मदत.',
    color: 'from-pink-600 to-rose-700 text-white',
    badge: 'Women Safety',
  },
  {
    id: 'child',
    number: '1098',
    title_en: 'Childline (Child Protection)',
    title_mr: 'चाइल्डलाइन (बाल संरक्षण हेल्पलाइन)',
    desc_en: '24x7 free emergency phone service for children in need of aid and care.',
    desc_mr: 'अडचणीतील, हरवलेल्या किंवा अत्याचारास बळी पडलेल्या बालकांसाठी २४ तास मोफत सेवा.',
    color: 'from-amber-600 to-orange-700 text-white',
    badge: 'Child Helpline',
  },
  {
    id: 'legal_aid',
    number: '15100',
    title_en: 'National Legal Aid (NALSA / DLSA)',
    title_mr: 'मोफत कायदेशीर साहाय्य (विधी सेवा)',
    desc_en: 'Toll-free 24x7 helpline for free legal advice and government defense counsel.',
    desc_mr: 'गरजू व पात्र नागरिकांसाठी मोफत वकील आणि कायदेशीर मार्गदर्शनासाठी राष्ट्रीय सेवा.',
    color: 'from-emerald-600 to-teal-700 text-white',
    badge: 'Free Legal Aid',
  },
];

interface FaqItem {
  id: string;
  q_en: string;
  q_mr: string;
  a_en: string;
  a_mr: string;
  legalRef: string;
}

const FAQS: FaqItem[] = [
  {
    id: 'refuse_fir',
    q_en: 'Can the police station refuse to register an FIR for a cognizable crime?',
    q_mr: 'पोलीस ठाणे दखलपात्र गुन्ह्यासाठी एफआयआर नोंदवण्यास नकार देऊ शकते का?',
    a_en:
      'No. Under Section 173(1) of BNSS 2023, registering an FIR is mandatory if information discloses the commission of a cognizable offence. If the crime took place outside their jurisdiction, they must register a "Zero FIR" and transfer it. For offences punishable between 3 to 7 years, an officer may conduct a preliminary enquiry within 14 days before registering.',
    a_mr:
      'नाही. दखलपात्र गुन्हा घडल्याची माहिती मिळाल्यास एफआयआर नोंदवणे कायद्याने बंधनकारक आहे (BNSS कलम १७३(१)). घटना इतर भागात घडली असल्यास "झिरो एफआयआर" नोंदवून तो वर्ग केला पाहिजे. ३ ते ७ वर्षे शिक्षेच्या गुन्ह्यांमध्ये पोलीस १४ दिवसांत प्राथमिक चौकशी करू शकतात.',
    legalRef: 'BNSS 173(1), 173(3)',
  },
  {
    id: 'fir_cost',
    q_en: 'Do I need to pay any fee or stamp duty to get a copy of the FIR?',
    q_mr: 'एफआयआरची प्रत मिळवण्यासाठी काही शुल्क किंवा पैसे द्यावे लागतात का?',
    a_en:
      'Absolutely not. Section 173(2) of BNSS 2023 guarantees that a copy of the FIR shall be given forthwith and free of cost to the informant. Demanding any fee is strictly illegal.',
    a_mr:
      'अजिबात नाही. भारतीय नागरिक सुरक्षा संहिता कलम १७३(२) नुसार एफआयआरची प्रत तक्रारदाराला ताबडतोब आणि पूर्णपणे मोफत (विनामूल्य) दिलीच पाहिजे. यासाठी कोणतेही शुल्क आकारणे बेकायदेशीर आहे.',
    legalRef: 'BNSS 173(2)',
  },
  {
    id: 'night_arrest_women',
    q_en: 'Can a woman be arrested after sunset or before sunrise?',
    q_mr: 'सूर्यास्तानंतर किंवा सूर्योदयापूर्वी महिलेला अटक केली जाऊ शकते का?',
    a_en:
      'No woman shall be arrested after sunset and before sunrise except in exceptional circumstances with prior written permission from the Judicial Magistrate First Class, and any arrest must be carried out only by a woman police officer.',
    a_mr:
      'नाही. सूर्यास्तानंतर आणि सूर्योदयापूर्वी कोणत्याही महिलेला अटक करता येत नाही. केवळ अपवादात्मक परिस्थितीत प्रथम वर्ग न्यायदंडाधिकाऱ्यांची पूर्वपरवानगी आणि महिला पोलीस अधिकाऱ्याच्या उपस्थितीतच अशी अटक होऊ शकते.',
    legalRef: 'BNSS 43(5) / CrPC 46(4)',
  },
  {
    id: 'witness_station',
    q_en: 'Can women, children, or elderly persons be summoned to a police station as witnesses?',
    q_mr: 'महिला, बालके किंवा ज्येष्ठ नागरिकांना साक्षीदार म्हणून ठाण्यात बोलावता येते का?',
    a_en:
      'Under BNSS Section 179(1), no male person under fifteen years or above sixty years, and no woman or person with mental or physical disability shall be required to attend any place other than their residence for witness questioning.',
    a_mr:
      'नाही. BNSS कलम १७९(१) नुसार १५ वर्षांखालील बालक, ६० वर्षांवरील ज्येष्ठ नागरिक, कोणतीही महिला आणि दिव्यांग व्यक्तींना साक्षीदार म्हणून पोलीस ठाण्यात बोलावता येत नाही; पोलीस अधिकाऱ्याने त्यांच्या निवासस्थानी जाऊनच जबाब घेतला पाहिजे.',
    legalRef: 'BNSS 179(1)',
  },
  {
    id: 'efir_signing',
    q_en: 'How does an e-FIR work, and when must I sign it?',
    q_mr: 'ई-एफआयआर (ऑनलाइन तक्रार) कशी काम करते आणि स्वाक्षरी कधी करावी लागते?',
    a_en:
      'You can submit details electronically (via portal or email) to the police station. To convert this electronic information into a registered FIR, the informant must sign the report within three days as stipulated under BNSS 173(1).',
    a_mr:
      'तुम्ही इलेक्ट्रॉनिक माध्यमातून माहिती पाठवू शकता. या माहितीचे अधिकृत एफआयआरमध्ये रूपांतर होण्यासाठी तक्रारदाराने ३ दिवसांच्या आत पोलीस ठाण्यात जाऊन स्वाक्षरी करणे आवश्यक आहे.',
    legalRef: 'BNSS 173(1)',
  },
];

export const CitizenHelpPage: React.FC = () => {
  const { language } = useI18n();
  const { success, error } = useToast();
  const [openFaqId, setOpenFaqId] = useState<string | null>('refuse_fir');
  const [showRightsCardModal, setShowRightsCardModal] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const rightsCardPrintRef = useRef<HTMLDivElement>(null);

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  const handleDownloadRightsCard = async () => {
    if (!rightsCardPrintRef.current) return;
    setIsGenerating(true);
    try {
      await exportPdf(rightsCardPrintRef.current, 'Citizen_Rights_Card_BNSS_2023.pdf');
      success(language === 'mr' ? 'हक्क कार्ड पीडीएफ डाऊनलोड झाले!' : 'Rights card PDF downloaded!');
    } catch (err) {
      console.error(err);
      error('Failed to export PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintRightsCard = () => {
    printDocument();
  };

  const handleShareRightsCard = async () => {
    if (!rightsCardPrintRef.current) return;
    setIsGenerating(true);
    try {
      const result = await exportPdf(rightsCardPrintRef.current, 'Citizen_Rights_Card.pdf');
      await shareDocument(result.blob, 'Citizen Rights Card', 'Citizen_Rights_Card.pdf');
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 gap-6 max-w-4xl mx-auto w-full pb-16">
      {/* Officer mode switch banner */}
      <OfficerSwitchBanner />

      {/* Header */}
      <div className="flex flex-col gap-1 pt-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-saffron">
          {language === 'mr' ? 'आपत्कालीन मदत व संपर्क' : 'Emergency Help & Assistance'}
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
          {language === 'mr' ? 'तातडीचे क्रमांक व वारंवार विचारले जाणारे प्रश्न' : 'Emergency Helplines & Citizen FAQ'}
        </h1>
        <p className="text-xs text-slate-300">
          {language === 'mr'
            ? 'खालील क्रमांकावर एका स्पर्शाने थेट कॉल करा किंवा अधिकारांबाबत शंकांचे निरसन करा.'
            : 'Tap any number below for one-touch calling, or read legal answers to common questions.'}
        </p>

        {/* Small unverified note */}
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs mt-1">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {language === 'mr'
              ? 'सामान्य माहिती, कायदेशीर सल्ला नाही. आपत्कालीन स्थितीत तात्काळ ११२ किंवा १९३० डायल करा.'
              : 'General information, not legal advice. In acute emergency, dial 112 or 1930 immediately.'}
          </span>
        </div>
      </div>

      {/* Emergency Contacts - Big Touch-Friendly Buttons */}
      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          {language === 'mr' ? 'आपत्कालीन हेल्पलाइन क्रमांक (टॅप करून कॉल करा):' : 'Emergency Helpline Numbers (Tap to Call):'}
        </span>

        {EMERGENCY_CONTACTS.map((contact) => (
          <a
            key={contact.id}
            href={`tel:${contact.number}`}
            className="w-full p-4 rounded-2xl bg-navy-800/90 hover:bg-navy-700 border border-navy-600/80 hover:border-saffron/50 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.98] shadow-md group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${contact.color} flex items-center justify-center font-black text-lg tracking-wider shrink-0 shadow-md`}
              >
                {contact.number}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-navy-900 border border-navy-700 text-saffron">
                    {contact.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-saffron transition-colors leading-snug">
                  {language === 'mr' ? contact.title_mr : contact.title_en}
                </h3>
                {language === 'mr' && (
                  <span className="text-xs text-slate-400 font-medium">
                    {contact.title_en}
                  </span>
                )}
                <p className="text-xs text-slate-300 mt-1 line-clamp-1">
                  {language === 'mr' ? contact.desc_mr : contact.desc_en}
                </p>
              </div>
            </div>

            <div className="w-10 h-10 rounded-xl bg-saffron text-navy-950 flex items-center justify-center font-bold text-xs shrink-0 shadow-md shadow-saffron/20 group-hover:scale-105 transition-transform">
              <Phone className="w-5 h-5 fill-current" />
            </div>
          </a>
        ))}
      </div>

      {/* Printable Rights Card Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-navy-800 to-navy-900 border border-saffron/40 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-saffron/15 border border-saffron/30 flex items-center justify-center text-saffron shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h4 className="text-sm font-bold text-white">
              {language === 'mr' ? 'छापील नागरिक हक्क कार्ड' : 'Printable Citizen Rights Card'}
            </h4>
            <p className="text-xs text-slate-300">
              {language === 'mr'
                ? 'खिशात ठेवण्यायोग्य किंवा छापील A4 द्विभाषिक मार्गदर्शक'
                : 'Pocket-ready or A4 bilingual legal rights summary'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowRightsCardModal(true)}
          className="px-3.5 py-2 rounded-xl bg-saffron hover:bg-saffron-600 text-navy-950 font-bold text-xs flex items-center gap-1.5 shrink-0 active:scale-95 shadow-md shadow-saffron/20"
        >
          <Eye className="w-4 h-4" />
          <span>{language === 'mr' ? 'कार्ड पहा' : 'View Card'}</span>
        </button>
      </div>

      {/* Offline & Privacy Device Guarantee */}
      <div className="p-4 rounded-2xl bg-navy-900/80 border border-navy-700 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
          <HardDrive className="w-5 h-5" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'mr' ? '१००% स्थानिक व गोपनीय साठवणूक' : '100% Offline & Private to Your Phone'}</span>
          </span>
          <p className="text-xs text-slate-300 leading-relaxed">
            {language === 'mr'
              ? 'हे अॅप तुमच्या फोनबाहेर किंवा कोणत्याही बाह्य सर्व्हरवर कोणतीही माहिती पाठवत नाही. तुम्ही भरलेले सर्व अर्ज व माहिती केवळ तुमच्या स्वतःच्या फोनच्या मेमरीमध्ये सुरक्षित राहते.'
              : 'This application stores all documents and data strictly on your device. Nothing is sent to external servers or tracked over the internet.'}
          </p>
        </div>
      </div>

      {/* FAQ in Accordions */}
      <div className="flex flex-col gap-2.5 mt-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-saffron" />
          <span>{language === 'mr' ? 'वारंवार विचारले जाणारे कायदेशीर प्रश्न (FAQ):' : 'Frequently Asked Questions (FAQ):'}</span>
        </span>

        {FAQS.map((faq) => {
          const isOpen = openFaqId === faq.id;
          return (
            <div
              key={faq.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'bg-navy-800 border-saffron/40 shadow-lg'
                  : 'bg-navy-800/70 border-navy-600/70 hover:border-navy-500'
              }`}
            >
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full p-4 flex items-start justify-between gap-3 text-left focus:outline-none"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-mono font-bold text-saffron bg-navy-900 px-2 py-0.5 rounded border border-navy-700 self-start mb-1.5">
                    {faq.legalRef}
                  </span>
                  <h4 className="text-sm font-bold text-white leading-snug">
                    {language === 'mr' ? faq.q_mr : faq.q_en}
                  </h4>
                  {language === 'mr' && (
                    <span className="text-xs text-slate-400 font-medium mt-0.5">
                      {faq.q_en}
                    </span>
                  )}
                </div>

                <div className="w-7 h-7 rounded-full bg-navy-700 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-saffron" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-2 border-t border-navy-700/80 bg-navy-900/40 text-xs text-slate-200 leading-relaxed animate-in fade-in duration-150">
                  <p>{language === 'mr' ? faq.a_mr : faq.a_en}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal for Printable Rights Card */}
      {showRightsCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-navy-900 border border-navy-600 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-navy-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-saffron" />
                <span className="font-bold text-white text-sm">
                  {language === 'mr' ? 'नागरिक हक्क मार्गदर्शक कार्ड (A4 Print)' : 'Citizen Rights Card (A4 Print View)'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintRightsCard}
                  className="px-3 py-1.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-white font-semibold text-xs flex items-center gap-1 border border-navy-600"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{language === 'mr' ? 'प्रिंट' : 'Print'}</span>
                </button>
                <button
                  onClick={handleShareRightsCard}
                  className="px-3 py-1.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-white font-semibold text-xs flex items-center gap-1 border border-navy-600"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{language === 'mr' ? 'शेअर' : 'Share'}</span>
                </button>
                <button
                  onClick={handleDownloadRightsCard}
                  disabled={isGenerating}
                  className="px-3.5 py-1.5 rounded-xl bg-saffron text-navy-950 font-bold text-xs flex items-center gap-1 shadow-md shadow-saffron/20 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isGenerating ? 'Generating...' : language === 'mr' ? 'PDF डाउनलोड' : 'Download PDF'}</span>
                </button>
                <button
                  onClick={() => setShowRightsCardModal(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-navy-800 ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content / Printable View */}
            <div className="flex-1 overflow-auto p-4 flex justify-center bg-slate-950">
              <div
                ref={rightsCardPrintRef}
                id="printable-rights-card"
                className="bg-white text-slate-900 w-[794px] min-h-[1123px] p-10 shadow-2xl flex flex-col justify-between font-sans text-xs leading-relaxed"
                style={{ minWidth: '794px', maxWidth: '794px', boxSizing: 'border-box' }}
              >
                <div>
                  {/* Top Legal Disclaimer */}
                  <div className="mb-4 pb-2 border-b border-amber-300 text-amber-900 text-[10px] flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      PENDING LEGAL REVIEW • कायदेशीर पुनरावलोकन प्रलंबित
                    </span>
                    <span className="italic">
                      General Citizen Awareness under BNSS 2023. Not legal advice.
                    </span>
                  </div>

                  {/* Header */}
                  <div className="text-center pb-4 border-b-2 border-slate-900 mb-6">
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">
                      नागरिक कायदेशीर हक्क व सुरक्षा मार्गदर्शक
                    </h1>
                    <h2 className="text-sm font-bold text-slate-700 tracking-wide mt-0.5">
                      CITIZEN LEGAL RIGHTS & STATUTORY SAFEGUARDS (BNSS 2023)
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-1">
                      महाराष्ट्र पोलीस व विधी सेवा • सेवेसाठी तत्पर
                    </p>
                  </div>

                  {/* Emergency Helplines Grid */}
                  <div className="grid grid-cols-4 gap-2 mb-6 text-center">
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                      <span className="block text-lg font-black text-blue-900">112</span>
                      <span className="text-[10px] font-bold text-blue-800">पोलीस व आपत्कालीन</span>
                    </div>
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded">
                      <span className="block text-lg font-black text-rose-900">1930</span>
                      <span className="text-[10px] font-bold text-rose-800">सायबर फसवणूक</span>
                    </div>
                    <div className="p-2 bg-pink-50 border border-pink-200 rounded">
                      <span className="block text-lg font-black text-pink-900">181</span>
                      <span className="text-[10px] font-bold text-pink-800">महिला हेल्पलाइन</span>
                    </div>
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded">
                      <span className="block text-lg font-black text-emerald-900">15100</span>
                      <span className="text-[10px] font-bold text-emerald-800">मोफत विधी सेवा</span>
                    </div>
                  </div>

                  {/* Bilingual Rights Summary Cards */}
                  <div className="space-y-3.5">
                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-900 text-[13px]">
                          १. झिरो एफआयआर (Zero FIR)
                        </span>
                        <span className="font-mono text-[10px] font-bold bg-slate-200 px-1.5 py-0.5 rounded">
                          BNSS 173(1)
                        </span>
                      </div>
                      <p className="text-slate-700">
                        गुन्हा कुठेही घडला असला तरी कोणत्याही पोलीस ठाण्यात तक्रार नोंदवता येते. हद्द नाही म्हणून पोलीस तक्रार नाकारू शकत नाहीत.
                        <br />
                        <span className="text-[11px] text-slate-500">
                          Complaint can be registered at any police station regardless of jurisdiction.
                        </span>
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-900 text-[13px]">
                          २. मोफत एफआयआर प्रत (Free FIR Copy)
                        </span>
                        <span className="font-mono text-[10px] font-bold bg-slate-200 px-1.5 py-0.5 rounded">
                          BNSS 173(2)
                        </span>
                      </div>
                      <p className="text-slate-700">
                        एफआयआर नोंदवल्यानंतर त्याची एक अधिकृत प्रत तक्रारदाराला ताबडतोब आणि पूर्णपणे मोफत मिळणे हा कायदेशीर अधिकार आहे.
                        <br />
                        <span className="text-[11px] text-slate-500">
                          Complainant is entitled to a free and immediate copy of the registered FIR.
                        </span>
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-900 text-[13px]">
                          ३. ९० दिवसांत तपासाची माहिती (90-Day Progress Update)
                        </span>
                        <span className="font-mono text-[10px] font-bold bg-slate-200 px-1.5 py-0.5 rounded">
                          BNSS 193(3)
                        </span>
                      </div>
                      <p className="text-slate-700">
                        तपास अधिकाऱ्याने ९० दिवसांच्या आत गुन्ह्याच्या तपासाची प्रगती तक्रारदाराला किंवा पीडिताला कळवणे अनिवार्य आहे.
                        <br />
                        <span className="text-[11px] text-slate-500">
                          Police must inform informant/victim of probe progress within 90 days.
                        </span>
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-900 text-[13px]">
                          ४. अटकेचे मूलभूत हक्क (Rights on Arrest)
                        </span>
                        <span className="font-mono text-[10px] font-bold bg-slate-200 px-1.5 py-0.5 rounded">
                          Art 22 & BNSS 47, 48, 58
                        </span>
                      </div>
                      <p className="text-slate-700">
                        अटकेचे कारण जाणून घेणे, नातेवाईकास विनाविलंब कळवणे, वैद्यकीय तपासणी करून घेणे, आणि २४ तासांत न्यायदंडाधिकाऱ्यांसमोर हजर करणे बंधनकारक आहे.
                        <br />
                        <span className="text-[11px] text-slate-500">
                          Right to grounds, intimation to relatives, medical check, and magistrate production within 24h.
                        </span>
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-900 text-[13px]">
                          ५. महिला आणि बालकांसाठी संरक्षण (Women & Child Protections)
                        </span>
                        <span className="font-mono text-[10px] font-bold bg-slate-200 px-1.5 py-0.5 rounded">
                          BNSS 173(1), 179(1)
                        </span>
                      </div>
                      <p className="text-slate-700">
                        महिला अधिकाऱ्यामार्फत जबाब नोंदवणे, सूर्यास्तानंतर अटक न करणे, आणि महिला/बालकांना साक्षीदार म्हणून ठाण्यात न बोलावता घरीच जबाब घेणे.
                        <br />
                        <span className="text-[11px] text-slate-500">
                          Statements by female officers; home examination; no night arrest of women without magistrate order.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500 space-y-0.5">
                  <p className="font-bold text-slate-700">
                    Generated by न्याय Saathi • Citizen Support Portal
                  </p>
                  <p>
                    Offline Decision Support Tool • Verify with official state notifications & legal counsel before court use.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
