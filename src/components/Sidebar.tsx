import React from 'react';
import { Folder, Activity, Settings, Plus, Share2, Globe, Code, FileText } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAddProject: () => void;
  translations: {
    projects: string;
    ports: string;
    share: string;
    hostnames: string;
    snippets: string;
    envManager: string;
    settings: string;
    addProject: string;
  };
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onAddProject, translations }) => {
  const tabs = [
    { id: 'projects', icon: Folder, label: translations.projects },
    { id: 'ports', icon: Activity, label: translations.ports },
    { id: 'share', icon: Share2, label: translations.share },
    { id: 'hostnames', icon: Globe, label: translations.hostnames },
    { id: 'snippets', icon: Code, label: translations.snippets },
    { id: 'env', icon: FileText, label: translations.envManager },
    { id: 'settings', icon: Settings, label: translations.settings },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-items">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'sidebar-item',
              activeTab === tab.id && 'active'
            )}
          >
            <tab.icon size={24} />
            <span className="sidebar-label">{tab.label}</span>
            <div className="custom-tooltip">{tab.label}</div>
          </button>
        ))}
      </div>
      
      <button className="add-button" onClick={onAddProject}>
        <Plus size={24} />
      </button>

      <style dangerouslySetInnerHTML={{ __html: `
        .sidebar {
          width: 100px;
          height: 100%;
          background: var(--sidebar-bg);
          border-right: 1px solid var(--glass-border);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 0;
          position: relative;
        }

        .hostname-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 950px) {
          .hostname-grid {
            grid-template-columns: 1fr;
          }
        }

        .sidebar-items {
          display: flex;
          flex-direction: column;
          gap: 24px;
          flex: 1;
          overflow-y: auto;
          overflow-x: visible;
          width: 100%;
          padding: 0 10px;
          scrollbar-width: none; /* Hide for Firefox */
        }

        .sidebar-items::-webkit-scrollbar {
          display: none; /* Hide for Chrome/Safari */
        }

        .sidebar-items::-webkit-scrollbar-track {
          background: transparent;
        }

        .sidebar-items::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }

        .sidebar-item {
          background: none;
          border: none;
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          padding: 12px 8px;
          border-radius: 16px;
          width: 100%;
        }

        .sidebar-item:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.05);
        }

        .sidebar-item.active {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.1);
        }

        .sidebar-item.active::after {
          content: '';
          position: absolute;
          left: 0;
          top: 25%;
          height: 50%;
          width: 4px;
          background: var(--status-online);
          border-radius: 0 4px 4px 0;
          box-shadow: 0 0 10px var(--status-online);
        }

        .sidebar-item:hover .custom-tooltip {
          visibility: visible;
          opacity: 1;
          transform: translateX(-50%) translateY(-10px) scale(1);
        }

        .custom-tooltip {
          visibility: hidden;
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(0) scale(0.8);
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          color: white;
          padding: 8px 12px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          width: 120px;
          white-space: normal;
          text-align: center;
          line-height: 1.3;
          z-index: 1000;
          opacity: 0;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4), 0 0 15px rgba(168, 85, 247, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          pointer-events: none;
        }

        .custom-tooltip::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: #a855f7 transparent transparent transparent;
        }

        .sidebar-label {
          font-size: 10px;
          font-weight: 500;
          opacity: 0.8;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }

        .add-button {
          width: 52px;
          height: 52px;
          min-height: 52px;
          border-radius: 26px;
          background: var(--card-bg);
          border: 1px solid var(--glass-border);
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 24px;
          flex-shrink: 0;
        }

        .add-button:hover {
          background: var(--card-bg-hover);
          transform: scale(1.1) rotate(90deg);
          border-color: var(--glass-border-bright);
        }
      `}} />
    </div>
  );
};

export default Sidebar;
