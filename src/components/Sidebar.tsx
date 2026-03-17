import React, { useState } from 'react';
import { Folder, Activity, Settings, Plus, Share2, Globe, Code, FileText, Menu, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
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
  const [isExpanded, setIsExpanded] = useState(false);

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
    <motion.div 
      className={cn("sidebar", isExpanded && "expanded")}
      animate={{ width: isExpanded ? 220 : 80 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <button 
        className="toggle-sidebar-btn" 
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? "Collapse" : "Expand"}
      >
        {isExpanded ? <ChevronLeft size={20} /> : <Menu size={20} />}
      </button>

      <div className="sidebar-items">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'sidebar-item',
              activeTab === tab.id && 'active',
              isExpanded && 'item-expanded'
            )}
          >
            <div className="item-icon-wrapper">
              <tab.icon size={22} />
            </div>
            {isExpanded && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="sidebar-label"
              >
                {tab.label}
              </motion.span>
            )}
          </button>
        ))}
      </div>
      
      <button className="add-button" onClick={onAddProject}>
        <Plus size={24} />
      </button>

      <style dangerouslySetInnerHTML={{ __html: `
        .sidebar {
          width: 80px;
          height: 100%;
          background: var(--sidebar-bg);
          border-right: 1px solid var(--glass-border);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 0 40px 0;
          position: relative;
          z-index: 50;
          flex-shrink: 0;
        }

        .sidebar.expanded {
          align-items: flex-start;
          padding-left: 16px;
          padding-right: 16px;
        }

        .toggle-sidebar-btn {
          width: 100%;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          background: none;
          border: none;
          cursor: pointer;
          margin-bottom: 12px;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .expanded .toggle-sidebar-btn {
          justify-content: flex-start;
          padding: 0 16px;
          margin-left: 0;
        }

        .toggle-sidebar-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
          border-color: var(--glass-border-bright);
        }

        .sidebar-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          width: 100%;
          padding: 0;
        }

        .expanded .sidebar-items {
          padding: 0;
        }

        .sidebar-items::-webkit-scrollbar {
          width: 4px;
        }

        .sidebar-items::-webkit-scrollbar-track {
          background: transparent;
        }

        .sidebar-items::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        .sidebar-items:hover::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
        }

        .sidebar-item {
          background: none;
          border: none;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          padding: 12px;
          border-radius: 14px;
          width: 100%;
        }

        .item-icon-wrapper {
          width: 100%;
          display: flex;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .sidebar-item.item-expanded {
          justify-content: flex-start;
          padding: 12px 16px;
        }

        .sidebar-item.item-expanded .item-icon-wrapper {
          width: auto;
        }

        .sidebar-item:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.05);
        }

        .sidebar-item.active {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.1);
          box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.02);
        }

        .sidebar-item.active::after {
          content: '';
          position: absolute;
          left: 0;
          top: 20%;
          height: 60%;
          width: 3px;
          background: var(--status-online);
          border-radius: 0 4px 4px 0;
          box-shadow: 0 0 12px var(--status-online);
        }

        .sidebar-label {
          font-size: 13px;
          font-weight: 600;
          text-align: left;
          white-space: normal;
          line-height: 1.4;
          flex: 1;
          letter-spacing: 0.3px;
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
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .expanded .add-button {
          margin-left: 4px;
        }

        .add-button:hover {
          background: var(--card-bg-hover);
          transform: scale(1.05) rotate(90deg);
          border-color: var(--glass-border-bright);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }
      `}} />
    </motion.div>
  );
};

export default Sidebar;
