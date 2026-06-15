import { PrismaClient, RoleName } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  for (const name of Object.values(RoleName)) {
    await prisma.role.upsert({
      where: { name },
      create: { name },
      update: {}
    });
  }

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: "SUPER_ADMIN" } });
  const passwordHash = await argon2.hash("ChangeMeImmediately123!");
  const user = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    create: {
      email: "admin@example.com",
      passwordHash,
      mustChangePassword: true,
      administratorProfile: {
        create: { firstName: "Initial", lastName: "Admin" }
      }
    },
    update: {}
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
    create: { userId: user.id, roleId: adminRole.id },
    update: {}
  });
}

main().finally(async () => prisma.$disconnect());
