# GST Invoice & Quotation Generator

This application allows you to generate GST and Non-GST Invoices and Quotations for Indian businesses.

## Features
- Manage Seller (Company) and Customer details.
- Support for GST and Non-GST billing.
- Dynamic items table with auto-calculations (CGST, SGST, IGST, etc.).
- Generate professional A4 PDF documents.
- Save and management document history locally.

## Local Setup Instructions

To run this project on your laptop, follow these steps:

### Prerequisites
- **Node.js**: Ensure you have Node.js installed (v18 or higher recommended). You can download it from [nodejs.org](https://nodejs.org/).

### Installation
1.  **Download/Clone the code** to a folder on your computer.
2.  **Open a Terminal** (Command Prompt, PowerShell, or Bash) in that folder.
3.  **Install dependencies** by running:
    ```bash
    npm install
    ```
    *Note: If you see warnings about "vulnerabilities" or "funding", these are normal and usually don't prevent the app from running. You can ignore them for local development.*

### Running the App
1.  **Start the development server**:
    ```bash
    npm run dev
    ```
2.  **Open your browser** and go to the URL shown in the terminal (usually `http://localhost:5173` or `http://localhost:3000`).

## Deployment
To build the app for production:
```bash
npm run build
```
The production-ready files will be in the `dist` folder.
