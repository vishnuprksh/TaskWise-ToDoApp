import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { useApp } from '../context/AppContext';
import { isValidDate, safeFormat } from '../utils/time';
import ScheduleModal from '../components/ScheduleModal';

const HOUR_HEIGHT = 80;

export default function CalendarPage() {
  const { tasks, updateTaskSchedule, projects, duplicateTask, cancelTaskSchedule } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    // Scroll to ~8 AM on load
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 8 * HOUR_HEIGHT - 40;
    }
  }, []);

  const dayTasks = tasks.filter(
    (t) => isValidDate(t.scheduledAt) && isSameDay(new Date(t.scheduledAt), selectedDate)
  );

  const handleUpdateTask = (taskId, updates) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !isValidDate(task.scheduledAt)) return;
    if (updates.newHours !== undefined) {
      const newDate = new Date(task.scheduledAt);
      newDate.setHours(updates.newHours);
      newDate.setMinutes(updates.newMinutes);
      updateTaskSchedule(taskId, newDate, task.duration);
    }
    if (updates.newDuration !== undefined) {
      updateTaskSchedule(taskId, new Date(task.scheduledAt), updates.newDuration);
    }
  };

  const getProject = (id) => projects.find((p) => p.id === id);

  const handleEventPress = (task) => {
    setTaskToEdit(task);
    setIsScheduleModalOpen(true);
  };

  const handleScheduleUpdate = (taskId, date) => {
    updateTaskSchedule(taskId, date);
    setIsScheduleModalOpen(false);
    setTaskToEdit(null);
  };

  const handleDuplicate = (taskId, date) => {
    duplicateTask(taskId, date);
    setIsScheduleModalOpen(false);
    setTaskToEdit(null);
  };

  const handleDeleteEvent = (taskId) => {
    cancelTaskSchedule(taskId);
    setIsScheduleModalOpen(false);
    setTaskToEdit(null);
  };

  const renderTimeLines = () => {
    const lines = [];
    for (let i = 0; i < 24; i++) {
      lines.push(
        <div key={i} className="time-row" style={{ top: i * HOUR_HEIGHT }}>
          <span className="time-label">
            {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
          </span>
          <div className="grid-line" />
        </div>
      );
    }
    return lines;
  };

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  return (
    <>
      <div className="page-header">
        <h2>Calendar</h2>
        <div className="calendar-nav">
          <button onClick={() => setSelectedDate(subDays(selectedDate, 1))}><ChevronLeft size={22} /></button>
          <div style={{ textAlign: 'center', cursor: 'pointer' }} onDoubleClick={() => setSelectedDate(new Date())}>
            <div className="calendar-date-title">{format(selectedDate, 'MMMM d')}</div>
            <div className="calendar-date-subtitle">{format(selectedDate, 'EEEE')}</div>
          </div>
          <button onClick={() => setSelectedDate(addDays(selectedDate, 1))}><ChevronRight size={22} /></button>
        </div>
        <div style={{ width: 100 }}>
          <input
            type="date"
            className="form-input"
            style={{ padding: '8px 12px', fontSize: 14 }}
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => e.target.value && setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
          />
        </div>
      </div>

      <div className="page-body" ref={scrollRef} style={{ padding: 0 }}>
        <div className="timeline-container">
          {renderTimeLines()}

          {/* Current time line */}
          {isSameDay(selectedDate, new Date()) && (
            <div className="current-time-line" style={{ top: nowMinutes * (HOUR_HEIGHT / 60) }}>
              <div className="current-time-dot" />
            </div>
          )}

          {/* Events */}
          {dayTasks.map((task) => {
            const startDate = isValidDate(task.scheduledAt) ? new Date(task.scheduledAt) : new Date();
            const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
            const duration = task.duration || 60;
            const top = startMinutes * (HOUR_HEIGHT / 60);
            const height = duration * (HOUR_HEIGHT / 60);
            const project = getProject(task.projectId);
            const endTime = new Date(startDate.getTime() + duration * 60000);
            const isPast = endTime < new Date();

            return (
              <div
                key={task.id}
                className={`calendar-event ${isPast ? 'past' : ''}`}
                style={{
                  top,
                  height,
                  backgroundColor: project ? project.color : '#6366f1',
                }}
                onClick={() => handleEventPress(task)}
              >
                <div className="calendar-event-text">{task.text}</div>
                <div className="calendar-event-time">{safeFormat(startDate, 'h:mm a')}</div>
              </div>
            );
          })}
        </div>
      </div>

      <ScheduleModal
        visible={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSchedule={handleScheduleUpdate}
        onDelete={handleDeleteEvent}
        onDuplicate={handleDuplicate}
        task={taskToEdit}
        initialDate={taskToEdit?.scheduledAt}
      />
    </>
  );
}
