require('dotenv').config();
const axios = require('axios');
const { MeiliSearch } = require('meilisearch');

// --- Підключення до Medusa Store API ---
const medusa = axios.create({
  baseURL: "http://localhost:9000/store",
  timeout: 5000,
  headers: {
    "x-publishable-api-key": process.env.MEDUSA_STORE_API_KEY,
  },
});

// --- Підключення до MeiliSearch ---
const meili = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST,
  apiKey: process.env.MEILISEARCH_API_KEY
});

async function reindexProducts() {
  try {
    console.log("📦 Отримую товари з Medusa...");
    const response = await medusa.get("/products", {
      params: { limit: 1000 }
    });

    const products = response.data.products;
    console.log(`🔍 Знайдено ${products.length} товарів. Обробка...`);

    const documents = products.map((product) => ({
      id: product.id,
      title: product.title || "",
      description: product.description || "",
      handle: product.handle || "",
      variants: (product.variants || []).map(variant => ({
        id: variant.id,
        title: variant.title,
        sku: variant.sku,
        prices: variant.prices
      }))
    }));

    const index = meili.index('products');
    console.log("📤 Відправляю документи в MeiliSearch...");
    const task = await index.addDocuments(documents);
    console.log(`✅ Документи надіслані. ID завдання: ${task.taskUid}`);

    // --- Перевіряємо статус індексації ---
    const status = await waitForTask(task.taskUid);
    if (status.status === "succeeded") {
      console.log("🎉 Індексація завершена успішно!");
    } else {
      console.error("⚠️ Індексація завершилась з помилкою:", status);
    }
  } catch (error) {
    console.error("❌ Помилка під час індексації:", error.message || error);
  }
}

// --- Чекаємо завершення індексації в Meili ---
async function waitForTask(taskUid) {
  console.log("⏳ Очікую завершення індексації...");
  while (true) {
    const task = await meili.tasks.getTask(taskUid); // 👈 правильний виклик
    if (["succeeded", "failed"].includes(task.status)) return task;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

reindexProducts();
