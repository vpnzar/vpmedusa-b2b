const { MeiliSearch } = require("meilisearch");

const meili = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST,
  apiKey: process.env.MEILISEARCH_API_KEY
});

const index = meili.index('products');

/**
 * Форматування товару під MeiliSearch
 */
function formatProduct(product) {
  return {
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
  };
}

module.exports = async function productIndexer({ eventName, data, container }) {
  const productService = container.resolve("productService");

  if (["product.created", "product.updated"].includes(eventName)) {
    const product = await productService.retrieve(data.id, {
      relations: ["variants", "variants.prices"],
    });

    // Додаємо або оновлюємо документ у MeiliSearch
    await index.addDocuments([formatProduct(product)]);
    console.log(`🔄 [${eventName}] Товар оновлено в MeiliSearch: ${product.id}`);
  }

  if (eventName === "product.deleted") {
    // Видаляємо товар з MeiliSearch
    await index.deleteDocument(data.id);
    console.log(`❌ [product.deleted] Товар видалено з MeiliSearch: ${data.id}`);
  }
};
