import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SubscriptionService, Plan, Subscription, Invoice } from '../../shared/services/subscription.service';
import { PaymentService } from '../../shared/services/payment.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
    selector: 'app-billing',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './billing.component.html',
    styleUrls: ['./billing.component.css']
})
export class BillingComponent implements OnInit {
    plans: { [key: string]: Plan } = {};
    subscription: Subscription | null = null;
    usage: any = null;
    invoices: Invoice[] = [];
    isLoading = false;
    isBillingHistoryLoading = false;
    activeCycle: 'monthly' | 'yearly' = 'monthly';

    constructor(
        private subscriptionService: SubscriptionService,
        private paymentService: PaymentService,
        private snackbar: SnackbarService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.loadSubscriptionData();
        this.loadInvoices();
        this.loadPlans();
    }

    loadSubscriptionData() {
        this.isLoading = true;
        this.subscriptionService.getCurrentSubscription().subscribe({
            next: (res) => {
                this.subscription = res.subscription;
                this.usage = res.usage;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Failed to load subscription:', err);
                this.isLoading = false;
            }
        });
    }

    loadPlans() {
        this.subscriptionService.getPlans().subscribe({
            next: (res) => {
                this.plans = res.plans;
            }
        });
    }

    loadInvoices() {
        this.isBillingHistoryLoading = true;
        this.subscriptionService.getInvoices().subscribe({
            next: (res) => {
                this.invoices = res.invoices;
                this.isBillingHistoryLoading = false;
            },
            error: (err) => {
                console.error('Failed to load invoices:', err);
                this.isBillingHistoryLoading = false;
            }
        });
    }

    upgradePlan(tier: string) {
        if (this.subscription?.tier === tier) {
            this.snackbar.info('You are already on this plan');
            return;
        }

        this.isLoading = true;
        this.subscriptionService.createSubscription(tier, this.activeCycle).subscribe({
            next: (res) => {
                // this.isLoading = false;
                this.initiateRazorpay(res);
            },
            error: (err) => {
                console.error('Upgrade error:', err);
                this.snackbar.error('Failed to initiate upgrade');
                this.isLoading = false;
            }
        });
    }

    initiateRazorpay(data: any) {
        const options = {
            key: this.paymentService.getKeyId(),
            subscription_id: data.razorpaySubscriptionId,
            name: 'HealthConnect',
            description: 'Premium Subscription',
            handler: (response: any) => {
                this.confirmPayment(response);
            },
            prefill: {
                name: this.authService.getUser()?.name,
                email: this.authService.getUser()?.email
            },
            theme: {
                color: '#059669'
            }
        };

        // Add this inside the loadRazorpayScript().then() block
        this.paymentService.loadRazorpayScript().then(() => {
            const rzp = this.paymentService.initializeRazorpay(options);
            this.isLoading = false;
            rzp.open();
        });
    }

    confirmPayment(response: any) {
        this.isLoading = true;
        this.subscriptionService.confirmSubscription(response).subscribe({
            next: (res) => {
                this.snackbar.success('Subscription upgraded successfully!');
                this.loadSubscriptionData();
                this.loadInvoices();
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Confirmation error:', err);
                this.snackbar.error('Payment confirmation failed. Please contact support.');
                this.isLoading = false;
            }
        });
    }

    cancelSubscription() {
        if (confirm('Are you sure you want to cancel your subscription? You will lose premium benefits at the end of the billing period.')) {
            this.subscriptionService.cancelSubscription().subscribe({
                next: (res) => {
                    this.snackbar.success('Subscription cancelled successfully');
                    this.loadSubscriptionData();
                },
                error: (err) => {
                    this.snackbar.error('Failed to cancel subscription');
                }
            });
        }
    }

    downloadInvoice(invoice: Invoice) {
        this.subscriptionService.downloadInvoice(invoice.id).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `invoice-${invoice.invoice_number}.pdf`;
                link.click();
            },
            error: (err) => {
                this.snackbar.error('Failed to download invoice');
            }
        });
    }

    getUsagePercentage(item: any): number {
        if (!item || item.limit === 'unlimited') return 0;
        return (item.used / item.limit) * 100;
    }

    formatDate(date: string): string {
        return new Date(date).toLocaleDateString();
    }
}
