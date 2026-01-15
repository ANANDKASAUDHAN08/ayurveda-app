const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class InvoiceService {
    constructor() {
        this.companyDetails = {
            name: 'HealthConnect',
            address: '123 Wellness Way, Rishikesh, Uttarakhand, India',
            phone: '+91 98765 43210',
            email: 'billing@healthconnect.com',
            website: 'www.healthconnect.com',
            gstin: 'GSTIN1234567890'
        };
    }

    /**
     * Generate dynamic PDF invoice
     * @param {Object} invoiceData Data to populate the invoice 
     * @returns {Promise<Buffer>}
     */
    async generateInvoice(invoiceData) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50, size: 'A4' });
                const buffers = [];

                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(buffers);
                    resolve(pdfBuffer);
                });

                this.generateHeader(doc);
                this.generateCustomerInformation(doc, invoiceData);
                this.generateInvoiceTable(doc, invoiceData);
                this.generateFooter(doc);

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    generateHeader(doc) {
        doc
            .fillColor('#059669') // Emerald 600
            .fontSize(24)
            .text('HealthConnect', 50, 45, { align: 'left' })
            .fillColor('#444444')
            .fontSize(10)
            .text(this.companyDetails.name, 200, 50, { align: 'right' })
            .text(this.companyDetails.address, 200, 65, { align: 'right' })
            .text(this.companyDetails.phone, 200, 80, { align: 'right' })
            .moveDown();
    }

    generateCustomerInformation(doc, invoiceData) {
        doc
            .fillColor('#444444')
            .fontSize(20)
            .text('Invoice', 50, 160);

        this.generateHr(doc, 185);

        const customerInfoTop = 200;

        doc
            .fontSize(10)
            .text('Invoice Number:', 50, customerInfoTop)
            .font('Helvetica-Bold')
            .text(invoiceData.invoiceNumber, 150, customerInfoTop)
            .font('Helvetica')
            .text('Invoice Date:', 50, customerInfoTop + 15)
            .text(new Date(invoiceData.date).toLocaleDateString(), 150, customerInfoTop + 15)
            .text('Amount Due:', 50, customerInfoTop + 30)
            .text(`${invoiceData.currency} ${invoiceData.amount.toFixed(2)}`, 150, customerInfoTop + 30)

            .font('Helvetica-Bold')
            .text(invoiceData.customerName, 300, customerInfoTop)
            .font('Helvetica')
            .text(invoiceData.customerEmail, 300, customerInfoTop + 15)
            .text(invoiceData.customerAddress || '', 300, customerInfoTop + 30)
            .moveDown();

        this.generateHr(doc, 252);
    }

    generateInvoiceTable(doc, invoiceData) {
        let i;
        const invoiceTableTop = 330;

        doc.font('Helvetica-Bold');
        this.generateTableRow(
            doc,
            invoiceTableTop,
            'Description',
            'Quantity',
            'Unit Price',
            'Total'
        );
        this.generateHr(doc, invoiceTableTop + 20);
        doc.font('Helvetica');

        const position = invoiceTableTop + 30;
        this.generateTableRow(
            doc,
            position,
            invoiceData.description,
            '1',
            `${invoiceData.currency} ${invoiceData.amount.toFixed(2)}`,
            `${invoiceData.currency} ${invoiceData.amount.toFixed(2)}`
        );

        this.generateHr(doc, position + 20);

        const subtotalPosition = position + 30;
        this.generateTableRow(
            doc,
            subtotalPosition,
            '',
            '',
            'Subtotal',
            `${invoiceData.currency} ${invoiceData.amount.toFixed(2)}`
        );

        doc.font('Helvetica-Bold');
        const grandTotalPosition = subtotalPosition + 25;
        this.generateTableRow(
            doc,
            grandTotalPosition,
            '',
            '',
            'Total Paid',
            `${invoiceData.currency} ${invoiceData.amount.toFixed(2)}`
        );
        doc.font('Helvetica');
    }

    generateFooter(doc) {
        doc
            .fontSize(10)
            .text(
                'Payment is due within 15 days. Thank you for your business.',
                50,
                780,
                { align: 'center', width: 500 }
            );
    }

    generateTableRow(doc, y, item, quantity, unitCost, total) {
        doc
            .fontSize(10)
            .text(item, 50, y)
            .text(quantity, 280, y, { width: 90, align: 'right' })
            .text(unitCost, 370, y, { width: 90, align: 'right' })
            .text(total, 0, y, { align: 'right' });
    }

    generateHr(doc, y) {
        doc
            .strokeColor('#eeeeee')
            .lineWidth(1)
            .moveTo(50, y)
            .lineTo(550, y)
            .stroke();
    }
}

module.exports = new InvoiceService();
