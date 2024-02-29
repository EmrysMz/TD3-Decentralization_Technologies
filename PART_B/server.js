const express = require('express');
const app = express();
const port = 3001;

const { Pool } = require('pg');

app.use(express.static('public', { index: 'index.html' }));

const pool = new Pool({
    user: 'user_ecommerce',
    host: 'localhost',
    database: 'ecommerce',
    password: '123',
    port: 5432,
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error connecting to the database', err);
    } else {
        console.log('Connected to the database');
    }
});

// Get all products
app.get('/products', async (req, res) => {
    const { category, inStock } = req.query;

    let query = 'SELECT * FROM products';

    const params = [];

    if (category) {
        query += ' WHERE category = $1';
        params.push(category);
    }

    if (inStock) {
        const inStockValue = inStock.toLowerCase() === 'true';
        if (params.length === 0) {
            query += ' WHERE inStock = $1';
        } else {
            query += ' AND inStock = $2';
        }
        params.push(inStockValue);
    }

    try {
        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error('Error retrieving products', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get a specific product by ID
app.get('/products/:id', async (req, res) => {
    const productId = parseInt(req.params.id);

    try {
        const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
        if (rows.length === 0) {
            res.status(404).json({ error: 'Product not found' });
        } else {
            res.json(rows[0]);
        }
    } catch (err) {
        console.error('Error retrieving product', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add a new product
app.post('/products', async (req, res) => {
    const { name, description, price, category, inStock } = req.body;

    try {
        const { rows } = await pool.query(
            'INSERT INTO products (name, description, price, category, inStock) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, description, price, category, inStock]
        );
        const newProduct = rows[0];
        res.status(201).json(newProduct);
    } catch (err) {
        console.error('Error creating product', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update an existing product
app.put('/products/:id', async (req, res) => {
    const productId = parseInt(req.params.id);
    const { name, description, price, category, inStock } = req.body;

    try {
        const { rows } = await pool.query(
            'UPDATE products SET name = $1, description = $2, price = $3, category = $4, inStock = $5 WHERE id = $6 RETURNING *',
            [name, description, price, category, inStock, productId]
        );
        if (rows.length === 0) {
            res.status(404).json({ error: 'Product not found' });
        } else {
            res.json(rows[0]);
        }
    } catch (err) {
        console.error('Error updating product', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a product
app.delete('/products/:id', async (req, res) => {
    const productId = parseInt(req.params.id);

    try {
        const { rows } = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [productId]);
        if (rows.length === 0) {
            res.status(404).json({ error: 'Product not found' });
        } else {
            res.json({ message: 'Product deleted successfully' });
        }
    } catch (err) {
        console.error('Error deleting product', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Create a new order
app.post('/orders', async (req, res) => {
    const { userId, products } = req.body;

    let totalPrice = 0;
    const orderedProducts = [];

    for (const product of products) {
        const { id, quantity } = product;

        try {
            const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
            const selectedProduct = rows[0];

            if (selectedProduct && selectedProduct.inStock) {
                totalPrice += selectedProduct.price * quantity;
                orderedProducts.push({
                    id: selectedProduct.id,
                    name: selectedProduct.name,
                    price: selectedProduct.price,
                    quantity,
                });
            }
        } catch (err) {
            console.error('Error retrieving product', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
    }

    const newOrder = {
        orderId: orders.length + 1,
        userId,
        products: orderedProducts,
        totalPrice,
        status: 'Pending',
    };

    try {
        await pool.query(
            'INSERT INTO orders (userId, products, totalPrice, status) VALUES ($1, $2, $3, $4)',
            [newOrder.userId, newOrder.products, newOrder.totalPrice, newOrder.status]
        );
        res.status(201).json(newOrder);
    } catch (err) {
        console.error('Error creating order', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get orders for a specific user
app.get('/orders/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);

    try {
        const { rows } = await pool.query('SELECT * FROM orders WHERE userId = $1', [userId]);
        const userOrders = rows.map(row => {
            return {
                orderId: row.orderId,
                userId: row.userId,
                products: row.products,
                totalPrice: row.totalPrice,
                status: row.status,
            };
        });
        res.json(userOrders);
    } catch (err) {
        console.error('Error retrieving orders', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Add a product to the user's cart
app.post('/cart/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    const { productId, quantity } = req.body;

    try {
        const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
        const product = rows[0];

        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        const existingCartItem = await pool.query(
            'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );

        if (existingCartItem.rows.length > 0) {
            const updatedQuantity = existingCartItem.rows[0].quantity + quantity;
            await pool.query(
                'UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND product_id = $3',
                [updatedQuantity, userId, productId]
            );
        } else {
            await pool.query(
                'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)',
                [userId, productId, quantity]
            );
        }

        res.status(201).json({ message: 'Product added to cart' });
    } catch (err) {
        console.error('Error adding product to cart', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get the user's cart
app.get('/cart/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);

    try {
        const { rows } = await pool.query(
            'SELECT products.id, products.name, products.price, cart_items.quantity ' +
            'FROM products ' +
            'JOIN cart_items ON products.id = cart_items.product_id ' +
            'WHERE cart_items.user_id = $1',
            [userId]
        );

        const cartItems = rows.map(row => {
            return {
                id: row.id,
                name: row.name,
                price: row.price,
                quantity: row.quantity,
            };
        });

        const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

        res.json({ products: cartItems, totalPrice });
    } catch (err) {
        console.error('Error retrieving cart', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Remove a product from the user's cart
app.delete('/cart/:userId/item/:productId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    const productId = parseInt(req.params.productId);

    try {
        await pool.query(
            'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );

        res.json({ message: 'Product removed from cart' });
    } catch (err) {
        console.error('Error removing product from cart', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});