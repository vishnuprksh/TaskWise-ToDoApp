import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
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
  const dragOccurredRef = useRef(false);

  // Drag-to-resize state
  const [resizingTask, setResizingTask] = useState(null);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [resizeStartDuration, setResizeStartDuration] = useState(60);

  // Drag-to-move state
  const [draggingTask, setDraggingTask] = useState(null);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartMinutes, setDragStartMinutes] = useState(0);
  const [dragStartDateISO, setDragStartDateISO] = useState(null);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 6 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 6 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Handle global mouse move/up for resizing
  useEffect(() => {
    if (!resizingTask) return;

    const handleMouseMove = (e) => {
      const deltaY = e.clientY - resizeStartY;
      const deltaMinutes = Math.round(deltaY / (HOUR_HEIGHT / 60) / 15) * 15; // Snap to 15 min
      const newDuration = Math.max(15, resizeStartDuration + deltaMinutes);

      setResizingTask(prev => ({ ...prev, duration: newDuration }));
    };

    const handleMouseUp = () => {
      if (resizingTask) {
        updateTaskSchedule(resizingTask.id, new Date(resizingTask.scheduledAt), resizingTask.duration);
      }
      setResizingTask(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingTask, resizeStartY, resizeStartDuration]);

  // Handle global mouse move/up for dragging (move events between times and days)
  useEffect(() => {
    if (!draggingTask) return;

    const handleMouseMove = (e) => {
      const deltaY = e.clientY - dragStartY;
      const snapMinutes = 15;
      const deltaMinutes = Math.round(deltaY / (HOUR_HEIGHT / 60) / snapMinutes) * snapMinutes;

      let newTotalMinutes = dragStartMinutes + deltaMinutes;
      newTotalMinutes = Math.max(0, Math.min(23 * 60 + 45, newTotalMinutes));

      const newDate = new Date(dragStartDateISO);
      newDate.setHours(Math.floor(newTotalMinutes / 60));
      newDate.setMinutes(newTotalMinutes % 60);
      newDate.setSeconds(0);

      // Detect target calendar column via data-date attribute
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const colEl = el?.closest('[data-date]');
      if (colEl) {
        const dateStr = colEl.getAttribute('data-date');
        const colDate = new Date(dateStr + 'T00:00:00');
        newDate.setFullYear(colDate.getFullYear());
        newDate.setMonth(colDate.getMonth());
        newDate.setDate(colDate.getDate());
      }

      dragOccurredRef.current = true;
      setDraggingTask(prev => ({ ...prev, scheduledAt: newDate.toISOString() }));
    };

    const handleMouseUp = () => {
      if (draggingTask) {
        updateTaskSchedule(draggingTask.id, new Date(draggingTask.scheduledAt), draggingTask.duration);
      }
      setDraggingTask(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingTask, dragStartY, dragStartMinutes, dragStartDateISO]);

  useEffect(() => {
    // Scroll to current time or 6 AM if scrollRef.current is available
    if (scrollRef.current) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const scrollPosition = Math.max(0, (currentMinutes * (HOUR_HEIGHT / 60)) - 100); // 100px offset to see a bit above
      scrollRef.current.scrollTop = scrollPosition;
    }
  }, []);

  const getDayTasks = (date) => {
    return tasks.filter(
      (t) =>
        isValidDate(t.scheduledAt) &&
        isSameDay(new Date(t.scheduledAt), date) &&
        !(draggingTask && draggingTask.id === t.id) // hide original while dragging
    );
  };

  const startResize = (e, task) => {
    e.stopPropagation();
    setResizingTask(task);
    setResizeStartY(e.clientY);
    setResizeStartDuration(task.duration || 60);
  };

  const startDrag = (e, task) => {
    if (e.button !== 0) return; // left button only
    e.preventDefault();
    e.stopPropagation();
    dragOccurredRef.current = false;
    const d = new Date(task.scheduledAt);
    setDraggingTask({ ...task });
    setDragStartY(e.clientY);
    setDragStartMinutes(d.getHours() * 60 + d.getMinutes());
    setDragStartDateISO(task.scheduledAt);
  };

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

  const handleScheduleUpdate = (taskId, date, duration) => {
    updateTaskSchedule(taskId, date, duration, true);
    setIsScheduleModalOpen(false);
    setTaskToEdit(null);
  };

  const handleDuplicate = (taskId, date, duration) => {
    duplicateTask(taskId, date, duration, true);
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
          <button onClick={() => setSelectedDate(subDays(selectedDate, 7))}><ChevronLeft size={22} /></button>
          <div style={{ textAlign: 'center', cursor: 'pointer' }} onDoubleClick={() => setSelectedDate(new Date())}>
            <div className="calendar-date-title">
              {format(weekStart, 'MMM d')} – {format(weekEnd, isSameDay(weekStart, weekEnd) ? 'MMM d' : 'MMM d, yyyy')}
            </div>
          </div>
          <button onClick={() => setSelectedDate(addDays(selectedDate, 7))}><ChevronRight size={22} /></button>
        </div>
        <div style={{ width: 140 }}>
          <input
            type="date"
            className="form-input"
            style={{ padding: '8px 12px', fontSize: 14 }}
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => e.target.value && setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
          />
        </div>
      </div>

      <div className="calendar-grid-header">
        {weekDays.map((date) => (
          <div key={date.toString()} className={`calendar-day-header ${isSameDay(date, new Date()) ? 'today' : ''}`}>
            <div className="calendar-day-name">{format(date, 'EEE')}</div>
            <div className="calendar-day-number">{format(date, 'd')}</div>
          </div>
        ))}
      </div>

      <div className="page-body" ref={scrollRef} style={{ padding: 0 }}>
        <div className="timeline-container">
          <div className="time-grid-background">
            {renderTimeLines()}
          </div>

          <div className="calendar-columns">
            {weekDays.map((date) => {
              const isToday = isSameDay(date, new Date());
              const dayTasks = getDayTasks(date);
              const dateStr = format(date, 'yyyy-MM-dd');

              // Show dragging live-preview in whatever column it's hovering over
              const dragPreview = draggingTask && isSameDay(new Date(draggingTask.scheduledAt), date)
                ? draggingTask : null;

              return (
                <div
                  key={date.toString()}
                  data-date={dateStr}
                  className={`calendar-column ${isToday ? 'today' : ''}`}
                  style={{ cursor: draggingTask ? 'grabbing' : 'default' }}
                >
                  {isToday && (
                    <div className="current-time-line" style={{ top: nowMinutes * (HOUR_HEIGHT / 60) }} />
                  )}

                  {dayTasks.map((task) => {
                    // Use resizing task if this is the one being resized
                    const displayTask = (resizingTask && resizingTask.id === task.id) ? resizingTask : task;

                    const startDate = new Date(displayTask.scheduledAt);
                    const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
                    const duration = displayTask.duration || 60;
                    const top = startMinutes * (HOUR_HEIGHT / 60);
                    const height = duration * (HOUR_HEIGHT / 60);
                    const project = getProject(displayTask.projectId);
                    const endTime = new Date(startDate.getTime() + duration * 60000);
                    const isPast = endTime < new Date();
                    const isResizing = resizingTask && resizingTask.id === task.id;

                    return (
                      <div
                        key={task.id}
                        data-date={dateStr}
                        className={`calendar-event ${isPast ? 'past' : ''} ${isResizing ? 'resizing' : ''}`}
                        style={{
                          top,
                          height,
                          backgroundColor: project ? project.color : '#6366f1',
                          cursor: 'grab',
                          userSelect: 'none',
                        }}
                        onMouseDown={(e) => !isResizing && startDrag(e, task)}
                        onClick={(e) => {
                          if (!isResizing && !dragOccurredRef.current) {
                            e.stopPropagation();
                            handleEventPress(task);
                          }
                          dragOccurredRef.current = false;
                        }}
                      >
                        <div className="calendar-event-text" title={displayTask.text}>{displayTask.text}</div>
                        <div className="calendar-event-time">
                          {safeFormat(startDate, 'h:mm a')} – {safeFormat(endTime, 'h:mm a')}
                          {isResizing && ` (${duration}m)`}
                        </div>
                        <div
                          className="calendar-event-resize-handle"
                          onMouseDown={(e) => { e.stopPropagation(); startResize(e, task); }}
                        />
                      </div>
                    );
                  })}

                  {/* Live drag preview in target column */}
                  {dragPreview && (() => {
                    const previewDate = new Date(dragPreview.scheduledAt);
                    const previewMinutes = previewDate.getHours() * 60 + previewDate.getMinutes();
                    const previewDuration = dragPreview.duration || 60;
                    const previewTop = previewMinutes * (HOUR_HEIGHT / 60);
                    const previewHeight = previewDuration * (HOUR_HEIGHT / 60);
                    const previewProject = getProject(dragPreview.projectId);
                    const previewEnd = new Date(previewDate.getTime() + previewDuration * 60000);
                    return (
                      <div
                        className="calendar-event dragging"
                        style={{
                          top: previewTop,
                          height: previewHeight,
                          backgroundColor: previewProject ? previewProject.color : '#6366f1',
                          pointerEvents: 'none',
                          opacity: 0.85,
                          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                          transform: 'scale(1.02)',
                          zIndex: 200,
                        }}
                      >
                        <div className="calendar-event-text">{dragPreview.text}</div>
                        <div className="calendar-event-time">
                          {safeFormat(previewDate, 'h:mm a')} – {safeFormat(previewEnd, 'h:mm a')}
                          {` (${previewDuration}m)`}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
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
