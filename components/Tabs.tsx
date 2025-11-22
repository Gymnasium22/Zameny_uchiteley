import React from 'react';

interface TabProps {
  activeTab: string;
  onChange: (tab: string) => void;
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
}

export const Tabs: React.FC<TabProps> = ({ activeTab, onChange, tabs }) => {
  return (
    <div className="flex border-b border-gray-200 bg-white">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors duration-200
            ${activeTab === tab.id
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
};
