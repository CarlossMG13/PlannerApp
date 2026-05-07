import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const VENDOR_CATEGORIES = [
  { name: "Banquetes y Catering", icon: "restaurant" },
  { name: "Fotografía", icon: "camera" },
  { name: "Video / Videografía", icon: "videocam" },
  { name: "Música y DJ", icon: "musical-notes" },
  { name: "Decoración y Flores", icon: "color-palette" },
  { name: "Salones, Jardines y Venues", icon: "home" },
  { name: "Pastelería y Postres", icon: "cafe" },
  { name: "Bar y Bebidas", icon: "wine" },
  { name: "Mobiliario y Renta", icon: "cube" },
  { name: "Maquillaje y Estilismo", icon: "brush" },
  { name: "Invitaciones y Papelería", icon: "mail" },
  { name: "Animación y Entretenimiento", icon: "happy" },
  { name: "Transporte", icon: "car" },
  { name: "Iluminación y Audio", icon: "flashlight" },
];

async function seedCategories() {
  console.log("Seeding vendor categories...");
  for (const cat of VENDOR_CATEGORIES) {
    await prisma.vendorCategory.upsert({
      where: { name: cat.name },
      create: cat,
      update: { icon: cat.icon },
    });
  }
  console.log(`✓ ${VENDOR_CATEGORIES.length} categorías`);
}

// ── Real Clerk accounts for the ExpoSciencia demo ───────────────────────────
const REAL_ACCOUNTS = {
  client:  { email: "carlossmg13+cliente@gmail.com",    name: "Ximena González" },
  planner: { email: "carlossmg13+planner@gmail.com",    name: "Ana García" },
  vendor1: { email: "carlossmg13+proveedor@gmail.com",  name: "Lumen Studio",    biz: "Lumen Studio Fotografía",  cat: "Fotografía",               bio: "Estudio fotográfico especializado en bodas con más de 5 años de experiencia." },
  vendor2: { email: "carlossmg13+proveedor2@gmail.com", name: "Salón Las Palmas", biz: "Salón Las Palmas",        cat: "Salones, Jardines y Venues", bio: "Venue de lujo con jardín y salón con capacidad para 300 invitados." },
  vendor3: { email: "carlossmg13+proveedor3@gmail.com", name: "Sabor al Plato",  biz: "Sabor al Plato Catering", cat: "Banquetes y Catering",       bio: "Servicio de catering gourmet para bodas y eventos corporativos en el Bajío." },
};

async function ensureVendorProfile(email: string, biz: string, bio: string, catName: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) { console.log(`  ⚠  Usuario ${email} no encontrado en BD (aún no se registra en la app)`); return null; }

  const cat = await prisma.vendorCategory.findFirst({ where: { name: catName } });
  if (!cat) { console.log(`  ⚠  Categoría "${catName}" no encontrada`); return null; }

  const profile = await prisma.vendorProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, businessName: biz, bio, categoryId: cat.id },
    update: { businessName: biz, bio, categoryId: cat.id },
    include: { services: true },
  });
  console.log(`  ✓ VendorProfile para ${email}`);
  return { user, profile, cat };
}

async function seedDemoData() {
  // ── 1. Ensure all profiles exist ─────────────────────────────────────────

  console.log("Asegurando perfiles de cuentas reales...");

  const clientUser = await prisma.user.findUnique({ where: { email: REAL_ACCOUNTS.client.email } });
  if (clientUser) {
    await prisma.clientProfile.upsert({
      where: { userId: clientUser.id },
      create: { userId: clientUser.id, preferredCity: "Querétaro", preferredGuestRange: "150-250" },
      update: {},
    });
    console.log(`  ✓ ClientProfile para ${REAL_ACCOUNTS.client.email}`);
  } else {
    console.log(`  ⚠  Cliente ${REAL_ACCOUNTS.client.email} no encontrado en BD`);
  }

  const plannerUser = await prisma.user.findUnique({ where: { email: REAL_ACCOUNTS.planner.email } });
  if (plannerUser) {
    await prisma.plannerProfile.upsert({
      where: { userId: plannerUser.id },
      create: {
        userId: plannerUser.id,
        identityType: "INDEPENDENT",
        businessName: "Ana García Eventos",
        bio: "Planner de bodas con 6 años de experiencia en el estado de Querétaro.",
        experience: 6,
        coverageCities: ["Querétaro", "San Juan del Río", "CDMX"],
        specialties: ["Bodas", "Eventos sociales"],
        budgetRange: "100000-500000",
      },
      update: {},
    });
    console.log(`  ✓ PlannerProfile para ${REAL_ACCOUNTS.planner.email}`);
  } else {
    console.log(`  ⚠  Planner ${REAL_ACCOUNTS.planner.email} no encontrado en BD`);
  }

  const v1 = await ensureVendorProfile(REAL_ACCOUNTS.vendor1.email, REAL_ACCOUNTS.vendor1.biz, REAL_ACCOUNTS.vendor1.bio, REAL_ACCOUNTS.vendor1.cat);
  const v2 = await ensureVendorProfile(REAL_ACCOUNTS.vendor2.email, REAL_ACCOUNTS.vendor2.biz, REAL_ACCOUNTS.vendor2.bio, REAL_ACCOUNTS.vendor2.cat);
  const v3 = await ensureVendorProfile(REAL_ACCOUNTS.vendor3.email, REAL_ACCOUNTS.vendor3.biz, REAL_ACCOUNTS.vendor3.bio, REAL_ACCOUNTS.vendor3.cat);

  // ── 2. Create services for each vendor (if missing) ─────────────────────

  if (v1) {
    if (v1.profile.services.length === 0) {
      await prisma.vendorService.create({
        data: { vendorId: v1.profile.id, categoryId: v1.cat.id, name: "Paquete Premium Boda", description: "Cobertura completa: ceremonia + recepción, 8 hrs, edición y álbum impreso", basePrice: "45000", currency: "MXN" },
      });
      console.log("  ✓ Servicio creado para Lumen Studio");
    }
  }

  if (v2) {
    if (v2.profile.services.length === 0) {
      await prisma.vendorService.create({
        data: { vendorId: v2.profile.id, categoryId: v2.cat.id, name: "Renta de Salón (todo el día)", description: "Uso exclusivo del venue con jardín y salón principal, capacidad 300 personas", basePrice: "80000", currency: "MXN" },
      });
      console.log("  ✓ Servicio creado para Salón Las Palmas");
    }
  }

  if (v3) {
    if (v3.profile.services.length === 0) {
      await prisma.vendorService.create({
        data: { vendorId: v3.profile.id, categoryId: v3.cat.id, name: "Menú Gourmet 5 Tiempos", description: "Menú de boda completo, incluye coctelería, cena y mesa de postres para 200 personas", basePrice: "120000", currency: "MXN" },
      });
      console.log("  ✓ Servicio creado para Sabor al Plato");
    }
  }

  // ── 3. Create demo event (only if client exists and no event yet) ────────

  if (!clientUser) {
    console.log("\n⚠  Sin cliente registrado — saltando creación de evento demo.");
    console.log("   Registra la cuenta cliente en la app y vuelve a ejecutar el seed.");
    return;
  }

  const clientProfile = await prisma.clientProfile.findUnique({ where: { userId: clientUser.id } });
  if (!clientProfile) { console.log("⚠  ClientProfile no encontrado"); return; }

  const existingEvent = await prisma.event.findFirst({
    where: { clientId: clientProfile.id, title: "Boda Ximena & Carlos — Expociencia UCC 2026" },
  });
  if (existingEvent) {
    console.log("ℹ  Evento demo ya existe, omitiendo.");
    return;
  }

  console.log("\nCreando evento demo...");

  const event = await prisma.event.create({
    data: {
      title: "Boda Ximena & Carlos — Expociencia UCC 2026",
      type: "WEDDING",
      status: "ACTIVE",
      eventDate: new Date("2026-12-20T18:00:00"),
      venueName: "Salón Las Palmas",
      venueAddress: "Av. de las Palmas 120, Querétaro, Qro.",
      guestCount: 200,
      totalBudget: "350000",
      currency: "MXN",
      description: "Boda de gala con jardín y salón principal. Decoración en blanco y dorado.",
      clientId: clientProfile.id,
    },
  });
  console.log(`  ✓ Evento: ${event.title}`);

  // ── Planner ──────────────────────────────────────────────────────────────

  if (plannerUser) {
    const plannerProfile = await prisma.plannerProfile.findUnique({ where: { userId: plannerUser.id } });
    if (plannerProfile) {
      await prisma.eventPlanner.upsert({
        where: { eventId_plannerId: { eventId: event.id, plannerId: plannerProfile.id } },
        create: { eventId: event.id, plannerId: plannerProfile.id, isLead: true },
        update: {},
      });
      console.log("  ✓ Planner asignado");
    }
  }

  // ── Vendors ──────────────────────────────────────────────────────────────

  for (const vData of [v1, v2, v3]) {
    if (!vData) continue;
    const svc = (await prisma.vendorProfile.findUnique({
      where: { id: vData.profile.id },
      include: { services: true },
    }))?.services[0];

    await prisma.eventVendor.upsert({
      where: { eventId_vendorId: { eventId: event.id, vendorId: vData.profile.id } },
      create: {
        eventId: event.id,
        vendorId: vData.profile.id,
        serviceId: svc?.id ?? null,
        agreedPrice: svc?.basePrice?.toString() ?? null,
        status: "CONFIRMED",
      },
      update: {},
    });
    console.log(`  ✓ Proveedor asignado: ${vData.profile.businessName}`);
  }

  // ── Tasks ────────────────────────────────────────────────────────────────

  const tasks = [
    { title: "Confirmar menú final con catering", priority: "HIGH" as const, status: "TODO" as const, dueDate: new Date("2026-10-01") },
    { title: "Prueba de vestido de novia", priority: "HIGH" as const, status: "IN_PROGRESS" as const, dueDate: new Date("2026-09-15") },
    { title: "Enviar invitaciones digitales", priority: "MEDIUM" as const, status: "DONE" as const, dueDate: new Date("2026-08-01") },
    { title: "Coordinar transporte de invitados VIP", priority: "MEDIUM" as const, status: "TODO" as const, dueDate: new Date("2026-11-01") },
    { title: "Revisión de decoración con proveedor", priority: "LOW" as const, status: "TODO" as const, dueDate: new Date("2026-11-15") },
  ];
  for (const task of tasks) {
    await prisma.task.create({ data: { ...task, eventId: event.id } });
  }
  console.log(`  ✓ ${tasks.length} tareas`);

  // ── Budget ───────────────────────────────────────────────────────────────

  const budgetItems = [
    { category: "Catering",      description: "Menú de 5 tiempos para 200 personas",   estimatedAmount: "120000", actualAmount: "118500", status: "PAID" as const },
    { category: "Fotografía",    description: "Paquete Premium Boda — Lumen Studio",    estimatedAmount: "45000",  actualAmount: "45000",  status: "PAID" as const },
    { category: "Venue",         description: "Renta Salón Las Palmas (todo el día)",   estimatedAmount: "80000",  actualAmount: "80000",  status: "PAID" as const },
    { category: "Decoración",    description: "Arreglos florales y ambientación",       estimatedAmount: "60000",  actualAmount: null,     status: "CONFIRMED" as const },
    { category: "Música",        description: "DJ + Hora loca",                         estimatedAmount: "35000",  actualAmount: null,     status: "ESTIMATED" as const },
    { category: "Invitaciones",  description: "200 invitaciones digitales + papel",     estimatedAmount: "8000",   actualAmount: "7200",   status: "PAID" as const },
  ];
  for (const item of budgetItems) {
    await prisma.budgetItem.create({ data: { ...item, eventId: event.id } });
  }
  console.log(`  ✓ ${budgetItems.length} ítems de presupuesto`);

  console.log(`\n✓ Demo lista para presentación ExpoSciencia 2026`);
}

async function resetDemo() {
  const DEMO_EMAILS = [
    "carlossmg13+cliente@gmail.com",
    "carlossmg13+planner@gmail.com",
    "carlossmg13+proveedor@gmail.com",
    "carlossmg13+proveedor2@gmail.com",
    "carlossmg13+proveedor3@gmail.com",
  ];

  console.log("Eliminando datos demo...\n");

  const users = await prisma.user.findMany({
    where: { email: { in: DEMO_EMAILS } },
    include: { clientProfile: true },
  });

  for (const u of users) {
    if (u.clientProfile) {
      const deleted = await prisma.event.deleteMany({ where: { clientId: u.clientProfile.id } });
      if (deleted.count) console.log(`  ✓ ${deleted.count} evento(s) de ${u.email}`);
    }
  }

  await prisma.vendorService.deleteMany({ where: { vendor: { user: { email: { in: DEMO_EMAILS } } } } });
  await prisma.vendorProfile.deleteMany({ where: { user: { email: { in: DEMO_EMAILS } } } });
  await prisma.plannerProfile.deleteMany({ where: { user: { email: { in: DEMO_EMAILS } } } });
  await prisma.clientProfile.deleteMany({ where: { user: { email: { in: DEMO_EMAILS } } } });

  console.log("  ✓ Perfiles y servicios eliminados");
  console.log("\n✓ Reset completo. Corre el seed sin RESET_DEMO para volver a poblar.");
}

async function main() {
  if (process.env.RESET_DEMO === "true") {
    await resetDemo();
    return;
  }
  await seedCategories();
  await seedDemoData();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
