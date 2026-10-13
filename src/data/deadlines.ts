import { DeadlineRule } from './types.ts';

export const SEED_DEADLINE_RULES: DeadlineRule[] = [
  // 1. e-FIR Signature: 3 days from information (BNSS 173(1))
  {
    id: 'deadline_efir_signature',
    label_en: 'e-FIR Signature Verification',
    label_mr: 'ई-एफआयआर स्वाक्षरी पडताळणी',
    triggerEvent: 'information_received_electronic',
    duration: 3,
    unit: 'days',
    legalRef: {
      act: 'BNSS',
      section: '173',
      subSection: '1',
      title_en: 'Signature on electronic information',
      title_mr: 'इलेक्ट्रॉनिक माहितीवर स्वाक्षरी',
      summary_en: 'Informant signature must be obtained within three days of electronic communication.',
      summary_mr: 'इलेक्ट्रॉनिक माहिती मिळाल्यापासून ३ दिवसांच्या आत फिर्यादीची सही घेणे आवश्यक आहे.',
      verified: false,
    },
    condition: { fact: 'isEFIR', eq: true },
    severity: 'warning',
    verified: false,
  },

  // 2. Preliminary enquiry: 14 days (BNSS 173(3)) for 3 to <7 years
  {
    id: 'deadline_preliminary_enquiry',
    label_en: 'Preliminary Enquiry Completion',
    label_mr: 'प्राथमिक चौकशी पूर्तता',
    triggerEvent: 'information_received',
    duration: 14,
    unit: 'days',
    legalRef: {
      act: 'BNSS',
      section: '173',
      subSection: '3',
      title_en: 'Preliminary enquiry time limit',
      title_mr: 'प्राथमिक चौकशी कालमर्यादा',
      summary_en: 'Preliminary enquiry may be conducted within 14 days with prior permission of DySP for offences punishable with 3 to 7 years.',
      summary_mr: '३ ते ७ वर्षांच्या शिक्षेच्या गुन्ह्यांत उपअधीक्षकांच्या पूर्वपरवानगीने १४ दिवसांत चौकशी करणे.',
      verified: false,
    },
    condition: {
      all: [
        { fact: 'maxPunishmentYears', gte: 3 },
        { fact: 'maxPunishmentYears', lt: 7 },
      ],
    },
    severity: 'info',
    verified: false,
  },

  // 3. Production before Magistrate: 24 hours from arrest (BNSS 58)
  {
    id: 'deadline_magistrate_production_24h',
    label_en: 'Judicial Magistrate Production',
    label_mr: 'दंडाधिकाऱ्यांसमोर हजर करणे',
    triggerEvent: 'arrest_made',
    duration: 24,
    unit: 'hours',
    legalRef: {
      act: 'BNSS',
      section: '58',
      title_en: '24-hour production before Magistrate',
      title_mr: '२४ तासांत दंडाधिकाऱ्यांसमोर हजर करणे',
      summary_en: 'Arrested person must be produced before the nearest Magistrate within 24 hours excluding journey time.',
      summary_mr: 'प्रवासाचा वेळ वगळता २४ तासांच्या आत जवळच्या दंडाधिकाऱ्यांसमोर हजर करणे बंधनकारक आहे.',
      verified: false,
    },
    condition: { fact: 'arrestMade', eq: true },
    severity: 'danger',
    verified: false,
  },

  // 4a. Report on completion: 60 days (offences up to 10 years) (BNSS 187)
  {
    id: 'deadline_default_bail_60d',
    label_en: 'Police Report / 60-Day Default Bail Clock',
    label_mr: 'दोषारोपपत्र / ६० दिवस डिफॉल्ट जामीन घड्याळ',
    triggerEvent: 'arrest_or_remand',
    duration: 60,
    unit: 'days',
    legalRef: {
      act: 'BNSS',
      section: '187',
      subSection: '3',
      title_en: 'Default bail after 60 days',
      title_mr: '६० दिवसांनंतर डिफॉल्ट जामीन',
      summary_en: 'Investigation to be completed within 60 days for offences punishable with imprisonment up to 10 years, failing which accused is entitled to default bail.',
      summary_mr: '१० वर्षांपर्यंत शिक्षेच्या गुन्ह्यांत ६० दिवसांत तपास पूर्ण न झाल्यास आरोपीला जामीन मिळण्याचा हक्क निर्माण होतो.',
      verified: false,
    },
    condition: {
      all: [
        { fact: 'arrestMade', eq: true },
        { fact: 'maxPunishmentYears', lt: 10 },
      ],
    },
    severity: 'danger',
    verified: false,
  },

  // 4b. Report on completion: 90 days (death, life, 10 years or more) (BNSS 187)
  {
    id: 'deadline_default_bail_90d',
    label_en: 'Police Report / 90-Day Default Bail Clock',
    label_mr: 'दोषारोपपत्र / ९० दिवस डिफॉल्ट जामीन घड्याळ',
    triggerEvent: 'arrest_or_remand',
    duration: 90,
    unit: 'days',
    legalRef: {
      act: 'BNSS',
      section: '187',
      subSection: '3',
      title_en: 'Default bail after 90 days',
      title_mr: '९० दिवसांनंतर डिफॉल्ट जामीन',
      summary_en: 'Investigation to be completed within 90 days where offence is punishable with death, life imprisonment or imprisonment for not less than 10 years.',
      summary_mr: 'मृत्यू, जन्मठेप किंवा १० वर्षे किंवा त्याहून अधिक शिक्षेच्या गुन्ह्यांत ९० दिवसांत तपास पूर्ण न झाल्यास डिफॉल्ट जामीन.',
      verified: false,
    },
    condition: {
      all: [
        { fact: 'arrestMade', eq: true },
        { fact: 'maxPunishmentYears', gte: 10 },
      ],
    },
    severity: 'danger',
    verified: false,
  },

  // 5. Rape case police report: 2 months (BNSS 193(2))
  {
    id: 'deadline_rape_chargesheet_2m',
    label_en: 'Rape Case Investigation Completion',
    label_mr: 'बलात्कार गुन्हा तपास पूर्तता (२ महिने)',
    triggerEvent: 'information_recorded',
    duration: 60, // 2 months treated as 60 days
    unit: 'days',
    legalRef: {
      act: 'BNSS',
      section: '193',
      subSection: '2',
      title_en: 'Two months completion in rape cases',
      title_mr: 'बलात्कार प्रकरणात २ महिन्यांत तपास पूर्तता',
      summary_en: 'Investigation in relation to rape shall be completed within two months from the date on which information was recorded.',
      summary_mr: 'माहिती नोंदवल्याच्या दिनांकापासून २ महिन्यांच्या आत बलात्कार प्रकरणाचा तपास पूर्ण केला पाहिजे.',
      verified: false,
    },
    condition: { fact: 'rapeCase', eq: true },
    severity: 'danger',
    verified: false,
  },

  // 6. Rape victim medical report to IO: 7 days (BNSS 184)
  {
    id: 'deadline_rape_medical_report_7d',
    label_en: 'Rape Victim Medical Report Submission',
    label_mr: 'पीडितेचा वैद्यकीय अहवाल सादर करणे (७ दिवस)',
    triggerEvent: 'medical_examination_commenced',
    duration: 7,
    unit: 'days',
    legalRef: {
      act: 'BNSS',
      section: '184',
      subSection: '6',
      title_en: 'Medical report forwarded within seven days',
      title_mr: 'वैद्यकीय अहवाल ७ दिवसांत पाठवणे',
      summary_en: 'Registered medical practitioner shall forward the report to the investigating officer within seven days.',
      summary_mr: 'वैद्यकीय अधिकाऱ्याने तपास अधिकाऱ्याकडे ७ दिवसांच्या आत अहवाल पाठवला पाहिजे.',
      verified: false,
    },
    condition: { fact: 'rapeCase', eq: true },
    severity: 'warning',
    verified: false,
  },

  // 7. Progress update to informant or victim: 90 days (BNSS 193(3))
  {
    id: 'deadline_victim_progress_update_90d',
    label_en: 'Victim / Informant Progress Update',
    label_mr: 'फिर्यादी / पीडिता प्रगती अहवाल (९० दिवस)',
    triggerEvent: 'fir_registered',
    duration: 90,
    unit: 'days',
    legalRef: {
      act: 'BNSS',
      section: '193',
      subSection: '3',
      title_en: 'Progress update to informant within 90 days',
      title_mr: '९० दिवसांत तपासाची प्रगती कळवणे',
      summary_en: 'Police officer shall inform the progress of investigation by electronic communication or otherwise within ninety days.',
      summary_mr: '९० दिवसांच्या आत तपासाची प्रगती फिर्यादी किंवा पीडितेस कळवणे बंधनकारक आहे.',
      verified: false,
    },
    severity: 'warning',
    verified: false,
  },

  // 8. Forward search and seizure video: without delay (24 hours) (BNSS 105)
  {
    id: 'deadline_seizure_video_transmission_24h',
    label_en: 'Seizure Audio-Video Transmission to Magistrate',
    label_mr: 'झडती-जप्ती चित्रीकरण दंडाधिकाऱ्यांना पाठवणे',
    triggerEvent: 'search_seizure_completed',
    duration: 24,
    unit: 'hours',
    legalRef: {
      act: 'BNSS',
      section: '105',
      title_en: 'Forward recording without delay',
      title_mr: 'चित्रीकरण विनाविलंब सादर करणे',
      summary_en: 'Audio-video recording of search and seizure shall be forwarded without delay to the Judicial Magistrate (treated as within 24 hours).',
      summary_mr: 'झडती व जप्तीचे चित्रीकरण विनाविलंब (२४ तासांत) दंडाधिकाऱ्यांना पाठवले पाहिजे.',
      verified: false,
    },
    condition: {
      any: [
        { fact: 'searchConducted', eq: true },
        { fact: 'seizureMade', eq: true },
      ],
    },
    severity: 'danger',
    verified: false,
  },
];
