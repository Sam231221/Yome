/** Returns the singleton Prisma client (pg adapter). Run `prisma generate` in this package first. */
declare function getPrismaInstance(): import("./generated/client").PrismaClient;
export default getPrismaInstance;
