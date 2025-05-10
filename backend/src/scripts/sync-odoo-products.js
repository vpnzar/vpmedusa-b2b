require("dotenv").config();
const axios = require("axios");
const { medusaRequest } = require("../../medusa-admin-client.js");

const ODOO_URL = process.env.ODOO_URL || "http://localhost:8069";

// ✅ Логування: Запуск синхронізації
console.log("📢 Запуск синхронізації товарів...");

// **Отримання ціни з Odoo**
async function getProductPriceFromOdoo(productId, pricelist) {
    console.log(`🔄 Запит ціни з Odoo: productId=${productId}, pricelist=${pricelist}`);
    try {
        const response = await axios.post(ODOO_URL + "/jsonrpc", {
            jsonrpc: "2.0",
            method: "call",
            id: Date.now(),
            params: {
                service: "object",
                method: "execute_kw",
                args: [
                    process.env.ODOO_DB,
                    Number(process.env.ODOO_UID),
                    process.env.ODOO_PASSWORD,
                    "product.pricelist.item",
                    "search_read",
                    [[["product_tmpl_id", "=", productId], ["pricelist_id", "=", pricelist]]],
                    { fields: ["fixed_price"] }
                ]
            }
        });

        console.log(`✅ Відповідь від Odoo: ${JSON.stringify(response.data.result, null, 2)}`);
        return response.data.result?.[0]?.fixed_price || 0;
    } catch (err) {
        console.error(`❌ Помилка Odoo API: ${err.message}`);
        return 0;
    }
}

// **Синхронізація товарів**
async function syncProducts() {
    try {
        console.log("📥 Отримую всі продукти з Medusa...");
        const allProducts = await medusaRequest("get", "/products");
        console.log(`✅ Отримано ${allProducts.products.length} товарів із Medusa`);

        const existingProducts = new Map(allProducts.products.map(p => [p.handle, p]));

        for (const product of allProducts.products) {
            const handle = product.handle;
            console.log(`🔄 Синхронізація товару: ${handle}`);

            // Отримуємо ціни з Odoo
            const priceRRC = await getProductPriceFromOdoo(product.id, "RRC_UAH");
            const priceRetail = await getProductPriceFromOdoo(product.id, "RETAIL_UAH");
            console.log(`🔍 Ціна RRC: ${priceRRC}, Ціна Retail: ${priceRetail}`);

            // Шукаємо варіанти товару
            const variant = product.variants?.[0];

            if (!variant) {
                console.warn(`⚠️ У товару ${handle} немає варіантів! Пропускаємо оновлення.`);
                continue;
            }

            // Оновлюємо ціни варіанта
            const payload = {
                prices: [
                    { currency_code: "uah", amount: Math.max(1, Math.round(priceRRC * 100)) },
                    { currency_code: "uah", amount: Math.max(1, Math.round(priceRetail * 100)) }
                ]
            };

            try {
                console.log(`✏️ Оновлюю ціни варіанта: ${variant.id}`);
                console.log(`📦 Payload: ${JSON.stringify(payload, null, 2)}`);
                await medusaRequest("POST", `/products/${product.id}/variants/${variant.id}`, payload);
                console.log(`✅ Ціни оновлено для варіанта ${variant.id}`);
            } catch (err) {
                console.warn(`⚠️ Помилка оновлення ціни для варіанта ${variant.id}:`, err.response?.data || err.message);
            }
        }
    } catch (err) {
        console.error("❌ Помилка під час синхронізації товарів:", err.response?.data || err.message || err);
    }
}

// 🚀 **Запуск синхронізації**
syncProducts();