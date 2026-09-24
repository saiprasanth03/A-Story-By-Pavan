import PDFDocument from 'pdfkit';
import path from 'path';
import Event from './models/Event.js';
import Settings from './models/Settings.js';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateEventPdf = (event, discount = 0) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', reject);

      const logoPath = path.join(__dirname, '../frontend/public/images/logo.png');
      const hasLogo = fs.existsSync(logoPath);

      // Fonts
      const fontPlayfairBold = path.join(__dirname, 'fonts', 'PlayfairDisplay-Bold.ttf');
      const fontOswald = path.join(__dirname, 'fonts', 'Oswald-Bold.ttf');
      const fontRaleway = path.join(__dirname, 'fonts', 'Raleway-Regular.ttf');
      const fontRalewayBold = path.join(__dirname, 'fonts', 'Raleway-Bold.ttf');
      
      const mainHeadingFont = fs.existsSync(fontPlayfairBold) ? fontPlayfairBold : 'Helvetica-Bold';
      const secondaryFont = fs.existsSync(fontOswald) ? fontOswald : 'Times-Bold';
      const bodyFont = fs.existsSync(fontRaleway) ? fontRaleway : 'Helvetica';
      const bodyFontBold = fs.existsSync(fontRalewayBold) ? fontRalewayBold : 'Helvetica-Bold';

      // Colors
      const bgColor = '#0f0f0f';
      const whiteColor = '#ffffff';
      const grayColor = '#888888';
      const lightGrayColor = '#cccccc';

      // Helper to draw background without affecting layout position
      const drawBackground = () => {
        const oldY = doc.y;
        const oldX = doc.x;
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(bgColor);
        doc.x = oldX;
        doc.y = oldY;
      };

      // Ensure background is drawn on automatically added pages
      doc.on('pageAdded', () => {
        drawBackground();
      });

      // Fetch settings first, then generate PDF
      Settings.findOne().then(settings => {
        settings = settings || {};
          
          const businessName = settings.businessName || process.env.APP_NAME || 'Studio';
          const headingBusinessName = businessName.toUpperCase();
          const phoneText = settings.whatsappNumber || settings.contactNumber || '(123) 456-7890';
          const emailText = settings.contactEmail || process.env.EMAIL_USER || 'contact@example.com';
          const websiteText = settings.websiteUrl || process.env.SITE_URL || 'www.example.com';

          // --- PAGE 1: Cover Page ---
          drawBackground();
          
          if (hasLogo) {
            doc.image(logoPath, (doc.page.width - 350) / 2, (doc.page.height - 150) / 2, { width: 350 });
          } else {
            doc.font(mainHeadingFont).fontSize(40).fillColor(whiteColor).text(headingBusinessName, 0, (doc.page.height - 40) / 2, { align: 'center' });
          }

          // --- PAGE 2: Content ---
          doc.addPage();
          doc.y = 50; // Reset Y after addPage

          // Header on subsequent pages
          if (hasLogo) {
            doc.image(logoPath, 50, 40, { width: 150 });
          } else {
            doc.font(mainHeadingFont).fontSize(24).fillColor(whiteColor).text(headingBusinessName, 50, 50);
          }

          // Quote on the right
          doc.font(bodyFont).fontSize(32).fillColor(whiteColor)
             .text((event.name || 'Event').toUpperCase(), 50, 50, { align: 'right', width: doc.page.width - 100 });
          doc.font(mainHeadingFont).fontSize(14).fillColor(whiteColor)
             .text('QUOTATION', 50, 95, { align: 'right', width: doc.page.width - 100 });

          // Top line separator
          const separatorY = 125;
          doc.moveTo(50, separatorY).lineTo(doc.page.width - 50, separatorY).strokeColor(grayColor).lineWidth(1).stroke();

          // Title & Date
          doc.y = separatorY + 30;
          doc.font(bodyFont).fontSize(12).fillColor(lightGrayColor).text(`Date: ${event.date || new Date().toISOString().split('T')[0]}`, 50, doc.y);

          // Two Columns: Client Details & Event Logistics
          doc.y += 60;
          const startY = doc.y;

          // Client Box
          doc.rect(50, startY, 230, 100).fillColor('#1a1a1a').fill();
          doc.font(mainHeadingFont).fontSize(10).fillColor(whiteColor).text('CLIENT DETAILS', 65, startY + 15);
          doc.font(bodyFontBold).fontSize(10).fillColor(grayColor)
             .text(`Name:`, 65, startY + 35).font(bodyFont).fillColor(lightGrayColor).text(event.clientName || 'N/A', 110, startY + 35)
             .font(bodyFontBold).fillColor(grayColor).text(`Email:`, 65, startY + 55).font(bodyFont).fillColor(lightGrayColor).text(event.email || 'N/A', 110, startY + 55)
             .font(bodyFontBold).fillColor(grayColor).text(`Phone:`, 65, startY + 75).font(bodyFont).fillColor(lightGrayColor).text(event.phone || 'N/A', 110, startY + 75);

          // Logistics Box
          doc.rect(doc.page.width - 50 - 230, startY, 230, 100).fillColor('#1a1a1a').fill();
          doc.font(mainHeadingFont).fontSize(10).fillColor(whiteColor).text('EVENT DETAILS', doc.page.width - 50 - 215, startY + 15);
          const subEventNames = event.subEventList && event.subEventList.length > 0 ? event.subEventList.map(s => s.name).join(', ') : (event.subEvents || 'N/A');
          doc.font(bodyFontBold).fontSize(10).fillColor(grayColor)
             .text(`Event:`, doc.page.width - 50 - 215, startY + 35).font(bodyFont).fillColor(lightGrayColor).text(event.name || 'N/A', doc.page.width - 50 - 160, startY + 35)
             .font(bodyFontBold).fillColor(grayColor).text(`Sub-Events:`, doc.page.width - 50 - 215, startY + 55).font(bodyFont).fillColor(lightGrayColor).text(subEventNames, doc.page.width - 50 - 140, startY + 55);

          doc.y = startY + 130;

          const checkPageBreak = (needed) => {
            if (doc.y + needed > doc.page.height - 50) {
              doc.addPage();
              doc.y = 50;
            }
          };

          // Services Table Header
          checkPageBreak(50);
          doc.font(mainHeadingFont).fontSize(12).fillColor(whiteColor).text('ITEMISED SERVICE BREAKDOWN', 50, doc.y);
          doc.y += 10;
          
          const tableTop = doc.y;
          doc.rect(50, tableTop, doc.page.width - 100, 25).fillColor('#1a1a1a').fill();
          doc.font(mainHeadingFont).fontSize(10).fillColor(grayColor)
             .text('EVENT / SERVICE DESCRIPTION', 65, tableTop + 8)
             .text('TOTAL COST', doc.page.width - 150, tableTop + 8, { width: 85, align: 'right' });

          doc.y = tableTop + 35;

          const services = event.services || [];
          const subEventList = event.subEventList || [];
          let calculatedTotal = 0;
          
          doc.font(bodyFont).fontSize(10).fillColor(lightGrayColor);
          if (subEventList.length > 0) {
            subEventList.forEach(sub => {
              checkPageBreak(30);
              doc.font(secondaryFont).fillColor(whiteColor).text(`${sub.name}`, 65, doc.y);
              doc.y += 5;
              doc.font(bodyFont).fillColor(lightGrayColor);
              if (sub.services && sub.services.length > 0) {
                sub.services.forEach(service => {
                  checkPageBreak(20);
                  doc.text(`- ${service.name}`, 75, doc.y);
                  doc.text(`Rs. ${service.price.toLocaleString()}/-`, doc.page.width - 150, doc.y - 10, { width: 85, align: 'right' });
                  calculatedTotal += service.price;
                  doc.y += 15;
                });
              } else {
                checkPageBreak(20);
                doc.text(`- No services`, 75, doc.y);
                doc.y += 15;
              }
              doc.y += 5;
            });
          } else if (services.length > 0) {
            services.forEach(service => {
              checkPageBreak(20);
              doc.font(bodyFont).fillColor(lightGrayColor);
              doc.text(`- ${service.name}`, 65, doc.y);
              doc.text(`Rs. ${service.price.toLocaleString()}/-`, doc.page.width - 150, doc.y - 10, { width: 85, align: 'right' });
              calculatedTotal += service.price;
              doc.y += 15;
            });
          } else {
            checkPageBreak(20);
            doc.text('- No services listed.', 65, doc.y);
            calculatedTotal = event.totalAmount || 0;
            doc.y += 20;
          }

          const addOns = event.addOns || [];
          if (addOns.length > 0) {
            checkPageBreak(80);
            doc.y += 15;
            const addOnsTop = doc.y;
            doc.rect(50, addOnsTop, doc.page.width - 100, 25).fillColor('#1a1a1a').fill();
            doc.font(mainHeadingFont).fontSize(10).fillColor(grayColor)
               .text('ADD-ONS', 65, addOnsTop + 8);
            doc.y = addOnsTop + 35;
            doc.font(bodyFont).fontSize(10).fillColor(lightGrayColor);
            addOns.forEach(addon => {
              checkPageBreak(20);
              const name = addon.name || '';
              const price = Number(addon.price) || 0;
              doc.text(`- ${name}`, 65, doc.y);
              if (price > 0) {
                doc.text(`Rs. ${price.toLocaleString()}/-`, doc.page.width - 150, doc.y - 10, { width: 85, align: 'right' });
                calculatedTotal += price;
              }
              doc.y += 15;
            });
          }

          const deliverables = event.deliverables || [];
          const validDeliverables = deliverables.filter(d => {
            if (typeof d === 'object') return d && d.name && d.name.trim() !== '';
            return d && typeof d === 'string' && d.trim() !== '';
          });
          
          if (validDeliverables.length > 0) {
            checkPageBreak(80);
            doc.y += 15;
            const delivTop = doc.y;
            doc.rect(50, delivTop, doc.page.width - 100, 25).fillColor('#1a1a1a').fill();
            doc.font(mainHeadingFont).fontSize(10).fillColor(grayColor)
               .text('DELIVERABLES', 65, delivTop + 8);
            doc.y = delivTop + 35;
            doc.font(bodyFont).fontSize(10).fillColor(lightGrayColor);
            validDeliverables.forEach(del => {
              checkPageBreak(20);
              const name = typeof del === 'object' ? del.name : del;
              const price = typeof del === 'object' ? (Number(del.price) || 0) : 0;
              doc.text(`- ${name}`, 65, doc.y);
              if (price > 0) {
                doc.text(`Rs. ${price.toLocaleString()}/-`, doc.page.width - 150, doc.y - 10, { width: 85, align: 'right' });
                calculatedTotal += price;
              }
              doc.y += 15;
            });
          }

          const complimentries = event.complimentries || [];
          const validComplimentries = complimentries.filter(c => {
            if (typeof c === 'object') return c && c.name && c.name.trim() !== '';
            return c && typeof c === 'string' && c.trim() !== '';
          });

          if (validComplimentries.length > 0) {
            checkPageBreak(80);
            doc.y += 15;
            const compTop = doc.y;
            doc.rect(50, compTop, doc.page.width - 100, 25).fillColor('#1a1a1a').fill();
            doc.font(mainHeadingFont).fontSize(10).fillColor(grayColor)
               .text('COMPLIMENTARIES', 65, compTop + 8);
            doc.y = compTop + 35;
            doc.font(bodyFont).fontSize(10).fillColor(lightGrayColor);
            validComplimentries.forEach(comp => {
              checkPageBreak(20);
              const name = typeof comp === 'object' ? comp.name : comp;
              const price = typeof comp === 'object' ? (Number(comp.price) || 0) : 0;
              doc.text(`- ${name}`, 65, doc.y);
              if (price > 0) {
                doc.text(`Rs. ${price.toLocaleString()}/-`, doc.page.width - 150, doc.y - 10, { width: 85, align: 'right' });
                calculatedTotal += price;
              }
              doc.y += 15;
            });
          }

          doc.moveDown(2);

          // Discount and Totals Table
          const numericDiscount = Number(discount) || 0;
          const finalAmount = Math.max(0, calculatedTotal - numericDiscount);

          checkPageBreak(100);
          const summaryTop = doc.y;
          doc.rect(50, summaryTop, doc.page.width - 100, (numericDiscount > 0 ? 85 : 55)).fillColor('#1a1a1a').fill();
          
          let currY = summaryTop + 15;
          
          if (numericDiscount > 0) {
            doc.font(bodyFontBold).fontSize(11).fillColor(grayColor)
               .text('SUBTOTAL:', 65, currY)
               .fillColor(lightGrayColor).text(`Rs. ${calculatedTotal.toLocaleString()}/-`, doc.page.width - 200, currY, { width: 135, align: 'right' });
            
            currY += 20;
            
            doc.font(bodyFontBold).fontSize(11).fillColor(grayColor)
               .text('DISCOUNT:', 65, currY)
               .fillColor(whiteColor).text(`- Rs. ${numericDiscount.toLocaleString()}/-`, doc.page.width - 200, currY, { width: 135, align: 'right' });
               
            currY += 20;
          }

          doc.font(mainHeadingFont).fontSize(14).fillColor(whiteColor)
             .text('ESTIMATED TOTAL COST:', 65, currY)
             .fontSize(16).text(`Rs. ${finalAmount.toLocaleString()}/-`, doc.page.width - 250, currY - 2, { width: 185, align: 'right' });

          doc.moveTo(50, currY + 30).lineTo(doc.page.width - 50, currY + 30).strokeColor(grayColor).lineWidth(1).stroke();
          doc.moveTo(50, currY + 34).lineTo(doc.page.width - 50, currY + 34).strokeColor(grayColor).lineWidth(0.5).stroke();

          // --- PAGE: Terms & Conditions ---
          doc.addPage();
          doc.y = 50;
          
          doc.font(mainHeadingFont).fontSize(28).fillColor(whiteColor).text('Terms and Conditions', { align: 'center' });
          doc.y += 22;
          
          doc.font(mainHeadingFont).fontSize(18).fillColor(whiteColor).text('Our Shooting Approach', { align: 'center' });
          doc.y += 14;
          
          doc.font(bodyFont).fontSize(11.5).fillColor(lightGrayColor);
          const approachTexts = [
            `We follow a storytelling style approach that focuses on real emotions, natural moments and ritual depth.`,
            `Our photography captures genuine expressions and family reactions with clean and timeless framing.`,
            `Our wedding films are crafted in documentary and cinematic formats, preserving real audio, emotional continuity and elegant visual storytelling.`,
            `All deliverables are provided in high-resolution and 4K quality with professional color grading and sound design.`
          ];
          
          approachTexts.forEach(text => {
             doc.text(text, 50, doc.y, { width: doc.page.width - 100, align: 'center', lineGap: 4 });
             doc.y += 10;
          });
          
          doc.y += 20;
          doc.font(mainHeadingFont).fontSize(18).fillColor(whiteColor).text('Kindly Note', { align: 'center' });
          doc.y += 14;
          doc.font(bodyFont).fontSize(11.5).fillColor(lightGrayColor);
          doc.text(`We truly look forward to being part of your special celebration.\nTo ensure everything goes smoothly, we kindly request your support on the following:`, 50, doc.y, { width: doc.page.width - 100, align: 'center', lineGap: 4 });
          doc.y += 14;
          
          const terms = [
            `For complete RAW and edited footage handover, we kindly request you to provide two new external hard disks. This is purely for safety purposes. Since electronic devices can sometimes fail unexpectedly, we prefer maintaining a backup copy to ensure your memories remain secure. All data will be carefully transferred and handed over safely to you.`,
            `To confirm the booking and block our team's dates, a 20% advance of the total budget is required. This helps us dedicate our complete availability exclusively for your event.`,
            `After the pre-wedding shoot, 20% of the remaining payment will be cleared.`,
            `Another 40% will be paid after the completion of all events.`,
            `The final 20% will be paid after album and video delivery.`,
            `Travel and accommodation arrangements for our team during the Event will be taken care of by the client.`
          ];
          
          terms.forEach(term => {
             const termText = `- ${term}`;
             doc.text(termText, 50, doc.y, { width: doc.page.width - 100, align: 'center', lineGap: 3 });
             doc.y += 10;
          });
          
          doc.y += 14;
          const conclusion = `Our goal is to deliver your memories with care, clarity and commitment.\nWe appreciate your understanding and cooperation in making this journey smooth and memorable for both of us.`;
          doc.text(conclusion, 50, doc.y, { width: doc.page.width - 100, align: 'center', lineGap: 3 });
          
          doc.y += 28;
          
          doc.font(bodyFont).fontSize(11).fillColor(whiteColor).text(`With gratitude,\nTeam ${businessName}`, 50, doc.y, { align: 'right', width: doc.page.width - 100 });


          // --- FINAL PAGE: Contact Details (Like 3rd image) ---
          doc.addPage();
          doc.y = 50; // Reset Y
          
          const contactLogoY = (doc.page.height - 250) / 2;
          if (hasLogo) {
            doc.image(logoPath, (doc.page.width - 250) / 2, contactLogoY, { width: 250 });
          } else {
            doc.font(mainHeadingFont).fontSize(30).fillColor(whiteColor).text(headingBusinessName, 0, contactLogoY + 100, { align: 'center' });
          }

          // Contact Info below the logo
          doc.y = contactLogoY + 200; // Position below logo
          doc.font(mainHeadingFont).fontSize(16).fillColor(whiteColor).text('Contact details', { align: 'center' });
          doc.moveDown(1);
          doc.font(bodyFont).fontSize(12).fillColor(grayColor)
             .text(`Phone : ${phoneText}`, { align: 'center' })
             .text(`Email: ${emailText}`, { align: 'center' })
             .moveDown(0.5)
             .text(websiteText, { align: 'center' });

          // --- Footer for all pages ---
          const pages = doc.bufferedPageRange();
          for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);
            doc.font(bodyFont).fontSize(8).fillColor(grayColor).text(
              `Page ${i + 1} of ${pages.count}`,
              0,
              doc.page.height - 40,
              { align: 'center', lineBreak: false }
            );
          }

          doc.end();
        }).catch(reject);
    } catch (error) {
      reject(error);
    }
  });
};
