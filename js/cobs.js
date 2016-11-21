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
All examples are hexadecimal character codes in a string.

Example 1
Input                 -> Output
"Hello, World!\u0000" -> "\u0014Hello, World!"

Example 2
Input -> Output
00    -> (Overhead byte N+1) + (Zero Byte N+1)
00    -> (Overhead byte 0+1) + (Zero Byte 0+1)
00    -> 01 01

Example 3
Input       -> Output
FF 00 AA 00 -> (Overhead byte N + 1) + FF + (Zero byte N + 1) + AA
FF 00 AA 00 -> (Overhead byte 1 + 1) + FF + (Zero byte 1 + 1) + AA
FF 00 AA 00 -> 02 FF 02 AA

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
 * 
 * @param {string} text - 
 */
function getSections(text)
{
  var sections;
  var count;
  var index = 0;

  if ((typeof text === "string") && (text !== ""))
  {
    sections = new Array(text.length / MAX_SECTION_LENGTH + 0.5 | 0);
    count = sections.length;

    for (var i = 0; i < count; i++)
    {
      sections[i] = text.substr(index, MAX_SECTION_LENGTH);
      index += sections[i].length;
    }
  }

  return sections;
}

/*
 * Returns a COBS-encoded string.
 * @param {string} text - The specified string to encode with COBS.
 * return {string} - A COBS encoded string.
 */
// TODO: Rename variable lines to sections
// TODO: Rename lines to something more useful, these are not lines
function stuff(text)
{
  var lines;
  var sections;
  var result = "";
  var i = 0;

  if ((typeof text === "string") && (text !== ""))
  {
    // Split the text by our delimiter 
    lines = text.split(DELIMITER);

    // Now, split the text by the maximum section length
    do
    {
      sections = getSections(lines[i], MAX_SECTION_LENGTH);

      if (sections.length > 0)
      {
        lines.splice.apply(lines, [i, 1].concat(sections));
      }

      i += sections.length;
    }
    while (sections.length > 0)

    for (var i = 0; i < lines.length; i++)
    {
      if (lines[i].length < MAX_SECTION_LENGTH)
      {
        lines[i] = String.fromCharCode(lines[i].length + 1) + lines[i];
      }
      else
      {
        lines[i] = String.fromCharCode(MAX_SECTION_LENGTH + 1) + lines[i];
      }
    }

    result = lines.join("");
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
  var index = 0;
  var result = "";

  if ((typeof text === "string") && (text !== ""))
  {
    for (var i = 0; i < text.length - 1;)
    {
      index = text.charCodeAt(i);
      result = replaceCharAt(text, i, DELIMITER);
      i += index;
    }

    result = result.slice(1);
    result += DELIMITER;
  }

  return result;
}
