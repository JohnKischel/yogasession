/**
 * Client-side story element management using localStorage
 * This module provides functions to create, read, update, and manage story elements
 * stored in the browser's localStorage until we move to a non-static site.
 * 
 * Story elements are narrative text blocks that can be interspersed with exercises
 * in a yoga session to create a more immersive and guided experience.
 * They are designed to be compatible with future LLM-based automatic generation.
 */

const STORAGE_KEY = 'yogasession_stories';

/**
 * Get all story elements from localStorage
 * @returns {Array} Array of story elements
 */
export function getStories() {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to read stories from localStorage:', error);
  }
  
  return [];
}

/**
 * Save story elements to localStorage
 * @param {Array} stories - Array of story elements to save
 */
export function saveStories(stories) {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
  } catch (error) {
    console.error('Failed to save stories to localStorage:', error);
  }
}

/**
 * Generate a new unique ID for a story element
 * @param {Array} stories - Existing story elements
 * @returns {string} New unique ID with 'story-' prefix to distinguish from exercises
 */
function generateId(stories) {
  if (stories.length === 0) {
    return 'story-1';
  }
  
  const numericIds = stories
    .map(s => {
      const match = s.id.match(/^story-(\d+)$/);
      return match ? parseInt(match[1], 10) : NaN;
    })
    .filter(id => !isNaN(id));
  
  if (numericIds.length === 0) {
    return 'story-1';
  }
  
  const maxId = Math.max(...numericIds);
  return `story-${maxId + 1}`;
}

/**
 * Validate a story element object
 * @param {Object} story - Story element to validate
 * @returns {Array} Array of validation error messages
 */
export function validateStory(story) {
  const errors = [];
  
  if (!story.title || typeof story.title !== 'string' || story.title.trim() === '') {
    errors.push('title is required and must be a non-empty string');
  }
  
  if (!story.text || typeof story.text !== 'string' || story.text.trim() === '') {
    errors.push('text is required and must be a non-empty string');
  }
  
  if (story.mood && typeof story.mood !== 'string') {
    errors.push('mood must be a string');
  }
  
  if (!Array.isArray(story.tags)) {
    errors.push('tags is required and must be an array');
  } else if (story.tags.some(tag => typeof tag !== 'string')) {
    errors.push('all tags must be strings');
  } else if (story.tags.some(tag => tag.trim() === '')) {
    errors.push('tags must not contain empty strings');
  }
  
  if (typeof story.time !== 'number' || story.time < 0.5) {
    errors.push('time is required and must be at least 0.5 minutes');
  }
  
  return errors;
}

/**
 * Get a story element by ID
 * @param {string} id - Story ID
 * @returns {Object|null} Story element or null if not found
 */
export function getStory(id) {
  const stories = getStories();
  return stories.find(s => s.id === id) || null;
}

/**
 * Create a new story element and save to localStorage
 * @param {Object} storyData - Story data (without id)
 * @returns {Object} Result object with success status and data or errors
 */
export function createStory(storyData) {
  const validationErrors = validateStory(storyData);
  
  if (validationErrors.length > 0) {
    return {
      success: false,
      errors: validationErrors
    };
  }
  
  const stories = getStories();
  
  const newStory = {
    id: generateId(stories),
    title: storyData.title.trim(),
    text: storyData.text.trim(),
    mood: storyData.mood ? storyData.mood.trim() : '',
    tags: storyData.tags.filter(tag => typeof tag === 'string').map(tag => tag.trim()),
    time: storyData.time,
    type: 'story' // Marker to distinguish from exercises in session items
  };
  
  stories.push(newStory);
  saveStories(stories);
  
  return {
    success: true,
    story: newStory
  };
}

/**
 * Update an existing story element
 * @param {string} id - Story ID to update
 * @param {Object} storyData - Updated story data
 * @returns {Object} Result object with success status and data or errors
 */
export function updateStory(id, storyData) {
  const validationErrors = validateStory(storyData);
  
  if (validationErrors.length > 0) {
    return {
      success: false,
      errors: validationErrors
    };
  }
  
  const stories = getStories();
  const index = stories.findIndex(s => s.id === id);
  
  if (index === -1) {
    return {
      success: false,
      errors: ['Story not found']
    };
  }
  
  const updatedStory = {
    id: id,
    title: storyData.title.trim(),
    text: storyData.text.trim(),
    mood: storyData.mood ? storyData.mood.trim() : '',
    tags: storyData.tags.filter(tag => typeof tag === 'string').map(tag => tag.trim()),
    time: storyData.time,
    type: 'story'
  };
  
  stories[index] = updatedStory;
  saveStories(stories);
  
  return {
    success: true,
    story: updatedStory
  };
}

/**
 * Delete a story element by ID
 * @param {string} id - Story ID to delete
 * @returns {boolean} True if deleted, false if not found
 */
export function deleteStory(id) {
  const stories = getStories();
  const index = stories.findIndex(s => s.id === id);
  
  if (index === -1) {
    return false;
  }
  
  stories.splice(index, 1);
  saveStories(stories);
  return true;
}

/**
 * Clear all story elements from localStorage
 */
export function clearStories() {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if an ID is a story element ID
 * @param {string} id - ID to check
 * @returns {boolean} True if it's a story ID
 */
export function isStoryId(id) {
  return typeof id === 'string' && id.startsWith('story-');
}
