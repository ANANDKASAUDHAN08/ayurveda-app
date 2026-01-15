const db = require('../config/database');
const Razorpay = require('razorpay');
const invoiceService = require('../services/invoice.service');

/**
 * Subscription Controller
 * Handles freemium subscription management with Razorpay
 */

// Initialize Razorpay (reuse existing setup)
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

class SubscriptionController {
    constructor() {
        this.getPricing = this.getPricing.bind(this);
        this.createSubscription = this.createSubscription.bind(this);
        this.confirmSubscription = this.confirmSubscription.bind(this);
        this.getCurrentSubscription = this.getCurrentSubscription.bind(this);
        this.cancelSubscription = this.cancelSubscription.bind(this);
        this.getHistory = this.getHistory.bind(this);
        this.getInvoices = this.getInvoices.bind(this);
        this.downloadInvoice = this.downloadInvoice.bind(this);
    }

    /**
     * Get pricing plans
     */
    async getPricing(req, res) {
        const plans = {
            free: {
                name: 'Free',
                price: 0,
                currency: 'INR',
                billing: 'forever',
                features: [
                    '10 symptom checks per month',
                    '10 chatbot conversations per day',
                    'Basic Prakriti quiz',
                    'Health tools (BMI, reminders)',
                    'Browse services',
                    'With ads'
                ],
                limits: {
                    symptomChecks: 10,
                    chatMessages: 10,
                    familyProfiles: 1,
                    historyDays: 30
                }
            },
            premium: {
                name: 'Premium',
                price: 399,
                yearlyPrice: 3999,
                currency: 'INR',
                billing: 'monthly',
                features: [
                    'Unlimited symptom checks',
                    'Unlimited chatbot conversations',
                    'Detailed treatment plans',
                    'PDF health reports download',
                    'Family profiles (4 members)',
                    '10% consultation discount',
                    'Ad-free experience',
                    'Priority support',
                    'Lifetime history'
                ],
                popular: true,
                savingsMonthly: 0,
                savingsYearly: 789 // ₹4788 vs ₹3999
            },
            premium_plus: {
                name: 'Premium Plus',
                price: 799,
                yearlyPrice: 7999,
                currency: 'INR',
                billing: 'monthly',
                features: [
                    'All Premium features',
                    '2 FREE video consultations/month (worth ₹600)',
                    'Personalized wellness plans',
                    'AI-powered health predictions',
                    'Priority appointment booking',
                    'Free medicine delivery (orders >₹500)',
                    '10% lab test discount',
                    '24/7 emergency access',
                    'Direct pharmacist chat'
                ],
                badge: 'Best Value',
                savingsMonthly: 0,
                savingsYearly: 1589 // ₹9588 vs ₹7999
            }
        };

        res.json({ success: true, plans });
    }

    /**
     * Create subscription with Razorpay
     */
    async createSubscription(req, res) {
        try {
            const { tier, billingCycle } = req.body;
            const userId = req.user.id;

            // Validate tier
            if (!['premium', 'premium_plus'].includes(tier)) {
                return res.status(400).json({ error: 'Invalid subscription tier' });
            }

            // Get user
            const [users] = await db.execute(
                'SELECT email, name, phone FROM users WHERE id = ?',
                [userId]
            );
            const user = users[0];

            // Calculate amount (in paise for Razorpay)
            const prices = {
                premium: { monthly: 399, yearly: 3999 },
                premium_plus: { monthly: 799, yearly: 7999 }
            };

            const amount = prices[tier][billingCycle] * 100; // Convert to paise

            // Create Razorpay subscription plan
            const planData = {
                period: billingCycle === 'yearly' ? 'yearly' : 'monthly',
                interval: 1,
                item: {
                    name: `Ayurveda ${tier.charAt(0).toUpperCase() + tier.slice(1).replace('_', ' ')}`,
                    amount: amount,
                    currency: 'INR',
                    description: `${tier.replace('_', ' ')} subscription - ${billingCycle}`
                }
            };

            // Create Razorpay plan
            const plan = await razorpay.plans.create(planData);

            // Create Razorpay subscription
            const subscriptionData = {
                plan_id: plan.id,
                total_count: billingCycle === 'yearly' ? 12 : 60, // Ensure it bills multiple times
                quantity: 1,
                customer_notify: 1,
                notes: {
                    user_id: userId,
                    email: user.email || '',
                    tier: tier
                }
            };

            const razorpaySubscription = await razorpay.subscriptions.create(subscriptionData);

            // Calculate dates
            const startDate = new Date();
            const endDate = new Date();
            if (billingCycle === 'yearly') {
                endDate.setFullYear(endDate.getFullYear() + 1);
            } else {
                endDate.setMonth(endDate.getMonth() + 1);
            }

            // Save to database (status pending until payment confirmed)
            const [result] = await db.execute(
                `INSERT INTO subscriptions 
         (user_id, tier, status, amount, currency, billing_cycle, start_date, end_date, razorpay_subscription_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, tier, 'pending', amount / 100, 'INR', billingCycle, startDate, endDate, razorpaySubscription.id]
            );

            res.json({
                success: true,
                subscriptionId: result.insertId,
                razorpaySubscriptionId: razorpaySubscription.id,
                razorpayPlanId: plan.id,
                amount: amount / 100,
                currency: 'INR'
            });

        } catch (error) {
            console.error('Create subscription error:', error);
            res.status(500).json({ error: 'Failed to create subscription', details: error.message });
        }
    }

    /**
     * Confirm subscription payment (webhook handler)
     */
    async confirmSubscription(req, res) {
        try {
            const {
                razorpay_subscription_id,
                razorpay_payment_id,
                razorpay_signature
            } = req.body;

            // Verify signature (Mandatory for Subscriptions)
            const crypto = require('crypto');
            // Correct order for subscriptions: payment_id + "|" + subscription_id
            const sign = razorpay_payment_id + '|' + razorpay_subscription_id;
            const expectedSign = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(sign.toString())
                .digest('hex');

            if (razorpay_signature !== expectedSign) {
                console.error('[Subscription Confirmation] Signature verification failed!');
                return res.status(400).json({ error: 'Invalid signature' });
            }

            // Get subscription details from database
            const [subscriptions] = await db.execute(
                'SELECT * FROM subscriptions WHERE razorpay_subscription_id = ?',
                [razorpay_subscription_id]
            );

            if (subscriptions.length === 0) {
                return res.status(404).json({ error: 'Subscription not found' });
            }

            const subscription = subscriptions[0];

            // Update subscription status to active
            await db.execute(
                'UPDATE subscriptions SET status = ? WHERE id = ?',
                ['active', subscription.id]
            );

            // Update user subscription details
            await db.execute(
                `UPDATE users 
         SET subscription_tier = ?, 
             subscription_start_date = ?, 
             subscription_end_date = ?,
             subscription_status = 'active',
             razorpay_payment_id = ?
         WHERE id = ?`,
                [subscription.tier, subscription.start_date, subscription.end_date, razorpay_payment_id, subscription.user_id]
            );

            // Set free consultations for Premium Plus
            if (subscription.tier === 'premium_plus') {
                await db.execute(
                    'UPDATE users SET free_consultations_remaining = 2 WHERE id = ?',
                    [subscription.user_id]
                );
            }

            // Record payment
            const [paymentResult] = await db.execute(
                `INSERT INTO payments 
         (user_id, subscription_id, amount, currency, payment_method, payment_gateway, transaction_id, status, payment_type, paid_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [subscription.user_id, subscription.id, subscription.amount, subscription.currency, 'card', 'razorpay', razorpay_payment_id, 'completed', 'subscription']
            );

            // Create Invoice record
            const invoiceNumber = `INV-${Date.now()}-${subscription.user_id}`;
            const [users] = await db.execute('SELECT name, email, billing_details FROM users WHERE id = ?', [subscription.user_id]);
            const user = users[0];

            await db.execute(
                `INSERT INTO invoices (user_id, payment_id, invoice_number, amount, currency, status, billing_details)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    subscription.user_id,
                    paymentResult.insertId,
                    invoiceNumber,
                    subscription.amount,
                    subscription.currency,
                    'paid',
                    JSON.stringify(user.billing_details || { name: user.name, email: user.email })
                ]
            );

            res.json({
                success: true,
                message: 'Subscription activated successfully',
                tier: subscription.tier
            });

        } catch (error) {
            console.error('Confirm subscription error:', error);
            res.status(500).json({ error: 'Failed to confirm subscription' });
        }
    }

    /**
     * Get current subscription
     */
    async getCurrentSubscription(req, res) {
        try {
            const userId = req.user.id;

            const [users] = await db.execute(
                `SELECT subscription_tier, subscription_status, subscription_end_date,
                symptom_checks_this_month, chat_messages_today, free_consultations_remaining
         FROM users WHERE id = ?`,
                [userId]
            );

            const user = users[0];

            // Get active subscription details if premium user
            let subscriptionDetails = null;
            if (user.subscription_tier !== 'free') {
                const [subscriptions] = await db.execute(
                    `SELECT * FROM subscriptions 
           WHERE user_id = ? AND status = 'active'
           ORDER BY created_at DESC
           LIMIT 1`,
                    [userId]
                );

                if (subscriptions.length > 0) {
                    subscriptionDetails = subscriptions[0];
                }
            }

            // Calculate usage stats
            const usageStats = {
                symptomChecks: {
                    used: user.symptom_checks_this_month,
                    limit: user.subscription_tier === 'free' ? 10 : 'unlimited',
                    remaining: user.subscription_tier === 'free' ? 10 - user.symptom_checks_this_month : 'unlimited'
                },
                chatMessages: {
                    used: user.chat_messages_today,
                    limit: user.subscription_tier === 'free' ? 10 : 'unlimited',
                    remaining: user.subscription_tier === 'free' ? 10 - user.chat_messages_today : 'unlimited'
                },
                freeConsultations: {
                    remaining: user.free_consultations_remaining,
                    limit: user.subscription_tier === 'premium_plus' ? 2 : 0
                }
            };

            res.json({
                success: true,
                subscription: {
                    tier: user.subscription_tier,
                    status: user.subscription_status,
                    endDate: user.subscription_end_date,
                    details: subscriptionDetails
                },
                usage: usageStats
            });

        } catch (error) {
            console.error('Get subscription error:', error);
            res.status(500).json({ error: 'Failed to fetch subscription' });
        }
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription(req, res) {
        try {
            const userId = req.user.id;

            const [subscriptions] = await db.execute(
                'SELECT * FROM subscriptions WHERE user_id = ? AND status = "active"',
                [userId]
            );

            if (subscriptions.length === 0) {
                return res.status(404).json({ error: 'No active subscription found' });
            }

            const subscription = subscriptions[0];

            // Cancel in Razorpay
            if (subscription.razorpay_subscription_id) {
                try {
                    await razorpay.subscriptions.cancel(subscription.razorpay_subscription_id);
                } catch (error) {
                    console.error('Razorpay cancel error:', error);
                    // Continue even if Razorpay cancel fails
                }
            }

            // Update database
            await db.execute(
                'UPDATE subscriptions SET status = "cancelled", auto_renew = FALSE WHERE id = ?',
                [subscription.id]
            );

            await db.execute(
                'UPDATE users SET subscription_status = "cancelled" WHERE id = ?',
                [userId]
            );

            res.json({
                success: true,
                message: 'Subscription cancelled. You can continue using premium features until the end of billing period.',
                endsAt: subscription.end_date
            });

        } catch (error) {
            console.error('Cancel subscription error:', error);
            res.status(500).json({ error: 'Failed to cancel subscription' });
        }
    }

    /**
     * Get subscription history
     */
    async getHistory(req, res) {
        try {
            const userId = req.user.id;

            const [subscriptions] = await db.execute(
                `SELECT s.*, p.transaction_id, p.paid_at 
         FROM subscriptions s
         LEFT JOIN payments p ON s.id = p.subscription_id
         WHERE s.user_id = ?
         ORDER BY s.created_at DESC`,
                [userId]
            );

            res.json({
                success: true,
                history: subscriptions
            });

        } catch (error) {
            console.error('Get history error:', error);
            res.status(500).json({ error: 'Failed to fetch subscription history' });
        }
    }

    /**
     * Get user's invoices
     */
    async getInvoices(req, res) {
        try {
            const userId = req.user.id;
            const [rows] = await db.execute(
                `SELECT i.*, p.transaction_id, p.paid_at, s.tier, s.billing_cycle
                 FROM invoices i
                 JOIN payments p ON i.payment_id = p.id
                 JOIN subscriptions s ON p.subscription_id = s.id
                 WHERE i.user_id = ?
                 ORDER BY i.created_at DESC`,
                [userId]
            );

            res.json({ success: true, invoices: rows });
        } catch (error) {
            console.error('Get invoices error:', error);
            res.status(500).json({ error: 'Failed to fetch invoices' });
        }
    }

    /**
     * Download invoice as PDF
     */
    async downloadInvoice(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            const [rows] = await db.execute(
                `SELECT i.*, p.transaction_id, p.paid_at, u.name as customerName, u.email as customerEmail, s.tier, s.billing_cycle
                 FROM invoices i
                 JOIN payments p ON i.payment_id = p.id
                 JOIN users u ON i.user_id = u.id
                 JOIN subscriptions s ON p.subscription_id = s.id
                 WHERE i.id = ? AND i.user_id = ?`,
                [id, userId]
            );

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Invoice not found' });
            }

            const invoice = rows[0];

            // Safe parsing of billing details (might be object or string depending on DB driver)
            let billing = {};
            if (invoice.billing_details) {
                try {
                    billing = typeof invoice.billing_details === 'string'
                        ? JSON.parse(invoice.billing_details)
                        : invoice.billing_details;
                } catch (e) {
                    console.error('Error parsing billing_details:', e);
                    billing = {};
                }
            }

            const invoiceData = {
                invoiceNumber: invoice.invoice_number,
                date: invoice.created_at,
                amount: parseFloat(invoice.amount),
                currency: invoice.currency,
                customerName: billing.name || invoice.customerName,
                customerEmail: billing.email || invoice.customerEmail,
                customerAddress: billing.address || '',
                description: `${invoice.tier ? invoice.tier.toUpperCase() : 'PREMIUM'} Subscription (${invoice.billing_cycle || 'monthly'})`
            };

            const pdfBuffer = await invoiceService.generateInvoice(invoiceData);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoice_number}.pdf`);
            res.send(pdfBuffer);

        } catch (error) {
            console.error('Download invoice error:', error);
            res.status(500).json({ error: 'Failed to generate invoice PDF' });
        }
    }
}

module.exports = new SubscriptionController();
