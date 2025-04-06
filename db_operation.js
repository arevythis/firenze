const pool = require('./db');

// Function to insert a user
const addUser = async (name, address, email) => {
  const client = await pool.connect();
  try {
    const res = await client.query(
      'INSERT INTO users (name, address, email) VALUES ($1, $2, $3) RETURNING id',
      [name, address, email]
    );
    return res.rows[0].id;
  } finally {
    client.release();
  }
};

// Function to insert an order
const addOrder = async (userId, totalPrice, status) => {
  const client = await pool.connect();
  try {
    const res = await client.query(
      'INSERT INTO orders (user_id, total_price, status) VALUES ($1, $2, $3) RETURNING id',
      [userId, totalPrice, status]
    );
    return res.rows[0].id;
  } finally {
    client.release();
  }
};

// Function to insert an order item
const addOrderItem = async (orderId, productName, quantity, price) => {
  const client = await pool.connect();
  try {
    await client.query(
      'INSERT INTO order_items (order_id, product_name, quantity, price) VALUES ($1, $2, $3, $4)',
      [orderId, productName, quantity, price]
    );
  } finally {
    client.release();
  }
};

// Example usage
const main = async () => {
  try {
    const userId = await addUser('John Doe', '123 Main St', 'john.doe@example.com');
    const orderId = await addOrder(userId, 20.50, 'Pending');
    await addOrderItem(orderId, 'Espresso', 2, 4.00);
    await addOrderItem(orderId, 'Latte', 1, 3.50);
    console.log('Order added successfully');
  } catch (err) {
    console.error('Error adding order:', err);
  }
};

main();