import React, { useState } from 'react';
import { useI18n } from '../../i18n/index.ts';
import { Button } from '../ui/index.ts';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface OnboardingCarouselProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({
  onComplete,
  onSkip,
}) => {
  const { t } = useI18n();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: t('welcome.carousel.step1Title'),
      description: t('welcome.carousel.step1Desc'),
      illustration: (
        <svg viewBox="0 0 200 200" className="w-36 h-36" fill="none">
          <circle cx="100" cy="100" r="90" fill="#13315C" stroke="#1B3F73" strokeWidth="4" />
          {/* Shield */}
          <path
            d="M100 42 L144 58 V96 C144 124 122 144 100 156 C78 144 56 124 56 96 V58 Z"
            fill="#0B2545"
            stroke="#FF9933"
            strokeWidth="4"
          />
          {/* Checklist Marks */}
          <path d="M82 96 L94 108 L122 80" stroke="#138808" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="80" y1="124" x2="120" y2="124" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: t('welcome.carousel.step2Title'),
      description: t('welcome.carousel.step2Desc'),
      illustration: (
        <svg viewBox="0 0 200 200" className="w-36 h-36" fill="none">
          <circle cx="100" cy="100" r="90" fill="#13315C" stroke="#1B3F73" strokeWidth="4" />
          {/* Document with folded corner */}
          <path
            d="M66 48 H118 L142 72 V152 H66 Z"
            fill="#0B2545"
            stroke="#1B3F73"
            strokeWidth="4"
          />
          <path d="M118 48 V72 H142" stroke="#1B3F73" strokeWidth="4" fill="#13315C" />
          {/* Padlock */}
          <rect x="84" y="98" width="32" height="28" rx="6" fill="#FF9933" />
          <path d="M92 98 V88 C92 83.5 95.5 80 100 80 C104.5 80 108 83.5 108 88 V98" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
          {/* SHA-256 badge */}
          <text x="100" y="142" fill="#138808" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
            SHA-256 ✓
          </text>
        </svg>
      ),
    },
    {
      title: t('welcome.carousel.step3Title'),
      description: t('welcome.carousel.step3Desc'),
      illustration: (
        <svg viewBox="0 0 200 200" className="w-36 h-36" fill="none">
          <circle cx="100" cy="100" r="90" fill="#13315C" stroke="#1B3F73" strokeWidth="4" />
          {/* Device outline */}
          <rect x="68" y="44" width="64" height="112" rx="12" fill="#0B2545" stroke="#FF9933" strokeWidth="3" />
          <rect x="76" y="58" width="48" height="78" rx="4" fill="#13315C" />
          <circle cx="100" cy="144" r="3" fill="#FFFFFF" />
          {/* Wifi off icon */}
          <path d="M84 82 C94 74 106 74 116 82" stroke="#B8C4D6" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M90 92 C96 87 104 87 110 92" stroke="#B8C4D6" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="100" cy="102" r="2.5" fill="#138808" />
          {/* Strikethrough line */}
          <line x1="78" y1="74" x2="122" y2="114" stroke="#E5484D" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 max-w-[480px] mx-auto w-full animate-in fade-in duration-200">
      {/* Top Bar with Skip */}
      <div className="flex items-center justify-between min-h-[44px]">
        {currentSlide > 0 ? (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1 text-sm text-muted hover:text-white font-medium p-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('welcome.carousel.back')}</span>
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={onSkip}
          className="text-xs font-semibold uppercase tracking-wider text-saffron hover:text-saffron-600 px-3 py-2 rounded-lg"
        >
          {t('welcome.carousel.skip')}
        </button>
      </div>

      {/* Main Slide Content */}
      <div className="flex flex-col items-center text-center my-auto py-6">
        <div className="mb-6 drop-shadow-md">{slides[currentSlide].illustration}</div>
        <h2 className="text-xl font-bold text-white tracking-wide leading-tight">
          {slides[currentSlide].title}
        </h2>
        <p className="text-muted text-sm mt-3 max-w-xs leading-relaxed">
          {slides[currentSlide].description}
        </p>
      </div>

      {/* Bottom Controls: Dots & Navigation Button */}
      <div className="flex flex-col gap-6 pt-4">
        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentSlide === idx ? 'w-8 bg-saffron' : 'w-2 bg-navy-600'
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleNext}
          icon={<ArrowRight className="w-5 h-5" />}
          iconPosition="right"
        >
          {currentSlide === slides.length - 1
            ? t('welcome.profile.title')
            : t('welcome.carousel.next')}
        </Button>
      </div>
    </div>
  );
};
