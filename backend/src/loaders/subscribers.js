const productIndexer = require("../subscribers/product-indexer");

module.exports = (subscriber) => {
  // Підписка на події створення, оновлення та видалення товарів
  subscriber.subscribe("product.created", productIndexer);
  subscriber.subscribe("product.updated", productIndexer);
  subscriber.subscribe("product.deleted", productIndexer);
};
