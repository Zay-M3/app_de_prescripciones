import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');
import * as QRCode from 'qrcode';

@Injectable()
export class PdfService {
  async generatePrescriptionPdf(prescription: any): Promise<PDFKit.PDFDocument> {
    const doc = new PDFDocument({ margin: 50 });

    // ── Header ──
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('Prescripción Médica', { align: 'center' });

    doc.moveDown(0.5);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Código: ${prescription.code}`, { align: 'center' });

    doc
      .text(
        `Fecha: ${new Date(prescription.createdAt).toLocaleDateString('es-ES')}`,
        { align: 'center' },
      );

    doc.moveDown(0.3);

    // Línea separadora
    doc
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .stroke();

    doc.moveDown(1);

    // ── Info Doctor ──
    doc.fontSize(12).font('Helvetica-Bold').text('Doctor:');
    doc
      .fontSize(11)
      .font('Helvetica')
      .text(`  Nombre: ${prescription.author?.user?.name ?? 'N/A'}`);

    if (prescription.author?.specialty) {
      doc.text(`  Especialidad: ${prescription.author.specialty}`);
    }

    doc.moveDown(0.5);

    // ── Info Paciente ──
    doc.fontSize(12).font('Helvetica-Bold').text('Paciente:');
    doc
      .fontSize(11)
      .font('Helvetica')
      .text(`  Nombre: ${prescription.patient?.user?.name ?? 'N/A'}`);

    doc.moveDown(0.5);

    // ── Estado ──
    const statusLabel =
      prescription.status === 'consumed' ? 'Consumida' : 'Pendiente';
    doc.fontSize(12).font('Helvetica-Bold').text('Estado: ', { continued: true });
    doc.font('Helvetica').text(statusLabel);

    if (prescription.consumedAt) {
      doc.text(
        `Fecha de consumo: ${new Date(prescription.consumedAt).toLocaleDateString('es-ES')}`,
      );
    }

    doc.moveDown(0.5);

    // ── Notas ──
    if (prescription.notes) {
      doc.fontSize(12).font('Helvetica-Bold').text('Notas:');
      doc.fontSize(11).font('Helvetica').text(`  ${prescription.notes}`);
      doc.moveDown(0.5);
    }

    // Línea separadora
    doc
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .stroke();

    doc.moveDown(1);

    // ── Medicamentos ──
    doc.fontSize(14).font('Helvetica-Bold').text('Medicamentos');
    doc.moveDown(0.5);

    if (prescription.items && prescription.items.length > 0) {
      prescription.items.forEach(
        (item: any, index: number) => {
          doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .text(`${index + 1}. ${item.name}`);

          if (item.dosage) {
            doc.fontSize(10).font('Helvetica').text(`   Dosis: ${item.dosage}`);
          }
          if (item.quantity) {
            doc.text(`   Cantidad: ${item.quantity}`);
          }
          if (item.instructions) {
            doc.text(`   Instrucciones: ${item.instructions}`);
          }

          doc.moveDown(0.5);
        },
      );
    } else {
      doc.fontSize(11).font('Helvetica').text('  Sin medicamentos');
    }

    const frontendUrl = process.env.FRONTEND_URL;
    const qrData = `${frontendUrl}/patient/prescription/${prescription.code}`;
    const qrImageData = await QRCode.toDataURL(qrData);

    doc.image(qrImageData, doc.page.width - 150, doc.y, { width: 100 });

    doc.moveDown(10);
    doc
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .stroke();

    doc.moveDown(0.5);
    doc
      .fontSize(8)
      .font('Helvetica')
      .text(
        'Este documento es una prescripción médica generada electrónicamente.',
        { align: 'center' },
      );

    doc.end();

    return doc;
  }
}
