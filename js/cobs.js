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

/*
CONSISTENT OVERHEAD BYTE STUFFING (COBS)

DESCRIPTION:
COBS is an algorithm for encoding data for transmission that results
in efficient packet framing while only introducing a single additional
byte.

In COBS, the null character ("\0") is a reserved value that is not
allowed to appear. As a result, COBS replaces all null characters
with a non-zero value so that no zero value exists in the string.
This is known as "stuffing" the data. Transforming the data back to
its original value is known "unstuffing" the data.

To stuff the data, each zero data byte (null character) is replaced with
1 plus the number of non-zero bytes that follow up to a maximum of 254
non-zero bytes.  An overhead byte is added to the front of the frame
which is the distance to the first zero data byte.

EXAMPLES:

  Example 1
    Input                 -> Output
    "X"                   -> "\u0002X"
    "XY"                  -> "\u0003XY"
    "Hello, World!\u0000" -> "\u0014Hello, World!"

  Example 2*
    Input   -> Output
    [00]    -> [(Overhead byte N+1) + (Zero Byte N+1)]
    [00]    -> [(Overhead byte 0+1) + (Zero Byte 0+1)]
    [00]    -> [01 01]

  Example 3*
    Input      -> Output
    [00 00]    -> [(Overhead byte N+1) + (Zero Byte N+1) + (Zero Byte N+1)]
    [00 00]    -> [(Overhead byte 0+1) + (Zero Byte 0+1) + (Zero Byte N+1)]
    [00 00]    -> [01 01 01]

  Example 4*
    Input         -> Output
    [FF 00 AA 00] -> [(Overhead byte N + 1) + FF + (Zero byte N + 1) + AA]
    [FF 00 AA 00] -> [(Overhead byte 1 + 1) + FF + (Zero byte 1 + 1) + AA]
    [FF 00 AA 00] -> [02 FF 02 AA]

  Example 5*
    Input         -> Output
    [FF AA 00 AA 00] -> [(Overhead byte N + 1) + FF + AA + (Zero byte N + 1) + AA]
    [FF AA 00 AA 00] -> [(Overhead byte 2 + 1) + FF + AA + (Zero byte 1 + 1) + AA]
    [FF AA 00 AA 00] -> [03 FF AA 02 AA]

  Example 6*
    Input               -> Output
    [FF AA 00 00 AA 00] -> [(Overhead byte N + 1) + FF + AA + (Overhead byte N + 1) + (Zero byte N + 1) + AA]
    [FF AA 00 00 AA 00] -> [(Overhead byte 2 + 1) + FF + AA + (Overhead byte 0 + 1) + (Zero byte 1 + 1) + AA]
    [FF AA 00 00 AA 00] -> [03 FF AA 01 02 AA]

(* Input strings are represented as an array of hexadecimal values.)

REFERENCES:
  https://en.wikipedia.org/wiki/Consistent_Overhead_Byte_Stuffing
  http://www.stuartcheshire.org/papers/COBSforToN.pdf
*/

// Character used to demarcate the end of a frame.
const DELIMITER = "\u0000";

// The maximum length of a section that can be encoded in COBS.
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
 * @param {string} text - 
 * @return {array} - 
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

    frames.pop();

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

      if (frames[i].length === 0)
      {
        sections.push("");
      }

      startIndex = 0;  // Reset the index for the next frame
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
  var lines;
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

      result += text.substr(i + 1, sectionLength - 1);

      // Is the next section length less than MAX_SECTION_LENGTH?
      if (sectionLength < MAX_SECTION_LENGTH)
      {
        // DELIMITER goes at the end of the section
        result += DELIMITER;
      }
    }
  }

  return result;
}