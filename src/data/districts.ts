export interface DistrictOption {
  value: string;
  labelEn: string;
  labelMr: string;
}

export const MAHARASHTRA_DISTRICTS: DistrictOption[] = [
  { value: 'pune', labelEn: 'Pune', labelMr: 'पुणे' },
  { value: 'mumbai_city', labelEn: 'Mumbai City', labelMr: 'मुंबई शहर' },
  { value: 'mumbai_suburban', labelEn: 'Mumbai Suburban', labelMr: 'मुंबई उपनगर' },
  { value: 'thane', labelEn: 'Thane', labelMr: 'ठाणे' },
  { value: 'nagpur', labelEn: 'Nagpur', labelMr: 'नागपूर' },
  { value: 'nashik', labelEn: 'Nashik', labelMr: 'नाशिक' },
  { value: 'chhatrapati_sambhajinagar', labelEn: 'Chhatrapati Sambhajinagar', labelMr: 'छत्रपती संभाजीनगर' },
  { value: 'ahmednagar', labelEn: 'Ahilyanagar (Ahmednagar)', labelMr: 'अहिल्यानगर (अहमदनगर)' },
  { value: 'solapur', labelEn: 'Solapur', labelMr: 'सोलापूर' },
  { value: 'kolhapur', labelEn: 'Kolhapur', labelMr: 'कोल्हापूर' },
  { value: 'satara', labelEn: 'Satara', labelMr: 'सातारा' },
  { value: 'sangli', labelEn: 'Sangli', labelMr: 'सांगली' },
  { value: 'amravati', labelEn: 'Amravati', labelMr: 'अमरावती' },
  { value: 'nanded', labelEn: 'Nanded', labelMr: 'नांदेड' },
  { value: 'jalgaon', labelEn: 'Jalgaon', labelMr: 'जळगाव' },
  { value: 'akola', labelEn: 'Akola', labelMr: 'अकोला' },
  { value: 'latur', labelEn: 'Latur', labelMr: 'लातूर' },
  { value: 'dhule', labelEn: 'Dhule', labelMr: 'धुळे' },
  { value: 'raigad', labelEn: 'Raigad', labelMr: 'रायगड' },
  { value: 'palghar', labelEn: 'Palghar', labelMr: 'पालघर' },
  { value: 'ratnagiri', labelEn: 'Ratnagiri', labelMr: 'रत्नागिरी' },
  { value: 'sindhudurg', labelEn: 'Sindhudurg', labelMr: 'सिंधुदुर्ग' },
  { value: 'beed', labelEn: 'Beed', labelMr: 'बीड' },
  { value: 'jalna', labelEn: 'Jalna', labelMr: 'जालना' },
  { value: 'parbhani', labelEn: 'Parbhani', labelMr: 'परभणी' },
  { value: 'dharashiv', labelEn: 'Dharashiv (Osmanabad)', labelMr: 'धाराशिव (उस्मानाबाद)' },
  { value: 'hingoli', labelEn: 'Hingoli', labelMr: 'हिंगोली' },
  { value: 'wardha', labelEn: 'Wardha', labelMr: 'वर्धा' },
  { value: 'bhandara', labelEn: 'Bhandara', labelMr: 'भंडारा' },
  { value: 'gondia', labelEn: 'Gondia', labelMr: 'गोंदिया' },
  { value: 'chandrapur', labelEn: 'Chandrapur', labelMr: 'चंद्रपूर' },
  { value: 'gadchiroli', labelEn: 'Gadchiroli', labelMr: 'गडचिरोली' },
  { value: 'buldhana', labelEn: 'Buldhana', labelMr: 'बुलढाणा' },
  { value: 'yavatmal', labelEn: 'Yavatmal', labelMr: 'यवतमाळ' },
  { value: 'washim', labelEn: 'Washim', labelMr: 'वाशीम' },
  { value: 'nandurbar', labelEn: 'Nandurbar', labelMr: 'नंदुरबार' },
  { value: 'other', labelEn: 'Other District / State', labelMr: 'इतर जिल्हा / राज्य' },
];

export interface RankOption {
  value: string;
  labelEn: string;
  labelMr: string;
}

export const POLICE_RANKS: RankOption[] = [
  { value: 'pc', labelEn: 'Police Constable (PC)', labelMr: 'पोलीस शिपाई (PC)' },
  { value: 'hc', labelEn: 'Head Constable (HC)', labelMr: 'पोलीस हवालदार (HC)' },
  { value: 'asi', labelEn: 'Assistant Sub-Inspector (ASI)', labelMr: 'सहाय्यक पोलीस उपनिरीक्षक (ASI)' },
  { value: 'psi', labelEn: 'Police Sub-Inspector (PSI)', labelMr: 'पोलीस उपनिरीक्षक (PSI)' },
  { value: 'api', labelEn: 'Assistant Police Inspector (API)', labelMr: 'सहाय्यक पोलीस निरीक्षक (API)' },
  { value: 'pi', labelEn: 'Police Inspector (PI)', labelMr: 'पोलीस निरीक्षक (PI)' },
  { value: 'other', labelEn: 'Other Officer / Clerk', labelMr: 'इतर अधिकारी / लिपिक' },
];
