/**
 * Client-side story set management using localStorage
 * Story sets are collections of story cards that can be used together.
 */

const STORAGE_KEY = 'yogasession_story_sets';

/**
 * Get all story sets from localStorage
 * @returns {Array} Array of story sets
 */
export function getStorySets() {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to read story sets from localStorage:', error);
  }
  
  return [];
}

/**
 * Save story sets to localStorage
 * @param {Array} sets - Array of story sets to save
 */
export function saveStorySets(sets) {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
  } catch (error) {
    console.error('Failed to save story sets to localStorage:', error);
  }
}

/**
 * Generate a new unique ID for a story set
 * @param {Array} sets - Existing story sets
 * @returns {string} New unique ID
 */
function generateId(sets) {
  if (sets.length === 0) {
    return 'story-set-1';
  }
  
  const numericIds = sets
    .map(s => {
      const match = s.id.match(/^story-set-(\d+)$/);
      return match ? parseInt(match[1], 10) : NaN;
    })
    .filter(id => !isNaN(id));
  
  if (numericIds.length === 0) {
    return 'story-set-1';
  }
  
  const maxId = Math.max(...numericIds);
  return `story-set-${maxId + 1}`;
}

/**
 * Validate a story set object
 * @param {Object} set - Story set to validate
 * @returns {Array} Array of validation error messages
 */
export function validateStorySet(set) {
  const errors = [];
  
  if (!set.name || typeof set.name !== 'string' || set.name.trim() === '') {
    errors.push('name is required and must be a non-empty string');
  }
  
  if (set.description && typeof set.description !== 'string') {
    errors.push('description must be a string');
  }
  
  if (!Array.isArray(set.storyIds)) {
    errors.push('storyIds is required and must be an array');
  } else if (set.storyIds.some(id => typeof id !== 'string')) {
    errors.push('all storyIds must be strings');
  }
  
  return errors;
}

/**
 * Get a story set by ID
 * @param {string} id - Set ID
 * @returns {Object|null} Story set or null if not found
 */
export function getStorySet(id) {
  const sets = getStorySets();
  return sets.find(s => s.id === id) || null;
}

/**
 * Create a new story set and save to localStorage
 * @param {Object} setData - Set data (without id)
 * @returns {Object} Result object with success status and data or errors
 */
export function createStorySet(setData) {
  const validationErrors = validateStorySet(setData);
  
  if (validationErrors.length > 0) {
    return {
      success: false,
      errors: validationErrors
    };
  }
  
  const sets = getStorySets();
  
  const newSet = {
    id: generateId(sets),
    name: setData.name.trim(),
    description: setData.description ? setData.description.trim() : '',
    storyIds: [...setData.storyIds],
    isDefault: setData.isDefault || false,
    createdAt: new Date().toISOString()
  };
  
  sets.push(newSet);
  saveStorySets(sets);
  
  return {
    success: true,
    set: newSet
  };
}

/**
 * Update an existing story set
 * @param {string} id - Set ID to update
 * @param {Object} setData - Updated set data
 * @returns {Object} Result object with success status and data or errors
 */
export function updateStorySet(id, setData) {
  const validationErrors = validateStorySet(setData);
  
  if (validationErrors.length > 0) {
    return {
      success: false,
      errors: validationErrors
    };
  }
  
  const sets = getStorySets();
  const index = sets.findIndex(s => s.id === id);
  
  if (index === -1) {
    return {
      success: false,
      errors: ['Story set not found']
    };
  }
  
  const updatedSet = {
    ...sets[index],
    name: setData.name.trim(),
    description: setData.description ? setData.description.trim() : '',
    storyIds: [...setData.storyIds],
    updatedAt: new Date().toISOString()
  };
  
  sets[index] = updatedSet;
  saveStorySets(sets);
  
  return {
    success: true,
    set: updatedSet
  };
}

/**
 * Delete a story set by ID
 * @param {string} id - Set ID to delete
 * @returns {boolean} True if deleted, false if not found or if default set
 */
export function deleteStorySet(id) {
  const sets = getStorySets();
  const index = sets.findIndex(s => s.id === id);
  
  if (index === -1) {
    return false;
  }
  
  // Don't allow deletion of default sets
  if (sets[index].isDefault) {
    return false;
  }
  
  sets.splice(index, 1);
  saveStorySets(sets);
  return true;
}

/**
 * Clear all story sets from localStorage
 */
export function clearStorySets() {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.removeItem(STORAGE_KEY);
}
