import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CommandSnippet } from '../types';

interface NewSnippetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (snippet: CommandSnippet) => void;
  initialData?: CommandSnippet | null;
  translations: {
    newSnippet: string;
    editSnippet: string;
    snippetTitle: string;
    commandsLabel: string;
    addCommand: string;
    addSnippetBtn: string;
  };
}

interface LocalCommand {
  id: string;
  value: string;
}

const NewSnippetModal: React.FC<NewSnippetModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData, 
  translations 
}) => {
  const [title, setTitle] = useState('');
  const [commands, setCommands] = useState<LocalCommand[]>([{ id: 'init', value: '' }]);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setCommands(initialData.commands.map((c, i) => ({ id: `cmd-${i}`, value: c })));
    } else {
      setTitle('');
      setCommands([{ id: 'init', value: '' }]);
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const snippet: CommandSnippet = {
      id: initialData?.id || Date.now().toString(),
      title: title.trim(),
      commands: commands.map(c => c.value).filter(val => val.trim() !== ''),
    };
    onSave(snippet);
    onClose();
  };

  const addCommand = () => {
    setCommands([...commands, { id: Math.random().toString(36).slice(2, 11), value: '' }]);
  };

  const removeCommand = (id: string) => {
    setCommands(commands.filter(c => c.id !== id));
  };

  const updateCommand = (id: string, value: string) => {
    setCommands(commands.map(c => c.id === id ? { ...c, value } : c));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass-panel modal-content"
          >
            <div className="modal-header">
              <h2>{initialData ? translations.editSnippet : translations.newSnippet}</h2>
              <button className="close-btn" onClick={onClose}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="snippet-title">{translations.snippetTitle}</label>
                <input
                  id="snippet-title"
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. React Development"
                  className="glass-input"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>{translations.commandsLabel}</label>
                <div className="commands-list-scroll">
                  {commands.map((cmd) => (
                    <div key={cmd.id} className="list-input-item">
                      <input
                        type="text"
                        value={cmd.value}
                        onChange={e => updateCommand(cmd.id, e.target.value)}
                        placeholder="npm run dev"
                        className="glass-input"
                      />
                      <button 
                        type="button" 
                        onClick={() => removeCommand(cmd.id)} 
                        className="remove-btn"
                        disabled={commands.length === 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addCommand} className="add-list-btn">
                  <Plus size={14} /> {translations.addCommand}
                </button>
              </div>

              <button 
                type="submit" 
                className="glass-button glass-button-primary w-full h-12 mt-6" 
                disabled={!title.trim() || commands.every(c => !c.value.trim())}
              >
                {initialData ? 'Update Snippet' : translations.addSnippetBtn}
              </button>
            </form>
          </motion.div>

          <style dangerouslySetInnerHTML={{
            __html: `
            .modal-overlay {
              position: absolute;
              inset: 0;
              background: rgba(0, 0, 0, 0.4);
              backdrop-filter: blur(8px);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 1000;
            }

            .modal-content {
              width: 500px;
              max-height: 85vh;
              overflow-y: hidden;
              padding: 32px;
              display: flex;
              flex-direction: column;
              gap: 24px;
            }

            .modal-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }

            .close-btn {
              background: none;
              border: none;
              color: var(--text-secondary);
              cursor: pointer;
            }

            .modal-form {
              display: flex;
              flex-direction: column;
              gap: 20px;
              overflow: hidden;
            }

            .form-group {
              display: flex;
              flex-direction: column;
              gap: 8px;
            }

            .form-group label {
              font-size: 14px;
              color: var(--text-secondary);
              font-weight: 500;
            }

            .commands-list-scroll {
              max-height: 300px;
              overflow-y: auto;
              display: flex;
              flex-direction: column;
              gap: 10px;
              padding-right: 4px;
            }

            .commands-list-scroll::-webkit-scrollbar {
              width: 4px;
            }

            .commands-list-scroll::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.1);
              border-radius: 4px;
            }

            .list-input-item {
              display: flex;
              gap: 8px;
            }

            .list-input-item .glass-input {
              flex: 1;
            }

            .remove-btn {
              background: none;
              border: none;
              color: #ff4444;
              cursor: pointer;
              opacity: 0.6;
              transition: opacity 0.2s ease;
            }

            .remove-btn:hover:not(:disabled) {
              opacity: 1;
            }

            .remove-btn:disabled {
              opacity: 0.2;
              cursor: not-allowed;
            }

            .add-list-btn {
              background: none;
              border: none;
              color: var(--status-online);
              font-size: 12px;
              display: flex;
              align-items: center;
              gap: 4px;
              cursor: pointer;
              margin-top: 4px;
            }
          `}} />
        </div>
      )}
    </AnimatePresence>
  );
};

export default NewSnippetModal;
