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

const DELIMITER = "\u0000";
const MAX_SECTION_LENGTH = 0xFF;

function getChunks(text)
{
  var frames = "";
  var count;
  var index = 0;

  if ((typeof text === "string") && (text !== "") && (text !== null))
  {
    frames = new Array(text.length / MAX_SECTION_LENGTH + 0.5 | 0);
    count = frames.length;

    for (var i = 0; i < count; i++)
    {
      frames[i] = text.substr(index, MAX_SECTION_LENGTH);
      index += frames[i].length;
    }
  }

  return frames;
}

function replaceCharAt(text, index, char)
{
  var result = "";

  if (index < text.length - 1)
  {
    result = text.substr(0, index) + char + text.substr(index + 1);
  }

  return result;
}

function stuff(text)
{
  var lines;
  var result = "";
  var chunks;
  var i = 0;

  if ((typeof text === "string") && (text !== "") && (text !== null))
  {
    lines = text.split(DELIMITER);

    do
    {
      chunks = getChunks(lines[i], MAX_SECTION_LENGTH);

      if (chunks.length > 0)
      {
        lines.splice.apply(lines, [i, 1].concat(chunks));
      }

      i += chunks.length;
    }
    while (chunks.length > 0)

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

function unstuff(text)
{
  var index = 0;
  var result = "";

  if ((typeof text === "string") && (text !== "") && (text !== null))
  {
    for (var i = 0; i < text.length;)
    {
      index = text.charCodeAt(i);
      result = replaceCharAt(text, i, DELIMITER);
      i += index;
    }

    result = result.slice(1);
  }

  return result;
}
