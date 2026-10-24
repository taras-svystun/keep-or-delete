// Saves decisions as one JSON file in the app's documents folder, on the phone.

import { File, Paths } from 'expo-file-system';
import { Decisions } from './decisions';

const file = new File(Paths.document, 'decisions.json');

export function loadDecisions(): Decisions {
  if (!file.exists) return {};
  try {
    return JSON.parse(file.textSync()) as Decisions;
  } catch {
    // A broken file must not lock the app; worst case, photos show again.
    return {};
  }
}

export function saveDecisions(d: Decisions): void {
  if (!file.exists) file.create();
  file.writeSync(JSON.stringify(d));
}
