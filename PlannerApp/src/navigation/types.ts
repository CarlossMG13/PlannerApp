export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  // Cliente
  RegisterClientStep2: undefined;
  RegisterClientStep3: undefined;
  RegisterClientStep4: undefined;
  // Planner
  RegisterPlannerStep2: undefined;
  RegisterPlannerStep3: undefined;
  RegisterPlannerStep4: undefined;
  // Proveedor
  RegisterVendorStep2: undefined;
  RegisterVendorStep3: undefined;
  // Verificación
  EmailVerification: undefined;
  TwoFactor: undefined;
};

export type ClientStackParamList = {
  ClientTabs: undefined;
  CreateEvent: undefined;
  EventDetail: { eventId: string };
};

export type ClientTabParamList = {
  ClientHome: undefined;
  ClientEvents: undefined;
  ClientProfile: undefined;
};

export type PlannerStackParamList = {
  PlannerTabs: undefined;
  CreateEvent: undefined;
  EventDetail: { eventId: string };
};

export type PlannerTabParamList = {
  PlannerHome: undefined;
  PlannerEvents: undefined;
  PlannerProfile: undefined;
};

export type VendorTabParamList = {
  VendorHome: undefined;
  VendorServices: undefined;
  VendorProfile: undefined;
};
