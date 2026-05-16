
export interface CompanyProfile {
    name: string;
    address: string;
    cityStatePincode: string;
    country: string;
    gstin: string;
    pan: string;
    phone: string;
    email: string;
    logo: string; // base64 string
    signature: string; // base64 string
    bankName: string;
    branch: string;
    accountNumber: string;
    ifsc: string;
}

export interface Customer {
    id: string;
    name: string;
    address: string;
    cityStatePincode: string;
    country: string;
    gstin: string;
}

export interface LineItem {
    id: string;
    description: string;
    details?: string;
    hsn: string;
    quantity: number;
    rate: number;
    gstRate: number; // as a percentage, e.g., 18 for 18%
    amount: number; // Taxable value (quantity * rate but can be manually overridden)
}

export type DocumentType = 'invoice' | 'quotation';
export type GstType = 'gst' | 'non-gst';

export interface PdfVisibility {
    showLogo: boolean;
    showBankDetails: boolean;
    showSignature: boolean;
    showTerms: boolean;
}

export interface Document {
    id: string;
    docNumber: string;
    docType: DocumentType;
    gstType: GstType;
    date: string; // YYYY-MM-DD
    dueDate?: string; // For invoices
    validTill?: string; // For quotations
    customer: Customer;
    items: LineItem[];
    terms: string;
    notes: string;
    isInterstate: boolean;
    pdfSettings: PdfVisibility;
}
