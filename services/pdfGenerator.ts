
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompanyProfile, Document } from '../types';
import { numberToWords } from './numberToWords';

export const generatePdf = (docData: Document, profile: CompanyProfile): string => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    let yPos = margin;

    const docTitle = docData.docType === 'invoice' ? 'TAX INVOICE' : 'QUOTATION';
    const { pdfSettings } = docData;

    // --- HEADER ---
    const headerLeftX = margin;
    const headerRightX = pageWidth - margin;
    
    if (pdfSettings.showLogo && profile.logo) {
        try {
            doc.addImage(profile.logo, 'PNG', headerLeftX, yPos, 25, 25);
        } catch (e) { console.error("Error adding logo image:", e); }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(profile.name, headerLeftX + (pdfSettings.showLogo ? 28 : 0), yPos + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(profile.address, headerLeftX + (pdfSettings.showLogo ? 28 : 0), yPos + 13);
    doc.text(`${profile.cityStatePincode}, ${profile.country}`, headerLeftX + (pdfSettings.showLogo ? 28 : 0), yPos + 17);

    doc.setFont('helvetica', 'bold');
    doc.text('Email:', headerRightX, yPos + 13, { align: 'right' });
    doc.text('Phone:', headerRightX, yPos + 17, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(profile.email, headerRightX - 10, yPos + 13, { align: 'right' });
    doc.text(profile.phone, headerRightX - 10, yPos + 17, { align: 'right' });

    yPos += 28;
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 2;
    
    if (docData.gstType === 'gst') {
        doc.setFont('helvetica', 'bold');
        doc.text(`GSTIN: ${profile.gstin}`, pageWidth / 2, yPos + 5, { align: 'center' });
        yPos += 8;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(docTitle, pageWidth / 2, yPos + 5, { align: 'center' });
    if(docData.docType === 'invoice') {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Original for Recipient', pageWidth / 2, yPos + 9, { align: 'center' });
    }
    yPos += 12;

    // --- CUSTOMER & DOC DETAILS ---
    doc.setLineWidth(0.2);
    doc.rect(margin, yPos, contentWidth, 25);
    doc.line(pageWidth / 2, yPos, pageWidth / 2, yPos + 25);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Details (Bill to):', margin + 2, yPos + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(docData.customer.name, margin + 2, yPos + 10);
    const addressLines = doc.splitTextToSize(`${docData.customer.address}, ${docData.customer.cityStatePincode}`, (contentWidth / 2) - 5);
    doc.text(addressLines, margin + 2, yPos + 14);
    if(docData.customer.gstin) {
      doc.text(`GSTIN: ${docData.customer.gstin}`, margin + 2, yPos + 22);
    }
    
    const rightColX = pageWidth / 2 + 2;
    doc.setFont('helvetica', 'bold');
    doc.text(`${docData.docType === 'invoice' ? 'Invoice' : 'Quotation'} No:`, rightColX, yPos + 5);
    doc.text('Date:', rightColX, yPos + 10);
    if (docData.docType === 'invoice') doc.text('Due Date:', rightColX, yPos + 15);
    else doc.text('Valid Till:', rightColX, yPos + 15);

    doc.setFont('helvetica', 'normal');
    doc.text(docData.docNumber, rightColX + 25, yPos + 5);
    doc.text(new Date(docData.date).toLocaleDateString('en-GB'), rightColX + 25, yPos + 10);
    if (docData.docType === 'invoice' && docData.dueDate) doc.text(new Date(docData.dueDate).toLocaleDateString('en-GB'), rightColX + 25, yPos + 15);
    if (docData.docType === 'quotation' && docData.validTill) doc.text(new Date(docData.validTill).toLocaleDateString('en-GB'), rightColX + 25, yPos + 15);
    
    yPos += 30;

    // --- ITEMS TABLE ---
    const subtotal = docData.items.reduce((acc, item) => {
        const val = item.amount !== undefined ? item.amount : (item.quantity * item.rate);
        return acc + (Number(val) || 0);
    }, 0);
    let totalTax = 0;
    const isGst = docData.gstType === 'gst';

    const head = isGst ? 
      (docData.isInterstate ? 
        [['#', 'Item & Description', 'HSN', 'Taxable Value', 'IGST %', 'IGST Amt', 'Total']] : 
        [
          [{ content: '#', rowSpan: 2 }, { content: 'Item & Description', rowSpan: 2 }, { content: 'HSN', rowSpan: 2 }, { content: 'Taxable Value', rowSpan: 2 }, { content: 'CGST', colSpan: 2 }, { content: 'SGST', colSpan: 2 }, { content: 'Total', rowSpan: 2 }],
          ['%', 'Amount', '%', 'Amount']
        ])
      : [['#', 'Item & Description', 'Qty', 'Rate (₹)', 'Amount (₹)']];
      
    const body = docData.items.map((item, index) => {
        const taxableValue = Number(item.amount !== undefined ? item.amount : (item.quantity * item.rate)) || 0;
        const itemFullDescription = `${item.description}\n${item.details || ''}`.trim();

        if(isGst) {
          const tax = taxableValue * ((Number(item.gstRate) || 0) / 100);
          totalTax += tax;
          const total = taxableValue + tax;
          if(docData.isInterstate) {
            return [index + 1, itemFullDescription, item.hsn, taxableValue.toFixed(2), `${item.gstRate}%`, tax.toFixed(2), total.toFixed(2)];
          } else {
            return [index + 1, itemFullDescription, item.hsn, taxableValue.toFixed(2), `${(Number(item.gstRate) || 0)/2}%`, (tax/2).toFixed(2), `${(Number(item.gstRate) || 0)/2}%`, (tax/2).toFixed(2), total.toFixed(2)];
          }
        } else {
            return [index + 1, itemFullDescription, item.quantity, (Number(item.rate) || 0).toFixed(2), taxableValue.toFixed(2)];
        }
    });

    const grandTotal = subtotal + totalTax;

    autoTable(doc, {
        head: head,
        body: body,
        startY: yPos,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 9, cellPadding: 2, valign: 'middle' },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { cellWidth: isGst ? 60 : 80 },
        },
        didDrawPage: (data) => {
            // Footer
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text(`Page ${data.pageNumber}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
            doc.text('This is an electronically generated document, no signature is required.', margin, pageHeight - 5);
        }
    });

    yPos = (doc as any).lastAutoTable.finalY;
    
    // --- TOTALS ---
    const summaryRightX = pageWidth - margin;
    const summaryLeftX = summaryRightX - 60;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Total in words:', margin, yPos + 8);
    doc.setFont('helvetica', 'bold');
    doc.text(numberToWords(grandTotal), margin, yPos + 13, { maxWidth: contentWidth - 70 });

    doc.setFont('helvetica', 'normal');
    doc.text('Taxable Amount:', summaryLeftX, yPos + 8, { align: 'left' });
    doc.text(`₹${subtotal.toFixed(2)}`, summaryRightX, yPos + 8, { align: 'right' });

    if(isGst) {
      if (docData.isInterstate) {
        doc.text('Add: IGST:', summaryLeftX, yPos + 14, { align: 'left' });
        doc.text(`₹${totalTax.toFixed(2)}`, summaryRightX, yPos + 14, { align: 'right' });
      } else {
        doc.text('Add: CGST:', summaryLeftX, yPos + 14, { align: 'left' });
        doc.text(`₹${(totalTax / 2).toFixed(2)}`, summaryRightX, yPos + 14, { align: 'right' });
        doc.text('Add: SGST:', summaryLeftX, yPos + 20, { align: 'left' });
        doc.text(`₹${(totalTax / 2).toFixed(2)}`, summaryRightX, yPos + 20, { align: 'right' });
      }
    }

    doc.setLineWidth(0.3);
    doc.line(summaryLeftX - 2, yPos + (isGst && !docData.isInterstate ? 24 : 18) , summaryRightX, yPos + (isGst && !docData.isInterstate ? 24 : 18));
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Total Amount:', summaryLeftX, yPos + (isGst && !docData.isInterstate ? 29 : 23), { align: 'left' });
    doc.text(`₹${grandTotal.toFixed(2)}`, summaryRightX, yPos + (isGst && !docData.isInterstate ? 29 : 23), { align: 'right' });
    
    // --- BANK, TERMS, SIGNATURE ---
    const bottomY = pageHeight - margin - (pdfSettings.showSignature ? 40 : 10);
    const thirdWidth = contentWidth / 3;

    if (pdfSettings.showBankDetails) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Bank Details:', margin, bottomY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`Bank: ${profile.bankName}`, margin, bottomY + 5);
        doc.text(`A/c: ${profile.accountNumber}`, margin, bottomY + 9);
        doc.text(`Branch: ${profile.branch}`, margin, bottomY + 13);
        doc.text(`IFSC: ${profile.ifsc}`, margin, bottomY + 17);
    }
    
    if (pdfSettings.showTerms) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Terms & Conditions:', margin + thirdWidth + 5, bottomY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(docData.terms, margin + thirdWidth + 5, bottomY + 5, { maxWidth: thirdWidth - 5 });
    }
    
    if (pdfSettings.showSignature) {
        const signatureX = margin + 2 * thirdWidth + 10;
        const signatureY = bottomY;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`For ${profile.name}`, signatureX + (thirdWidth / 2), signatureY, { align: 'center' });
        if (profile.signature) {
            try {
                doc.addImage(profile.signature, 'PNG', signatureX, signatureY + 2, thirdWidth, 15, undefined, 'FAST');
            } catch (e) { console.error("Error adding signature image:", e); }
        }
        doc.line(signatureX, signatureY + 25, signatureX + thirdWidth, signatureY + 25);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('Authorised Signatory', signatureX + (thirdWidth/2), signatureY + 29, { align: 'center' });
    }

    return doc.output('datauristring');
};
