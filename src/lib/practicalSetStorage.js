/**
 * Client-side practical set management using localStorage
 * Practical sets are collections of practical cards that can be used together.
 */

const STORAGE_KEY = 'yogasession_practical_sets';

/**
 * Get all practical sets from localStorage
 * @returns {Array} Array of practical sets
 */
export function getPracticalSets() {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to read practical sets from localStorage:', error);
  }
  
  return [];
}

/**
 * Save practical sets to localStorage
 * @param {Array} sets - Array of practical sets to save
 */
export function savePracticalSets(sets) {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
  } catch (error) {
    console.error('Failed to save practical sets to localStorage:', error);
  }
}

/**
 * Generate a new unique ID for a practical set
 * @param {Array} sets - Existing practical sets
 * @returns {string} New unique ID
 */
function generateId(sets) {
  if (sets.length === 0) {
    return 'practical-set-1';
  }
  
  const numericIds = sets
    .map(s => {
      const match = s.id.match(/^practical-set-(\d+)$/);
      return match ? parseInt(match[1], 10) : NaN;
    })
    .filter(id => !isNaN(id));
  
  if (numericIds.length === 0) {
    return 'practical-set-1';
  }
  
  const maxId = Math.max(...numericIds);
  return `practical-set-${maxId + 1}`;
}

/**
 * Validate a practical set object
 * @param {Object} set - Practical set to validate
 * @returns {Array} Array of validation error messages
 */
export function validatePracticalSet(set) {
  const errors = [];
  
  if (!set.name || typeof set.name !== 'string' || set.name.trim() === '') {
    errors.push('name is required and must be a non-empty string');
  }
  
  if (set.description && typeof set.description !== 'string') {
    errors.push('description must be a string');
  }
  
  if (!Array.isArray(set.practicalIds)) {
    errors.push('practicalIds is required and must be an array');
  } else if (set.practicalIds.some(id => typeof id !== 'string')) {
    errors.push('all practicalIds must be strings');
  }
  
  return errors;
}

/**
 * Get a practical set by ID
 * @param {string} id - Set ID
 * @returns {Object|null} Practical set or null if not found
 */
export function getPracticalSet(id) {
  const sets = getPracticalSets();
  return sets.find(s => s.id === id) || null;
}

/**
 * Create a new practical set and save to localStorage
 * @param {Object} setData - Set data (without id)
 * @returns {Object} Result object with success status and data or errors
 */
export function createPracticalSet(setData) {
  const validationErrors = validatePracticalSet(setData);
  
  if (validationErrors.length > 0) {
    return {
      success: false,
      errors: validationErrors
    };
  }
  
  const sets = getPracticalSets();
  
  const newSet = {
    id: generateId(sets),
    name: setData.name.trim(),
    description: setData.description ? setData.description.trim() : '',
    practicalIds: [...setData.practicalIds],
    isDefault: setData.isDefault || false,
    createdAt: new Date().toISOString()
  };
  
  sets.push(newSet);
  savePracticalSets(sets);
  
  return {
    success: true,
    set: newSet
  };
}

/**
 * Update an existing practical set
 * @param {string} id - Set ID to update
 * @param {Object} setData - Updated set data
 * @returns {Object} Result object with success status and data or errors
 */
export function updatePracticalSet(id, setData) {
  const validationErrors = validatePracticalSet(setData);
  
  if (validationErrors.length > 0) {
    return {
      success: false,
      errors: validationErrors
    };
  }
  
  const sets = getPracticalSets();
  const index = sets.findIndex(s => s.id === id);
  
  if (index === -1) {
    return {
      success: false,
      errors: ['Practical set not found']
    };
  }
  
  const updatedSet = {
    ...sets[index],
    name: setData.name.trim(),
    description: setData.description ? setData.description.trim() : '',
    practicalIds: [...setData.practicalIds],
    updatedAt: new Date().toISOString()
  };
  
  sets[index] = updatedSet;
  savePracticalSets(sets);
  
  return {
    success: true,
    set: updatedSet
  };
}

/**
 * Delete a practical set by ID
 * @param {string} id - Set ID to delete
 * @returns {boolean} True if deleted, false if not found or if default set
 */
export function deletePracticalSet(id) {
  const sets = getPracticalSets();
  const index = sets.findIndex(s => s.id === id);
  
  if (index === -1) {
    return false;
  }
  
  // Don't allow deletion of default sets
  if (sets[index].isDefault) {
    return false;
  }
  
  sets.splice(index, 1);
  savePracticalSets(sets);
  return true;
}

/**
 * Clear all practical sets from localStorage
 */
export function clearPracticalSets() {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.removeItem(STORAGE_KEY);
}
