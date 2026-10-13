import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  FileText,
  AlertTriangle,
  ShieldAlert,
  Smartphone,
  Users,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Phone,
  Info,
  ExternalLink,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useI18n } from '../../i18n/index.ts';
import { OfficerSwitchBanner } from '../../components/citizen/OfficerSwitchBanner.tsx';

interface ScenarioStep {
  stepNo: number;
  title_en: string;
  title_mr: string;
  instruction_en: string;
  instruction_mr: string;
  legalRef?: string;
  actionButton?: {
    label_en: string;
    label_mr: string;
    link: string;
    isExternal?: boolean;
    isTel?: boolean;
  };
}

interface Scenario {
  id: string;
  icon: React.ElementType;
  color: string;
  badge_en: string;
  badge_mr: string;
  title_en: string;
  title_mr: string;
  description_en: string;
  description_mr: string;
  steps: ScenarioStep[];
}

const SCENARIOS: Scenario[] = [
  {
    id: 'report_crime',
    icon: FileText,
    color: 'from-blue-600/20 to-blue-700/10 text-blue-400 border-blue-500/30',
    badge_en: 'Standard Procedure',
    badge_mr: 'नेहमीची प्रक्रिया',
    title_en: 'Report a Crime (File Complaint / FIR)',
    title_mr: 'गुन्ह्याची तक्रार कशी करावी (FIR नोंदवणे)',
    description_en: 'Clear sequence on filing a report at a police station or electronically.',
    description_mr: 'पोलीस ठाण्यात जाऊन किंवा ऑनलाइन तक्रार दाखल करण्याची सोपी पद्धत.',
    steps: [
      {
        stepNo: 1,
        title_en: 'Visit the Police Station or Report Online',
        title_mr: 'पोलीस ठाण्यात जा किंवा ऑनलाइन तक्रार करा',
        instruction_en:
          'Go to the nearest police station (Zero FIR applies anywhere under BNSS 173(1)), or send an e-FIR via official portal / email.',
        instruction_mr:
          'कोणत्याही जवळच्या पोलीस ठाण्यात जा (गुन्हा कुठेही घडला तरी झिरो एफआयआर लागू होतो - BNSS 173(1)), किंवा ई-एफआयआर पाठवा.',
        legalRef: 'BNSS 173(1)',
        actionButton: {
          label_en: 'Draft Application Online',
          label_mr: 'तक्रार अर्ज तयार करा',
          link: '/citizen/complaint',
        },
      },
      {
        stepNo: 2,
        title_en: 'State All Facts Accurately & Clearly',
        title_mr: 'घटनाक्रम आणि सर्व माहिती स्पष्ट सांगा',
        instruction_en:
          'Provide the date, exact time, location, suspect details if known, witness names, and clear chronological description of the event.',
        instruction_mr:
          'घटनेची तारीख, वेळ, ठिकाण, संशयित व्यक्ती, साक्षीदार आणि काय घडले याचा सविस्तर तपशील तोंडी किंवा लेखी स्वरूपात द्या.',
      },
      {
        stepNo: 3,
        title_en: 'Verify the Written Text Before Signing',
        title_mr: 'स्वाक्षरी करण्यापूर्वी लिहिलेला मजकूर तपासा',
        instruction_en:
          'The police officer will reduce your oral information to writing and read it back to you. Verify that every fact is correct, then sign.',
        instruction_mr:
          'पोलीस अधिकारी तुमची माहिती लिहून घेतील आणि ती तुम्हाला वाचून दाखवतील. सर्व माहिती बरोबर असल्याची खात्री झाल्यावरच सही करा.',
        legalRef: 'BNSS 173(1)',
      },
      {
        stepNo: 4,
        title_en: 'Collect Free Copy of FIR Immediately',
        title_mr: 'एफआयआरची मोफत प्रत ताबडतोब घ्या',
        instruction_en:
          'You are legally entitled to receive an immediate copy of the registered FIR without paying any fee.',
        instruction_mr:
          'कोणतेही शुल्क न देता एफआयआरची एक प्रत तात्काळ मिळवणे हा तुमचा कायदेशीर अधिकार आहे.',
        legalRef: 'BNSS 173(2)',
      },
    ],
  },
  {
    id: 'station_refused',
    icon: AlertTriangle,
    color: 'from-amber-600/20 to-amber-700/10 text-amber-400 border-amber-500/30',
    badge_en: 'Legal Remedy',
    badge_mr: 'कायदेशीर उपाय',
    title_en: 'The Station Refused My Complaint',
    title_mr: 'पोलीस ठाण्याने तक्रार घेण्यास नकार दिला',
    description_en: 'Statutory recourse if a police station refuses to register your cognizable complaint.',
    description_mr: 'ठाण्याने तक्रार नोंदवण्यास नकार दिल्यास पोलीस अधीक्षक व न्यायालयाकडे जाण्याचा मार्ग.',
    steps: [
      {
        stepNo: 1,
        title_en: 'Put Complaint in Writing with All Proofs',
        title_mr: 'तक्रार लेखी स्वरूपात पुरावे जोडून तयार करा',
        instruction_en:
          'Write your complete complaint clearly, mentioning that the local police station refused to accept it, and attach any receipts or proofs.',
        instruction_mr:
          'संपूर्ण तक्रार सविस्तर लिहा, स्थानिक ठाण्याने नकार दिल्याची नोंद करा आणि उपलब्ध पुरावे जोडा.',
        actionButton: {
          label_en: 'Write Complaint Draft',
          label_mr: 'तक्रार अर्ज तयार करा',
          link: '/citizen/complaint',
        },
      },
      {
        stepNo: 2,
        title_en: 'Send to Superintendent of Police (SP / DCP)',
        title_mr: 'पोलीस अधीक्षक (SP) किंवा DCP कडे अर्ज पाठवा',
        instruction_en:
          'Send the written complaint to the Superintendent of Police by registered post or deliver in person, and keep the postal receipt or stamped acknowledgement as proof.',
        instruction_mr:
          'तक्रार अर्ज नोंदणीकृत टपालाने (Registered Post) किंवा प्रत्यक्ष जाऊन पोलीस अधीक्षकांकडे (SP/DCP) सादर करा आणि पावती सांभाळून ठेवा.',
        legalRef: 'BNSS 173(4)',
      },
      {
        stepNo: 3,
        title_en: 'SP Investigates or Directs Subordinate',
        title_mr: 'पोलीस अधीक्षक तपास करतील किंवा आदेश देतील',
        instruction_en:
          'If satisfied that a cognizable offence is disclosed, the SP will either investigate the case or direct a subordinate police officer to investigate.',
        instruction_mr:
          'दखलपात्र गुन्हा असल्याचे पटल्यास पोलीस अधीक्षक स्वतः तपास करतील किंवा कनिष्ठ अधिकाऱ्याला तपास करण्याचे आदेश देतील.',
        legalRef: 'BNSS 173(4)',
      },
      {
        stepNo: 4,
        title_en: 'If Still No Action: Approach Judicial Magistrate',
        title_mr: 'तरीही कारवाई न झाल्यास न्यायदंडाधिकाऱ्यांकडे जा',
        instruction_en:
          'If no action is taken by the police hierarchy, you can make an application to the Judicial Magistrate under BNSS 175(3) with an affidavit.',
        instruction_mr:
          'पोलीस प्रशासनाने दखल न घेतल्यास BNSS कलम १७५(३) अंतर्गत प्रतिज्ञापत्रासह न्यायदंडाधिकाऱ्यांकडे अर्ज करू शकता. दंडाधिकारी तपास करण्याचे आदेश देऊ शकतात.',
        legalRef: 'BNSS 175(3)',
      },
    ],
  },
  {
    id: 'cyber_fraud',
    icon: Smartphone,
    color: 'from-rose-600/20 to-rose-700/10 text-rose-400 border-rose-500/30',
    badge_en: 'Urgent Action (Golden Hour)',
    badge_mr: 'तातडीची कारवाई (गोल्डन अवर)',
    title_en: 'Online / Cyber Fraud Happened',
    title_mr: 'ऑनलाइन आर्थिक किंवा सायबर फसवणूक झाली',
    description_en: 'Time-critical steps within the first 1-2 hours to freeze money and register cybercrime.',
    description_mr: 'पैसे वाचवण्यासाठी आणि गुन्हा नोंदवण्यासाठी पहिल्या १-२ तासांत करावयाची कृती.',
    steps: [
      {
        stepNo: 1,
        title_en: 'Call Cybercrime Helpline 1930 Immediately',
        title_mr: 'तातडीने सायबर हेल्पलाइन १९३० वर कॉल करा',
        instruction_en:
          'Dial 1930 without delay. The Citizen Financial Cyber Fraud Reporting System will alert the recipient bank/wallet to freeze stolen funds in transit.',
        instruction_mr:
          'विलंब न करता १९३० वर कॉल करा. पैसे ज्या बँकेत किंवा वॉलेटमध्ये गेले आहेत ते गोठवण्यासाठी ही यंत्रणा बँकांना अलर्ट पाठवते.',
        legalRef: 'MHA Cybercrime Helpline',
        actionButton: {
          label_en: 'Call 1930 Now',
          label_mr: 'आत्ताच १९३० कॉल करा',
          link: 'tel:1930',
          isTel: true,
        },
      },
      {
        stepNo: 2,
        title_en: 'Notify Your Bank to Block Accounts / Cards',
        title_mr: 'तुमच्या बँकेला कळवून कार्ड व खाती तात्काळ ब्लॉक करा',
        instruction_en:
          'Call your bank’s 24x7 customer helpline to freeze net banking, UPI, and block compromised debit/credit cards immediately.',
        instruction_mr:
          'बँकेच्या २४ तास हेल्पलाइनवर फोन करून यूपीआय, नेट बँकिंग आणि संबंधित डेबिट/क्रेडिट कार्ड तात्काळ ब्लॉक करा.',
      },
      {
        stepNo: 3,
        title_en: 'Report on Official Portal cybercrime.gov.in',
        title_mr: 'cybercrime.gov.in वर तक्रार नोंदवा',
        instruction_en:
          'Register full complaint with transaction reference numbers (UTR), bank statement, and evidence screenshots on the national cyber portal.',
        instruction_mr:
          'नॅशनल सायबर क्राइम पोर्टलवर (cybercrime.gov.in) बँक स्टेटमेंट, यूटीआर क्रमांक आणि पुराव्यांसह अधिकृत तक्रार नोंदवा.',
        actionButton: {
          label_en: 'Open cybercrime.gov.in',
          label_mr: 'सायबर पोर्टल उघडा',
          link: 'https://cybercrime.gov.in',
          isExternal: true,
        },
      },
      {
        stepNo: 4,
        title_en: 'Preserve All Digital Evidence Strictly',
        title_mr: 'सर्व डिजिटल पुरावे आणि स्क्रीनशॉट जतन करा',
        instruction_en:
          'Take screenshots of fraudulent messages, UPI IDs, bank debit SMS, phone call logs, and WhatsApp chats. Do not delete messages or format phone.',
        instruction_mr:
          'फसव्या मेसेजचे स्क्रीनशॉट, यूपीआय आयडी, बँक एसएमएस, फोन नंबर आणि व्हॉट्सअॅप चॅट्स सेव्ह करा. मेसेज डिलीट करू नका.',
      },
    ],
  },
  {
    id: 'arrested_family',
    icon: Users,
    color: 'from-purple-600/20 to-purple-700/10 text-purple-400 border-purple-500/30',
    badge_en: 'Arrest Safeguards',
    badge_mr: 'अटकेचे कायदेशीर अधिकार',
    title_en: 'My Family Member Was Arrested',
    title_mr: 'माझ्या कुटुंबातील सदस्याला अटक झाली आहे',
    description_en: 'Key constitutional and statutory protections to ensure safety and fair procedure.',
    description_mr: 'अटक झालेल्या व्यक्तीच्या संरक्षणासाठी आणि योग्य प्रक्रियेसाठी करावयाची कृती.',
    steps: [
      {
        stepNo: 1,
        title_en: 'Inquire About Specific Grounds of Arrest',
        title_mr: 'अटकेचे नेमके कारण आणि कलमे विचारा',
        instruction_en:
          'The police must disclose the offences, section numbers, and specific allegations under BNSS 47.',
        instruction_mr:
          'पोलीस अधिकाऱ्याने अटकेचे नेमके कारण आणि लागू केलेली कलमे स्पष्ट सांगणे बंधनकारक आहे (BNSS 47).',
        legalRef: 'BNSS 47',
      },
      {
        stepNo: 2,
        title_en: 'Verify Arrest Memo & Nominated Person Intimation',
        title_mr: 'अटक पंचनामा आणि नातेवाईकांना माहिती दिली का तपासा',
        instruction_en:
          'Ensure the Arrest Memo is witnessed by at least one independent family member or respectable local witness, and intimation is recorded under BNSS 48.',
        instruction_mr:
          'अटक पंचनाम्यावर (Arrest Memo) साक्षीदाराची सही आणि नातेवाईकाला कळवल्याची अधिकृत नोंद असल्याची खात्री करा (BNSS 48).',
        legalRef: 'BNSS 36, 48',
      },
      {
        stepNo: 3,
        title_en: 'Request Immediate Medical Examination',
        title_mr: 'शासकीय वैद्यकीय तपासणीची मागणी करा',
        instruction_en:
          'Medical examination is statutory upon arrest under BNSS 53 to document any pre-existing health status or physical marks.',
        instruction_mr:
          'अटकेच्या वेळी शासकीय वैद्यकीय अधिकाऱ्याकडून संपूर्ण आरोग्य तपासणी करून घेणे हा कायदेशीर अधिकार आहे (BNSS 53).',
        legalRef: 'BNSS 53',
      },
      {
        stepNo: 4,
        title_en: 'Production Before Magistrate Within 24 Hours',
        title_mr: '२४ तासांच्या आत दंडाधिकाऱ्यांसमोर हजर करणे बंधनकारक',
        instruction_en:
          'The police cannot detain anyone beyond 24 hours without an order of a Judicial Magistrate (Article 22 & BNSS 58).',
        instruction_mr:
          'प्रवासाचा वेळ वगळता २४ तासांपेक्षा जास्त काळ पोलिसांना कोणालाही कोठडीत ठेवता येत नाही; दंडाधिकाऱ्यांसमोर हजर केलेच पाहिजे.',
        legalRef: 'Art 22 Const., BNSS 58',
      },
      {
        stepNo: 5,
        title_en: 'Engage Advocate or Seek Free Legal Aid (15100)',
        title_mr: 'वकील नेमा किंवा मोफत विधी मदत (१५१००) घ्या',
        instruction_en:
          'If unable to afford a lawyer, demand a free legal defense counsel from the Legal Services Authority before the court.',
        instruction_mr:
          'खाजगी वकील परवडत नसल्यास न्यायालयासमोर विधी सेवा प्राधिकरणातर्फे (DLSA) मोफत सरकारी वकिलाची मागणी करा.',
        actionButton: {
          label_en: 'Call Legal Aid 15100',
          label_mr: 'विधी मदत १५१०० कॉल करा',
          link: 'tel:15100',
          isTel: true,
        },
      },
    ],
  },
  {
    id: 'being_threatened',
    icon: ShieldAlert,
    color: 'from-red-600/20 to-red-700/10 text-red-400 border-red-500/30',
    badge_en: 'Emergency & Safety',
    badge_mr: 'आपत्कालीन सुरक्षा',
    title_en: 'I Am Being Threatened / In Danger',
    title_mr: 'मला धमकावले जात आहे / जीवितास धोका आहे',
    description_en: 'Immediate safety measures and police intervention steps for personal security.',
    description_mr: 'तातडीची सुरक्षा, पुरावे जतन करणे आणि पोलीस संरक्षणासाठी पावले.',
    steps: [
      {
        stepNo: 1,
        title_en: 'Dial Emergency Police 112 Immediately',
        title_mr: 'तातडीने ११२ नंबर डायल करा',
        instruction_en:
          'If in immediate physical danger, call 112 immediately. State your live location clearly to the dispatch operator.',
        instruction_mr:
          'तात्काळ धोका असल्यास विलंब न करता ११२ वर फोन करा आणि तुमचे नेमके ठिकाण सांगा.',
        actionButton: {
          label_en: 'Call 112 Emergency',
          label_mr: '११२ तात्काळ कॉल करा',
          link: 'tel:112',
          isTel: true,
        },
      },
      {
        stepNo: 2,
        title_en: 'Preserve Threat Audio, Messages & Video',
        title_mr: 'धमकीचे ऑडिओ, मेसेज व स्क्रीनशॉट सुरक्षित ठेवा',
        instruction_en:
          'Do not delete threatening call recordings, voice notes, SMS, or social media chats. Share backup copies with a trusted family member.',
        instruction_mr:
          'धमकीचे कॉल रेकॉर्डिंग, व्हॉट्सअॅप मेसेज, चॅट डिलीट करू नका. त्याचे बॅकअप आणि स्क्रीनशॉट विश्वासू नातेवाईकाकडे पाठवून ठेवा.',
      },
      {
        stepNo: 3,
        title_en: 'File Written Complaint for FIR & Protection',
        title_mr: 'एफआयआर व संरक्षणासाठी लेखी अर्ज द्या',
        instruction_en:
          'Submit a formal written application detailing the nature of the threat, the persons threatening, and request an FIR and police protection.',
        instruction_mr:
          'धमकी देणाऱ्यांची नावे, वेळ आणि प्रकार नमूद करून तातडीने एफआयआर नोंदवण्यासाठी व संरक्षणासाठी लेखी तक्रार दाखल करा.',
        actionButton: {
          label_en: 'Draft Police Application',
          label_mr: 'तक्रार अर्ज तयार करा',
          link: '/citizen/complaint',
        },
      },
    ],
  },
  {
    id: 'case_update',
    icon: Clock,
    color: 'from-teal-600/20 to-teal-700/10 text-teal-400 border-teal-500/30',
    badge_en: 'Tracking & Status',
    badge_mr: 'तपासाची माहिती',
    title_en: 'I Want a Case / Investigation Update',
    title_mr: 'मला तपासाची प्रगती जाणून घ्यायची आहे',
    description_en: 'How to exercise your 90-day statutory right to know investigation progress.',
    description_mr: '९० दिवसांत तपासाची माहिती मिळवण्याच्या कायदेशीर अधिकाराचा वापर कसा करावा.',
    steps: [
      {
        stepNo: 1,
        title_en: 'Note Your FIR / Crime Register (CR) Number',
        title_mr: 'तुमचा एफआयआर किंवा गुन्हा नोंद (CR) क्रमांक शोधा',
        instruction_en:
          'Keep your FIR copy, station name, year, and Investigating Officer (IO) contact handy.',
        instruction_mr:
          'तुमची एफआयआर प्रत, पोलीस ठाण्याचे नाव, वर्ष आणि तपास अधिकाऱ्याचे (IO) नाव सोबत ठेवा.',
      },
      {
        stepNo: 2,
        title_en: 'Statutory 90-Day Progress Update Right',
        title_mr: '९० दिवसांत तपासाची माहिती मिळवण्याचा अधिकार',
        instruction_en:
          'Under BNSS 193(3), the police officer must inform the informant/victim of progress within 90 days.',
        instruction_mr:
          'भारतीय नागरिक सुरक्षा संहिता कलम १९३(३) नुसार तपास अधिकाऱ्याने ९० दिवसांच्या आत तक्रारदारास तपासाची प्रगती कळवणे अनिवार्य आहे.',
        legalRef: 'BNSS 193(3)',
      },
      {
        stepNo: 3,
        title_en: 'Submit Written Status Request to SHO',
        title_mr: 'ठाणे अंमलदार (SHO) यांना लेखी विनंती अर्ज द्या',
        instruction_en:
          'If no update is received, submit a written letter referencing BNSS 193(3) to the Station House Officer asking for formal progress intimation.',
        instruction_mr:
          'माहिती न मिळाल्यास BNSS कलम १९३(३) चा संदर्भ देऊन पोलीस ठाणे प्रमुखांना तपासाच्या सद्यस्थितीची माहिती देणारा लेखी अर्ज सादर करा.',
        actionButton: {
          label_en: 'Draft Status Request',
          label_mr: 'अर्जाचा मसुदा तयार करा',
          link: '/citizen/complaint',
        },
      },
    ],
  },
];

export const CitizenStepsPage: React.FC = () => {
  const { language } = useI18n();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  const activeScenario = SCENARIOS.find((s) => s.id === selectedScenarioId);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 gap-6 max-w-4xl mx-auto w-full pb-16">
      {/* Officer mode switch banner */}
      <OfficerSwitchBanner />

      {/* Main Guided Header */}
      {!activeScenario ? (
        <>
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-saffron">
              {language === 'mr' ? 'मार्गदर्शक प्रवाह' : 'Guided Action Flow'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              {language === 'mr' ? 'तुम्हाला काय करायचे आहे?' : 'What do you want to do?'}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              {language === 'mr'
                ? 'तुमच्या परिस्थितीनुसार खालील पर्यायावर टॅप करा आणि कायदेशीर पायऱ्या जाणून घ्या.'
                : 'Select your situation below to get clear, step-by-step instructions on what to do.'}
            </p>

            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs mt-1">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {language === 'mr'
                  ? 'सामान्य माहिती, कायदेशीर सल्ला नाही. अधिकृत मसुदा तपासा.'
                  : 'General information, not legal advice. Verify with official legal text before use.'}
              </span>
            </div>
          </div>

          {/* Big touch-friendly scenario buttons */}
          <div className="flex flex-col gap-3 mt-1">
            {SCENARIOS.map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedScenarioId(item.id)}
                  className="w-full p-4 rounded-2xl bg-navy-800/85 hover:bg-navy-700 border border-navy-600/80 hover:border-saffron/50 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.98] shadow-md group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} border flex items-center justify-center shrink-0 shadow-xs`}
                    >
                      <IconComp className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-navy-900 border border-navy-700 text-saffron">
                          {language === 'mr' ? item.badge_mr : item.badge_en}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white group-hover:text-saffron transition-colors leading-snug">
                        {language === 'mr' ? item.title_mr : item.title_en}
                      </h3>
                      {language === 'mr' && (
                        <span className="text-xs text-slate-400 font-medium">
                          {item.title_en}
                        </span>
                      )}
                      <p className="text-xs text-slate-300 mt-1 line-clamp-1">
                        {language === 'mr' ? item.description_mr : item.description_en}
                      </p>
                    </div>
                  </div>

                  <div className="w-9 h-9 rounded-xl bg-navy-900 border border-navy-700 flex items-center justify-center text-slate-400 group-hover:text-saffron group-hover:border-saffron/40 shrink-0 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        /* Detailed Scenario View */
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          {/* Back button */}
          <button
            onClick={() => setSelectedScenarioId(null)}
            className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-800 border border-navy-600 text-xs font-bold text-slate-300 hover:text-white transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'mr' ? 'सर्व पर्याय पहा' : 'Back to All Scenarios'}</span>
          </button>

          {/* Scenario Header */}
          <div className="p-4 rounded-2xl bg-navy-800 border border-navy-600 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${activeScenario.color} border flex items-center justify-center shrink-0`}
              >
                <activeScenario.icon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-navy-900 text-saffron border border-navy-700">
                  {language === 'mr' ? activeScenario.badge_mr : activeScenario.badge_en}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white mt-1 leading-snug">
                  {language === 'mr' ? activeScenario.title_mr : activeScenario.title_en}
                </h2>
                {language === 'mr' && (
                  <span className="text-xs text-slate-400 font-medium">
                    {activeScenario.title_en}
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {language === 'mr' ? activeScenario.description_mr : activeScenario.description_en}
            </p>
          </div>

          {/* Numbered Steps List */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              {language === 'mr' ? 'करावयाची कृती व पायऱ्या:' : 'Numbered Step-by-Step Actions:'}
            </span>

            {activeScenario.steps.map((step) => (
              <div
                key={step.stepNo}
                className="p-4 rounded-2xl bg-navy-800/90 border border-navy-600/80 flex flex-col gap-2.5 shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-saffron text-navy-950 font-black text-sm flex items-center justify-center shrink-0 shadow-sm shadow-saffron/30">
                    {step.stepNo}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-white">
                        {language === 'mr' ? step.title_mr : step.title_en}
                      </h4>
                      {step.legalRef && (
                        <span className="text-[10px] font-mono font-bold text-saffron bg-navy-900 px-2 py-0.5 rounded border border-navy-700">
                          {step.legalRef}
                        </span>
                      )}
                    </div>
                    {language === 'mr' && (
                      <span className="text-xs text-slate-400">
                        {step.title_en}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed pl-11">
                  {language === 'mr' ? step.instruction_mr : step.instruction_en}
                </p>

                {step.actionButton && (
                  <div className="pl-11 pt-1">
                    {step.actionButton.isTel ? (
                      <a
                        href={step.actionButton.link}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 active:scale-95"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{language === 'mr' ? step.actionButton.label_mr : step.actionButton.label_en}</span>
                      </a>
                    ) : step.actionButton.isExternal ? (
                      <a
                        href={step.actionButton.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-700 hover:bg-navy-600 border border-navy-600 text-saffron font-bold text-xs active:scale-95"
                      >
                        <span>{language === 'mr' ? step.actionButton.label_mr : step.actionButton.label_en}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <Link
                        to={step.actionButton.link}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-saffron hover:bg-saffron-600 text-navy-950 font-bold text-xs shadow-md shadow-saffron/20 active:scale-95"
                      >
                        <span>{language === 'mr' ? step.actionButton.label_mr : step.actionButton.label_en}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Bottom Actions */}
          <div className="p-4 rounded-2xl bg-navy-900 border border-navy-700 flex items-center justify-between gap-3 mt-1">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">
                {language === 'mr' ? 'लेखी अर्ज तयार करायचा आहे?' : 'Need to draft a complaint letter?'}
              </span>
              <span className="text-[11px] text-slate-400">
                {language === 'mr' ? 'ठाणे प्रमुखांसाठी अधिकृत अर्ज तयार करा' : 'Generate printable application for the SHO'}
              </span>
            </div>
            <Link
              to="/citizen/complaint"
              className="px-3.5 py-2 rounded-xl bg-saffron text-navy-950 font-bold text-xs flex items-center gap-1 shrink-0 active:scale-95"
            >
              <span>{language === 'mr' ? 'अर्ज लिहा' : 'Draft Now'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
