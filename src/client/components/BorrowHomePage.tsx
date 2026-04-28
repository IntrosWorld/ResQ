import React from "react";
import HeroSection from "./borrow/HeroSection";
import MessageSection from "./borrow/MessageSection";
import AboutSection from "./borrow/AboutSection";
import UseCasesSection from "./borrow/UseCasesSection";
import PlatformFeaturesSection from "./borrow/PlatformFeaturesSection";
import TestimonialSection from "./borrow/TestimonialSection";
import ProactiveOperationsSection from "./borrow/ProactiveOperationsSection";
import { Footer } from "./borrow/Footer";

interface BorrowHomePageProps {
  onNavigate: (path: string) => void;
}

export function BorrowHomePage({ onNavigate }: BorrowHomePageProps) {
  return (
    <main className="flex min-h-screen flex-col bg-[#050508]">
      <HeroSection onNavigateTo={onNavigate} />
      <MessageSection />
      <AboutSection />
      <UseCasesSection onNavigate={onNavigate} />
      <PlatformFeaturesSection />
      <TestimonialSection />
      <ProactiveOperationsSection />
      <Footer />
    </main>
  );
}
