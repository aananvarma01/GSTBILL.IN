
import { CompanyProfile, Customer } from './types';

export const GST_RATES = [0, 5, 12, 18, 28];

export const DEFAULT_TERMS = `1. Subject to our home Jurisdiction.
2. Our Responsibility Ceases as soon as goods leaves our Premises.
3. Goods once sold will not taken back.
4. Delivery Ex-Premises.`;

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
    name: "Your Company Name",
    address: "123 Business Avenue",
    cityStatePincode: "City, State - 123456",
    country: "India",
    gstin: "YOUR_GSTIN",
    pan: "YOUR_PAN",
    phone: "9876543210",
    email: "contact@yourcompany.com",
    logo: "",
    signature: "",
    bankName: "Your Bank Name",
    branch: "Your Branch",
    accountNumber: "1234567890",
    ifsc: "YOURIFSC001",
};

export const BLANK_CUSTOMER: Customer = {
    id: '',
    name: '',
    address: '',
    cityStatePincode: '',
    country: 'India',
    gstin: ''
};
