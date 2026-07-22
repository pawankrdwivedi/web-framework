class StringUtils {
  /**
   * Compares two strings.
   * @param {string} str1 First string
   * @param {string} str2 Second string
   * @param {boolean} ignoreCase Whether to ignore case (default: true)
   * @returns {boolean} True if strings are equal, false otherwise
   */
  static compare(str1, str2, ignoreCase = true) {
    if (typeof str1 !== 'string' || typeof str2 !== 'string') return false;
    if (ignoreCase) {
      return str1.toLowerCase() === str2.toLowerCase();
    }
    return str1 === str2;
  }

  /**
   * Checks if a string includes a target string.
   * @param {string} source The source string
   * @param {string} target The target string to look for
   * @param {boolean} ignoreCase Whether to ignore case (default: true)
   * @returns {boolean} True if target is found within source
   */
  static includes(source, target, ignoreCase = true) {
    if (typeof source !== 'string' || typeof target !== 'string') return false;
    if (ignoreCase) {
      return source.toLowerCase().includes(target.toLowerCase());
    }
    return source.includes(target);
  }

  /**
   * Removes all special characters from a string, leaving only alphanumeric characters and spaces.
   * @param {string} str The string to process
   * @returns {string} The processed string without special characters
   */
  static removeSpecialCharacters(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[^a-zA-Z0-9\s]/g, '');
  }

  /**
   * Removes all special characters and spaces from a string, leaving only alphanumeric characters.
   * @param {string} str The string to process
   * @returns {string} The processed string without special characters and spaces
   */
  static removeSpecialCharactersAndSpaces(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Capitalizes the first letter of a string.
   * @param {string} str The string to capitalize
   * @returns {string} The capitalized string
   */
  static capitalize(str) {
    if (typeof str !== 'string' || str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export default StringUtils;
