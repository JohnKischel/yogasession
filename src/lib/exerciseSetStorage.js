/**
 * Client-side exercise set management using localStorage
 * Exercise sets are collections of exercise cards that can be used together.
 * This includes a default "Yoga Starter Set" with all available exercises.
 */

const STORAGE_KEY = 'yogasession_exercise_sets';

/**
 * Get all exercise sets from localStorage
 * @returns {Array} Array of exercise sets
 */
export function getExerciseSets() {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to read exercise sets from localStorage:', error);
  }
  
  return [];
}

/**
 * Save exercise sets to localStorage
 * @param {Array} sets - Array of exercise sets to save
 */
export function saveExerciseSets(sets) {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
  } catch (error) {
    console.error('Failed to save exercise sets to localStorage:', error);
  }
}

/**
 * Generate a new unique ID for an exercise set
 * @param {Array} sets - Existing exercise sets
 * @returns {string} New unique ID
 */
function generateId(sets) {
  if (sets.length === 0) {
    return 'exercise-set-1';
  }
  
  const numericIds = sets
    .map(s => {
      const match = s.id.match(/^exercise-set-(\d+)$/);
      return match ? parseInt(match[1], 10) : NaN;
    })
    .filter(id => !isNaN(id));
  
  if (numericIds.length === 0) {
    return 'exercise-set-1';
  }
  
  const maxId = Math.max(...numericIds);
  return `exercise-set-${maxId + 1}`;
}

/**
 * Validate an exercise set object
 * @param {Object} set - Exercise set to validate
 * @returns {Array} Array of validation error messages
 */
export function validateExerciseSet(set) {
  const errors = [];
  
  if (!set.name || typeof set.name !== 'string' || set.name.trim() === '') {
    errors.push('name is required and must be a non-empty string');
  }
  
  if (set.description && typeof set.description !== 'string') {
    errors.push('description must be a string');
  }
  
  if (!Array.isArray(set.exerciseIds)) {
    errors.push('exerciseIds is required and must be an array');
  } else if (set.exerciseIds.some(id => typeof id !== 'string')) {
    errors.push('all exerciseIds must be strings');
  }
  
  return errors;
}

/**
 * Get an exercise set by ID
 * @param {string} id - Set ID
 * @returns {Object|null} Exercise set or null if not found
 */
export function getExerciseSet(id) {
  const sets = getExerciseSets();
  return sets.find(s => s.id === id) || null;
}

/**
 * Create a new exercise set and save to localStorage
 * @param {Object} setData - Set data (without id)
 * @returns {Object} Result object with success status and data or errors
 */
export function createExerciseSet(setData) {
  const validationErrors = validateExerciseSet(setData);
  
  if (validationErrors.length > 0) {
    return {
      success: false,
      errors: validationErrors
    };
  }
  
  const sets = getExerciseSets();
  
  const newSet = {
    id: generateId(sets),
    name: setData.name.trim(),
    description: setData.description ? setData.description.trim() : '',
    exerciseIds: [...setData.exerciseIds],
    isDefault: setData.isDefault || false,
    createdAt: new Date().toISOString()
  };
  
  sets.push(newSet);
  saveExerciseSets(sets);
  
  return {
    success: true,
    set: newSet
  };
}

/**
 * Update an existing exercise set
 * @param {string} id - Set ID to update
 * @param {Object} setData - Updated set data
 * @returns {Object} Result object with success status and data or errors
 */
export function updateExerciseSet(id, setData) {
  const validationErrors = validateExerciseSet(setData);
  
  if (validationErrors.length > 0) {
    return {
      success: false,
      errors: validationErrors
    };
  }
  
  const sets = getExerciseSets();
  const index = sets.findIndex(s => s.id === id);
  
  if (index === -1) {
    return {
      success: false,
      errors: ['Exercise set not found']
    };
  }
  
  const updatedSet = {
    ...sets[index],
    name: setData.name.trim(),
    description: setData.description ? setData.description.trim() : '',
    exerciseIds: [...setData.exerciseIds],
    updatedAt: new Date().toISOString()
  };
  
  sets[index] = updatedSet;
  saveExerciseSets(sets);
  
  return {
    success: true,
    set: updatedSet
  };
}

/**
 * Delete an exercise set by ID
 * @param {string} id - Set ID to delete
 * @returns {boolean} True if deleted, false if not found or if default set
 */
export function deleteExerciseSet(id) {
  const sets = getExerciseSets();
  const index = sets.findIndex(s => s.id === id);
  
  if (index === -1) {
    return false;
  }
  
  // Don't allow deletion of default sets
  if (sets[index].isDefault) {
    return false;
  }
  
  sets.splice(index, 1);
  saveExerciseSets(sets);
  return true;
}

/**
 * Initialize default exercise sets if they don't exist
 * This should be called on app initialization
 */
export function initializeDefaultExerciseSets() {
  const sets = getExerciseSets();
  
  // Check if default set already exists
  const hasDefaultSet = sets.some(s => s.isDefault);
  
  if (!hasDefaultSet) {
    // Create default starter set with all exercise IDs from 1-7
    // These match the IDs in data/exercises.json
    const defaultSet = {
      id: 'exercise-set-default',
      name: 'Yoga Starter Set',
      description: 'A complete collection of all available yoga exercises',
      exerciseIds: ['1', '2', '3', '4', '5', '6', '7'],
      isDefault: true,
      createdAt: new Date().toISOString()
    };
    
    sets.push(defaultSet);
    saveExerciseSets(sets);
  }
}

/**
 * Clear all exercise sets from localStorage
 */
export function clearExerciseSets() {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.removeItem(STORAGE_KEY);
}
