const MIN_DISCOUNT_PERCENT = 10;

const mapProduct = (product) => {
  if (!product?.title || !product.price) return null;

  const originalPrice = product.original_price;
  if (!originalPrice) return null;

  if (originalPrice <= product.price) return null;

  const discountPercent = Math.round((1 - product.price / originalPrice) * 100);
  if (discountPercent < MIN_DISCOUNT_PERCENT) return null;

  if (product.condition && product.condition !== 'new') return null;

  const availableQty = parseInt(product.available_quantity, 10);
  if (isNaN(availableQty) || availableQty <= 0) return null;

  const imageUrl = (product.thumbnail || '').replace('http://', 'https://');
  if (!imageUrl.startsWith('http')) return null;

  return {
    name: product.title.trim(),
    currentPrice: product.price,
    originalPrice,
    imageUrl,
    url: product.permalink || null,
    store: 'MercadoLibre',
    category: product._forcedCategory || null,
    currency: 'MXN',
    description: null,
    rating: null,
    stock: availableQty,
    _mlData: {
      id: product.id,
      seller: product.seller?.nickname || null,
      free_shipping: product.shipping?.free_shipping || false,
      condition: product.condition,
      discount_percentage: discountPercent,
    },
  };
};

const mapProducts = (products) => {
  const mapped = [];
  const seen = new Set();

  for (const p of products) {
    const result = mapProduct(p);
    if (!result) continue;
    if (seen.has(result.url)) continue;
    seen.add(result.url);
    mapped.push(result);
  }

  console.log(`[ML MAPPER] ${mapped.length}/${products.length} productos válidos (con descuento >= ${MIN_DISCOUNT_PERCENT}%, nuevo, stock > 0)`);
  return mapped;
};

module.exports = { mapProduct, mapProducts };
