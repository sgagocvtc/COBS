/*
The MIT License (MIT)

Copyright (c) 2016 Steven Gago

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

// Character used to demarcate the end of a frame.
const DELIMITER = "\u0000";

// The maximum length of a section that can be encoded in COBS.
// Normally, this is 0xFF, but this makes it play with, test, etc.
const MAX_SECTION_LENGTH = 0x05;

/*
 * Returns a new string in which a character at a specified
 * index is replaced with a given character.
 * @param {string} text - The string to replace the character in.
 * @param {number} index - Index of the character to replace.
 * @param {string} char - The character to replace at the specified index.
 * @return {string} - A string with the replaced character.
 */
function replaceCharAt(text, index, char)
{
  var result = "";

  // Does the index exist in the string?
  if ((index >= 0) && (index < text.length - 1))
  {
    // Replace the character at the specified position
    result = text.substr(0, index) + char + text.substr(index + 1);
  }

  return result;
}

/*
 * Returns a array of strings in which the given text is
 * split first by DELIMITER and then by MAX_SECTION_LENGTH.
 * @param {string} text - The string to divide into sections.
 * @return {array} - An array of the given string divided into sections.
 */
function getSections(text)
{
  var frames;
  var section;
  var sections = [];
  var startIndex = 0;
  var endIndex = 0;

  if ((typeof text === "string") && (text !== ""))
  {
    // Split the text by our delimiter
    frames = text.split(DELIMITER);

    // For each frame...
    for (var i = 0; i < frames.length; i++)
    {
      // While startIndex is less than length of a given frame...
      while (startIndex < frames[i].length)
      {
        // Get last index
        endIndex = startIndex + MAX_SECTION_LENGTH - 1;
        
        // Slice off the next section from our frame
        // Up to endIndex or end of the string.
        section = frames[i].slice(startIndex, endIndex);

        // Append the new section to sections array
        sections.push(section);

        // Get the starting index of the next section
        startIndex += section.length;
      }

      // Is this frame an empty string?
      if (frames[i].length === 0)
      {
        // Append an empty string onto sections
        sections.push("");
      }

      // Reset the startIndex for the next frame
      startIndex = 0;
    }
  }

  return sections;
}

/*
 * Returns a COBS-encoded string.
 * @param {string} text - The specified string to encode with COBS.
 * return {string} - A COBS encoded string.
 */
function stuff(text)
{
  var sections;
  var result = "";
  var i = 0;

  if ((typeof text === "string") && (text !== ""))
  {
    // Divide text into an array of strings
    sections = getSections(text);

    // For each section...
    for (var i = 0; i < sections.length; i++)
    {
      // Prepend the section with its length + 1
      sections[i] = String.fromCharCode(sections[i].length + 1) + sections[i];
    }

    // Append the final zero byte
    sections.push("\u0000");

    // Join all sections together and store as final result
    result = sections.join("");
  }

  return result;
}

/*
 * Returns a COBS-decoded string.
 * @param {string} text - The specified COBS-encoded string to decode.
 * @return {string} - A COBS-decoded string.
 */
function unstuff(text)
{
  var sectionLength = 0;
  var result = "";

  if ((typeof text === "string") && (text !== ""))
  {
    for (var i = 0; i < text.length - 1; i += sectionLength)
    {
      // Get length of the next section
      sectionLength = text.charCodeAt(i);

      // Is the sectionLength + i - 1 a valid index position in the string?
      if (text.length < (i + sectionLength - 1))
      {
        // Uhoh, text is an improper COBS encoded string
        // Let's tell the user and give up
        alert("Error: Invalid COBS encoded string \"" + text + "\".");
        results = "";
        break;
      }

      // Append the next section
      result += text.substr(i + 1, sectionLength - 1);

      // Is the next section length less than MAX_SECTION_LENGTH?
      if (sectionLength < MAX_SECTION_LENGTH)
      {
        // DELIMITER goes at the end of the section
        result += DELIMITER;
      }
    }

    // Is there a final null character in result?
    if (result[result.length - 1] === "\u0000")
    {
      // Remove null character at the end of the string
      result = result.slice(0, result.length - 1);
    }
  }

  return result;
}