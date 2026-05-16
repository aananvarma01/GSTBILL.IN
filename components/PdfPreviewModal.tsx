
import React from 'react';

interface PdfPreviewModalProps {
    url: string;
    onClose: () => void;
}

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ url, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-lg shadow-xl w-full h-full flex flex-col">
                <div className="p-2 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-700">PDF Preview</h3>
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
                        aria-label="Close"
                    >
                        Close
                    </button>
                </div>
                <div className="flex-grow">
                    <iframe 
                        src={url} 
                        className="w-full h-full" 
                        title="PDF Preview"
                    />
                </div>
            </div>
        </div>
    );
};

export default PdfPreviewModal;
