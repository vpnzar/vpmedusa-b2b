require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { MeiliSearch } = require('meilisearch');
const axios = require('axios');

const app = express();
const PORT = 3005;

app.use(bodyParser.json());

const medusa = axios.create({
  baseURL: "http://localhost:9000/store",
  headers: {
    "x-publishable-api-key": process.env.MEDUSA_STORE_API_KEY,
  },
});

const meili = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST,
  apiKey: process.env.MEILISEARCH_API_KEY
});

// 🧠 Обробка подій product.created або product.updated
app.post('/webhook/product', async (req, res) => {
  try {
    const event = req.body.event;
    const productId = req.body.data.id;

    console.log(`📩 Отримано подію: ${event} для товару ${productId}`);

    const response = await medusa.get(`/products/${productId}`);
    const product = response.data.product;

    if (!product) {
      console.warn(`⚠️ Продукт з ID ${productId} не знайдений.`);
      return res.status(404).send("Продукт не знайдений");
    }

    const document = {
      id: product.id,
      title: product.title || "",
      description: product.description || "",
      handle: product.handle || "",
      variants: (product.variants || []).map(v => ({
        id: v.id,
        title: v.title,
        sku: v.sku,
        prices: v.prices,
      })),
      tags: product.tags || [], // Якщо є теги, додавати їх
      metadata: product.metadata || {}, // Додаткові метадані
    };

    const index = meili.index('products');
    const task = await index.addDocuments([document]);

    console.log(`✅ Оновлено індекс MeiliSearch. Task ID: ${task.taskUid}`);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Помилка під час обробки webhook:", err.message || err);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Webhook-сервер слухає на http://localhost:${PORT}`);
});
