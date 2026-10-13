# Nyay Saathi (न्यायसाथी)
### Police Procedure and Evidence Companion (BNS • BNSS • BSA 2023)
**Maharashtra Police • Seva First Innovation Challenge 2026 • Maharashtra Zone (Law and Order)**  
*Team Lead: Bhavesh Diwakar Patil*

---

## 1. Project Description

**Nyay Saathi** is an offline-first, mobile-first procedural decision-support system built for Maharashtra Police investigating officers navigating India's criminal legal codes:
* **Bharatiya Nyaya Sanhita (BNS 2023)** (replacing IPC 1860)
* **Bharatiya Nagarik Suraksha Sanhita (BNSS 2023)** (replacing CrPC 1973)
* **Bharatiya Sakshya Adhiniyam (BSA 2023)** (replacing IEA 1872)

The application operates **100% offline**, storing all case records, evidence files, cryptographic hashes (SHA-256), and procedural checklists inside the local device **IndexedDB** (`nyay_saathi`). It makes **zero external network requests for data transmission** and uses native system fonts to guarantee instant operation in remote police stations, check-posts, and rural beats without internet connectivity.

---

## 2. Key Features

1. **Bilingual Procedure & Offence Guide (`/guide`)**:
   - Offence fact analysis questions (cognizable, recovery, arrest, vulnerable victims) dynamically customize mandatory procedural checklists under BNSS.
2. **Procedural Checklist Runner (`/checklist/:runId`)**:
   - Step-by-step guidance for mandatory investigation steps with statutory references, real-time progress indicators, and completion timestamps.
3. **Evidence Cryptographic Vault & Chain of Custody (`/evidence`)**:
   - Computes SHA-256 cryptographic fingerprints on-device using the Web Crypto API.
   - Hash-linked chain of custody ledger tracking transfers from seizure to Malkhana to forensic laboratory.
4. **Digital Tamper Detection Demo (`/verify`)**:
   - Interactive verification tool with a simulated 1-pixel tamper test proving digital integrity and avalanche effect in court.
5. **Court-Admissible PDF Document Generator (`/documents`)**:
   - Section 63 BSA Electronic Evidence Certificates and Seizure Panchnamas generated in seconds.
   - Printable bilingual A4 sheets with multi-page numbering, watermark disclaimers, and Web Share integration.
6. **Statutory Deadlines Tracker (`/deadlines`)**:
   - Real-time monitors for 24-hour Magistrate production (BNSS Sec 58), 60/90-day statutory default bail limits (BNSS Sec 187(3)), and 14-day preliminary enquiry notices.
7. **Supervisor Station Compliance Dashboard (`/dashboard`)**:
   - Analytics for Police Station In-Charges (PI/ACP) showing officer adherence %, evidence hash coverage %, and procedural hours saved.
8. **Interactive 2-Minute Pitch Guided Demo**:
   - 7-step guided coach-mark walkthrough with bilingual captions, automated routing, and value-prop completion summary.
9. **PIN Security & Auto-Lock (`/settings`)**:
   - 4 to 6 digit PIN stored strictly as a salted PBKDF2 hash (100,000 iterations via Web Crypto).
   - Inactivity auto-lock (1, 5, 15 min), background tab switch locking, and 30-second lockout after 5 incorrect attempts.
10. **Encrypted Backup & Restore**:
    - JSON export of all database stores with optional AES-GCM encryption protected by a user passphrase.
11. **Citizen Rights Portal (`/citizen`)**:
    - Plain-language explanation of citizen rights during arrest, search, detention, and Zero FIR in Marathi and English.
12. **Full Accessibility & Display Options**:
    - Root font scaling (Small, Medium, Large), high-contrast mode, and Devanagari numerals toggle (०-९).

---

## 3. Folder Structure

```
nyay-saathi/
├── public/
│   ├── icons/                  # 192px, 512px, maskable, apple-touch-icon, SVG
│   ├── manifest.webmanifest    # PWA Web App Manifest (standalone, theme #0B2545)
│   ├── offline.html            # Standalone bilingual offline fallback
│   └── sw.js                   # Pure vanilla service worker (versioned cache, precaching)
├── src/
│   ├── components/
│   │   ├── certificate/        # Section 63 BSA certificate generator & viewer
│   │   ├── common/             # ErrorBoundary with recovery screen
│   │   ├── demo/               # GuidedDemoOverlay (7-step pitch coach-mark tour)
│   │   ├── documents/          # Document builder & templates
│   │   ├── layout/             # Shell, header, navigation, offline banner
│   │   ├── pwa/                # Install prompts and iOS Safari instructions
│   │   ├── security/           # LockScreen numeric keypad overlay
│   │   └── ui/                 # Accessible UI design system components
│   ├── context/
│   │   ├── AppContext.tsx      # Language, display scale, high-contrast, profile
│   │   ├── DemoContext.tsx     # 7-step pitch demo manager
│   │   ├── PWAContext.tsx      # Install prompt and connectivity manager
│   │   └── SecurityContext.tsx # PBKDF2 Web Crypto PIN and auto-lock state
│   ├── data/
│   │   ├── districts.ts        # 36 Maharashtra districts & police ranks
│   │   ├── legalSearchIndex.ts # BNS, BNSS, BSA, IPC, CrPC cross-reference index
│   │   ├── offences.ts         # Sample offences with statutory provisions
│   │   ├── procedureRules.ts   # Statutory procedural logic engine
│   │   └── steps.ts            # Mandatory procedure steps under BNSS
│   ├── i18n/
│   │   ├── en.ts               # English dictionary (640 keys)
│   │   ├── mr.ts               # Marathi dictionary (640 keys, 100% parity)
│   │   └── index.ts            # Intl formatting and Devanagari digits utility
│   ├── lib/
│   │   ├── backup/             # AES-GCM backup encryption and restore manager
│   │   ├── db/                 # IndexedDB wrapper (nyay_saathi) & sample caseload
│   │   ├── deadlines/          # Statutory deadline calculation engine
│   │   ├── pdf/                # html2canvas + jsPDF bilingual A4 renderer
│   │   └── security/           # Web Crypto PBKDF2 and AES-GCM utilities
│   ├── pages/
│   │   ├── cases/              # Case list, new case, detail, search & seizure wizard
│   │   ├── citizen/            # Citizen rights, arrest guidelines, complaints
│   │   ├── dashboard/          # Compliance dashboard for supervisory officers
│   │   ├── deadlines/          # Statutory deadlines tracker
│   │   ├── documents/          # Document templates and saved documents
│   │   ├── evidence/           # Evidence list, new evidence, hash verification
│   │   ├── guide/              # Offence picker and checklist runner
│   │   ├── search/             # Legal search & IPC-to-BNS mapper
│   │   ├── settings/           # 9-section settings and security panel
│   │   ├── about/              # About project, Seva First challenge, licenses
│   │   ├── HomePage.tsx        # Officer home dashboard & quick actions
│   │   └── WelcomePage.tsx     # Onboarding setup screen
│   ├── App.tsx                 # HashRouter route tree & provider wrappers
│   ├── main.tsx                # React root mount
│   └── index.css               # Tailwind CSS theme & high-contrast rules
├── index.html                  # HTML entry point with PWA meta tags
├── metadata.json               # Applet configuration
├── package.json                # Project dependencies
├── TEST_REPORT.md              # Complete end-to-end test pass report
└── vite.config.ts              # Vite configuration
```

---

## 4. How to Run Locally

### Prerequisites
* Node.js 18.x or 20.x
* npm 9+ or pnpm

### Quickstart
```bash
# 1. Install dependencies
npm install

# 2. Start local development server (port 3000)
npm run dev

# 3. Open in browser
# http://localhost:3000
```

---

## 5. How to Deploy

> **CRITICAL**: Progressive Web App installability and Service Workers **strictly require HTTPS** (or `http://localhost` during testing).

### Option A: Netlify (Recommended)
```bash
# Build the production bundle
npm run build

# Deploy via Netlify CLI
npx netlify-cli deploy --prod --dir=dist
```
Or connect your GitHub repository to Netlify with build command `npm run build` and publish directory `dist`.

### Option B: Vercel
```bash
npx vercel --prod
```
Framework Preset: **Vite**, Output Directory: **`dist`**.

### Option C: GitHub Pages
1. In `vite.config.ts`, verify `base: './'` for relative asset paths.
2. Build and publish:
   ```bash
   npm run build
   npx gh-pages -d dist
   ```
3. In GitHub repo Settings → **Pages**, ensure **"Enforce HTTPS"** is checked.

---

## 6. Known Limitations

1. **No Server-Side Cloud Sync**:
   All data is stored exclusively in the browser's local IndexedDB. If browser application storage is manually wiped or the browser uninstalled without creating a backup, data cannot be recovered from the cloud. Use the **Export Backup** feature in `/settings` to safeguard station caseloads.
2. **PIN Stops Casual Access Only**:
   The PIN protection stops unauthorized access to the application interface. It utilizes a salted PBKDF2 hash via Web Crypto, but it **does not encrypt the underlying physical storage of the mobile phone**. Operating-system level device encryption (screen lock / biometrics) should always remain enabled on police duty devices.
3. **Decision-Support Advisory Only**:
   Nyay Saathi is an operational procedure companion and not a substitute for formal legal counsel. All statutory provisions, timelines, and certificate drafts are flagged as *Decision support tool — Pending final legal review* and must be verified against official statutory gazettes.

---

## 7. Pilot Plan & Impact Metrics

For the upcoming field pilot across select police stations in Maharashtra Zone (Pune City and Rural Beats), the following core operational metrics will be collected:

| Metric | Target Goal | Measurement Method |
| :--- | :---: | :--- |
| **Checklist Completion Rate** | **≥ 90%** compliance | Proportion of mandatory BNSS procedural steps marked as compliant prior to chargesheet filing. |
| **Time to Produce Evidence Certificate** | **Reduced from 45 min to < 3 min** | Time taken by Investigating Officer to draft and export a verified Section 63 BSA certificate with SHA-256 hash. |
| **Statutory Deadlines Missed** | **Zero (0) default bails** | Incidents where 24-hour Magistrate production or 60/90-day chargesheet limits are breached. |
| **Evidence Hash Coverage** | **100% of digital exhibits** | Percentage of seized CCTV, audio, and mobile extraction exhibits secured with SHA-256 fingerprints. |
| **Officer Usability & Feedback Score** | **≥ 4.5 / 5.0 (CSAT / SUS)** | Structured feedback survey conducted with PIs, APIs, and PSIs evaluating bilingual ease of use and field reliability. |

---

## 8. About & Attribution

* **Project**: Nyay Saathi (न्यायसाथी)
* **Version**: 1.0.0 (Pitch Prototype)
* **Challenge**: Seva First Innovation Challenge 2026
* **Category**: Law and Order, Maharashtra Zone
* **Team Lead**: Bhavesh Diwakar Patil
* **License**: MIT (Open Source Prototype)
