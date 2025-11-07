// Comprehensive test of the parser
import { SpeechParser } from './src/speech-parser.ts';

const parser = new SpeechParser();

const testCases = [
  'two squared',
  '2 squared',
  'five cubed',
  'ten squared',
  'three squared plus four',
  'two squared times five',
  'square root of sixteen',
  'five plus three',
  'what is two squared',
];

console.log('Parser Test Results:');
console.log('='.repeat(50));

testCases.forEach(input => {
  const result = parser.parse(input);
  console.log(`Input:  "${input}"`);
  console.log(`Output: "${result}"`);
  console.log('-'.repeat(50));
});
