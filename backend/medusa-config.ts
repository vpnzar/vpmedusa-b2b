import { QUOTE_MODULE } from "./src/modules/quote/index";
import { APPROVAL_MODULE } from "./src/modules/approval/index";
import { COMPANY_MODULE } from "./src/modules/company/index";
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

module.exports = defineConfig({
 
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
  plugins,  // Підключення плагінів
  modules: {
    [COMPANY_MODULE]: {
      resolve: "./modules/company",
    },
    [QUOTE_MODULE]: {
      resolve: "./modules/quote",
    },
    [APPROVAL_MODULE]: {
      resolve: "./modules/approval",
    },
    [Modules.CACHE]: {
      resolve: "@medusajs/medusa/cache-inmemory",
    },
    [Modules.WORKFLOW_ENGINE]: {
      resolve: "@medusajs/medusa/workflow-engine-inmemory",
    },
  },
});
