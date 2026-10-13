import React, { createContext, useContext, useState, useCallback } from 'react';
import { seedSampleStationData } from '../lib/db/sampleData.ts';

export interface DemoStep {
  id: number;
  route: string;
  titleEn: string;
  titleMr: string;
  captionEn: string;
  captionMr: string;
  selector?: string;
  actionHintEn?: string;
  actionHintMr?: string;
}

export const DEMO_STEPS: DemoStep[] = [
  {
    id: 1,
    route: '/guide/theft_bns_303',
    titleEn: '1. Guide & Offence Fact Analysis',
    titleMr: '१. मार्गदर्शक व वस्तुस्थिती विश्लेषण',
    captionEn: 'Select an offence under BNS (e.g. Theft BNS 303(2)). Answer instant statutory fact questions (cognizable, recovery, arrest) to trigger required procedural steps.',
    captionMr: 'BNS अंतर्गत गुन्हा निवडा (उदा. चोरी BNS ३०३(२)). वैधानिक वस्तुस्थिती प्रश्नांची उत्तरे द्या जेणेकरून आवश्यक प्रक्रियात्मक पायऱ्या आपोआप तयार होतील.',
    actionHintEn: 'Notice how answering questions updates statutory rules.',
    actionHintMr: 'प्रश्नांची उत्तरे दिल्यावर नियम कसे बदलतात ते पहा.',
  },
  {
    id: 2,
    route: '/checklist/chk_sample_case_a',
    titleEn: '2. Procedural Checklist Runner',
    titleMr: '२. प्रक्रियात्मक चेकलिस्ट रनर',
    captionEn: 'Follow mandatory BNSS procedural steps with statutory references. Ticking steps records compliance timestamps and notes in real time without network.',
    captionMr: 'BNSS अंतर्गत अनिवार्य प्रक्रिया पायऱ्यांचे पालन करा. पायऱ्यांवर टिक केल्याने वेळेसह कायदेशीर अनुपालनाची नोंद तात्काळ होते.',
    actionHintEn: 'Tick checklist steps to see completion progress rise.',
    actionHintMr: 'पायऱ्या टिक करून प्रगती वाढलेली पहा.',
  },
  {
    id: 3,
    route: '/evidence/new',
    titleEn: '3. Log Evidence & SHA-256 Fingerprint',
    titleMr: '३. पुरावा नोंदणी व SHA-256 फिंगरप्रिंट',
    captionEn: 'Upload or capture evidence files. Nyay Saathi computes the cryptographic SHA-256 hash locally in your browser using Web Crypto API. No files are uploaded to any server.',
    captionMr: 'इलेक्ट्रॉनिक किंवा भौतिक पुरावा नोंदवा. न्याय साथी ब्राउझरमध्येच स्थानिक पातळीवर SHA-256 हॅश मोजते. कोणताही फाइल सर्व्हरवर पाठवला जात नाही.',
    actionHintEn: 'Every digital exhibit gets an immutable cryptographic fingerprint.',
    actionHintMr: 'प्रत्येक पुराव्याला अपरिवर्तनीय डिजिटल फिंगरप्रिंट मिळते.',
  },
  {
    id: 4,
    route: '/verify',
    titleEn: '4. Digital Tamper Detection Demo',
    titleMr: '४. डिजिटल छेडछाड चाचणी प्रात्यक्षिक',
    captionEn: 'Experience cryptographic integrity. Toggle the 1-pixel tamper simulation below to see how even an invisible change completely alters the hash and flags an alert.',
    captionMr: 'क्रिप्टोग्राफिक अखंडतेचा अनुभव घ्या. खाली दिलेल्या १-पिक्सेल छेडछाड बटणावर क्लिक करा; अगदी सूक्ष्म बदल झाल्यासही हॅश बदलून लाल इशारा दिसतो.',
    actionHintEn: 'Click "Simulate 1-Pixel Tamper" to observe the red mismatch banner.',
    actionHintMr: '"१-पिक्सेल छेडछाड" वर क्लिक करून लाल इशारा पहा.',
  },
  {
    id: 5,
    route: '/documents',
    titleEn: '5. Section 63 BSA Electronic Certificate',
    titleMr: '५. कलम ६३ BSA इलेक्ट्रॉनिक प्रमाणपत्र',
    captionEn: 'Generate court-admissible Section 63 BSA certificates and Seizure Memos in seconds. Export print-ready bilingual A4 PDFs with official disclaimers.',
    captionMr: 'न्यायालयात स्वीकारार्ह कलम ६३ BSA प्रमाणपत्र व जप्ती पंचनामा काही सेकंदात तयार करा. अधिकृत अस्वीकरणासह द्विभाषिक A4 PDF डाउनलोड करा.',
    actionHintEn: 'Open any document template to view the auto-filled draft.',
    actionHintMr: 'कोणतेही मसुदा उघडून स्वयं-भरलेला तपशील पहा.',
  },
  {
    id: 6,
    route: '/deadlines',
    titleEn: '6. Statutory Deadlines Tracker',
    titleMr: '६. कायदेशीर मुदत ट्रॅकर',
    captionEn: 'Track statutory timers under BNSS: 24-hour Magistrate production post-arrest, 60/90-day chargesheet limits, and preliminary inquiry notices.',
    captionMr: 'BNSS अंतर्गत वैधानिक मुदतींचे निरीक्षण: अटक झाल्यावर २४ तासांत दंडाधिकाऱ्यांसमोर हजर करणे आणि ६०/९० दिवसांचे दोषारोपपत्र.',
    actionHintEn: 'Color-coded badges warn of upcoming or overdue legal limits.',
    actionHintMr: 'रंगीत बॅज आगामी किंवा उलटून गेलेल्या मुदतींचा इशारा देतात.',
  },
  {
    id: 7,
    route: '/dashboard',
    titleEn: '7. Police Station Compliance Dashboard',
    titleMr: '७. पोलीस ठाणे अनुपालन डॅशबोर्ड',
    captionEn: 'Supervisory analytics for Police Station In-Charge (PI/ACP). View checklist compliance percentage, evidence hash coverage, and procedural hours saved.',
    captionMr: 'ठाणे प्रभारींसाठी (PI/ACP) पर्यवेक्षी विश्लेषण. चेकलिस्ट अनुपालन टक्केवारी, हॅश कव्हरेज आणि तपासात वाचलेले तास एका दृष्टिक्षेपात.',
    actionHintEn: 'Real-time metrics calculated entirely on-device.',
    actionHintMr: 'सर्व आकडेवारी पूर्णपणे उपकरणावर मोजली जाते.',
  },
];

interface DemoContextType {
  isDemoActive: boolean;
  currentStepIndex: number;
  totalSteps: number;
  currentStep: DemoStep;
  startDemo: () => Promise<void>;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  endDemo: () => void;
  isEndScreen: boolean;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isEndScreen, setIsEndScreen] = useState<boolean>(false);

  const startDemo = useCallback(async () => {
    // Ensure rich sample caseload exists so all demo routes have real data to show
    try {
      await seedSampleStationData();
    } catch {
      // Ignored if already seeded
    }
    setCurrentStepIndex(0);
    setIsEndScreen(false);
    setIsDemoActive(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < DEMO_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsEndScreen(true);
    }
  }, [currentStepIndex]);

  const prevStep = useCallback(() => {
    if (isEndScreen) {
      setIsEndScreen(false);
    } else if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex, isEndScreen]);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < DEMO_STEPS.length) {
      setCurrentStepIndex(index);
      setIsEndScreen(false);
      setIsDemoActive(true);
    }
  }, []);

  const endDemo = useCallback(() => {
    setIsDemoActive(false);
    setIsEndScreen(false);
    setCurrentStepIndex(0);
  }, []);

  const currentStep = DEMO_STEPS[currentStepIndex] || DEMO_STEPS[0];

  return (
    <DemoContext.Provider
      value={{
        isDemoActive,
        currentStepIndex,
        totalSteps: DEMO_STEPS.length,
        currentStep,
        startDemo,
        nextStep,
        prevStep,
        goToStep,
        endDemo,
        isEndScreen,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = (): DemoContextType => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};
