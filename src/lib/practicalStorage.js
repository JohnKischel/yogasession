/**
 * Client-side practical element management using localStorage
 * This module provides functions to create, read, update, and manage practical elements
 * stored in the browser's localStorage until we move to a non-static site.
 * 
 * Practical elements are action-based cards that instruct users to perform specific actions
 * like ringing a bell, lighting a candle, etc. They are designed to guide physical actions
 * during yoga sessions.
 */

const STORAGE_KEY = 'yogasession_practicals';
const MIN_TIME_MINUTES = 0.5;

/**
 * Get all practical elements from localStorage
 * @returns {Array} Array of practical elements
 */
export function getPracticals() {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to read practicals from localStorage:', error);
  }
  
  return [];
}

/**
 * Save practical elements to localStorage
 * @param {Array} practicals - Array of practical elements to save
 */
export function savePracticals(practicals) {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(practicals));
  } catch (error) {
    console.error('Failed to save practicals to localStorage:', error);
  }
}

/**
 * Generate a new unique ID for a practical element
 * @param {Array} practicals - Existing practical elements
 * @returns {string} New unique ID with 'practical-' prefix
 */
function generateId(practicals) {
  if (practicals.length === 0) {
    return 'practical-1';
  }
  
  const numericIds = practicals
    .map(p => {
      const match = p.id.match(/^practical-(\d+)$/);
      return match ? parseInt(match[1], 10) : NaN;
    })
    .filter(id => !isNaN(id));
  
  if (numericIds.length === 0) {
    return 'practical-1';
  }
  
  const maxId = Math.max(...numericIds);
  return `practical-${maxId + 1}`;
}

/**
 * Validate a practical element object
 * @param {Object} practical - Practical element to validate
 * @returns {Array} Array of validation error messages
 */
export function validatePractical(practical) {
  const errors = [];
  
  if (!practical.title || typeof practical.title !== 'string' || practical.title.trim() === '') {
    errors.push('title is required and must be a non-empty string');
  }
  
  if (!practical.instruction || typeof practical.instruction !== 'string' || practical.instruction.trim() === '') {
    errors.push('instruction is required and must be a non-empty string');
  }
  
  if (!Array.isArray(practical.tags)) {
    errors.push('tags is required and must be an array');
  } else if (practical.tags.some(tag => typeof tag !== 'string')) {
    errors.push('all tags must be strings');
  } else if (practical.tags.some(tag => tag.trim() === '')) {
    errors.push('tags must not contain empty strings');
  }
  
  if (typeof practical.time !== 'number' || practical.time < MIN_TIME_MINUTES) {
    errors.push(`time is required and must be at least ${MIN_TIME_MINUTES} minutes`);
  }
  
  return errors;
}

/**
 * Get a practical element by ID
 * @param {string} id - Practical ID
 * @returns {Object|null} Practical element or null if not found
 */
export function getPractical(id) {
  const practicals = getPracticals();
  return practicals.find(p => p.id === id) || null;
}

/**
 * Sanitize and filter tags array
 * @param {Array} tags - Array of tags to sanitize
 * @returns {Array} Sanitized array of tags
 */
function sanitizeTags(tags) {
  return tags.filter(tag => typeof tag === 'string').map(tag => tag.trim());
}

/**
 * Create a new practical element and save to localStorage
 * @param {Object} practicalData - Practical data (without id)
 * @returns {Object} Result object with success status and data or errors
 */
export function createPractical(practicalData) {
  const validationErrors = validatePractical(practicalData);
  
  if (validationErrors.length > 0) {
    return {
      success: false,
      errors: validationErrors
    };
  }
  
  const practicals = getPracticals();
  
  const newPractical = {
    id: generateId(practicals),
    title: practicalData.title.trim(),
    instruction: practicalData.instruction.trim(),
    tags: sanitizeTags(practicalData.tags),
    time: practicalData.time,
    type: 'practical'
  };
  
  practicals.push(newPractical);
  savePracticals(practicals);
  
  return {
    success: true,
    practical: newPractical
  };
}

/**
 * Update an existing practical element
 * @param {string} id - Practical ID to update
 * @param {Object} practicalData - Updated practical data
 * @returns {Object} Result object with success status and data or errors
 */
export function updatePractical(id, practicalData) {
  const validationErrors = validatePractical(practicalData);
  
  if (validationErrors.length > 0) {
    return {
      success: false,
      errors: validationErrors
    };
  }
  
  const practicals = getPracticals();
  const index = practicals.findIndex(p => p.id === id);
  
  if (index === -1) {
    return {
      success: false,
      errors: ['Practical not found']
    };
  }
  
  const updatedPractical = {
    id: id,
    title: practicalData.title.trim(),
    instruction: practicalData.instruction.trim(),
    tags: sanitizeTags(practicalData.tags),
    time: practicalData.time,
    type: 'practical'
  };
  
  practicals[index] = updatedPractical;
  savePracticals(practicals);
  
  return {
    success: true,
    practical: updatedPractical
  };
}

/**
 * Delete a practical element by ID
 * @param {string} id - Practical ID to delete
 * @returns {boolean} True if deleted, false if not found
 */
export function deletePractical(id) {
  const practicals = getPracticals();
  const index = practicals.findIndex(p => p.id === id);
  
  if (index === -1) {
    return false;
  }
  
  practicals.splice(index, 1);
  savePracticals(practicals);
  return true;
}

/**
 * Clear all practical elements from localStorage
 */
export function clearPracticals() {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if an ID is a practical element ID
 * @param {string} id - ID to check
 * @returns {boolean} True if it's a practical ID
 */
export function isPracticalId(id) {
  return typeof id === 'string' && id.startsWith('practical-');
}
