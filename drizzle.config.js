import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./source/models/schema.js", 
  out: "./drizzle",          
  dialect: "sqlite",
});