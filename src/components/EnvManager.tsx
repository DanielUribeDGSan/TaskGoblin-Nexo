import React, { useState } from 'react';
import { Plus, Trash2, Copy, Download, Check, FileCode, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import { EnvProfile } from '../types';

interface EnvManagerProps {
  profiles: EnvProfile[];
  onEdit: (profile: EnvProfile) => void;
  onDelete: (id: string) => void;
  onAddEnv: () => void;
  translations: {
    title: string;
    subtitle: string;
    newEnv: string;
    download: string;
    copy: string;
    saveSuccess: string;
    saveError: string;
    copySuccess: string;
    deleteConfirm: string;
  };
}

const EnvManager: React.FC<EnvManagerProps> = ({ 
  profiles, 
  onEdit, 
  onDelete, 
  onAddEnv,
  translations 
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const generateEnvContent = (profile: EnvProfile) => {
    return profile.variables
      .filter(v => v.key.trim() !== '')
      .map(v => `${v.key}=${v.value}`)
      .join('\n');
  };

  const handleCopy = (profile: EnvProfile) => {
    const content = generateEnvContent(profile);
    navigator.clipboard.writeText(content);
    setCopiedId(profile.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = async (profile: EnvProfile) => {
    setSavingId(profile.id);
    try {
      const content = generateEnvContent(profile);
      const fileName = `${profile.title.toLowerCase().replace(/\s+/g, '_')}.env`;
      
      await writeTextFile(fileName, content, { baseDir: BaseDirectory.Download });
      
      alert(translations.saveSuccess);
    } catch (error) {
      console.error('Error saving .env file:', error);
      alert(translations.saveError);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="env-manager-view">
      <header className="page-header">
        <div className="header-content">
          <h1>{translations.title}</h1>
          <p className="subtitle">{translations.subtitle}</p>
        </div>
      </header>

      <div className="envs-grid">
        <AnimatePresence mode="popLayout">
          {profiles.map((profile) => (
            <motion.div 
              key={profile.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card env-profile-card"
            >
              <div className="profile-header">
                <div className="title-section">
                  <FileCode size={18} className="icon-v" />
                  <h3>{profile.title}</h3>
                </div>
                <div className="profile-actions">
                  <button onClick={() => onEdit(profile)} className="action-icon-btn edit">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => onDelete(profile.id)} className="action-icon-btn delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="profile-body">
                <div className="var-count">
                  {profile.variables.length} variables defined
                </div>
                <div className="preview-mini">
                  {profile.variables.slice(0, 3).map(v => (
                    <div key={v.id} className="preview-row">
                      <span className="k">{v.key}</span>
                      <span className="v">= {v.value}</span>
                    </div>
                  ))}
                  {profile.variables.length > 3 && <div className="more">...</div>}
                </div>
              </div>

              <div className="profile-footer">
                <button onClick={() => handleCopy(profile)} className="glass-button glass-button-secondary py-2 flex-1">
                  {copiedId === profile.id ? <Check size={16} /> : <Copy size={16} />}
                  <span>{translations.copy}</span>
                </button>
                <button 
                  onClick={() => handleDownload(profile)} 
                  className="glass-button glass-button-primary py-2 flex-1"
                  disabled={savingId === profile.id}
                >
                  <Download size={16} />
                  <span>{translations.download}</span>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="glass-card add-env-card"
          onClick={onAddEnv}
        >
          <div className="add-content">
            <div className="add-icon-circle">
              <Plus size={32} />
            </div>
            <div className="add-text">
              <h3>{translations.newEnv}</h3>
            </div>
          </div>
        </motion.button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .env-manager-view {
          padding: 40px;
          height: 100%;
          overflow-y: auto;
          animation: fadeIn 0.5s ease-out;
        }

        .envs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .env-profile-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-height: 240px;
        }

        .profile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .title-section {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .title-section h3 {
          font-size: 18px;
          font-weight: 600;
        }

        .icon-v {
          color: #a855f7;
        }

        .profile-actions {
          display: flex;
          gap: 8px;
        }

        .action-icon-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          color: var(--text-secondary);
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-icon-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.1);
        }

        .action-icon-btn.delete:hover {
          color: #ff4444;
          border-color: rgba(255, 68, 68, 0.3);
        }

        .profile-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .var-count {
          font-size: 12px;
          color: var(--text-secondary);
          opacity: 0.6;
        }

        .preview-mini {
          background: rgba(0, 0, 0, 0.2);
          padding: 12px;
          border-radius: 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .preview-row {
          display: flex;
          gap: 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .preview-row .k { color: #818cf8; font-weight: 600; }
        .preview-row .v { color: var(--text-secondary); opacity: 0.8; }
        .more { color: var(--text-secondary); opacity: 0.5; font-size: 10px; }

        .profile-footer {
          display: flex;
          gap: 10px;
        }

        .profile-footer .glass-button span {
          font-size: 12px;
        }

        .add-env-card {
          min-height: 240px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.02);
          cursor: pointer;
          border-style: dashed;
        }

        .add-env-card:hover {
          border-style: solid;
          background: rgba(255, 255, 255, 0.05);
        }

        .add-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .add-icon-circle {
          width: 64px;
          height: 64px;
          border-radius: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
};

export default EnvManager;
