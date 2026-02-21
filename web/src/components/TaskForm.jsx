import React, { useState } from 'react';
import { X, Search, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { safeFormat } from '../utils/time';
import AttributeSelector from './AttributeSelector';

export default function TaskForm({
  isEditing,
  taskText, setTaskText,
  projects,
  selectedProject, setSelectedProject,
  projectSearchText, setProjectSearchText,
  attributes, setAttributes,
  startDate, setStartDate,
  endDate, setEndDate,
  onSave, onClose,
  onNewProject,
}) {
  const [isAttributesExpanded, setIsAttributesExpanded] = useState(false);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEditing ? 'Edit Task' : 'New Task'}</h3>
          <button className="modal-close" onClick={onClose}><X size={22} /></button>
        </div>

        <label className="form-label">Task Name</label>
        <input
          className="form-input"
          placeholder="What needs to be done?"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          autoFocus
        />

        <label className="form-label">Project</label>
        <div className="search-input-container">
          <Search size={16} />
          <input
            placeholder="Search projects..."
            value={projectSearchText}
            onChange={(e) => setProjectSearchText(e.target.value)}
          />
        </div>
        <div className="project-pills">
          {projects
            .filter((p) => !p.archived && p.name.toLowerCase().includes(projectSearchText.toLowerCase()))
            .map((p) => (
              <button
                key={p.id}
                className={`project-pill ${selectedProject === p.id ? 'active' : ''}`}
                style={selectedProject === p.id ? { backgroundColor: p.color, borderColor: p.color } : {}}
                onClick={() => setSelectedProject(p.id)}
                type="button"
              >
                {p.name}
              </button>
            ))}
          <button className="project-pill new-project" onClick={onNewProject} type="button">
            <Plus size={14} /> New
          </button>
        </div>

        <div className="divider" />

        <div className="section-title">Timeline (Optional)</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="form-label" style={{ marginTop: 0 }}>Start Date</label>
            <input
              type="date"
              className="form-input"
              value={startDate || ''}
              onChange={(e) => setStartDate(e.target.value || null)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="form-label" style={{ marginTop: 0 }}>End Date</label>
            <input
              type="date"
              className="form-input"
              value={endDate || ''}
              onChange={(e) => setEndDate(e.target.value || null)}
            />
          </div>
        </div>

        <div className="divider" />

        <div className="expandable-header" onClick={() => setIsAttributesExpanded(!isAttributesExpanded)}>
          <span className="section-title" style={{ marginBottom: 0 }}>Priority Attributes</span>
          {isAttributesExpanded ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
        </div>

        {isAttributesExpanded && (
          <div style={{ marginTop: 12 }}>
            <AttributeSelector label="Easiness (40%)" value={attributes.easiness} onChange={(v) => setAttributes({ ...attributes, easiness: v })} />
            <AttributeSelector label="Importance (30%)" value={attributes.importance} onChange={(v) => setAttributes({ ...attributes, importance: v })} />
            <AttributeSelector label="Emergency (20%)" value={attributes.emergency} onChange={(v) => setAttributes({ ...attributes, emergency: v })} />
            <AttributeSelector label="Interest (10%)" value={attributes.interest} onChange={(v) => setAttributes({ ...attributes, interest: v })} />
          </div>
        )}

        <button className="btn btn-primary" style={{ width: '100%', marginTop: 20, padding: 16 }} onClick={onSave}>
          Save Task
        </button>
      </div>
    </div>
  );
}
