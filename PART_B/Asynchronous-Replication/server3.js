const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3001;

// PostgreSQL database configuration
const pool = new Pool({
  user: 'your_username',
  host: 'localhost',
  database: 'your_database',
  password: 'your_password',
  port: 5432, // default PostgreSQL port
});

app.use(express.json());

// GET /products
app.get('/products', async (req, res) => {
  try {
    const { category, inStock } = req.query;

    let query = 'SELECT * FROM products';

    if (category) {
      query += ` WHERE category = '${category}'`;
    }

    if (inStock) {
      query += `${category ? ' AND' : ' WHERE'} in_stock = ${inStock}`;
    }

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /products/:id
app.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /products
app.post('/products', async (req, res) => {
  try {
    const { name, category, price, inStock } = req.body;
    const result = await pool.query(
      'INSERT INTO products (name, category, price, in_stock) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, category, price, inStock]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /products/:id
app.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, inStock } = req.body;
    const result = await pool.query(
      'UPDATE products SET name = $1, category = $2, price = $3, in_stock = $4 WHERE id = $5 RETURNING *',
      [name, category, price, inStock, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /products/:id
app.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});