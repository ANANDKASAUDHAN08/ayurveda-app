import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, ImageRun, BorderStyle, VerticalAlign } from 'docx';

@Injectable({
    providedIn: 'root'
})
export class ProfileExportService {

    constructor() { }

    prepareExportData(user: any, formValue: any, isDoctor: boolean, stats: any) {
        const rawData = {
            ...user,
            ...formValue,
            stats: isDoctor ? stats : null,
            exportDate: new Date().toLocaleString()
        };

        const sanitized: any = {};
        const allFields = isDoctor
            ? ['name', 'email', 'phone', 'title', 'registration_number', 'specialization', 'experience', 'qualifications', 'about', 'clinic_name', 'clinic_address', 'clinic_timings', 'consultationFee', 'website', 'linkedin']
            : ['name', 'email', 'phone', 'gender', 'dob', 'blood_group', 'address', 'height', 'weight', 'allergies', 'emergency_contact_name', 'emergency_contact_phone'];

        allFields.forEach(field => {
            const val = rawData[field];
            sanitized[field] = (val === null || val === undefined || val === '') ? 'Not provided' : val;
        });

        if (!sanitized.name || sanitized.name === 'Not provided') {
            sanitized.name = rawData.email?.split('@')[0] || 'user';
        }

        sanitized.filenameSafeName = sanitized.name.toString().replace(/[^a-z0-9]+/gi, '_').toLowerCase();
        sanitized.exportDate = rawData.exportDate;

        return sanitized;
    }

    async exportAsPDF(data: any, profileImage: string | null) {
        const doc = new jsPDF();
        let yPos = 0;

        // Premium gradient header background
        doc.setFillColor(5, 150, 105); // Dark emerald
        doc.rect(0, 0, 210, 50, 'F');
        doc.setFillColor(16, 185, 129); // Light emerald
        doc.rect(0, 0, 210, 40, 'F');
        doc.setFillColor(5, 150, 105); // Dark emerald top
        doc.rect(0, 0, 210, 30, 'F');

        // Decorative dot pattern
        doc.setFillColor(255, 255, 255, 0.2);
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                doc.circle(20 + i * 6, 10 + j * 6, 0.4, 'F');
                doc.circle(180 - i * 6, 10 + j * 6, 0.4, 'F');
            }
        }

        // Logo and Title Alignment
        const brandName = 'HEALTHCONNECT';
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        const textWidth = doc.getTextWidth(brandName);
        const logoSize = 10;
        const spacing = 4;
        const totalWidth = logoSize + spacing + textWidth;
        const startX = (210 - totalWidth) / 2;

        yPos = 25;

        // Draw heart icon
        const logoX = startX + logoSize / 2;
        const logoY = yPos - 3;
        doc.setFillColor(255, 255, 255);
        doc.circle(logoX - 2, logoY, 2.5, 'F');
        doc.circle(logoX + 2, logoY, 2.5, 'F');
        doc.triangle(logoX - 4.5, logoY + 0.5, logoX + 4.5, logoY + 0.5, logoX, logoY + 6, 'F');

        doc.setDrawColor(5, 150, 105);
        doc.setLineWidth(0.4);
        doc.line(logoX - 2.5, logoY + 1.5, logoX - 1, logoY - 1);
        doc.line(logoX - 1, logoY - 1, logoX, logoY + 2.5);
        doc.line(logoX, logoY + 2.5, logoX + 1, logoY - 1);
        doc.line(logoX + 1, logoY - 1, logoX + 2.5, logoY + 1.5);

        doc.setTextColor(255, 255, 255);
        doc.text(brandName, startX + logoSize + spacing, yPos);

        yPos += 10;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('User Profile Report', 105, yPos, { align: 'center' });

        yPos = 60;

        // Profile Card
        const cardX = 15;
        const cardWidth = 180;
        doc.setFillColor(200, 200, 200);
        doc.roundedRect(cardX + 2, yPos + 2, cardWidth, 55, 3, 3, 'F');
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(cardX, yPos, cardWidth, 55, 3, 3, 'F');
        doc.setDrawColor(5, 150, 105);
        doc.setLineWidth(0.5);
        doc.roundedRect(cardX, yPos, cardWidth, 55, 3, 3, 'S');

        if (profileImage) {
            try {
                const imageUrl = `${environment.apiUrl.replace('/api', '')}/${profileImage}`;
                const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                    const image = new Image();
                    image.crossOrigin = 'Anonymous';
                    image.onload = () => resolve(image);
                    image.onerror = reject;
                    image.src = imageUrl;
                });
                doc.setFillColor(245, 250, 248);
                doc.circle(cardX + 25, yPos + 27.5, 22, 'F');
                doc.addImage(img, 'JPEG', cardX + 5, yPos + 7.5, 40, 40);
                doc.setDrawColor(5, 150, 105);
                doc.setLineWidth(1);
                // doc.circle(cardX + 25, yPos + 27.5, 21, 'S');
            } catch (error) {
                console.log('Could not load profile image');
            }
        }

        const textX = profileImage ? cardX + 55 : cardX + 10;
        doc.setFontSize(18);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(data.name || 'Unknown', textX, yPos + 18);

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text('Email:', textX, yPos + 29);
        doc.text(data.email || 'No email', textX + 13, yPos + 29);
        doc.text('Phone:', textX, yPos + 39);
        doc.text(data.phone || 'No phone', textX + 13, yPos + 39);

        yPos += 70;

        // Personal Info Table
        const personalData = [
            ['Gender', data.gender],
            ['Date of Birth', data.dob ? new Date(data.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not provided'],
            ['Blood Group', data.blood_group],
            ['Address', data.address],
            ['Height', data.height ? `${data.height} cm` : 'Not provided'],
            ['Weight', data.weight ? `${data.weight} kg` : 'Not provided'],
            ['Allergies', data.allergies]
        ].filter(row => row[1] && row[1] !== 'Not provided');

        if (personalData.length > 0) {
            doc.setFillColor(236, 253, 245);
            doc.roundedRect(15, yPos, 180, 15, 2, 2, 'F');
            doc.setFontSize(14);
            doc.setTextColor(5, 150, 105);
            doc.setFont('helvetica', 'bold');
            doc.text('Personal Information', 20, yPos + 10);
            yPos += 20;

            autoTable(doc, {
                startY: yPos,
                head: [['Field', 'Information']],
                body: personalData,
                theme: 'grid',
                headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255] },
                columnStyles: { 0: { fontStyle: 'bold', fillColor: [236, 253, 245], textColor: [5, 150, 105] } },
                margin: { left: 15, right: 15 }
            });
            yPos = (doc as any).lastAutoTable.finalY + 15;
        }

        // Emergency Contact
        const emergencyData = [
            ['Contact Name', data.emergency_contact_name],
            ['Contact Phone', data.emergency_contact_phone]
        ].filter(row => row[1] && row[1] !== 'Not provided');

        if (emergencyData.length > 0) {
            doc.setFillColor(254, 242, 242);
            doc.roundedRect(15, yPos, 180, 15, 2, 2, 'F');
            doc.setFontSize(14);
            doc.setTextColor(220, 38, 38);
            doc.setFont('helvetica', 'bold');
            doc.text('Emergency Contact', 20, yPos + 10);
            yPos += 20;

            autoTable(doc, {
                startY: yPos,
                head: [['Field', 'Information']],
                body: emergencyData,
                theme: 'grid',
                headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255] },
                columnStyles: { 0: { fontStyle: 'bold', fillColor: [254, 226, 226], textColor: [220, 38, 38] } },
                margin: { left: 15, right: 15 }
            });
        }

        const pageHeight = doc.internal.pageSize.height;
        doc.setFillColor(245, 245, 245);
        doc.rect(0, pageHeight - 25, 210, 25, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.line(15, pageHeight - 25, 195, pageHeight - 25);
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(`Generated on ${new Date().toLocaleString()}`, 105, pageHeight - 15, { align: 'center' });
        doc.text('HealthConnect - Your Digital Health Companion', 105, pageHeight - 8, { align: 'center' });

        doc.save(`healthconnect-profile-${data.filenameSafeName}-${Date.now()}.pdf`);
    }

    async exportAsWord(data: any, profileImage: string | null) {
        let profileImagePatch: any = null;
        if (profileImage) {
            try {
                const imageUrl = `${environment.apiUrl.replace('/api', '')}/${profileImage}`;
                const response = await fetch(imageUrl);
                const buffer = await response.arrayBuffer();
                profileImagePatch = new ImageRun({
                    data: buffer,
                    transformation: { width: 80, height: 80 },
                    type: 'jpg'
                });
            } catch (e) {
                console.error('Could not load profile image for Word:', e);
            }
        }

        const personalFields = [
            { label: 'Gender', value: String(data.gender) },
            { label: 'Date of Birth', value: data.dob ? new Date(data.dob).toLocaleDateString() : 'Not provided' },
            { label: 'Blood Group', value: String(data.blood_group) },
            { label: 'Address', value: String(data.address) },
            { label: 'Height', value: data.height ? `${data.height} cm` : 'Not provided' },
            { label: 'Weight', value: data.weight ? `${data.weight} kg` : 'Not provided' },
            { label: 'Allergies', value: String(data.allergies) }
        ].filter(f => f.value && f.value !== 'Not provided' && f.value !== 'undefined');

        const emergencyFields = [
            { label: 'Contact Name', value: String(data.emergency_contact_name) },
            { label: 'Contact Phone', value: String(data.emergency_contact_phone) }
        ].filter(f => f.value && f.value !== 'Not provided' && f.value !== 'undefined');

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: "HEALTHCONNECT", color: "10B981", bold: true, size: 48 }),
                            new TextRun({ text: "User Profile Report", color: "6B7280", size: 24, break: 1 })
                        ],
                        spacing: { after: 400 }
                    }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        width: { size: 30, type: WidthType.PERCENTAGE },
                                        children: profileImagePatch ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [profileImagePatch] })] : [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Profile Photo", italics: true, color: "9CA3AF" })] })],
                                        verticalAlign: VerticalAlign.CENTER,
                                    }),
                                    new TableCell({
                                        width: { size: 70, type: WidthType.PERCENTAGE },
                                        children: [
                                            new Paragraph({ children: [new TextRun({ text: String(data.name || 'User Profile'), bold: true, size: 32, color: "111827" })] }),
                                            new Paragraph({ children: [new TextRun({ text: `Email: ${data.email || 'N/A'}`, size: 20, color: "4B5563" })] }),
                                            new Paragraph({ children: [new TextRun({ text: `Phone: ${data.phone || 'N/A'}`, size: 20, color: "4B5563" })] })
                                        ],
                                        margins: { left: 400 }
                                    })
                                ]
                            })
                        ]
                    }),
                    new Paragraph({ text: "", spacing: { before: 400 } }),
                    new Paragraph({
                        shading: { fill: "F0FDF4" },
                        children: [new TextRun({ text: "PERSONAL INFORMATION", bold: true, size: 24, color: "065F46" })],
                        spacing: { before: 200, after: 150 }
                    }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: personalFields.map(f => new TableRow({
                            children: [
                                new TableCell({
                                    width: { size: 35, type: WidthType.PERCENTAGE },
                                    shading: { fill: "F9FAFB" },
                                    children: [new Paragraph({ children: [new TextRun({ text: f.label, bold: true, size: 20 })] })]
                                }),
                                new TableCell({
                                    width: { size: 65, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ children: [new TextRun({ text: f.value, size: 20 })] })]
                                })
                            ]
                        }))
                    }),
                    ...(emergencyFields.length > 0 ? [
                        new Paragraph({ text: "", spacing: { before: 400 } }),
                        new Paragraph({
                            shading: { fill: "FEF2F2" },
                            children: [new TextRun({ text: "EMERGENCY CONTACT", bold: true, size: 24, color: "991B1B" })],
                            spacing: { before: 200, after: 150 }
                        }),
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: emergencyFields.map(f => new TableRow({
                                children: [
                                    new TableCell({
                                        width: { size: 35, type: WidthType.PERCENTAGE },
                                        shading: { fill: "F9FAFB" },
                                        children: [new Paragraph({ children: [new TextRun({ text: f.label, bold: true, size: 20 })] })]
                                    }),
                                    new TableCell({
                                        width: { size: 65, type: WidthType.PERCENTAGE },
                                        children: [new Paragraph({ children: [new TextRun({ text: f.value, size: 20 })] })]
                                    })
                                ]
                            }))
                        })
                    ] : []),
                    new Paragraph({ text: "", spacing: { before: 1000 } }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: `Generated on ${new Date().toLocaleString()}`, size: 16, color: "9CA3AF" }),
                            new TextRun({ text: "HealthConnect - Your Digital Health Companion", size: 14, color: "D1D5DB", break: 1 })
                        ]
                    })
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        this.downloadFile(blob, `healthconnect-profile-${data.filenameSafeName}-${Date.now()}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    }

    exportAsText(data: any) {
        let content = `HEALTHCONNECT PROFILE REPORT\n`;
        content += `============================\n`;
        content += `Generated on: ${data.exportDate}\n\n`;
        Object.keys(data)
            .filter(key => key !== 'exportDate' && key !== 'id' && key !== 'profile_image' && key !== 'filenameSafeName')
            .forEach(key => {
                const label = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                content += `${label.padEnd(25)}: ${data[key]}\n`;
            });
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        this.downloadFile(blob, `healthconnect-profile-${data.filenameSafeName}-${Date.now()}.txt`, 'text/plain');
    }

    exportAsJSON(data: any) {
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
        this.downloadFile(blob, `healthconnect-profile-${data.filenameSafeName}-${Date.now()}.json`, 'application/json');
    }

    private downloadFile(blob: Blob, fileName: string, type: string) {
        const url = URL.createObjectURL(blob);
        const link: HTMLAnchorElement = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}
