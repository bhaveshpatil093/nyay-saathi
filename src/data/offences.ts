import { Offence, ProcedureStep } from './types.ts';
import { GENERAL_PROCEDURE_STEPS } from './steps.ts';

/**
 * First batch of 10 standard offences under BNS 2023.
 * IMPORTANT: Every record has verified: false until formal legal review.
 */
export const OFFENCES_DATA: Offence[] = [
  // 1. Theft | BNS 303(2) | IPC 379 | 3 | yes | search likely
  {
    id: 'offence_theft_bns_303',
    title_en: 'Theft',
    title_mr: 'चोरी',
    bnsSection: 'BNS 303(2)',
    oldIpcSection: 'IPC 379',
    maxPunishmentYears: 3,
    cognizable: true,
    category: 'Property',
    tags: ['Theft', 'Property', 'Chori', 'Seizure', '303'],
    factsDefaults: {
      searchLikely: true,
      arrestLikely: false,
      electronicEvidenceLikely: false,
      womanVictim: false,
      childVictim: false,
    },
    description_en:
      'Theft involves dishonestly taking movable property out of another person\'s possession without consent. The offence is cognizable and carries imprisonment for a term which may extend to three years, or fine, or both.',
    description_mr:
      'कोणत्याही व्यक्तीच्या संमतीशिवाय तिची जंगम मालमत्ता लबाडीने तिच्या ताब्यातून काढून घेणे म्हणजे चोरी. हा दखलपात्र गुन्हा असून यासाठी कमाल ३ वर्षांपर्यंत कारावास, किंवा दंड, किंवा दोन्ही शिक्षा विहित आहेत.',
    watchOut_en: [
      'Do not arrest automatically; since punishment is under 7 years, consider issuing a notice of appearance under BNSS 35(3) first.',
      'Record the search and seizure on audio-video and forward the recording to the Judicial Magistrate without delay (BNSS 105).',
      'Prepare a seizure list or panchnama and deliver a signed copy to the occupant or person searched forthwith (BNSS 103).',
    ],
    watchOut_mr: [
      'थेट अटक करू नका; शिक्षा ७ वर्षांपेक्षा कमी असल्याने प्रथम BNSS ३५(३) अन्वये हजेरीची नोटीस देण्याचा विचार करा.',
      'झडती व जप्ती प्रक्रियेचे ऑडिओ-व्हिडिओ चित्रीकरण करा आणि ते विनाविलंब दंडाधिकाऱ्यांना पाठवा (BNSS १०५).',
      'जप्ती पंचनामा तयार करून त्याची स्वाक्षरी केलेली प्रत संबंधित ताबेदारास तात्काळ द्या (BNSS १०३).',
    ],
    extraStepIds: [
      'step_bnss_103_105_search_video',
      'step_bnss_103_seizure_list',
      'step_bnss_106_report_seizure',
    ],
    verified: false,
  },

  // 2. Snatching | BNS 304(2) | new offence | 3 | yes | arrest likely
  {
    id: 'offence_snatching_bns_304',
    title_en: 'Snatching',
    title_mr: 'हिसकावून नेणे (स्नॅचिंग)',
    bnsSection: 'BNS 304(2)',
    oldIpcSection: 'New Offence',
    maxPunishmentYears: 3,
    cognizable: true,
    category: 'Property',
    tags: ['Snatching', 'Chain Snatching', 'Mobile Theft', 'Property', '304'],
    factsDefaults: {
      arrestLikely: true,
      searchLikely: true,
      electronicEvidenceLikely: false,
      womanVictim: false,
      childVictim: false,
    },
    description_en:
      'Snatching is a newly codified offence where theft is committed by suddenly, quickly, or forcibly seizing property from any person. The offence is cognizable and punishable with imprisonment up to three years and fine.',
    description_mr:
      'कोणत्याही व्यक्तीकडील मालमत्ता अचानक, झपाट्याने किंवा बळाचा वापर करून हिसकावून घेणे म्हणजे स्नॅचिंग हा नवीन स्वतंत्र गुन्हा आहे. हा दखलपात्र गुन्हा असून कमाल ३ वर्षांपर्यंत कारावास व दंडाची शिक्षा विहित आहे.',
    watchOut_en: [
      'If arrest is effected, prepare an arrest memo attested by an independent witness and signed by the arrested person (BNSS 36).',
      'Inform the arrested person of grounds of arrest and notify a designated relative or friend immediately (BNSS 47, 48).',
      'Mandatory medical examination of the arrested person must be conducted and produced before Magistrate within 24 hours (BNSS 53, 58).',
    ],
    watchOut_mr: [
      'अटक केल्यास स्वतंत्र साक्षीदाराच्या स्वाक्षरीसह व आरोपीच्या सहीसह अधिकृत अटक मेमो तयार करा (BNSS ३६).',
      'अटक केलेल्या व्यक्तीला अटकेची कारणे सांगा आणि तिच्या नातेवाईकास तात्काळ अटकेची माहिती द्या (BNSS ४७, ४८).',
      'आरोपीची तात्काळ वैद्यकीय तपासणी करा आणि २४ तासांच्या आत दंडाधिकाऱ्यांसमोर हजर करा (BNSS ५३, ५८).',
    ],
    extraStepIds: [
      'step_bnss_36_arrest_memo',
      'step_bnss_47_48_inform',
      'step_bnss_58_magistrate_24h',
    ],
    verified: false,
  },

  // 3. Robbery | BNS 309(4) | IPC 392 | 10 | yes | arrest and search likely
  {
    id: 'offence_robbery_bns_309',
    title_en: 'Robbery',
    title_mr: 'जबरी चोरी (रोबरी)',
    bnsSection: 'BNS 309(4)',
    oldIpcSection: 'IPC 392',
    maxPunishmentYears: 10,
    cognizable: true,
    category: 'Property',
    tags: ['Robbery', 'Violent', 'Property', 'Heinous', '309'],
    factsDefaults: {
      arrestLikely: true,
      searchLikely: true,
      electronicEvidenceLikely: false,
      womanVictim: false,
      childVictim: false,
    },
    description_en:
      'Robbery occurs when theft or extortion is committed with force, causing or attempting to cause death, hurt, or wrongful restraint. The offence carries rigorous imprisonment up to ten years, and up to fourteen years if committed on a highway.',
    description_mr:
      'चोरी किंवा खंडणी करताना बळाचा वापर करून स्वेच्छेने दुखापत करणे, धाक दाखवणे किंवा जीव धोक्यात घालणे म्हणजे जबरी चोरी. या गुन्ह्यासाठी कमाल १० वर्षांपर्यंत सक्तमजुरीची (किंवा महामार्गावर असल्यास १४ वर्षांपर्यंत) शिक्षा आहे.',
    watchOut_en: [
      'Offence carries 10 years imprisonment: a forensic expert must visit the scene to collect evidence with videography (BNSS 176(3)).',
      'Audio-video recording of search and seizure of weapons or recovered booty is mandatory under BNSS 105.',
      'Produce before Magistrate within 24 hours; default bail right arises if chargesheet is not filed within 90 days (BNSS 187).',
    ],
    watchOut_mr: [
      'शिक्षेची मुदत १० वर्षे असल्याने घटनास्थळी न्यायवैद्यक (फॉरेन्सिक) तज्ज्ञ भेट व व्हिडिओ चित्रीकरण अनिवार्य आहे (BNSS १७६(३)).',
      'शस्त्रे व मुद्देमाल जप्ती प्रक्रियेचे BNSS १०५ अन्वये ऑडिओ-व्हिडिओ चित्रीकरण करणे आवश्यक आहे.',
      '२४ तासांत दंडाधिकाऱ्यांसमोर हजर करा; १० वर्षे शिक्षेसाठी ९० दिवसांत दोषारोपपत्र दाखल न झाल्यास डिफॉल्ट जामीन लागू होतो (BNSS १८७).',
    ],
    extraStepIds: [
      'step_bnss_176_3_forensic_visit',
      'step_bnss_103_105_search_video',
      'step_bnss_36_arrest_memo',
    ],
    verified: false,
  },

  // 4. Lurking house-trespass or house-breaking | BNS 331 | IPC 457 | 3 | yes | search likely
  {
    id: 'offence_house_breaking_bns_331',
    title_en: 'Lurking House-Trespass or House-Breaking',
    title_mr: 'लपून गृह-अतिचार किंवा घरफोडी',
    bnsSection: 'BNS 331',
    oldIpcSection: 'IPC 457',
    maxPunishmentYears: 3,
    cognizable: true,
    category: 'Property',
    tags: ['House Breaking', 'Burglary', 'Trespass', 'Property', '331'],
    factsDefaults: {
      searchLikely: true,
      arrestLikely: false,
      electronicEvidenceLikely: false,
      womanVictim: false,
      childVictim: false,
    },
    description_en:
      'House-breaking involves unlawfully entering or remaining in any building used as a human dwelling or place of worship by breaking in or taking precautions to conceal presence. The baseline offence carries imprisonment up to three years and fine.',
    description_mr:
      'मानवी वस्तीचे घर किंवा पूजेच्या जागेत लपून बेकायदेशीर प्रवेश करणे किंवा कडी-कोयंडा तोडून घरफोडी करणे हा गुन्हा आहे. या मूळ गुन्ह्यासाठी कमाल ३ वर्षांपर्यंत कारावास आणि दंडाची शिक्षा विहित आहे.',
    watchOut_en: [
      'Visit and secure the scene immediately, checking for forced entry marks, footprints, and physical clues (BNSS 176).',
      'Conduct search and recovery in the presence of two independent witnesses with audio-video recording (BNSS 103, 105).',
      'Provide an immediate copy of the seizure memo to the occupant and report the seizure to the Magistrate (BNSS 103, 106).',
    ],
    watchOut_mr: [
      'घटनास्थळाची तात्काळ पाहणी करून जागा सुरक्षित करा आणि जबरदस्तीने प्रवेश केल्याच्या खुणा जतन करा (BNSS १७६).',
      'दोन स्वतंत्र पंचांच्या उपस्थितीत ऑडिओ-व्हिडिओ चित्रीकरणासह झडती व मुद्देमाल जप्ती करा (BNSS १०३, १०५).',
      'जप्ती पंचनाम्याची एक प्रत ताबेदारास तात्काळ द्या आणि जप्तीचा अहवाल दंडाधिकाऱ्यांना पाठवा (BNSS १०३, १०६).',
    ],
    extraStepIds: [
      'step_bnss_103_105_search_video',
      'step_bnss_103_seizure_list',
      'step_bnss_106_report_seizure',
    ],
    verified: false,
  },

  // 5. Extortion | BNS 308(2) | IPC 384 | 3 | yes | electronic evidence likely
  {
    id: 'offence_extortion_bns_308',
    title_en: 'Extortion',
    title_mr: 'खंडणी उकळणे',
    bnsSection: 'BNS 308(2)',
    oldIpcSection: 'IPC 384',
    maxPunishmentYears: 3,
    cognizable: true,
    category: 'Financial',
    tags: ['Extortion', 'Blackmail', 'Financial', 'Threat', '308'],
    factsDefaults: {
      electronicEvidenceLikely: true,
      searchLikely: false,
      arrestLikely: false,
      womanVictim: false,
      childVictim: false,
    },
    description_en:
      'Extortion is intentionally putting any person in fear of injury and thereby dishonestly inducing them to deliver property or valuable security. The offence is cognizable and carries imprisonment for a term which may extend to three years, or fine, or both.',
    description_mr:
      'कोणत्याही व्यक्तीला दुखापतीची भीती दाखवून तिच्याकडून मालमत्ता किंवा मौल्यवान ऐवज बळजबरीने उकळणे म्हणजे खंडणी. हा दखलपात्र गुन्हा असून यासाठी कमाल ३ वर्षांपर्यंत कारावास, किंवा दंड, किंवा दोन्ही शिक्षा विहित आहेत.',
    watchOut_en: [
      'For extortion via phone or social media, do not alter the mobile device and record SHA-256 hash immediately (BSA 63).',
      'Obtain certificate under Section 63 BSA (Part A by person in charge, Part B by expert) for admissibility in court.',
      'Since punishment is under 7 years, consider issuing notice of appearance under BNSS 35(3) before effecting arrest.',
    ],
    watchOut_mr: [
      'फोन, मेसेज किंवा सोशल मीडियावरून खंडणी मागितली असल्यास उपकरणात बदल करू नका, तात्काळ SHA-256 हॅश नोंदवा (BSA ६३).',
      'न्यायालयात पुरावा ग्राह्य ठरवण्यासाठी BSA कलम ६३ चे प्रमाणपत्र (भाग अ व भाग ब) तयार करा.',
      'शिक्षा ३ वर्षांपर्यंत असल्याने अटक करण्यापूर्वी BNSS ३५(३) अन्वये हजेरीची नोटीस देण्याचा विचार करा.',
    ],
    extraStepIds: [
      'step_bsa_61_63_electronic_record',
      'step_bnss_35_3_notice',
      'step_bnss_180_183_witness',
    ],
    verified: false,
  },

  // 6. Cheating and dishonestly inducing delivery of property | BNS 318(4) | IPC 420 | 7 | yes | electronic evidence likely
  {
    id: 'offence_cheating_bns_318',
    title_en: 'Cheating and Dishonestly Inducing Delivery of Property',
    title_mr: 'फसवणूक करून मालमत्ता देणे भाग पाडणे',
    bnsSection: 'BNS 318(4)',
    oldIpcSection: 'IPC 420',
    maxPunishmentYears: 7,
    cognizable: true,
    category: 'Financial',
    tags: ['Cheating', 'Fraud', 'Financial', 'Cyber', '420', '318'],
    factsDefaults: {
      electronicEvidenceLikely: true,
      searchLikely: true,
      arrestLikely: true,
      womanVictim: false,
      childVictim: false,
    },
    description_en:
      'Cheating with dishonest inducement involves deceiving a person to deliver property or make or alter valuable security. The offence carries imprisonment for a term which may extend to seven years and shall also be liable to fine.',
    description_mr:
      'कोणत्याही व्यक्तीची फसवणूक करून तिला मालमत्ता देण्यास किंवा मौल्यवान ऐवज तयार करण्यास लबाडीने प्रवृत्त करणे. या गुन्ह्यासाठी कमाल ७ वर्षांपर्यंत कारावास आणि दंड अशी शिक्षा विहित आहे.',
    watchOut_en: [
      'Punishment reaches 7 years: forensic expert visit and collection under BNSS 176(3) is triggered.',
      'If cyber or banking fraud, report on 1930 portal, ask the bank to freeze suspicious accounts, and serve notice under BNSS 94.',
      'Preserve digital transaction logs and electronic receipts strictly with Section 63 BSA certificates.',
    ],
    watchOut_mr: [
      'शिक्षा ७ वर्षांपर्यंत असल्याने BNSS १७६(३) अन्वये फॉरेन्सिक तज्ज्ञ भेट व पुरावा संकलन अनिवार्य ठरते.',
      'सायबर किंवा बँकिंग फसवणूक असल्यास १९३० पोर्टलवर नोंद करा, खाती गोठवा (freeze) आणि BNSS ९४ अन्वये नोटीस द्या.',
      'डिजिटल व्यवहार व इलेक्ट्रॉनिक नोंदींसाठी BSA कलम ६३ प्रमाणपत्र अनिवार्यपणे प्राप्त करा.',
    ],
    extraStepIds: [
      'step_bnss_176_3_forensic_visit',
      'step_bsa_61_63_electronic_record',
      'step_cyber_fraud_freeze',
    ],
    verified: false,
  },

  // 7. Criminal breach of trust | BNS 316(2) | IPC 406 | 5 | yes | electronic evidence likely
  {
    id: 'offence_breach_of_trust_bns_316',
    title_en: 'Criminal Breach of Trust',
    title_mr: 'फौजदारी विश्वासघात',
    bnsSection: 'BNS 316(2)',
    oldIpcSection: 'IPC 406',
    maxPunishmentYears: 5,
    cognizable: true,
    category: 'Financial',
    tags: ['Breach of Trust', 'Misappropriation', 'Financial', 'Property', '316'],
    factsDefaults: {
      electronicEvidenceLikely: true,
      searchLikely: false,
      arrestLikely: false,
      womanVictim: false,
      childVictim: false,
    },
    description_en:
      'Criminal breach of trust involves dishonestly misappropriating, converting, or using property entrusted to one\'s domain in violation of any legal direction. The baseline offence is punishable with imprisonment up to five years, or fine, or both.',
    description_mr:
      'विश्वासाने स्वाधीन केलेल्या मालमत्तेचा लबाडीने अपहार करणे किंवा कायदेशीर कराराचा भंग करून स्वतःच्या फायद्यासाठी वापरणे म्हणजे फौजदारी विश्वासघात. या गुन्ह्यासाठी कमाल ५ वर्षांपर्यंत कारावास, किंवा दंड, किंवा दोन्ही शिक्षा विहित आहेत.',
    watchOut_en: [
      'Punishment is between 3 and 7 years: preliminary enquiry may be conducted within 14 days with DySP permission (BNSS 173(3)).',
      'Since punishment is under 7 years, consider issuing notice of appearance under BNSS 35(3) prior to arrest.',
      'Secure financial records, digital ledgers, and agreements backed by Section 63 BSA electronic evidence certificates.',
    ],
    watchOut_mr: [
      'शिक्षा ३ ते ७ वर्षांच्या दरम्यान असल्याने पोलीस उपअधीक्षक पूर्वपरवानगीने १४ दिवसांत प्राथमिक चौकशी करता येईल (BNSS १७३(३)).',
      'शिक्षा ७ वर्षांपेक्षा कमी असल्याने अटक करण्यापूर्वी BNSS ३५(३) अन्वये हजेरीची नोटीस देण्याचा विचार करा.',
      'आर्थिक दस्तऐवज, डिजिटल लेजर व करारांसाठी BSA कलम ६३ चे प्रमाणपत्र प्राप्त करा.',
    ],
    extraStepIds: [
      'step_bnss_173_3_prelim_enquiry',
      'step_bnss_35_3_notice',
      'step_bsa_61_63_electronic_record',
    ],
    verified: false,
  },

  // 8. Dishonestly receiving stolen property | BNS 317(2) | IPC 411 | 3 | yes | search likely
  {
    id: 'offence_stolen_property_bns_317',
    title_en: 'Dishonestly Receiving Stolen Property',
    title_mr: 'चोरीचा माल लबाडीने स्वीकारणे',
    bnsSection: 'BNS 317(2)',
    oldIpcSection: 'IPC 411',
    maxPunishmentYears: 3,
    cognizable: true,
    category: 'Property',
    tags: ['Stolen Property', 'Receiver', 'Recovery', 'Property', '317'],
    factsDefaults: {
      searchLikely: true,
      arrestLikely: false,
      electronicEvidenceLikely: false,
      womanVictim: false,
      childVictim: false,
    },
    description_en:
      'Dishonestly receiving or retaining stolen property knowing or having reason to believe the same to be stolen property. The offence is cognizable and carries imprisonment for a term up to three years, or fine, or both.',
    description_mr:
      'कोणतीही मालमत्ता चोरीची आहे हे माहीत असताना किंवा तसा संशय असण्यास वाजवी कारण असताना ती लबाडीने स्वीकारणे किंवा ताब्यात ठेवणे. हा दखलपात्र गुन्हा असून कमाल ३ वर्षांपर्यंत कारावास, किंवा दंड, किंवा दोन्ही शिक्षा आहेत.',
    watchOut_en: [
      'Conduct search of premises in the presence of two independent witnesses with mandatory audio-video recording (BNSS 103, 105).',
      'Prepare a detailed seizure memo with serial numbers and item conditions, giving a signed copy to the occupant (BNSS 103).',
      'Report the seizure forthwith to the Magistrate and keep property in safe custody at the police station malkhana (BNSS 106).',
    ],
    watchOut_mr: [
      'दोन स्वतंत्र पंचांच्या उपस्थितीत जागेची झडती घ्या आणि त्याचे अनिवार्य ऑडिओ-व्हिडिओ चित्रीकरण करा (BNSS १०३, १०५).',
      'मुद्देमालाच्या तपशीलासह जप्ती पंचनामा तयार करा आणि स्वाक्षरी केलेली प्रत ताबेदारास तात्काळ द्या (BNSS १०३).',
      'जप्तीचा अहवाल दंडाधिकाऱ्यांना तात्काळ द्या आणि जप्त मालमत्ता ठाण्याच्या मालखान्यात सुरक्षित ठेवा (BNSS १०६).',
    ],
    extraStepIds: [
      'step_bnss_103_105_search_video',
      'step_bnss_103_seizure_list',
      'step_bnss_106_report_seizure',
    ],
    verified: false,
  },

  // 9. Criminal intimidation | BNS 351(2) | IPC 506 | 2 | no (non-cognizable) | electronic evidence likely
  {
    id: 'offence_intimidation_bns_351',
    title_en: 'Criminal Intimidation',
    title_mr: 'गुन्हेगारी धमकी (धमकावणे)',
    bnsSection: 'BNS 351(2)',
    oldIpcSection: 'IPC 506',
    maxPunishmentYears: 2,
    cognizable: false,
    category: 'Person',
    tags: ['Intimidation', 'Threat', 'Non-Cognizable', 'Person', '351'],
    factsDefaults: {
      electronicEvidenceLikely: true,
      searchLikely: false,
      arrestLikely: false,
      womanVictim: false,
      childVictim: false,
    },
    description_en:
      'Criminal intimidation involves threatening another person with injury to their person, reputation, or property to cause alarm or force any act. The baseline offence is non-cognizable and carries imprisonment up to two years, or fine, or both.',
    description_mr:
      'कोणत्याही व्यक्तीला तिच्या शरीरास, अब्रूस किंवा मालमत्तेस हानी पोहोचवण्याची धमकी देऊन तिला भयभीत करणे किंवा गैरकृत्य करण्यास भाग पाडणे. हा अदखलपात्र गुन्हा असून यासाठी कमाल २ वर्षांपर्यंत कारावास किंवा दंड अशी शिक्षा आहे.',
    watchOut_en: [
      'Non-cognizable offence: police cannot investigate without an order of the Judicial Magistrate (BNSS 174).',
      'Enter the information in the non-cognizable (NC) register and refer the informant to the Magistrate (BNSS 174).',
      'If threat was communicated electronically, preserve device state, record hash, and prepare Section 63 BSA certificate (BSA 63).',
    ],
    watchOut_mr: [
      'अदखलपात्र गुन्हा: दंडाधिकाऱ्यांच्या आदेशाशिवाय पोलीस तपास करू शकत नाहीत (BNSS १७४).',
      'तक्रारीची अदखलपात्र (NC) नोंदवहीत नोंद करा आणि फिर्यादीला दंडाधिकाऱ्यांकडे पाठवा (BNSS १७४).',
      'धमकी फोन किंवा मेसेजद्वारे दिली असल्यास फोन जतन करा, हॅश नोंदवा आणि BSA कलम ६३ प्रमाणपत्र तयार ठेवा (BSA ६३).',
    ],
    extraStepIds: [
      'step_bnss_174_non_cog',
      'step_bsa_61_63_electronic_record',
      'step_bnss_180_183_witness',
    ],
    verified: false,
  },

  // 10. Voluntarily causing hurt | BNS 115(2) | IPC 323 | 1 | no (non-cognizable) | none
  {
    id: 'offence_hurt_bns_115',
    title_en: 'Voluntarily Causing Hurt',
    title_mr: 'स्वेच्छेने दुखापत करणे',
    bnsSection: 'BNS 115(2)',
    oldIpcSection: 'IPC 323',
    maxPunishmentYears: 1,
    cognizable: false,
    category: 'Person',
    tags: ['Hurt', 'Simple Hurt', 'Non-Cognizable', 'Person', '115'],
    factsDefaults: {
      searchLikely: false,
      arrestLikely: false,
      electronicEvidenceLikely: false,
      womanVictim: false,
      childVictim: false,
    },
    description_en:
      'Voluntarily causing bodily pain, disease, or infirmity to any person without weapons. The offence is non-cognizable and carries imprisonment for a term up to one year, or fine up to ten thousand rupees, or both.',
    description_mr:
      'कोणत्याही हत्याराशिवाय स्वेच्छेने शारीरिक वेदना किंवा दुखापत करणे. हा अदखलपात्र गुन्हा असून यासाठी कमाल १ वर्षांपर्यंत कारावास, किंवा दहा हजार रुपयांपर्यंत दंड, किंवा दोन्ही शिक्षा विहित आहेत.',
    watchOut_en: [
      'Non-cognizable offence: do not register an FIR; enter details in the non-cognizable register and refer to Magistrate (BNSS 174).',
      'Send the injured person for medical examination and preserve medical certificate for court production.',
      'Investigation can only proceed if the Judicial Magistrate grants permission under BNSS Section 174(2).',
    ],
    watchOut_mr: [
      'अदखलपात्र गुन्हा: एफआयआर नोंदवू नका; अदखलपात्र नोंदवहीत नोंद करून फिर्यादीला दंडाधिकाऱ्यांकडे पाठवा (BNSS १७४).',
      'जखमी व्यक्तीस वैद्यकीय तपासणीसाठी पाठवा आणि वैद्यकीय प्रमाणपत्र कोर्टासाठी सुरक्षित ठेवा.',
      'दंडाधिकाऱ्यांची लेखी परवानगी मिळाल्याशिवाय पुढील तपास करता येत नाही (BNSS १७४(२)).',
    ],
    extraStepIds: [
      'step_bnss_174_non_cog',
      'step_bnss_180_183_witness',
    ],
    verified: false,
  },

  // 11. Voluntarily causing grievous hurt | BNS 117(2) | IPC 325 | 7 | yes | arrest likely
  {
    id: 'offence_grievous_hurt_bns_117',
    title_en: 'Voluntarily Causing Grievous Hurt',
    title_mr: 'स्वेच्छेने गंभीर दुखापत करणे',
    bnsSection: 'BNS 117(2)',
    oldIpcSection: 'IPC 325',
    maxPunishmentYears: 7,
    cognizable: true,
    category: 'Person',
    tags: ['Grievous Hurt', 'Hurt', 'Injury', 'Person', '117'],
    factsDefaults: {
      arrestLikely: true,
      searchLikely: false,
      electronicEvidenceLikely: false,
      womanVictim: false,
      childVictim: false,
      injuryOrDeath: true,
    },
    description_en:
      'Voluntarily causing hurt designated as grievous, including permanent privation of sight or hearing, fracture, or severe bodily pain. The offence is cognizable and carries imprisonment for a term which may extend to seven years, and shall also be liable to fine.',
    description_mr:
      'दृष्टी किंवा श्रवणशक्ती कायमची नष्ट करणे, हाड मोडणे अथवा वीस दिवस असह्य शारीरिक वेदना देणारी गंभीर दुखापत स्वेच्छेने करणे हा गुन्हा आहे. हा दखलपात्र गुन्हा असून यासाठी कमाल ७ वर्षांपर्यंत कारावास आणि दंड अशी शिक्षा विहित आहे.',
    watchOut_en: [
      'Since punishment reaches 7 years, mandatory forensic expert visit and crime scene videography is triggered under BNSS 176(3).',
      'Obtain medico-legal examination report immediately from the government hospital and preserve biological samples with chain of custody (BNSS 53, 176).',
      'If arrest is effected, prepare an arrest memo with witness attestation and produce before Magistrate within 24 hours (BNSS 36, 58).',
    ],
    watchOut_mr: [
      'शिक्षा ७ वर्षांपर्यंत पोहोचल्याने BNSS १७६(३) अन्वये फॉरेन्सिक तज्ज्ञ भेट व घटनास्थळाचे व्हिडिओ चित्रीकरण अनिवार्य आहे.',
      'सरकारी रुग्णालयातून तात्काळ एमएलसी (वैद्यकीय) अहवाल प्राप्त करा आणि रक्ताचे नमुने सील करून सुरक्षित ठेवा (BNSS ५३, १७६).',
      'अटक केल्यास पंचांच्या स्वाक्षरीसह अधिकृत अटक मेमो तयार करा आणि २४ तासांत दंडाधिकाऱ्यांसमोर हजर करा (BNSS ३६, ५८).',
    ],
    extraStepIds: [
      'step_bnss_176_3_forensic_visit',
      'step_bnss_36_arrest_memo',
      'step_forensic_samples_seal',
    ],
    verified: false,
  },

  // 12. Murder | BNS 103 | IPC 302 | 99 | yes | arrest, search, forensic visit
  {
    id: 'offence_murder_bns_103',
    title_en: 'Murder',
    title_mr: 'खून (हत्या)',
    bnsSection: 'BNS 103',
    oldIpcSection: 'IPC 302',
    maxPunishmentYears: 99,
    cognizable: true,
    category: 'Person',
    tags: ['Murder', 'Homicide', 'Heinous', 'Life', '103'],
    factsDefaults: {
      arrestLikely: true,
      searchLikely: true,
      forensicVisitLikely: true,
      injuryOrDeath: true,
      electronicEvidenceLikely: false,
      womanVictim: false,
      childVictim: false,
    },
    description_en:
      'Murder is the intentional causing of death of a human being without lawful excuse or legal justification. The offence is cognizable and punishable with death or imprisonment for life, and shall also be liable to fine.',
    description_mr:
      'कोणत्याही कायदेशीर कारणाशिवाय जाणीवपूर्वक किंवा हेतूने एखाद्या व्यक्तीचा जीव घेणे म्हणजे खून. हा अतिगंभीर दखलपात्र गुन्हा असून यासाठी फाशी किंवा जन्मठेप आणि दंडाची कठोर शिक्षा विहित आहे.',
    watchOut_en: [
      'Mandatory forensic expert visit to inspect the crime scene and capture audio-video recording under BNSS 176(3).',
      'Search of scene and weapon seizure must be conducted in the presence of two independent witnesses with audio-video recording (BNSS 103, 105).',
      'Send physical and biological samples to the forensic science laboratory with tamper-proof seals and log every chain of custody transfer.',
    ],
    watchOut_mr: [
      'BNSS १७६(३) नुसार फॉरेन्सिक तज्ज्ञांची घटनास्थळ पाहणी व व्हिडिओ चित्रीकरण कायद्याने अनिवार्य आहे.',
      'घटनास्थळाची झडती व हत्याराची जप्ती दोन स्वतंत्र पंचांसमक्ष ऑडिओ-व्हिडिओ चित्रीकरणासह करा (BNSS १०३, १०५).',
      'रक्ताचे नमुने व हत्यार योग्य सील करून फॉरेन्सिक लॅबला पाठवा आणि ताबा साखळी नोंदवहीत नोंद ठेवा (BNSS १७६).',
    ],
    extraStepIds: [
      'step_bnss_176_3_forensic_visit',
      'step_bnss_103_105_search_video',
      'step_forensic_samples_seal',
    ],
    verified: false,
  },

  // 13. Culpable homicide not amounting to murder | BNS 105 | IPC 304 | 99 | yes | arrest, search, forensic visit
  {
    id: 'offence_culpable_homicide_bns_105',
    title_en: 'Culpable Homicide Not Amounting to Murder',
    title_mr: 'खूनास समतुल्य नसलेला सदोष मनुष्यवध',
    bnsSection: 'BNS 105',
    oldIpcSection: 'IPC 304',
    maxPunishmentYears: 99,
    cognizable: true,
    category: 'Person',
    tags: ['Culpable Homicide', 'Death', 'Manslaughter', 'Person', '105'],
    factsDefaults: {
      arrestLikely: true,
      searchLikely: true,
      forensicVisitLikely: true,
      injuryOrDeath: true,
      electronicEvidenceLikely: false,
      womanVictim: false,
      childVictim: false,
    },
    description_en:
      'Culpable homicide not amounting to murder involves causing death with knowledge or intention to cause bodily injury likely to cause death, under statutory exceptions. The offence is cognizable and punishable with imprisonment for life or imprisonment up to ten years, and fine.',
    description_mr:
      'मृत्यू घडवून आणण्याची शक्यता आहे हे माहीत असताना अथवा गंभीर इजा करण्याच्या हेतूने परंतु अपवादात्मक स्थितीत घडलेला सदोष मनुष्यवध. हा दखलपात्र गुन्हा असून जन्मठेप किंवा १० वर्षांपर्यंत कारावास व दंडाची शिक्षा विहित आहे.',
    watchOut_en: [
      'Mandatory forensic expert visit and crime scene videography under BNSS Section 176(3) due to punishment exceeding 7 years.',
      'Record witness statements promptly under BNSS 180 and consider recording statements before a Judicial Magistrate under BNSS 183.',
      'Conduct search and seizure with two independent witnesses, recording audio-video and transmitting to Magistrate (BNSS 103, 105).',
    ],
    watchOut_mr: [
      'शिक्षा ७ वर्षांपेक्षा अधिक असल्याने BNSS कलम १७६(३) नुसार फॉरेन्सिक तज्ज्ञ भेट व घटनास्थळाचे व्हिडिओ चित्रीकरण अनिवार्य आहे.',
      'BNSS १८० अन्वये प्रत्यक्षदर्शी साक्षीदारांचे जबाब नोंदवा आणि आवश्यक असल्यास BNSS १८३ अन्वये दंडाधिकाऱ्यांसमोर जबाब घ्या.',
      'दोन स्वतंत्र पंचांसमक्ष ऑडिओ-व्हिडिओ चित्रीकरणासह झडती-जप्ती करून दंडाधिकाऱ्यांना तात्काळ पाठवा (BNSS १०३, १०५).',
    ],
    extraStepIds: [
      'step_bnss_176_3_forensic_visit',
      'step_bnss_180_183_witness',
      'step_bnss_103_105_search_video',
    ],
    verified: false,
  },

  // 14. Attempt to murder | BNS 109 | IPC 307 | 10 | yes | arrest, search
  {
    id: 'offence_attempt_murder_bns_109',
    title_en: 'Attempt to Murder',
    title_mr: 'खुनाचा प्रयत्न',
    bnsSection: 'BNS 109',
    oldIpcSection: 'IPC 307',
    maxPunishmentYears: 10,
    cognizable: true,
    category: 'Person',
    tags: ['Attempt to Murder', 'Assault', 'Violent', 'Person', '109'],
    factsDefaults: {
      arrestLikely: true,
      searchLikely: true,
      electronicEvidenceLikely: false,
      womanVictim: false,
      childVictim: false,
      injuryOrDeath: true,
    },
    description_en:
      'Attempt to murder involves doing any act with such intention or knowledge that if death had been caused, the offender would be guilty of murder. The offence is cognizable and carries imprisonment for a term up to ten years and fine, or life imprisonment if hurt is caused.',
    description_mr:
      'ज्या कृत्याने मृत्यू झाला असता तर तो खून ठरला असता, असे कृत्य जाणीवपूर्वक किंवा हेतूने करणे म्हणजे खुनाचा प्रयत्न. हा दखलपात्र गुन्हा असून यासाठी कमाल १० वर्षांपर्यंत कारावास व दंड (आणि इजा झाल्यास जन्मठेप) अशी शिक्षा विहित आहे.',
    watchOut_en: [
      'Punishment exceeds 7 years: forensic expert visit and crime scene videography are statutorily required under BNSS 176(3).',
      'Execute search and seizure of weapons with audio-video recording and provide immediate copy of seizure memo to occupant (BNSS 103, 105).',
      'Prepare arrest memo with witness attestation and ensure medical examination of the arrested person immediately (BNSS 36, 53).',
    ],
    watchOut_mr: [
      'शिक्षा १० वर्षे असल्याने BNSS १७६(३) अन्वये फॉरेन्सिक तज्ज्ञ भेट व व्हिडिओ चित्रीकरण करणे कायदेशीर बंधन आहे.',
      'हत्यार जप्तीचे ऑडिओ-व्हिडिओ चित्रीकरण करा आणि ताबेदारास जप्ती पंचनाम्याची प्रत तात्काळ द्या (BNSS १०३, १०५).',
      'पंचांच्या साक्षीने अटक मेमो तयार करा आणि आरोपीची तात्काळ शासकीय वैद्यकीय तपासणी करून घ्या (BNSS ३६, ५३).',
    ],
    extraStepIds: [
      'step_bnss_176_3_forensic_visit',
      'step_bnss_103_105_search_video',
      'step_bnss_36_arrest_memo',
    ],
    verified: false,
  },

  // 15. Rape | BNS 64 | IPC 376 | 99 | yes | woman victim, medical exam, rape case flag
  {
    id: 'offence_rape_bns_64',
    title_en: 'Rape',
    title_mr: 'बलात्कार',
    bnsSection: 'BNS 64',
    oldIpcSection: 'IPC 376',
    maxPunishmentYears: 99,
    cognizable: true,
    category: 'Women & Children',
    tags: ['Rape', 'Sexual Violence', 'Woman Victim', 'Heinous', '64'],
    factsDefaults: {
      womanVictim: true,
      childVictim: false,
      arrestLikely: true,
      searchLikely: true,
      electronicEvidenceLikely: false,
      rapeCase: true,
      medicalExamLikely: true,
      injuryOrDeath: false,
    },
    description_en:
      'Rape is defined as non-consensual sexual assault committed under circumstances specified by statute. The baseline offence is cognizable and punishable with rigorous imprisonment of not less than ten years extending to life imprisonment, and fine.',
    description_mr:
      'कायद्यात नमूद केलेल्या संमतीविना किंवा धाक दाखवून केलेले लैंगिक अत्याचार म्हणजे बलात्कार. हा दखलपात्र गुन्हा असून यासाठी किमान १० वर्षे ते जन्मठेप सक्तमजुरी आणि दंडाची कठोर शिक्षा विहित आहे.',
    watchOut_en: [
      'Information and victim statements must be recorded strictly by a woman police officer (BNSS 173(1), 176(1) proviso).',
      'Medical examination of the victim by a registered medical practitioner with report sent to IO within 7 days (BNSS 184).',
      'Complete the entire investigation and file police report within two months from recording of information (BNSS 193(2)).',
    ],
    watchOut_mr: [
      'प्रथम खबर व पीडितेचा जबाब केवळ महिला पोलीस अधिकाऱ्यानेच नोंदवला पाहिजे (BNSS १७३(१), १७६(१) परंतुक).',
      'नोंदणीकृत वैद्यकीय अधिकाऱ्याकडून पीडितेची वैद्यकीय तपासणी करून ७ दिवसांत तपास अधिकाऱ्यास अहवाल सादर करा (BNSS १८४).',
      'माहिती नोंदवल्याच्या दिनांकापासून २ महिन्यांच्या आत संपूर्ण तपास पूर्ण करून दोषारोपपत्र दाखल करा (BNSS १९३(२)).',
    ],
    extraStepIds: [
      'step_bnss_173_1_woman_recorder',
      'step_bnss_184_rape_medical',
      'step_bnss_193_police_report',
    ],
    verified: false,
  },

  // 16. Sexual harassment | BNS 75 | IPC 354A | 3 | yes | woman victim, electronic evidence likely
  {
    id: 'offence_sexual_harassment_bns_75',
    title_en: 'Sexual Harassment',
    title_mr: 'लैंगिक छळवणूक (लैंगिक छळ)',
    bnsSection: 'BNS 75',
    oldIpcSection: 'IPC 354A',
    maxPunishmentYears: 3,
    cognizable: true,
    category: 'Women & Children',
    tags: ['Sexual Harassment', 'Woman Victim', 'Modesty', 'Harassment', '75'],
    factsDefaults: {
      womanVictim: true,
      childVictim: false,
      electronicEvidenceLikely: true,
      searchLikely: false,
      arrestLikely: false,
    },
    description_en:
      'Sexual harassment includes unwelcome physical contact, demand for sexual favours, showing pornography, or making sexually coloured remarks against a woman. The offence is cognizable and carries imprisonment for a term which may extend up to three years, or fine, or both.',
    description_mr:
      'महिलेला तिच्या संमतीविना अवांछित शारीरिक स्पर्श करणे, लैंगिक सुखाची मागणी करणे, अश्लील साहित्य दाखवणे किंवा लैंगिक शेरेबाजी करणे म्हणजे लैंगिक छळ. हा दखलपात्र गुन्हा असून यासाठी कमाल ३ वर्षांपर्यंत कारावास, किंवा दंड, किंवा दोन्ही शिक्षा विहित आहेत.',
    watchOut_en: [
      'Information must be recorded by a woman police officer ensuring safety and dignity (BNSS 173(1) proviso).',
      'For digital harassment (texts, calls, social media), do not alter device, record hash, and obtain BSA 63 certificate (BSA 63).',
      'Offence carries up to 3 years imprisonment: consider issuing notice of appearance under BNSS 35(3) before arresting.',
    ],
    watchOut_mr: [
      'पीडितेची माहिती व फिर्याद अनिवार्यपणे महिला पोलीस अधिकाऱ्यानेच नोंदवली पाहिजे (BNSS १७३(१) परंतुक).',
      'मोबाईल किंवा सोशल मीडियावरून छळ झाला असल्यास हॅश नोंदवा आणि BSA कलम ६३ चे प्रमाणपत्र तयार करा (BSA ६३).',
      'शिक्षा ३ वर्षांपर्यंत असल्याने थेट अटक टाळून प्रथम BNSS ३५(३) अन्वये हजेरीची नोटीस देण्याचा विचार करा.',
    ],
    extraStepIds: [
      'step_bnss_173_1_woman_recorder',
      'step_bsa_61_63_electronic_record',
      'step_bnss_35_3_notice',
    ],
    verified: false,
  },

  // 17. Stalking | BNS 78 | IPC 354D | 3 | yes | woman victim, electronic evidence likely
  {
    id: 'offence_stalking_bns_78',
    title_en: 'Stalking',
    title_mr: 'पाठलाग करणे (स्टॉकिंग)',
    bnsSection: 'BNS 78',
    oldIpcSection: 'IPC 354D',
    maxPunishmentYears: 3,
    cognizable: true,
    category: 'Women & Children',
    tags: ['Stalking', 'Woman Victim', 'Cyberstalking', 'Harassment', '78'],
    factsDefaults: {
      womanVictim: true,
      childVictim: false,
      electronicEvidenceLikely: true,
      searchLikely: false,
      arrestLikely: false,
    },
    description_en:
      'Stalking involves following a woman and contacting or attempting to contact her despite clear disinterest, or monitoring her internet, email, or electronic communication. The offence is cognizable on first conviction and carries imprisonment up to three years and fine.',
    description_mr:
      'महिलेला स्वारस्य नसतानाही तिचा वारंवार पाठलाग करणे किंवा तिच्या इंटरनेट, ईमेल अथवा सोशल मीडिया संभाषणावर पाळत ठेवणे म्हणजे स्टॉकिंग. पहिल्या गुन्ह्यासाठी हा दखलपात्र गुन्हा असून कमाल ३ वर्षांपर्यंत कारावास आणि दंडाची शिक्षा विहित आहे.',
    watchOut_en: [
      'The statement of the woman victim must be recorded by a woman police officer (BNSS 173(1), 176(1)).',
      'Preserve digital trail (call records, social media messages, GPS tracking) with SHA-256 hash and Section 63 BSA certificate.',
      'Since punishment is under 7 years, evaluate issuing notice of appearance under BNSS 35(3) prior to taking arrest steps.',
    ],
    watchOut_mr: [
      'महिला पीडितेचा जबाब अनिवार्यपणे महिला पोलीस अधिकाऱ्यानेच नोंदवला पाहिजे (BNSS १७३(१), १७६(१)).',
      'कॉल रेकॉर्ड, मेसेज आणि डिजिटल पुराव्यांचा हॅश नोंदवून BSA कलम ६३ चे प्रमाणपत्र वेळेत तयार करा (BSA ६३).',
      'शिक्षा ३ वर्षांपर्यंत असल्याने अटकेऐवजी प्रथम BNSS ३५(३) अन्वये हजेरीची नोटीस देण्याचा विचार करा.',
    ],
    extraStepIds: [
      'step_bnss_173_1_woman_recorder',
      'step_bsa_61_63_electronic_record',
      'step_bnss_35_3_notice',
    ],
    verified: false,
  },

  // 18. Dowry death | BNS 80 | IPC 304B | 99 | yes | woman victim, forensic visit
  {
    id: 'offence_dowry_death_bns_80',
    title_en: 'Dowry Death',
    title_mr: 'हुंडाबळी (हुंड्यामुळे मृत्यू)',
    bnsSection: 'BNS 80',
    oldIpcSection: 'IPC 304B',
    maxPunishmentYears: 99,
    cognizable: true,
    category: 'Women & Children',
    tags: ['Dowry Death', 'Woman Victim', 'Matrimonial', 'Heinous', '80'],
    factsDefaults: {
      womanVictim: true,
      childVictim: false,
      arrestLikely: true,
      searchLikely: true,
      forensicVisitLikely: true,
      injuryOrDeath: true,
      electronicEvidenceLikely: false,
    },
    description_en:
      'Dowry death occurs when the death of a woman is caused by burns, bodily injury, or abnormal circumstances within seven years of marriage, preceded by harassment for dowry. The offence is cognizable and punishable with imprisonment for a term not less than seven years, which may extend to life imprisonment.',
    description_mr:
      'विवाहाच्या ७ वर्षांच्या आत महिलेचा संशयास्पद स्थितीत मृत्यू होणे आणि मृत्यूपूर्वी हुंड्याच्या मागणीसाठी तिचा छळ झालेला असणे म्हणजे हुंडाबळी. हा दखलपात्र गुन्हा असून यासाठी किमान ७ वर्षे ते जन्मठेपेची शिक्षा विहित आहे.',
    watchOut_en: [
      'Mandatory forensic expert visit to inspect the scene and seize physical exhibits with videography under BNSS 176(3).',
      'Conduct search of matrimonial home with two independent witnesses and audio-video recording (BNSS 103, 105).',
      'Send viscera, biological samples, and suicide notes to FSL with unbroken chain of custody logging (BNSS 176).',
    ],
    watchOut_mr: [
      'BNSS १७६(३) अन्वये फॉरेन्सिक तज्ज्ञांची घटनास्थळ पाहणी व व्हिडिओ चित्रीकरण करणे कायद्याने बंधनकारक आहे.',
      'सासरच्या घराची झडती दोन स्वतंत्र पंचांसमक्ष ऑडिओ-व्हिडिओ चित्रीकरणासह करा (BNSS १०३, १०५).',
      'व्हिसेरा, जैविक नमुने व चिठ्ठी सुरक्षित सील करून फॉरेन्सिक लॅबला पाठवा आणि ताबा साखळी नोंद ठेवा (BNSS १७६).',
    ],
    extraStepIds: [
      'step_bnss_176_3_forensic_visit',
      'step_bnss_103_105_search_video',
      'step_forensic_samples_seal',
    ],
    verified: false,
  },

  // 19. Cruelty by husband or relatives | BNS 85 | IPC 498A | 3 | yes | woman victim
  {
    id: 'offence_cruelty_matrimonial_bns_85',
    title_en: 'Cruelty by Husband or Relatives of Husband',
    title_mr: 'पती किंवा नातेवाईकांकडून क्रूर वागणूक',
    bnsSection: 'BNS 85',
    oldIpcSection: 'IPC 498A',
    maxPunishmentYears: 3,
    cognizable: true,
    category: 'Women & Children',
    tags: ['Cruelty', '498A', 'Woman Victim', 'Domestic', 'Matrimonial', '85'],
    factsDefaults: {
      womanVictim: true,
      childVictim: false,
      arrestLikely: false,
      searchLikely: false,
      electronicEvidenceLikely: false,
    },
    description_en:
      'Cruelty involves subjecting a married woman to willful conduct likely to drive her to suicide or cause grave injury, or harassment for unlawful property demands. The offence is cognizable and punishable with imprisonment for a term which may extend to three years and fine.',
    description_mr:
      'विवाहित महिलेचा मानसिक किंवा शारीरिक छळ करून तिला आत्महत्येस प्रवृत्त करणे किंवा बेकायदेशीर मालमत्तेच्या मागणीसाठी त्रास देणे. हा दखलपात्र गुन्हा असून यासाठी कमाल ३ वर्षांपर्यंत कारावास आणि दंडाची शिक्षा विहित आहे.',
    watchOut_en: [
      'Ensure the victim\'s statement and initial information are recorded by a woman police officer (BNSS 173(1), 176(1)).',
      'Avoid routine or mechanical arrests; strictly issue notice of appearance under BNSS 35(3) following Arnesh Kumar safeguards.',
      'Record detailed witness statements of family members and neighbors under BNSS 180 and update case diary daily (BNSS 192).',
    ],
    watchOut_mr: [
      'पीडितेची फिर्याद व जबाब केवळ महिला पोलीस अधिकाऱ्यानेच नोंदवला पाहिजे (BNSS १७३(१), १७६(१)).',
      'यांत्रिक पद्धतीने सरसकट अटक करू नका; BNSS ३५(३) अन्वये हजेरीची नोटीस देण्याची पद्धत काटेकोरपणे पाळा.',
      'कुटुंबातील व्यक्ती व शेजाऱ्यांचे जबाब BNSS १८० अन्वये नोंदवा आणि दररोज केस डायरी अद्ययावत ठेवा (BNSS १९२).',
    ],
    extraStepIds: [
      'step_bnss_173_1_woman_recorder',
      'step_bnss_35_3_notice',
      'step_bnss_192_case_diary',
    ],
    verified: false,
  },

  // 20. Kidnapping | BNS 137(2) | IPC 363 | 7 | yes | child victim possible
  {
    id: 'offence_kidnapping_bns_137',
    title_en: 'Kidnapping',
    title_mr: 'अपहरण (किडनॅपिंग)',
    bnsSection: 'BNS 137(2)',
    oldIpcSection: 'IPC 363',
    maxPunishmentYears: 7,
    cognizable: true,
    category: 'Person',
    tags: ['Kidnapping', 'Child Victim', 'Abduction', 'Person', '137'],
    factsDefaults: {
      childVictim: true,
      womanVictim: false,
      arrestLikely: true,
      searchLikely: true,
      electronicEvidenceLikely: false,
    },
    description_en:
      'Kidnapping involves taking or enticing any minor or person out of the keeping of the lawful guardian without consent. The baseline offence is cognizable and carries imprisonment for a term which may extend to seven years and fine.',
    description_mr:
      'कोणत्याही अज्ञान बालकास अथवा व्यक्तीस तिच्या कायदेशीर पालकांच्या संमतीशिवाय त्यांच्या ताब्यातून फूस लावून पळवून नेणे म्हणजे अपहरण. हा दखलपात्र गुन्हा असून यासाठी कमाल ७ वर्षांपर्यंत कारावास आणि दंडाची शिक्षा विहित आहे.',
    watchOut_en: [
      'Punishment reaches 7 years: forensic expert visit and crime scene videography are mandated under BNSS 176(3).',
      'If victim is a child, record statements in a child-friendly atmosphere and promptly arrange medical examination (BNSS 53, 180).',
      'Prepare arrest memo with witness attestation upon apprehending accused and produce before Magistrate in 24 hours (BNSS 36, 58).',
    ],
    watchOut_mr: [
      'शिक्षा ७ वर्षांपर्यंत असल्याने BNSS १७६(३) अन्वये फॉरेन्सिक तज्ज्ञ भेट व व्हिडिओ चित्रीकरण करणे आवश्यक आहे.',
      'पीडित बालक असल्यास बालस्नेही वातावरणात जबाब नोंदवा आणि तातडीने वैद्यकीय तपासणी करून घ्या (BNSS ५३, १८०).',
      'आरोपीला ताब्यात घेतल्यावर साक्षीदाराच्या सहीसह अटक मेमो तयार करा आणि २४ तासांत हजर करा (BNSS ३६, ५८).',
    ],
    extraStepIds: [
      'step_bnss_176_3_forensic_visit',
      'step_bnss_36_arrest_memo',
      'step_bnss_58_magistrate_24h',
    ],
    verified: false,
  },

  // 21. Causing death by rash or negligent act | BNS 106(1) | IPC 304A | 5 | yes | search likely
  {
    id: 'offence_negligent_death_bns_106',
    title_en: 'Causing Death by Rash or Negligent Act',
    title_mr: 'निष्काळजीपणा किंवा अविचाराने मृत्यू घडवणे',
    bnsSection: 'BNS 106(1)',
    oldIpcSection: 'IPC 304A',
    maxPunishmentYears: 5,
    cognizable: true,
    category: 'Traffic & Negligence',
    tags: ['Negligent Death', 'Accident', 'Rash Driving', 'Motor Vehicle', '106'],
    factsDefaults: {
      searchLikely: true,
      arrestLikely: false,
      electronicEvidenceLikely: false,
      womanVictim: false,
      childVictim: false,
      injuryOrDeath: true,
    },
    description_en:
      'Causing death of any person by doing any rash or negligent act not amounting to culpable homicide, notably vehicle accidents. The offence is cognizable and carries imprisonment for a term which may extend to five years, and shall also be liable to fine.',
    description_mr:
      'सदोष मनुष्यवधात न मोडणाऱ्या कोणत्याही अविचाराच्या किंवा निष्काळजी कृत्याने (उदा. रस्ते अपघात) एखाद्या व्यक्तीचा मृत्यू घडवणे. हा दखलपात्र गुन्हा असून यासाठी कमाल ५ वर्षांपर्यंत कारावास आणि दंड अशी शिक्षा विहित आहे.',
    watchOut_en: [
      'Inspect the accident spot immediately, prepare a spot panchnama with audio-video recording, and seize offending vehicle (BNSS 103, 105).',
      'Since punishment is under 7 years, consider issuing notice of appearance under BNSS 35(3) before initiating arrest.',
      'Send the seized vehicle for mechanical inspection and maintain daily entries in the case diary (BNSS 106, 192).',
    ],
    watchOut_mr: [
      'घटनास्थळाची तात्काळ पाहणी करा, व्हिडिओ चित्रीकरणासह घटनास्थळ पंचनामा करा आणि वाहन जप्त करा (BNSS १०३, १०५).',
      'शिक्षा ५ वर्षांपर्यंत असल्याने थेट अटक टाळून BNSS ३५(३) अन्वये हजेरीची नोटीस देण्याचा विचार करा.',
      'जप्त वाहनाची आरटीओ / मेकॅनिकल तपासणी करून घ्या आणि दररोज केस डायरी अद्ययावत ठेवा (BNSS १०६, १९२).',
    ],
    extraStepIds: [
      'step_bnss_103_105_search_video',
      'step_bnss_35_3_notice',
      'step_bnss_106_report_seizure',
    ],
    verified: false,
  },

  // 22. Identity theft (computer) | IT Act 66C | new offence | 3 | yes | cyber, electronic evidence
  {
    id: 'offence_identity_theft_it_66c',
    title_en: 'Identity Theft (Computer)',
    title_mr: 'ओळख चोरी (संगणक)',
    bnsSection: 'IT Act 66C',
    oldIpcSection: 'New Offence',
    maxPunishmentYears: 3,
    cognizable: true,
    category: 'Cyber',
    tags: ['Identity Theft', 'Cybercrime', 'IT Act', 'Electronic Evidence', '66C'],
    factsDefaults: {
      electronicEvidenceLikely: true,
      cyberLikely: true,
      searchLikely: false,
      arrestLikely: false,
      womanVictim: false,
      childVictim: false,
    },
    description_en:
      'Identity theft involves fraudulently or dishonestly making use of the electronic signature, password, or unique identification feature of another person. The offence is cognizable and carries imprisonment for a term which may extend to three years and fine up to one lakh rupees.',
    description_mr:
      'कोणत्याही व्यक्तीची इलेक्ट्रॉनिक स्वाक्षरी, पासवर्ड किंवा युनिक आयडेंटिफिकेशन वैशिष्ट्य लबाडीने किंवा फसवणूक करून वापरणे म्हणजे ओळख चोरी. हा दखलपात्र गुन्हा असून यासाठी कमाल ३ वर्षांपर्यंत कारावास आणि एक लाख रुपयांपर्यंत दंड अशी शिक्षा विहित आहे.',
    watchOut_en: [
      'For digital credentials, do not alter device, compute SHA-256 hash immediately, and obtain certificate under Section 63 BSA.',
      'Report on national cybercrime portal and issue notice to intermediaries or platforms to preserve logs (IT Act 67C, BNSS 94).',
      'Since punishment is up to 3 years, issue notice of appearance under BNSS 35(3) instead of automatic arrest.',
    ],
    watchOut_mr: [
      'डिजिटल क्रेडेंशियल्ससाठी उपकरणात बदल न करता तात्काळ SHA-256 हॅश नोंदवा आणि BSA कलम ६३ प्रमाणपत्र प्राप्त करा.',
      'राष्ट्रीय सायबर पोर्टलवर नोंद करा आणि मध्यस्थांना सर्व्हर लॉग जतन करण्यासाठी नोटीस द्या (IT Act 67C, BNSS ९४).',
      'शिक्षा ३ वर्षांपर्यंत असल्याने थेट अटकेऐवजी BNSS ३५(३) अन्वये हजेरीची नोटीस देण्याची पद्धत वापरा.',
    ],
    extraStepIds: [
      'step_bsa_61_63_electronic_record',
      'step_cyber_fraud_freeze',
      'step_bnss_35_3_notice',
    ],
    verified: false,
  },

  // 23. Cheating by personation using a computer resource | IT Act 66D | new offence | 3 | yes | cyber, electronic evidence
  {
    id: 'offence_cheating_personation_it_66d',
    title_en: 'Cheating by Personation Using Computer Resource',
    title_mr: 'संगणक साधनाद्वारे तोतयागिरी करून फसवणूक',
    bnsSection: 'IT Act 66D',
    oldIpcSection: 'New Offence',
    maxPunishmentYears: 3,
    cognizable: true,
    category: 'Cyber',
    tags: ['Cheating by Personation', 'Impersonation', 'Cyber Fraud', 'IT Act', '66D'],
    factsDefaults: {
      electronicEvidenceLikely: true,
      cyberLikely: true,
      searchLikely: false,
      arrestLikely: false,
      womanVictim: false,
      childVictim: false,
    },
    description_en:
      'Cheating by personation involves using any computer resource or communication device to deceive or cheat another person by pretending to be someone else. The offence is cognizable and carries imprisonment for a term up to three years and fine up to one lakh rupees.',
    description_mr:
      'कोणत्याही संगणक अथवा मोबाईल साधनाद्वारे दुसऱ्या व्यक्तीचे सोंग घेऊन किंवा तोतयागिरी करून लोकांची फसवणूक करणे. हा दखलपात्र गुन्हा असून यासाठी कमाल ३ वर्षांपर्यंत कारावास आणि एक लाख रुपयांपर्यंत दंड अशी शिक्षा विहित आहे.',
    watchOut_en: [
      'If monetary loss occurred, report on 1930 portal, request immediate bank freeze, and serve preservation notice (BNSS 94).',
      'Secure IP logs, WhatsApp and email headers, and transaction receipts, obtaining mandatory certificates under BSA 63.',
      'Offence carries 3 years: consider issuing notice of appearance under BNSS 35(3) prior to effecting physical arrest.',
    ],
    watchOut_mr: [
      'आर्थिक नुकसान झाले असल्यास तात्काळ १९३० वर नोंद करा, बँक खाती गोठवण्याची विनंती करा आणि नोटीस द्या (BNSS ९४).',
      'आयपी लॉग, व्हॉट्सअॅप व ईमेल हेडर सुरक्षित करून BSA कलम ६३ चे कायदेशीर प्रमाणपत्र अनिवार्यपणे तयार करा.',
      'शिक्षा ३ वर्षांपर्यंत असल्याने थेट अटक न करता प्रथम BNSS ३५(३) अन्वये हजेरीची नोटीस देण्याचा विचार करा.',
    ],
    extraStepIds: [
      'step_cyber_fraud_freeze',
      'step_bsa_61_63_electronic_record',
      'step_bnss_35_3_notice',
    ],
    verified: false,
  },

  // 24. Publishing or transmitting obscene material in electronic form | IT Act 67 | new offence | 3 | yes | cyber, electronic evidence
  {
    id: 'offence_obscene_material_it_67',
    title_en: 'Publishing or Transmitting Obscene Material in Electronic Form',
    title_mr: 'इलेक्ट्रॉनिक स्वरूपात अश्लील साहित्य प्रसिद्ध वा प्रसारित करणे',
    bnsSection: 'IT Act 67',
    oldIpcSection: 'New Offence',
    maxPunishmentYears: 3,
    cognizable: true,
    category: 'Cyber',
    tags: ['Obscene Material', 'Cybercrime', 'IT Act', 'Electronic Records', '67'],
    factsDefaults: {
      electronicEvidenceLikely: true,
      cyberLikely: true,
      searchLikely: false,
      arrestLikely: false,
      womanVictim: false,
      childVictim: false,
    },
    description_en:
      'Publishing or transmitting in electronic form any material which is lascivious or appeals to prurient interest. The offence is cognizable on first conviction and carries imprisonment up to three years and fine up to five lakh rupees.',
    description_mr:
      'कामुक किंवा अश्लील स्वरूपाचे कोणतेही साहित्य इलेक्ट्रॉनिक माध्यमातून प्रसिद्ध करणे, प्रसारित करणे किंवा इतरांना पाठवणे. पहिल्या गुन्ह्यासाठी हा दखलपात्र गुन्हा असून कमाल ३ वर्षांपर्यंत कारावास आणि ५ लाख रुपयांपर्यंत दंड अशी शिक्षा विहित आहे.',
    watchOut_en: [
      'Do not alter digital files; capture hash value immediately, preserve device state, and prepare Section 63 BSA certificate.',
      'Issue preservation notice to intermediaries and social media service providers under IT Act Section 67C and BNSS 94.',
      'For punishment under 7 years, evaluate issuing notice of appearance under BNSS 35(3) prior to considering arrest.',
    ],
    watchOut_mr: [
      'इलेक्ट्रॉनिक फाईलमध्ये बदल करू नका; तात्काळ हॅश नोंदवा, फोन जतन करा आणि BSA कलम ६३ चे प्रमाणपत्र तयार करा.',
      'सोशल मीडिया प्लॅटफॉर्म आणि मध्यस्थांना IT Act ६७C व BNSS ९४ अन्वये डेटा सुरक्षित ठेवण्यासाठी नोटीस द्या.',
      'शिक्षा ३ वर्षांपर्यंत असल्याने अटकेऐवजी प्रथम BNSS ३५(३) अन्वये हजेरीची नोटीस देण्याचा विचार करा.',
    ],
    extraStepIds: [
      'step_bsa_61_63_electronic_record',
      'step_cyber_fraud_freeze',
      'step_bnss_35_3_notice',
    ],
    verified: false,
  },
];

export interface OffenceValidationResult {
  valid: boolean;
  totalOffences: number;
  offencesByCategory: Record<string, number>;
  errors: string[];
  warnings: string[];
  checkedStepIdsCount: number;
}

/**
 * Validates the offence dataset against statutory consistency and integrity rules:
 * - Uniqueness of offence IDs
 * - Bilingual titles and descriptions
 * - Exactly 3 watchOut tips in English and Marathi
 * - Valid step IDs matching GENERAL_PROCEDURE_STEPS
 * - verified is strictly false
 * - Category breakdown counts
 */
export function validateOffencesData(
  offences: Offence[] = OFFENCES_DATA,
  steps: ProcedureStep[] = GENERAL_PROCEDURE_STEPS
): OffenceValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();
  const validStepIds = new Set(steps.map((s) => s.id));
  const offencesByCategory: Record<string, number> = {};
  let totalCheckedSteps = 0;

  for (const offence of offences) {
    // Category counter
    const category = offence.category || 'Other';
    offencesByCategory[category] = (offencesByCategory[category] || 0) + 1;

    // 1. Unique ID
    if (seenIds.has(offence.id)) {
      errors.push(`Duplicate offence ID found: "${offence.id}"`);
    }
    seenIds.add(offence.id);

    // 2. Bilingual titles
    if (!offence.title_en?.trim()) {
      errors.push(`Offence "${offence.id}" missing English title.`);
    }
    if (!offence.title_mr?.trim()) {
      errors.push(`Offence "${offence.id}" missing Marathi title.`);
    }

    // 3. Bilingual descriptions
    if (!offence.description_en?.trim()) {
      errors.push(`Offence "${offence.id}" missing English description.`);
    }
    if (!offence.description_mr?.trim()) {
      errors.push(`Offence "${offence.id}" missing Marathi description.`);
    }

    // 4. Watchout tips (3 bullets in both languages)
    if (!Array.isArray(offence.watchOut_en) || offence.watchOut_en.length !== 3) {
      errors.push(`Offence "${offence.id}" must have exactly 3 English watchOut tips (found ${offence.watchOut_en?.length || 0}).`);
    }
    if (!Array.isArray(offence.watchOut_mr) || offence.watchOut_mr.length !== 3) {
      errors.push(`Offence "${offence.id}" must have exactly 3 Marathi watchOut tips (found ${offence.watchOut_mr?.length || 0}).`);
    }

    // 5. Valid extraStepIds
    for (const stepId of offence.extraStepIds) {
      totalCheckedSteps++;
      if (!validStepIds.has(stepId)) {
        errors.push(`Offence "${offence.id}" references invalid step ID: "${stepId}".`);
      }
    }

    // 6. Strict unverified check
    if (offence.verified !== false) {
      errors.push(`Offence "${offence.id}" must have verified: false.`);
    }
  }

  return {
    valid: errors.length === 0,
    totalOffences: offences.length,
    offencesByCategory,
    errors,
    warnings,
    checkedStepIdsCount: totalCheckedSteps,
  };
}

// Backward compatibility export alias
export const SAMPLE_OFFENCES = OFFENCES_DATA;
