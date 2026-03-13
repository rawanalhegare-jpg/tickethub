import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Ticket, ShieldCheck, RefreshCw, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  {
    icon: Ticket,
    color: "from-blue-600 to-sky-500",
    title: "Buy Tickets Fairly",
    subtitle: "Slide 1 of 3",
    description: "TickFan ensures every real fan gets a fair shot at tickets. No bots, no scalpers — just you and the game.",
    bg: "from-blue-900 via-blue-700 to-sky-600",
  },
  {
    icon: ShieldCheck,
    color: "from-emerald-600 to-teal-500",
    title: "Store Your Digital Tickets",
    subtitle: "Slide 2 of 3",
    description: "All your tickets in one secure place. QR-coded digital tickets that are impossible to counterfeit or duplicate.",
    bg: "from-emerald-900 via-emerald-700 to-teal-600",
  },
  {
    icon: RefreshCw,
    color: "from-cyan-600 to-blue-500",
    title: "Resell Safely Inside the Platform",
    subtitle: "Slide 3 of 3",
    description: "Can't make it? Resell your ticket officially through TickFan at a fair price. Secure, transparent, and protected.",
    bg: "from-cyan-900 via-cyan-700 to-blue-600",
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  const goNext = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide((s) => s + 1);
    } else {
      onComplete();
    }
  };

  const goPrev = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide((s) => s - 1);
    }
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${slide.bg} flex flex-col items-center justify-center p-6 transition-all duration-700`}>
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="mb-8 flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Ticket className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-bold text-2xl font-[Montserrat] tracking-tight">TickFan</span>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 60 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="w-full flex flex-col items-center text-center"
          >
            <div className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${slide.color} shadow-2xl flex items-center justify-center mb-8`}>
              <Icon className="w-14 h-14 text-white" />
            </div>

            <p className="text-white/60 text-sm font-medium mb-3 tracking-widest uppercase">{slide.subtitle}</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-[Montserrat]">{slide.title}</h1>
            <p className="text-white/80 text-lg leading-relaxed max-w-xs">{slide.description}</p>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center gap-2 mt-10 mb-8">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > currentSlide ? 1 : -1); setCurrentSlide(i); }}
              data-testid={`onboarding-dot-${i}`}
              className={`rounded-full transition-all duration-300 ${i === currentSlide ? "w-8 h-2 bg-white" : "w-2 h-2 bg-white/40"}`}
            />
          ))}
        </div>

        <div className="w-full space-y-3">
          <Button
            onClick={goNext}
            className="w-full h-14 text-lg font-semibold bg-white text-blue-700 rounded-xl shadow-lg"
            data-testid="btn-onboarding-next"
          >
            {currentSlide < slides.length - 1 ? (
              <>Next <ChevronRight className="w-5 h-5 ml-1" /></>
            ) : (
              "Get Started"
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={onComplete}
            className="w-full text-white/70 h-11"
            data-testid="btn-onboarding-skip"
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}
