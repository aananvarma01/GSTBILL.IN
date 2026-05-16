
import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Document, DocumentType, GstType } from '../types';
import DocumentEditor from './DocumentEditor';
import { useSettings } from '../contexts/SettingsContext';
import { generatePdf } from '../services/pdfGenerator';
import PdfPreviewModal from './PdfPreviewModal';
import { Plus, Search, Eye, Edit3, Download, Trash2, FileText, FileSpreadsheet } from 'lucide-react';

const DocumentDashboard: React.FC = () => {
    const [documents, setDocuments] = useLocalStorage<Document[]>('documents', []);
    const [editingDocument, setEditingDocument] = useState<Partial<Document> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const { profile } = useSettings();

    const filteredDocuments = useMemo(() => {
        return documents
            .filter(doc =>
                doc.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doc.docNumber.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [documents, searchTerm]);

    const handleCreateNew = (docType: DocumentType, gstType: GstType) => {
        setEditingDocument({ docType, gstType });
    };
    
    const handleEdit = (doc: Document) => {
        setEditingDocument(doc);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this document?')) {
            setDocuments(docs => docs.filter(doc => doc.id !== id));
        }
    };
    
    const handleSaveDocument = (doc: Document) => {
        setDocuments(prevDocs => {
            const existing = prevDocs.find(d => d.id === doc.id);
            if (existing) {
                return prevDocs.map(d => d.id === doc.id ? doc : d);
            }
            return [...prevDocs, doc];
        });
        setEditingDocument(null);
    };

    const handleDownload = (doc: Document) => {
        const dataUri = generatePdf(doc, profile);
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = `${doc.docType}-${doc.docNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleView = (doc: Document) => {
        const dataUri = generatePdf(doc, profile);
        setPreviewUrl(dataUri);
    };
    
    if (editingDocument) {
        return <DocumentEditor 
            initialDoc={editingDocument}
            onSave={handleSaveDocument}
            onClose={() => setEditingDocument(null)} 
            documents={documents}
        />;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button 
                  onClick={() => handleCreateNew('invoice', 'gst')} 
                  className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-2xl hover:border-primary-500 hover:shadow-md transition-all group"
                >
                  <div className="bg-primary-50 text-primary-600 p-3 rounded-xl mb-3 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="font-semibold text-gray-900 line-clamp-1">GST Invoice</span>
                </button>

                <button 
                  onClick={() => handleCreateNew('invoice', 'non-gst')} 
                  className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-md transition-all group"
                >
                  <div className="bg-blue-50 text-blue-600 p-3 rounded-xl mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <span className="font-semibold text-gray-900 line-clamp-1">Non-GST Invoice</span>
                </button>

                <button 
                  onClick={() => handleCreateNew('quotation', 'gst')} 
                  className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-2xl hover:border-green-500 hover:shadow-md transition-all group"
                >
                  <div className="bg-green-50 text-green-600 p-3 rounded-xl mb-3 group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="font-semibold text-gray-900 line-clamp-1">GST Quotation</span>
                </button>

                <button 
                  onClick={() => handleCreateNew('quotation', 'non-gst')} 
                  className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-2xl hover:border-amber-500 hover:shadow-md transition-all group"
                >
                  <div className="bg-amber-50 text-amber-600 p-3 rounded-xl mb-3 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <span className="font-semibold text-gray-900 line-clamp-1">Non-GST Quotation</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-900">Document History</h2>
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search customer or doc #"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                        />
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-gray-500 bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Number</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredDocuments.map(doc => {
                                const subtotal = doc.items.reduce((acc, item) => {
                                    const val = item.amount !== undefined ? item.amount : (item.quantity * item.rate);
                                    return acc + (Number(val) || 0);
                                }, 0);
                                const totalTax = doc.gstType === 'gst' ? doc.items.reduce((acc, item) => {
                                    const val = item.amount !== undefined ? item.amount : (item.quantity * item.rate);
                                    return acc + ((Number(val) || 0) * (Number(item.gstRate) || 0) / 100);
                                }, 0) : 0;
                                const total = subtotal + totalTax;
                                
                                return (
                                    <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                            doc.gstType === 'gst' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-700'
                                          }`}>
                                            {doc.gstType.toUpperCase()} {doc.docType.toUpperCase()}
                                          </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{doc.docNumber}</td>
                                        <td className="px-6 py-4 text-gray-600">{doc.customer.name}</td>
                                        <td className="px-6 py-4 text-gray-600">{new Date(doc.date).toLocaleDateString('en-GB')}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                              <button onClick={() => handleView(doc)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View PDF"><Eye className="w-4 h-4" /></button>
                                              <button onClick={() => handleEdit(doc)} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Edit"><Edit3 className="w-4 h-4" /></button>
                                              <button onClick={() => handleDownload(doc)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Download"><Download className="w-4 h-4" /></button>
                                              <button onClick={() => handleDelete(doc.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    {filteredDocuments.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <FileText className="w-12 h-12 text-gray-200 mb-4" />
                        <p>No documents found matching your search.</p>
                      </div>
                    )}
                </div>
            </div>

            {previewUrl && <PdfPreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}
        </div>
    );
};

export default DocumentDashboard;
