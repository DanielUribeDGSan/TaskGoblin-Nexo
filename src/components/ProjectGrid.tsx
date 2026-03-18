import React from 'react';
import { Plus, Search } from 'lucide-react';
import ProjectCard, { Project } from './ProjectCard';
import { motion, AnimatePresence } from 'framer-motion';
import { containerVariants, itemVariants, listVariants } from '../constants/animations';

interface ProjectGridProps {
  projects: Project[];
  onLaunch: (project: Project) => void;
  onOpenSettings: (project: Project) => void;
  onDelete: (id: string) => void;
  onAddProject: () => void;
  translations: {
    noProjects: string;
    launchAll: string;
    newProject: string;
    heroTitle: string;
    heroSubtitle: string;
    status: {
      online: string;
      stopped: string;
      building: string;
      launching: string;
    }
    searchPlaceholder: string;
    deleteConfirm: string;
  };
}

const ProjectGrid: React.FC<ProjectGridProps> = ({ projects, onLaunch, onOpenSettings, onDelete, onAddProject, translations }) => {
  const [search, setSearch] = React.useState('');

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.path.toLowerCase().includes(search.toLowerCase()) ||
    (p.framework && p.framework.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <motion.div 
      className="grid-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.header className="grid-header" variants={itemVariants}>
        <div className="hero-section">
          <div className="hero-title-wrapper">
            <motion.img 
              src="/icon/computer.png" 
              alt="Globe" 
              className="hero-icon"
              animate={{ 
                y: [0, -10, 0] 
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
            <h1 className="grid-title">{translations.heroTitle}</h1>
          </div>
          <p className="hero-subtitle">{translations.heroSubtitle}</p>
        </div>
      </motion.header>
      
      <motion.div className="search-bar glass-card" variants={itemVariants}>
        <Search size={20} className="search-icon" />
        <input 
          type="text" 
          placeholder={translations.searchPlaceholder} 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </motion.div>

      <motion.div className="projects-grid" variants={listVariants}>
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project) => (
            <motion.div key={project.id} variants={itemVariants}>
              <ProjectCard 
                project={project} 
                onLaunch={onLaunch} 
                onOpenSettings={onOpenSettings} 
                onDelete={onDelete}
                translations={{...translations.status, deleteConfirm: translations.deleteConfirm}}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        <motion.button 
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="glass-card add-project-card"
          onClick={onAddProject}
        >
          <div className="add-content">
            <div className="add-icon-circle">
              <Plus size={32} />
            </div>
            <div className="add-text">
              <h3>{translations.newProject}</h3>
            </div>
          </div>
        </motion.button>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        .grid-container {
          flex: 1;
          padding: 40px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .grid-header {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .hero-section {
          max-width: 600px;
        }

        .grid-title {
          font-size: 42px;
          font-weight: 800;
          background: linear-gradient(135deg, #fff 0%, #a855f7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0;
        }

        .hero-title-wrapper {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 8px;
        }

        .hero-icon {
          width: 48px;
          height: 48px;
          object-fit: contain;
        }

        .hero-subtitle {
          font-size: 16px;
          color: var(--text-secondary);
          line-height: 1.6;
          opacity: 0.8;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          margin-bottom: 8px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.05);
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

        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .add-project-card {
          min-height: 240px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.02);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .add-project-card:hover {
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

        .add-text {
          text-align: center;
        }

        .add-text h3 {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .add-text p {
          font-size: 14px;
          opacity: 0.6;
        }
      `}} />
    </motion.div>
  );
};

export default ProjectGrid;
