import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, "schema.prisma"),
  migrate: {
    async url() {
      return "postgresql://postgres.ctyqlfzcrsgzoyxbwmre:Masukojhol%40123@aws-1-eu-west-2.pooler.supabase.com:5432/postgres";
    },
  },
  studio: {
    async url() {
      return "postgresql://postgres.ctyqlfzcrsgzoyxbwmre:Masukojhol%40123@aws-1-eu-west-2.pooler.supabase.com:5432/postgres";
    },
  },
  datasources: {
    db: {
      async url() {
        return "postgresql://postgres.ctyqlfzcrsgzoyxbwmre:Masukojhol%40123@aws-1-eu-west-2.pooler.supabase.com:5432/postgres";
      },
    },
  },
});
