import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { createProfileSchema } from "@/lib/validation";
import { ok, unauthorized, forbidden, notFound, badRequest, serverError } from "@/lib/responses";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return notFound("Usuario no encontrado. El webhook aún no procesó el registro.");

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
      // Validate categoryId exists
      const category = await prisma.vendorCategory.findUnique({
        where: { id: input.categoryId },
      });
      if (!category) return badRequest("Categoría de proveedor inválida");

      const profile = await prisma.vendorProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          businessName: input.businessName,
          bio: input.bio,
          categoryId: input.categoryId,
        },
        update: {
          businessName: input.businessName,
          bio: input.bio,
          categoryId: input.categoryId,
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
