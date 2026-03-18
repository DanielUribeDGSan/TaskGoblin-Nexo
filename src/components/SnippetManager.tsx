import React, { useState } from 'react';
import { Search, Plus, Copy, Trash2, Edit2, Check } from 'lucide-react';
import { ask } from '@tauri-apps/plugin-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { containerVariants, itemVariants, listVariants } from '../constants/animations';
import { CommandSnippet } from '../types';

interface SnippetManagerProps {
  snippets: CommandSnippet[];
  onEdit: (snippet: CommandSnippet) => void;
  onDelete: (id: string) => void;
  onAddSnippet: () => void;
  translations: {
    title: string;
    subtitle: string;
    newSnippet: string;
    copySuccess: string;
    noSnippets: string;
    commandsLabel: string;
    editSnippet: string;
    deleteConfirm: string;
    searchPlaceholder: string;
  };
}

const SnippetManager: React.FC<SnippetManagerProps> = ({ 
  snippets, 
  onEdit, 
  onDelete, 
  onAddSnippet,
  translations 
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filteredSnippets = snippets.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.commands.some(cmd => cmd.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCopy = (command: string, id: string) => {
    navigator.clipboard.writeText(command);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <motion.div 
      className="snippet-manager"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="snippet-header-section" variants={itemVariants}>
        <div className="header-info">
          <h1>{translations.title}</h1>
          <p className="subtitle">{translations.subtitle}</p>
        </div>
      </motion.div>
      
      <motion.div className="search-bar glass-card" variants={itemVariants}>
        <Search size={20} className="search-icon" />
        <input 
          type="text" 
          placeholder={translations.searchPlaceholder} 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </motion.div>

      <motion.div className="snippets-grid" variants={listVariants}>
        <AnimatePresence mode="popLayout">
          {filteredSnippets.map((snippet) => (
            <motion.div 
              key={snippet.id}
              layout
              className="snippet-card glass-panel"
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
            >
              <div className="snippet-header">
                <h3>{snippet.title}</h3>
                <div className="snippet-actions">
                  <button onClick={() => onEdit(snippet)} className="action-icon-btn edit" title={translations.editSnippet}>
                    <Edit2 size={16} />
                  </button>
                  <button 
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const confirmed = await ask(translations.deleteConfirm, {
                        title: translations.title,
                        kind: 'warning',
                        okLabel: 'Sí',
                        cancelLabel: 'No',
                      });
                      if (confirmed) {
                        onDelete(snippet.id);
                      }
                    }} 
                    className="action-icon-btn delete" 
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="snippet-body">
                <label className="section-label">{translations.commandsLabel}</label>
                <div className="commands-list">
                  {snippet.commands.map((cmd, idx) => {
                    const uniqueId = `${snippet.id}-${idx}`;
                    return (
                      <div key={uniqueId} className="command-item">
                        <code className="command-text">{cmd}</code>
                        <button 
                          onClick={() => handleCopy(cmd, uniqueId)} 
                          className={`copy-btn ${copiedId === uniqueId ? 'success' : ''}`}
                          title="Copy to clipboard"
                        >
                          {copiedId === uniqueId ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <motion.button 
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="glass-card add-snippet-card"
          onClick={onAddSnippet}
        >
          <div className="add-content">
            <div className="add-icon-circle">
              <Plus size={32} />
            </div>
            <h3>{translations.newSnippet}</h3>
          </div>
        </motion.button>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        .snippet-manager {
          padding: 40px;
          height: 100%;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .snippet-header-section h1 {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #fff 0%, #a855f7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .subtitle {
          color: var(--text-secondary);
          opacity: 0.8;
          max-width: 600px;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          margin-bottom: 12px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
        }

        .search-icon {
          color: var(--text-secondary);
          opacity: 0.5;
        }

        .search-bar input {
          background: none;
          border: none;
          color: var(--text-primary);
          width: 100%;
          font-size: 16px;
          outline: none;
        }

        .snippets-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .snippet-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-height: 200px;
        }

        .snippet-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .snippet-header h3 {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .snippet-actions {
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
          transform: translateY(-2px);
        }

        .action-icon-btn.delete:hover {
          color: #ff4444;
          border-color: rgba(255, 68, 68, 0.3);
          background: rgba(255, 68, 68, 0.1);
        }

        .snippet-body {
          flex: 1;
        }

        .section-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          opacity: 0.6;
          margin-bottom: 8px;
          display: block;
        }

        .commands-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .command-item {
          display: flex;
          align-items: center;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          border: 1px solid var(--glass-border);
          padding-left: 12px;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .command-item:hover {
          border-color: rgba(168, 85, 247, 0.3);
          background: rgba(0, 0, 0, 0.3);
        }

        .command-text {
          flex: 1;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 13px;
          color: #a5b4fc;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .copy-btn {
          background: rgba(255, 255, 255, 0.05);
          border: none;
          border-left: 1px solid var(--glass-border);
          color: var(--text-secondary);
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .copy-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }

        .copy-btn.success {
          color: var(--status-online);
          background: rgba(0, 255, 153, 0.1);
        }

        .add-snippet-card {
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.02);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .add-snippet-card:hover {
          border-color: var(--glass-border-bright);
          background: rgba(255, 255, 255, 0.05);
        }

        .add-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: var(--text-secondary);
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
      `}} />
    </motion.div>
  );
};

export default SnippetManager;
