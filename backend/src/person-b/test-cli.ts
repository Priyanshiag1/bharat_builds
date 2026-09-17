import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const cliCommand = 'npx tsx src/person-b/cli.ts';

function runCommand(command: string) {
  try {
    return execSync(command, { stdio: 'pipe', encoding: 'utf-8' });
  } catch (error: any) {
    return (error.stdout || '') + '\n' + (error.stderr || '');
  }
}

console.log('=== TEST 1: Successful Execution ===');
const res1 = runCommand(`${cliCommand} src/person-b/fixtures/data/claim-1.json`);
if (res1.includes('--- COMPLETE JSON RESULT ---')) console.log('✅ Success: claim-1 processed.');
else throw new Error('Test 1 Failed');

console.log('=== TEST 2: Missing Fixture Path ===');
const res2 = runCommand(`${cliCommand}`);
if (res2.includes('ERROR: Missing fixture path')) console.log('✅ Success: Error caught for missing path.');
else throw new Error('Test 2 Failed');

console.log('=== TEST 3: Invalid JSON ===');
const invalidPath = 'src/person-b/fixtures/data/invalid.json';
fs.writeFileSync(invalidPath, '{ invalid json');
const res3 = runCommand(`${cliCommand} ${invalidPath}`);
fs.unlinkSync(invalidPath);
if (res3.includes('ERROR loading fixture: Invalid JSON')) console.log('✅ Success: Invalid JSON handled.');
else throw new Error('Test 3 Failed');

console.log('=== TEST 4: Missing Required Fields ===');
const missingPath = 'src/person-b/fixtures/data/missing.json';
fs.writeFileSync(missingPath, '{"documents":[]}');
const res4 = runCommand(`${cliCommand} ${missingPath}`);
fs.unlinkSync(missingPath);
if (res4.includes('missing required claimId field')) console.log('✅ Success: Missing required field handled.');
else throw new Error('Test 4 Failed');

console.log('\nAll CLI tests passed!');
