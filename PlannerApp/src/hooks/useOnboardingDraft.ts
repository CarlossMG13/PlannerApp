import React, { createContext, useContext, useState } from "react";
import { useSignUp } from "@clerk/clerk-expo";

export type OnboardingRole = "CLIENT" | "PLANNER" | "VENDOR";

export interface ProfileDraft {
  // Shared
  name?: string;
  rfc?: string;
  razonSocial?: string;
  regimenFiscal?: string;
  // Client
  preferredCity?: string;
  preferredGuestRange?: string;
  eventTypes?: string[];
  // Planner
  identityType?: string;
  businessName?: string;
  experience?: number;
  specialties?: string[];
  portfolioImages?: string[];
  budgetRange?: string;
  bio?: string;
  // Vendor
  categoryName?: string;
  vendorBio?: string;
}

interface OnboardingState {
  role: OnboardingRole | null;
  profile: ProfileDraft;
}

interface OnboardingContextValue {
  draft: OnboardingState;
  setRole: (role: OnboardingRole) => void;
  mergeDraft: (partial: Partial<ProfileDraft>) => void;
  submitSignUp: (email: string, password: string) => Promise<void>;
  reset: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue>(null!);

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { signUp } = useSignUp();
  const [draft, setDraft] = useState<OnboardingState>({
    role: null,
    profile: {},
  });

  const setRole = (role: OnboardingRole) =>
    setDraft((prev) => ({ ...prev, role }));

  const mergeDraft = (partial: Partial<ProfileDraft>) =>
    setDraft((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...partial },
    }));

  const reset = () => setDraft({ role: null, profile: {} });

  const submitSignUp = async (email: string, password: string) => {
    if (!signUp || !draft.role) throw new Error("No hay rol seleccionado");

    const { profile, role } = draft;
    const displayName =
      role === "CLIENT" ? (profile.name ?? "") : (profile.businessName ?? "");
    const firstName = displayName.split(" ")[0] || "Usuario";
    const lastName = displayName.split(" ").slice(1).join(" ") || undefined;

    await signUp.create({
      emailAddress: email,
      password,
      firstName,
      lastName,
      unsafeMetadata: { role, profile },
    });

    await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
  };

  return React.createElement(
    OnboardingContext.Provider,
    { value: { draft, setRole, mergeDraft, submitSignUp, reset } },
    children,
  );
}

export const useOnboardingDraft = () => useContext(OnboardingContext);
