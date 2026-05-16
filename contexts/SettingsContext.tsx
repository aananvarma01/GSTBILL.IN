
import React, { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { CompanyProfile } from '../types';
import { DEFAULT_COMPANY_PROFILE } from '../constants';

interface SettingsContextType {
    profile: CompanyProfile;
    setProfile: React.Dispatch<React.SetStateAction<CompanyProfile>>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [profile, setProfile] = useLocalStorage<CompanyProfile>('company-profile', DEFAULT_COMPANY_PROFILE);

    return (
        <SettingsContext.Provider value={{ profile, setProfile }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
