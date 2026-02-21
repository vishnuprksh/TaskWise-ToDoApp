import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ProjectItem from '../components/ProjectItem';
import ProjectForm from '../components/ProjectForm';

export default function ProjectsPage() {
  const { projects, tasks, updateProjects, updateTasks } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [projectColor, setProjectColor] = useState('#3b82f6');

  const handleSave = () => {
    if (!projectName.trim()) return;
    const newProject = {
      id: editingProject ? editingProject.id : Date.now().toString(),
      name: projectName,
      color: projectColor,
      archived: editingProject ? editingProject.archived : false,
    };

    let newProjects;
    if (editingProject) {
      newProjects = projects.map((p) => (p.id === editingProject.id ? newProject : p));
    } else {
      newProjects = [...projects, newProject];
    }
    updateProjects(newProjects);
    closeModal();
  };

  const deleteProject = (id) => {
    if (window.confirm('Delete this project? Tasks will remain but lose their project tag.')) {
      updateProjects(projects.filter((p) => p.id !== id));
      updateTasks(tasks.map((t) => (t.projectId === id ? { ...t, projectId: null } : t)));
    }
  };

  const toggleArchive = (id) => {
    updateProjects(projects.map((p) => (p.id === id ? { ...p, archived: !p.archived } : p)));
  };

  const openModal = (project = null) => {
    if (project) {
      setEditingProject(project);
      setProjectName(project.name);
      setProjectColor(project.color);
    } else {
      setEditingProject(null);
      setProjectName('');
      setProjectColor('#3b82f6');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const getProjectTotalTime = (projectId) =>
    tasks.filter((t) => t.projectId === projectId).reduce((acc, t) => acc + (t.timeSpent || 0), 0);

  return (
    <>
      <div className="page-header">
        <h2>Projects</h2>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} /> New Project
        </button>
      </div>
      <div className="page-body">
        {projects.length === 0 ? (
          <div className="empty-state">No projects yet.</div>
        ) : (
          projects.map((item) => (
            <ProjectItem
              key={item.id}
              item={item}
              totalTime={getProjectTotalTime(item.id)}
              onEdit={openModal}
              onToggleArchive={toggleArchive}
              onDelete={deleteProject}
            />
          ))
        )}
      </div>

      {isModalOpen && (
        <ProjectForm
          name={projectName}
          setName={setProjectName}
          color={projectColor}
          setColor={setProjectColor}
          isEditing={!!editingProject}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </>
  );
}
