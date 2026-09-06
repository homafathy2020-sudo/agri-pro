// src/pages/LandingPage.jsx
import React from "react";
import LandingNav          from "../features/landing/LandingNav";
import Hero                from "../features/landing/Hero";
import ProblemSection      from "../features/landing/ProblemSection";
import RealizationSection  from "../features/landing/RealizationSection";
import IntroSection        from "../features/landing/IntroSection";
import ConnectedFlowSection from "../features/landing/ConnectedFlowSection";
import FeaturesSection     from "../features/landing/FeaturesSection";
import DashboardSection    from "../features/landing/DashboardSection";
import BeforeAfterSection  from "../features/landing/BeforeAfterSection";
import FounderSection      from "../features/landing/FounderSection";
import TrustSection        from "../features/landing/TrustSection";
import FinalCtaSection     from "../features/landing/FinalCtaSection";
import LandingFooter       from "../features/landing/LandingFooter";

/**
 * Public marketing landing page.
 * Rendered at "/" for unauthenticated visitors (see ProtectedRoute).
 * Logged-in users never see this — "/" resolves to the Dashboard for them.
 */
const LandingPage = () => (
  <div className="min-h-screen bg-dark font-arabic" dir="rtl">
    <LandingNav />
    <Hero />
    <ProblemSection />
    <RealizationSection />
    <IntroSection />
    <ConnectedFlowSection />
    <FeaturesSection />
    <DashboardSection />
    <BeforeAfterSection />
    <FounderSection />
    <TrustSection />
    <FinalCtaSection />
    <LandingFooter />
  </div>
);

export default LandingPage;
