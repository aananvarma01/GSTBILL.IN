
import React, { useState, useEffect, useMemo } from 'react';
import { Document, Customer, LineItem, DocumentType, GstType } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { BLANK_CUSTOMER, GST_RATES, DEFAULT_TERMS } from '../constants';
import { useSettings } from '../contexts/SettingsContext';
import { numberToWords } from '../services/numberToWords';
import { generatePdf } from '../services/pdfGenerator';
import { v4 as uuidv4 } from 'uuid'; // Need to add @types/uuid for types if not present
import PdfPreviewModal from './PdfPreviewModal';


const DocumentEditor: React.FC<{
    initialDoc: Partial<Document>;
    onSave: (doc: Document) => void;
    onClose: () => void;
    documents: Document[];
}> = ({ initialDoc, onSave, onClose, documents }) => {
    const { profile } = useSettings();
    const [doc, setDoc] = useState<Document>(() => createInitialDocumentState());
    const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', []);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [newCustomer, setNewCustomer] = useState<Customer>(BLANK_CUSTOMER);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    
    function createInitialDocumentState(): Document {
        const nextDocNumber = getNextDocNumber(initialDoc.docType!, initialDoc.gstType!);
        const today = new Date().toISOString().split('T')[0];
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        const validTill = new Date();
        validTill.setDate(validTill.getDate() + 15);

        return {
            id: initialDoc.id || uuidv4(),
            docNumber: initialDoc.docNumber || nextDocNumber,
            docType: initialDoc.docType!,
            gstType: initialDoc.gstType!,
            date: initialDoc.date || today,
            dueDate: initialDoc.dueDate || (initialDoc.docType === 'invoice' ? dueDate.toISOString().split('T')[0] : undefined),
            validTill: initialDoc.validTill || (initialDoc.docType === 'quotation' ? validTill.toISOString().split('T')[0] : undefined),
            customer: initialDoc.customer || BLANK_CUSTOMER,
            items: (initialDoc.items || [{ id: uuidv4(), description: '', details: '', hsn: '', quantity: 1, rate: 0, gstRate: 18, amount: 0 }]).map(item => ({
                ...item,
                amount: item.amount !== undefined ? item.amount : (item.quantity * item.rate)
            })),
            terms: initialDoc.terms || DEFAULT_TERMS,
            notes: initialDoc.notes || '',
            isInterstate: initialDoc.isInterstate || false,
            pdfSettings: initialDoc.pdfSettings || {
                showLogo: true,
                showBankDetails: true,
                showSignature: true,
                showTerms: true,
            },
        };
    }

    function getNextDocNumber(docType: DocumentType, gstType: GstType): string {
        const prefix = `${docType.slice(0, 3).toUpperCase()}/${gstType.slice(0, 3).toUpperCase()}/`;
        const relevantDocs = documents.filter(d => d.docType === docType && d.gstType === gstType);
        if (relevantDocs.length === 0) return `${prefix}001`;
        
        const maxNum = Math.max(...relevantDocs.map(d => parseInt(d.docNumber.split('/').pop() || '0', 10)));
        return `${prefix}${(maxNum + 1).toString().padStart(3, '0')}`;
    }

    useEffect(() => {
        if (profile.cityStatePincode && doc.customer.cityStatePincode) {
            const sellerState = profile.cityStatePincode.split(',')[1]?.trim().toLowerCase();
            const customerState = doc.customer.cityStatePincode.split(',')[1]?.trim().toLowerCase();
            setDoc(d => ({ ...d, isInterstate: sellerState !== customerState }));
        }
    }, [profile.cityStatePincode, doc.customer.cityStatePincode]);

    const handleDocChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDoc(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (id: string, field: keyof LineItem, value: any) => {
        setDoc(prev => ({
            ...prev,
            items: prev.items.map(item => {
                if (item.id !== id) return item;
                
                let newItem = { ...item, [field]: value };
                
                // Synchronize calculations
                if (field === 'quantity' || field === 'rate') {
                    newItem.amount = newItem.quantity * newItem.rate;
                } else if (field === 'amount') {
                    if (newItem.quantity !== 0) {
                        newItem.rate = newItem.amount / newItem.quantity;
                    }
                }
                
                return newItem;
            })
        }));
    };
    
    const addItem = () => {
        setDoc(prev => ({
            ...prev,
            items: [...prev.items, { id: uuidv4(), description: '', details: '', hsn: '', quantity: 1, rate: 0, gstRate: 18, amount: 0 }]
        }));
    };

    const removeItem = (id: string) => {
        setDoc(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
    };

    const handleSelectCustomer = (customerId: string) => {
        const selected = customers.find(c => c.id === customerId);
        if (selected) {
            setDoc(prev => ({ ...prev, customer: selected }));
        } else {
            setDoc(prev => ({ ...prev, customer: BLANK_CUSTOMER }));
        }
    };
    
    const handleSaveCustomer = () => {
        if(newCustomer.name) {
            const customerToSave = { ...newCustomer, id: newCustomer.id || uuidv4() };
            setCustomers(prev => {
                const existing = prev.find(c => c.id === customerToSave.id);
                if (existing) {
                    return prev.map(c => c.id === customerToSave.id ? customerToSave : c);
                }
                return [...prev, customerToSave];
            });
            setDoc(prev => ({ ...prev, customer: customerToSave}));
            setShowCustomerModal(false);
            setNewCustomer(BLANK_CUSTOMER);
        }
    };

    const handlePdfSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setDoc(prev => ({
            ...prev,
            pdfSettings: {
                ...prev.pdfSettings,
                [name]: checked,
            }
        }));
    };

    const handleDownload = () => {
        const dataUri = generatePdf(doc, profile);
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = `${doc.docType}-${doc.docNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePreview = () => {
        const dataUri = generatePdf(doc, profile);
        setPreviewUrl(dataUri);
    };
    
    const subtotal = useMemo(() => doc.items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0), [doc.items]);
    const totalTax = useMemo(() => doc.gstType === 'gst' ? doc.items.reduce((acc, item) => acc + ((Number(item.amount) || 0) * (Number(item.gstRate) || 0) / 100), 0) : 0, [doc.items, doc.gstType]);
    const grandTotal = subtotal + totalTax;

    const docTitle = `${doc.gstType.toUpperCase()} ${doc.docType.charAt(0).toUpperCase() + doc.docType.slice(1)}`;

    return (
      <>
        <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
                {initialDoc.id ? 'Edit' : 'Create'} {docTitle}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times; Close</button>
            </div>

            {/* Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Customer</label>
                    <select 
                        value={doc.customer.id} 
                        onChange={(e) => handleSelectCustomer(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    >
                        <option value="">Select a customer</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button onClick={() => { setNewCustomer(doc.customer || BLANK_CUSTOMER); setShowCustomerModal(true); }} className="text-sm text-primary-600 hover:underline mt-1">
                    {doc.customer.id ? 'Edit Customer' : '+ Add New Customer'}
                    </button>
                    {doc.customer.name && <div className="mt-2 text-sm text-gray-600">
                        <p>{doc.customer.address}</p>
                        <p>{doc.customer.cityStatePincode}</p>
                        {doc.customer.gstin && <p>GSTIN: {doc.customer.gstin}</p>}
                    </div>}
                </div>
                <div></div>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="font-bold">Doc #:</span><input type="text" name="docNumber" value={doc.docNumber} onChange={handleDocChange} className="border-b text-right"/></div>
                    <div className="flex justify-between"><span className="font-bold">Date:</span><input type="date" name="date" value={doc.date} onChange={handleDocChange} className="border-b text-right"/></div>
                    {doc.docType === 'invoice' && <div className="flex justify-between"><span className="font-bold">Due Date:</span><input type="date" name="dueDate" value={doc.dueDate} onChange={handleDocChange} className="border-b text-right"/></div>}
                    {doc.docType === 'quotation' && <div className="flex justify-between"><span className="font-bold">Valid Till:</span><input type="date" name="validTill" value={doc.validTill} onChange={handleDocChange} className="border-b text-right"/></div>}
                </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">Item Description</th>
                            {doc.gstType === 'gst' && <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN/SAC</th>}
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                            {doc.gstType === 'gst' && <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST</th>}
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {doc.items.map((item) => (
                            <tr key={item.id}>
                                <td className="pr-2 py-2 align-top">
                                    <input type="text" placeholder="Item/Service" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className="w-full p-1 border-b"/>
                                    <textarea placeholder="Additional details..." value={item.details || ''} onChange={e => handleItemChange(item.id, 'details', e.target.value)} className="w-full p-1 mt-1 text-xs text-gray-600 border-b" rows={2}></textarea>
                                </td>
                                {doc.gstType === 'gst' && <td className="px-2 py-2 align-top"><input type="text" value={item.hsn} onChange={e => handleItemChange(item.id, 'hsn', e.target.value)} className="w-full p-1 border-b"/></td>}
                                <td className="px-2 py-2 align-top"><input type="number" value={item.quantity === 0 ? '' : item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-20 p-1 border-b" onFocus={e => e.target.select()}/></td>
                                <td className="px-2 py-2 align-top"><input type="number" value={item.rate === 0 ? '' : item.rate} onChange={e => handleItemChange(item.id, 'rate', parseFloat(e.target.value) || 0)} className="w-24 p-1 border-b" onFocus={e => e.target.select()}/></td>
                                {doc.gstType === 'gst' && <td className="px-2 py-2 align-top">
                                    <select value={item.gstRate} onChange={e => handleItemChange(item.id, 'gstRate', parseInt(e.target.value) || 0)} className="w-full p-1 border-b bg-white">
                                        {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                                    </select>
                                </td>}
                                <td className="px-2 py-2 align-top">
                                    <input 
                                        type="number" 
                                        value={item.amount === 0 ? '' : item.amount.toFixed(2)} 
                                        onChange={e => handleItemChange(item.id, 'amount', parseFloat(e.target.value) || 0)} 
                                        className="w-full p-1 border-b text-right"
                                        onFocus={e => e.target.select()}
                                    />
                                </td>
                                <td className="pl-2 py-2 align-top"><button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 p-1">&times;</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button onClick={addItem} className="mt-2 text-sm text-primary-600 hover:underline">+ Add Item</button>
            </div>
            
            {/* Totals & Footer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Terms & Conditions</label>
                    <textarea name="terms" value={doc.terms} onChange={handleDocChange} rows={4} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm"></textarea>
                </div>
                <div className="text-right space-y-2">
                    <div className="flex justify-between"><span className="font-semibold">Subtotal:</span><span>₹{subtotal.toFixed(2)}</span></div>
                    {doc.gstType === 'gst' && (
                        doc.isInterstate ? 
                        <div className="flex justify-between"><span className="font-semibold">IGST:</span><span>₹{totalTax.toFixed(2)}</span></div>
                        : <>
                            <div className="flex justify-between"><span className="font-semibold">CGST:</span><span>₹{(totalTax/2).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="font-semibold">SGST:</span><span>₹{(totalTax/2).toFixed(2)}</span></div>
                        </>
                    )}
                    <div className="flex justify-between text-xl font-bold border-t pt-2"><span className="">Grand Total:</span><span>₹{grandTotal.toFixed(2)}</span></div>
                    <p className="text-xs text-gray-500">{numberToWords(grandTotal)}</p>
                </div>
            </div>
            
            {/* PDF Settings */}
            <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Customize PDF Output</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" name="showLogo" checked={doc.pdfSettings.showLogo} onChange={handlePdfSettingsChange} className="rounded text-primary-600 focus:ring-primary-500" />
                        <span className="text-sm text-gray-700">Show Logo</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" name="showBankDetails" checked={doc.pdfSettings.showBankDetails} onChange={handlePdfSettingsChange} className="rounded text-primary-600 focus:ring-primary-500" />
                        <span className="text-sm text-gray-700">Show Bank Details</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" name="showSignature" checked={doc.pdfSettings.showSignature} onChange={handlePdfSettingsChange} className="rounded text-primary-600 focus:ring-primary-500" />
                        <span className="text-sm text-gray-700">Show Signature</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" name="showTerms" checked={doc.pdfSettings.showTerms} onChange={handlePdfSettingsChange} className="rounded text-primary-600 focus:ring-primary-500" />
                        <span className="text-sm text-gray-700">Show Terms</span>
                    </label>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 mt-8 border-t pt-6">
                <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md shadow-sm hover:bg-gray-300">Cancel</button>
                <button onClick={handlePreview} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700">Preview</button>
                <button onClick={handleDownload} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700">Download PDF</button>
                <button onClick={() => onSave(doc)} className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-md shadow-sm hover:bg-primary-700">Save Document</button>
            </div>

            {/* Customer Modal */}
            {showCustomerModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">{newCustomer.id ? 'Edit' : 'Add'} Customer</h3>
                        <div className="space-y-4">
                            <input type="text" placeholder="Name" value={newCustomer.name} onChange={e => setNewCustomer(c => ({...c, name: e.target.value}))} className="w-full p-2 border rounded"/>
                            <input type="text" placeholder="Address" value={newCustomer.address} onChange={e => setNewCustomer(c => ({...c, address: e.target.value}))} className="w-full p-2 border rounded"/>
                            <input type="text" placeholder="City, State - Pincode" value={newCustomer.cityStatePincode} onChange={e => setNewCustomer(c => ({...c, cityStatePincode: e.target.value}))} className="w-full p-2 border rounded"/>
                            <input type="text" placeholder="GSTIN (Optional)" value={newCustomer.gstin} onChange={e => setNewCustomer(c => ({...c, gstin: e.target.value}))} className="w-full p-2 border rounded"/>
                        </div>
                        <div className="flex justify-end space-x-2 mt-6">
                            <button onClick={() => setShowCustomerModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                            <button onClick={handleSaveCustomer} className="px-4 py-2 bg-primary-600 text-white rounded">Save Customer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        {previewUrl && <PdfPreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}
      </>
    );
};

export default DocumentEditor;
