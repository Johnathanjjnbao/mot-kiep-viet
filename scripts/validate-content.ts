import { validateContent } from '../src/content/validation';
const result = validateContent();
console.log(JSON.stringify(result, null, 2));
if (result.errors.length) process.exitCode = 1;
