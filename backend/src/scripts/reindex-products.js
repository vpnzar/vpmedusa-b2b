require("dotenv").config();
const { MeiliSearch } = require("meilisearch");
const { medusaRequest } = require("../../medusa-admin-client.js");

const meili = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST,
  apiKey: process.env.MEILISEARCH_API_KEY,
});

async function reindexProducts() {
  try {
    console.log("📦 Отримую всі продукти з Medusa...");
    const response = await medusaRequest("get", "/products?sales_channel_id=sc_01JTRN9D3VBEH0GVQYJ8FF3DKT");
    const actualProducts = response.products;

    const meiliResponse = await meili.index("products").getDocuments({ limit: 1000 });
    const meiliProductIds = new Set(meiliResponse.results.map(p => p.id));
    const actualProductIds = new Set(actualProducts.map(p => p.id));

    // 🗑 **Видаляємо застарілі товари**
    const idsToDelete = [...meiliProductIds].filter(id => !actualProductIds.has(id));
    if (idsToDelete.length > 0) {
      const task = await meili.index("products").deleteDocuments(idsToDelete);
      const status = await waitForTask(task.taskUid);
      console.log(`✅ Видалено ${status.details.deletedDocuments} товарів.`);
    }

    // 📤 **Додаємо актуальні товари**
    const documents = actualProducts.map((product) => ({
      id: product.id,
      title: product.title || "",
      description: product.description || "",
      handle: product.handle || "",
      sales_channel_id: "sc_01JTRN9D3VBEH0GVQYJ8FF3DKT",
      variants: (product.variants || []).map((variant) => ({
        id: variant.id,
        title: variant.title,
        sku: variant.sku,
        prices: variant.prices,
      })),
    }));

    const task = await meili.index("products").addDocuments(documents);
    const status = await waitForTask(task.taskUid);
    console.log(`✅ Оновлено ${documents.length} товарів.`);
  } catch (err) {
    console.error("❌ Помилка:", err.message || err);
  }
}

async function waitForTask(taskUid) {
  while (true) {
    const task = await meili.tasks.getTask(taskUid);
    if (["succeeded", "failed"].includes(task.status)) return task;
    await new Promise((r) => setTimeout(r, 1000));
  }
}

reindexProducts();