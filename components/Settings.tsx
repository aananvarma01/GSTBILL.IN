
import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { CompanyProfile } from '../types';

const InputField: React.FC<{ label: string; name: keyof CompanyProfile; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string }> = ({ label, name, value, onChange, placeholder }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        <input
            type="text"
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        />
    </div>
);

const ImageUploadField: React.FC<{ label: string; name: keyof CompanyProfile; value: string; onChange: (name: keyof CompanyProfile, value: string) => void; }> = ({ label, name, value, onChange }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onChange(name, reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="mt-1 flex items-center space-x-4">
                {value && <img src={value} alt={label} className="h-16 w-auto border p-1 rounded-md" />}
                <input
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
            </div>
        </div>
    );
};

const Settings: React.FC = () => {
    const { profile, setProfile } = useSettings();
    const [localProfile, setLocalProfile] = useState<CompanyProfile>(profile);
    const [saved, setSaved] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (name: keyof CompanyProfile, value: string) => {
        setLocalProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProfile(localProfile);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Company Settings</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <h3 className="text-lg font-semibold text-gray-700 col-span-1 md:col-span-2">Company Details</h3>
                    <InputField label="Company Name" name="name" value={localProfile.name} onChange={handleChange} />
                    <InputField label="Address" name="address" value={localProfile.address} onChange={handleChange} />
                    <InputField label="City, State - Pincode" name="cityStatePincode" value={localProfile.cityStatePincode} onChange={handleChange} />
                    <InputField label="Country" name="country" value={localProfile.country} onChange={handleChange} />
                    <InputField label="GSTIN" name="gstin" value={localProfile.gstin} onChange={handleChange} />
                    <InputField label="PAN" name="pan" value={localProfile.pan} onChange={handleChange} />
                    <InputField label="Phone" name="phone" value={localProfile.phone} onChange={handleChange} />
                    <InputField label="Email" name="email" value={localProfile.email} onChange={handleChange} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                     <ImageUploadField label="Company Logo" name="logo" value={localProfile.logo} onChange={handleImageChange} />
                     <ImageUploadField label="Authorised Signature" name="signature" value={localProfile.signature} onChange={handleImageChange} />
                </div>
                
                <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold text-gray-700 col-span-1 md:col-span-2">Bank Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <InputField label="Bank Name" name="bankName" value={localProfile.bankName} onChange={handleChange} />
                      <InputField label="Branch" name="branch" value={localProfile.branch} onChange={handleChange} />
                      <InputField label="Account Number" name="accountNumber" value={localProfile.accountNumber} onChange={handleChange} />
                      <InputField label="IFSC Code" name="ifsc" value={localProfile.ifsc} onChange={handleChange} />
                    </div>
                </div>

                <div className="flex justify-end pt-6 border-t">
                    <button type="submit" className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        Save Settings
                    </button>
                    {saved && <span className="ml-4 text-green-600 self-center">Settings Saved!</span>}
                </div>
            </form>
        </div>
    );
};

export default Settings;
