/**
 * Simple NLP utility to parse voice commands for TaskWise.
 */

export const COMMAND_TYPES = {
    START_POMODORO: 'START_POMODORO',
    STOP_TIMER: 'STOP_TIMER',
    PAUSE_TIMER: 'PAUSE_TIMER',
    RESUME_TIMER: 'RESUME_TIMER',
    RESET_TIMER: 'RESET_TIMER',
    SHOW_TASKS: 'SHOW_TASKS',
    UNKNOWN: 'UNKNOWN',
};

const KEYWORDS = {
    START: ['start', 'begin', 'go', 'play', 'run'],
    STOP: ['stop', 'end', 'finish', 'cancel'],
    PAUSE: ['pause', 'hold', 'wait'],
    RESUME: ['resume', 'continue', 'keep'],
    RESET: ['reset', 'restart'],
    POMODORO: ['pomodoro', 'timer', 'focus', 'session', 'work'],
    TASKS: ['tasks', 'todo', 'list', 'home'],
};

/**
 * Parses a transcript string into a command object.
 * @param {string} transcript - The raw text from Speech-to-Text.
 * @returns {object} { type: COMMAND_TYPES, confidence: number }
 */
export const parseCommand = (transcript) => {
    const text = transcript.toLowerCase();

    // Check for Pomodoro/Timer commands
    const hasPomodoro = KEYWORDS.POMODORO.some(k => text.includes(k));
    const hasStart = KEYWORDS.START.some(k => text.includes(k));
    const hasStop = KEYWORDS.STOP.some(k => text.includes(k));
    const hasPause = KEYWORDS.PAUSE.some(k => text.includes(k));
    const hasResume = KEYWORDS.RESUME.some(k => text.includes(k));
    const hasReset = KEYWORDS.RESET.some(k => text.includes(k));
    const hasTasks = KEYWORDS.TASKS.some(k => text.includes(k));

    if (hasPomodoro || hasStart || hasStop || hasPause || hasResume || hasReset) {
        if (hasStop) return { type: COMMAND_TYPES.STOP_TIMER, confidence: 0.9 };
        if (hasPause) return { type: COMMAND_TYPES.PAUSE_TIMER, confidence: 0.9 };
        if (hasResume) return { type: COMMAND_TYPES.RESUME_TIMER, confidence: 0.9 };
        if (hasReset) return { type: COMMAND_TYPES.RESET_TIMER, confidence: 0.9 };
        if (hasStart || hasPomodoro) return { type: COMMAND_TYPES.START_POMODORO, confidence: 0.9 };
    }

    if (hasTasks) {
        return { type: COMMAND_TYPES.SHOW_TASKS, confidence: 0.8 };
    }

    return { type: COMMAND_TYPES.UNKNOWN, confidence: 0 };
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { COMMAND_TYPES, parseCommand };
}
