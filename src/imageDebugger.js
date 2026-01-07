/**
 * Image Debugging and Validation System
 * 
 * This module provides comprehensive debugging tools for tracking image loading issues,
 * validating URLs, and identifying filename mismatches between database and storage.
 */

// Supported image file extensions
const IMAGE_EXTENSIONS_REGEX = /\.(jpg|jpeg|png|gif|webp)$/i;

// Development mode - can be controlled via environment variable
export const isDevelopmentMode = () => {
  return import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV;
};

/**
 * Logs detailed information about image loading
 * @param {string} stage - The stage of image processing (e.g., 'database', 'url_generation', 'load_success', 'load_error')
 * @param {Object} data - Data to log
 */
export const logImageDebug = (stage, data) => {
  const timestamp = new Date().toISOString();
  const prefix = '🖼️ [IMAGE DEBUG]';
  
  console.group(`${prefix} ${stage.toUpperCase()} - ${timestamp}`);
  
  switch (stage) {
    case 'database':
      console.log('📊 Database Entry:', {
        year: data.year,
        make: data.make,
        model: data.model,
        file_name: data.file_name,
        file_name_type: typeof data.file_name,
        file_name_length: data.file_name?.length,
        has_spaces: data.file_name?.includes(' '),
        has_special_chars: /[^a-zA-Z0-9._\-/]/.test(data.file_name || '')
      });
      break;
      
    case 'url_generation':
      console.log('🔗 Generated URL:', data.url);
      console.log('📝 URL Analysis:', {
        length: data.url?.length,
        has_encoded_spaces: data.url?.includes('%20'),
        has_unencoded_spaces: data.url?.includes(' '),
        protocol: data.url?.split(':')[0],
        bucket: data.bucket || 'Cars88'
      });
      break;
      
    case 'url_validation':
      console.log('✅ URL Validation:', {
        is_valid: data.is_valid,
        issues: data.issues || [],
        suggestions: data.suggestions || []
      });
      break;
      
    case 'load_success':
      console.log('✅ Image Loaded Successfully:', {
        file_name: data.file_name,
        url: data.url,
        make: data.make,
        model: data.model
      });
      break;
      
    case 'load_error':
      console.error('❌ Image Load Failed:', {
        file_name: data.file_name,
        attempted_url: data.url,
        make: data.make,
        model: data.model,
        error: data.error || 'Unknown error'
      });
      console.log('💡 Troubleshooting Tips:', {
        tips: [
          'Check if the filename in database matches the file in Supabase storage',
          'Verify file extension (.jpg vs .JPG)',
          'Check for spaces or special characters in filename',
          'Ensure the file exists in the Cars88 bucket',
          'Verify bucket permissions are set to public'
        ]
      });
      break;
      
    default:
      console.log('Data:', data);
  }
  
  console.groupEnd();
};

/**
 * Validates a filename for common issues
 * @param {string} filename - The filename to validate
 * @returns {Object} Validation result with issues and suggestions
 */
export const validateFilename = (filename) => {
  const issues = [];
  const suggestions = [];
  
  if (!filename) {
    issues.push('Filename is empty or undefined');
    suggestions.push('Ensure the file_name field in database is populated');
    return { is_valid: false, issues, suggestions };
  }
  
  // Check for spaces
  if (filename.includes(' ')) {
    issues.push('Filename contains spaces');
    suggestions.push('Spaces will be URL-encoded as %20 in the URL');
  }
  
  // Check for special characters (excluding common safe ones)
  const specialChars = filename.match(/[^a-zA-Z0-9._\-/]/g);
  if (specialChars && specialChars.length > 0) {
    issues.push(`Filename contains special characters: ${[...new Set(specialChars)].join(', ')}`);
    suggestions.push('Special characters may need URL encoding');
  }
  
  // Check for file extension
  const hasExtension = IMAGE_EXTENSIONS_REGEX.test(filename);
  if (!hasExtension) {
    issues.push('Filename may be missing a standard image extension');
    suggestions.push('Add .jpg, .jpeg, .png, or other image extension');
  }
  
  // Check for mixed case extensions
  const extensionMatch = filename.match(IMAGE_EXTENSIONS_REGEX);
  if (extensionMatch) {
    const ext = extensionMatch[0];
    if (ext !== ext.toLowerCase()) {
      issues.push(`File extension has mixed case: ${ext}`);
      suggestions.push(`Ensure storage file has exact same case as database: ${ext}`);
    }
  }
  
  // Check for leading/trailing spaces
  if (filename !== filename.trim()) {
    issues.push('Filename has leading or trailing spaces');
    suggestions.push('Remove leading/trailing spaces from database entry');
  }
  
  return {
    is_valid: issues.length === 0,
    issues,
    suggestions
  };
};

/**
 * Validates a generated URL for accessibility issues
 * @param {string} url - The URL to validate
 * @returns {Object} Validation result
 */
export const validateUrl = (url) => {
  const issues = [];
  const suggestions = [];
  
  if (!url) {
    issues.push('URL is empty or undefined');
    return { is_valid: false, issues, suggestions };
  }
  
  // Check for unencoded spaces
  if (url.includes(' ')) {
    issues.push('URL contains unencoded spaces');
    suggestions.push('Spaces should be encoded as %20');
  }
  
  // Check for valid protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    issues.push('URL is missing http:// or https:// protocol');
    suggestions.push('Ensure Supabase URL is properly configured');
  }
  
  // Check URL structure
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname) {
      issues.push('URL has invalid hostname');
    }
  } catch (e) {
    issues.push(`URL is malformed: ${e.message}`);
    suggestions.push('Check the generated URL structure');
  }
  
  return {
    is_valid: issues.length === 0,
    issues,
    suggestions
  };
};

/**
 * Properly encodes a filename for use in URLs
 * Handles spaces, special characters, but preserves path separators
 * @param {string} filename - The filename to encode
 * @returns {string} Properly encoded filename
 */
export const encodeFilename = (filename) => {
  if (!filename) return '';
  
  // Split by forward slash to preserve path structure
  const parts = filename.split('/');
  
  // Encode each part separately
  const encodedParts = parts.map(part => {
    // encodeURIComponent encodes spaces as %20 and handles special characters
    return encodeURIComponent(part);
  });
  
  return encodedParts.join('/');
};

/**
 * Main debug function that logs comprehensive information about a car's image
 * @param {Object} car - The car object from database
 * @param {string} generatedUrl - The generated image URL
 */
export const debugCarImage = (car, generatedUrl) => {
  if (!isDevelopmentMode()) return;
  
  // Log database info
  logImageDebug('database', car);
  
  // Validate filename
  const filenameValidation = validateFilename(car.file_name);
  logImageDebug('url_validation', { 
    type: 'filename',
    is_valid: filenameValidation.is_valid,
    issues: filenameValidation.issues,
    suggestions: filenameValidation.suggestions
  });
  
  // Log URL generation
  logImageDebug('url_generation', { 
    url: generatedUrl,
    bucket: 'Cars88'
  });
  
  // Validate URL
  const urlValidation = validateUrl(generatedUrl);
  logImageDebug('url_validation', { 
    type: 'url',
    is_valid: urlValidation.is_valid,
    issues: urlValidation.issues,
    suggestions: urlValidation.suggestions
  });
};

/**
 * Enhanced error handler for image loading failures
 * @param {Object} car - The car object
 * @param {string} url - The attempted URL
 * @param {Event} event - The error event
 */
export const handleImageError = (car, url, event) => {
  logImageDebug('load_error', {
    file_name: car.file_name,
    url: url,
    make: car.make,
    model: car.model,
    error: event?.type || 'Load failed'
  });
};

/**
 * Success handler for image loading
 * @param {Object} car - The car object
 * @param {string} url - The loaded URL
 */
export const handleImageSuccess = (car, url) => {
  if (!isDevelopmentMode()) return;
  
  logImageDebug('load_success', {
    file_name: car.file_name,
    url: url,
    make: car.make,
    model: car.model
  });
};

/**
 * Performs a comprehensive validation check on all cars
 * Used for batch validation when new images are added
 * @param {Array} cars - Array of car objects
 * @returns {Object} Summary of validation results
 */
export const validateAllImages = (cars) => {
  console.log('');
  console.log('🔍 === COMPREHENSIVE IMAGE VALIDATION REPORT ===');
  console.log('');
  
  const results = {
    total: cars.length,
    valid: 0,
    issues: [],
    summary: {}
  };
  
  cars.forEach((car, index) => {
    const filenameValidation = validateFilename(car.file_name);
    
    if (!filenameValidation.is_valid) {
      results.issues.push({
        index: index + 1,
        car: `${car.make} ${car.model} (${car.year})`,
        file_name: car.file_name,
        problems: filenameValidation.issues,
        suggestions: filenameValidation.suggestions
      });
    } else {
      results.valid++;
    }
  });
  
  console.log(`✅ Valid images: ${results.valid}/${results.total}`);
  console.log(`❌ Images with issues: ${results.issues.length}/${results.total}`);
  
  if (results.issues.length > 0) {
    console.log('');
    console.log('⚠️  Issues found:');
    console.log('');
    results.issues.forEach(issue => {
      console.group(`${issue.index}. ${issue.car}`);
      console.log('File name:', issue.file_name);
      console.log('Problems:', issue.problems);
      console.log('Suggestions:', issue.suggestions);
      console.groupEnd();
    });
  }
  
  console.log('');
  console.log('=== END VALIDATION REPORT ===');
  console.log('');
  
  return results;
};

// Default export with all functions
export default {
  logImageDebug,
  validateFilename,
  validateUrl,
  encodeFilename,
  debugCarImage,
  handleImageError,
  handleImageSuccess,
  validateAllImages,
  isDevelopmentMode
};
