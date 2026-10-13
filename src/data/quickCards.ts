export interface QuickCardPoint {
  num: number;
  text_en: string;
  text_mr: string;
  legalChip: string;
  act: string;
}

export interface QuickCardItem {
  id: string;
  title_en: string;
  title_mr: string;
  subtitle_en: string;
  subtitle_mr: string;
  situation: string;
  badge_en: string;
  badge_mr: string;
  color: string;
  points: QuickCardPoint[];
  statutoryWarning_en: string;
  statutoryWarning_mr: string;
}

export const CONSTABLE_QUICK_CARDS: QuickCardItem[] = [
  // Card 1: Registering an FIR
  {
    id: 'fir_registration',
    situation: 'Registering an FIR',
    title_en: 'Registering an FIR (प्रथम खबर अहवाल)',
    title_mr: 'प्रथम खबर अहवाल (FIR) नोंदणी प्रक्रिया',
    subtitle_en: 'Mandatory standard operating procedure for Station Duty Officer / Constable',
    subtitle_mr: 'ठाणे अंमलदार / कॉन्स्टेबल यांच्यासाठी अनिवार्य वैधानिक कार्यपद्धती',
    badge_en: 'Station Duty Protocol',
    badge_mr: 'ठाणे अंमलदार कार्यपद्धती',
    color: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
    statutoryWarning_en: 'Refusal to register cognizable crime FIR is a penal offence under BNS 199 / BNSS 173.',
    statutoryWarning_mr: 'दखलपात्र गुन्ह्याचा एफआयआर नोंदवण्यास नकार देणे हा बीएनएस १९९ / बीएनएसएस १७३ अन्वये दंडनिय गुन्हा आहे.',
    points: [
      {
        num: 1,
        text_en: 'Enter information of every cognizable offence in the station register without delay. If incident is outside station jurisdiction, register Zero FIR and begin immediate urgent steps before transfer.',
        text_mr: 'दखलपात्र गुन्ह्याची माहिती ठाणे दैनंदिनीत विनाविलंब नोंदवा. घटना कार्यक्षेत्राबाहेरील असल्यास ‘झिरो एफआयआर’ नोंदवून तातडीची कार्यवाही सुरू करा व नंतर वर्ग करा.',
        legalChip: 'BNSS 173(1)',
        act: 'BNSS 2023',
      },
      {
        num: 2,
        text_en: 'Hand over one copy of the registered FIR to the informant forthwith, completely free of charge. Obtain signed acknowledgement on station copy.',
        text_mr: 'नोंदवलेल्या एफआयआरची एक प्रत तक्रारदारास तात्काळ विनामूल्य द्या आणि स्टेशन कॉपीवर स्वाक्षरीयुक्त पोच घ्या.',
        legalChip: 'BNSS 173(2)',
        act: 'BNSS 2023',
      },
      {
        num: 3,
        text_en: 'If complaint is received electronically (e-FIR), enter it in the register; informant must sign physical copy within 3 days before full investigation proceeds.',
        text_mr: 'तक्रार इलेक्ट्रॉनिक माध्यमातून (ई-एफआयआर) आल्यास नोंद करा; तपास पुढे नेण्यासाठी तक्रारदाराने ३ दिवसांत प्रत्यक्ष स्वाक्षरी करणे आवश्यक आहे.',
        legalChip: 'BNSS 173(1) proviso',
        act: 'BNSS 2023',
      },
      {
        num: 4,
        text_en: 'If the victim is a woman reporting sexual offences, statement MUST be recorded by a woman police officer at the residence or place of her convenience.',
        text_mr: 'लैंगिक गुन्ह्यातील पीडित महिला असल्यास, तिची जबानी अनिवार्यपणे महिला पोलीस अधिकाऱ्याने तिच्या घरी किंवा तिच्या सोयीच्या ठिकाणीच नोंदवली पाहिजे.',
        legalChip: 'BNSS 173(1) proviso',
        act: 'BNSS 2023',
      },
      {
        num: 5,
        text_en: 'In offences punishable from 3 to 7 years, conduct a preliminary inquiry within 14 days with permission of Deputy SP / ACP before registering FIR if facts warrant.',
        text_mr: '३ ते ७ वर्षांच्या शिक्षेच्या गुन्ह्यांमध्ये प्राथमिक चौकशी करावयाची असल्यास उपअधीक्षक/एसीपी यांच्या पूर्वपरवानगीने १४ दिवसांच्या आत पूर्ण करा.',
        legalChip: 'BNSS 173(3)',
        act: 'BNSS 2023',
      },
      {
        num: 6,
        text_en: 'Dispatch signed FIR copy forthwith to the jurisdictional Judicial Magistrate First Class (JMFC).',
        text_mr: 'स्वाक्षरी केलेल्या एफआयआरची प्रत तात्काळ संबंधित प्रथम वर्ग न्यायदंडाधिकाऱ्यांना (JMFC) रवाना करा.',
        legalChip: 'BNSS 176(1)',
        act: 'BNSS 2023',
      },
    ],
  },

  // Card 2: Making an Arrest
  {
    id: 'making_arrest',
    situation: 'Making an Arrest',
    title_en: 'Making an Arrest (अटक प्रक्रिया व नियम)',
    title_mr: 'कायदेशीर अटक प्रक्रिया व डी.के. बसू मार्गदर्शक तत्त्वे',
    subtitle_en: 'Statutory safeguards and constitutional guidelines to prevent illegal detention',
    subtitle_mr: 'बेकायदेशीर कोठडी टाळण्यासाठी वैधानिक संरक्षण आणि घटनात्मक नियम',
    badge_en: 'DK Basu & BNSS Mandate',
    badge_mr: 'डी.के. बसू व BNSS नियम',
    color: 'border-red-500/40 bg-red-500/10 text-red-400',
    statutoryWarning_en: 'Failure to prepare arrest memo or inform relative invites departmental and contempt action.',
    statutoryWarning_mr: 'अटक पंचनामा न करणे किंवा नातेवाईकास न कळवणे हे न्यायालयीन अवमान व खातेनिहाय कारवाईस पात्र आहे.',
    points: [
      {
        num: 1,
        text_en: 'For offences punishable with imprisonment below 7 years, arrest is NOT automatic. Issue Notice of Appearance under BNSS 35(3) first unless written reasons for arrest exist.',
        text_mr: '७ वर्षांपेक्षा कमी शिक्षा असलेल्या गुन्ह्यांत थेट अटक करू नका. लिखित कारणे असल्याखेरीज प्रथम BNSS ३५(३) अन्वये हजेरीची नोटीस बजावा.',
        legalChip: 'BNSS 35(3)',
        act: 'BNSS 2023',
      },
      {
        num: 2,
        text_en: 'Communicate full grounds of arrest immediately to the arrested person and state whether the offence is bailable.',
        text_mr: 'अटक केलेल्या व्यक्तीला अटकेची सर्व कारणे आणि गुन्हा जामीनपात्र आहे की नाही हे तात्काळ स्पष्टपणे सांगा.',
        legalChip: 'BNSS 47',
        act: 'BNSS 2023',
      },
      {
        num: 3,
        text_en: 'Prepare an Arrest Memo on the spot: record date, exact time, place, noted injuries, and get signed by at least one respectable witness and the arrested person.',
        text_mr: 'घटनास्थळीच अटक पंचनामा (Arrest Memo) तयार करा: तारीख, वेळ, जागा, अंगावरील जखमा नोंदवून किमान एका प्रतिष्ठित साक्षीदाराची व आरोपीची स्वाक्षरी घ्या.',
        legalChip: 'BNSS 36',
        act: 'BNSS 2023',
      },
      {
        num: 4,
        text_en: 'Inform a nominated family member, relative, or friend immediately about the arrest and exact place of custody. Record their name and phone in station diary.',
        text_mr: 'आरोपीने नामनिर्देशित केलेल्या नातेवाईकाला किंवा मित्राला अटक झाल्याची व ठाण्याची जागा ताबडतोब कळवा आणि दैनंदिनीत नोंद करा.',
        legalChip: 'BNSS 48',
        act: 'BNSS 2023',
      },
      {
        num: 5,
        text_en: 'Conduct medical examination of the arrested person immediately by a registered medical practitioner and obtain medical report copy.',
        text_mr: 'अटक केलेल्या व्यक्तीची नोंदणीकृत वैद्यकीय अधिकाऱ्याकडून तात्काळ वैद्यकीय तपासणी करून घ्या व अहवाल सोबत ठेवा.',
        legalChip: 'BNSS 53',
        act: 'BNSS 2023',
      },
      {
        num: 6,
        text_en: 'Produce the arrested person before the nearest Judicial Magistrate within 24 hours of arrest, strictly excluding journey time.',
        text_mr: 'प्रवासाचा वेळ वगळता अटकेच्या २४ तासांच्या आत आरोपीला जवळच्या न्यायदंडाधिकाऱ्यांसमोर हजर करा.',
        legalChip: 'BNSS 58 / Art 22(2)',
        act: 'BNSS 2023',
      },
      {
        num: 7,
        text_en: 'No woman shall be arrested after sunset and before sunrise except in exceptional situations with prior written permission of Judicial Magistrate.',
        text_mr: 'सूर्यास्तानंतर आणि सूर्योदयापूर्वी कोणत्याही महिलेला दंडाधिकाऱ्यांच्या पूर्वपरवानगीशिवाय अटक करता येणार नाही.',
        legalChip: 'BNSS 43(5)',
        act: 'BNSS 2023',
      },
    ],
  },

  // Card 3: Search and Seizure
  {
    id: 'search_seizure',
    situation: 'Search and Seizure',
    title_en: 'Search and Seizure Protocol (झडती व जप्ती)',
    title_mr: 'झडती व जप्ती कार्यपद्धती (ऑडिओ-व्हिडिओ चित्रीकरण)',
    subtitle_en: 'Mandatory electronic recording and panchnama procedure under BNSS 103 & 105',
    subtitle_mr: 'BNSS १०३ व १०५ अन्वये अनिवार्य ऑडिओ-व्हिडिओ चित्रीकरण व पंचनामा नियम',
    badge_en: 'Mandatory Audio-Video',
    badge_mr: 'अनिवार्य चित्रीकरण नियम',
    color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
    statutoryWarning_en: 'Search without audio-video recording or panchas weakens prosecution evidence in court.',
    statutoryWarning_mr: 'व्हिडिओ चित्रीकरण किंवा पंचांशिवाय केलेली झडती न्यायालयात पुराव्याची विश्वासार्हता नष्ट करते.',
    points: [
      {
        num: 1,
        text_en: 'Call two or more respectable independent inhabitants of the locality to attend and witness the search throughout.',
        text_mr: 'झडती सुरू करण्यापूर्वी परिसरातील किमान दोन प्रतिष्ठित व स्वतंत्र साक्षीदारांना (पंच) हजर राहण्यास पाचारण करा.',
        legalChip: 'BNSS 103(1)',
        act: 'BNSS 2023',
      },
      {
        num: 2,
        text_en: 'MANDATORY: Record the entire search and seizure process through audio-video electronic means (e.g., mobile camera, bodycam).',
        text_mr: 'अनिवार्य: संपूर्ण झडती आणि जप्ती प्रक्रियेचे मोबाईल किंवा कॅमेऱ्याद्वारे सलग ऑडिओ-व्हिडिओ चित्रीकरण करा.',
        legalChip: 'BNSS 105',
        act: 'BNSS 2023',
      },
      {
        num: 3,
        text_en: 'Prepare a detailed seizure list (Panchnama) of all articles seized, noting exact marks, numbers, condition, and location where found.',
        text_mr: 'जप्त केलेल्या सर्व वस्तूंची तपशीलवार जप्ती यादी (पंचनामा) तयार करा; वस्तूचे स्वरूप, ओळखखुणा आणि आढळलेले ठिकाण स्पष्ट नोंदवा.',
        legalChip: 'BNSS 103(2)',
        act: 'BNSS 2023',
      },
      {
        num: 4,
        text_en: 'Deliver a signed copy of the seizure list forthwith to the occupant of the place or person searched. Obtain their signed acknowledgement.',
        text_mr: 'जप्ती यादीची स्वाक्षरी केलेली एक प्रत ज्या जागेची झडती घेतली त्या ताबेदारास किंवा व्यक्तीस तात्काळ द्या आणि पोच स्वाक्षरी घ्या.',
        legalChip: 'BNSS 103(3)',
        act: 'BNSS 2023',
      },
      {
        num: 5,
        text_en: 'Search of a woman must strictly be carried out by another woman officer with strict regard to decency and privacy.',
        text_mr: 'महिलेची अंगझडती केवळ महिला पोलीस अंमलदाराकडूनच शालीनतेचे व गोपनीयतेचे काटेकोर पालन करून घेतली पाहिजे.',
        legalChip: 'BNSS 103(2) proviso',
        act: 'BNSS 2023',
      },
      {
        num: 6,
        text_en: 'Forward the audio-video recording to the Judicial Magistrate First Class without delay, along with forwarding letter.',
        text_mr: 'ऑडिओ-व्हिडिओ चित्रीकरण विनाविलंब कव्हरिंग लेटरसह संबंधित प्रथम वर्ग न्यायदंडाधिकाऱ्यांकडे पाठवा.',
        legalChip: 'BNSS 105 proviso',
        act: 'BNSS 2023',
      },
    ],
  },

  // Card 4: Handling Electronic Evidence
  {
    id: 'electronic_evidence',
    situation: 'Handling Electronic Evidence',
    title_en: 'Handling Electronic Evidence (डिजिटल पुरावा)',
    title_mr: 'डिजिटल व इलेक्ट्रॉनिक पुरावा हाताळणी नियम',
    subtitle_en: 'Hash calculation, anti-static packing, and Section 63 BSA certificate compliance',
    subtitle_mr: 'हॅश जनरेशन, अँटी-स्टॅटिक पॅकिंग व भारतीय साक्ष अधिनियम कलम ६३ प्रमाणपत्र',
    badge_en: 'BSA Sec 63 Compliance',
    badge_mr: 'BSA कलम ६३ नियम',
    color: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
    statutoryWarning_en: 'Digital evidence without Section 63 BSA certificate is inadmissible in trial courts.',
    statutoryWarning_mr: 'बीएसए कलम ६३ प्रमाणपत्राशिवाय सादर केलेला इलेक्ट्रॉनिक पुरावा न्यायालयात अग्राह्य ठरतो.',
    points: [
      {
        num: 1,
        text_en: 'Never power on an electronic device in an unshielded environment. Put seized mobile phones immediately in airplane mode or anti-static Faraday pouch to prevent remote wipe.',
        text_mr: 'जप्त केलेला मोबाईल तात्काळ एअरप्लेन मोडवर टाका किंवा फॅराडे पाऊचमध्ये बंद करा, जेणेकरून दूरवरून डेटा नष्ट केला जाऊ नये.',
        legalChip: 'Sec 63 BSA',
        act: 'BSA 2023',
      },
      {
        num: 2,
        text_en: 'Compute SHA-256 cryptographic hash value immediately upon imaging or acquiring files to guarantee bit-by-bit cryptographic integrity.',
        text_mr: 'डेटा कॉपी/इमेजिंग करताना मूळ फाइल्सचा SHA-256 क्रिप्टोग्राफिक हॅश ताबडतोब तयार करा, जेणेकरून डेटा अखंडतेचा पुरावा राहील.',
        legalChip: 'Sec 63(4) BSA',
        act: 'BSA 2023',
      },
      {
        num: 3,
        text_en: 'Pack in clean tamper-evident envelope, seal with station lac/wax seal, and have both panchas and officer sign across the sealed flaps.',
        text_mr: 'पुरावा टॅम्पर-प्रूफ पाकिटात सील करा, लाखाचा शिक्का मारा आणि पंचांच्या व स्वतःच्या स्वाक्षऱ्या सीलवर करा.',
        legalChip: 'Chain of Custody',
        act: 'BNSS / BSA',
      },
      {
        num: 4,
        text_en: 'Maintain Chain of Custody register: every transfer between officer, malkhana, courier, and Forensic Science Laboratory (FSL) must have timestamp & signature.',
        text_mr: 'कस्टडी लॉग अद्ययावत ठेवा: मालखाना, तपास अंमलदार आणि फॉरेन्सिक लॅब यांच्यातील प्रत्येक हस्तांतरणाची तारीख, वेळ व सही नोंदवा.',
        legalChip: 'Malkhana Reg.',
        act: 'BNSS 2023',
      },
      {
        num: 5,
        text_en: 'Prepare and sign Section 63 BSA Certificate signed by the person in lawful management or officer who retrieved the electronic record.',
        text_mr: 'इलेक्ट्रॉनिक अभिलेख काढणाऱ्या अंमलदाराने किंवा सिस्टीम मॅनेजरने स्वाक्षरी केलेले BSA कलम ६३ प्रमाणपत्र तयार करा.',
        legalChip: 'Sec 63(4) BSA',
        act: 'BSA 2023',
      },
      {
        num: 6,
        text_en: 'Send to Regional Forensic Science Laboratory (RFSL) with forwarding letter stating seal impression specimen.',
        text_mr: 'सीलचा नमुना सोबत जोडून फॉरेन्सिक सायन्स लॅबोरेटरीकडे (FSL) तपासणीसाठी कव्हरिंग लेटरसह रवाना करा.',
        legalChip: 'BNSS 184 / BSA',
        act: 'BNSS 2023',
      },
    ],
  },

  // Card 5: Victim Rights
  {
    id: 'victim_rights',
    situation: 'Victim Rights',
    title_en: 'Victim & Informant Rights (पीडित व्यक्तींचे अधिकार)',
    title_mr: 'पीडित व फिर्यादी व्यक्तींचे वैधानिक हक्क',
    subtitle_en: 'Mandatory victim assistance, compensation, and statutory notification timelines',
    subtitle_mr: 'अनिवार्य मदत, नुकसानभरपाई आणि ९० दिवसांत प्रगती कळवण्याचे कायदेशीर नियम',
    badge_en: 'Victim Safeguards',
    badge_mr: 'पीडित संरक्षण नियम',
    color: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
    statutoryWarning_en: 'Statutory duty to keep victim informed of probe progress within 90 days under BNSS 193(3).',
    statutoryWarning_mr: 'BNSS १९३(३) अन्वये पीडिताला ९० दिवसांत तपासाची प्रगती कळवणे हे वैधानिक बंधन आहे.',
    points: [
      {
        num: 1,
        text_en: 'Free copy of the FIR must be provided to the victim/informant immediately upon registration without asking for any charge.',
        text_mr: 'एफआयआर नोंदवल्यानंतर कोणतीही फी न घेता तात्काळ अधिकृत प्रत पीडित/फिर्यादीला मोफत द्या.',
        legalChip: 'BNSS 173(2)',
        act: 'BNSS 2023',
      },
      {
        num: 2,
        text_en: 'Mandatory update on investigation progress must be communicated to the informant/victim within ninety (90) days of FIR registration.',
        text_mr: 'एफआयआर नोंदणीपासून ९० दिवसांच्या आत तपासाची सद्यस्थिती आणि प्रगती पीडितास लेखी किंवा इलेक्ट्रॉनिक माध्यमातून कळवा.',
        legalChip: 'BNSS 193(3)',
        act: 'BNSS 2023',
      },
      {
        num: 3,
        text_en: 'In sexual assault cases, immediate medical examination of the rape victim within 24 hours by a registered medical practitioner with informed consent.',
        text_mr: 'लैंगिक अत्याचाराच्या प्रकरणात २४ तासांच्या आत शासकीय वैद्यकीय अधिकाऱ्याकडून पीडितेच्या संमतीने वैद्यकीय तपासणी करून घ्या.',
        legalChip: 'BNSS 184',
        act: 'BNSS 2023',
      },
      {
        num: 4,
        text_en: 'Immediate free first-aid and medical treatment in all hospitals (government and private) for victims of acid attack or sexual assault.',
        text_mr: 'अ‍ॅसिड हल्ला किंवा लैंगिक अत्याचारातील पीडितांवर सर्व शासकीय व खाजगी रुग्णालयांत मोफत प्रथमोपचार व वैद्यकीय उपचार तात्काळ देणे बंधनकारक आहे.',
        legalChip: 'BNSS 396',
        act: 'BNSS 2023',
      },
      {
        num: 5,
        text_en: 'Initiate application for Victim Compensation Scheme through District Legal Services Authority (DLSA) for interim relief and rehabilitation.',
        text_mr: 'पीडिताला अंतरिम आर्थिक मदत व पुनर्वसनासाठी जिल्हा विधी सेवा प्राधिकरणाकडे (DLSA) नुकसानभरपाई अर्ज पाठवा.',
        legalChip: 'BNSS 396',
        act: 'BNSS 2023',
      },
      {
        num: 6,
        text_en: 'Inform the victim about availability of free legal aid through DLSA and National Legal Helpline 15100.',
        text_mr: 'पीडित व्यक्तीला मोफत वकील आणि राष्ट्रीय विधी सहाय्य हेल्पलाइन १५१०० बद्दल माहिती द्या.',
        legalChip: 'BNSS 40',
        act: 'LSA Act 1987',
      },
    ],
  },
];
