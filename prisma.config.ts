import { defineConfig, env } from "prisma/config";
import "dotenv/config";

const BACKEND = env("VITE_BACKEND");

let db_url: string;
let schema: string;

if (BACKEND === "REST") {
    db_url = "MYSQL_URL";
    schema = "schema.mysql.prisma"; 
  }
  else if (BACKEND === "supabase") {
    db_url = "DIRECT_SB_URL";
    schema = "schema.postgres.prisma"; 
}
else {
    throw new Error("Need to specify valid backend in `.env`");
}

export default defineConfig({
  schema: `backend/prisma/${schema}`,
  migrations: {
    path: "backend/prisma/migrations",
  },
  datasource: {
    url: env(db_url),
  },
});
