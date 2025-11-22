import React, { useState, useEffect } from 'react';
import { CalendarDays, Users, RefreshCw, Download, School } from 'lucide-react';
import { Tabs } from './components/Tabs';
import { ScheduleView } from './views/ScheduleView';
import { DirectoryView } from './views/DirectoryView';
import { SubstitutionView } from './views/SubstitutionView';
import { ExportView } from './views/ExportView';
import * as storage from './services/storage';
import { AppData } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [data, setData] = useState<AppData>(storage.loadData());

  useEffect(() => {
    // Initial load is handled by useState initializer, but we could sync here if needed
  }, []);

  const tabs = [
    { id: 'schedule', label: 'Расписание', icon: <CalendarDays size={18} /> },
    { id: 'substitutions', label: 'Замены', icon: <RefreshCw size={18} /> },
    { id: 'directory', label: 'Справочники', icon: <Users size={18} /> },
    { id: 'export', label: 'Экспорт', icon: <Download size={18} /> },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-100 text-slate-900">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3 shadow-sm z-10">
        <div className="bg-blue-600 p-2 rounded-lg text-white">
          <School size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">Гимназия</h1>
          <p className="text-xs text-gray-500">Система управления заменами</p>
        </div>
      </header>

      <Tabs activeTab={activeTab} onChange={setActiveTab} tabs={tabs} />

      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'schedule' && <ScheduleView data={data} setData={setData} />}
        {activeTab === 'substitutions' && <SubstitutionView data={data} setData={setData} />}
        {activeTab === 'directory' && <DirectoryView data={data} setData={setData} />}
        {activeTab === 'export' && <ExportView data={data} />}
      </main>
    </div>
  );
};

export default App;
