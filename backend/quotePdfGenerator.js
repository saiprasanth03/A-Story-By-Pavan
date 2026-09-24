import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Settings from './models/Settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates a professional Quote PDF for the "Get a Quote" wizard.
 * @param {Object} quote - QuoteRequest document (plain object or Mongoose doc)
 * @returns {Promise<Buffer>}
 */
export const generateQuotePdf = (quote) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // ── Asset paths ──────────────────────────────────────────────────────────
      const logoPath = path.join(__dirname, '../frontend/public/images/logo.png');
      const hasLogo  = fs.existsSync(logoPath);

      // ── Fonts ────────────────────────────────────────────────────────────────
      const fp  = (n) => path.join(__dirname, 'fonts', n);
      const mainFont  = fs.existsSync(fp('PlayfairDisplay-Bold.ttf'))  ? fp('PlayfairDisplay-Bold.ttf')  : 'Helvetica-Bold';
      const subFont   = fs.existsSync(fp('Oswald-Bold.ttf'))           ? fp('Oswald-Bold.ttf')           : 'Times-Bold';
      const bodyFont  = fs.existsSync(fp('Raleway-Regular.ttf'))       ? fp('Raleway-Regular.ttf')       : 'Helvetica';
      const bodyBold  = fs.existsSync(fp('Raleway-Bold.ttf'))          ? fp('Raleway-Bold.ttf')          : 'Helvetica-Bold';

      // ── Colors ───────────────────────────────────────────────────────────────
      const BG    = '#0f0f0f';
      const WHITE = '#ffffff';
      const GRAY  = '#888888';
      const LGRAY = '#cccccc';
      const GOLD  = '#C9A227';

      const drawBg = () => {
        const y = doc.y, x = doc.x;
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(BG);
        doc.x = x; doc.y = y;
      };

      doc.on('pageAdded', drawBg);

      // ── Fetch settings then render ────────────────────────────────────────────
      Settings.findOne().then(settings => {
        settings = settings || {};
        const bizName  = settings.businessName || process.env.APP_NAME || 'Studio';
        const phone    = settings.whatsappNumber || settings.contactNumber || '';
        const email    = settings.contactEmail   || process.env.EMAIL_USER || '';
        const website  = settings.websiteUrl     || process.env.SITE_URL   || '';

        const W = doc.page.width;

        // ────────────────────────────────────────────────────────────────────────
        // PAGE 1 – Cover
        // ────────────────────────────────────────────────────────────────────────
        drawBg();

        // Decorative lines
        doc.moveTo(50, 80).lineTo(W - 50, 80).strokeColor(GOLD).lineWidth(0.5).stroke();
        doc.moveTo(50, 85).lineTo(W - 50, 85).strokeColor(GOLD).lineWidth(0.2).stroke();

        const midY = (doc.page.height - 200) / 2;

        if (hasLogo) {
          doc.image(logoPath, (W - 220) / 2, midY, { width: 220 });
        } else {
          doc.font(mainFont).fontSize(36).fillColor(WHITE).text(bizName.toUpperCase(), 0, midY, { align: 'center' });
        }

        doc.font(bodyFont).fontSize(11).fillColor(GRAY)
           .text('PHOTOGRAPHY & VIDEOGRAPHY', 0, midY + 150, { align: 'center', characterSpacing: 4 });

        doc.moveDown(1.5);
        doc.font(mainFont).fontSize(22).fillColor(GOLD)
           .text('QUOTE PROPOSAL', { align: 'center', characterSpacing: 2 });

        doc.font(bodyFont).fontSize(10).fillColor(GRAY)
           .text(`Prepared for: ${quote.clientName}`, { align: 'center' });
        doc.font(bodyFont).fontSize(10).fillColor(GRAY)
           .text(`Date: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });

        // Bottom lines
        doc.moveTo(50, doc.page.height - 85).lineTo(W - 50, doc.page.height - 85).strokeColor(GOLD).lineWidth(0.5).stroke();
        doc.font(bodyFont).fontSize(8).fillColor(GRAY)
           .text(bizName, 0, doc.page.height - 70, { align: 'center' });

        // ────────────────────────────────────────────────────────────────────────
        // PAGE 2 – Client Details + Events
        // ────────────────────────────────────────────────────────────────────────
        doc.addPage();
        doc.y = 50;

        // Header
        if (hasLogo) {
          doc.image(logoPath, 50, 40, { width: 120 });
        } else {
          doc.font(mainFont).fontSize(18).fillColor(WHITE).text(bizName.toUpperCase(), 50, 45);
        }
        doc.font(mainFont).fontSize(20).fillColor(WHITE)
           .text('QUOTATION', 0, 50, { align: 'right', width: W - 100 });
        doc.font(bodyFont).fontSize(9).fillColor(GOLD)
           .text('QUOTE PROPOSAL', 0, 75, { align: 'right', width: W - 100, characterSpacing: 2 });

        doc.moveTo(50, 100).lineTo(W - 50, 100).strokeColor(GRAY).lineWidth(0.5).stroke();
        doc.y = 115;

        // Client Info box
        const boxH = 110;
        doc.rect(50, doc.y, W - 100, boxH).fillColor('#1a1a1a').fill();

        const infoX = 70;
        const col2  = W / 2 + 10;
        const by    = doc.y + 15;

        doc.font(mainFont).fontSize(9).fillColor(GOLD)
           .text('CLIENT DETAILS', infoX, by, { characterSpacing: 2 });

        const fields = [
          ['Name',       quote.clientName  || '—'],
          ['Email',      quote.email        || '—'],
          ['Phone',      quote.phone        || '—'],
        ];
        fields.forEach(([label, value], i) => {
          const fy = by + 18 + i * 18;
          doc.font(bodyBold).fontSize(9).fillColor(GRAY).text(label + ':', infoX, fy, { continued: false });
          doc.font(bodyFont).fontSize(9).fillColor(LGRAY).text(value, infoX + 45, fy);
        });

        // Right column
        doc.font(mainFont).fontSize(9).fillColor(GOLD)
           .text('EVENT DETAILS', col2, by, { characterSpacing: 2 });

        const rFields = [
          ['Date',   quote.eventDate || '—'],
          ['City',   quote.city      || '—'],
          ['Events', (quote.events || []).map(e => e.eventType).join(', ') || '—'],
        ];
        rFields.forEach(([label, value], i) => {
          const fy = by + 18 + i * 18;
          doc.font(bodyBold).fontSize(9).fillColor(GRAY).text(label + ':', col2, fy, { continued: false });
          doc.font(bodyFont).fontSize(9).fillColor(LGRAY).text(value, col2 + 45, fy);
        });

        doc.y = by + boxH - 10;

        // ── Events breakdown ─────────────────────────────────────────────────
        const checkBreak = (needed) => {
          if (doc.y + needed > doc.page.height - 60) {
            doc.addPage(); doc.y = 50;
          }
        };

        if (quote.events && quote.events.length > 0) {
          doc.y += 20;
          checkBreak(40);

          // Table header
          doc.rect(50, doc.y, W - 100, 24).fillColor('#1a1a1a').fill();
          doc.font(mainFont).fontSize(9).fillColor(GOLD)
             .text('EVENT COVERAGE', 65, doc.y + 8, { characterSpacing: 1 })
             .text('COST', W - 150, doc.y + 8, { width: 85, align: 'right' });
          doc.y += 32;

          let subtotal = 0;

          quote.events.forEach(ev => {
            checkBreak(30);
            // Event row label
            doc.font(subFont).fontSize(10).fillColor(WHITE)
               .text(`${ev.eventType}`, 65, doc.y);
            doc.font(bodyFont).fontSize(9).fillColor(GRAY)
               .text(`(${ev.shootingDays} shooting day${ev.shootingDays !== 1 ? 's' : ''})`, 65, doc.y + 13);
            doc.y += 28;

            (ev.services || []).forEach(svc => {
              checkBreak(18);
              doc.font(bodyFont).fontSize(9).fillColor(LGRAY)
                 .text(`— ${svc.name}`, 80, doc.y);
              if (svc.price > 0) {
                doc.text(`₹ ${Number(svc.price).toLocaleString('en-IN')}/-`, W - 150, doc.y - 10, { width: 85, align: 'right' });
                subtotal += svc.price;
              }
              doc.y += 16;
            });
            doc.y += 4;
          });

          // ── Package ──────────────────────────────────────────────────────────
          if (quote.selectedPackage && quote.selectedPackage.name) {
            checkBreak(50);
            doc.y += 10;
            doc.rect(50, doc.y, W - 100, 24).fillColor('#1a1a1a').fill();
            doc.font(mainFont).fontSize(9).fillColor(GOLD)
               .text('SELECTED PACKAGE', 65, doc.y + 8, { characterSpacing: 1 });
            doc.y += 32;

            checkBreak(22);
            doc.font(bodyFont).fontSize(9).fillColor(LGRAY)
               .text(`— ${quote.selectedPackage.name}`, 80, doc.y);
            if (quote.selectedPackage.price > 0) {
              doc.text(`₹ ${Number(quote.selectedPackage.price).toLocaleString('en-IN')}/-`,
                       W - 150, doc.y - 10, { width: 85, align: 'right' });
              subtotal += quote.selectedPackage.price;
            }
            doc.y += 16;
          }

          // ── Add-ons ──────────────────────────────────────────────────────────
          if (quote.addOns && quote.addOns.length > 0) {
            checkBreak(50);
            doc.y += 10;
            doc.rect(50, doc.y, W - 100, 24).fillColor('#1a1a1a').fill();
            doc.font(mainFont).fontSize(9).fillColor(GOLD)
               .text('ADD-ONS', 65, doc.y + 8, { characterSpacing: 1 });
            doc.y += 32;

            quote.addOns.forEach(ao => {
              checkBreak(18);
              doc.font(bodyFont).fontSize(9).fillColor(LGRAY)
                 .text(`— ${ao.name}`, 80, doc.y);
              if (ao.price > 0) {
                doc.text(`₹ ${Number(ao.price).toLocaleString('en-IN')}/-`, W - 150, doc.y - 10, { width: 85, align: 'right' });
                subtotal += ao.price;
              }
              doc.y += 16;
            });
          }

          // ── Deliverables ─────────────────────────────────────────────────────
          if (quote.deliverables && quote.deliverables.length > 0) {
            checkBreak(50);
            doc.y += 10;
            doc.rect(50, doc.y, W - 100, 24).fillColor('#1a1a1a').fill();
            doc.font(mainFont).fontSize(9).fillColor(GOLD)
               .text('DELIVERABLES', 65, doc.y + 8, { characterSpacing: 1 });
            doc.y += 32;

            quote.deliverables.forEach(d => {
              checkBreak(18);
              doc.font(bodyFont).fontSize(9).fillColor(LGRAY)
                 .text(`— ${d.name}`, 80, doc.y);
              if (d.price > 0) {
                doc.text(`₹ ${Number(d.price).toLocaleString('en-IN')}/-`, W - 150, doc.y - 10, { width: 85, align: 'right' });
                subtotal += d.price;
              }
              doc.y += 16;
            });
          }

          // ── Totals ───────────────────────────────────────────────────────────
          const discount   = Number(quote.discount)   || 0;
          const finalTotal = Math.max(0, subtotal - discount);

          checkBreak(90);
          doc.y += 16;
          const sumY = doc.y;
          const rowCount = discount > 0 ? 3 : 1;
          doc.rect(50, sumY, W - 100, 20 + rowCount * 22).fillColor('#1a1a1a').fill();

          let cy = sumY + 12;

          if (discount > 0) {
            doc.font(bodyBold).fontSize(10).fillColor(GRAY).text('SUBTOTAL:', 65, cy);
            doc.font(bodyFont).fontSize(10).fillColor(LGRAY)
               .text(`₹ ${subtotal.toLocaleString('en-IN')}/-`, W - 200, cy, { width: 135, align: 'right' });
            cy += 22;

            doc.font(bodyBold).fontSize(10).fillColor(GRAY).text('DISCOUNT:', 65, cy);
            doc.font(bodyFont).fontSize(10).fillColor('#e88')
               .text(`- ₹ ${discount.toLocaleString('en-IN')}/-`, W - 200, cy, { width: 135, align: 'right' });
            cy += 22;
          }

          doc.font(mainFont).fontSize(13).fillColor(WHITE).text('ESTIMATED TOTAL:', 65, cy);
          doc.font(mainFont).fontSize(14).fillColor(GOLD)
             .text(`₹ ${finalTotal.toLocaleString('en-IN')}/-`, W - 250, cy - 1, { width: 185, align: 'right' });

          doc.y = cy + 36;

          // Delivery estimate
          if (quote.estimatedDeliveryDays) {
            checkBreak(30);
            doc.font(bodyFont).fontSize(9).fillColor(GRAY)
               .text(`Estimated delivery: ${quote.estimatedDeliveryDays} working days after the event.`, 50, doc.y, { align: 'center', width: W - 100 });
            doc.y += 20;
          }

          // Special requests
          if (quote.specialRequests && quote.specialRequests.trim()) {
            checkBreak(50);
            doc.y += 10;
            doc.font(mainFont).fontSize(10).fillColor(LGRAY).text('SPECIAL REQUESTS', 50, doc.y);
            doc.y += 14;
            doc.font(bodyFont).fontSize(9).fillColor(GRAY)
               .text(quote.specialRequests, 50, doc.y, { width: W - 100, lineGap: 3 });
            doc.y += 20;
          }
        }

        // ────────────────────────────────────────────────────────────────────────
        // PAGE 3 – Terms & Conditions
        // ────────────────────────────────────────────────────────────────────────
        doc.addPage();
        doc.y = 60;

        doc.font(mainFont).fontSize(26).fillColor(WHITE).text('Terms & Conditions', { align: 'center' });
        doc.y += 20;
        doc.moveTo(100, doc.y).lineTo(W - 100, doc.y).strokeColor(GOLD).lineWidth(0.5).stroke();
        doc.y += 20;

        doc.font(mainFont).fontSize(14).fillColor(WHITE).text('Our Approach', { align: 'center' });
        doc.y += 12;
        doc.font(bodyFont).fontSize(10).fillColor(LGRAY);
        [
          'We follow a storytelling-first approach focused on real emotions, natural moments, and ritual depth.',
          'Our photography captures genuine expressions and family reactions with clean, timeless framing.',
          'Wedding films are crafted in documentary and cinematic formats preserving real audio and emotional continuity.',
          'All deliverables are provided in high-resolution and 4K quality with professional color grading.',
        ].forEach(t => {
          doc.text(t, 50, doc.y, { width: W - 100, align: 'center', lineGap: 3 });
          doc.y += 10;
        });

        doc.y += 16;
        doc.font(mainFont).fontSize(14).fillColor(WHITE).text('Payment Schedule', { align: 'center' });
        doc.y += 12;
        doc.font(bodyFont).fontSize(10).fillColor(LGRAY);
        [
          '— 20% advance required to confirm booking and block dates.',
          '— 20% of remaining balance after pre-wedding shoot.',
          '— 40% after completion of all events.',
          '— Final 20% after album and video delivery.',
        ].forEach(t => {
          doc.text(t, 50, doc.y, { width: W - 100, align: 'center', lineGap: 3 });
          doc.y += 12;
        });

        doc.y += 16;
        doc.font(mainFont).fontSize(14).fillColor(WHITE).text('Kindly Note', { align: 'center' });
        doc.y += 12;
        doc.font(bodyFont).fontSize(10).fillColor(LGRAY);
        [
          '— Travel and accommodation for our team during events will be arranged by the client.',
          '— For complete RAW footage handover, two new external hard disks (1 TB each) are required.',
          '— This quote is valid for 30 days from the date of issue.',
        ].forEach(t => {
          doc.text(t, 50, doc.y, { width: W - 100, align: 'center', lineGap: 3 });
          doc.y += 12;
        });

        doc.y += 22;
        doc.font(bodyFont).fontSize(10).fillColor(WHITE)
           .text(`With gratitude,\nTeam ${bizName}`, 50, doc.y, { align: 'right', width: W - 100 });

        // ────────────────────────────────────────────────────────────────────────
        // PAGE 4 – Contact Page
        // ────────────────────────────────────────────────────────────────────────
        doc.addPage();
        const logoY = (doc.page.height - 200) / 2;
        if (hasLogo) {
          doc.image(logoPath, (W - 220) / 2, logoY, { width: 220 });
        } else {
          doc.font(mainFont).fontSize(30).fillColor(WHITE).text(bizName.toUpperCase(), 0, logoY + 80, { align: 'center' });
        }
        doc.y = logoY + 180;
        doc.font(mainFont).fontSize(14).fillColor(WHITE).text('Get In Touch', { align: 'center' });
        doc.moveDown(0.5);
        doc.font(bodyFont).fontSize(11).fillColor(GRAY);
        if (phone)   doc.text(`Phone: ${phone}`,    { align: 'center' });
        if (email)   doc.text(`Email: ${email}`,    { align: 'center' });
        if (website) doc.text(website,               { align: 'center' });

        // ── Page numbers ─────────────────────────────────────────────────────────
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc.font(bodyFont).fontSize(7).fillColor(GRAY)
             .text(`Page ${i + 1} of ${pages.count}`, 0, doc.page.height - 35, { align: 'center', lineBreak: false });
        }

        doc.end();
      }).catch(reject);
    } catch (err) {
      reject(err);
    }
  });
};
