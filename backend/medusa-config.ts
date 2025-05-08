import { QUOTE_MODULE } from "./src/modules/quote";
import { APPROVAL_MODULE } from "./src/modules/approval";
import { COMPANY_MODULE } from "./src/modules/company";
import { ODOO_MODULE } from "./src/modules/odoo"; // ← додано імпорт

import { loadEnv, defineConfig, Modules } from "@medusajs/framework/utils";

// Завантаження середовищних змінних
loadEnv(process.env.NODE_ENV!, process.cwd());

// Плагіни
const plugins = [
  {
    resolve: `medusa-plugin-meilisearch`,
    options: {
      config: {
        host: process.env.MEILISEARCH_HOST || "http://localhost:7700",
        apiKey: process.env.MEILISEARCH_API_KEY || "masterKey",
      },
      settings: {
        product: {
          indexSettings: {
            searchableAttributes: ["title", "description"],
          },
        },
      },
    },
  },
];

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS || "http://localhost:9000",
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  plugins, // Підключення плагінів
  modules: {
    [ODOO_MODULE]: {
      resolve: "./src/modules/odoo", // ← правильний шлях
      options: {
        url: process.env.ODOO_URL,
        dbName: process.env.ODOO_DB,
        username: process.env.ODOO_USERNAME,
        password: process.env.ODOO_PASSWORD, // ← використовується правильне поле для паролю
      },
    },
    [COMPANY_MODULE]: {
      resolve: "./src/modules/company", // ← правильний шлях
    },
    [QUOTE_MODULE]: {
      resolve: "./src/modules/quote", // ← правильний шлях
    },
    [APPROVAL_MODULE]: {
      resolve: "./src/modules/approval", // ← правильний шлях
    },
    [Modules.CACHE]: {
      resolve: "@medusajs/medusa/cache-inmemory",
    },
    [Modules.WORKFLOW_ENGINE]: {
      resolve: "@medusajs/medusa/workflow-engine-inmemory",
    },
  },
});