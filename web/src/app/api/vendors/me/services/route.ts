import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, badRequest, forbidden, serverError } from "@/lib/responses";
import { Role } from "@prisma/client";

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

async function resolveVendorProfile(clerkId: string) {
  let user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, role: true },
  });

  // Bootstrap user if webhook hasn't fired yet
  if (!user) {
    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(clerkId);
      const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
      const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "Usuario";
      const claimedRole = (clerkUser.unsafeMetadata?.role as string | undefined)?.toUpperCase();
      const role: Role = claimedRole === "VENDOR" ? "VENDOR" : "CLIENT";
      user = await prisma.user.upsert({
        where: { clerkId },
        create: { clerkId, email, name, role },
        update: {},
        select: { id: true, role: true },
      });
    } catch {
      return null;
    }
  }

  if (user.role !== "VENDOR") return null;

  let vendor = await prisma.vendorProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, categoryId: true },
  });

  // Bootstrap VendorProfile if missing (race condition or failed registration)
  if (!vendor) {
    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(clerkId);
      const profile = clerkUser.unsafeMetadata?.profile as Record<string, unknown> | undefined;
      const businessName = (profile?.businessName as string | undefined) ?? "Mi Negocio";
      const bio = (profile?.vendorBio as string | undefined) ?? null;
      const catKey = ((profile?.categoryName as string | undefined) ?? "").toUpperCase();
      const catName = CATEGORY_NAME_MAP[catKey] ?? "Banquetes y Catering";

      const category = await prisma.vendorCategory.findFirst({
        where: { name: { contains: catName, mode: "insensitive" } },
        select: { id: true },
      }) ?? await prisma.vendorCategory.findFirst({ select: { id: true } });

      if (!category) return null;

      vendor = await prisma.vendorProfile.create({
        data: { userId: user.id, businessName, bio, categoryId: category.id },
        select: { id: true, categoryId: true },
      });
    } catch {
      return null;
    }
  }

  return vendor;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const vendor = await resolveVendorProfile(userId);
    if (!vendor) return forbidden("No eres un proveedor");

    const services = await prisma.vendorService.findMany({
      where: { vendorId: vendor.id },
      select: {
        id: true,
        name: true,
        description: true,
        basePrice: true,
        currency: true,
        category: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });

    return ok({ services });
  } catch (err) {
    console.error("[GET /api/vendors/me/services]", (err as Error).message);
    return serverError();
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const vendor = await resolveVendorProfile(userId);
    if (!vendor) return forbidden("No eres un proveedor");

    const body = await req.json();
    const { name, description, basePrice, currency = "MXN", categoryId } = body;

    if (!name || basePrice == null) return badRequest("name y basePrice son requeridos");

    const service = await prisma.vendorService.create({
      data: {
        vendorId: vendor.id,
        categoryId: categoryId ?? vendor.categoryId,
        name,
        description: description ?? null,
        basePrice,
        currency,
      },
      select: { id: true, name: true, description: true, basePrice: true, currency: true },
    });

    return ok({ service }, 201);
  } catch (err) {
    console.error("[POST /api/vendors/me/services]", (err as Error).message);
    return serverError();
  }
}
