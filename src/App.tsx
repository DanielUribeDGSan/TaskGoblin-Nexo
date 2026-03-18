import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import ProjectGrid from "./components/ProjectGrid";
import NewProjectModal from "./components/NewProjectModal";
import PortManager from "./components/PortManager";
import ShareProject from "./components/ShareProject";
import HostnameManager from "./components/HostnameManager";
import SnippetManager from "./components/SnippetManager";
import NewSnippetModal from "./components/NewSnippetModal";
import EnvManager from "./components/EnvManager";
import NewEnvModal from "./components/NewEnvModal";
import { invoke } from "@tauri-apps/api/core";
import { LazyStore } from "@tauri-apps/plugin-store";
import { translations, Language } from "./constants/translations";
import { openUrl } from "@tauri-apps/plugin-opener";
import { enable, disable, isEnabled as checkAutostart } from "@tauri-apps/plugin-autostart";
import { motion, AnimatePresence } from "framer-motion";
import { Project } from "./components/ProjectCard";
import { CommandSnippet, EnvProfile } from "./types";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [snippets, setSnippets] = useState<CommandSnippet[]>([]);
  const [envProfiles, setEnvProfiles] = useState<EnvProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState(false);
  const [isEnvModalOpen, setIsEnvModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingSnippet, setEditingSnippet] = useState<CommandSnippet | null>(null);
  const [editingEnv, setEditingEnv] = useState<EnvProfile | null>(null);
  const [language, setLanguage] = useState<Language>("es");
  const [isAutostartEnabled, setIsAutostartEnabled] = useState(false);
  const [alert, setAlert] = useState<{ message: string; title: string } | null>(null);

  const store = new LazyStore("nexo_settings.json");
  const t = translations[language];

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const savedProjects = await store.get<Project[]>("projects");
        if (savedProjects) setProjects(savedProjects);

        const savedSnippets = await store.get<CommandSnippet[]>("snippets");
        if (savedSnippets) setSnippets(savedSnippets);

        const savedEnvs = await store.get<EnvProfile[]>("envProfiles");
        if (savedEnvs) setEnvProfiles(savedEnvs);
        
        const savedLang = await store.get<Language>("language");
        if (savedLang) setLanguage(savedLang);

        const autostart = await checkAutostart();
        setIsAutostartEnabled(autostart);
      } catch (e) {
        console.error("Failed to load config", e);
      }
    };
    loadConfig();
  }, []);

  const handleToggleAutostart = async () => {
    try {
      if (isAutostartEnabled) {
        await disable();
        setIsAutostartEnabled(false);
      } else {
        await enable();
        setIsAutostartEnabled(true);
      }
    } catch (e) {
      console.error("Failed to toggle autostart", e);
    }
  };

  const handleLanguageChange = async (lang: Language) => {
    setLanguage(lang);
    await store.set("language", lang);
    await store.save();
  };

  const saveProjects = async (newProjects: Project[]) => {
    setProjects(newProjects);
    await store.set("projects", newProjects);
    await store.save();
  };

  const saveSnippets = async (newSnippets: CommandSnippet[]) => {
    setSnippets(newSnippets);
    await store.set("snippets", newSnippets);
    await store.save();
  };

  const saveEnvs = async (newEnvs: EnvProfile[]) => {
    setEnvProfiles(newEnvs);
    await store.set("envProfiles", newEnvs);
    await store.save();
  };

  const handleLaunch = async (project: Project) => {
    console.log("------------------------------------------");
    console.log("LAUNCH ENGINE START:", project.name);
    console.log("Integrated Terminal Flag:", !!project.useIntegratedTerminal);
    
    try {
      // 1. Open main IDE
      console.log("Step 1: Open IDE:", project.editor);
      await invoke("open_ide", { path: project.path, editor: project.editor });
      
      // 2. Run Main Project Commands
      for (const cmd of project.commands) {
        if (cmd.trim()) {
          const isIntegrated = project.useIntegratedTerminal === true;
          console.log(`Step 2: Command "${cmd}" | Mode: ${isIntegrated ? 'INTEGRATED' : 'EXTERNAL'}`);
          
          await invoke("run_terminal_command", { 
            args: {
              path: project.path, 
              command: cmd,
              integratedEditor: isIntegrated ? project.editor : null
            }
          });
        }
      }

      // 2.5 Auto-open Browser if requested
      if (project.autoOpenBrowser && project.url) {
        console.log("Auto-opening browser for main project in 3s...");
        setTimeout(() => {
          openUrl(project.url!).catch((err: unknown) => console.error("Failed to open URL:", err));
        }, 3000);
      }

      // 3. Run Sub-projects
      if (project.subProjects && project.subProjects.length > 0) {
        for (const sp of project.subProjects) {
          console.log(">>> Launching Sub-project:", sp.name);
          
          if (sp.path) {
            console.log("    Opening Sub-IDE:", sp.editor || "cursor");
            await invoke("open_ide", { path: sp.path, editor: sp.editor || "cursor" });
          }
          if (sp.command && sp.command.trim()) {
            const isIntegrated = sp.useIntegratedTerminal === true;
            console.log(`    Sub-command "${sp.command}" | Mode: ${isIntegrated ? 'INTEGRATED' : 'EXTERNAL'}`);
            
            await invoke("run_terminal_command", { 
              args: {
                path: sp.path, 
                command: sp.command,
                integratedEditor: isIntegrated ? (sp.editor || "cursor") : null
              }
            });
            
            if (sp.autoOpenBrowser && sp.url) {
              console.log(`Auto-opening browser for sub-project ${sp.name} in 3s...`);
              setTimeout(() => {
                openUrl(sp.url!).catch((err: unknown) => console.error("Failed to open URL:", err));
              }, 3000);
            }
          }
        }
      }

      console.log("LAUNCH ENGINE FINISHED");
      console.log("------------------------------------------");

      setProjects(prev => prev.map(p => 
        p.id === project.id ? { ...p, status: "Online" as const } : p
      ));
      
      console.log("LAUNCH ENGINE COMPLETE");
    } catch (e: any) {
      console.error("Launch failed:", e);
      setAlert({
        title: translations[language].modal.errorTitle || "Error de Lanzamiento",
        message: `No pudimos abrir el editor o ejecutar los comandos. Asegúrate de que "${project.editor}" esté correctamente instalado y accesible en tu sistema.\n\nDetalle: ${e.toString()}`
      });
    }
  };

  const handleAddOrUpdateProject = (project: Project) => {
    const exists = projects.find(p => p.id === project.id);
    if (exists) {
      saveProjects(projects.map(p => p.id === project.id ? project : p));
    } else {
      saveProjects([...projects, project]);
    }
    setEditingProject(null);
  };

  const handleAddOrUpdateSnippet = (snippet: CommandSnippet) => {
    const exists = snippets.find(s => s.id === snippet.id);
    if (exists) {
      saveSnippets(snippets.map(s => s.id === snippet.id ? snippet : s));
    } else {
      saveSnippets([...snippets, snippet]);
    }
    setEditingSnippet(null);
  };

  const handleAddOrUpdateEnv = (env: EnvProfile) => {
    const exists = envProfiles.find(e => e.id === env.id);
    if (exists) {
      saveEnvs(envProfiles.map(e => e.id === env.id ? env : e));
    } else {
      saveEnvs([...envProfiles, env]);
    }
    setEditingEnv(null);
  };

  const handleOpenEditProjectModal = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleOpenEditSnippetModal = (snippet: CommandSnippet) => {
    setEditingSnippet(snippet);
    setIsSnippetModalOpen(true);
  };

  const handleOpenEditEnvModal = (env: EnvProfile) => {
    setEditingEnv(env);
    setIsEnvModalOpen(true);
  };

  const handleOpenAddModal = () => {
    if (activeTab === "snippets") {
      setEditingSnippet(null);
      setIsSnippetModalOpen(true);
    } else if (activeTab === "env") {
      setEditingEnv(null);
      setIsEnvModalOpen(true);
    } else {
      setEditingProject(null);
      setIsModalOpen(true);
    }
  };

  const handleDeleteSnippet = (id: string) => {
    saveSnippets(snippets.filter(s => s.id !== id));
  };

  const handleDeleteEnv = (id: string) => {
    saveEnvs(envProfiles.filter(e => e.id !== id));
  };

  const handleDeleteProject = (id: string) => {
    saveProjects(projects.filter(p => p.id !== id));
  };

  return (
    <div className="app-container">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onAddProject={handleOpenAddModal} 
        translations={t.sidebar}
      />
      
      <main className="main-content">
        {activeTab === "projects" && (
          <ProjectGrid 
            projects={projects} 
            onLaunch={handleLaunch} 
            onOpenSettings={handleOpenEditProjectModal}
            onDelete={handleDeleteProject}
            onAddProject={handleOpenAddModal}
            translations={t.projects}
          />
        )}
        {activeTab === "snippets" && (
          <SnippetManager 
            snippets={snippets} 
            onEdit={handleOpenEditSnippetModal}
            onDelete={handleDeleteSnippet}
            onAddSnippet={handleOpenAddModal}
            translations={t.snippets}
          />
        )}
        {activeTab === "env" && (
          <EnvManager 
            profiles={envProfiles}
            onEdit={handleOpenEditEnvModal}
            onDelete={handleDeleteEnv}
            onAddEnv={handleOpenAddModal}
            translations={t.envManager}
          />
        )}
        {activeTab === "ports" && (
          <PortManager 
            translations={t.portManager} 
            projects={projects}
            onLaunch={handleLaunch}
          />
        )}
        {activeTab === "share" && (
          <ShareProject translations={t.share} />
        )}
        {activeTab === "hostnames" && (
          <HostnameManager translations={t.hostnames} />
        )}
        {activeTab === "settings" && (
          <div className="settings-view">
            <header className="settings-header">
              <h2>{t.settings.title}</h2>
            </header>

            <div className="settings-grid">
              <section className="settings-section glass-card">
                <h3>{t.settings.language}</h3>
                <div className="setting-control">
                  <select 
                    value={language} 
                    onChange={(e) => handleLanguageChange(e.target.value as Language)}
                    className="glass-select"
                  >
                    <option value="en">English (US)</option>
                    <option value="es">Español (ES)</option>
                  </select>
                </div>
              </section>

              <section className="settings-section glass-card">
                <div className="setting-header">
                  <h3>{t.settings.autostart}</h3>
                  <div className="toggle-switch">
                    <input 
                      type="checkbox" 
                      id="autostart-toggle" 
                      checked={isAutostartEnabled} 
                      onChange={handleToggleAutostart}
                    />
                    <label htmlFor="autostart-toggle"></label>
                  </div>
                </div>
                <p className="setting-desc">{t.settings.autostartDesc}</p>
              </section>
            </div>
          </div>
        )}
      </main>

      <NewProjectModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingProject(null);
        }} 
        onAdd={handleAddOrUpdateProject} 
        initialData={editingProject}
        translations={t.modal}
      />

      <NewSnippetModal
        isOpen={isSnippetModalOpen}
        onClose={() => {
          setIsSnippetModalOpen(false);
          setEditingSnippet(null);
        }}
        onSave={handleAddOrUpdateSnippet}
        initialData={editingSnippet}
        translations={t.snippets}
      />

      <NewEnvModal
        isOpen={isEnvModalOpen}
        onClose={() => {
          setIsEnvModalOpen(false);
          setEditingEnv(null);
        }}
        onSave={handleAddOrUpdateEnv}
        initialData={editingEnv}
        translations={t.envManager}
      />

      <AnimatePresence>
        {alert && (
          <div className="modal-overlay" style={{ zIndex: 1000 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-panel"
              style={{ padding: '24px', maxWidth: '400px', textAlign: 'center' }}
            >
              <h3 style={{ marginBottom: '12px', color: '#ff4444' }}>{alert.title}</h3>
              <p style={{ fontSize: '14px', marginBottom: '20px', opacity: 0.8, whiteSpace: 'pre-wrap' }}>{alert.message}</p>
              <button 
                className="glass-button glass-button-primary" 
                onClick={() => setAlert(null)}
                style={{ width: '100%' }}
              >
                Entendido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        .settings-view {
          padding: 40px;
          flex: 1;
          overflow-y: auto;
        }

        .settings-header {
          margin-bottom: 32px;
        }

        .settings-header h2 {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #fff 0%, #a855f7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 24px;
        }

        .settings-section {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .settings-section h3 {
          font-size: 16px;
          font-weight: 600;
        }

        .setting-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .setting-desc {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        /* Toggle Switch */
        .toggle-switch {
          position: relative;
          width: 50px;
          height: 26px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-switch label {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.1);
          transition: .4s;
          border-radius: 34px;
          border: 1px solid var(--glass-border);
        }

        .toggle-switch label:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }

        .toggle-switch input:checked + label {
          background-color: var(--status-online);
          box-shadow: 0 0 10px rgba(0, 255, 153, 0.3);
        }

        .toggle-switch input:checked + label:before {
          transform: translateX(24px);
        }

        .placeholder-view {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: var(--text-secondary);
        }

        .placeholder-view h2 {
          color: var(--text-primary);
        }
      `}} />
    </div>
  );
};

export default App;
