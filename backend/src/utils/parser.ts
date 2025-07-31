import { type Environment } from '../models/environment.js';

/**
 * Function to parse CLI output into Environment objects
 */
export function parseEnvironmentList(output: string): Environment[] {
  const lines = output.trim().split('\n');
  // Skip the header line
  const dataLines = lines.slice(1);

  return dataLines.map(line => {
    // Split by multiple spaces to handle the column format
    const parts = line.split(/\s{2,}/).filter(part => part.trim());
    if (parts.length >= 4) {
      return {
        id: parts[0].trim(),
        title: parts[1].trim(),
        created: parts[2].trim(),
        updated: parts[3].trim()
      };
    }
    return null;
  }).filter((env): env is Environment => env !== null);
}
