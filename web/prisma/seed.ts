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

async function seedDemoData() {
  const clientEmail = process.env.DEMO_CLIENT_EMAIL ?? "demo.cliente@plannerapp.mx";
  const plannerEmail = process.env.DEMO_PLANNER_EMAIL ?? "demo.planner@plannerapp.mx";
  const vendorEmail = process.env.DEMO_VENDOR_EMAIL ?? "demo.proveedor@plannerapp.mx";

  // Check if demo event already exists to avoid duplicate runs
  const existingClient = await prisma.user.findUnique({ where: { email: clientEmail } });
  const existingEvent = existingClient
    ? await prisma.event.findFirst({
        where: { client: { userId: existingClient.id }, title: "Boda Demo — ExpoSciencia 2026" },
      })
    : null;

  if (existingEvent) {
    console.log("ℹ  Datos demo ya existen, omitiendo.");
    return;
  }

  console.log("Seeding demo data...");

  // ── Create or reuse demo users ──────────────────────────────────────────

  const clientUser = await prisma.user.upsert({
    where: { email: clientEmail },
    create: {
      clerkId: `demo_client_${Date.now()}`,
      email: clientEmail,
      name: "Ana García",
      role: "CLIENT",
      clientProfile: { create: { preferredCity: "Querétaro" } },
    },
    update: {},
    include: { clientProfile: true },
  });

  const plannerUser = await prisma.user.upsert({
    where: { email: plannerEmail },
    create: {
      clerkId: `demo_planner_${Date.now() + 1}`,
      email: plannerEmail,
      name: "Carlos Ramírez",
      role: "PLANNER",
      plannerProfile: {
        create: {
          identityType: "INDEPENDENT",
          businessName: "CR Eventos",
          bio: "Planificador de bodas con 8 años de experiencia en el Bajío.",
          experience: 8,
          coverageCities: ["Querétaro", "CDMX", "GDL"],
        },
      },
    },
    update: {},
    include: { plannerProfile: true },
  });

  const catPhoto = await prisma.vendorCategory.findFirst({ where: { name: "Fotografía" } });

  const vendorUser = await prisma.user.upsert({
    where: { email: vendorEmail },
    create: {
      clerkId: `demo_vendor_${Date.now() + 2}`,
      email: vendorEmail,
      name: "Lucía Moreno",
      role: "VENDOR",
      vendorProfile: {
        create: {
          businessName: "Lucía Moreno Fotografía",
          bio: "Fotógrafa especializada en bodas y eventos sociales.",
          categoryId: catPhoto!.id,
        },
      },
    },
    update: {},
    include: { vendorProfile: { include: { services: true } } },
  });

  const clientProfile = clientUser.clientProfile!;
  const plannerProfile = plannerUser.plannerProfile!;
  const vendorProfile = vendorUser.vendorProfile!;

  // ── Create demo event ───────────────────────────────────────────────────

  const event = await prisma.event.create({
    data: {
      title: "Boda Demo — ExpoSciencia 2026",
      type: "WEDDING",
      status: "ACTIVE",
      eventDate: new Date("2026-12-15T18:00:00"),
      venueName: "Hacienda San Miguel",
      venueAddress: "Carretera Federal 57, San Juan del Río, Qro.",
      guestCount: 200,
      totalBudget: "350000",
      currency: "MXN",
      description: "Boda de gala en hacienda histórica con jardines amplios y salón principal.",
      clientId: clientProfile.id,
    },
  });

  // ── Assign planner ──────────────────────────────────────────────────────

  await prisma.eventPlanner.upsert({
    where: { eventId_plannerId: { eventId: event.id, plannerId: plannerProfile.id } },
    create: { eventId: event.id, plannerId: plannerProfile.id, isLead: true },
    update: {},
  });
  console.log("  ✓ Planner asignado");

  // ── Create tasks ────────────────────────────────────────────────────────

  const tasks = [
    { title: "Confirmar menú con catering", priority: "HIGH" as const, status: "TODO" as const, dueDate: new Date("2026-10-01") },
    { title: "Prueba de vestido de novia", priority: "HIGH" as const, status: "IN_PROGRESS" as const, dueDate: new Date("2026-09-15") },
    { title: "Enviar invitaciones digitales", priority: "MEDIUM" as const, status: "DONE" as const, dueDate: new Date("2026-08-01") },
    { title: "Coordinar transporte de invitados VIP", priority: "MEDIUM" as const, status: "TODO" as const, dueDate: new Date("2026-11-01") },
    { title: "Seleccionar playlist con DJ", priority: "LOW" as const, status: "TODO" as const, dueDate: new Date("2026-11-15") },
  ];

  for (const task of tasks) {
    await prisma.task.create({ data: { ...task, eventId: event.id } });
  }
  console.log(`  ✓ ${tasks.length} tareas`);

  // ── Create budget items ─────────────────────────────────────────────────

  const budgetItems = [
    { category: "Catering", description: "Menú de 5 tiempos para 200 personas", estimatedAmount: "120000", actualAmount: "118500", status: "PAID" as const },
    { category: "Fotografía", description: "Fotógrafa + videógrafo (8 hrs)", estimatedAmount: "45000", actualAmount: "45000", status: "PAID" as const },
    { category: "Decoración", description: "Arreglos florales y ambientación", estimatedAmount: "60000", actualAmount: null, status: "CONFIRMED" as const },
    { category: "Música", description: "DJ + Hora loca + mariachi entrada", estimatedAmount: "35000", actualAmount: null, status: "ESTIMATED" as const },
    { category: "Venue", description: "Renta de hacienda (todo el día)", estimatedAmount: "80000", actualAmount: "80000", status: "PAID" as const },
    { category: "Invitaciones", description: "200 invitaciones digitales + papel", estimatedAmount: "8000", actualAmount: "7200", status: "PAID" as const },
  ];

  for (const item of budgetItems) {
    await prisma.budgetItem.create({ data: { ...item, eventId: event.id } });
  }
  console.log(`  ✓ ${budgetItems.length} ítems de presupuesto`);

  // ── Assign vendor ───────────────────────────────────────────────────────

  let service = vendorProfile.services[0];
  if (!service && catPhoto) {
    service = await prisma.vendorService.create({
      data: {
        vendorId: vendorProfile.id,
        name: "Paquete Premium Boda",
        description: "Cobertura completa: ceremonia + recepción, 8 horas, entrega en 30 días",
        basePrice: "45000",
        categoryId: catPhoto.id,
      },
    });
  }

  await prisma.eventVendor.upsert({
    where: { eventId_vendorId: { eventId: event.id, vendorId: vendorProfile.id } },
    create: {
      eventId: event.id,
      vendorId: vendorProfile.id,
      serviceId: service?.id ?? null,
      agreedPrice: "45000",
      notes: "Entrega de galería en 30 días. Incluye álbum impreso.",
      status: "CONFIRMED",
    },
    update: {},
  });
  console.log("  ✓ Proveedor asignado");

  console.log(`✓ Evento demo creado: "${event.title}"`);
  console.log("");
  console.log("Cuentas demo creadas:");
  console.log(`  Cliente:   ${clientEmail}`);
  console.log(`  Planner:   ${plannerEmail}`);
  console.log(`  Proveedor: ${vendorEmail}`);
  console.log("");
  console.log("NOTA: Estas cuentas no tienen contraseña de Clerk.");
  console.log("Para iniciar sesión en la app, regístralas manualmente con los mismos emails.");
}

async function main() {
  await seedCategories();
  await seedDemoData();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
