require("dotenv").config();
const axios = require("axios");
const Medusa = require("@medusajs/js-sdk").default;

// Функція для генерації handle (URL-safe значення SKU)
function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

// **Odoo API**
const odoo = axios.create({
    baseURL: process.env.ODOO_URL || "http://localhost:8069",
    timeout: 5000,
    headers: { "Content-Type": "application/json" },
});

// **Авторизація в Odoo**
async function authenticateOdoo() {
    const res = await odoo.post("/jsonrpc", {
        jsonrpc: "2.0",
        method: "call",
        id: Date.now(),
        params: {
            service: "common",
            method: "authenticate",
            args: [process.env.ODOO_DB, process.env.ODOO_USERNAME, process.env.ODOO_PASSWORD, {}],
        },
    });

    if (!res.data.result) throw new Error("❌ Не вдалося авторизуватися в Odoo.");
    return res.data.result;
}

// **Отримання товарів з Odoo**
async function getOdooProducts(uid) {
    const res = await odoo.post("/jsonrpc", {
        jsonrpc: "2.0",
        method: "call",
        id: Date.now(),
        params: {
            service: "object",
            method: "execute_kw",
            args: [process.env.ODOO_DB, uid, process.env.ODOO_PASSWORD, "product.template", "search_read", [[]], {
                fields: ["id", "name", "list_price", "description", "default_code", "image_1920", "categ_id", "product_tag_ids"],
            }],
        },
    });

    if (res.data.error) throw new Error(res.data.error.data.message);
    return res.data.result || [];
}

// **Medusa SDK через JWT**
const sdk = new Medusa({
    baseUrl: process.env.MEDUSA_ADMIN_URL || "http://localhost:9000",
    debug: process.env.NODE_ENV === "development",
    auth: { type: "jwt" },
});

// **Логін адміністратора**
async function authenticateAdmin() {
    return await sdk.auth.login("user", "emailpass", {
        email: "admin@medusa-test.com",
        password: "supersecret",
    });
}

// **Створення Medusa клієнта**
async function createMedusaClient() {
    const token = await authenticateAdmin();
    return axios.create({
        baseURL: process.env.MEDUSA_ADMIN_URL || "http://localhost:9000",
        headers: { Authorization: `Bearer ${token}` },
    });
}

// **Перевірка товару в Medusa**
async function findProductByHandle(medusa, handle) {
    const listResponse = await medusa.get("/admin/products");
    return listResponse.data.products.find((p) => p.handle === handle);
}

// **Синхронізація товарів**
async function syncProducts() {
    const uid = await authenticateOdoo();
    const products = await getOdooProducts(uid);
    const medusa = await createMedusaClient();

    for (const product of products) {
        try {
            const handle = slugify(product.default_code || product.name);
            const payload = {
                title: product.name,
                description: product.description || "",
                handle: handle,
                options: [{ title: "Default", values: ["Default"] }],
                variants: [{ title: "Основний варіант", options: { Default: "Default" }, prices: [{ currency_code: "usd", amount: Math.round((product.list_price || 0) * 100) }] }],
                tags: product.product_tag_ids?.map(tag => ({ id: String(tag[0]), value: tag[1] })) || [],
                images: product.image_1920?.startsWith("http") ? [{ url: product.image_1920 }] : [],
                metadata: { category: Array.isArray(product.categ_id) ? product.categ_id[1] : product.categ_id },
            };

            const existingProduct = await findProductByHandle(medusa, handle);
            existingProduct ? await medusa.put(`/admin/products/${existingProduct.id}`, payload) : await medusa.post("/admin/products", payload);
        } catch (err) {
            console.warn(`⚠️ Проблема з ${product.name}:`, err.message);
        }
    }
}

syncProducts();