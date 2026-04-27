export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  RegisterClientStep2: {};
  RegisterClientStep3: {
    name: string;
    preferredCity: string;
    preferredGuestRange: string;
  };
  RegisterClientStep4: {
    name: string;
    preferredCity: string;
    preferredGuestRange: string;
    eventTypes: string[];
  };
  RegisterPlannerStep2: {};
  RegisterPlannerStep3: {
    identityType: string;
    businessName: string;
    experience: number;
    specialties: string[];
  };
  EmailVerification: undefined;
};
