/**
 * Client-side exercise management using localStorage
 * This module provides functions to create, read, and manage exercises
 * stored in the browser's localStorage until we move to a non-static site.
 */

const STORAGE_KEY = 'yogasession_exercises';

/**
 * Get all exercises from localStorage
 * @returns {Array} Array of exercises
 */
export function getExercises() {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to read exercises from localStorage:', error);
  }
  
  return [];
}

/**
 * Save exercises to localStorage
 * @param {Array} exercises - Array of exercises to save
 */
export function saveExercises(exercises) {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exercises));
  } catch (error) {
    console.error('Failed to save exercises to localStorage:', error);
  }
}

/**
 * Generate a new unique ID for an exercise
 * @param {Array} exercises - Existing exercises
 * @returns {string} New unique ID
 */
function generateId(exercises) {
  if (exercises.length === 0) {
    return '1';
  }
  
  const numericIds = exercises
    .map(e => parseInt(e.id, 10))
    .filter(id => !isNaN(id));
  
  if (numericIds.length === 0) {
    return '1';
  }
  
  const maxId = Math.max(...numericIds);
  return String(maxId + 1);
}

/**
 * Validate an exercise object
 * @param {Object} exercise - Exercise to validate
 * @returns {Array} Array of validation error messages
 */
export function validateExercise(exercise) {
  const errors = [];
  
  if (!exercise.title || typeof exercise.title !== 'string' || exercise.title.trim() === '') {
    errors.push('title is required and must be a non-empty string');
  }
  
  if (!exercise.description || typeof exercise.description !== 'string' || exercise.description.trim() === '') {
    errors.push('description is required and must be a non-empty string');
  }
  
  if (!exercise.category || typeof exercise.category !== 'string' || exercise.category.trim() === '') {
    errors.push('category is required and must be a non-empty string');
  }
  
  if (!Array.isArray(exercise.tags)) {
    errors.push('tags is required and must be an array');
  } else if (exercise.tags.some(tag => typeof tag !== 'string')) {
    errors.push('all tags must be strings');
  }
  
  if (typeof exercise.duration_minutes !== 'number' || exercise.duration_minutes <= 0) {
    errors.push('duration_minutes is required and must be a positive number');
  }
  
  return errors;
}

/**
 * Create a new exercise and save to localStorage
 * @param {Object} exerciseData - Exercise data (without id)
 * @returns {Object} Result object with success status and data or errors
 */
export function createExercise(exerciseData) {
  const validationErrors = validateExercise(exerciseData);
  
  if (validationErrors.length > 0) {
    return {
      success: false,
      errors: validationErrors
    };
  }
  
  const exercises = getExercises();
  
  const newExercise = {
    id: generateId(exercises),
    title: exerciseData.title.trim(),
    description: exerciseData.description.trim(),
    category: exerciseData.category.trim(),
    tags: exerciseData.tags.map(tag => tag.trim()),
    duration_minutes: exerciseData.duration_minutes
  };
  
  exercises.push(newExercise);
  saveExercises(exercises);
  
  return {
    success: true,
    exercise: newExercise
  };
}

/**
 * Delete an exercise by ID
 * @param {string} id - Exercise ID to delete
 * @returns {boolean} True if deleted, false if not found
 */
export function deleteExercise(id) {
  const exercises = getExercises();
  const index = exercises.findIndex(e => e.id === id);
  
  if (index === -1) {
    return false;
  }
  
  exercises.splice(index, 1);
  saveExercises(exercises);
  return true;
}

/**
 * Clear all exercises from localStorage
 */
export function clearExercises() {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.removeItem(STORAGE_KEY);
}
