import React, { useState, useRef } from 'react';
import {
  FileText,
  Printer,
  Download,
  Share2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Shield,
  Layers,
} from 'lucide-react';
import { useI18n, formatDate } from '../../i18n/index.ts';
import { exportPdf, printDocument, shareDocument } from '../../lib/pdf/index.ts';
import { saveDocument } from '../../lib/db/index.ts';
import { useToast } from '../../components/ui/Toast.tsx';
import { OfficerSwitchBanner } from '../../components/citizen/OfficerSwitchBanner.tsx';

interface ComplaintFormState {
  stationName: string;
  district: string;
  complainantName: string;
  complainantAddress: string;
  complainantMobile: string;
  incidentDate: string;
  incidentTime: string;
  incidentPlace: string;
  incidentDescription: string;
  accusedDetails: string;
  witnessDetails: string;
  documentsAttached: string;
  reliefSought: string;
}

const INITIAL_FORM: ComplaintFormState = {
  stationName: 'Deccan Gymkhana Police Station',
  district: 'Pune',
  complainantName: '',
  complainantAddress: '',
  complainantMobile: '',
  incidentDate: new Date().toISOString().split('T')[0],
  incidentTime: '14:30',
  incidentPlace: '',
  incidentDescription: '',
  accusedDetails: 'अनोळखी व्यक्ती / Unknown person',
  witnessDetails: '',
  documentsAttached: 'पुरावा फोटो / स्क्रीनशॉट (Photos / Screenshots)',
  reliefSought: 'गुन्हा नोंदवून तपास करावा व कायदेशीर कारवाई करावी / Register FIR and take appropriate legal action',
};

export const CitizenComplaintPage: React.FC = () => {
  const { language } = useI18n();
  const { success, error, info } = useToast();
  const [formData, setFormData] = useState<ComplaintFormState>(INITIAL_FORM);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [outputLanguage, setOutputLanguage] = useState<'mr' | 'en'>(language === 'en' ? 'en' : 'mr');

  const printAreaRef = useRef<HTMLDivElement>(null);

  const handleChange = (field: keyof ComplaintFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFillDemo = () => {
    setFormData({
      stationName: 'Shivajinagar Police Station',
      district: 'Pune City',
      complainantName: 'आनंद वसंतराव पाटील (Anand V. Patil)',
      complainantAddress: 'फ्लॅट क्र. ४०२, सह्याद्री हाईट्स, फर्ग्युसन कॉलेज रोड, पुणे ४११०१६',
      complainantMobile: '9822012345',
      incidentDate: new Date().toISOString().split('T')[0],
      incidentTime: '11:15 AM',
      incidentPlace: 'फर्ग्युसन कॉलेज रोड जवळील बस स्टॉप, पुणे',
      incidentDescription:
        'दिनांक ' +
        new Date().toLocaleDateString('en-IN') +
        ' रोजी सकाळी ११:१५ च्या सुमारास मी बसची वाट पाहत उभा असताना दुचाकीवरून आलेल्या दोन अज्ञात इसमांनी माझ्या हातातील मोबाइल फोन (Samsung Galaxy A54) बळजबरीने हिसकावून पळ काढला. गाडीचा क्रमांक अस्पष्ट होता परंतु गाडी काळ्या रंगाची Pulsar होती.',
      accusedDetails: 'दोन अनोळखी इसम, वय अंदाजे २५-३०, काळ्या रंगाची पल्सर दुचाकी, हेल्मेट घातलेले होते.',
      witnessDetails: 'स्थानिक चहा विक्रेता - श्री. रमेश शिंदे (मो. ९४२२३३XXXX)',
      documentsAttached: '१. मोबाइल बिलाची प्रत व IMEI क्रमांक तपशील, २. तक्रारदाराचे आधार कार्ड झेरॉक्स.',
      reliefSought: 'सदर प्रकरणी भारतीय न्याय संहिता अंतर्गत गुन्हा नोंदवून चोरीस गेलेला मोबाइल हस्तगत करावा.',
    });
    info(language === 'mr' ? 'नमुना माहिती भरली गेली आहे.' : 'Sample data filled.');
  };

  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    setIsGenerating(true);
    try {
      const fileName = `Police_Complaint_${formData.complainantName || 'Citizen'}_${formData.incidentDate}.pdf`;
      const result = await exportPdf(printAreaRef.current, fileName);

      // Save to IndexedDB documents store
      await saveDocument({
        caseId: 'citizen_application',
        templateId: 'citizen_complaint',
        language: outputLanguage,
        fields: formData as unknown as Record<string, unknown>,
      });

      success(language === 'mr' ? 'तक्रार अर्ज पीडीएफ यशस्वीरित्या डाऊनलोड झाला!' : 'Complaint PDF downloaded successfully!');
    } catch (err) {
      console.error(err);
      error(language === 'mr' ? 'पीडीएफ तयार करताना त्रुटी आली.' : 'Failed to generate PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    printDocument();
  };

  const handleShare = async () => {
    if (!printAreaRef.current) return;
    setIsGenerating(true);
    try {
      const fileName = `Police_Complaint_${formData.complainantName || 'Citizen'}.pdf`;
      const result = await exportPdf(printAreaRef.current, fileName);
      const shared = await shareDocument(result.blob, 'Police Complaint Application', fileName);
      if (shared) {
        success(language === 'mr' ? 'दस्तऐवज शेअर केला.' : 'Document shared.');
      }
    } catch (err) {
      console.error(err);
      error('Sharing failed');
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
          {language === 'mr' ? 'नागरिक अर्ज जनरेटर' : 'Citizen Application Generator'}
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
          {language === 'mr' ? 'पोलीस तक्रार अर्ज तयार करा' : 'Draft Police Complaint Application'}
        </h1>
        <p className="text-xs text-slate-300">
          {language === 'mr'
            ? 'पोलीस ठाणे प्रमुखांना (SHO) सादर करण्यासाठी कायदेशीर आणि छापील अर्ज एका क्लिकवर तयार करा.'
            : 'Generate a print-ready written application to the Station House Officer (SHO) with statutory clauses.'}
        </p>

        {/* Legal Disclaimer */}
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs mt-1">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {language === 'mr'
              ? 'सामान्य माहिती, कायदेशीर सल्ला नाही. ठाण्यात प्रत्यक्ष सादर करताना स्वाक्षरी करून पोचपावती घ्या.'
              : 'General information, not legal advice. Sign and obtain written acknowledgement at the police station.'}
          </span>
        </div>
      </div>

      {/* Form / Preview Tabs */}
      <div className="flex items-center justify-between gap-2 p-1.5 bg-navy-800 rounded-2xl border border-navy-700">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'form'
                ? 'bg-saffron text-navy-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{language === 'mr' ? 'अर्ज भरा' : 'Edit Form'}</span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'preview'
                ? 'bg-saffron text-navy-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{language === 'mr' ? 'पूर्वावलोकन व प्रिंट' : 'Preview & Print'}</span>
          </button>
        </div>

        {activeTab === 'form' && (
          <button
            onClick={handleFillDemo}
            className="flex items-center gap-1 text-[11px] font-bold text-saffron bg-saffron/10 px-2.5 py-1.5 rounded-xl border border-saffron/20 hover:bg-saffron/20"
          >
            <Sparkles className="w-3 h-3" />
            <span>{language === 'mr' ? 'नमुना भरा' : 'Fill Sample'}</span>
          </button>
        )}
      </div>

      {/* Form View */}
      {activeTab === 'form' ? (
        <div className="flex flex-col gap-4 animate-in fade-in duration-150">
          {/* Target Police Station */}
          <div className="p-4 rounded-2xl bg-navy-800/90 border border-navy-700 flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-saffron flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{language === 'mr' ? 'पोलीस ठाण्याचा तपशील' : 'Target Police Station'}</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {language === 'mr' ? 'पोलीस ठाण्याचे नाव *' : 'Police Station Name *'}
                </label>
                <input
                  type="text"
                  value={formData.stationName}
                  onChange={(e) => handleChange('stationName', e.target.value)}
                  placeholder="e.g. Deccan Gymkhana Police Station"
                  className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-saffron"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {language === 'mr' ? 'जिल्हा / शहर *' : 'District / City *'}
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => handleChange('district', e.target.value)}
                  placeholder="e.g. Pune City"
                  className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-saffron"
                />
              </div>
            </div>
          </div>

          {/* Complainant Details */}
          <div className="p-4 rounded-2xl bg-navy-800/90 border border-navy-700 flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-saffron flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span>{language === 'mr' ? 'तक्रारदाराची माहिती' : 'Complainant Information'}</span>
            </span>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {language === 'mr' ? 'तक्रारदाराचे पूर्ण नाव *' : 'Full Name of Complainant *'}
              </label>
              <input
                type="text"
                value={formData.complainantName}
                onChange={(e) => handleChange('complainantName', e.target.value)}
                placeholder={language === 'mr' ? 'उदा. आनंद वसंतराव पाटील' : 'e.g. Anand V. Patil'}
                className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-saffron"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {language === 'mr' ? 'पूर्ण पत्ता *' : 'Full Residential Address *'}
              </label>
              <textarea
                rows={2}
                value={formData.complainantAddress}
                onChange={(e) => handleChange('complainantAddress', e.target.value)}
                placeholder={language === 'mr' ? 'घर क्र., गल्ली, परिसर, पिनकोड' : 'House no, street, area, pincode'}
                className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-saffron"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {language === 'mr' ? 'मोबाइल क्रमांक (ऐच्छिक)' : 'Mobile Number (Optional)'}
              </label>
              <input
                type="tel"
                value={formData.complainantMobile}
                onChange={(e) => handleChange('complainantMobile', e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-saffron"
              />
            </div>
          </div>

          {/* Incident Details */}
          <div className="p-4 rounded-2xl bg-navy-800/90 border border-navy-700 flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-saffron flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{language === 'mr' ? 'घटनेचा तपशील' : 'Incident Details'}</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {language === 'mr' ? 'घटनेची तारीख *' : 'Date of Incident *'}
                </label>
                <input
                  type="date"
                  value={formData.incidentDate}
                  onChange={(e) => handleChange('incidentDate', e.target.value)}
                  className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-xl text-xs text-white focus:outline-none focus:border-saffron"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {language === 'mr' ? 'घटनेची वेळ (अंदाजे)' : 'Time of Incident (Approx)'}
                </label>
                <input
                  type="text"
                  value={formData.incidentTime}
                  onChange={(e) => handleChange('incidentTime', e.target.value)}
                  placeholder="e.g. 11:30 AM"
                  className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-saffron"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {language === 'mr' ? 'घटनेचे ठिकाण *' : 'Place / Location of Incident *'}
              </label>
              <input
                type="text"
                value={formData.incidentPlace}
                onChange={(e) => handleChange('incidentPlace', e.target.value)}
                placeholder={language === 'mr' ? 'उदा. फर्ग्युसन कॉलेज रोड जवळील बस स्टॉप' : 'Exact landmark, road, area'}
                className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-saffron"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {language === 'mr' ? 'घटनेचा सविस्तर वृत्तांत *' : 'Detailed Description of What Happened *'}
              </label>
              <textarea
                rows={4}
                value={formData.incidentDescription}
                onChange={(e) => handleChange('incidentDescription', e.target.value)}
                placeholder={
                  language === 'mr'
                    ? 'काय घडले, कसे घडले, कोणी काय केले याचा सविस्तर घटनाक्रम लिहा...'
                    : 'Describe the sequence of events clearly and chronologically...'
                }
                className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-saffron"
              />
            </div>
          </div>

          {/* Accused & Witnesses */}
          <div className="p-4 rounded-2xl bg-navy-800/90 border border-navy-700 flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-saffron flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              <span>{language === 'mr' ? 'संशयित / आरोपी व साक्षीदार' : 'Accused & Witnesses'}</span>
            </span>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {language === 'mr' ? 'संशयित / आरोपीचा तपशील (माहीत असल्यास)' : 'Suspect / Accused Details (if known)'}
              </label>
              <input
                type="text"
                value={formData.accusedDetails}
                onChange={(e) => handleChange('accusedDetails', e.target.value)}
                placeholder="Name, vehicle number, phone, physical features, or Unknown"
                className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-saffron"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {language === 'mr' ? 'साक्षीदारांची नावे व संपर्क (असल्यास)' : 'Witness Names & Contact (if any)'}
              </label>
              <input
                type="text"
                value={formData.witnessDetails}
                onChange={(e) => handleChange('witnessDetails', e.target.value)}
                placeholder="Names and phone numbers of eyewitnesses"
                className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-saffron"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {language === 'mr' ? 'जोडलेली कागदपत्रे / पुरावे' : 'Documents / Evidence Attached'}
              </label>
              <input
                type="text"
                value={formData.documentsAttached}
                onChange={(e) => handleChange('documentsAttached', e.target.value)}
                placeholder="e.g. Bills, Photos, Medical receipt, Bank statement"
                className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-saffron"
              />
            </div>
          </div>

          {/* Action button to preview */}
          <button
            onClick={() => {
              if (!formData.complainantName || !formData.incidentDescription) {
                error(language === 'mr' ? 'कृपया तक्रारदाराचे नाव आणि घटनेचा वृत्तांत भरा.' : 'Please enter complainant name and incident description.');
                return;
              }
              setActiveTab('preview');
            }}
            className="w-full py-3.5 rounded-2xl bg-saffron hover:bg-saffron-600 text-navy-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-saffron/20 active:scale-95 transition-all"
          >
            <Eye className="w-4 h-4" />
            <span>{language === 'mr' ? 'अर्ज तपासा व प्रिंट करा (Preview)' : 'Preview Printable Application'}</span>
          </button>
        </div>
      ) : (
        /* Preview & Print Mode */
        <div className="flex flex-col gap-4 animate-in fade-in duration-150">
          {/* Controls Bar */}
          <div className="p-3 rounded-2xl bg-navy-800 border border-navy-700 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">
                {language === 'mr' ? 'भाषा:' : 'Language:'}
              </span>
              <button
                onClick={() => setOutputLanguage('mr')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  outputLanguage === 'mr'
                    ? 'bg-saffron text-navy-950'
                    : 'bg-navy-700 text-slate-300 hover:text-white'
                }`}
              >
                मराठी
              </button>
              <button
                onClick={() => setOutputLanguage('en')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  outputLanguage === 'en'
                    ? 'bg-saffron text-navy-950'
                    : 'bg-navy-700 text-slate-300 hover:text-white'
                }`}
              >
                English
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-xl bg-navy-700 hover:bg-navy-600 text-white font-semibold text-xs flex items-center gap-1.5 border border-navy-600"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{language === 'mr' ? 'प्रिंट' : 'Print'}</span>
              </button>
              <button
                onClick={handleShare}
                className="px-3 py-1.5 rounded-xl bg-navy-700 hover:bg-navy-600 text-white font-semibold text-xs flex items-center gap-1.5 border border-navy-600"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{language === 'mr' ? 'शेअर' : 'Share'}</span>
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={isGenerating}
                className="px-4 py-1.5 rounded-xl bg-saffron hover:bg-saffron-600 text-navy-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-saffron/20 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isGenerating ? 'Generating...' : language === 'mr' ? 'PDF डाउनलोड' : 'Download PDF'}</span>
              </button>
            </div>
          </div>

          {/* Styled HTML A4 Printable Document Container (794 x 1123px standard A4) */}
          <div className="overflow-x-auto bg-slate-900/60 p-2 sm:p-4 rounded-2xl border border-navy-700 flex justify-center">
            <div
              ref={printAreaRef}
              id="printable-complaint-document"
              className="bg-white text-slate-900 w-[794px] min-h-[1123px] p-12 shadow-2xl flex flex-col justify-between font-serif text-[13px] leading-relaxed relative"
              style={{ minWidth: '794px', maxWidth: '794px', boxSizing: 'border-box' }}
            >
              {/* Header Box */}
              <div>
                {/* Pending Legal Review / Unverified note */}
                <div className="mb-4 pb-2 border-b border-amber-300 text-amber-900 text-[10px] flex items-center justify-between font-sans">
                  <span className="font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                    PENDING LEGAL REVIEW • कायदेशीर पुनरावलोकन प्रलंबित
                  </span>
                  <span className="italic">
                    Format based on Section 173 BNSS 2023. Verify before official submission.
                  </span>
                </div>

                {/* To SHO Section */}
                <div className="mb-6 font-sans">
                  <p className="font-bold text-slate-900">
                    {outputLanguage === 'mr' ? 'प्रति,' : 'To,'}
                  </p>
                  <p className="font-bold text-slate-900">
                    {outputLanguage === 'mr'
                      ? 'मा. पोलीस ठाणे अंमलदार / वरिष्ठ पोलीस निरीक्षक,'
                      : 'The Station House Officer / Senior Inspector of Police,'}
                  </p>
                  <p className="text-slate-800">
                    {formData.stationName}, {formData.district}
                  </p>
                </div>

                {/* Subject Line */}
                <div className="my-4 p-2 bg-slate-50 border-y border-slate-300 font-sans font-bold text-center text-sm">
                  {outputLanguage === 'mr' ? (
                    <span>
                      विषय: दखलपात्र गुन्ह्याबाबत लेखी माहिती / प्रथम खबर अर्ज (कलम १७३, BNSS २०२३)
                    </span>
                  ) : (
                    <span>
                      SUBJECT: WRITTEN INFORMATION / FIRST INFORMATION REPORT APPLICATION (U/S 173 BNSS, 2023)
                    </span>
                  )}
                </div>

                {/* Complainant Particulars */}
                <div className="mb-5 bg-slate-50/50 p-3 rounded border border-slate-200 font-sans text-xs grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-bold text-slate-700">
                      {outputLanguage === 'mr' ? 'तक्रारदाराचे नाव: ' : 'Complainant: '}
                    </span>
                    <span className="font-semibold text-slate-900">{formData.complainantName || '—'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">
                      {outputLanguage === 'mr' ? 'मोबाइल क्र.: ' : 'Mobile No.: '}
                    </span>
                    <span className="font-semibold text-slate-900">{formData.complainantMobile || '—'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-bold text-slate-700">
                      {outputLanguage === 'mr' ? 'पत्ता: ' : 'Address: '}
                    </span>
                    <span className="text-slate-900">{formData.complainantAddress || '—'}</span>
                  </div>
                </div>

                {/* Body Paragraphs */}
                <div className="space-y-4 text-justify font-serif text-[13.5px] leading-relaxed">
                  <p>
                    {outputLanguage === 'mr'
                      ? 'महोदय, मी वरील नमूद पत्याचा रहिवासी असून खालीलप्रमाणे घडलेल्या घटनेबाबत आपली कायदेशीर दखल घेण्यासाठी हा अर्ज सादर करत आहे:'
                      : 'Respected Sir/Madam, I the undersigned complainant hereby bring to your official notice the occurrence of a cognizable offence as detailed below:'}
                  </p>

                  {/* Incident Specs */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded font-sans text-xs space-y-1.5">
                    <div className="flex gap-2">
                      <span className="font-bold text-slate-700 w-32 shrink-0">
                        {outputLanguage === 'mr' ? 'घटनेची तारीख व वेळ:' : 'Date & Time:'}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {formData.incidentDate} at {formData.incidentTime}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold text-slate-700 w-32 shrink-0">
                        {outputLanguage === 'mr' ? 'घटनेचे ठिकाण:' : 'Place of Incident:'}
                      </span>
                      <span className="font-semibold text-slate-900">{formData.incidentPlace || '—'}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold text-slate-700 w-32 shrink-0">
                        {outputLanguage === 'mr' ? 'संशयित / आरोपी:' : 'Accused / Suspect:'}
                      </span>
                      <span className="text-slate-900">{formData.accusedDetails || 'Unknown'}</span>
                    </div>
                    {formData.witnessDetails && (
                      <div className="flex gap-2">
                        <span className="font-bold text-slate-700 w-32 shrink-0">
                          {outputLanguage === 'mr' ? 'साक्षीदार:' : 'Witnesses:'}
                        </span>
                        <span className="text-slate-900">{formData.witnessDetails}</span>
                      </div>
                    )}
                  </div>

                  {/* Narrative */}
                  <div>
                    <p className="font-bold font-sans text-xs text-slate-800 mb-1">
                      {outputLanguage === 'mr' ? 'घटनेचा सविस्तर तपशील:' : 'Narrative Facts of the Incident:'}
                    </p>
                    <p className="whitespace-pre-line p-3 bg-white border border-slate-200 rounded text-slate-800">
                      {formData.incidentDescription || '—'}
                    </p>
                  </div>

                  {/* Documents Attached */}
                  {formData.documentsAttached && (
                    <div className="font-sans text-xs">
                      <span className="font-bold text-slate-800">
                        {outputLanguage === 'mr' ? 'सोबत जोडलेली कागदपत्रे / पुरावे: ' : 'Enclosures / Evidence: '}
                      </span>
                      <span className="text-slate-700">{formData.documentsAttached}</span>
                    </div>
                  )}

                  {/* Statutory Closing Clause Mandatory under BNSS 173(2) */}
                  <div className="p-3 bg-amber-50/70 border border-amber-300 rounded font-sans text-xs text-amber-950 font-medium">
                    <p className="font-bold mb-1">
                      {outputLanguage === 'mr'
                        ? 'कायदेशीर मागणी व मोफत एफआयआर प्रत:'
                        : 'Statutory Request & Free FIR Copy Claim:'}
                    </p>
                    <p>
                      {outputLanguage === 'mr'
                        ? 'कृपया माझ्या वरील माहितीची त्वरित दखल घेऊन भारतीय नागरिक सुरक्षा संहिता (BNSS) २०२३ च्या कलम १७३ अन्वये गुन्हा नोंदवावा, आणि मला कलम १७३(२) अन्वये नोंदवलेल्या एफआयआरची मोफत प्रत ताबडतोब उपलब्ध करून द्यावी ही नम्र विनंती.'
                        : 'Kindly register this complaint as an official First Information Report forthwith under Section 173 of the Bharatiya Nagarik Suraksha Sanhita, 2023. Please provide me a free copy of the registered FIR forthwith as mandated by Section 173(2) of BNSS, 2023.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Signatures & Footer Block */}
              <div className="mt-12 pt-6 border-t border-slate-300 font-sans text-xs">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p>
                      <span className="font-bold">{outputLanguage === 'mr' ? 'दिनांक: ' : 'Date: '}</span>
                      <span>{formData.incidentDate || formatDate(new Date().toISOString())}</span>
                    </p>
                    <p>
                      <span className="font-bold">{outputLanguage === 'mr' ? 'ठिकाण: ' : 'Place: '}</span>
                      <span>{formData.district}</span>
                    </p>
                  </div>

                  <div className="text-center w-56">
                    <div className="h-14 border-b border-dashed border-slate-400 mb-1" />
                    <p className="font-bold text-slate-900">{formData.complainantName || 'तक्रारदार / Complainant'}</p>
                    <p className="text-[11px] text-slate-500">
                      {outputLanguage === 'mr' ? 'तक्रारदाराची स्वाक्षरी' : "Complainant's Signature"}
                    </p>
                  </div>
                </div>

                {/* Police Station Receipt Acknowledgement Box */}
                <div className="mt-8 p-3 border border-slate-400 border-dashed rounded bg-slate-50 text-[11px] text-slate-600">
                  <p className="font-bold text-slate-800 text-center uppercase tracking-wider mb-1">
                    {outputLanguage === 'mr' ? 'पोलीस ठाणे पोचपावती (कार्यालयीन वापरासाठी)' : 'Police Station Acknowledgement (For Office Use)'}
                  </p>
                  <div className="flex justify-between mt-2">
                    <span>{outputLanguage === 'mr' ? 'प्राप्त दिनांक व वेळ: ___________________' : 'Received Date & Time: ___________________'}</span>
                    <span>{outputLanguage === 'mr' ? 'अंमलदाराची स्वाक्षरी व शिक्का: ___________________' : 'Officer Signature & Station Seal: ___________________'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
