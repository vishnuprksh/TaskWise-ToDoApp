import React from 'react';

const getAttributeColor = (level) => {
  switch (level) {
    case 'high': return '#ef4444';
    case 'medium': return '#f59e0b';
    case 'low': return '#10b981';
    default: return '#94a3b8';
  }
};

export default function AttributeSelector({ label, value, onChange }) {
  return (
    <div className="attr-row">
      <div className="attr-label">{label}</div>
      <div className="attr-options">
        {['low', 'medium', 'high'].map((option) => (
          <button
            key={option}
            className={`attr-option ${value === option ? 'active' : ''}`}
            style={value === option ? { backgroundColor: getAttributeColor(option) } : {}}
            onClick={() => onChange(option)}
            type="button"
          >
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
