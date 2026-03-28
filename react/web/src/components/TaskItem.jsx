import React from 'react';
import { CheckCircle2, Circle, PlayCircle, Clock, Flag, CalendarRange, Trash2 } from 'lucide-react';
import { formatTime, safeFormat, isValidDate, isSameDay } from '../utils/time';

export default function TaskItem({ item, project, onEdit, onToggle, onTimer, onDelete, onSchedule }) {
  const progress = (() => {
    if (!isValidDate(item.startDate) || !isValidDate(item.endDate)) return null;
    const start = new Date(item.startDate).getTime();
    const end = new Date(item.endDate).getTime();
    if (end <= start) return 0;
    return Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100));
  })();

  const isUpcoming = isValidDate(item.scheduledAt) && new Date(item.scheduledAt) > new Date();

  return (
    <div className={`task-item ${isUpcoming ? 'has-upcoming' : ''}`} onClick={() => onEdit(item)}>
      <div className="task-left">
        <button
          className={`task-checkbox ${item.completed ? 'completed' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggle(item.id); }}
        >
          {item.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
        </button>
        <div className="task-content">
          <div className={`task-text ${item.completed ? 'completed' : ''}`}>{item.text}</div>
          <div className="task-meta">
            {project && (
              <span className="task-tag" style={{ backgroundColor: project.color + '20', color: project.color }}>
                <span className="project-dot" style={{ backgroundColor: project.color }} />
                {project.name}
              </span>
            )}
            <span className="task-tag priority-tag">
              <Flag size={12} />
              {typeof item.priorityScore === 'number' ? item.priorityScore.toFixed(1) : '0.0'}
            </span>
            {item.timeSpent > 0 && (
              <span className="task-tag time-tag">
                <Clock size={12} />
                {formatTime(item.timeSpent)}
              </span>
            )}
            {isValidDate(item.scheduledAt) && (
              <span className={`task-tag ${isUpcoming ? 'upcoming-tag' : 'past-tag'}`}>
                <CalendarRange size={12} />
                {isSameDay(new Date(item.scheduledAt), new Date()) 
                  ? `Today at ${safeFormat(item.scheduledAt, 'h:mm a')}`
                  : safeFormat(item.scheduledAt, 'MMM d, h:mm a')}
              </span>
            )}
          </div>

          {(item.startDate || item.endDate) && !item.completed && (
            <div className="task-timeline">
              <div className="timeline-dates">
                {isValidDate(item.startDate) && (
                  <span className="timeline-date-text">Start: {safeFormat(item.startDate, 'MMM d')}</span>
                )}
                {isValidDate(item.endDate) && (
                  <span className="timeline-date-text">End: {safeFormat(item.endDate, 'MMM d')}</span>
                )}
              </div>
              {progress !== null && (
                <div className="timeline-progress">
                  <div className="timeline-progress-fill" style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="task-actions">
        {onSchedule && (
          <button className="task-action-btn schedule" title="Schedule" onClick={(e) => { e.stopPropagation(); onSchedule(item); }}>
            <CalendarRange size={18} />
          </button>
        )}
        {onTimer && (
          <button className="task-action-btn play" title="Start Timer" onClick={(e) => { e.stopPropagation(); onTimer(item); }}>
            <PlayCircle size={18} />
          </button>
        )}
        {onDelete && (
          <button className="task-action-btn delete" title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}>
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
