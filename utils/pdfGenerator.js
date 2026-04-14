const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateInvoice = (saleData, filePath) => {
    const doc = new PDFDocument({ margin: 50 });

    // Stream the PDF to a file
    doc.pipe(fs.createWriteStream(filePath));

    // --- Header Section ---
    doc.fillColor('#0b132b') // Navy Blue (CodeVector Theme)
       .fontSize(20)
       .text('CODEVECTOR LMS - INVOICE', { align: 'center' });
    
    doc.moveDown();
    doc.fontSize(10).fillColor('#444')
       .text(`Invoice Date: ${new Date().toLocaleDateString()}`, { align: 'right' })
       .text(`Invoice ID: ${saleData._id}`, { align: 'right' });

    doc.moveDown();
    doc.path('M 50 120 L 550 120').stroke(); // Horizontal Line

    // --- Client Details ---
    doc.moveDown();
    doc.fillColor('#000').fontSize(12).text('Billed To:', { underline: true });
    doc.fontSize(10).text(`Client Name: ${saleData.leadId.name}`);
    doc.text(`Email: ${saleData.leadId.email}`);

    // --- Table Header ---
    doc.moveDown(2);
    doc.fillColor('#1c2541').rect(50, 220, 500, 20).fill(); // Dark background for header
    doc.fillColor('#fff').text('Description', 60, 225);
    doc.text('Amount', 450, 225);

    // --- Table Body ---
    doc.fillColor('#000').text(`Software/Service Payment (${saleData.courseName || 'LMS Service'})`, 60, 250);
    doc.text(`$${saleData.amount}`, 450, 250);

    // --- Footer ---
    doc.moveDown(5);
    doc.fillColor('#4ea8de').fontSize(14).text(`Total Amount: $${saleData.amount}`, { align: 'right' });
    
    doc.moveDown(3);
    doc.fillColor('#777').fontSize(8).text('Thank you for choosing CodeVector Software House.', { align: 'center' });

    doc.end();
};

module.exports = generateInvoice;