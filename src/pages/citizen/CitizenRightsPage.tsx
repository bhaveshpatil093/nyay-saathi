import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  ShieldCheck,
  HeartHandshake,
  Users,
  Search,
  ExternalLink,
  Phone,
  ArrowRight,
  Info,
  CheckCircle2,
  Sparkles,
  Star,
} from 'lucide-react';
import { useI18n } from '../../i18n/index.ts';
import { useToast } from '../../components/ui/Toast.tsx';
import { useLiveData, listBookmarks, toggleBookmark } from '../../lib/db/index.ts';
import { OfficerSwitchBanner } from '../../components/citizen/OfficerSwitchBanner.tsx';

interface RightItem {
  id: string;
  title_en: string;
  title_mr: string;
  summary_en: string;
  summary_mr: string;
  details_en: string[];
  details_mr: string[];
  legalRef: string;
  act: string;
  icon: React.ElementType;
  color: string;
  quickAction?: {
    label_en: string;
    label_mr: string;
    link: string;
  };
}

const RIGHTS_LIST: RightItem[] = [
  {
    id: 'zero_fir',
    title_en: 'Zero FIR (Report at any Police Station)',
    title_mr: 'झिरो एफआयआर (कोणत्याही पोलीस ठाण्यात तक्रार)',
    summary_en: 'You can register your complaint at any police station regardless of where the crime took place.',
    summary_mr: 'गुन्हा कुठेही घडला असला तरी तुम्ही कोणत्याही जवळच्या पोलीस ठाण्यात त्वरित एफआयआर नोंदवू शकता.',
    details_en: [
      'The police station cannot turn you away citing lack of jurisdiction.',
      'The police station will register a "Zero FIR", initiate immediate preliminary action (such as medical help or evidence securing), and transfer it to the police station with territorial jurisdiction.',
      'You are entitled to a zero FIR number immediately for tracking.',
    ],
    details_mr: [
      'पोलीस ठाणे "आमच्या हद्दीत गुन्हा घडला नाही" असे सांगून तक्रार नाकारू शकत नाही.',
      'पोलीस "झिरो एफआयआर" नोंदवून तातडीची आवश्यक कारवाई (वैद्यकीय मदत किंवा पुरावे सुरक्षित करणे) करतील आणि संबंधित पोलीस ठाण्याकडे गुन्हा वर्ग करतील.',
      'नागरिकाला तात्काळ झिरो एफआयआर क्रमांक मिळण्याचा पूर्ण अधिकार आहे.',
    ],
    legalRef: 'BNSS 173(1)',
    act: 'भारतीय नागरिक सुरक्षा संहिता, २०२३',
    icon: Scale,
    color: 'from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/30',
    quickAction: {
      label_en: 'What to do if refused?',
      label_mr: 'तक्रार नाकारल्यास काय करावे?',
      link: '/citizen/steps',
    },
  },
  {
    id: 'e_fir',
    title_en: 'e-FIR (Electronic Complaint Registration)',
    title_mr: 'ई-एफआयआर (ऑनलाइन / ईमेलने तक्रार)',
    summary_en: 'You can report offences electronically through email or official portals, and must sign within 3 days.',
    summary_mr: 'तुम्ही ईमेल किंवा अधिकृत संकेतस्थळावरून ऑनलाइन तक्रार पाठवू शकता; ३ दिवसांच्या आत स्वाक्षरी करणे आवश्यक आहे.',
    details_en: [
      'Information given electronically will be taken on record immediately by the police station.',
      'For the electronic complaint to be registered as an official FIR, the informant must sign the statement within 3 days.',
      'Saves crucial time in emergencies or when reaching a police station in person is difficult.',
    ],
    details_mr: [
      'इलेक्ट्रॉनिक माध्यमातून (ईमेल किंवा पोर्टल) दिलेली माहिती पोलीस ठाण्यात त्वरित नोंदवली जाते.',
      'अधिकृत एफआयआर म्हणून नोंद होण्यासाठी तक्रारदाराने ३ दिवसांच्या आत पोलीस ठाण्यात जाऊन स्वाक्षरी करणे बंधनकारक आहे.',
      'तातडीच्या परिस्थितीत किंवा प्रत्यक्ष ठाण्यात जाणे शक्य नसताना हा अत्यंत महत्त्वाचा अधिकार आहे.',
    ],
    legalRef: 'BNSS 173(1)',
    act: 'भारतीय नागरिक सुरक्षा संहिता, २०२३',
    icon: Sparkles,
    color: 'from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/30',
    quickAction: {
      label_en: 'Draft a Complaint',
      label_mr: 'तक्रार अर्ज तयार करा',
      link: '/citizen/complaint',
    },
  },
  {
    id: 'free_fir_copy',
    title_en: 'Free Copy of the FIR',
    title_mr: 'एफआयआरची मोफत प्रत मिळण्याचा हक्क',
    summary_en: 'You are legally entitled to receive an official copy of the registered FIR immediately and completely free of cost.',
    summary_mr: 'नोंदवलेल्या एफआयआरची अधिकृत प्रत तक्रारदाराला ताबडतोब आणि पूर्णपणे विनामूल्य मिळण्याचा कायद्याने अधिकार आहे.',
    details_en: [
      'As soon as the FIR is recorded and signed, a copy must be provided to the informant forthwith.',
      'No fees, stamp charges, or photocopying costs can be demanded.',
      'Ensure the station seal and Crime Register (CR) number are clearly legible.',
    ],
    details_mr: [
      'एफआयआर नोंदवून स्वाक्षरी होताच त्याची एक प्रत तक्रारदारास तात्काळ दिलीच पाहिजे.',
      'यासाठी कोणतेही शुल्क किंवा झेरॉक्स खर्च आकारला जाऊ शकत नाही.',
      'प्रतीवर पोलीस ठाण्याचा शिक्का आणि गुन्हा नोंद (CR) क्रमांक असल्याची खात्री करा.',
    ],
    legalRef: 'BNSS 173(2)',
    act: 'भारतीय नागरिक सुरक्षा संहिता, २०२३',
    icon: FileText,
    color: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/30',
  },
  {
    id: 'progress_90_days',
    title_en: '90-Day Investigation Progress Update',
    title_mr: '९० दिवसांच्या आत तपासाची प्रगती कळवणे',
    summary_en: 'The police must inform the informant or victim about the progress of the investigation within 90 days.',
    summary_mr: 'तपासाची सद्यस्थिती काय आहे हे पोलीस अधिकाऱ्याने तक्रारदार किंवा पीडित व्यक्तीला ९० दिवसांच्या आत कळवणे बंधनकारक आहे.',
    details_en: [
      'The Investigating Officer must communicate the status of the probe to the informant/victim.',
      'This update can be communicated electronically or in writing.',
      'Empowers citizens to ensure the investigation is progressing smoothly without undue delay.',
    ],
    details_mr: [
      'तपास अधिकाऱ्याने (IO) ९० दिवसांच्या आत तपासाच्या प्रगतीबाबत तक्रारदारास अवगत करणे आवश्यक आहे.',
      'ही माहिती इलेक्ट्रॉनिक पद्धतीने (एसएमएस/ईमेल) किंवा लेखी स्वरूपात दिली जाऊ शकते.',
      'तपासात अनावश्यक विलंब होत नाही ना हे तपासण्यासाठी हा नागरिकांचा महत्त्वाचा अधिकार आहे.',
    ],
    legalRef: 'BNSS 193(3)',
    act: 'भारतीय नागरिक सुरक्षा संहिता, २०२३',
    icon: Clock,
    color: 'from-cyan-500/20 to-cyan-600/10 text-cyan-400 border-cyan-500/30',
    quickAction: {
      label_en: 'Steps to request update',
      label_mr: 'अपडेट मागण्यासाठी पायऱ्या',
      link: '/citizen/steps',
    },
  },
  {
    id: 'rights_on_arrest',
    title_en: 'Fundamental Rights on Arrest',
    title_mr: 'अटकेच्या वेळी नागरिकांचे मूलभूत हक्क',
    summary_en: 'Know your statutory protections: grounds of arrest, intimation to relatives, medical examination, and magistrate production.',
    summary_mr: 'अटकेचे कारण जाणून घेणे, नातेवाईकांना कळवणे, वैद्यकीय तपासणी आणि २४ तासांत दंडाधिकाऱ्यांसमोर हजर करण्याचे हक्क.',
    details_en: [
      'Right to know grounds: The police officer must immediately inform the arrested person of full particulars of the offence and grounds of arrest (BNSS 47).',
      'Right to inform family: The arrested person has the right to have one friend, relative, or nominated person informed of their arrest and place of detention immediately (BNSS 48).',
      'Right to Medical Examination: Mandatory examination by a medical officer at the time of arrest to document physical condition and any existing injuries (BNSS 53).',
      'Production within 24 Hours: The arrested person must be produced before the nearest Judicial Magistrate within 24 hours of arrest, excluding travel time (Article 22 of Constitution & BNSS 58).',
      'Right to consult a Lawyer: Right to meet and consult an advocate of choice throughout interrogation and proceedings (BNSS 41(d) / Art 22).',
    ],
    details_mr: [
      'अटकेचे कारण जाणून घेण्याचा हक्क: अटक करण्याचे नेमके कारण आणि कलमे तात्काळ स्पष्ट केली पाहिजेत (BNSS 47).',
      'नातेवाईकांना कळवण्याचा हक्क: अटक झालेल्या व्यक्तीने नामनिर्देशित केलेल्या मित्र किंवा नातेवाईकाला अटकेची व ठाण्याची माहिती विनाविलंब दिली पाहिजे (BNSS 48).',
      'वैद्यकीय तपासणीचा हक्क: अटकेच्या वेळी शासकीय वैद्यकीय अधिकाऱ्याकडून शरीराची तपासणी करून जखमांची नोंद केली पाहिजे (BNSS 53).',
      '२४ तासांत दंडाधिकाऱ्यांसमोर हजर करणे: अटकेनंतर २४ तासांच्या आत (प्रवासाचा वेळ वगळून) जवळच्या न्यायदंडाधिकाऱ्यांसमोर हजर करणे अनिवार्य आहे (राज्यघटना कलम २२ व BNSS 58).',
      'वकिलाचा सल्ला घेण्याचा हक्क: चौकशीदरम्यान स्वतःच्या पसंतीच्या वकिलाचा सल्ला घेण्याचा पूर्ण अधिकार आहे.',
    ],
    legalRef: 'Art 22 Const., BNSS 47, 48, 58',
    act: 'भारतीय संविधान व BNSS 2023',
    icon: ShieldCheck,
    color: 'from-indigo-500/20 to-indigo-600/10 text-indigo-400 border-indigo-500/30',
    quickAction: {
      label_en: 'If family member arrested',
      label_mr: 'कुटुंबातील सदस्यास अटक झाल्यास',
      link: '/citizen/steps',
    },
  },
  {
    id: 'women_children_rights',
    title_en: 'Protections for Women and Children',
    title_mr: 'महिला आणि बालकांसाठी विशेष कायदेशीर संरक्षण',
    summary_en: 'Special safeguards: statements recorded by female officers, home recording, and restrictions on summoning to police stations.',
    summary_mr: 'महिला अधिकाऱ्यामार्फत जबाब नोंदवणे, घरी जाऊन जबाब घेणे आणि पोलीस ठाण्यात बोलावण्यावर कायदेशीर बंधने.',
    details_en: [
      'Statements of female victims in offences against women (sexual offences, harassment) must be recorded by a woman police officer (BNSS 173(1) proviso).',
      'Statement recording may be conducted at the victim’s residence or place of choice, in the presence of parents/guardians or a social worker, with audio-video recording.',
      'No male child under 15 years, no woman, and no person above 60 years or with disability can be required to attend any place other than their residence for witness examination (BNSS 179(1)).',
      'Arrest of Women: Women cannot be arrested after sunset and before sunrise except in exceptional circumstances with prior permission of a Judicial Magistrate, and must be arrested only by a female officer.',
    ],
    details_mr: [
      'महिलांविरुद्धच्या गुन्ह्यांमध्ये (लैंगिक अत्याचार, विनयभंग) पीडित महिलेचा जबाब महिला पोलीस अधिकाऱ्यानेच नोंदवला पाहिजे (BNSS 173(1)).',
      'जबाब पीडितेच्या घरी किंवा तिच्या पसंतीच्या ठिकाणी, पालक किंवा समाजसेवकांच्या उपस्थितीत आणि ऑडिओ-व्हिडिओ चित्रीकरणासह नोंदवता येतो.',
      '१५ वर्षांखालील बालक, कोणतीही महिला, आणि ६० वर्षांवरील ज्येष्ठ नागरिकांना साक्षीदार म्हणून पोलीस ठाण्यात बोलावता येत नाही; त्यांचा जबाब त्यांच्या घरीच घ्यावा लागतो (BNSS 179(1)).',
      'महिलांची अटक: सूर्यास्तानंतर आणि सूर्योदयापूर्वी कोणत्याही महिलेला अटक करता येत नाही; अपवादात्मक स्थितीत प्रथम वर्ग न्यायदंडाधिकाऱ्यांची पूर्वपरवानगी आणि महिला पोलीस अधिकारी आवश्यक आहेत.',
    ],
    legalRef: 'BNSS 173(1), 176(1), 179(1)',
    act: 'भारतीय नागरिक सुरक्षा संहिता, २०२३',
    icon: Users,
    color: 'from-pink-500/20 to-pink-600/10 text-pink-400 border-pink-500/30',
  },
  {
    id: 'free_legal_aid',
    title_en: 'Free Legal Aid (DLSA Helpline 15100)',
    title_mr: 'मोफत कायदेशीर मदत (हेल्पलाइन १५१००)',
    summary_en: 'Free legal aid is available through District Legal Services Authority (DLSA) for eligible persons and victims.',
    summary_mr: 'जिल्हा विधी सेवा प्राधिकरणातर्फे (DLSA) गरजू नागरिक आणि पीडितांसाठी मोफत वकील आणि कायदेशीर साहाय्य उपलब्ध आहे.',
    details_en: [
      'National Legal Aid Helpline number is 15100 (Toll-Free, 24x7).',
      'Every arrested person unable to afford an advocate is provided a legal aid defense counsel right from the time of production.',
      'Women, children, SC/ST members, victims of trafficking, and persons with annual income within prescribed limits are entitled to completely free legal services.',
    ],
    details_mr: [
      'राष्ट्रीय विधी सेवा प्राधिकरण (NALSA/DLSA) राष्ट्रीय हेल्पलाइन क्रमांक १५१०० (टोल-फ्री, २४ तास).',
      'वकील देण्यास असमर्थ असणाऱ्या प्रत्येक व्यक्तीला पहिल्या दिवसापासून विनामूल्य विधी साहाय्यक वकील दिला जातो.',
      'महिला, बालके, अनुसूचित जाती/जमातीचे नागरिक, आणि अल्प उत्पन्न गटातील व्यक्तींसाठी सर्व न्यायालयीन शुल्क व वकील पूर्णपणे मोफत असतात.',
    ],
    legalRef: 'DLSA / Legal Services Act 1987',
    act: 'विधी सेवा प्राधिकरण कायदा, १९८७',
    icon: HeartHandshake,
    color: 'from-emerald-500/20 to-teal-600/10 text-teal-400 border-teal-500/30',
    quickAction: {
      label_en: 'Call Legal Aid (15100)',
      label_mr: 'विधी सेवा कॉल करा (१५१००)',
      link: 'tel:15100',
    },
  },
];

export const CitizenRightsPage: React.FC = () => {
  const { language } = useI18n();
  const { info } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>('zero_fir');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { data: rightBookmarks = [] } = useLiveData(
    () => listBookmarks('right'),
    ['bookmarks'],
    []
  );

  const bookmarkedRightSet = React.useMemo(() => {
    return new Set(rightBookmarks.map((b) => b.refId));
  }, [rightBookmarks]);

  const handleToggleRightBookmark = async (e: React.MouseEvent, rightId: string) => {
    e.stopPropagation();
    try {
      const added = await toggleBookmark('right', rightId);
      info(
        added
          ? (language === 'mr' ? 'हक्क बुकमार्कमध्ये जोडला' : 'Added to bookmarks')
          : (language === 'mr' ? 'हक्क बुकमार्कवरून काढला' : 'Removed from bookmarks')
      );
    } catch {
      // ignore
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const filteredRights = RIGHTS_LIST.filter((right) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      right.title_en.toLowerCase().includes(q) ||
      right.title_mr.toLowerCase().includes(q) ||
      right.summary_en.toLowerCase().includes(q) ||
      right.summary_mr.toLowerCase().includes(q) ||
      right.legalRef.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 gap-6 max-w-4xl mx-auto w-full pb-16">
      {/* Officer mode switch banner */}
      <OfficerSwitchBanner />

      {/* Main Header in simple, large text */}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-saffron/15 border border-saffron/30 flex items-center justify-center text-saffron">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-saffron">
              {language === 'mr' ? 'नागरिकांचे हक्क व संरक्षण' : 'Citizen Legal Protections'}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              {language === 'mr' ? 'आपले कायदेशीर हक्क जाणून घ्या' : 'Know Your Fundamental Legal Rights'}
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed mt-1">
          {language === 'mr'
            ? 'भारतीय नागरिक सुरक्षा संहिता (BNSS 2023) अंतर्गत सामान्य नागरिकांना मिळालेले महत्त्वाचे हक्क खालीलप्रमाणे आहेत.'
            : 'Essential statutory rights and safeguards guaranteed to every citizen under the Bharatiya Nagarik Suraksha Sanhita (BNSS 2023).'}
        </p>

        {/* Legal Disclaimer Chip */}
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs mt-1">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {language === 'mr'
              ? 'सामान्य माहिती, कायदेशीर सल्ला नाही. अधिकृत मसुदा आणि स्थानिक नियमांनुसार पडताळणी करा.'
              : 'General information, not legal advice. Verify with official statutes and legal advisers.'}
          </span>
        </div>
      </div>

      {/* Quick Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            language === 'mr'
              ? 'हक्क शोधा (उदा. झिरो एफआयआर, अटक, महिला...)'
              : 'Search rights (e.g., Zero FIR, Arrest, Women, Free copy...)'
          }
          className="w-full pl-10 pr-4 py-3 bg-navy-800 border border-navy-600 rounded-2xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-saffron transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded-md bg-navy-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-3 gap-2">
        <Link
          to="/citizen/steps"
          className="p-3 rounded-2xl bg-navy-800/90 border border-navy-600/80 hover:border-saffron/50 flex flex-col items-center text-center gap-1.5 transition-all group active:scale-95"
        >
          <div className="w-8 h-8 rounded-xl bg-saffron/15 text-saffron flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-white group-hover:text-saffron">
            {language === 'mr' ? 'काय करावे? (पायऱ्या)' : 'Action Steps'}
          </span>
        </Link>

        <Link
          to="/citizen/complaint"
          className="p-3 rounded-2xl bg-navy-800/90 border border-navy-600/80 hover:border-saffron/50 flex flex-col items-center text-center gap-1.5 transition-all group active:scale-95"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-white group-hover:text-saffron">
            {language === 'mr' ? 'तक्रार अर्ज तयार करा' : 'Draft Complaint'}
          </span>
        </Link>

        <Link
          to="/citizen/help"
          className="p-3 rounded-2xl bg-navy-800/90 border border-navy-600/80 hover:border-saffron/50 flex flex-col items-center text-center gap-1.5 transition-all group active:scale-95"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <Phone className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-white group-hover:text-saffron">
            {language === 'mr' ? 'आपत्कालीन हेल्पलाइन' : 'Helplines'}
          </span>
        </Link>
      </div>

      {/* Expandable Rights Cards */}
      <div className="flex flex-col gap-3 mt-1">
        {filteredRights.map((item) => {
          const isExpanded = expandedId === item.id;
          const IconComponent = item.icon;

          return (
            <div
              key={item.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isExpanded
                  ? 'bg-navy-800/95 border-saffron/40 shadow-xl'
                  : 'bg-navy-800/70 border-navy-600/70 hover:border-navy-500'
              }`}
            >
              {/* Card Header (Click to toggle) */}
              <button
                onClick={() => toggleExpand(item.id)}
                className="w-full p-4 flex items-start justify-between gap-3 text-left focus:outline-none"
                aria-expanded={isExpanded}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} border flex items-center justify-center shrink-0 mt-0.5`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="px-2 py-0.5 rounded-md bg-navy-900 border border-navy-600 text-[10px] font-mono font-bold text-saffron">
                        {item.legalRef}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white leading-snug">
                      {language === 'mr' ? item.title_mr : item.title_en}
                    </h3>
                    {language === 'mr' && (
                      <span className="text-xs text-slate-400 font-medium">
                        {item.title_en}
                      </span>
                    )}
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {language === 'mr' ? item.summary_mr : item.summary_en}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 mt-1">
                  {/* Star Bookmark button */}
                  <div
                    onClick={(e) => handleToggleRightBookmark(e, item.id)}
                    role="button"
                    tabIndex={0}
                    title={bookmarkedRightSet.has(item.id) ? 'Remove bookmark' : 'Bookmark right'}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                      bookmarkedRightSet.has(item.id)
                        ? 'bg-saffron/15 text-saffron border border-saffron/30'
                        : 'bg-navy-700/60 text-slate-400 hover:text-saffron hover:bg-navy-700'
                    }`}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        bookmarkedRightSet.has(item.id) ? 'fill-saffron text-saffron' : ''
                      }`}
                    />
                  </div>

                  <div className="w-8 h-8 rounded-full bg-navy-700/80 flex items-center justify-center text-slate-300">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-saffron" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-navy-700/80 bg-navy-900/40 flex flex-col gap-3 animate-in fade-in duration-150">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {language === 'mr' ? 'तपशीलवार कायदेशीर माहिती:' : 'Detailed Legal Provisions:'}
                    </span>
                    <ul className="space-y-2">
                      {(language === 'mr' ? item.details_mr : item.details_en).map(
                        (detail, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-slate-200 flex items-start gap-2 leading-relaxed bg-navy-800/60 p-2.5 rounded-xl border border-navy-700/60"
                          >
                            <span className="w-4 h-4 rounded-full bg-saffron/20 text-saffron text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span>{detail}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  {/* Act Reference Chip */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-slate-400 italic">
                      {item.act} ({item.legalRef})
                    </span>

                    {item.quickAction && (
                      item.quickAction.link.startsWith('tel:') ? (
                        <a
                          href={item.quickAction.link}
                          className="px-3 py-1.5 rounded-xl bg-saffron text-navy-950 text-xs font-bold flex items-center gap-1 shadow-md shadow-saffron/20 active:scale-95"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{language === 'mr' ? item.quickAction.label_mr : item.quickAction.label_en}</span>
                        </a>
                      ) : (
                        <Link
                          to={item.quickAction.link}
                          className="px-3 py-1.5 rounded-xl bg-saffron/15 border border-saffron/30 text-saffron text-xs font-bold flex items-center gap-1 hover:bg-saffron/25 active:scale-95"
                        >
                          <span>{language === 'mr' ? item.quickAction.label_mr : item.quickAction.label_en}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredRights.length === 0 && (
          <div className="p-8 text-center text-slate-400 bg-navy-800/50 rounded-2xl border border-navy-700">
            <p className="text-sm">
              {language === 'mr' ? 'कोणताही हक्क आढळला नाही.' : 'No matching rights found.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
