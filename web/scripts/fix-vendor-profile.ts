/**
 * Crea VendorProfile para todos los usuarios VENDOR que no lo tengan.
 * Uso: npx tsx scripts/fix-vendor-profile.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Busca usuarios VENDOR sin perfil
  const vendors = await prisma.user.findMany({
    where: {
      role: "VENDOR",
      vendorProfile: null,
    },
    select: { id: true, name: true, email: true },
  });

  if (vendors.length === 0) {
    console.log("✅ Todos los usuarios VENDOR ya tienen VendorProfile.");
    return;
  }

  // Toma la primera categoría disponible como fallback
  const category = await prisma.vendorCategory.findFirst();
  if (!category) {
    console.error("❌ No hay categorías en VendorCategory. Corre el seed primero.");
    process.exit(1);
  }

  console.log(`📦 Categoría fallback: "${category.name}" (${category.id})`);
  console.log(`🔧 Creando VendorProfile para ${vendors.length} usuario(s):\n`);

  for (const user of vendors) {
    await prisma.vendorProfile.create({
      data: {
        userId: user.id,
        businessName: user.name,
        bio: null,
        categoryId: category.id,
      },
    });
    console.log(`  ✅ ${user.name} (${user.email})`);
  }

  console.log("\n🎉 Listo. Recarga la app.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
