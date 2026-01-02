const db = require('../config/database');

/**
 * Cart Controller
 * Handles all cart-related operations
 */

// Get user's cart with full details
exports.getCart = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get cart items with product details
        const [cartItems] = await db.execute(`
            SELECT 
                c.id,
                c.product_id,
                c.product_type,
                c.quantity,
                c.price,
                c.created_at,
                CASE 
                    WHEN c.product_type = 'medicine' THEN m.name
                    WHEN c.product_type = 'device' THEN d.name
                    WHEN c.product_type = 'lab_test' THEN l.name
                    WHEN c.product_type = 'ayurveda_medicine' THEN am.name
                    ELSE 'Service'
                END as product_name,
                CASE 
                    WHEN c.product_type = 'medicine' THEN m.image_url
                    WHEN c.product_type = 'device' THEN d.image_url
                    WHEN c.product_type = 'ayurveda_medicine' THEN am.image_url
                    ELSE NULL
                END as image,
                CASE 
                    WHEN c.product_type = 'medicine' THEN m.description
                    WHEN c.product_type = 'device' THEN d.description
                    WHEN c.product_type = 'lab_test' THEN l.description
                    WHEN c.product_type = 'ayurveda_medicine' THEN am.description
                    ELSE NULL
                END as description,
                (c.quantity * c.price) as total_price
            FROM cart c
            LEFT JOIN medicines m ON c.product_type = 'medicine' AND c.product_id = m.id
            LEFT JOIN medical_devices d ON c.product_type = 'device' AND c.product_id = d.id
            LEFT JOIN lab_tests l ON c.product_type = 'lab_test' AND c.product_id = l.id
            LEFT JOIN ayurveda_medicines am ON c.product_type = 'ayurveda_medicine' AND c.product_id = am.id
            WHERE c.user_id = ?
            ORDER BY c.created_at DESC
        `, [userId]);

        // Calculate totals
        const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
        const taxRate = 0.09; // 9% tax
        const tax = subtotal * taxRate;
        const delivery = subtotal >= 500 ? 0 : 50; // Free delivery above 500
        const total = subtotal + tax + delivery;

        res.json({
            success: true,
            data: {
                items: cartItems,
                totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
                subtotal: parseFloat(subtotal.toFixed(2)),
                tax: parseFloat(tax.toFixed(2)),
                delivery: parseFloat(delivery.toFixed(2)),
                total: parseFloat(total.toFixed(2))
            }
        });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching cart',
            error: error.message
        });
    }
};

// Add item to cart
exports.addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { product_id, product_type, quantity = 1 } = req.body;

        // Validation
        if (!product_id || !product_type) {
            return res.status(400).json({
                success: false,
                message: 'Product ID and type are required'
            });
        }

        if (quantity < 1 || quantity > 10) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be between 1 and 10'
            });
        }

        // Get product price from database
        let price = 0;
        if (product_type === 'medicine') {
            const [medicine] = await db.execute(
                'SELECT price FROM medicines WHERE id = ?',
                [product_id]
            );
            if (medicine.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Medicine not found'
                });
            }
            price = medicine[0].price;
        } else if (product_type === 'device') {
            const [device] = await db.execute(
                'SELECT price FROM medical_devices WHERE id = ?',
                [product_id]
            );
            if (device.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Device not found'
                });
            }
            price = device[0].price;
        } else if (product_type === 'lab_test') {
            const [labTest] = await db.execute(
                'SELECT discounted_price FROM lab_tests WHERE id = ?',
                [product_id]
            );
            if (labTest.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Lab test not found'
                });
            }
            price = labTest[0].discounted_price;
        } else if (product_type === 'ayurveda_medicine') {
            const [medicine] = await db.execute(
                'SELECT price FROM ayurveda_medicines WHERE id = ?',
                [product_id]
            );
            if (medicine.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Ayurveda Medicine not found'
                });
            }
            price = medicine[0].price;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid product type'
            });
        }

        // Check if item already in cart
        const [existing] = await db.execute(
            'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ? AND product_type = ?',
            [userId, product_id, product_type]
        );

        if (existing.length > 0) {
            // Update quantity
            const newQuantity = Math.min(existing[0].quantity + quantity, 10);
            await db.execute(
                'UPDATE cart SET quantity = ?, price = ? WHERE id = ?',
                [newQuantity, price, existing[0].id]
            );
        } else {
            // Insert new item
            await db.execute(
                'INSERT INTO cart (user_id, product_id, product_type, quantity, price) VALUES (?, ?, ?, ?, ?)',
                [userId, product_id, product_type, quantity, price]
            );
        }

        res.json({
            success: true,
            message: 'Item added to cart successfully'
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding item to cart',
            error: error.message
        });
    }
};

// Update cart item quantity
exports.updateQuantity = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { quantity } = req.body;

        // Validation
        if (!quantity || quantity < 1 || quantity > 10) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be between 1 and 10'
            });
        }

        // Check if item belongs to user
        const [item] = await db.execute(
            'SELECT id FROM cart WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (item.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        // Update quantity
        await db.execute(
            'UPDATE cart SET quantity = ? WHERE id = ?',
            [quantity, id]
        );

        res.json({
            success: true,
            message: 'Cart updated successfully'
        });
    } catch (error) {
        console.error('Update quantity error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating cart',
            error: error.message
        });
    }
};

// Remove item from cart
exports.removeItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Delete item
        const [result] = await db.execute(
            'DELETE FROM cart WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        res.json({
            success: true,
            message: 'Item removed from cart'
        });
    } catch (error) {
        console.error('Remove item error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing item',
            error: error.message
        });
    }
};

// Clear entire cart
exports.clearCart = async (req, res) => {
    try {
        const userId = req.user.id;

        await db.execute('DELETE FROM cart WHERE user_id = ?', [userId]);

        res.json({
            success: true,
            message: 'Cart cleared successfully'
        });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error clearing cart',
            error: error.message
        });
    }
};

// Get cart count
exports.getCartCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const [result] = await db.execute(
            'SELECT COALESCE(SUM(quantity), 0) as count FROM cart WHERE user_id = ?',
            [userId]
        );

        res.json({
            success: true,
            data: {
                count: parseInt(result[0].count)
            }
        });
    } catch (error) {
        console.error('Get cart count error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting cart count',
            error: error.message
        });
    }
};
