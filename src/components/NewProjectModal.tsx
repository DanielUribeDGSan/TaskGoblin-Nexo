import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle, Folder, FileText, ChevronDown } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from './ProjectCard';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (project: Project) => void;
  initialData?: Project | null;
  translations: {
    title: string;
    name: string;
    path: string;
    editor: string;
    framework: string;
    subProjects: string;
    addSubProject: string;
    scripts: string;
    addCommand: string;
    useIntegratedTerminal: string;
    autoOpenBrowser: string;
    create: string;
    browse: string;
    hostModeTipTitle: string;
    hostModeTipDesc: string;
    hostModeTipAction: string;
  };
}

const ALL_IDES = [
  { id: 'cursor', name: 'Cursor' },
  { id: 'code', name: 'VS Code' },
  { id: 'zed', name: 'Zed' },
  { id: 'subl', name: 'Sublime Text' },
  { id: 'intellij', name: 'IntelliJ IDEA' },
  { id: 'vs', name: 'Visual Studio' },
  { id: 'antigravity', name: 'Antigravity' },
];

interface LocalSubProject {
  id: string;
  name: string;
  path: string;
  command: string;
  editor: string;
  useIntegratedTerminal: boolean;
  autoOpenBrowser: boolean;
  url: string;
}

interface LocalCommand {
  id: string;
  value: string;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onAdd, initialData, translations }) => {
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [editor, setEditor] = useState('cursor');
  const [framework, setFramework] = useState('React');
  const [commands, setCommands] = useState<LocalCommand[]>([{ id: 'init', value: 'npm run dev -- --host' }]);
  const [useIntegratedTerminal, setUseIntegratedTerminal] = useState(false);
  const [autoOpenBrowser, setAutoOpenBrowser] = useState(false);
  const [url, setUrl] = useState('');
  const [subProjects, setSubProjects] = useState<LocalSubProject[]>([]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPath(initialData.path);
      setEditor(initialData.editor);
      setFramework(initialData.framework);
      setUseIntegratedTerminal(initialData.useIntegratedTerminal || false);
      setAutoOpenBrowser(initialData.autoOpenBrowser || false);
      setUrl(initialData.url || '');
      setCommands(initialData.commands.map((c, i) => ({ id: `cmd-${i}`, value: c })));
      setSubProjects(initialData.subProjects?.map((sp, i) => ({
        id: sp.id || `sp-${i}-${Date.now()}`,
        name: sp.name,
        path: sp.path,
        command: sp.command,
        editor: sp.editor || 'cursor',
        useIntegratedTerminal: sp.useIntegratedTerminal || false,
        autoOpenBrowser: sp.autoOpenBrowser || false,
        url: sp.url || ''
      })) || []);
    } else {
      setName('');
      setPath('');
      setEditor('cursor');
      setFramework('React');
      setUseIntegratedTerminal(false);
      setAutoOpenBrowser(false);
      setUrl('');
      setCommands([{ id: 'init', value: 'npm run dev -- --host' }]);
      setSubProjects([]);
    }
  }, [initialData, isOpen]);

  const handlePickPath = async (setter: (p: string) => void, mode: 'folder' | 'file', autoNameIfEmpty: boolean = false) => {
    const isDirectory = mode === 'folder';
    const selected = await open({
      directory: isDirectory,
      multiple: false,
      title: isDirectory ? 'Select Project Folder' : 'Select Project File',
      filters: isDirectory ? [] : [
        { name: 'Common Project Files', extensions: ['csproj', 'sln', 'json', 'html', 'js', 'ts', 'py', 'go', 'rs'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    if (selected && typeof selected === 'string') {
      setter(selected);
      if (autoNameIfEmpty && !name) {
        // Extract name from path (works for files and folders)
        const parts = selected.split(/[/\\]/);
        let fileName = parts[parts.length - 1];
        // Remove common extensions if it's a file
        if (fileName.includes('.')) {
          fileName = fileName.split('.')[0];
        }
        setName(fileName);
      }
    }
  };

  const PathPicker: React.FC<{ 
    onSelect: (mode: 'folder' | 'file') => void; 
    size?: number;
    title?: string;
  }> = ({ onSelect, size = 18, title = "Select Path" }) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
      <div className="path-picker-container">
        <button 
          type="button" 
          onClick={() => setShowMenu(!showMenu)} 
          className="glass-button glass-button-secondary picker-btn main-picker-btn"
          title={title}
        >
          <Folder size={size} />
          <ChevronDown size={12} className={`chevron ${showMenu ? 'open' : ''}`} />
        </button>
        
        <AnimatePresence>
          {showMenu && (
            <>
              <div className="menu-backdrop" onClick={() => setShowMenu(false)} />
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="picker-menu glass-panel"
              >
                <button type="button" onClick={() => { onSelect('folder'); setShowMenu(false); }}>
                  <Folder size={14} />
                  <span>Carpeta</span>
                </button>
                <button type="button" onClick={() => { onSelect('file'); setShowMenu(false); }}>
                  <FileText size={14} />
                  <span>Archivo</span>
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !path) return;

    const project: Project = {
      id: initialData?.id || Date.now().toString(),
      name,
      path,
      editor,
      framework,
      status: initialData?.status || 'Stopped',
      commands: commands.map(c => c.value).filter(val => val.trim() !== ''),
      urls: [],
      subProjects: subProjects.map(sp => ({ ...sp })),
      useIntegratedTerminal,
      autoOpenBrowser,
      url: url.trim()
    };
    onAdd(project);
    onClose();
  };

  const handleFixHost = () => {
    setCommands(commands.map(c => {
      if (c.value.toLowerCase().includes('dev') && !c.value.includes('--host')) {
        const newValue = c.value.includes(' -- ') ? `${c.value} --host` : `${c.value} -- --host`;
        return { ...c, value: newValue };
      }
      return c;
    }));
  };

  const handleFixSubProjectHost = (id: string) => {
    setSubProjects(subProjects.map(sp => {
      if (sp.id === id && sp.command.toLowerCase().includes('dev') && !sp.command.includes('--host')) {
        const newValue = sp.command.includes(' -- ') ? `${sp.command} --host` : `${sp.command} -- --host`;
        return { ...sp, command: newValue };
      }
      return sp;
    }));
  };

  const addCommand = () => {
    setCommands([...commands, { id: Math.random().toString(36).substr(2, 9), value: '' }]);
  };

  const removeCommand = (id: string) => {
    setCommands(commands.filter(c => c.id !== id));
  };

  const updateCommand = (id: string, value: string) => {
    setCommands(commands.map(c => c.id === id ? { ...c, value } : c));
  };

  const addSubProject = () => {
    setSubProjects([...subProjects, {
      id: `sp-${Date.now()}-${subProjects.length}`,
      name: '',
      path: '',
      command: '',
      editor: 'cursor',
      useIntegratedTerminal: false,
      autoOpenBrowser: false,
      url: ''
    }]);
  };

  const removeSubProject = (id: string) => {
    setSubProjects(subProjects.filter(sp => sp.id !== id));
  };

  const updateSubProject = (id: string, fields: Partial<LocalSubProject>) => {
    setSubProjects(subProjects.map(sp => sp.id === id ? { ...sp, ...fields } : sp));
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
              <h2>{initialData ? 'Edit Project' : translations.title}</h2>
              <button className="close-btn" onClick={onClose}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="proj-name">{translations.name}</label>
                <input
                  id="proj-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. My Awesome App"
                  className="glass-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="proj-path">{translations.path}</label>
                <div className="path-input-group">
                  <input
                    id="proj-path"
                    type="text"
                    value={path}
                    readOnly
                    placeholder="/path/to/project"
                    className="glass-input"
                  />
                  <PathPicker onSelect={(mode) => handlePickPath(setPath, mode, true)} title="Seleccionar Ruta" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="proj-editor">{translations.editor}</label>
                  <select id="proj-editor" value={editor} onChange={e => setEditor(e.target.value)} className="glass-select">
                    {ALL_IDES.map(ide => (
                      <option key={ide.id} value={ide.id}>
                        {ide.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="proj-framework">{translations.framework}</label>
                  <select id="proj-framework" value={framework} onChange={e => setFramework(e.target.value)} className="glass-select">
                    <option value="React">React</option>
                    <option value="Vue">Vue</option>
                    <option value="Node">Node.js</option>
                    <option value="Rust">Rust (Cargo)</option>
                    <option value="Python">Python</option>
                    <option value="Java">Java (Maven/Gradle)</option>
                    <option value=".NET">.NET Core</option>
                    <option value="Go">Go</option>
                    <option value="Docker">Docker Compose</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <div className="terminal-toggle-container">
                  <div className="flex flex-col gap-4">
                    <label className="flex items-center gap-3 cursor-pointer group w-full text-left">
                      <input
                        type="checkbox"
                        className="glass-checkbox"
                        checked={useIntegratedTerminal}
                        onChange={e => setUseIntegratedTerminal(e.target.checked)}
                      />
                      <span className="text-sm font-medium transition-colors group-hover:text-blue-400 leading-none">
                        {translations.useIntegratedTerminal}
                      </span>
                    </label>

                    <div className="flex flex-col gap-2 w-full">
                      <label className="flex items-center gap-3 cursor-pointer group w-full text-left">
                        <input
                          type="checkbox"
                          className="glass-checkbox"
                          checked={autoOpenBrowser}
                          onChange={e => setAutoOpenBrowser(e.target.checked)}
                        />
                        <span className="text-sm font-medium transition-colors group-hover:text-blue-400 leading-none">
                          {translations.autoOpenBrowser}
                        </span>
                      </label>
                      {autoOpenBrowser && (
                        <div className="pl-9 mt-1 w-full">
                          <input
                            type="text"
                            placeholder="http://localhost:3000"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            className="glass-input text-sm w-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="proj-scripts">{translations.scripts}</label>
                {commands.map((cmd) => (
                  <div key={cmd.id} className="list-input-item">
                    <input
                      type="text"
                      value={cmd.value}
                      onChange={e => updateCommand(cmd.id, e.target.value)}
                      className="glass-input"
                    />
                    <button type="button" onClick={() => removeCommand(cmd.id)} className="remove-btn">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addCommand} className="add-list-btn">
                  <Plus size={14} /> {translations.addCommand}
                </button>
                {commands.some(c => c.value.toLowerCase().includes('dev') && !c.value.includes('--host')) && (
                  <div className="premium-alert animate-in">
                    <div className="alert-content">
                      <div className="alert-icon">
                        <AlertCircle size={18} />
                      </div>
                      <div className="alert-text">
                        <span className="alert-title">{translations.hostModeTipTitle}</span>
                        <span className="alert-desc">{translations.hostModeTipDesc}</span>
                      </div>
                    </div>
                    <button type="button" onClick={handleFixHost} className="alert-action">
                      {translations.hostModeTipAction}
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <div className="sub-project-header">
                  <label>{translations.subProjects}</label>
                </div>
                {subProjects.map((sp, i) => (
                  <div key={sp.id} className="sub-project-item">
                    <div className="sub-project-header">
                      <span className="text-xs uppercase tracking-wider opacity-50">Sub-project {i + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeSubProject(sp.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Remove Sub-project"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Service Name (e.g. Backend)"
                      value={sp.name}
                      onChange={e => updateSubProject(sp.id, { name: e.target.value })}
                      className="glass-input"
                    />
                    <div className="path-input-group">
                      <input
                        type="text"
                        readOnly
                        value={sp.path}
                        placeholder="/path/to/subproject"
                        className="glass-input"
                      />
                      <PathPicker 
                        onSelect={(mode) => handlePickPath((p) => updateSubProject(sp.id, { path: p }), mode)} 
                        size={16} 
                        title="Seleccionar Ruta Sub-proyecto" 
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group flex-1">
                        <select
                          value={sp.editor}
                          onChange={e => updateSubProject(sp.id, { editor: e.target.value })}
                          className="glass-select"
                        >
                          {ALL_IDES.map(ide => (
                            <option key={ide.id} value={ide.id}>
                              {ide.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder="Start Command"
                        value={sp.command}
                        onChange={e => updateSubProject(sp.id, { command: e.target.value })}
                        className="glass-input"
                      />
                    </div>
                    {sp.command.toLowerCase().includes('dev') && !sp.command.includes('--host') && (
                      <div className="premium-alert smaller animate-in">
                        <div className="alert-content">
                          <div className="alert-icon">
                            <AlertCircle size={14} />
                          </div>
                          <div className="alert-text">
                            <span className="alert-title text-[10px]">{translations.hostModeTipTitle}</span>
                            <span className="alert-desc text-[9px]">{translations.hostModeTipDesc}</span>
                          </div>
                        </div>
                        <button type="button" onClick={() => handleFixSubProjectHost(sp.id)} className="alert-action smaller">
                          {translations.hostModeTipAction}
                        </button>
                      </div>
                    )}
                    <div className="flex flex-col gap-3 w-full">
                      <label className="flex items-center gap-3 cursor-pointer group w-full text-left">
                        <input
                          type="checkbox"
                          className="glass-checkbox"
                          checked={sp.useIntegratedTerminal}
                          onChange={e => updateSubProject(sp.id, { useIntegratedTerminal: e.target.checked })}
                        />
                        <span className="text-xs font-semibold tracking-wide opacity-70 transition-opacity group-hover:opacity-100 leading-none">
                          {translations.useIntegratedTerminal}
                        </span>
                      </label>

                      <div className="flex flex-col gap-2 w-full">
                        <label className="flex items-center gap-3 cursor-pointer group w-full text-left">
                          <input
                            type="checkbox"
                            className="glass-checkbox"
                            checked={sp.autoOpenBrowser}
                            onChange={e => updateSubProject(sp.id, { autoOpenBrowser: e.target.checked })}
                          />
                          <span className="text-xs font-semibold tracking-wide opacity-70 transition-opacity group-hover:opacity-100 leading-none">
                            {translations.autoOpenBrowser}
                          </span>
                        </label>
                        {sp.autoOpenBrowser && (
                          <div className="pl-9 mt-1 w-full">
                            <input
                              type="text"
                              placeholder="http://localhost:3000"
                              value={sp.url}
                              onChange={e => updateSubProject(sp.id, { url: e.target.value })}
                              className="glass-input text-xs w-full"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSubProject}
                  className="glass-button glass-button-ghost w-full"
                >
                  <Plus size={16} /> {translations.addSubProject}
                </button>
              </div>

              <button type="submit" className="glass-button glass-button-primary w-full h-12 mt-6" disabled={!name || !path}>
                {initialData ? 'Update Project' : translations.create}
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
              max-height: 90vh;
              overflow-y: auto;
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

            .form-row {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
            }

            .path-input-group {
              display: flex;
              gap: 10px;
            }

            .path-input-group input {
              flex: 1;
            }

            .picker-btn {
              padding: 0;
              width: 44px;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .path-picker-container {
              position: relative;
            }

            .main-picker-btn {
              gap: 4px;
              width: auto;
              padding: 0 10px;
            }

            .chevron {
              transition: transform 0.2s ease;
              opacity: 0.6;
            }

            .chevron.open {
              transform: rotate(180deg);
            }

            .menu-backdrop {
              position: fixed;
              inset: 0;
              z-index: 90;
            }

            .picker-menu {
              position: absolute;
              top: calc(100% + 8px);
              right: 0;
              width: 140px;
              background: rgba(30, 30, 40, 0.95);
              backdrop-filter: blur(12px);
              border: 1px solid var(--glass-border-bright);
              border-radius: 12px;
              padding: 6px;
              display: flex;
              flex-direction: column;
              gap: 4px;
              z-index: 100;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            }

            .picker-menu button {
              background: none;
              border: none;
              color: var(--text-primary);
              padding: 8px 12px;
              border-radius: 8px;
              display: flex;
              align-items: center;
              gap: 10px;
              cursor: pointer;
              font-size: 13px;
              transition: all 0.2s ease;
              text-align: left;
              width: 100%;
            }

            .picker-menu button:hover {
              background: rgba(255, 255, 255, 0.1);
              color: var(--status-online);
            }

            .picker-menu button span {
              flex: 1;
            }

            .list-input-item {
              display: flex;
              gap: 8px;
              margin-bottom: 8px;
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
              margin-top: -8px;
            }

            .terminal-toggle-container {
              background: rgba(255, 255, 255, 0.03);
              padding: 12px 16px;
              border-radius: 12px;
              border: 1px solid var(--glass-border);
              margin: 8px 0;
            }

            .glass-checkbox {
              appearance: none;
              width: 20px;
              height: 20px;
              border-radius: 6px;
              border: 2px solid var(--glass-border);
              background: rgba(255, 255, 255, 0.05);
              cursor: pointer;
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
              display: inline-flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              margin: 0;
            }

            .glass-checkbox:hover {
              border-color: rgba(255, 255, 255, 0.3);
              background: rgba(255, 255, 255, 0.08);
            }

            .glass-checkbox:checked {
              background: var(--status-online);
              border-color: var(--status-online);
              box-shadow: 0 0 12px rgba(0, 255, 153, 0.2);
            }

            .glass-checkbox:checked::after {
              content: '';
              width: 6px;
              height: 10px;
              border: solid white;
              border-width: 0 2.5px 2.5px 0;
              transform: rotate(45deg);
              margin-top: -2px;
            }

            .sub-project-item {
              padding: 20px;
              background: rgba(255, 255, 255, 0.02);
              border-radius: 16px;
              border: 1px solid var(--glass-border);
              display: flex;
              flex-direction: column;
              gap: 16px;
              margin-bottom: 16px;
            }

            .premium-alert {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 14px 18px;
              background: linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
              border: 1px solid rgba(59, 130, 246, 0.25);
              border-radius: 8px;
              margin-top: 14px;
              gap: 16px;
              backdrop-filter: blur(4px);
              box-shadow: inset 0 0 20px rgba(59, 130, 246, 0.02);
            }

            .premium-alert.smaller {
              padding: 10px 14px;
              margin-top: 0;
            }

            .alert-content {
              display: flex;
              align-items: center;
              gap: 14px;
              flex: 1;
            }

            .alert-icon {
              color: #60a5fa;
              display: flex;
              align-items: center;
              background: rgba(59, 130, 246, 0.15);
              padding: 8px;
              border-radius: 6px;
            }

            .premium-alert.smaller .alert-icon {
              padding: 6px;
            }

            .alert-text {
              display: flex;
              flex-direction: column;
              gap: 0px;
            }

            .alert-title {
              font-size: 13px;
              font-weight: 700;
              color: rgba(255, 255, 255, 0.95);
              line-height: 1.3;
            }

            .alert-desc {
              font-size: 11px;
              color: rgba(147, 197, 253, 0.85);
              line-height: 1.3;
            }

            .alert-action {
              background: #3b82f6;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
              white-space: nowrap;
              box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
            }

            .alert-action:hover {
              background: #2563eb;
              transform: translateY(-1px);
              box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
            }

            .alert-action.smaller {
              padding: 6px 12px;
              font-size: 10px;
            }

            .animate-in {
              animation: alertIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            @keyframes alertIn {
              from { opacity: 0; transform: translateY(8px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}} />
        </div>
      )}
    </AnimatePresence>
  );
};

export default NewProjectModal;
