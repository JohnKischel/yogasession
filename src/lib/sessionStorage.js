/**
 * Client-side session management using localStorage
 * This module provides functions to create, read, update, and manage yoga sessions
 * stored in the browser's localStorage until we move to a non-static site.
 */

const STORAGE_KEY = 'yogasession_sessions';

/**
 * Get all sessions from localStorage
 * @returns {Array} Array of sessions
 */
export function getSessions() {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to read sessions from localStorage:', error);
  }
  
  return [];
}

/**
 * Save sessions to localStorage
 * @param {Array} sessions - Array of sessions to save
 */
export function saveSessions(sessions) {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save sessions to localStorage:', error);
  }
}

/**
 * Generate a new unique ID for a session
 * @param {Array} sessions - Existing sessions
 * @returns {string} New unique ID
 */
function generateId(sessions) {
  if (sessions.length === 0) {
    return '1';
  }
  
  const numericIds = sessions
    .map(s => parseInt(s.id, 10))
    .filter(id => !isNaN(id));
  
  if (numericIds.length === 0) {
    return '1';
  }
  
  const maxId = Math.max(...numericIds);
  return String(maxId + 1);
}

/**
 * Validate a session object
 * @param {Object} session - Session to validate
 * @returns {Array} Array of validation error messages
 */
export function validateSession(session) {
  const errors = [];
  
  if (!session.title || typeof session.title !== 'string' || session.title.trim() === '') {
    errors.push('title is required and must be a non-empty string');
  }
  
  if (!session.description || typeof session.description !== 'string' || session.description.trim() === '') {
    errors.push('description is required and must be a non-empty string');
  }
  
  if (session.story !== undefined && typeof session.story !== 'string') {
    errors.push('story must be a string');
  }
  
  if (!Array.isArray(session.exercises)) {
    errors.push('exercises is required and must be an array');
  } else if (session.exercises.some(id => typeof id !== 'string')) {
    errors.push('all exercise IDs must be strings');
  }
  
  if (typeof session.duration_minutes !== 'number' || session.duration_minutes <= 0) {
    errors.push('duration_minutes is required and must be a positive number');
  }
  
  if (!session.category || typeof session.category !== 'string' || session.category.trim() === '') {
    errors.push('category is required and must be a non-empty string');
  }
  
  if (!session.level || typeof session.level !== 'string' || session.level.trim() === '') {
    errors.push('level is required and must be a non-empty string');
  }
  
  return errors;
}

/**
 * Get a session by ID
 * @param {string} id - Session ID
 * @returns {Object|null} Session object or null if not found
 */
export function getSession(id) {
  const sessions = getSessions();
  return sessions.find(s => s.id === id) || null;
}

/**
 * Create a new session and save to localStorage
 * @param {Object} sessionData - Session data (without id)
 * @returns {Object} Result object with success status and data or errors
 */
export function createSession(sessionData) {
  const validationErrors = validateSession(sessionData);
  
  if (validationErrors.length > 0) {
    return {
      success: false,
      errors: validationErrors
    };
  }
  
  const sessions = getSessions();
  
  const newSession = {
    id: generateId(sessions),
    title: sessionData.title.trim(),
    description: sessionData.description.trim(),
    story: sessionData.story ? sessionData.story.trim() : '',
    duration_minutes: sessionData.duration_minutes,
    exercises: sessionData.exercises,
    category: sessionData.category.trim(),
    level: sessionData.level.trim()
  };
  
  sessions.push(newSession);
  saveSessions(sessions);
  
  return {
    success: true,
    session: newSession
  };
}

/**
 * Update an existing session
 * @param {string} id - Session ID to update
 * @param {Object} sessionData - Updated session data
 * @returns {Object} Result object with success status and data or errors
 */
export function updateSession(id, sessionData) {
  const validationErrors = validateSession(sessionData);
  
  if (validationErrors.length > 0) {
    return {
      success: false,
      errors: validationErrors
    };
  }
  
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === id);
  
  if (index === -1) {
    return {
      success: false,
      errors: ['Session not found']
    };
  }
  
  const updatedSession = {
    id: id,
    title: sessionData.title.trim(),
    description: sessionData.description.trim(),
    story: sessionData.story ? sessionData.story.trim() : '',
    duration_minutes: sessionData.duration_minutes,
    exercises: sessionData.exercises,
    category: sessionData.category.trim(),
    level: sessionData.level.trim()
  };
  
  sessions[index] = updatedSession;
  saveSessions(sessions);
  
  return {
    success: true,
    session: updatedSession
  };
}

/**
 * Delete a session by ID
 * @param {string} id - Session ID to delete
 * @returns {boolean} True if deleted, false if not found
 */
export function deleteSession(id) {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === id);
  
  if (index === -1) {
    return false;
  }
  
  sessions.splice(index, 1);
  saveSessions(sessions);
  return true;
}

/**
 * Clear all sessions from localStorage
 */
export function clearSessions() {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Reorder exercises in a session
 * @param {string} id - Session ID
 * @param {Array} newExerciseOrder - New array of exercise IDs in desired order
 * @returns {Object} Result object with success status
 */
export function reorderSessionExercises(id, newExerciseOrder) {
  if (!Array.isArray(newExerciseOrder)) {
    return {
      success: false,
      errors: ['newExerciseOrder must be an array']
    };
  }
  
  if (newExerciseOrder.some(exerciseId => typeof exerciseId !== 'string')) {
    return {
      success: false,
      errors: ['all exercise IDs must be strings']
    };
  }
  
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === id);
  
  if (index === -1) {
    return {
      success: false,
      errors: ['Session not found']
    };
  }
  
  sessions[index].exercises = newExerciseOrder;
  saveSessions(sessions);
  
  return {
    success: true,
    session: sessions[index]
  };
}
