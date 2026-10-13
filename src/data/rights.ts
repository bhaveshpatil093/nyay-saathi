import { Offence } from './types.ts';
import { OFFENCES_DATA } from './offences.ts';

export interface CitizenRightItem {
  id: string;
  title_en: string;
  title_mr: string;
  summary_en: string;
  summary_mr: string;
  details_en: string[];
  details_mr: string[];
  legalRef: string;
  act: string;
  iconName?: string;
  route: string;
  tags: string[];
}

export const CITIZEN_RIGHTS_DATA: CitizenRightItem[] = [
  {
    id: 'zero_fir',
    title_en: 'Zero FIR (Any Police Station)',
    title_mr: 'झिरो एफआयआर (कोणत्याही पोलीस ठाण्यात)',
    summary_en:
      'You have the legal right to report a cognizable crime at ANY police station in India, regardless of where the incident occurred.',
    summary_mr:
      'गुन्हा कुठेही घडलेला असला, तरी भारतातील कोणत्याही पोलीस ठाण्यात तक्रार दाखल करण्याचा तुम्हाला कायदेशीर अधिकार आहे.',
    details_en: [
      'The police station cannot turn you away citing jurisdictional boundaries.',
      'They must register a Zero FIR immediately, initiate urgent steps (like medical help or crime scene protection), and subsequently transfer the case to the jurisdictional police station.',
      'Mandated under Section 173(1) of the Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023.',
    ],
    details_mr: [
      'आमच्या कार्यक्षेत्रात येत नाही असे कारण सांगून पोलीस तुमची तक्रार नाकारू शकत नाहीत.',
      'त्यांना ताबडतोब ‘झिरो एफआयआर’ नोंदवून प्राथमिक तपास (उदा. वैद्यकीय मदत, घटनास्थळ संरक्षण) करावाच लागतो आणि नंतर ते संबंधित ठाण्याकडे वर्ग करतात.',
      'भारतीय नागरिक सुरक्षा संहिता (BNSS) २०२३ च्या कलम १७३(१) अन्वये अनिवार्य.',
    ],
    legalRef: 'BNSS 173(1)',
    act: 'भारतीय नागरिक सुरक्षा संहिता, २०२३',
    route: '/citizen#zero_fir',
    tags: ['Zero FIR', 'FIR', 'Jurisdiction', 'Refusal', '173', 'झिरो एफआयआर', 'तक्रार'],
  },
  {
    id: 'e_fir',
    title_en: 'e-FIR (Electronic Information)',
    title_mr: 'ई-एफआयआर (इलेक्ट्रॉनिक तक्रार)',
    summary_en:
      'You can report an offence electronically via police portals or official channels. You must sign the physical copy within 3 days.',
    summary_mr:
      'तुम्ही ऑनलाइन किंवा इलेक्ट्रॉनिक माध्यमांतून तक्रार पाठवू शकता. तपास अधिकृतपणे सुरू होण्यासाठी ३ दिवसांच्या आत ठाण्यात जाऊन प्रत्यक्ष स्वाक्षरी करणे आवश्यक आहे.',
    details_en: [
      'Allows citizens to report crimes remotely without having to travel to the police station immediately.',
      'Under BNSS Section 173(1), electronic information is registered on record, but the informant must sign the report within three days before it is taken on formal record.',
      'Ideal for urgent initial reporting or cyber crime alerts.',
    ],
    details_mr: [
      'नागरिकांना पोलीस ठाण्यात त्वरित न जाता दूरस्थपणे गुन्ह्याची माहिती देण्याची सोय.',
      'BNSS कलम १७३(१) नुसार इलेक्ट्रॉनिक नोंद होते, मात्र ३ दिवसांत तक्रारदाराने ठाण्यात जाऊन स्वाक्षरी करणे कायदेशीररित्या आवश्यक आहे.',
      'तातडीच्या घटना किंवा सायबर तक्रारींसाठी उपयुक्त.',
    ],
    legalRef: 'BNSS 173(1)',
    act: 'भारतीय नागरिक सुरक्षा संहिता, २०२३',
    route: '/citizen#e_fir',
    tags: ['e-FIR', 'Online FIR', 'Electronic Complaint', '3 Days', 'ई-एफआयआर', 'स्वाक्षरी'],
  },
  {
    id: 'free_fir_copy',
    title_en: 'Right to Free Copy of FIR',
    title_mr: 'एफआयआरची मोफत प्रत मिळण्याचा अधिकार',
    summary_en:
      'Every informant or victim is legally entitled to receive an official copy of the registered FIR immediately and completely free of cost.',
    summary_mr:
      'नोंदवलेल्या एफआयआरची अधिकृत प्रत तक्रारदाराला ताबडतोब आणि पूर्णपणे विनामूल्य मिळण्याचा कायद्याने अधिकार आहे.',
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
    route: '/citizen#free_fir_copy',
    tags: ['Free FIR Copy', 'FIR Copy', 'No Charges', '173(2)', 'मोफत प्रत', 'पावती'],
  },
  {
    id: 'progress_90_days',
    title_en: '90-Day Investigation Progress Update',
    title_mr: '९० दिवसांच्या आत तपासाची प्रगती कळवणे',
    summary_en:
      'The police must inform the informant or victim about the progress of the investigation within 90 days.',
    summary_mr:
      'तपासाची सद्यस्थिती काय आहे हे पोलीस अधिकाऱ्याने तक्रारदार किंवा पीडित व्यक्तीला ९० दिवसांच्या आत कळवणे बंधनकारक आहे.',
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
    route: '/citizen#progress_90_days',
    tags: ['90 Days', 'Investigation Progress', 'Status Update', '193(3)', 'तपास प्रगती'],
  },
  {
    id: 'rights_on_arrest',
    title_en: 'Constitutional & Legal Rights on Arrest',
    title_mr: 'अटकेच्या वेळी मिळणारे घटनात्मक व कायदेशीर अधिकार',
    summary_en:
      'Fundamental safeguards to prevent illegal detention: right to know grounds, inform family, medical checkup, consult a lawyer, and Magistrate production within 24 hours.',
    summary_mr:
      'अटक करतानाचे मूलभूत संरक्षण: अटकाचे कारण जाणून घेणे, नातेवाईकांना कळवणे, वैद्यकीय तपासणी, वकिलाचा सल्ला आणि २४ तासांत न्यायालयात हजर करणे.',
    details_en: [
      'Grounds of Arrest: The officer must communicate full particulars of the offence and reasons for arrest (Article 22(1), BNSS 47).',
      'Right to Inform Nominated Person: Right to have a relative or friend informed of the arrest and detention location immediately (BNSS 48).',
      'Right to Medical Examination: Compulsory medical checkup by an authorized medical practitioner upon arrest (BNSS 53).',
      'Production within 24 Hours: Must be produced before the nearest Judicial Magistrate within 24 hours excluding travel time (Article 22(2), BNSS 58).',
      'Right to Legal Counsel: Entitled to consult and be defended by a legal practitioner of choice, or free legal aid if indigent (Article 22(1), BNSS 40).',
    ],
    details_mr: [
      'अटकेचे कारण: अटकेचे कारण आणि गुन्ह्याचे तपशील तात्काळ जाणून घेण्याचा अधिकार (अनुच्छेद २२(१), BNSS ४७).',
      'नातेवाईकास सूचना: अटक झाल्याचे आणि कोठे ठेवले आहे हे नातेवाईक वा मित्राला विनामूल्य कळवण्याचा अधिकार (BNSS ४८).',
      'वैद्यकीय तपासणी: अटकेनंतर तात्काळ शासकीय वैद्यकीय अधिकाऱ्याकडून तपासणी करून घेण्याचा हक्क (BNSS ५३).',
      '२४ तासांत न्यायालयात हजर: प्रवासाचा वेळ वगळता २४ तासांच्या आत जवळच्या दंडाधिकाऱ्यांसमोर हजर करणे बंधनकारक (अनुच्छेद २२(२), BNSS ५८).',
      'वकिलाचा सल्ला: पसंतीच्या वकिलाचा सल्ला घेण्याचा आणि असमर्थ असल्यास मोफत विधी सहाय्य मिळवण्याचा हक्क (अनुच्छेद २२(१), BNSS ४०).',
    ],
    legalRef: 'Article 22 & BNSS 47, 48, 53, 58',
    act: 'भारतीय संविधान व BNSS, २०२३',
    route: '/citizen#rights_on_arrest',
    tags: ['Arrest Rights', '24 Hours', 'Medical Exam', 'Nominated Person', 'Grounds of Arrest', 'वकील', 'अटक'],
  },
  {
    id: 'women_children_rights',
    title_en: 'Special Protections for Women and Children',
    title_mr: 'महिला आणि बालकांसाठी विशेष कायदेशीर संरक्षण',
    summary_en:
      'Statements of women victims must be recorded by a woman police officer; search of women by women officers only; no night arrest of women without special magistrate order.',
    summary_mr:
      'महिलांची जबानी महिला पोलीस अधिकाऱ्याने नोंदवणे; महिलांची अंगझडती फक्त महिला अंमलदाराने घेणे; सूर्यास्तानंतर व सूर्योदयापूर्वी विशेष परवानगीशिवाय महिलेस अटक नाही.',
    details_en: [
      'Woman Officer for Statements: Statements of victims of sexual offences recorded by a female police officer at the victim\'s residence or place of choice (BNSS 173(1) proviso, 176(1) proviso).',
      'Arrest Safeguards: No woman shall be arrested after sunset and before sunrise except in exceptional circumstances with prior Magistrate permission (BNSS 43(5)).',
      'Search of Women: Search of a female person must be strictly carried out by another female with strict regard to decency (BNSS 49(2), 103(2)).',
      'Child Witnesses: No male under 15 years or female shall be required to attend any place other than their residence for questioning (BNSS 179(1)).',
    ],
    details_mr: [
      'महिला अधिकाऱ्याकडून जबानी: लैंगिक गुन्ह्यातील महिलांची जबानी तिच्या घरी महिला अधिकाऱ्याकडूनच घेतली जाते (BNSS १७३(१) व १७६(१)).',
      'सूर्यास्तानंतर अटकेस बंदी: सूर्यास्तानंतर आणि सूर्योदयापूर्वी कोणत्याही महिलेला न्यायालयाच्या पूर्वपरवानगीशिवाय अटक करता येत नाही (BNSS ४३(५)).',
      'महिलांची अंगझडती: महिलेची झडती केवळ महिला अधिकाऱ्याकडूनच संपूर्ण शालीनतेने घेतली पाहिजे (BNSS ४९(२), १०३(२)).',
      '१५ वर्षांखालील बालके: १५ वर्षांखालील बालकांना किंवा महिलांना पोलीस ठाण्यात हजर राहण्यास भाग पाडता येत नाही; त्यांची चौकशी निवासस्थानी केली जाते (BNSS १७९(१)).',
    ],
    legalRef: 'BNSS 43(5), 49(2), 173(1), 179(1)',
    act: 'भारतीय नागरिक सुरक्षा संहिता, २०२३',
    route: '/citizen#women_children_rights',
    tags: ['Women Rights', 'Child Protection', 'Woman Officer', 'Night Arrest', 'महिला संरक्षण', 'बालक'],
  },
  {
    id: 'free_legal_aid',
    title_en: 'Free Legal Aid & Support Services',
    title_mr: 'मोफत विधी सहाय्य व कायदेशीर मदत (DLSA)',
    summary_en:
      'Free legal aid is guaranteed to disadvantaged persons, women, children, and custody detainees through District Legal Services Authorities (DLSA). National Helpline: 15100.',
    summary_mr:
      'आर्थिकदृष्ट्या दुर्बल व्यक्ती, महिला, बालके आणि अटकेत असलेल्या व्यक्तींना जिल्हा विधी सेवा प्राधिकरणाद्वारे (DLSA) मोफत वकील दिला जातो. राष्ट्रीय विधी सहाय्य हेल्पलाइन: १५१००.',
    details_en: [
      'Established under the Legal Services Authorities Act, 1987.',
      'Covers pre-arrest, arrest, remand, and trial representation.',
      'National Legal Aid Toll-Free Helpline: 15100 (available 24x7).',
      'You can apply directly at the court complex or through the investigating officer.',
    ],
    details_mr: [
      'विधी सेवा प्राधिकरण कायदा, १९८७ अन्वये मोफत वकील व कायदेशीर सल्ला उपलब्ध.',
      'अटकेपूर्वी, अटकेदरम्यान, रिमांड व खटल्यादरम्यान मोफत सहाय्य दिले जाते.',
      'राष्ट्रीय विधी सहाय्य मोफत दूरध्वनी क्रमांक: १५१०० (२४ तास सुरू).',
      'न्यायालय आवारातील DLSA कक्षात किंवा पोलिसांमार्फतही अर्ज करता येतो.',
    ],
    legalRef: 'LSA Act 1987 & BNSS 40',
    act: 'विधी सेवा प्राधिकरण कायदा, १९८७',
    route: '/citizen#free_legal_aid',
    tags: ['Legal Aid', '15100', 'DLSA', 'Free Lawyer', 'विधी सहाय्य', 'मोफत वकील'],
  },
];
