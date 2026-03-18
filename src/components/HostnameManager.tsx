import React, { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, Shield, AlertTriangle, ExternalLink, CheckCircle2, Activity, Search } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { LazyStore } from "@tauri-apps/plugin-store";
import { motion, AnimatePresence } from 'framer-motion';
import { containerVariants, itemVariants, listVariants } from '../constants/animations';

interface PortInfo {
  port: string;
  process: string;
  pid: string;
}

interface HostnameEntry {
  hostname: string;
  ip: string;
  active: boolean;
}

interface HostnameManagerProps {
  translations: {
    title: string;
    subtitle: string;
    hostnameLabel: string;
    addBtn: string;
    activeTitle: string;
    noMappings: string;
    helpTitle: string;
    helpDesc: string;
    removeConfirm: string;
    successAdd: string;
    successRemove: string;
    errorElevation: string;
    selectPort: string;
    linkPort: string;
    resultingUrl: string;
    hidePort: string;
    searchPlaceholder: string;
  };
}

const HostnameManager: React.FC<HostnameManagerProps> = ({ translations }) => {
  const [hostnames, setHostnames] = useState<HostnameEntry[]>([]);
  const [activePorts, setActivePorts] = useState<PortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [newAlias, setNewAlias] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [portMappings, setPortMappings] = useState<Record<string, { port: string; hidePort: boolean; ip?: string }>>({});
  const [portSearch, setPortSearch] = useState('');
  const [hidePort, setHidePort] = useState(false);
  const [mainSearch, setMainSearch] = useState('');

  const store = new LazyStore("nexo_hostname_ports.json");

  const fetchMappings = async () => {
    try {
      const mappings = await invoke<HostnameEntry[]>('get_hostname_mappings');
      setHostnames(mappings);
      
      const savedMappings = await store.get<Record<string, any>>("mappings");
      if (savedMappings) {
        const migrated: Record<string, { port: string; hidePort: boolean; ip?: string }> = {};
        Object.entries(savedMappings).forEach(([hostname, value]) => {
          if (typeof value === 'string') {
            migrated[hostname] = { port: value, hidePort: false };
          } else {
            migrated[hostname] = value as { port: string; hidePort: boolean; ip?: string };
          }
        });
        setPortMappings(migrated);
      }
    } catch (e) {
      console.error('Failed to fetch mappings', e);
    }
  };

  const fetchPorts = async () => {
    try {
      const data = await invoke<PortInfo[]>('get_active_ports');
      setActivePorts(data);
    } catch (e) {
      console.error('Failed to fetch ports', e);
    }
  };

  useEffect(() => {
    fetchMappings();
    fetchPorts();
    const interval = setInterval(fetchPorts, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredPorts = activePorts.filter(p => 
    p.port.includes(portSearch) || 
    p.process.toLowerCase().includes(portSearch.toLowerCase())
  );

  const handleAdd = async () => {
    if (!newAlias) return;
    const fullHostname = newAlias.trim();
    setError(null);
    setLoading(true);
    try {
      let targetIp = "127.0.0.1";
      if (hidePort) {
        const usedIps = new Set(Object.values(portMappings).map(m => m.ip).filter(Boolean));
        for (let i = 2; i < 255; i++) {
          const testIp = `127.0.0.${i}`;
          if (!usedIps.has(testIp)) {
            targetIp = testIp;
            break;
          }
        }
      }

      await invoke('update_hostname_mapping', { 
        hostname: fullHostname, 
        remove: false,
        ip: targetIp,
        targetPort: selectedPort || null
      });
      
      const updated = { 
        ...portMappings, 
        [fullHostname]: { 
          port: selectedPort, 
          hidePort,
          ip: targetIp === "127.0.0.1" ? undefined : targetIp
        } 
      };
      setPortMappings(updated);
      await store.set("mappings", updated);
      await store.save();

      setNewAlias('');
      setSelectedPort('');
      setHidePort(false);
      setSuccess(translations.successAdd);
      setTimeout(() => setSuccess(null), 3000);
      fetchMappings();
    } catch (e) {
      console.error('Failed to update mapping', e);
      setError(translations.errorElevation);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (hostname: string) => {
    const isMac = navigator.userAgent.toLowerCase().includes('mac');
    if (!isMac && !confirm(translations.removeConfirm)) return;
    setLoading(true);
    try {
      const mapping = portMappings[hostname];
      await invoke('update_hostname_mapping', { 
        hostname, 
        remove: true,
        ip: mapping?.ip || "127.0.0.1",
        targetPort: mapping?.port || null
      });
      
      const updated = { ...portMappings };
      delete updated[hostname];
      setPortMappings(updated);
      await store.set("mappings", updated);
      await store.save();

      setSuccess(translations.successRemove);
      setTimeout(() => setSuccess(null), 3000);
      fetchMappings();
    } catch (e) {
      console.error('Failed to remove mapping', e);
      setError(translations.errorElevation);
    } finally {
      setLoading(false);
    }
  };

  const filteredHostnames = hostnames.filter(h => 
    h.hostname.toLowerCase().includes(mainSearch.toLowerCase()) ||
    (portMappings[h.hostname]?.port && portMappings[h.hostname].port.includes(mainSearch))
  );

  return (
    <motion.div 
      className="hostname-view"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.header className="page-header" variants={itemVariants}>
        <div className="header-content">
          <h1>{translations.title}</h1>
          <p className="subtitle">{translations.subtitle}</p>
        </div>
      </motion.header>

      <motion.div className="hostname-grid" variants={containerVariants}>
        <motion.div className="host-controls glass-card" variants={itemVariants}>
          <section className="input-section">
            <label className="section-label">
              <Globe size={18} />
              <span>{translations.hostnameLabel}</span>
            </label>
            <div className="hostname-input-wrapper">
              <div className="alias-input-group">
                <input
                  type="text"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  placeholder="ej. banorte.test o proveedores"
                  className="glass-input alias-input"
                  disabled={loading}
                />
              </div>

              <div className="port-selection-group">
                <label className="section-label mini">
                  <Activity size={14} />
                  <span>{translations.linkPort}</span>
                </label>
                
                <div className="searchable-port-select">
                  <div className="port-search-input-wrapper">
                    <Search size={14} className="search-icon" />
                    <input 
                      type="text"
                      placeholder="Buscar puerto o proceso..."
                      value={portSearch}
                      onChange={(e) => setPortSearch(e.target.value)}
                      className="mini-search-input"
                    />
                  </div>
                  
                  <select
                    value={selectedPort}
                    onChange={(e) => setSelectedPort(e.target.value)}
                    className="glass-select port-select"
                    disabled={loading}
                  >
                    <option value="">{translations.selectPort} ({filteredPorts.length})</option>
                    {filteredPorts.map((p) => (
                      <option key={`${p.port}-${p.pid}`} value={p.port}>
                        {p.port} - {p.process}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {newAlias && (
                <div className="preview-url-box">
                  <div className="preview-header">
                    <span className="label">{translations.resultingUrl}</span>
                    <label className="checkbox-wrapper">
                      <input 
                        type="checkbox" 
                        checked={hidePort}
                        onChange={(e) => setHidePort(e.target.checked)}
                      />
                      <span>{translations.hidePort}</span>
                    </label>
                  </div>
                  <code className="text-primary italic">
                    http://{newAlias}{selectedPort && !hidePort ? `:${selectedPort}` : ''}
                  </code>
                </div>
              )}
              <button 
                className="glass-button glass-button-primary add-host-btn"
                onClick={handleAdd}
                disabled={loading || !newAlias}
              >
                {loading ? <div className="spinner-small" /> : <Plus size={18} />}
                <span>{translations.addBtn}</span>
              </button>
            </div>
          </section>

          <section className="info-box glass-card border-amber">
            <div className="info-header">
              <Shield size={18} className="text-amber" />
              <h4>{translations.helpTitle}</h4>
            </div>
            <p>{translations.helpDesc}</p>
          </section>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="status-msg error-msg"
              >
                <AlertTriangle size={16} />
                <span>{error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="status-msg success-msg"
              >
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div className="host-list-container glass-card" variants={itemVariants}>
          <div className="list-header">
            <h3>{translations.activeTitle}</h3>
            <span className="count-badge">{hostnames.length}</span>
          </div>

          <motion.div className="main-search-bar" variants={itemVariants}>
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder={translations.searchPlaceholder} 
              value={mainSearch}
              onChange={(e) => setMainSearch(e.target.value)}
            />
          </motion.div>

          <motion.div className="host-list" variants={listVariants}>
            <AnimatePresence mode="popLayout">
              {filteredHostnames.length === 0 ? (
                <motion.div key="empty" className="empty-state" variants={itemVariants}>
                  <Globe size={48} className="empty-icon" />
                  <p>{mainSearch ? "No se encontraron resultados" : translations.noMappings}</p>
                </motion.div>
              ) : (
                filteredHostnames.map((entry) => {
                  const mapping = portMappings[entry.hostname];
                  const port = mapping?.port;
                  const shouldHidePort = mapping?.hidePort;
                  const displayUrlPort = port && !shouldHidePort ? `:${port}` : '';
                  const displayUrl = `http://${entry.hostname}${displayUrlPort}`;
                  
                  return (
                    <motion.div 
                      key={entry.hostname} 
                      className="host-item glass-card"
                      variants={itemVariants}
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="host-info">
                        <span className="host-alias">{displayUrl}</span>
                        <span className="host-ip">{mapping?.ip || entry.ip} mapping</span>
                      </div>
                      <div className="host-actions">
                        <button 
                          className="action-btn remove-btn"
                          onClick={() => handleRemove(entry.hostname)}
                          disabled={loading}
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                        <a 
                          href={displayUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="action-btn link-btn"
                          title="Abrir en navegador"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        .hostname-view {
          padding: 40px;
          height: 100%;
          overflow-y: auto;
        }

        .page-header {
          margin-bottom: 32px;
        }

        .header-content h1 {
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

        .main-search-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          margin-bottom: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid var(--glass-border);
        }

        .main-search-bar .search-icon {
          color: var(--text-secondary);
          opacity: 0.5;
        }

        .main-search-bar input {
          background: none;
          border: none;
          color: var(--text-primary);
          width: 100%;
          font-size: 14px;
          outline: none;
        }

        .host-controls {
          padding: 30px;
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .hostname-input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .section-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 16px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 12px;
        }

        .alias-input {
          flex: 1;
          font-size: 18px;
          font-weight: 600;
        }


        .add-host-btn {
          height: 48px;
          gap: 10px;
          font-weight: 600;
        }

        .port-selection-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          border: 1px solid var(--glass-border);
        }

        .searchable-port-select {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .port-search-input-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .mini-search-input {
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 13px;
          width: 100%;
          outline: none;
        }

        .port-search-input-wrapper .search-icon {
          opacity: 0.5;
        }

        .section-label.mini {
          font-size: 11px;
          opacity: 0.7;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .port-select {
          width: 100%;
          padding: 10px;
          font-size: 14px;
        }

        .preview-url-box {
          padding: 12px 16px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 8px;
          border: 1px solid rgba(99, 102, 241, 0.2);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .preview-url-box .label {
          font-size: 11px;
          opacity: 0.6;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .checkbox-wrapper {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          cursor: pointer;
          opacity: 0.8;
          transition: opacity 0.2s;
        }

        .checkbox-wrapper:hover {
          opacity: 1;
        }

        .checkbox-wrapper input {
          cursor: pointer;
          accent-color: var(--text-primary);
        }

        .info-box {
          padding: 20px;
          background: rgba(251, 191, 36, 0.05);
          border: 1px solid rgba(251, 191, 36, 0.2);
        }

        .info-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          color: #fbbf24;
        }

        .info-box p {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .status-msg {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
        }

        .error-msg {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .success-msg {
          background: rgba(34, 197, 94, 0.1);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .host-list-container {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .count-badge {
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
        }

        .host-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 480px;
          overflow-y: auto;
          padding-right: 8px;
        }

        .host-item {
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: transform 0.2s;
        }

        .host-item:hover {
          transform: translateX(5px);
          border-color: var(--glass-border-bright);
        }

        .host-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .host-alias {
          font-weight: 600;
          color: var(--text-primary);
        }

        .host-ip {
          font-size: 12px;
          color: var(--text-secondary);
          opacity: 0.6;
          font-family: monospace;
          background: none;
        }

        .host-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          background: none;
          border: none;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          color: var(--text-secondary);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .remove-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
        }

        .link-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 0;
          color: var(--text-secondary);
          gap: 16px;
          opacity: 0.5;
        }

        .empty-icon {
          stroke-width: 1px;
        }

        .spinner-small {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
    </motion.div>
  );
};

export default HostnameManager;
