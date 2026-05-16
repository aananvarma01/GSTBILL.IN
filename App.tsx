
import React, { useState } from 'react';
import { SettingsProvider } from './contexts/SettingsContext';
import Settings from './components/Settings';
import DocumentDashboard from './components/DocumentDashboard';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FileText, LayoutDashboard, Settings as SettingsIcon } from 'lucide-react';

type View = 'dashboard' | 'settings';

const App: React.FC = () => {
    const [view, setView] = useState<View>('dashboard');

    const renderView = () => {
        switch (view) {
            case 'settings':
                return <Settings />;
            case 'dashboard':
            default:
                return <DocumentDashboard />;
        }
    };

    return (
        <SettingsProvider>
            <DndProvider backend={HTML5Backend}>
                <div className="min-h-screen bg-gray-50 text-gray-800">
                    <header className="bg-white border-b border-gray-200">
                        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex items-center justify-between h-16">
                                <div className="flex items-center gap-2">
                                    <div className="bg-primary-600 p-1.5 rounded-lg">
                                        <FileText className="h-6 w-6 text-white" />
                                    </div>
                                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">InvoicePro</h1>
                                </div>
                                <div className="flex items-center bg-gray-100/50 p-1 rounded-xl border border-gray-200">
                                    <button
                                        onClick={() => setView('dashboard')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'dashboard' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <LayoutDashboard className="w-4 h-4" />
                                        Dashboard
                                    </button>
                                    <button
                                        onClick={() => setView('settings')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'settings' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <SettingsIcon className="w-4 h-4" />
                                        Settings
                                    </button>
                                </div>
                            </div>
                        </nav>
                    </header>
                    <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                        {renderView()}
                    </main>
                </div>
            </DndProvider>
        </SettingsProvider>
    );
};

export default App;
