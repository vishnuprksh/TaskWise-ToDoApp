import React from 'react';
import { Clock, Eye, EyeOff, Trash2 } from 'lucide-react';
import { formatTime } from '../utils/time';

export default function ProjectItem({ item, totalTime, onEdit, onToggleArchive, onDelete }) {
  return (
    <div className="project-list-item" onClick={() => onEdit(item)}>
      <div className="project-list-left">
        <div className="project-list-dot" style={{ backgroundColor: item.color }} />
        <span className="project-list-name">{item.name}</span>
        {item.archived && <span className="archived-badge">Archived</span>}
      </div>
      <div className="project-list-right">
        <span className="time-badge">
          <Clock size={12} />
          {formatTime(totalTime)}
        </span>
        <button
          className="btn-ghost btn-icon"
          onClick={(e) => { e.stopPropagation(); onToggleArchive(item.id); }}
          title={item.archived ? 'Show' : 'Archive'}
        >
          {item.archived ? <EyeOff size={18} color="#f59e0b" /> : <Eye size={18} color="#64748b" />}
        </button>
        <button
          className="btn-ghost btn-icon"
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
          title="Delete"
        >
          <Trash2 size={18} color="#ef4444" />
        </button>
      </div>
    </div>
  );
}
