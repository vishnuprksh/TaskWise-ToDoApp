import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, Copy, Trash2, Calendar as CalendarIcon, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameDay, isSameMonth } from 'date-fns';
import { isValidDate } from '../utils/time';

export default function ScheduleModal({ visible, onClose, onSchedule, onDelete, onDuplicate, task, initialDate }) {
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [hasTime, setHasTime] = useState(false);
  const [hours, setHours] = useState(9);
  const [minutes, setMinutes] = useState(0);
  const [duration, setDuration] = useState(60);

  useEffect(() => {
    if (visible && isValidDate(initialDate)) {
      const d = new Date(initialDate);
      setSelectedDate(d);
      setViewMonth(d);
      setHours(d.getHours());
      setMinutes(d.getMinutes());
      setDuration(task.duration || 60);
      setHasTime(true);
    } else if (visible) {
      const now = new Date();
      setSelectedDate(now);
      setViewMonth(now);
      setHasTime(false);
      setHours(9);
      setMinutes(0);
      setDuration(60);
    }
  }, [visible, initialDate, task]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    const days = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [viewMonth]);

  const getFinalDate = () => {
    const d = new Date(selectedDate);
    d.setHours(hasTime ? hours : 9, hasTime ? minutes : 0, 0, 0);
    return d;
  };

  const handleSave = () => {
    onSchedule(task.id, getFinalDate(), duration);
    onClose();
  };

  const handleDuplicate = () => {
    onDuplicate?.(task.id, getFinalDate(), duration);
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h3>Schedule Task</h3>
          <button className="modal-close" onClick={onClose}><X size={22} /></button>
        </div>

        {task && <div style={{ color: '#94a3b8', marginBottom: 16, fontWeight: 600 }}>{task.text}</div>}

        {/* Mini Calendar */}
        <div className="schedule-calendar">
          <div className="schedule-calendar-header">
            <button className="btn-ghost" onClick={() => setViewMonth(subMonths(viewMonth, 1))}><ChevronLeft size={18} /></button>
            <span className="schedule-calendar-title">{format(viewMonth, 'MMMM yyyy')}</span>
            <button className="btn-ghost" onClick={() => setViewMonth(addMonths(viewMonth, 1))}><ChevronRight size={18} /></button>
          </div>
          <div className="schedule-calendar-grid">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d} className="schedule-day-header">{d}</div>
            ))}
            {calendarDays.map((day, i) => (
              <button
                key={i}
                className={`schedule-day ${isSameDay(day, new Date()) ? 'today' : ''} ${isSameDay(day, selectedDate) ? 'selected' : ''} ${!isSameMonth(day, viewMonth) ? 'other-month' : ''}`}
                onClick={() => setSelectedDate(day)}
              >
                {format(day, 'd')}
              </button>
            ))}
          </div>
        </div>

        {/* Time Toggle */}
        <div className="time-toggle-row">
          <div className="time-toggle-label">
            <Clock size={18} /> Set Time
          </div>
          <button className={`toggle-switch ${hasTime ? 'on' : ''}`} onClick={() => setHasTime(!hasTime)}>
            <div className="toggle-switch-knob" />
          </button>
        </div>

        {hasTime && (
          <div className="time-input-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <select className="time-select" value={hours} onChange={(e) => setHours(Number(e.target.value))}>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}</option>
                ))}
              </select>
              <span style={{ color: '#94a3b8' }}>:</span>
              <select className="time-select" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
                {[0, 15, 30, 45].map((m) => (
                  <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>Duration:</span>
              <select className="time-select" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                <option value={15}>15m</option>
                <option value={30}>30m</option>
                <option value={45}>45m</option>
                <option value={60}>1h</option>
                <option value={90}>1.5h</option>
                <option value={120}>2h</option>
                <option value={180}>3h</option>
                <option value={240}>4h</option>
              </select>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
            <CalendarIcon size={18} />
            {initialDate ? 'Update' : 'Add'}
          </button>
          {initialDate && (
            <button className="btn btn-secondary" onClick={handleDuplicate}>
              <Copy size={18} /> Duplicate
            </button>
          )}
        </div>

        {initialDate && (
          <button
            className="btn btn-danger"
            style={{ width: '100%', marginTop: 8 }}
            onClick={() => { onDelete?.(task.id); onClose(); }}
          >
            <Trash2 size={18} /> Remove from Calendar
          </button>
        )}
      </div>
    </div>
  );
}
