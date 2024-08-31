import { Request } from "express";
import { asyncErrorHandler } from "../middleware/error.middleware";
import { v4 as uuidv4 } from 'uuid';
import PDFDocument from 'pdfkit';
import { Invoice } from "../models/Invoice/invoice.model";

export const newInvoice = asyncErrorHandler(
    async (req: Request, res, next) => {


        const doc = new PDFDocument();
        let filename = `invoice-${generateInvoiceNumber()}.pdf`;
        filename = encodeURI(filename);

        // Set response headers
        res.setHeader('Content-disposition', `attachment; filename=${filename}`);
        res.setHeader('Content-type', 'application/pdf');

        // Pipe the PDF document to the response
        doc.pipe(res);

        try {
            // Extract invoice data from the request body
            const { customerName, customerAddress, items } = req.body;
            const invoiceNumber = generateInvoiceNumber();

            // Calculate total amount
            const totalAmount = items.reduce((acc: any, item: { totalPrice: any; }) => acc + item.totalPrice, 0);

            // Create and save invoice
            const newInvoice = new Invoice({
                invoiceNumber,
                customerName,
                customerAddress,
                items,
                totalAmount
            });

            await newInvoice.save();

            // Add content to PDF
            doc.fontSize(25).text('Invoice', { align: 'center' });
            doc.moveDown();

            doc.fontSize(16).text(`Invoice Number: ${invoiceNumber}`);
            doc.text(`Invoice Date: ${newInvoice.invoiceDate.toDateString()}`);
            doc.moveDown();

            doc.text(`Customer Name: ${customerName}`);
            doc.text(`Customer Address: ${customerAddress}`);
            doc.moveDown();

            doc.text('Items:', { underline: true });
            items.forEach((item: { name: any; description: any; quantity: any; unitPrice: number; totalPrice: number; }) => {
                doc.text(`${item.name} - ${item.description}`);
                doc.text(`Quantity: ${item.quantity}`);
                doc.text(`Unit Price: $${item.unitPrice.toFixed(2)}`);
                doc.text(`Total Price: $${item.totalPrice.toFixed(2)}`);
                doc.moveDown();
            });

            doc.fontSize(18).text(`Total Amount: $${totalAmount.toFixed(2)}`);

            // End the PDF document stream
            doc.end();
        } catch (error) {
            // Handle error and make sure the response is not already ended
            console.error('Error generating PDF:', error);
            if (!res.headersSent) {
                res.status(500).send('Server Error');
            }
            // End the PDF document if error occurs
            doc.end();
        }

        // Handle errors on PDF document stream
        doc.on('error', (err) => {
            console.error('PDF Document Error:', err);
            if (!res.headersSent) {
                res.status(500).send('PDF Generation Error');
            }
        });

        // Handle errors on response stream
        res.on('error', (err) => {
            console.error('Response Stream Error:', err);
        });

        return res.status(201).json({
            success: true,
            message: "New invoice successfully",

        });
    }
);

// Function to generate a unique invoice number
const generateInvoiceNumber = () => {
    return `INV-${uuidv4().slice(0, 8).toUpperCase()}`;
};