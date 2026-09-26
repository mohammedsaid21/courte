import OnboardingWizard from "@/components/onboarding-wizard";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OnboardingWizard />
      {children}
    </>
  );
}
