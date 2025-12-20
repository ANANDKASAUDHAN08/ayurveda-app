const db = require('../config/database');

// Generate unique order number
function generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD${timestamp}${random}`;
}

// Place order (checkout)
exports.placeOrder = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const userId = req.user.id;
        const {
            delivery_address,
            delivery_city,
            delivery_state,
            delivery_pincode,
            delivery_phone,
            payment_method,
            notes
        } = req.body;

        // Validation
        if (!delivery_address || !delivery_city || !delivery_state || !delivery_pincode || !delivery_phone) {
            return res.status(400).json({
                success: false,
                message: 'All delivery details are required'
            });
        }

        // Start transaction
        await connection.beginTransaction();

        // Get cart items
        const [cartItems] = await connection.execute(`
            SELECT 
                c.id,
                c.product_id,
                c.product_type,
                c.quantity,
                c.price,
                (c.quantity * c.price) as total_price,
                CASE 
                    WHEN c.product_type = 'medicine' THEN m.name
                    WHEN c.product_type = 'device' THEN d.name
                    ELSE 'Service'
                END as product_name
            FROM cart c
            LEFT JOIN medicines m ON c.product_type = 'medicine' AND c.product_id = m.id
            LEFT JOIN medical_devices d ON c.product_type = 'device' AND c.product_id = d.id
            WHERE c.user_id = ?
        `, [userId]);

        if (cartItems.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // Calculate totals
        const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
        const tax_amount = subtotal * 0.09; // 9% tax
        const delivery_fee = subtotal >= 500 ? 0 : 50; // Free delivery above ₹500
        const final_amount = subtotal + tax_amount + delivery_fee;

        // Generate order number
        const order_number = generateOrderNumber();

        // Create order with separate delivery fields
        const [orderResult] = await connection.execute(`
            INSERT INTO orders (
                user_id, order_number, total_amount, tax_amount, delivery_fee,
                final_amount, payment_method, notes, status, payment_status,
                delivery_address, delivery_city, delivery_state, delivery_pincode, delivery_phone
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?, ?, ?, ?, ?)
        `, [
            userId, order_number, subtotal, tax_amount, delivery_fee,
            final_amount, payment_method || 'COD', notes || null,
            delivery_address, delivery_city, delivery_state, delivery_pincode, delivery_phone
        ]);

        const orderId = orderResult.insertId;

        // Create order items
        for (const item of cartItems) {
            await connection.execute(`
                INSERT INTO order_items (
                    order_id, product_id, product_type, product_name,
                    quantity, unit_price, total_price
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                orderId, item.product_id, item.product_type, item.product_name,
                item.quantity, item.price, item.total_price
            ]);
        }

        // Add initial status to history
        await connection.execute(`
            INSERT INTO order_status_history (order_id, status, message)
            VALUES (?, 'pending', 'Order placed successfully')
        `, [orderId]);

        // Clear cart
        await connection.execute('DELETE FROM cart WHERE user_id = ?', [userId]);

        // Commit transaction
        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            data: {
                order_id: orderId,
                order_number,
                total_amount: final_amount,
                status: 'pending'
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Place order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error placing order',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// Get user's orders
exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        let query = `
            SELECT 
                o.id,
                o.order_number,
                o.final_amount as total_amount,
                o.status,
                o.payment_status,
                o.payment_method,
                o.created_at,
                o.updated_at as delivered_at,
                COUNT(oi.id) as total_items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = ?
        `;

        const params = [userId];

        if (status) {
            query += ' AND o.status = ?';
            params.push(status);
        }

        query += ' GROUP BY o.id ORDER BY o.created_at DESC';

        const [orders] = await db.execute(query, params);

        res.json({
            success: true,
            data: orders
        });

    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
};

// Get order details
exports.getOrderDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orderId } = req.params;

        // Get order with items
        const [orders] = await db.execute(`
            SELECT 
                o.*,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', oi.id,
                        'product_id', oi.product_id,
                        'product_type', oi.product_type,
                        'product_name', oi.product_name,
                        'quantity', oi.quantity,
                        'price', oi.unit_price,
                        'total_price', oi.total_price
                    )
                ) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.id = ? AND o.user_id = ?
            GROUP BY o.id
        `, [orderId, userId]);

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Get status history
        const [history] = await db.execute(`
            SELECT status, message, created_at
            FROM order_status_history
            WHERE order_id = ?
            ORDER BY created_at ASC
        `, [orderId]);

        const order = orders[0];
        // items are already parsed by mysql2 driver, no need to JSON.parse
        order.status_history = history;

        res.json({
            success: true,
            data: order
        });

    } catch (error) {
        console.error('Get order details error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching order details',
            error: error.message
        });
    }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const userId = req.user.id;
        const { orderId } = req.params;

        await connection.beginTransaction();

        // Check if order exists and belongs to user
        const [orders] = await connection.execute(
            'SELECT * FROM orders WHERE id = ? AND user_id = ?',
            [orderId, userId]
        );

        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const order = orders[0];

        // Check if order can be cancelled
        if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: `Cannot cancel order with status: ${order.status}`
            });
        }

        // Update order status
        await connection.execute(
            'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['cancelled', orderId]
        );

        // Add to status history
        await connection.execute(`
            INSERT INTO order_status_history (order_id, status, message)
            VALUES (?, 'cancelled', 'Order cancelled by user')
        `, [orderId]);

        await connection.commit();

        res.json({
            success: true,
            message: 'Order cancelled successfully'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling order',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// Update order status (admin function)
exports.updateOrderStatus = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const { orderId } = req.params;
        const { status, message } = req.body;

        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        await connection.beginTransaction();

        // Update order status
        await connection.execute(
            'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, orderId]
        );

        // If delivered, set delivered_at timestamp
        if (status === 'delivered') {
            await connection.execute(
                'UPDATE orders SET delivered_at = CURRENT_TIMESTAMP WHERE id = ?',
                [orderId]
            );
        }

        // Add to status history
        await connection.execute(`
            INSERT INTO order_status_history (order_id, status, message)
            VALUES (?, ?, ?)
        `, [orderId, status, message || `Order status updated to ${status}`]);

        await connection.commit();

        res.json({
            success: true,
            message: 'Order status updated successfully'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating order status',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// Get tracking info for an order
exports.getOrderTracking = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        const [orders] = await db.execute(`
            SELECT id, status, driver_name, driver_phone, driver_lat, driver_lng, customer_lat, customer_lng, estimated_delivery_time
            FROM orders 
            WHERE id = ? AND user_id = ?
        `, [orderId, userId]);

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order tracking info not found'
            });
        }

        res.json({
            success: true,
            data: orders[0]
        });
    } catch (error) {
        console.error('Get order tracking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tracking info'
        });
    }
};

// Simulation: Update driver location (Internal Use / Demo)
exports.simulateDriverMovement = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { lat, lng } = req.body;

        await db.execute(`
            UPDATE orders 
            SET driver_lat = ?, driver_lng = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [lat, lng, orderId]);

        res.json({ success: true, message: 'Driver location updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
