const db = require('../config/database');
const MedicineMatcherService = require('../services/medicine-matcher.service');

/**
 * Get prescription medicines with product matches for ordering
 */
exports.getMedicinesForOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // 1. Verify prescription belongs to user and is verified
        const [prescriptions] = await db.query(`
      SELECT p.*, u.name as patient_name
      FROM prescriptions p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ? AND p.user_id = ?
    `, [id, userId]);

        if (!prescriptions.length) {
            return res.status(404).json({ error: 'Prescription not found' });
        }

        const prescription = prescriptions[0];

        if (prescription.status !== 'verified') {
            return res.status(400).json({
                error: 'Prescription must be verified before ordering',
                status: prescription.status
            });
        }

        // Check expiry
        if (new Date(prescription.expiry_date) < new Date()) {
            return res.status(400).json({
                error: 'Prescription has expired',
                expiry_date: prescription.expiry_date
            });
        }

        // 2. Get prescription medicines
        const [medicines] = await db.query(`
      SELECT * FROM prescription_medicines
      WHERE prescription_id = ?
    `, [id]);

        // 3. Get all medicines (products) for matching
        const [products] = await db.query(`
      SELECT id, name, price, stock, image_url
      FROM medicines
      WHERE price > 0 AND stock > 0
      LIMIT 500
    `);

        // 4. Match medicines with products
        const matchedMedicines = [];
        let totalAmount = 0;
        let matchedCount = 0;

        for (const medicine of medicines) {
            const match = MedicineMatcherService.findBestMatch(medicine.medicine_name, products);

            // Calculate quantity needed
            const quantityNeeded = MedicineMatcherService.calculateQuantityNeeded(
                medicine.frequency || '3 times daily',
                medicine.duration || '5 days'
            );

            if (match && match.product) {
                const available = match.product.stock >= quantityNeeded;
                const price = parseFloat(match.product.price);
                const amount = price * quantityNeeded;

                matchedMedicines.push({
                    id: medicine.id,
                    name: medicine.medicine_name,
                    dosage: medicine.dosage,
                    frequency: medicine.frequency,
                    duration: medicine.duration,
                    quantity_needed: quantityNeeded,
                    matched_product: {
                        id: match.product.id,
                        name: match.product.name,
                        price: price,
                        stock: match.product.stock,
                        available: available,
                        image: match.product.image_url,
                        similarity: match.similarity,
                        match_type: match.matchType
                    }
                });

                if (available) {
                    totalAmount += amount;
                    matchedCount++;
                }
            } else {
                // Get suggestions for unmatched medicine
                const suggestions = MedicineMatcherService.getSuggestions(medicine.medicine_name, products);

                matchedMedicines.push({
                    id: medicine.id,
                    name: medicine.medicine_name,
                    dosage: medicine.dosage,
                    frequency: medicine.frequency,
                    duration: medicine.duration,
                    quantity_needed: quantityNeeded,
                    matched_product: null,
                    suggestions: suggestions
                });
            }
        }

        // 5. Calculate discount
        const [discounts] = await db.query(`
      SELECT * FROM prescription_discounts
      WHERE code = 'PRESCRIPTION10' AND is_active = 1
      LIMIT 1
    `);

        let discountAmount = 0;
        let discountCode = null;

        if (discounts.length && totalAmount >= discounts[0].min_order_amount) {
            const discount = discounts[0];
            if (discount.discount_type === 'percentage') {
                discountAmount = (totalAmount * discount.discount_value) / 100;
                if (discount.max_discount) {
                    discountAmount = Math.min(discountAmount, parseFloat(discount.max_discount));
                }
            } else {
                discountAmount = parseFloat(discount.discount_value);
            }
            discountCode = discount.code;
        }

        const finalAmount = totalAmount - discountAmount;

        res.json({
            prescription: {
                id: prescription.id,
                patient_name: prescription.patient_name,
                issue_date: prescription.issue_date,
                expiry_date: prescription.expiry_date,
                status: prescription.status
            },
            medicines: matchedMedicines,
            summary: {
                total_medicines: medicines.length,
                matched: matchedCount,
                unmatched: medicines.length - matchedCount,
                total_amount: parseFloat(totalAmount.toFixed(2)),
                discount_applicable: discountAmount > 0,
                discount_code: discountCode,
                discount_amount: parseFloat(discountAmount.toFixed(2)),
                final_amount: parseFloat(finalAmount.toFixed(2))
            }
        });

    } catch (error) {
        console.error('Error getting medicines for order:', error);
        res.status(500).json({ error: 'Failed to get medicines for order' });
    }
};

/**
 * Add prescription medicines to cart
 */
exports.addPrescriptionToCart = async (req, res) => {
    try {
        const { id } = req.params;
        const { items, apply_discount = true } = req.body;
        const userId = req.user.id;

        // 1. Validate prescription
        const [prescriptions] = await db.query(`
      SELECT * FROM prescriptions
      WHERE id = ? AND user_id = ? AND status = 'verified'
    `, [id, userId]);

        if (!prescriptions.length) {
            return res.status(404).json({ error: 'Verified prescription not found' });
        }

        // Check expiry
        if (new Date(prescriptions[0].expiry_date) < new Date()) {
            return res.status(400).json({ error: 'Prescription has expired' });
        }

        // 2. Clear existing cart
        await db.query('DELETE FROM cart WHERE user_id = ?', [userId]);

        // 3. Add items to cart
        let totalAmount = 0;
        for (const item of items) {
            const [products] = await db.query(
                'SELECT price FROM medicines WHERE id = ?',
                [item.product_id]
            );

            if (products.length) {
                const price = parseFloat(products[0].price);
                const amount = price * item.quantity;
                totalAmount += amount;

                await db.query(`
          INSERT INTO cart (user_id, product_id, quantity, prescription_id, prescription_medicine_id)
          VALUES (?, ?, ?, ?, ?)
        `, [userId, item.product_id, item.quantity, id, item.medicine_id]);
            }
        }

        // 4. Apply discount code if requested
        let discountAmount = 0;
        if (apply_discount) {
            const [discounts] = await db.query(`
        SELECT * FROM prescription_discounts
        WHERE code = 'PRESCRIPTION10' AND is_active = 1
      `);

            if (discounts.length && totalAmount >= discounts[0].min_order_amount) {
                const discount = discounts[0];
                if (discount.discount_type === 'percentage') {
                    discountAmount = (totalAmount * discount.discount_value) / 100;
                    if (discount.max_discount) {
                        discountAmount = Math.min(discountAmount, parseFloat(discount.max_discount));
                    }
                }
            }
        }

        res.json({
            message: 'Medicines added to cart successfully',
            cart_count: items.length,
            total_amount: parseFloat(totalAmount.toFixed(2)),
            discount_amount: parseFloat(discountAmount.toFixed(2)),
            final_amount: parseFloat((totalAmount - discountAmount).toFixed(2)),
            discount_code: apply_discount ? 'PRESCRIPTION10' : null
        });

    } catch (error) {
        console.error('Error adding prescription to cart:', error);
        res.status(500).json({ error: 'Failed to add items to cart' });
    }
};

module.exports = {
    getMedicinesForOrder: exports.getMedicinesForOrder,
    addPrescriptionToCart: exports.addPrescriptionToCart
};
