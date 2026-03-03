import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { isValidDate, roundToNearest15Minutes } from '../utils/time';
import TaskItem from '../components/TaskItem';
import TaskForm from '../components/TaskForm';
import ScheduleModal from '../components/ScheduleModal';
import ProjectForm from '../components/ProjectForm';

export default function HomePage({ onNavigateTimer }) {
  const { tasks, projects, updateTasks, updateProjects, calculatePriorityScore, updateTaskSchedule, findNextAvailableSlot } = useApp();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [taskToSchedule, setTaskToSchedule] = useState(null);
  const [defaultTime, setDefaultTime] = useState(null);
  const [selectedFilterProject, setSelectedFilterProject] = useState(null);
  const [isFinishedExpanded, setIsFinishedExpanded] = useState(false);

  // Task form state
  const [editingTask, setEditingTask] = useState(null);
  const [taskText, setTaskText] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectSearchText, setProjectSearchText] = useState('');
  const [attributes, setAttributes] = useState({ easiness: 'high', importance: 'high', emergency: 'high', interest: 'high' });
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectColor, setProjectColor] = useState('#3b82f6');

  const handleSaveTask = () => {
    if (!taskText.trim()) return;
    const priorityScore = calculatePriorityScore(attributes);
    const newTask = {
      ...(editingTask || {}),
      id: editingTask ? editingTask.id : Date.now().toString(),
      text: taskText,
      completed: editingTask ? editingTask.completed : false,
      projectId: selectedProject,
      attributes,
      priorityScore,
      startDate: startDate || null,
      endDate: endDate || null,
    };

    let newTasks;
    if (editingTask) {
      newTasks = tasks.map((t) => (t.id === editingTask.id ? newTask : t));
    } else {
      newTasks = [...tasks, newTask];
    }
    updateTasks(newTasks);
    closeTaskModal();
  };

  const handleSaveProject = () => {
    if (!projectName.trim()) return;
    const newProject = {
      id: Date.now().toString(),
      name: projectName,
      color: projectColor,
      archived: false,
    };
    updateProjects([...projects, newProject]);
    setShowProjectModal(false);
    setProjectName('');
    setSelectedProject(newProject.id);
    setIsTaskModalOpen(true);
  };

  const deleteTask = (id) => {
    if (window.confirm('Delete this task?')) {
      updateTasks(tasks.filter((t) => t.id !== id));
    }
  };

  const toggleTask = (id) => {
    updateTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const openTaskModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setTaskText(task.text);
      setSelectedProject(task.projectId);
      setAttributes(task.attributes || { easiness: 'medium', importance: 'medium', emergency: 'medium', interest: 'medium' });
      setStartDate(isValidDate(task.startDate) ? task.startDate.slice(0, 10) : null);
      setEndDate(isValidDate(task.endDate) ? task.endDate.slice(0, 10) : null);
    } else {
      setEditingTask(null);
      setTaskText('');
      setSelectedProject(selectedFilterProject || (projects.length > 0 ? projects[0].id : null));
      setProjectSearchText('');
      setAttributes({ easiness: 'high', importance: 'high', emergency: 'high', interest: 'high' });
      setStartDate(null);
      setEndDate(null);
    }
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => setIsTaskModalOpen(false);

  const handleSchedule = (task) => {
    setTaskToSchedule(task);
    if (!task.scheduledAt) {
      // New schedule, compute default time
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextSlot = findNextAvailableSlot(today, task.duration || 60);
      setDefaultTime(roundToNearest15Minutes(nextSlot));
    } else {
      setDefaultTime(null);
    }
    setIsScheduleModalOpen(true);
  };

  const handleScheduleTask = (taskId, date, duration) => {
    updateTaskSchedule(taskId, date, duration, true);
    setIsScheduleModalOpen(false);
    setTaskToSchedule(null);
  };

  const getProject = (id) => projects.find((p) => p.id === id);

  const filteredTasks = tasks.filter((t) => {
    const project = getProject(t.projectId);
    if (selectedFilterProject && t.projectId !== selectedFilterProject) return false;
    return !project || !project.archived;
  });

  const activeTasks = filteredTasks.filter((t) => !t.completed);
  const finishedTasks = filteredTasks.filter((t) => t.completed);

  return (
    <>
      <div className="page-header">
        <div>
          <h2>{selectedFilterProject ? getProject(selectedFilterProject)?.name : 'Tasks'}</h2>
          <div className="page-header-subtitle">Stay organized, stay ahead.</div>
        </div>
        <button className="btn btn-primary" onClick={() => openTaskModal()}>
          <Plus size={18} /> New Task
        </button>
      </div>

      <div className="page-body">
        {/* Filter Bar */}
        <div className="filter-bar">
          <button
            className={`filter-chip ${!selectedFilterProject ? 'active' : ''}`}
            onClick={() => setSelectedFilterProject(null)}
          >
            All
          </button>
          {projects.filter((p) => !p.archived).map((p) => (
            <button
              key={p.id}
              className={`filter-chip ${selectedFilterProject === p.id ? 'active' : ''}`}
              style={selectedFilterProject === p.id ? { borderColor: p.color } : {}}
              onClick={() => setSelectedFilterProject(p.id)}
            >
              <span className="project-dot" style={{ backgroundColor: selectedFilterProject === p.id ? p.color : '#64748b' }} />
              {p.name}
            </button>
          ))}
        </div>

        {/* Active Tasks */}
        {activeTasks.length > 0 ? (
          activeTasks.map((item) => (
            <TaskItem
              key={item.id}
              item={item}
              project={getProject(item.projectId)}
              onEdit={openTaskModal}
              onToggle={toggleTask}
              onTimer={onNavigateTimer}
              onDelete={deleteTask}
              onSchedule={handleSchedule}
            />
          ))
        ) : finishedTasks.length === 0 ? (
          <div className="empty-state">No tasks found. Click "New Task" to get started!</div>
        ) : null}

        {/* Finished Tasks */}
        {finishedTasks.length > 0 && (
          <div className="finished-section">
            <button className="finished-header" onClick={() => setIsFinishedExpanded(!isFinishedExpanded)}>
              {isFinishedExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              Finished ({finishedTasks.length})
            </button>
            {isFinishedExpanded && finishedTasks.map((item) => (
              <TaskItem
                key={item.id}
                item={item}
                project={getProject(item.projectId)}
                onEdit={openTaskModal}
                onToggle={toggleTask}
                onTimer={onNavigateTimer}
                onDelete={deleteTask}
              />
            ))}
          </div>
        )}
      </div>

      {/* Task Form Modal */}
      {isTaskModalOpen && (
        <TaskForm
          isEditing={!!editingTask}
          taskText={taskText} setTaskText={setTaskText}
          projects={projects}
          selectedProject={selectedProject} setSelectedProject={setSelectedProject}
          projectSearchText={projectSearchText} setProjectSearchText={setProjectSearchText}
          attributes={attributes} setAttributes={setAttributes}
          startDate={startDate} setStartDate={setStartDate}
          endDate={endDate} setEndDate={setEndDate}
          onSave={handleSaveTask}
          onClose={closeTaskModal}
          onNewProject={() => { closeTaskModal(); setShowProjectModal(true); }}
        />
      )}

      {/* Schedule Modal */}
      <ScheduleModal
        visible={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSchedule={handleScheduleTask}
        task={taskToSchedule}
        initialDate={taskToSchedule?.scheduledAt}
        defaultTime={defaultTime}
      />

      {showProjectModal && (
        <ProjectForm
          name={projectName} setName={setProjectName}
          color={projectColor} setColor={setProjectColor}
          onSave={handleSaveProject}
          onClose={() => setShowProjectModal(false)}
        />
      )}
    </>
  );
}
