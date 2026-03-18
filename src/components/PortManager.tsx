import React, { useState, useEffect } from 'react';
import { Skull, RefreshCw, Search, RotateCcw } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from './ProjectCard';

interface PortInfo {
  port: string;
  process: string;
  pid: string;
}

interface PortManagerProps {
  translations: {
    title: string;
    subtitle: string;
    port: string;
    process: string;
    pid: string;
    actions: string;
    noPorts: string;
    killConfirm: string;
    restart: string;
    restartConfirm: string;
    restartTip: string;
    refresh: string;
    searchPlaceholder: string;
  };
  projects: Project[];
  onLaunch: (project: Project) => void;
}

const PortManager: React.FC<PortManagerProps> = ({ translations, projects, onLaunch }) => {
  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [killingPid, setKillingPid] = useState<string | null>(null);
  const [restartingPid, setRestartingPid] = useState<string | null>(null);

  const fetchPorts = async () => {
    setLoading(true);
    try {
      const data = await invoke<PortInfo[]>('get_active_ports');
      setPorts(data);
    } catch (e) {
      console.error('Failed to fetch ports', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPorts();
    const interval = setInterval(fetchPorts, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleKill = async (pid: string, silent = false) => {
    if (!silent && !window.confirm(translations.killConfirm)) return false;
    
    setKillingPid(pid);
    try {
      await invoke('kill_port_process', { pid });
      if (!silent) await fetchPorts();
      return true;
    } catch (e) {
      console.error('Failed to kill process', e);
      if (!silent) alert('Error: ' + e);
      return false;
    } finally {
      setKillingPid(null);
    }
  };

  const handleRestart = async (p: PortInfo) => {
    // Buscar proyecto asociado a este puerto
    const project = projects.find((proj: Project) => {
      // Check main project URL
      if (proj.url && proj.url.includes(`:${p.port}`)) return true;
      // Check sub-projects URLs
      if (proj.subProjects) {
        return proj.subProjects.some((sp: any) => sp.url && sp.url.includes(`:${p.port}`));
      }
      return false;
    });

    if (!project) {
        alert(translations.restartTip + "\n\n(No se encontró un proyecto asociado a este puerto en Nexo)");
        return;
    }

    if (!window.confirm(translations.restartConfirm)) return;

    setRestartingPid(p.pid);
    try {
      const killed = await handleKill(p.pid, true);
      if (killed) {
        // Wait a bit for the port to be free
        setTimeout(() => {
          onLaunch(project);
          setRestartingPid(null);
          // Refresh ports after launch (approximate)
          setTimeout(fetchPorts, 2000);
        }, 1000);
      } else {
        setRestartingPid(null);
      }
    } catch (e) {
      console.error('Failed to restart', e);
      setRestartingPid(null);
    }
  };

  const filteredPorts = ports.filter((p: PortInfo) => 
    p.port.includes(search) || 
    p.process.toLowerCase().includes(search.toLowerCase()) ||
    p.pid.includes(search)
  );

  return (
    <div className="port-manager-view">
      <header className="page-header">
        <div className="header-content">
          <h1>{translations.title}</h1>
          <p className="subtitle">{translations.subtitle}</p>
        </div>
        <button 
          className="glass-button glass-button-primary refresh-btn" 
          onClick={fetchPorts}
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          <span>{translations.refresh}</span>
        </button>
      </header>

      <div className="search-bar glass-card">
        <Search size={20} className="search-icon" />
        <input 
          type="text" 
          placeholder={translations.searchPlaceholder} 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="ports-container glass-card">
        {loading && ports.length === 0 ? (
          <div className="loading-state">
            <RefreshCw size={48} className="animate-spin opacity-20" />
          </div>
        ) : filteredPorts.length === 0 ? (
          <div className="empty-state">
            <p className="opacity-60">{translations.noPorts}</p>
          </div>
        ) : (
          <table className="ports-table">
            <thead>
              <tr>
                <th>{translations.port}</th>
                <th>{translations.process}</th>
                <th>{translations.pid}</th>
                <th className="text-right">{translations.actions}</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredPorts.map((p) => (
                  <motion.tr 
                    key={`${p.pid}-${p.port}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="port-row"
                  >
                    <td>
                      <span className="port-badge">{p.port}</span>
                    </td>
                    <td>
                      <div className="process-info">
                        <span className="process-name">{p.process}</span>
                      </div>
                    </td>
                    <td>
                      <span className="pid-label">PID: {p.pid}</span>
                    </td>
                    <td className="text-right">
                      <div className="action-group">
                        <button 
                          className="restart-button action-btn" 
                          onClick={() => handleRestart(p)}
                          disabled={restartingPid === p.pid || killingPid === p.pid}
                          title={translations.restart}
                        >
                          <RotateCcw size={18} className={restartingPid === p.pid ? 'animate-spin' : ''} />
                        </button>
                        <button 
                          className="kill-button action-btn" 
                          onClick={() => handleKill(p.pid)}
                          disabled={killingPid === p.pid || restartingPid === p.pid}
                          title="Kill Process"
                        >
                          <Skull size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .port-manager-view {
          padding: 40px;
          height: 100%;
          overflow-y: auto;
          animation: fadeIn 0.5s ease-out;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
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

        .refresh-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 12px;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          margin-bottom: 24px;
          border-radius: 16px;
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

        .ports-container {
          border-radius: 20px;
          overflow: hidden;
          min-height: 400px;
        }

        .ports-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .ports-table th {
          padding: 20px;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          border-bottom: 1px solid var(--glass-border);
          font-weight: 600;
        }

        .ports-table td {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .port-badge {
          background: rgba(99, 102, 241, 0.1);
          color: #a5b4fc;
          padding: 4px 10px;
          border-radius: 8px;
          font-family: monospace;
          font-weight: 600;
          border: 1px solid rgba(99, 102, 241, 0.2);
        }

        .process-name {
          font-weight: 500;
          color: var(--text-primary);
        }

        .pid-label {
          font-size: 12px;
          color: var(--text-secondary);
          opacity: 0.7;
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 8px;
          border-radius: 4px;
        }

        .action-group {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .action-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .kill-button {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
          border-color: rgba(239, 68, 68, 0.2);
        }

        .kill-button:hover:not(:disabled) {
          background: #ef4444;
          color: white;
          transform: scale(1.1);
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
        }

        .restart-button {
          background: rgba(34, 197, 94, 0.1);
          color: #4ade80;
          border-color: rgba(34, 197, 94, 0.2);
        }

        .restart-button:hover:not(:disabled) {
          background: #22c55e;
          color: white;
          transform: scale(1.1);
          box-shadow: 0 0 15px rgba(34, 197, 94, 0.4);
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading-state, .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 400px;
        }

        .loading-state RefreshCw {
          width: 48px;
          height: 48px;
        }

        .text-right {
          text-align: right;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
};

export default PortManager;
