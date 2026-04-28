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

async function main() {
  console.log("Seeding vendor categories...");
  for (const cat of VENDOR_CATEGORIES) {
    await prisma.vendorCategory.upsert({
      where: { name: cat.name },
      create: cat,
      update: { icon: cat.icon },
    });
  }
  console.log(`Seeded ${VENDOR_CATEGORIES.length} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
