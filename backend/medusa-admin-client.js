const axios = require("axios");
require("dotenv").config();

const MEDUSA_URL = process.env.MEDUSA_ADMIN_URL;
const ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD;

let token = null;

// ✅ Функція для отримання токену адміністратора
async function getAdminToken() {
  if (!token) {
    console.log("🔄 Отримую токен Medusa...");
    try {
      const res = await axios.post(`${MEDUSA_URL}/auth/user/emailpass`, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

      token = res.data.token;
      console.log("✅ Отримано токен адміністратора.");
    } catch (err) {
      console.error("❌ Помилка отримання токену:", err.response?.data || err.message);
      throw err;
    }
  }
  return token;
}

// ✅ Функція для запитів до Medusa API
async function medusaRequest(method, url, data = {}) {
  const token = await getAdminToken();

  const config = {
    method,
    url: `${MEDUSA_URL}/admin${url}`,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    data,
  };

  console.log(`🔄 Запит до Medusa API: ${method} ${url}`);
  if (Object.keys(data).length > 0) {
    console.log("📦 Payload:", JSON.stringify(data, null, 2));
  }

  try {
    const response = await axios(config);
    console.log(`✅ Успішний запит: ${method} ${url}`);
    return response.data;
  } catch (err) {
    console.error(`❌ Помилка Medusa API (${method} ${url}):`, err.response?.data || err.message);
    throw err;
  }
}

module.exports = {
  medusaRequest,
};