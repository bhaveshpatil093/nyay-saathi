import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, OfficerProfile, AppLanguage } from '../context/AppContext.tsx';
import { SplashScreen } from '../components/welcome/SplashScreen.tsx';
import { LanguageSelectScreen } from '../components/welcome/LanguageSelectScreen.tsx';
import { OnboardingCarousel } from '../components/welcome/OnboardingCarousel.tsx';
import { OfficerProfileForm } from '../components/welcome/OfficerProfileForm.tsx';
import { PrivacyDisclaimerScreen } from '../components/welcome/PrivacyDisclaimerScreen.tsx';

type WelcomeStep = 'splash' | 'language' | 'carousel' | 'profile' | 'disclaimer';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage, profile, completeOnboarding } = useApp();

  const [currentStep, setCurrentStep] = useState<WelcomeStep>('splash');
  const [draftProfile, setDraftProfile] = useState<OfficerProfile | null>(profile);

  // 1. Splash finished -> Move to Language Choice
  const handleSplashComplete = () => {
    setCurrentStep('language');
  };

  // 2. Language chosen -> Move to Carousel
  const handleLanguageSelect = (lang: AppLanguage) => {
    setLanguage(lang);
    setCurrentStep('carousel');
  };

  // 2b. Continue as Citizen (skips profile)
  const handleContinueAsCitizen = () => {
    completeOnboarding('citizen', language);
    navigate('/citizen');
  };

  // 3. Carousel completed or skipped -> Move to Profile Setup
  const handleCarouselComplete = () => {
    setCurrentStep('profile');
  };

  const handleCarouselSkip = () => {
    setCurrentStep('profile');
  };

  // 4. Officer profile submitted -> Move to Disclaimer
  const handleProfileSubmit = (newProfile: OfficerProfile) => {
    setDraftProfile(newProfile);
    setCurrentStep('disclaimer');
  };

  const handleProfileBack = () => {
    setCurrentStep('carousel');
  };

  // 5. Disclaimer confirmed -> Complete onboarding & go to Home
  const handleDisclaimerConfirm = () => {
    completeOnboarding('officer', language, draftProfile || undefined);
    navigate('/');
  };

  const handleDisclaimerBack = () => {
    setCurrentStep('profile');
  };

  return (
    <div className="min-h-screen bg-navy-900 text-white flex flex-col justify-between safe-top safe-bottom">
      {currentStep === 'splash' && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}

      {currentStep === 'language' && (
        <LanguageSelectScreen
          onSelectLanguage={handleLanguageSelect}
          onContinueCitizen={handleContinueAsCitizen}
        />
      )}

      {currentStep === 'carousel' && (
        <OnboardingCarousel
          onComplete={handleCarouselComplete}
          onSkip={handleCarouselSkip}
        />
      )}

      {currentStep === 'profile' && (
        <OfficerProfileForm
          initialProfile={draftProfile}
          onSubmit={handleProfileSubmit}
          onBack={handleProfileBack}
        />
      )}

      {currentStep === 'disclaimer' && (
        <PrivacyDisclaimerScreen
          onConfirm={handleDisclaimerConfirm}
          onBack={handleDisclaimerBack}
        />
      )}
    </div>
  );
};
