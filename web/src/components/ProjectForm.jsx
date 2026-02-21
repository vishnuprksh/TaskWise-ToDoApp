import React from 'react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ProjectForm({ name, setName, color, setColor, isEditing, onSave, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h3>{isEditing ? 'Edit Project' : 'New Project'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <label className="form-label">Project Name</label>
        <input
          className="form-input"
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <label className="form-label">Color</label>
        <div className="color-selector">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`color-option ${color === c ? 'active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
              type="button"
            />
          ))}
        </div>

        <button className="btn btn-primary" style={{ width: '100%', marginTop: 24, padding: 16 }} onClick={onSave}>
          {isEditing ? 'Update Project' : 'Add Project'}
        </button>
      </div>
    </div>
  );
}
