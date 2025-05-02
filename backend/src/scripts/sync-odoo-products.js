require('dotenv').config();
const axios = require('axios');

// 🔌 Odoo API клієнт
const odoo = axios.create({
  baseURL: process.env.ODOO_URL || 'http://localhost:8069',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
});

// 🔌 Medusa Admin API клієнт
const medusa = axios.create({
  baseURL: process.env.MEDUSA_ADMIN_URL || 'http://localhost:9000/admin',
  headers: {
    'x-medusa-access-token': process.env.MEDUSA_ADMIN_API_KEY,
  },
});

// 🔐 Отримання UID з Odoo
async function authenticateOdoo() {
  const res = await odoo.post('/jsonrpc', {
    jsonrpc: '2.0',
    method: 'call',
    id: Date.now(),
    params: {
      service: 'common',
      method: 'authenticate',
      args: [
        process.env.ODOO_DB,
        process.env.ODOO_USERNAME,
        process.env.ODOO_API_KEY, // ❗ Тут має бути API Key
        {},
      ],
    },
  });

  if (!res.data.result) {
    throw new Error('Не вдалося авторизуватися в Odoo. Перевірте API Key і логін.');
  }

  return res.data.result;
}

// 📦 Отримання товарів з Odoo
async function getOdooProducts(uid) {
  try {
    const res = await odoo.post('/jsonrpc', {
      jsonrpc: '2.0',
      method: 'call',
      id: Date.now(),
      params: {
        service: 'object',
        method: 'execute_kw',
        args: [
          process.env.ODOO_DB,
          uid,
          process.env.ODOO_API_KEY, // ❗ І тут має бути API Key
          'product.template',
          'search_read',
          [[]],
          {
            fields: ['name', 'description', 'list_price'],
          },
        ],
      },
    });

    if (res.data.error) {
      console.error('Odoo Error:', res.data.error);
      throw new Error(res.data.error.data.message || 'Помилка при запиті продуктів');
    }

    return res.data.result;
  } catch (error) {
    console.error('Error fetching products from Odoo:', error.message);
    throw error;
  }
}

// 🚀 Синхронізація в Medusa
async function syncProducts() {
  try {
    console.log('🔐 Авторизація в Odoo...');
    const uid = await authenticateOdoo();

    console.log('📥 Отримання товарів з Odoo...');
    const products = await getOdooProducts(uid);

    console.log(`🔄 Отримано ${products.length} товарів. Відправка в Medusa...`);

    for (const product of products) {
      try {
        await medusa.post('/products', {
          title: product.name,
          description: product.description || '',
          variants: [
            {
              title: 'Default Variant',
              prices: [
                {
                  currency_code: 'usd',
                  amount: Math.round((product.list_price || 0) * 100),
                },
              ],
            },
          ],
        });
        console.log(`✅ Додано: ${product.name}`);
      } catch (err) {
        console.warn(`⚠️ Пропущено ${product.name}:`, err.response?.data?.message || err.message);
      }
    }

    console.log('🎉 Синхронізація завершена!');
  } catch (error) {
    console.error('❌ Помилка під час синхронізації:', error.message || error);
  }
}

syncProducts();
