-- Create the products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    stock_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some initial products
INSERT INTO products (name, description, price, category, stock_quantity) VALUES
('Espresso', 'Classic Italian espresso shot', 2.50, 'Coffee', 100),
('Cappuccino', 'Espresso with steamed milk foam', 3.75, 'Coffee', 80),
('Latte', 'Espresso with steamed milk', 4.00, 'Coffee', 90),
('Americano', 'Espresso with hot water', 3.00, 'Coffee', 110),
('Chocolate Croissant', 'Buttery croissant with chocolate filling', 3.25, 'Pastry', 50),
('Blueberry Muffin', 'Fresh baked blueberry muffin', 2.75, 'Pastry', 60),
('Iced Caramel Macchiato', 'Cold espresso with caramel and milk', 4.50, 'Coffee', 70);