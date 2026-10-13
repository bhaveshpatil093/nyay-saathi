import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './components/ui/index.ts';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { AppLayout } from './components/layout/AppLayout.tsx';
import { WelcomePage } from './pages/WelcomePage.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { CasesListPage } from './pages/cases/CasesListPage.tsx';
import { CaseFormPage } from './pages/cases/CaseFormPage.tsx';
import { CaseDetailPage } from './pages/cases/CaseDetailPage.tsx';
import { OffencePickerPage } from './pages/guide/OffencePickerPage.tsx';
import { OffenceDetailPage } from './pages/guide/OffenceDetailPage.tsx';
import { ChecklistRunnerPage } from './pages/checklist/ChecklistRunnerPage.tsx';
import { DeadlinesTrackerPage } from './pages/deadlines/DeadlinesTrackerPage.tsx';
import { EvidenceListPage } from './pages/evidence/EvidenceListPage.tsx';
import { EvidenceDetailPage } from './pages/evidence/EvidenceDetailPage.tsx';
import { NewEvidencePage } from './pages/evidence/NewEvidencePage.tsx';
import { VerifyPage } from './pages/evidence/VerifyPage.tsx';
import { SearchSeizureWizardPage } from './pages/cases/SearchSeizureWizardPage.tsx';
import { DocumentsPage } from './pages/documents/DocumentsPage.tsx';
import { SearchQuickReferencePage } from './pages/search/SearchQuickReferencePage.tsx';
import { ComplianceDashboardPage } from './pages/dashboard/ComplianceDashboardPage.tsx';
import { SettingsPage } from './pages/settings/SettingsPage.tsx';
import { AboutPage } from './pages/about/AboutPage.tsx';
import { SecurityProvider } from './context/SecurityContext.tsx';
import { PWAProvider } from './context/PWAContext.tsx';
import { DemoProvider } from './context/DemoContext.tsx';
import { LockScreen } from './components/security/LockScreen.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import { GuidedDemoOverlay } from './components/demo/GuidedDemoOverlay.tsx';

import { CitizenRightsPage } from './pages/citizen/CitizenRightsPage.tsx';
import { CitizenStepsPage } from './pages/citizen/CitizenStepsPage.tsx';
import { CitizenComplaintPage } from './pages/citizen/CitizenComplaintPage.tsx';
import { CitizenHelpPage } from './pages/citizen/CitizenHelpPage.tsx';
import { StyleguidePage } from './pages/StyleguidePage.tsx';
import { MorePage } from './pages/MorePage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';
import { DevI18nPage } from './pages/DevI18nPage.tsx';
import { DevDbPage } from './pages/DevDbPage.tsx';
import { DevProcedurePage } from './pages/DevProcedurePage.tsx';
import { PlaceholderPage, PlaceholderConfig } from './pages/PlaceholderPage.tsx';

import {
  Home,
  Briefcase,
  BookOpen,
  Camera,
  Scale,
  Clock,
  FileText,
  Search,
  LayoutDashboard,
  Settings,
  Info,
  CheckSquare,
  ShieldCheck,
  Plus,
  HelpCircle,
  FileCheck2,
} from 'lucide-react';

// Streamlined route configs mapping to i18n keys
const routeConfigs: Record<string, PlaceholderConfig> = {
  home: { pageKey: 'home', icon: <Home className="w-8 h-8 text-saffron" />, actionPath: '/cases/new' },
  cases: { pageKey: 'cases', icon: <Briefcase className="w-8 h-8 text-saffron" />, actionPath: '/cases/new' },
  casesNew: { pageKey: 'casesNew', icon: <Plus className="w-8 h-8 text-saffron" />, actionPath: '/cases' },
  caseDetail: { pageKey: 'caseDetail', icon: <Briefcase className="w-8 h-8 text-saffron" />, actionPath: '/cases' },
  guide: { pageKey: 'guide', icon: <BookOpen className="w-8 h-8 text-saffron" />, actionPath: '/guide/bns_303' },
  guideDetail: { pageKey: 'guideDetail', icon: <BookOpen className="w-8 h-8 text-saffron" />, actionPath: '/checklist/run_new' },
  checklist: { pageKey: 'checklist', icon: <CheckSquare className="w-8 h-8 text-saffron" />, actionPath: '/guide' },
  deadlines: { pageKey: 'deadlines', icon: <Clock className="w-8 h-8 text-saffron" />, actionPath: '/cases' },
  evidence: { pageKey: 'evidence', icon: <Camera className="w-8 h-8 text-saffron" />, actionPath: '/evidence/new' },
  evidenceNew: { pageKey: 'evidenceNew', icon: <Camera className="w-8 h-8 text-saffron" />, actionPath: '/evidence' },
  evidenceDetail: { pageKey: 'evidenceDetail', icon: <ShieldCheck className="w-8 h-8 text-saffron" />, actionPath: '/verify' },
  verify: { pageKey: 'verify', icon: <ShieldCheck className="w-8 h-8 text-saffron" />, actionPath: '/evidence' },
  documents: { pageKey: 'documents', icon: <FileText className="w-8 h-8 text-saffron" />, actionPath: '/documents/new_seizure' },
  docDetail: { pageKey: 'docDetail', icon: <FileCheck2 className="w-8 h-8 text-saffron" />, actionPath: '/documents' },
  search: { pageKey: 'search', icon: <Search className="w-8 h-8 text-saffron" />, actionPath: '/' },
  dashboard: { pageKey: 'dashboard', icon: <LayoutDashboard className="w-8 h-8 text-saffron" />, actionPath: '/' },
  settings: { pageKey: 'settings', icon: <Settings className="w-8 h-8 text-saffron" />, actionPath: '/more' },
  about: { pageKey: 'about', icon: <Info className="w-8 h-8 text-saffron" />, actionPath: '/' },
  citizen: { pageKey: 'citizen', icon: <Scale className="w-8 h-8 text-saffron" />, actionPath: '/citizen/steps' },
  citizenSteps: { pageKey: 'citizenSteps', icon: <CheckSquare className="w-8 h-8 text-saffron" />, actionPath: '/citizen/complaint' },
  citizenComplaint: { pageKey: 'citizenComplaint', icon: <FileText className="w-8 h-8 text-saffron" />, actionPath: '/citizen/help' },
  citizenHelp: { pageKey: 'citizenHelp', icon: <HelpCircle className="w-8 h-8 text-saffron" />, actionPath: '/citizen' },
};

// Onboarding protection wrapper
const OnboardingGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { onboardingComplete } = useApp();
  const location = useLocation();

  if (
    !onboardingComplete &&
    location.pathname !== '/welcome' &&
    location.pathname !== '/styleguide' &&
    location.pathname !== '/dev/i18n' &&
    location.pathname !== '/dev/db' &&
    location.pathname !== '/dev/procedure'
  ) {
    return <Navigate to="/welcome" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <SecurityProvider>
          <PWAProvider>
            <DemoProvider>
              <ToastProvider>
                <LockScreen />
                <HashRouter>
                  <GuidedDemoOverlay />
                  <OnboardingGuard>
                    <Routes>
                      {/* Standalone full-screen pages */}
                      <Route path="/welcome" element={<WelcomePage />} />
                      <Route path="/styleguide" element={<StyleguidePage />} />

                      {/* Main Shell layout */}
                      <Route element={<AppLayout />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/cases" element={<CasesListPage />} />
                        <Route path="/cases/new" element={<CaseFormPage />} />
                        <Route path="/cases/:caseId/edit" element={<CaseFormPage />} />
                        <Route path="/cases/:caseId" element={<CaseDetailPage />} />
                        <Route path="/cases/:caseId/search-seizure" element={<SearchSeizureWizardPage />} />
                        <Route path="/guide" element={<OffencePickerPage />} />
                        <Route path="/guide/:offenceId" element={<OffenceDetailPage />} />
                        <Route path="/checklist/:runId" element={<ChecklistRunnerPage />} />
                        <Route path="/deadlines" element={<DeadlinesTrackerPage />} />
                        <Route path="/evidence" element={<EvidenceListPage />} />
                        <Route path="/evidence/new" element={<NewEvidencePage />} />
                        <Route path="/evidence/:evidenceId" element={<EvidenceDetailPage />} />
                        <Route path="/verify" element={<VerifyPage />} />
                        <Route path="/documents" element={<DocumentsPage />} />
                        <Route path="/documents/:docId" element={<DocumentsPage />} />
                        <Route path="/search" element={<SearchQuickReferencePage />} />
                        <Route path="/dashboard" element={<ComplianceDashboardPage />} />
                        <Route path="/more" element={<MorePage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/citizen" element={<CitizenRightsPage />} />
                        <Route path="/citizen/steps" element={<CitizenStepsPage />} />
                        <Route path="/citizen/complaint" element={<CitizenComplaintPage />} />
                        <Route path="/citizen/help" element={<CitizenHelpPage />} />
                        <Route path="/dev/i18n" element={<DevI18nPage />} />
                        <Route path="/dev/db" element={<DevDbPage />} />
                        <Route path="/dev/procedure" element={<DevProcedurePage />} />
                        <Route path="*" element={<NotFoundPage />} />
                      </Route>
                    </Routes>
                  </OnboardingGuard>
                </HashRouter>
              </ToastProvider>
            </DemoProvider>
          </PWAProvider>
        </SecurityProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}


