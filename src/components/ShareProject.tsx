import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Wifi, Copy, Check, RefreshCcw, AlertTriangle } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { motion } from 'framer-motion';

interface ShareProjectProps {
  translations: {
    title: string;
    subtitle: string;
    step1: string;
    step2: string;
    findIp: string;
    noIp: string;
    shareUrl: string;
    portLabel: string;
    localNetwork: string;
    hostTipTitle: string;
    hostTipDesc: string;
  };
}

const ShareProject: React.FC<ShareProjectProps> = ({ translations }) => {
  const [port, setPort] = useState('3000');
  const [debouncedPort, setDebouncedPort] = useState('3000');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const getStatusMessage = () => {
    if (url) return url;
    if (loading) return translations.findIp;
    return error || translations.noIp;
  };

  const updateUrl = async () => {
    if (!port) return;
    setError(null);
    setLoading(true);
    setUrl('');

    try {
      const fullUrl = await invoke<string>('get_local_network_url', { port });
      setUrl(fullUrl);
    } catch (e) {
      console.error('Failed to get network URL', e);
      setError(translations.noIp);
    } finally {
      setLoading(false);
    }
  };

  // Debounce port input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPort(port);
    }, 1000); // 1 second debounce
    return () => clearTimeout(timer);
  }, [port]);

  useEffect(() => {
    updateUrl();
  }, [debouncedPort]);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="share-view">
      <header className="page-header">
        <div className="header-content">
          <h1>{translations.title}</h1>
          <p className="subtitle">{translations.subtitle}</p>
        </div>
      </header>

      <div className="share-grid">
        <div className="share-controls glass-card">
          <section className="share-section">
            <label className="section-label">
              <Wifi size={18} />
              <span>{translations.localNetwork}</span>
            </label>
            <p className="section-desc">{translations.subtitle}</p>
          </section>

          <section className="share-section">
            <label className="section-label">
              <Wifi size={18} />
              <span>{translations.step1}</span>
            </label>
            <div className={`port-input-wrapper ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
              <span>{translations.portLabel}:</span>
              <input 
                type="number" 
                value={port} 
                onChange={(e) => setPort(e.target.value)}
                placeholder="3000"
                className="glass-input port-input"
                disabled={loading}
              />
              <button 
                className="refresh-url-btn" 
                onClick={updateUrl}
                disabled={loading}
              >
                <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </section>

          <section className="share-section url-section">
            <label className="section-label">
              <Wifi size={18} />
              <span>{translations.shareUrl}</span>
            </label>
            <div className="url-display glass-card">
              <span className="url-text">
                {getStatusMessage()}
              </span>
              <button className="copy-btn" onClick={handleCopy} disabled={!url}>
                {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
              </button>
            </div>
          </section>


          <section className="host-tip glass-card">
            <div className="tip-header">
              <AlertTriangle size={16} className="text-amber-400" />
              <span>{translations.hostTipTitle}</span>
            </div>
            <p className="tip-text">{translations.hostTipDesc}</p>
          </section>
        </div>

        <div className="qr-container glass-card">
          <div className="qr-header">
            <h3>{translations.step2}</h3>
          </div>
          <div className="qr-wrapper">
            {url ? (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="qr-bg"
              >
                <QRCodeSVG 
                  value={url} 
                  size={200} 
                  level="H" 
                  includeMargin={true}
                  bgColor="transparent"
                  fgColor="#000000"
                />
              </motion.div>
            ) : (
              <div className="qr-placeholder">
                <Wifi size={48} className="animate-pulse opacity-20" />
              </div>
            )}
          </div>
          <div className="qr-footer">
            <p className="ip-info">{url}</p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .share-view {
          padding: 40px;
          height: 100%;
          overflow-y: auto;
          animation: fadeIn 0.5s ease-out;
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

        .share-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
        }

        @media (max-width: 950px) {
          .share-grid {
            grid-template-columns: 1fr;
          }
          
          .qr-container {
            width: 100%;
          }
        }

        .share-controls {
          padding: 30px;
        }

        .share-section {
          margin-bottom: 32px;
        }

        .animate-in {
          animation: slideIn 0.3s ease-out;
        }

        .host-tip {
          padding: 20px;
          background: rgba(251, 191, 36, 0.05);
          border: 1px solid rgba(251, 191, 36, 0.2);
          border-radius: 12px;
          margin-top: 10px;
        }

        .tip-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #fbbf24;
          margin-bottom: 8px;
        }

        .tip-text {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .section-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 16px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 16px;
        }

        .port-input-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-secondary);
        }

        .port-input {
          width: 100px;
          font-size: 18px;
          font-weight: 600;
          text-align: center;
          padding: 8px;
        }

        .refresh-url-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .refresh-url-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }

        .url-display {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
        }

        .url-text {
          font-family: monospace;
          font-size: 15px;
          color: #a5b4fc;
        }

        .copy-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .copy-btn:hover:not(:disabled) {
          color: var(--text-primary);
          transform: scale(1.1);
        }

        .qr-container {
          padding: 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
        }

        .qr-header {
          margin-bottom: 24px;
          text-align: center;
        }

        .qr-header h3 {
          font-size: 14px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .qr-wrapper {
          padding: 15px;
          background: white;
          border-radius: 16px;
          margin-bottom: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        .qr-bg {
          display: flex;
          padding: 10px;
          background: white;
        }

        /* Override SVG color for light background QR */
        .qr-bg svg {
          /* Force standard colors for high visibility in scan */
          background: white;
        }
        .qr-bg path[fill="#ffffff"] { fill: #ffffff !important; }
        .qr-bg path[fill="transparent"] { fill: #ffffff !important; }
        .qr-bg rect[fill="transparent"] { fill: #ffffff !important; }
        /* We'll use default black/white for maximum scannability */

        .qr-placeholder {
          width: 200px;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
        }

        .ip-info {
          font-size: 12px;
          color: var(--text-secondary);
          opacity: 0.6;
          font-family: monospace;
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
      `}} />
    </div>
  );
};

export default ShareProject;
