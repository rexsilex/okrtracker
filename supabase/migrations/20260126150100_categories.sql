-- Categories table for departments
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  "order" INT NOT NULL DEFAULT 0,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX categories_user_id_idx ON categories(user_id);
CREATE INDEX categories_order_idx ON categories("order");
CREATE INDEX categories_deleted_at_idx ON categories(deleted_at);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view categories" ON categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert categories" ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update categories" ON categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete categories" ON categories FOR DELETE USING (auth.role() = 'authenticated');

-- Insert default categories
INSERT INTO categories (name, "order", user_id)
SELECT name, "order", (SELECT id FROM users LIMIT 1)
FROM (VALUES
  ('Company', 0),
  ('Engineering', 1),
  ('Product', 2),
  ('Marketing', 3),
  ('Sales', 4),
  ('Success', 5)
) AS defaults(name, "order")
WHERE EXISTS (SELECT 1 FROM users LIMIT 1);
