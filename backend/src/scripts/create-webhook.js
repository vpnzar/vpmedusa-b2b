require("dotenv").config();
const axios = require("axios");

const MEDUSA_ADMIN_URL = process.env.MEDUSA_ADMIN_URL || "http://localhost:9000";
const ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL || "admin@medusa-test.com";
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD || "supersecret";

// Отримання JWT токену через правильний endpoint
async function authenticateAdmin() {
  try {
    const { data } = await axios.post(
      `${MEDUSA_ADMIN_URL}/auth/user/emailpass`,
      {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }
    );
    return data.access_token;
  } catch (err) {
    console.error("❌ Помилка авторизації:", err.response?.data || err.message);
    throw err;
  }
}

// Створення axios-клієнта з префіксом `/admin`
async function createMedusaClient() {
  const token = await authenticateAdmin();
  return axios.create({
    baseURL: `${MEDUSA_ADMIN_URL}/admin`,  // <-- тут підклеюємо /admin
    timeout: 5000,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

// Створення webhook
async function createWebhook() {
  try {
    const client = await createMedusaClient();

    const body = {
      name: "Product to MeiliSearch",
      url: "http://localhost:3005/webhook/product",
      events: ["product.created", "product.updated"],
    };

    const res = await client.post("/webhooks", body);  // <-- тепер /webhooks
    console.log("✅ Webhook створено:", res.data.webhook);
  } catch (err) {
    console.error("❌ Не вдалося створити webhook:", err.response?.data || err.message);
  }
}

createWebhook();
