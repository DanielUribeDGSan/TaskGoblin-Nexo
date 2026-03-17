import React from 'react';
import { Play, Settings, Command, Globe, FolderCode, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';


export interface SubProject {
  id: string;
  name: string;
  path: string;
  command: string;
  editor: string;
  useIntegratedTerminal?: boolean;
  autoOpenBrowser?: boolean;
  url?: string;
}

export interface Project {
  id: string;
  name: string;
  path: string;
  editor: string;
  framework: string;
  status: 'Online' | 'Stopped' | 'Building' | 'Launching';
  commands: string[];
  urls: string[];
  subProjects?: SubProject[];
  useIntegratedTerminal?: boolean;
  autoOpenBrowser?: boolean;
  url?: string;
}

interface ProjectCardProps {
  project: Project;
  onLaunch: (project: Project) => void;
  onOpenSettings: (project: Project) => void;
  translations: {
    online: string;
    stopped: string;
    building: string;
    launching: string;
  };
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onLaunch, onOpenSettings, translations }) => {
  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'Online': return 'var(--status-online)';
      case 'Building': return 'var(--status-building)';
      case 'Launching': return 'var(--status-launching)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusTranslation = (status: Project['status']) => {
    switch (status) {
      case 'Online': return translations.online;
      case 'Building': return translations.building;
      case 'Launching': return translations.launching;
      default: return translations.stopped;
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="glass-card project-card group"
    >
      <div className="card-header">
        <div className="status-badge">
          <span 
            className="status-dot" 
            style={{ 
              backgroundColor: getStatusColor(project.status),
              boxShadow: project.status !== 'Stopped' ? `0 0 10px ${getStatusColor(project.status)}` : 'none'
            }} 
          />
          <span className="status-text">{getStatusTranslation(project.status)}</span>
        </div>
        <button 
          className="settings-btn"
          onClick={(e) => {
            e.stopPropagation();
            onOpenSettings(project);
          }}
        >
          <Settings size={18} />
        </button>
      </div>

      <div className="card-body">
        <div className="project-info">
          <h3 className="project-name">{project.name}</h3>
          <div className="project-meta">
            <span className="meta-item">
              <FolderCode size={14} />
              {project.framework}
            </span>
            <span className="meta-item">
              <Command size={14} />
              {project.editor.charAt(0).toUpperCase() + project.editor.slice(1)}
            </span>
            {project.useIntegratedTerminal && (
              <span className="meta-item text-blue-400">
                <Terminal size={14} />
                IDE Terminal
              </span>
            )}
          </div>
        </div>

        <div className="project-actions">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="launch-btn"
            onClick={() => onLaunch(project)}
          >
            <Play size={20} fill="currentColor" />
          </motion.button>
        </div>
      </div>

      {project.subProjects && project.subProjects.length > 0 && (
        <div className="card-footer">
          <div className="sub-projects-count">
            <Globe size={14} />
            <span>{project.subProjects.length} sub-proyectos</span>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .project-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-height: 200px;
          cursor: default;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 20px;
          border: 1px solid var(--glass-border);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-text {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .settings-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          opacity: 0;
          transform: rotate(-20deg);
          transition: all 0.3s ease;
        }

        .project-card:hover .settings-btn {
          opacity: 1;
          transform: rotate(0deg);
        }

        .settings-btn:hover {
          color: var(--text-primary);
        }

        .card-body {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          flex: 1;
        }

        .project-name {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .project-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-secondary);
          opacity: 0.8;
        }

        .launch-btn {
          width: 48px;
          height: 48px;
          border-radius: 24px;
          background: var(--status-online);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(0, 255, 153, 0.3);
          transition: transform 0.2s ease;
        }

        .launch-btn:hover {
          transform: scale(1.05);
        }

        .card-footer {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--glass-border);
        }

        .sub-projects-count {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-secondary);
          opacity: 0.6;
        }
      `}} />
    </motion.div>
  );
};

export default ProjectCard;
