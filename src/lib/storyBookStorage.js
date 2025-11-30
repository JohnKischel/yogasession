/**
 * Client-side story book management using localStorage
 * This module provides functions to create, read, update, and manage story books
 * stored in the browser's localStorage until we move to a non-static site.
 * 
 * Story books are collections of related story elements that can be used together
 * to tell cohesive stories during yoga sessions.
 */

const STORAGE_KEY = 'yogasession_storybooks';

/**
 * Get all story books from localStorage
 * @returns {Array} Array of story books
 */
export function getStoryBooks() {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to read story books from localStorage:', error);
  }
  
  return [];
}

/**
 * Save story books to localStorage
 * @param {Array} storyBooks - Array of story books to save
 */
export function saveStoryBooks(storyBooks) {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storyBooks));
  } catch (error) {
    console.error('Failed to save story books to localStorage:', error);
  }
}

/**
 * Generate a new unique ID for a story book
 * @param {Array} storyBooks - Existing story books
 * @returns {string} New unique ID with 'storybook-' prefix
 */
function generateId(storyBooks) {
  if (storyBooks.length === 0) {
    return 'storybook-1';
  }
  
  const numericIds = storyBooks
    .map(sb => {
      const match = sb.id.match(/^storybook-(\d+)$/);
      return match ? parseInt(match[1], 10) : NaN;
    })
    .filter(id => !isNaN(id));
  
  if (numericIds.length === 0) {
    return 'storybook-1';
  }
  
  const maxId = Math.max(...numericIds);
  return `storybook-${maxId + 1}`;
}

/**
 * Validate a story book object
 * @param {Object} storyBook - Story book to validate
 * @returns {Array} Array of validation error messages
 */
export function validateStoryBook(storyBook) {
  const errors = [];
  
  if (!storyBook.title || typeof storyBook.title !== 'string' || storyBook.title.trim() === '') {
    errors.push('title is required and must be a non-empty string');
  }
  
  if (!storyBook.description || typeof storyBook.description !== 'string' || storyBook.description.trim() === '') {
    errors.push('description is required and must be a non-empty string');
  }
  
  if (storyBook.theme && typeof storyBook.theme !== 'string') {
    errors.push('theme must be a string');
  }
  
  if (!Array.isArray(storyBook.storyIds)) {
    errors.push('storyIds is required and must be an array');
  } else if (storyBook.storyIds.some(id => typeof id !== 'string')) {
    errors.push('all story IDs must be strings');
  }
  
  return errors;
}

/**
 * Get a story book by ID
 * @param {string} id - Story book ID
 * @returns {Object|null} Story book or null if not found
 */
export function getStoryBook(id) {
  const storyBooks = getStoryBooks();
  return storyBooks.find(sb => sb.id === id) || null;
}

/**
 * Create a new story book and save to localStorage
 * @param {Object} storyBookData - Story book data (without id)
 * @returns {Object} Result object with success status and data or errors
 */
export function createStoryBook(storyBookData) {
  const validationErrors = validateStoryBook(storyBookData);
  
  if (validationErrors.length > 0) {
    return {
      success: false,
      errors: validationErrors
    };
  }
  
  const storyBooks = getStoryBooks();
  
  const newStoryBook = {
    id: generateId(storyBooks),
    title: storyBookData.title.trim(),
    description: storyBookData.description.trim(),
    theme: storyBookData.theme ? storyBookData.theme.trim() : '',
    storyIds: storyBookData.storyIds.filter(id => typeof id === 'string')
  };
  
  storyBooks.push(newStoryBook);
  saveStoryBooks(storyBooks);
  
  return {
    success: true,
    storyBook: newStoryBook
  };
}

/**
 * Update an existing story book
 * @param {string} id - Story book ID to update
 * @param {Object} storyBookData - Updated story book data
 * @returns {Object} Result object with success status and data or errors
 */
export function updateStoryBook(id, storyBookData) {
  const validationErrors = validateStoryBook(storyBookData);
  
  if (validationErrors.length > 0) {
    return {
      success: false,
      errors: validationErrors
    };
  }
  
  const storyBooks = getStoryBooks();
  const index = storyBooks.findIndex(sb => sb.id === id);
  
  if (index === -1) {
    return {
      success: false,
      errors: ['Story book not found']
    };
  }
  
  const updatedStoryBook = {
    id: id,
    title: storyBookData.title.trim(),
    description: storyBookData.description.trim(),
    theme: storyBookData.theme ? storyBookData.theme.trim() : '',
    storyIds: storyBookData.storyIds.filter(id => typeof id === 'string')
  };
  
  storyBooks[index] = updatedStoryBook;
  saveStoryBooks(storyBooks);
  
  return {
    success: true,
    storyBook: updatedStoryBook
  };
}

/**
 * Delete a story book by ID
 * @param {string} id - Story book ID to delete
 * @returns {boolean} True if deleted, false if not found
 */
export function deleteStoryBook(id) {
  const storyBooks = getStoryBooks();
  const index = storyBooks.findIndex(sb => sb.id === id);
  
  if (index === -1) {
    return false;
  }
  
  storyBooks.splice(index, 1);
  saveStoryBooks(storyBooks);
  return true;
}

/**
 * Clear all story books from localStorage
 */
export function clearStoryBooks() {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if an ID is a story book ID
 * @param {string} id - ID to check
 * @returns {boolean} True if it's a story book ID
 */
export function isStoryBookId(id) {
  return typeof id === 'string' && id.startsWith('storybook-');
}
