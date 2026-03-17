import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnvProfile, EnvVariable } from '../types';

interface NewEnvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (env: EnvProfile) => void;
  initialData?: EnvProfile | null;
  translations: {
    newEnv: string;
    editEnv: string;
    envTitle: string;
    keyPlaceholder: string;
    valuePlaceholder: string;
    addRow: string;
    addSnippetBtn: string; // fallback if missing
  };
}

const NewEnvModal: React.FC<NewEnvModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData, 
  translations 
}) => {
  const [title, setTitle] = useState('');
  const [variables, setVariables] = useState<EnvVariable[]>([]);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setVariables(initialData.variables);
    } else {
      setTitle('');
      setVariables([{ id: 'init', key: '', value: '' }]);
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const profile: EnvProfile = {
      id: initialData?.id || Date.now().toString(),
      title: title.trim(),
      variables: variables.filter(v => v.key.trim() !== ''),
    };
    onSave(profile);
    onClose();
  };

  const addRow = () => {
    setVariables([...variables, { id: Math.random().toString(36).slice(2, 11), key: '', value: '' }]);
  };

  const removeRow = (id: string) => {
    setVariables(variables.filter(v => v.id !== id));
  };

  const updateRow = (id: string, field: 'key' | 'value', value: string) => {
    setVariables(variables.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleKeyChange = (id: string, value: string) => {
    const formatted = value.toUpperCase().replace(/\s+/g, '_');
    updateRow(id, 'key', formatted);
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
            style={{ width: '600px' }}
          >
            <div className="modal-header">
              <h2>{initialData ? translations.editEnv : translations.newEnv}</h2>
              <button className="close-btn" onClick={onClose}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="env-title">{translations.envTitle}</label>
                <input
                  id="env-title"
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. My Project API"
                  className="glass-input"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Variables</label>
                <div className="variables-list-scroll">
                  {variables.map((v) => (
                    <div key={v.id} className="env-edit-row">
                      <input
                        type="text"
                        value={v.key}
                        onChange={e => handleKeyChange(v.id, e.target.value)}
                        placeholder={translations.keyPlaceholder}
                        className="glass-input key-input-field"
                      />
                      <span className="separator">=</span>
                      <input
                        type="text"
                        value={v.value}
                        onChange={e => updateRow(v.id, 'value', e.target.value)}
                        placeholder={translations.valuePlaceholder}
                        className="glass-input"
                        style={{ flex: 1 }}
                      />
                      <button 
                        type="button" 
                        onClick={() => removeRow(v.id)} 
                        className="remove-btn"
                        disabled={variables.length === 1 && variables[0].key === ''}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addRow} className="add-list-btn">
                  <Plus size={14} /> {translations.addRow}
                </button>
              </div>

              <div className="modal-footer" style={{ marginTop: '20px' }}>
                <button 
                  type="submit" 
                  className="glass-button glass-button-primary w-full" 
                  disabled={!title.trim() || variables.every(v => !v.key.trim())}
                >
                  {initialData ? translations.updateProfile : translations.saveProfile}
                </button>
              </div>
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
              padding: 32px;
              display: flex;
              flex-direction: column;
              gap: 24px;
              max-height: 90vh;
              overflow: hidden;
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

            .variables-list-scroll {
              max-height: 400px;
              overflow-y: auto;
              display: flex;
              flex-direction: column;
              gap: 12px;
              padding-right: 8px;
            }

            .variables-list-scroll::-webkit-scrollbar {
              width: 4px;
            }

            .variables-list-scroll::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.1);
              border-radius: 4px;
            }

            .env-edit-row {
              display: flex;
              align-items: center;
              gap: 10px;
            }

            .key-input-field {
              width: 40%;
              font-family: 'JetBrains Mono', monospace;
              text-transform: uppercase;
            }

            .separator {
              color: var(--text-secondary);
              opacity: 0.5;
              font-weight: bold;
            }

            .remove-btn {
              background: none;
              border: none;
              color: #ff4444;
              cursor: pointer;
              opacity: 0.6;
              padding: 8px;
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
              margin-top: 8px;
            }
          `}} />
        </div>
      )}
    </AnimatePresence>
  );
};

export default NewEnvModal;
