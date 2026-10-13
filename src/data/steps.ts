import { ProcedureStep, Provision } from './types.ts';

const createProv = (
  act: Provision['act'],
  section: string,
  title_en: string,
  title_mr: string,
  summary_en: string,
  summary_mr: string,
  subSection?: string
): Provision => ({
  act,
  section,
  subSection,
  title_en,
  title_mr,
  summary_en,
  summary_mr,
  verified: false,
});

export const GENERAL_PROCEDURE_STEPS: ProcedureStep[] = [
  // 1. FIR Registration
  {
    id: 'step_bnss_173_1_fir',
    phase: 'Registration',
    text_en: 'Register FIR for a cognizable offence; Zero FIR if the offence is in another jurisdiction and then transfer it.',
    text_mr: 'दखलपात्र गुन्ह्यासाठी प्रथम खबर अहवाल (FIR) नोंदवा; गुन्हा इतर कार्यक्षेत्रातील असल्यास झिरो एफआयआर नोंदवून वर्ग करा.',
    why_en: 'Mandatory statutory duty upon receiving information of a cognizable offence.',
    why_mr: 'दखलपात्र गुन्ह्याची माहिती मिळाल्यावर एफआयआर नोंदवणे अनिवार्य कायदेशीर कर्तव्य आहे.',
    legalRefs: [
      createProv('BNSS', '173', 'Information in cognizable cases', 'दखलपात्र प्रकरणांमधील माहिती', 'Registration of FIR or Zero FIR', 'एफआयआर किंवा झिरो एफआयआर नोंदणी', '1'),
    ],
    mandatory: true,
    condition: { fact: 'cognizable', eq: true },
    needsEvidence: false,
    verified: false,
  },

  // 2. Free copy of FIR
  {
    id: 'step_bnss_173_2_free_copy',
    phase: 'Registration',
    text_en: 'Give a free copy of the FIR to the informant.',
    text_mr: 'फिर्यादीला एफआयआरची एक प्रत मोफत तात्काळ द्या.',
    why_en: 'Statutory mandate under BNSS Section 173(2) to provide immediate free copy to the informant.',
    why_mr: 'BNSS कलम १७३(२) नुसार फिर्यादीला तात्काळ मोफत प्रत देणे बंधनकारक आहे.',
    legalRefs: [
      createProv('BNSS', '173', 'Free copy of FIR', 'एफआयआरची मोफत प्रत', 'A copy of FIR shall be given forthwith free of cost', 'एफआयआरची प्रत तात्काळ विनामूल्य दिली पाहिजे', '2'),
    ],
    mandatory: true,
    condition: { fact: 'cognizable', eq: true },
    documentTemplateId: 'fir_copy_acknowledgement',
    needsEvidence: false,
    verified: false,
  },

  // 3. e-FIR Signature
  {
    id: 'step_bnss_173_1_efir_sign',
    phase: 'Registration',
    text_en: 'For an e-FIR, get the informant\'s signature within 3 days.',
    text_mr: 'ई-एफआयआर (इलेक्ट्रॉनिक संप्रेषण) असल्यास, ३ दिवसांच्या आत फिर्यादीची स्वाक्षरी घ्या.',
    why_en: 'Statutory requirement under BNSS 173(1) for electronic communication to be signed before it is taken on record.',
    why_mr: 'इलेक्ट्रॉनिक पद्धतीने पाठवलेली माहिती ३ दिवसांत स्वाक्षरी झाल्यावरच अधिकृत नोंद घेतली जाते.',
    legalRefs: [
      createProv('BNSS', '173', 'Signature on electronic communication', 'इलेक्ट्रॉनिक संप्रेषणावर स्वाक्षरी', 'Information given on electronic communication must be signed within 3 days', '३ दिवसांच्या आत स्वाक्षरी घेणे बंधनकारक', '1'),
    ],
    mandatory: true,
    condition: { fact: 'isEFIR', eq: true },
    needsEvidence: false,
    verified: false,
  },

  // 4. Preliminary Enquiry
  {
    id: 'step_bnss_173_3_prelim_enquiry',
    phase: 'Registration',
    text_en: 'For offences punishable with 3 years or more but less than 7, a preliminary enquiry may be held within 14 days with prior permission of an officer not below Deputy Superintendent.',
    text_mr: '३ ते ७ वर्षांपर्यंत शिक्षेच्या गुन्ह्यांत, पोलीस उपअधीक्षक दर्जाच्या अधिकाऱ्याच्या पूर्वपरवानगीने १४ दिवसांच्या आत प्राथमिक चौकशी करता येईल.',
    why_en: 'Discretionary preliminary enquiry under BNSS Section 173(3) to ascertain whether a prima facie case exists.',
    why_mr: 'प्रथमदर्शनी गुन्हा घडल्याची खात्री करण्यासाठी १४ दिवसांत प्राथमिक चौकशीची कायदेशीर तरतूद.',
    legalRefs: [
      createProv('BNSS', '173', 'Preliminary enquiry', 'प्राथमिक चौकशी', 'Preliminary enquiry within 14 days for offences 3 to 7 years with DySP permission', 'उपअधीक्षक परवानगीने १४ दिवसांत प्राथमिक चौकशी', '3'),
    ],
    mandatory: false,
    condition: {
      all: [
        { fact: 'maxPunishmentYears', gte: 3 },
        { fact: 'maxPunishmentYears', lt: 7 },
      ],
    },
    needsEvidence: false,
    verified: false,
  },

  // 5. Non-cognizable entry
  {
    id: 'step_bnss_174_non_cog',
    phase: 'Registration',
    text_en: 'Where the offence is non-cognizable, enter it in the register and refer the informant to the Magistrate.',
    text_mr: 'गुन्हा अदखलपात्र असल्यास, त्याची नोंदवहीत नोंद करा आणि फिर्यादीला दंडाधिकाऱ्यांकडे पाठवा.',
    why_en: 'Police cannot investigate a non-cognizable case without the order of a Magistrate under BNSS Section 174.',
    why_mr: 'अदखलपात्र गुन्ह्यात दंडाधिकाऱ्यांच्या आदेशाशिवाय तपास करता येत नाही (BNSS कलम १७४).',
    legalRefs: [
      createProv('BNSS', '174', 'Information as to non-cognizable cases', 'अदखलपात्र प्रकरणांमधील माहिती', 'Entry in NC register and referral to Magistrate', 'नोंदवहीत नोंद व दंडाधिकाऱ्यांकडे पाठवणे'),
    ],
    mandatory: true,
    condition: { fact: 'cognizable', eq: false },
    needsEvidence: false,
    verified: false,
  },

  // 6. Woman victim: recorded by woman officer
  {
    id: 'step_bnss_173_1_woman_recorder',
    phase: 'Registration',
    text_en: 'Woman victim of specified offences: information recorded by a woman police officer.',
    text_mr: 'महिला पीडित असल्यास: विहित गुन्ह्यांची माहिती महिला पोलीस अधिकाऱ्यानेच नोंदवली पाहिजे.',
    why_en: 'Statutory mandate under BNSS Section 173(1) proviso ensuring dignity and protection for woman victims.',
    why_mr: 'BNSS कलम १७३(१) परंतुकानुसार महिला अधिकाऱ्याकडूनच माहिती नोंदवणे बंधनकारक आहे.',
    legalRefs: [
      createProv('BNSS', '173', 'Woman officer recording', 'महिला अधिकाऱ्याकडून नोंदणी', 'Information by woman victim shall be recorded by a woman police officer', 'महिला अधिकाऱ्याने नोंद केली पाहिजे', '1 proviso'),
    ],
    mandatory: true,
    condition: { fact: 'womanVictim', eq: true },
    needsEvidence: false,
    verified: false,
  },

  // 7. Forensic visit for offences >= 7 years
  {
    id: 'step_bnss_176_3_forensic_visit',
    phase: 'Investigation',
    text_en: 'Visit and secure the scene. For offences punishable with 7 years or more, a forensic expert must visit and collect evidence, with scene videography.',
    text_mr: 'घटनास्थळाची पाहणी व सुरक्षा. ७ वर्षे किंवा त्याहून अधिक शिक्षेच्या गुन्ह्यांत फॉरेन्सिक तज्ज्ञाने भेट देऊन पुरावा गोळा केला पाहिजे आणि व्हिडिओ चित्रीकरण अनिवार्य आहे.',
    why_en: 'Mandatory statutory duty under BNSS Section 176(3) for forensic expert visit and scene videography in serious offences.',
    why_mr: 'BNSS कलम १७६(३) नुसार ७ वर्षे किंवा अधिक शिक्षेच्या गुन्ह्यांत फॉरेन्सिक भेट व व्हिडिओ अनिवार्य.',
    legalRefs: [
      createProv('BNSS', '176', 'Forensic expert visit', 'फॉरेन्सिक तज्ज्ञ भेट', 'Mandatory forensic expert visit and videography for offences >= 7 years', '७ वर्षे किंवा अधिक शिक्षेसाठी फॉरेन्सिक भेट व व्हिडिओ', '3'),
    ],
    mandatory: true,
    condition: { fact: 'maxPunishmentYears', gte: 7 },
    needsEvidence: true,
    verified: false,
  },

  // 8. Witness Statements (180, 183)
  {
    id: 'step_bnss_180_183_witness',
    phase: 'Statements',
    text_en: 'Record statements of witnesses (BNSS 180). Statement before a Magistrate where needed (BNSS 183).',
    text_mr: 'साक्षीदारांचे जबाब नोंदवा (BNSS १८०). आवश्यक असल्यास दंडाधिकाऱ्यांसमोर जबाब नोंदवा (BNSS १८३).',
    why_en: 'Statutory recording of witness statements and judicial Magistrate statements under BNSS Sections 180 and 183.',
    why_mr: 'तपासादरम्यान साक्षीदारांचे जबाब नोंदवण्याची कायदेशीर प्रक्रिया.',
    legalRefs: [
      createProv('BNSS', '180', 'Examination of witnesses by police', 'पोलिसांकडून साक्षीदारांची तपासणी', 'Recording of statements by police', 'पोलीस जबाब नोंदणी'),
      createProv('BNSS', '183', 'Recording of confessions and statements', 'जबाब व कबुलीजबाब नोंदवणे', 'Statement recorded before Magistrate', 'दंडाधिकाऱ्यांसमोर जबाब'),
    ],
    mandatory: true,
    needsEvidence: false,
    verified: false,
  },

  // 9. Case Diary Daily
  {
    id: 'step_bnss_192_case_diary',
    phase: 'Investigation',
    text_en: 'Maintain the case diary daily (BNSS 192).',
    text_mr: 'तपास दैनंदिनी (केस डायरी) दररोज अद्ययावत ठेवा (BNSS १९२).',
    why_en: 'Mandatory daily record of day-to-day proceedings in investigation under BNSS Section 192.',
    why_mr: 'BNSS कलम १९२ नुसार तपासाच्या दैनंदिन कामकाजाची नोंद केस डायरीत ठेवणे बंधनकारक आहे.',
    legalRefs: [
      createProv('BNSS', '192', 'Diary of proceedings in investigation', 'तपासाच्या कामकाजाची दैनंदिनी', 'Every police officer making investigation shall enter day by day', 'दररोज कामकाजाची नोंद ठेवली पाहिजे'),
    ],
    mandatory: true,
    needsEvidence: false,
    verified: false,
  },

  // 10. Notice of Appearance (35(3))
  {
    id: 'step_bnss_35_3_notice',
    phase: 'Arrest',
    text_en: 'Arrest: for offences below 7 years consider notice of appearance first (BNSS 35(3)).',
    text_mr: 'अटक: ७ वर्षांपेक्षा कमी शिक्षेच्या गुन्ह्यांत प्रथम हजेरीची नोटीस देण्याचा विचार करा (BNSS ३५(३)).',
    why_en: 'Statutory mandate to avoid unnecessary arrests when punishment is less than 7 years, issuing Section 35 notice of appearance.',
    why_mr: '७ वर्षांपेक्षा कमी शिक्षा असलेल्या गुन्ह्यांत विनाकारण अटक न करता हजेरीची नोटीस देण्याची तरतूद.',
    legalRefs: [
      createProv('BNSS', '35', 'Notice of appearance', 'हजेरीची नोटीस', 'Notice of appearance before police officer where arrest is not required', 'अटक आवश्यक नसल्यास हजेरीची नोटीस', '3'),
    ],
    mandatory: true,
    condition: { fact: 'maxPunishmentYears', lt: 7 },
    documentTemplateId: 'notice_appearance_bnss_35',
    needsEvidence: false,
    verified: false,
  },

  // 11. Arrest Memo
  {
    id: 'step_bnss_36_arrest_memo',
    phase: 'Arrest',
    text_en: 'Prepare arrest memo, attested by a witness and signed by the arrested person (BNSS 36 and D.K. Basu guidelines).',
    text_mr: 'अटक मेमो तयार करा, साक्षीदाराची स्वाक्षरी घ्या आणि अटक केलेल्या व्यक्तीची सही घ्या (BNSS ३६ व डी.के. बसू मार्गदर्शक तत्त्वे).',
    why_en: 'Mandatory statutory duty under BNSS Section 36 to prepare an arrest memo attested by a respectable member of the locality or family.',
    why_mr: 'BNSS कलम ३६ व सर्वोच्च न्यायालयाच्या डी.के. बसू निकालानुसार अटक मेमो कायदेशीर संरक्षण आहे.',
    legalRefs: [
      createProv('BNSS', '36', 'Procedure of arrest and duties of officer', 'अटकेची कार्यपद्धती व अधिकाऱ्याची कर्तव्ये', 'Arrest memo preparation, attestation, and counter-signature', 'अटक मेमो तयार करणे व स्वाक्षरी'),
    ],
    mandatory: true,
    condition: { fact: 'arrestMade', eq: true },
    documentTemplateId: 'arrest_memo_bnss_36',
    needsEvidence: false,
    verified: false,
  },

  // 12. Inform grounds & nominated person
  {
    id: 'step_bnss_47_48_inform',
    phase: 'Arrest',
    text_en: 'Inform grounds of arrest (BNSS 47) and inform a nominated person (BNSS 48).',
    text_mr: 'अटकेची कारणे सांगा (BNSS ४७) आणि आरोपीने नामनिर्देशित केलेल्या नातेवाईकास/मित्रास तात्काळ कळवा (BNSS ४८).',
    why_en: 'Constitutional and statutory right under BNSS Sections 47 & 48 to communicate arrest grounds and inform a designated relative/friend.',
    why_mr: 'अटकेचे कारण आणि जवळच्या व्यक्तीस अटकेची माहिती देणे हा आरोपीचा कायदेशीर हक्क आहे.',
    legalRefs: [
      createProv('BNSS', '47', 'Person arrested to be informed of grounds', 'अटक केलेल्या व्यक्तीला कारणे सांगणे', 'Right to be informed of grounds of arrest and bail', 'अटकेची कारणे व जामीन हक्क कळवणे'),
      createProv('BNSS', '48', 'Obligation to inform relative/friend', 'नातेवाईक/मित्राला कळवण्याचे बंधन', 'Obligation of person making arrest to inform designated person', 'अटक केल्याची माहिती नामनिर्देशित व्यक्तीला देणे'),
    ],
    mandatory: true,
    condition: { fact: 'arrestMade', eq: true },
    documentTemplateId: 'arrest_intimation',
    needsEvidence: false,
    verified: false,
  },

  // 13. Medical Exam of Arrested Person
  {
    id: 'step_bnss_53_medical_arrestee',
    phase: 'Medical',
    text_en: 'Medical examination of the arrested person (BNSS 53).',
    text_mr: 'अटक केलेल्या आरोपीची शासकीय वैद्यकीय अधिकाऱ्याकडून तपासणी करून घ्या (BNSS ५३).',
    why_en: 'Statutory requirement under BNSS Section 53 to examine the arrested person by a medical officer soon after arrest.',
    why_mr: 'अटक केल्यानंतर आरोपीची तातडीने वैद्यकीय तपासणी करून अहवाल नोंदवणे अनिवार्य आहे.',
    legalRefs: [
      createProv('BNSS', '53', 'Examination of arrested person by medical officer', 'वैद्यकीय अधिकाऱ्याकडून आरोपीची तपासणी', 'Mandatory medical examination of accused after arrest', 'अटकेनंतर आरोपीची अनिवार्य वैद्यकीय तपासणी'),
    ],
    mandatory: true,
    condition: { fact: 'arrestMade', eq: true },
    documentTemplateId: 'medical_exam_request',
    needsEvidence: true,
    verified: false,
  },

  // 14. 24-hour Magistrate Production
  {
    id: 'step_bnss_58_magistrate_24h',
    phase: 'Arrest',
    text_en: 'Produce the arrested person before the Magistrate within 24 hours excluding travel time (BNSS 58, Article 22(2) of the Constitution).',
    text_mr: 'प्रवासाचा वेळ वगळून २४ तासांच्या आत अटक केलेल्या आरोपीला दंडाधिकाऱ्यांसमोर हजर करा (BNSS ५८, संविधानाचे कलम २२(२)).',
    why_en: 'Strict constitutional mandate under Article 22(2) and BNSS Section 58 against unlawful detention beyond 24 hours.',
    why_mr: 'संविधानाचे कलम २२(२) व BNSS कलम ५८ नुसार २४ तासांपेक्षा जास्त बेकायदेशीर कोठडीत ठेवता येत नाही.',
    legalRefs: [
      createProv('BNSS', '58', 'Person arrested not to be detained more than twenty-four hours', '२४ तासांपेक्षा जास्त डांबून न ठेवणे', 'Production before Magistrate within 24 hours', '२४ तासांत दंडाधिकाऱ्यांसमोर हजर करणे'),
      createProv('Constitution', '22', 'Protection against arrest and detention', 'अटकेविरुद्ध संरक्षण', 'Right to be produced before nearest Magistrate within 24 hours', '२४ तासांत दंडाधिकाऱ्यांसमोर हजर राहण्याचा मूलभूत हक्क', '2'),
    ],
    mandatory: true,
    condition: { fact: 'arrestMade', eq: true },
    needsEvidence: false,
    verified: false,
  },

  // 15. Search & Audio-Video Recording (103, 105)
  {
    id: 'step_bnss_103_105_search_video',
    phase: 'SearchSeizure',
    text_en: 'Search with two independent witnesses (BNSS 103) and record the search and seizure on audio-video, forwarding the recording to the Magistrate without delay (BNSS 105).',
    text_mr: 'दोन स्वतंत्र पंचांच्या उपस्थितीत झडती घ्या (BNSS १०३) आणि झडती-जप्तीचे ऑडिओ-व्हिडिओ चित्रीकरण करा व चित्रीकरण विनाविलंब दंडाधिकाऱ्यांना पाठवा (BNSS १०५).',
    why_en: 'Mandatory new BNSS 105 requirement: the process of search and seizure shall be recorded through audio-video electronic means.',
    why_mr: 'BNSS कलम १०५ ची नवीन अनिवार्य तरतूद: झडती व जप्ती प्रक्रियेचे ऑडिओ-व्हिडिओ चित्रीकरण करणे आवश्यक आहे.',
    legalRefs: [
      createProv('BNSS', '103', 'Search in presence of witnesses', 'साक्षीदारांच्या उपस्थितीत झडती', 'Search in presence of two or more independent witnesses', 'दोन स्वतंत्र पंचांसमक्ष झडती'),
      createProv('BNSS', '105', 'Recording of search and seizure through audio-video electronic means', 'ऑडिओ-व्हिडिओ इलेक्ट्रॉनिक साधनांद्वारे झडती व जप्तीचे चित्रीकरण', 'Mandatory audio-video recording of search and seizure', 'झडती व जप्तीचे अनिवार्य व्हिडिओ चित्रीकरण'),
    ],
    mandatory: true,
    condition: {
      any: [
        { fact: 'searchConducted', eq: true },
        { fact: 'seizureMade', eq: true },
      ],
    },
    needsEvidence: true,
    verified: false,
  },

  // 16. Seizure List / Panchnama
  {
    id: 'step_bnss_103_seizure_list',
    phase: 'SearchSeizure',
    text_en: 'Prepare a seizure list or panchnama and give a copy to the occupant (BNSS 103).',
    text_mr: 'जप्ती यादी किंवा पंचनामा तयार करा आणि जागेच्या भोगवटादारास/ताबेदारास त्याची एक प्रत द्या (BNSS १०३).',
    why_en: 'Statutory duty under BNSS Section 103 to deliver a list of all things seized signed by witnesses to the occupant.',
    why_mr: 'जप्त केलेल्या सर्व वस्तूंची पंचांनी स्वाक्षरी केलेली यादी संबंधितास देणे बंधनकारक आहे.',
    legalRefs: [
      createProv('BNSS', '103', 'Copy of list to occupant', 'ताबेदाराला यादीची प्रत', 'Copy of seizure list to be delivered to occupant or person searched', 'जप्ती यादीची प्रत संबंधितास देणे'),
    ],
    mandatory: true,
    condition: { fact: 'seizureMade', eq: true },
    documentTemplateId: 'seizure_memo_bnss_103',
    needsEvidence: false,
    verified: false,
  },

  // 17. Report Seizure to Magistrate (106)
  {
    id: 'step_bnss_106_report_seizure',
    phase: 'SearchSeizure',
    text_en: 'Report the seizure to the Magistrate and keep property in safe custody (BNSS 106).',
    text_mr: 'जप्तीची माहिती दंडाधिकाऱ्यांना तात्काळ कळवा आणि जप्त मालमत्ता सुरक्षित कोठडीत (मालखान्यात) ठेवा (BNSS १०६).',
    why_en: 'Statutory obligation under BNSS Section 106 to report property seized to Magistrate having jurisdiction.',
    why_mr: 'जप्त मालमत्तेबाबत दंडाधिकाऱ्यांना अहवाल देणे आणि सुरक्षित मालखान्यात ठेवणे.',
    legalRefs: [
      createProv('BNSS', '106', 'Report of seizure to Magistrate', 'जप्तीचा दंडाधिकाऱ्यांना अहवाल', 'Seizure of property to be reported forthwith to Magistrate', 'जप्तीचा अहवाल दंडाधिकाऱ्यांना तात्काळ देणे'),
    ],
    mandatory: true,
    condition: { fact: 'seizureMade', eq: true },
    needsEvidence: false,
    verified: false,
  },

  // 18. Electronic Evidence & BSA 63 Certificate
  {
    id: 'step_bsa_61_63_electronic_record',
    phase: 'Evidence',
    text_en: 'Electronic evidence: do not alter the device, record the hash value, photograph the device state, keep chain of custody, and prepare the certificate under BSA 63 (Part A by the person in charge, Part B by the expert), see BSA 61 to 63.',
    text_mr: 'इलेक्ट्रॉनिक पुरावा: उपकरणात बदल करू नका, हॅश मूल्य नोंदवा, उपकरणाच्या स्थितीचे छायाचित्र घ्या, ताबा साखळी ठेवा आणि BSA कलम ६३ चे प्रमाणपत्र तयार करा (भाग अ - ताबेदार, भाग ब - तज्ज्ञ).',
    why_en: 'Admissibility of electronic records under Bharatiya Sakshya Adhiniyam 2023 Sections 61, 62, 63 strictly requires hash integrity and Certificate.',
    why_mr: 'BSA कलम ६३ नुसार इलेक्ट्रॉनिक पुरावा न्यायालयात ग्राह्य धरण्यासाठी हॅश व्हॅल्यू आणि प्रमाणपत्र अनिवार्य आहे.',
    legalRefs: [
      createProv('BSA', '61', 'Electronic records', 'इलेक्ट्रॉनिक अभिलेख', 'Admissibility of electronic records', 'इलेक्ट्रॉनिक अभिलेखांची ग्राह्यता'),
      createProv('BSA', '63', 'Admissibility of electronic records and Certificate', 'इलेक्ट्रॉनिक अभिलेखांची ग्राह्यता व प्रमाणपत्र', 'Mandatory Certificate for electronic evidence (Part A and Part B)', 'इलेक्ट्रॉनिक पुराव्यासाठी अनिवार्य प्रमाणपत्र'),
    ],
    mandatory: true,
    condition: { fact: 'electronicEvidence', eq: true },
    documentTemplateId: 'bsa_63_certificate',
    needsEvidence: true,
    verified: false,
  },

  // 19. Forensic Lab Samples
  {
    id: 'step_forensic_samples_seal',
    phase: 'Evidence',
    text_en: 'Send samples to the forensic lab with proper sealing and a forwarding note; log each transfer in the chain of custody.',
    text_mr: 'नमुने योग्य सील करून व अग्रेषित पत्रासह न्यायवैद्यक प्रयोगशाळेत (FSL) पाठवा; प्रत्येक हस्तांतरणाची ताबा साखळी नोंदवहीत नोंद करा.',
    why_en: 'Chain of custody must be tamper-evident and unbroken for physical and biological evidence.',
    why_mr: 'पुराव्यातील छेडछाड टाळण्यासाठी नमुन्यांचे सील आणि ताबा साखळी अखंड ठेवणे आवश्यक आहे.',
    legalRefs: [
      createProv('BNSS', '176', 'Forensic examination', 'न्यायवैद्यक तपासणी', 'Collection and transmission of forensic samples', 'फॉरेन्सिक नमुने संकलन व पाठवणे'),
    ],
    mandatory: true,
    condition: {
      any: [
        { fact: 'seizureMade', eq: true },
        { fact: 'injuryOrDeath', eq: true },
      ],
    },
    documentTemplateId: 'fsl_forwarding_letter',
    needsEvidence: true,
    verified: false,
  },

  // 20. Rape case medical within 7 days
  {
    id: 'step_bnss_184_rape_medical',
    phase: 'Medical',
    text_en: 'Rape case: medical examination of the victim by a registered medical practitioner, report to the Investigating Officer within 7 days (BNSS 184).',
    text_mr: 'बलात्कार प्रकरण: नोंदणीकृत वैद्यकीय अधिकाऱ्याकडून पीडितेची वैद्यकीय तपासणी, तपास अधिकाऱ्याला ७ दिवसांच्या आत अहवाल पाठवणे (BNSS १८४).',
    why_en: 'Mandatory statutory timeline under BNSS Section 184 for medical examination of rape victim and 7-day report submission.',
    why_mr: 'BNSS कलम १८४ नुसार पीडितेची वैद्यकीय तपासणी करून ७ दिवसांत तपास अधिकाऱ्यास अहवाल देणे बंधनकारक आहे.',
    legalRefs: [
      createProv('BNSS', '184', 'Medical examination of the victim of rape', 'बलात्कार पीडितेची वैद्यकीय तपासणी', 'Medical exam and forwarding report to IO within 7 days', 'वैद्यकीय तपासणी व ७ दिवसांत अहवाल देणे'),
    ],
    mandatory: true,
    condition: { fact: 'rapeCase', eq: true },
    documentTemplateId: 'medical_exam_request',
    needsEvidence: true,
    verified: false,
  },

  // 21. Victim statement of woman
  {
    id: 'step_bnss_176_1_woman_statement',
    phase: 'Statements',
    text_en: 'Victim statement of a woman recorded by a woman police officer (BNSS 176(1) proviso).',
    text_mr: 'महिला पीडितेचा जबाब महिला पोलीस अधिकाऱ्यानेच नोंदवला पाहिजे (BNSS १७६(१) परंतुक).',
    why_en: 'Statutory mandate under BNSS Section 176(1) proviso ensuring woman victim statement is recorded by a woman officer.',
    why_mr: 'BNSS कलम १७६(१) परंतुकानुसार महिला पीडितेचा जबाब महिला अधिकाऱ्याने नोंदवणे बंधनकारक आहे.',
    legalRefs: [
      createProv('BNSS', '176', 'Procedure for investigation', 'तपासाची कार्यपद्धती', 'Statement of woman victim recorded by woman police officer', 'महिला पीडितेचा जबाब महिला अधिकाऱ्याकडून नोंदवणे', '1 proviso'),
    ],
    mandatory: true,
    condition: { fact: 'womanVictim', eq: true },
    needsEvidence: false,
    verified: false,
  },

  // 22. Cyber fraud: 1930 & freeze
  {
    id: 'step_cyber_fraud_freeze',
    phase: 'Cyber',
    text_en: 'Cyber fraud: report on the national cybercrime portal and helpline 1930, ask the bank to freeze the transaction, and preserve electronic records by notice to the intermediary (BNSS 94, IT Act 2000).',
    text_mr: 'सायबर फसवणूक: राष्ट्रीय सायबर पोर्टल व हेल्पलाइन १९३० वर नोंद करा, बँकेला रक्कम गोठवण्यास (freeze) सांगा, आणि मध्यस्थांना नोटीस देऊन इलेक्ट्रॉनिक नोंदी जतन करण्यास सांगा (BNSS ९४, आयटी कायदा २०००).',
    why_en: 'Emergency monetary preservation and preservation of electronic logs under BNSS Section 94 and IT Act.',
    why_mr: 'फसवणुकीची रक्कम वाचवण्यासाठी तातडीने बँक खाते गोठवणे व सर्व्हर लॉग जतन करणे.',
    legalRefs: [
      createProv('BNSS', '94', 'Summons to produce document or other thing', 'दस्तऐवज किंवा वस्तू सादर करण्याचे समन्स', 'Notice to intermediary/bank to produce and preserve records', 'नोंदी जतन करण्यासाठी बँकेला/मध्यस्थांना नोटीस'),
      createProv('ITAct', '67C', 'Preservation and retention of information by intermediaries', 'मध्यस्थांकडून माहितीचे जतन', 'Intermediaries to preserve information for legal inquiry', 'इलेक्ट्रॉनिक नोंदी जतन करण्याचे बंधन'),
    ],
    mandatory: true,
    condition: { fact: 'cyberFraud', eq: true },
    needsEvidence: true,
    verified: false,
  },

  // 23. Police report / chargesheet
  {
    id: 'step_bnss_193_police_report',
    phase: 'Chargesheet',
    text_en: 'File the police report on completion of investigation (BNSS 193). In a rape case, complete within 2 months of recording the information (BNSS 193(2)).',
    text_mr: 'तपास पूर्ण झाल्यावर पोलीस अहवाल (दोषारोपपत्र) दाखल करा (BNSS १९३). बलात्कार प्रकरणात माहिती नोंदवल्यापासून २ महिन्यांच्या आत तपास पूर्ण करा (BNSS १९३(२)).',
    why_en: 'Statutory deadline for filing final police report / chargesheet under BNSS Section 193.',
    why_mr: 'BNSS कलम १९३ नुसार तपास पूर्ण झाल्यावर दोषारोपपत्र दाखल करणे; बलात्कारात २ महिन्यांची मर्यादा.',
    legalRefs: [
      createProv('BNSS', '193', 'Report of police officer on completion of investigation', 'तपास पूर्ण झाल्याचा पोलीस अधिकाऱ्याचा अहवाल', 'Police report completion, 2 months limit for rape cases', 'दोषारोपपत्र व बलात्कार गुन्ह्यांत २ महिन्यांत पूर्ण करणे', '2'),
    ],
    mandatory: true,
    needsEvidence: false,
    verified: false,
  },

  // 24. Progress update to victim within 90 days
  {
    id: 'step_bnss_193_3_progress_update',
    phase: 'VictimRights',
    text_en: 'Inform the informant or victim of the progress of the investigation within 90 days (BNSS 193(3)).',
    text_mr: 'तपासाच्या प्रगतीबद्दल ९० दिवसांच्या आत फिर्यादीला किंवा पीडितेला माहिती द्या (BNSS १९३(३)).',
    why_en: 'Mandatory victim right under BNSS Section 193(3) to receive progress updates within 90 days.',
    why_mr: 'BNSS कलम १९३(३) नुसार तपासाच्या प्रगतीबाबत फिर्यादीला ९० दिवसांत अवगत करणे बंधनकारक आहे.',
    legalRefs: [
      createProv('BNSS', '193', 'Progress of investigation to informant', 'फिर्यादीला तपासाच्या प्रगतीची माहिती', 'Police officer shall inform progress of investigation within 90 days', '९० दिवसांत तपासाची प्रगती कळवणे अनिवार्य', '3'),
    ],
    mandatory: true,
    documentTemplateId: 'progress_update_informant',
    needsEvidence: false,
    verified: false,
  },
];
