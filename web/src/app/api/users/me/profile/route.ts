import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { createProfileSchema } from "@/lib/validation";
import { ok, unauthorized, forbidden, badRequest, serverError } from "@/lib/responses";
import { Role } from "@prisma/client";

const VALID_ROLES: Role[] = ["CLIENT", "PLANNER", "VENDOR", "ADMIN"];

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  let user = await prisma.user.findUnique({ where: { clerkId: userId } });

  // Webhook may not have fired yet — bootstrap the user record from Clerk directly
  if (!user) {
    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
      const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "Usuario";
      const claimedRole = (clerkUser.unsafeMetadata?.role as string | undefined)?.toUpperCase();
      const role: Role = (claimedRole && (VALID_ROLES as string[]).includes(claimedRole))
        ? (claimedRole as Role)
        : "CLIENT";

      user = await prisma.user.upsert({
        where: { clerkId: userId },
        create: { clerkId: userId, email, name, role },
        update: {},
      });
    } catch (err) {
      console.error("[profile] Error bootstrapping user:", err);
      return serverError();
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Body inválido");
  }

  const parsed = createProfileSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const input = parsed.data;

  // Verify role matches what the server assigned (not what the client claims)
  if (input.role !== user.role) {
    return forbidden("El rol no coincide con el usuario registrado");
  }

  try {
    if (input.role === "CLIENT") {
      const profile = await prisma.clientProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          preferredCity: input.preferredCity,
          preferredGuestRange: input.preferredGuestRange,
          company: input.company,
          notes: input.notes,
          rfc: input.rfc || null,
          razonSocial: input.razonSocial || null,
          regimenFiscal: input.regimenFiscal || null,
        },
        update: {
          preferredCity: input.preferredCity,
          preferredGuestRange: input.preferredGuestRange,
          company: input.company,
          notes: input.notes,
          rfc: input.rfc || null,
          razonSocial: input.razonSocial || null,
          regimenFiscal: input.regimenFiscal || null,
        },
      });
      return ok({ profile });
    }

    if (input.role === "PLANNER") {
      const profile = await prisma.plannerProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          identityType: input.identityType ?? "COMPANY",
          businessName: input.businessName,
          bio: input.bio,
          experience: input.experience,
          specialties: input.specialties ?? [],
          coverageCities: input.coverageCities ?? [],
          portfolioUrls: input.portfolioUrls ?? [],
          budgetRange: input.budgetRange,
          website: input.website || null,
          rfc: input.rfc || null,
          razonSocial: input.razonSocial || null,
          regimenFiscal: input.regimenFiscal || null,
        },
        update: {
          identityType: input.identityType ?? "COMPANY",
          businessName: input.businessName,
          bio: input.bio,
          experience: input.experience,
          specialties: input.specialties ?? [],
          coverageCities: input.coverageCities ?? [],
          portfolioUrls: input.portfolioUrls ?? [],
          budgetRange: input.budgetRange,
          website: input.website || null,
          rfc: input.rfc || null,
          razonSocial: input.razonSocial || null,
          regimenFiscal: input.regimenFiscal || null,
        },
      });
      return ok({ profile });
    }

    if (input.role === "VENDOR") {
      // Map enum values from the onboarding draft to DB category names
      const CATEGORY_NAME_MAP: Record<string, string> = {
        CATERING:      "Banquetes y Catering",
        PHOTOGRAPHY:   "Fotografía",
        VIDEO:         "Video / Videografía",
        MUSIC:         "Música y DJ",
        DECORATION:    "Decoración y Flores",
        VENUE:         "Salones, Jardines y Venues",
        FLOWERS:       "Decoración y Flores",
        LIGHTING:      "Iluminación y Audio",
        TRANSPORT:     "Transporte",
        BEAUTY:        "Maquillaje y Estilismo",
        ENTERTAINMENT: "Animación y Entretenimiento",
        STATIONERY:    "Invitaciones y Papelería",
        SECURITY:      "Animación y Entretenimiento",
        OTHER:         "Mobiliario y Renta",
      };

      const bio = (input as any).vendorBio ?? input.bio;

      let category = null;
      if (input.categoryId) {
        category = await prisma.vendorCategory.findUnique({ where: { id: input.categoryId } });
      } else {
        const catName = (input as any).categoryName as string | undefined;
        const mapped = catName ? (CATEGORY_NAME_MAP[catName.toUpperCase()] ?? catName) : null;
        if (mapped) {
          category = await prisma.vendorCategory.findFirst({
            where: { name: { contains: mapped, mode: "insensitive" } },
          });
        }
        if (!category) {
          // fallback: use the first available category
          category = await prisma.vendorCategory.findFirst();
        }
      }
      if (!category) return badRequest("No hay categorías de proveedor en la base de datos");

      const profile = await prisma.vendorProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          businessName: input.businessName,
          bio: bio ?? null,
          categoryId: category.id,
        },
        update: {
          businessName: input.businessName,
          bio: bio ?? null,
          categoryId: category.id,
        },
      });
      return ok({ profile });
    }

    return badRequest("Rol no soportado");
  } catch (err) {
    console.error("[profile] Error:", err);
    return serverError();
  }
}
