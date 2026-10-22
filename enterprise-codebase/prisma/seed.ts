import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.upsert({ where: { email: "demo@techlab.ai" }, update: {}, create: { email: "demo@techlab.ai", name: "TechLab Demo" } });
  await prisma.wallet.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id, balance: 240 } });
  console.log(`Seeded demo user ${user.id}; demo wallet balance: 240 credits`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
