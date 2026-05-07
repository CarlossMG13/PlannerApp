import { z } from "zod";

const rfcRegex = /^[A-Z0-9Ñ&]{12,13}$/i;

const fiscalFields = z.object({
  rfc: z.string().regex(rfcRegex, "RFC inválido").optional().or(z.literal("")),
  razonSocial: z.string().max(200).optional(),
  regimenFiscal: z.string().optional(),
});

export const createProfileSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("CLIENT"),
    preferredCity: z.string().min(1).max(100).optional(),
    preferredGuestRange: z.string().optional(),
    company: z.string().max(200).optional(),
    notes: z.string().max(500).optional(),
  }).merge(fiscalFields),

  z.object({
    role: z.literal("PLANNER"),
    identityType: z.enum(["COMPANY", "INDEPENDENT"]).optional(),
    businessName: z.string().min(1).max(200).optional(),
    bio: z.string().max(1000).optional(),
    experience: z.number().int().min(0).max(50).optional(),
    specialties: z.array(z.string()).max(10).optional(),
    coverageCities: z.array(z.string()).max(20).optional(),
    portfolioUrls: z.array(z.string().url()).max(10).optional(),
    budgetRange: z.string().optional(),
    website: z.string().url().optional().or(z.literal("")),
  }).merge(fiscalFields),

  z.object({
    role: z.literal("VENDOR"),
    businessName: z.string().min(1).max(200),
    bio: z.string().max(500).optional(),
    vendorBio: z.string().max(500).optional(),  // alias sent by onboarding draft
    categoryId: z.string().cuid().optional(),   // UUID from DB picker
    categoryName: z.string().optional(),        // enum value from onboarding draft
  }).merge(fiscalFields),
]);

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
