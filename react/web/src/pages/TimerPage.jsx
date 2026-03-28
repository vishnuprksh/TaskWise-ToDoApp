import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Clock, Settings, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTime } from '../utils/time';

const MODES = { WORK: 'work', SHORT_BREAK: 'shortBreak', LONG_BREAK: 'longBreak' };
const DEFAULT_DURATIONS = { [MODES.WORK]: 25, [MODES.SHORT_BREAK]: 5, [MODES.LONG_BREAK]: 15 };
const STORAGE_KEY = 'taskwise_timer_settings';

const CIRCLE_SIZE = 280;
const STROKE_WIDTH = 12;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TimerPage({ task, onBack }) {
  const { updateTaskTime } = useApp();

  const [durations, setDurations] = useState(DEFAULT_DURATIONS);
  const [showBreaks, setShowBreaks] = useState(true);
  const [currentMode, setCurrentMode] = useState(MODES.WORK);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATIONS[MODES.WORK] * 60);
  const [isActive, setIsActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const intervalRef = useRef(null);
  const sessionDuration = useRef(DEFAULT_DURATIONS[MODES.WORK] * 60);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.durations) {
          setDurations(parsed.durations);
          setShowBreaks(parsed.showBreaks !== undefined ? parsed.showBreaks : true);
        }
      } catch (e) { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (!isActive) {
      const newTime = durations[currentMode] * 60;
      setTimeLeft(newTime);
      sessionDuration.current = newTime;
    }
  }, [currentMode, durations]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            clearInterval(intervalRef.current);
            return 0;
          }
          if (currentMode === MODES.WORK) {
            updateTaskTime(task.id, 1);
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive, currentMode]);

  // Warn before navigating away during active session
  useEffect(() => {
    const handler = (e) => {
      if (isActive || (timeLeft < sessionDuration.current && timeLeft > 0)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    clearInterval(intervalRef.current);
    const t = durations[currentMode] * 60;
    setTimeLeft(t);
    sessionDuration.current = t;
  };

  const switchMode = (mode) => {
    if (isActive) return;
    setCurrentMode(mode);
  };

  const saveSettings = (newDurations, newShowBreaks) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ durations: newDurations, showBreaks: newShowBreaks }));
    setDurations(newDurations);
    setShowBreaks(newShowBreaks);
    if (!newShowBreaks && currentMode !== MODES.WORK) setCurrentMode(MODES.WORK);
    setShowSettings(false);
  };

  const progress = sessionDuration.current > 0 ? timeLeft / sessionDuration.current : 1;
  const offset = CIRCUMFERENCE * (1 - progress);
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  const modeColors = { [MODES.WORK]: '#6366f1', [MODES.SHORT_BREAK]: '#10b981', [MODES.LONG_BREAK]: '#3b82f6' };
  const color = modeColors[currentMode];

  const handleBack = () => {
    if (isActive || (timeLeft < sessionDuration.current && timeLeft > 0)) {
      if (!window.confirm('Stop your focus session and go back?')) return;
    }
    setIsActive(false);
    clearInterval(intervalRef.current);
    onBack();
  };

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-ghost btn-icon" onClick={handleBack}><ArrowLeft size={22} /></button>
          <div>
            <h2>Timer</h2>
            <div className="page-header-subtitle">{task.text}</div>
          </div>
        </div>
        <button className="btn btn-secondary btn-icon" onClick={() => setShowSettings(true)}>
          <Settings size={18} />
        </button>
      </div>

      <div className="page-body">
        <div className="timer-container">
          {/* Mode selector */}
          <div className="timer-modes">
            <button className={`timer-mode-btn ${currentMode === MODES.WORK ? 'active' : ''}`} onClick={() => switchMode(MODES.WORK)}>Work</button>
            {showBreaks && (
              <>
                <button className={`timer-mode-btn ${currentMode === MODES.SHORT_BREAK ? 'active' : ''}`} onClick={() => switchMode(MODES.SHORT_BREAK)}>Short Break</button>
                <button className={`timer-mode-btn ${currentMode === MODES.LONG_BREAK ? 'active' : ''}`} onClick={() => switchMode(MODES.LONG_BREAK)}>Long Break</button>
              </>
            )}
          </div>

          {/* Circle Timer */}
          <div className="timer-circle-container">
            <svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS} fill="none" stroke="#334155" strokeWidth={STROKE_WIDTH} />
              <circle
                cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS}
                fill="none" stroke={color} strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="timer-display">
              <div className="timer-time">{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</div>
              <div className="timer-mode-label" style={{ color }}>{currentMode === MODES.WORK ? 'Focus' : currentMode === MODES.SHORT_BREAK ? 'Short Break' : 'Long Break'}</div>
            </div>
          </div>

          {/* Controls */}
          <div className="timer-controls">
            <button className="timer-btn secondary-btn" onClick={resetTimer}><RotateCcw size={22} color="#f8fafc" /></button>
            <button className="timer-btn play-btn" onClick={toggleTimer}>
              {isActive ? <Pause size={28} color="#fff" /> : <Play size={28} color="#fff" style={{ marginLeft: 3 }} />}
            </button>
            <div style={{ width: 56 }} /> {/* spacer */}
          </div>

          {/* Total time */}
          <div className="timer-total-time">
            <Clock size={16} />
            Total: {formatTime(task.timeSpent || 0)}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <TimerSettings
          durations={durations}
          showBreaks={showBreaks}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}

function TimerSettings({ durations, showBreaks, onSave, onClose }) {
  const [d, setD] = useState({ ...durations });
  const [sb, setSb] = useState(showBreaks);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h3>Timer Settings</h3>
          <button className="modal-close" onClick={onClose}><X size={22} /></button>
        </div>

        <label className="form-label">Work Duration (min)</label>
        <input className="form-input" type="number" min="1" value={d[MODES.WORK]} onChange={(e) => setD({ ...d, [MODES.WORK]: parseInt(e.target.value) || 1 })} />

        <div className="time-toggle-row" style={{ borderTop: 'none', marginTop: 16 }}>
          <span className="time-toggle-label">Enable Breaks</span>
          <button className={`toggle-switch ${sb ? 'on' : ''}`} onClick={() => setSb(!sb)}>
            <div className="toggle-switch-knob" />
          </button>
        </div>

        {sb && (
          <>
            <label className="form-label">Short Break (min)</label>
            <input className="form-input" type="number" min="1" value={d[MODES.SHORT_BREAK]} onChange={(e) => setD({ ...d, [MODES.SHORT_BREAK]: parseInt(e.target.value) || 1 })} />
            <label className="form-label">Long Break (min)</label>
            <input className="form-input" type="number" min="1" value={d[MODES.LONG_BREAK]} onChange={(e) => setD({ ...d, [MODES.LONG_BREAK]: parseInt(e.target.value) || 1 })} />
          </>
        )}

        <button className="btn btn-primary" style={{ width: '100%', marginTop: 20, padding: 16 }} onClick={() => onSave(d, sb)}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
