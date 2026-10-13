import React, { useState } from 'react';
import {
  Button,
  IconButton,
  Card,
  Badge,
  Chip,
  Input,
  Textarea,
  Select,
  DateTimeInput,
  Checkbox,
  Switch,
  RadioGroup,
  SearchBar,
  Modal,
  BottomSheet,
  ConfirmDialog,
  useToast,
  Tabs,
  Accordion,
  Stepper,
  ProgressBar,
  ProgressRing,
  EmptyState,
  Skeleton,
  SectionTitle,
  ListItem,
  DisclaimerBanner,
  FieldError,
} from '../components/ui/index.ts';
import { Logo } from '../components/Logo.tsx';
import {
  Shield,
  FileText,
  Clock,
  Sparkles,
  Search,
  Bell,
  Scale,
  Camera,
  FolderOpen,
  Info,
  CheckCircle,
} from 'lucide-react';

export const StyleguidePage: React.FC = () => {
  const toast = useToast();

  // Component state toggles
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmVariant, setConfirmVariant] = useState<'danger' | 'warning' | 'primary'>('danger');

  // Input states
  const [textValue, setTextValue] = useState('');
  const [searchValue, setSearchValue] = useState('FIR No. 402/2024');
  const [switchVal, setSwitchVal] = useState(true);
  const [checkboxVal, setCheckboxVal] = useState(true);
  const [radioVal, setRadioVal] = useState('bns_303');
  const [selectedChip, setSelectedChip] = useState<'all' | 'cognizable' | 'bailable'>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [pillTab, setPillTab] = useState('active');
  const [stepperIndex, setStepperIndex] = useState(1);

  const colors = [
    { name: 'Navy 900 (Background)', hex: '#0B2545', class: 'bg-navy-900' },
    { name: 'Navy 700 (Cards & Panels)', hex: '#13315C', class: 'bg-navy-700' },
    { name: 'Navy 600 (Raised Borders)', hex: '#1B3F73', class: 'bg-navy-600' },
    { name: 'Saffron (Primary Accent)', hex: '#FF9933', class: 'bg-saffron text-navy-900' },
    { name: 'Saffron 600 (Pressed)', hex: '#E8851F', class: 'bg-saffron-600 text-navy-900' },
    { name: 'India Green (Success/Valid)', hex: '#138808', class: 'bg-india-green text-white' },
    { name: 'Ink / White (Text)', hex: '#FFFFFF', class: 'bg-white text-navy-900' },
    { name: 'Muted Text', hex: '#B8C4D6', class: 'bg-muted text-navy-900' },
    { name: 'Danger (Strict / Overdue)', hex: '#E5484D', class: 'bg-danger text-white' },
    { name: 'Warning (Urgent / Review)', hex: '#F5B301', class: 'bg-warning text-navy-900' },
  ];

  return (
    <div className="min-h-screen bg-navy-900 text-white p-4 sm:p-8 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col gap-3 pb-6 border-b border-navy-600">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Logo size={44} withWordmark />
          <Badge variant="pendingReview">Internal Dev Styleguide (Prompt 1)</Badge>
        </div>
        <p className="text-muted text-sm mt-1">
          Complete living design system for Nyay Saathi. Demonstrating tokens, accessibility (≥48px touch targets), dark navy palette, and all typed UI building blocks.
        </p>
      </div>

      <div className="flex flex-col gap-10 mt-8">
        {/* 1. COLOR SWATCHES */}
        <section>
          <SectionTitle title="1. Color Tokens & Palette" subtitle="Official Maharashtra Police / Nyay Saathi theme" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {colors.map((c) => (
              <div key={c.hex} className="rounded-xl border border-navy-600 overflow-hidden bg-navy-700/60 p-2.5 flex flex-col gap-2">
                <div className={`h-14 rounded-lg flex items-center justify-center font-bold text-xs shadow-inner ${c.class}`}>
                  {c.hex}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white leading-tight">{c.name}</span>
                  <span className="text-[11px] font-mono text-muted mt-0.5">{c.hex}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. LOGO COMPONENT */}
        <section>
          <SectionTitle title="2. Official Logo Component" subtitle="Custom inline SVG with 1024 viewBox geometry & wordmark" />
          <Card className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-around gap-6 p-4 bg-navy-900/60 rounded-xl border border-navy-600/60">
              <div className="flex flex-col items-center gap-2">
                <Logo size={36} />
                <span className="text-xs text-muted">Icon (36px)</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Logo size={56} />
                <span className="text-xs text-muted">Icon (56px)</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Logo size={80} />
                <span className="text-xs text-muted">Icon (80px)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-navy-900/60 border border-navy-600/60 flex flex-col items-center justify-center gap-2">
                <Logo size={48} withWordmark layout="horizontal" />
                <span className="text-xs text-muted mt-2">Horizontal Wordmark</span>
              </div>
              <div className="p-4 rounded-xl bg-navy-900/60 border border-navy-600/60 flex flex-col items-center justify-center gap-2">
                <Logo size={56} withWordmark layout="vertical" />
                <span className="text-xs text-muted mt-1">Vertical Wordmark</span>
              </div>
            </div>
          </Card>
        </section>

        {/* 3. BUTTONS & ICON BUTTONS */}
        <section>
          <SectionTitle title="3. Buttons & Icon Buttons" subtitle="Min touch target 48px, loading states, slots" />
          <Card className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="primary">Primary Saffron</Button>
              <Button variant="secondary">Secondary Outline</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger">Danger Action</Button>
            </div>

            <div className="flex flex-wrap gap-3 items-center pt-2 border-t border-navy-600/50">
              <Button size="lg" icon={<Shield className="w-5 h-5" />}>
                Large with Icon
              </Button>
              <Button variant="secondary" loading>
                Loading Action
              </Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
            </div>

            <div className="pt-2 border-t border-navy-600/50 flex flex-col gap-2">
              <span className="text-xs text-muted font-medium">IconButtons:</span>
              <div className="flex items-center gap-3">
                <IconButton icon={<Camera className="w-5 h-5" />} ariaLabel="Capture" variant="primary" />
                <IconButton icon={<FileText className="w-5 h-5" />} ariaLabel="Document" variant="secondary" />
                <IconButton icon={<Bell className="w-5 h-5" />} ariaLabel="Notifications" variant="ghost" />
                <IconButton icon={<Scale className="w-5 h-5" />} ariaLabel="Justice" variant="danger" />
              </div>
            </div>

            <Button fullWidth variant="primary" icon={<CheckCircle className="w-5 h-5" />}>
              Full Width Button
            </Button>
          </Card>
        </section>

        {/* 4. BADGES, CHIPS & STATUS */}
        <section>
          <SectionTitle title="4. Badges & Chips" subtitle="Chips fully rounded, verified / pending review styling" />
          <Card className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-2.5 items-center">
              <Badge variant="neutral">BNSS 2023 Sec 105</Badge>
              <Badge variant="success">Chain Intact</Badge>
              <Badge variant="warning">Custody Due Soon</Badge>
              <Badge variant="danger">60-Day Overdue</Badge>
              <Badge variant="info">Cognizable</Badge>
              <Badge variant="pendingReview">Pending legal review</Badge>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-navy-600/50">
              <span className="text-xs text-muted font-medium">Selectable Chips (min 44-48px touch):</span>
              <div className="flex flex-wrap gap-2">
                <Chip
                  selected={selectedChip === 'all'}
                  onClick={() => setSelectedChip('all')}
                  icon={<Scale className="w-4 h-4" />}
                >
                  All Offences
                </Chip>
                <Chip
                  selected={selectedChip === 'cognizable'}
                  onClick={() => setSelectedChip('cognizable')}
                  icon={<Shield className="w-4 h-4" />}
                >
                  Cognizable Only
                </Chip>
                <Chip
                  selected={selectedChip === 'bailable'}
                  onClick={() => setSelectedChip('bailable')}
                  icon={<FileText className="w-4 h-4" />}
                >
                  Non-Bailable
                </Chip>
              </div>
            </div>
          </Card>
        </section>

        {/* 5. INPUTS & FORM CONTROLS */}
        <section>
          <SectionTitle title="5. Form Inputs & Controls" subtitle="Labels, error states, dark theme date pickers" />
          <Card className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Accused Person Name"
              placeholder="e.g. Ramesh Shankar Patil"
              hint="Enter full name as per Aadhaar / PAN"
              required
            />
            <Input
              label="Police Station"
              value="Shivaji Nagar PS, Pune"
              icon={<Shield className="w-4 h-4" />}
              readOnly
            />
            <Input
              label="Field with Error"
              value="Invalid format"
              error="Aadhaar must be 12 numeric digits"
            />
            <Select
              label="Offence Category (BNS 2023)"
              placeholder="Select category"
              options={[
                { value: 'theft', label: 'BNS Sec 303(2) - Theft' },
                { value: 'assault', label: 'BNS Sec 115 - Voluntarily Causing Hurt' },
                { value: 'cheating', label: 'BNS Sec 318 - Cheating' },
              ]}
            />
            <DateTimeInput
              label="Date & Time of Seizure (Sec 105 BNSS)"
              type="datetime-local"
              hint="Mandatory timestamp for electronic seizure memo"
            />
            <SearchBar
              value={searchValue}
              onValueChange={setSearchValue}
              placeholder="Search case registry or section..."
            />
            <div className="md:col-span-2">
              <Textarea
                label="Panchnama Narrative / Seizure Description"
                placeholder="Describe articles seized, witness names, seal identification..."
                rows={3}
              />
            </div>
            <div className="p-3 rounded-xl bg-navy-900/60 border border-navy-600 flex flex-col gap-3">
              <Checkbox
                label="Audio-Video Recording Conducted"
                description="Mandatory requirement under Section 105(2) of BNSS 2023"
                checked={checkboxVal}
                onChange={(e) => setCheckboxVal(e.target.checked)}
              />
              <Switch
                label="Citizen Mode"
                description="Simplifies legal terminology into plain Marathi/English"
                checked={switchVal}
                onChange={setSwitchVal}
              />
            </div>
            <div className="p-3 rounded-xl bg-navy-900/60 border border-navy-600">
              <RadioGroup
                name="offence"
                label="Cognizance Level"
                value={radioVal}
                onChange={setRadioVal}
                options={[
                  {
                    value: 'bns_303',
                    label: 'Cognizable & Non-Bailable',
                    description: 'Arrest without warrant permitted with Sec 35 memo',
                  },
                  {
                    value: 'non_cog',
                    label: 'Non-Cognizable',
                    description: 'Magistrate permission required to investigate',
                  },
                ]}
              />
            </div>
          </Card>
        </section>

        {/* 6. MODALS, SHEETS & TOASTS */}
        <section>
          <SectionTitle title="6. Dialogs, Sheets & Toast Feedback" subtitle="Fully accessible interactive overlays" />
          <Card className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => setModalOpen(true)}>
                Open Sample Modal
              </Button>
              <Button variant="secondary" onClick={() => setSheetOpen(true)}>
                Open Mobile BottomSheet
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setConfirmVariant('danger');
                  setConfirmOpen(true);
                }}
              >
                Open Confirm Dialog
              </Button>
            </div>

            <div className="pt-3 border-t border-navy-600/50 flex flex-col gap-2">
              <span className="text-xs text-muted font-medium">Trigger In-App Toasts:</span>
              <div className="flex flex-wrap gap-2.5">
                <Button
                  size="md"
                  variant="ghost"
                  className="border border-india-green/40 text-india-green"
                  onClick={() => toast.success('Evidence SHA-256 Calculated', 'Hash: 4a2b...f8e1 verified')}
                >
                  Success Toast
                </Button>
                <Button
                  size="md"
                  variant="ghost"
                  className="border border-danger/40 text-danger"
                  onClick={() => toast.error('Procedural Breach Alert', 'Section 105 recording missing')}
                >
                  Error Toast
                </Button>
                <Button
                  size="md"
                  variant="ghost"
                  className="border border-warning/40 text-warning"
                  onClick={() => toast.warning('Statutory Clock Warning', '48 hours remaining for Sec 187 remand')}
                >
                  Warning Toast
                </Button>
                <Button
                  size="md"
                  variant="ghost"
                  className="border border-saffron/40 text-saffron"
                  onClick={() => toast.info('Offline Cache Ready', 'All data saved to local device')}
                >
                  Info Toast
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* 7. TABS, ACCORDION & STEPPERS */}
        <section>
          <SectionTitle title="7. Navigation, Accordions & Steppers" subtitle="Procedural workflows and checklists" />
          <Card className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted">Tabs (Underline variant):</span>
              <Tabs
                tabs={[
                  { id: 'all', label: 'All Cases', badge: <Badge variant="neutral" size="sm">14</Badge> },
                  { id: 'urgent', label: 'Urgent Remands', badge: <Badge variant="danger" size="sm">2</Badge> },
                  { id: 'completed', label: 'Charge Sheeted' },
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted">Tabs (Pill variant):</span>
              <Tabs
                variant="pill"
                tabs={[
                  { id: 'active', label: 'Active Investigation' },
                  { id: 'evidence', label: 'Digital Evidence' },
                  { id: 'documents', label: 'Generated Memos' },
                ]}
                activeTab={pillTab}
                onChange={setPillTab}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted">Accordion (Procedural Guides):</span>
              <Accordion
                items={[
                  {
                    id: 'step_1',
                    title: 'Section 105 BNSS: Search and Seizure Audio-Video Recording',
                    subtitle: 'Mandatory before preparing seizure memo',
                    badge: <Badge variant="warning" size="sm">Mandatory</Badge>,
                    icon: <Camera className="w-5 h-5" />,
                    content: (
                      <p className="text-sm text-muted leading-relaxed">
                        Under Section 105 of Bharatiya Nagarik Suraksha Sanhita 2023, the process of conducting search of a place or taking possession of any property shall be recorded through audio-video electronic means preferably mobile phone.
                      </p>
                    ),
                    defaultOpen: true,
                  },
                  {
                    id: 'step_2',
                    title: 'Section 63 BSA: Certificate for Electronic Record',
                    subtitle: 'Required for admissibility in trial',
                    badge: <Badge variant="info" size="sm">Sec 63</Badge>,
                    icon: <FileText className="w-5 h-5" />,
                    content: (
                      <p className="text-sm text-muted leading-relaxed">
                        Every computer output, mobile video or call data record must be accompanied by a certificate signed by the person in lawful control of the device.
                      </p>
                    ),
                  },
                ]}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted">Vertical Stepper (Remand and Arrest Progress):</span>
              <Stepper
                currentStepIndex={stepperIndex}
                onStepClick={setStepperIndex}
                steps={[
                  {
                    id: 1,
                    title: 'FIR Registered & Notice Issued',
                    subtitle: 'Sec 173 & Sec 35 BNSS',
                    description: 'Notice of appearance served if punishment is less than 7 years.',
                  },
                  {
                    id: 2,
                    title: 'Arrest Memo & Medical Examination',
                    subtitle: 'Sec 53 BNSS Completed',
                    description: 'Mandatory intimation to relative and registered legal aid counsel.',
                  },
                  {
                    id: 3,
                    title: 'Production before Judicial Magistrate (24 Hours)',
                    subtitle: 'Sec 58 BNSS Statutory Limit',
                    description: 'Must produce within 24 hours excluding journey time.',
                  },
                  {
                    id: 4,
                    title: 'Police Remand Application (Sec 187 BNSS)',
                    subtitle: 'Max 15 days in initial 40/60 days',
                  },
                ]}
              />
            </div>
          </Card>
        </section>

        {/* 8. PROGRESS, METRICS & STATS */}
        <section>
          <SectionTitle title="8. Progress Indicators & Metrics" subtitle="Linear and circular statutory countdown meters" />
          <Card className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <ProgressBar value={75} label="Investigation Checklist Completion" color="saffron" />
              <ProgressBar value={92} label="Sec 187 BNSS Custody Clock (11/12 Days)" color="danger" />
              <ProgressBar value={40} label="Evidence Integrity Verification" color="green" />
              <ProgressBar value={60} label="Charge Sheet 60-Day Deadline" color="warning" />
            </div>

            <div className="flex items-center justify-around p-4 rounded-xl bg-navy-900/60 border border-navy-600/60">
              <div className="flex flex-col items-center gap-1.5">
                <ProgressRing value={85} color="saffron" size={68} strokeWidth={6} />
                <span className="text-xs text-muted text-center">Case Score</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <ProgressRing value={100} color="green" size={68} strokeWidth={6} />
                <span className="text-xs text-muted text-center">Chain Intact</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <ProgressRing value={90} color="danger" size={68} strokeWidth={6} />
                <span className="text-xs text-muted text-center">Remand Expiring</span>
              </div>
            </div>
          </Card>
        </section>

        {/* 9. LIST ITEMS, EMPTY STATES & SKELETON */}
        <section>
          <SectionTitle title="9. List Items, Skeletons & Empty State" subtitle="High tactile feedback on mobile screens" />
          <div className="flex flex-col gap-3">
            <ListItem
              icon={<Shield className="w-5 h-5" />}
              title="FIR 308/2024 • Theft under BNS 303(2)"
              subtitle="Accused: Sachin G. More • Remand Day 4 of 15"
              trailing={<Badge variant="warning" size="sm">Remand Active</Badge>}
              showChevron
              onClick={() => toast.info('Tapped case item')}
            />
            <ListItem
              icon={<Camera className="w-5 h-5" />}
              title="Seizure Video_20241011_0920.mp4"
              subtitle="SHA-256: d85a20...31c4 • Section 105 Compliant"
              trailing={<Badge variant="success" size="sm">Verified</Badge>}
              showChevron
              onClick={() => toast.success('Digital evidence selected')}
            />

            <SectionTitle title="Skeleton Placeholders" className="mt-4" />
            <div className="p-4 rounded-2xl bg-navy-700 border border-navy-600 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-16 w-full" />
            </div>

            <SectionTitle title="Empty State Pattern" className="mt-4" />
            <EmptyState
              title="No Pending Arrest Memos"
              description="All active cases for this police station have up-to-date documentation and custody logs."
              actionLabel="Create New Seizure Memo"
              onAction={() => toast.info('New memo modal triggered')}
            />
          </div>
        </section>

        {/* 10. DISCLAIMERS & LEGAL BADGES */}
        <section>
          <SectionTitle title="10. Disclaimer Banners & Legal Badges" subtitle="Mandatory compliance and synthetic privacy notices" />
          <div className="flex flex-col gap-3">
            <DisclaimerBanner type="legal" />
            <DisclaimerBanner type="privacy" />
            <DisclaimerBanner type="warning" />
            <DisclaimerBanner type="info" />
          </div>
        </section>
      </div>

      {/* Interactive Modal Dialog */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Section 105 BNSS Compliance Check"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setModalOpen(false);
                toast.success('Checklist confirmed');
              }}
            >
              Confirm Procedure
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3 text-sm text-muted">
          <p>
            Please certify that the audio-video recording of the search and seizure was created in the presence of independent panchas and hash was recorded.
          </p>
          <div className="p-3 bg-navy-900 rounded-xl border border-navy-600 text-white font-mono text-xs">
            Hash: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
          </div>
        </div>
      </Modal>

      {/* Interactive Bottom Sheet */}
      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Quick Police Actions"
        footer={
          <Button fullWidth variant="primary" onClick={() => setSheetOpen(false)}>
            Close Sheet
          </Button>
        }
      >
        <div className="flex flex-col gap-2">
          <ListItem
            icon={<Camera className="w-5 h-5" />}
            title="Record Video & Hash"
            subtitle="Audio-video seizure under BNSS Sec 105"
            onClick={() => {
              setSheetOpen(false);
              toast.info('Audio-video module ready');
            }}
          />
          <ListItem
            icon={<FileText className="w-5 h-5" />}
            title="Generate Sec 63 BSA Certificate"
            subtitle="Admissibility certificate for court production"
            onClick={() => {
              setSheetOpen(false);
              toast.info('Certificate generator ready');
            }}
          />
          <ListItem
            icon={<Clock className="w-5 h-5" />}
            title="Calculate Remand Expiry"
            subtitle="BNSS Sec 187 statutory police remand calculator"
            onClick={() => {
              setSheetOpen(false);
              toast.info('Remand clock ready');
            }}
          />
        </div>
      </BottomSheet>

      {/* Interactive Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          toast.warning('Evidence item marked for forensic dispatch');
        }}
        title="Dispatch Evidence to FSL?"
        message="This action will finalize the digital chain of custody log and generate a dispatch receipt for the forensic laboratory."
        confirmText="Dispatch to FSL"
        variant={confirmVariant}
      />
    </div>
  );
};
