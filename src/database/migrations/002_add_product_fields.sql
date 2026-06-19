ALTER TABLE products
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS rating DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock INT DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_url ON products(url);

CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
