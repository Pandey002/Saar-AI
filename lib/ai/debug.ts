import fs from 'fs';
import path from 'path';

export function debugLog(data: any) {
  const logPath = path.join(process.cwd(), 'debug_ai.log');
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `${timestamp}: ${JSON.stringify(data, null, 2)}\n`);
}
