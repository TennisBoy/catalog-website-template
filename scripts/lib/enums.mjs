// Canonical enums for the writer (Node ESM). MUST mirror src/types.ts.
// A drift-guard test (catalogWrite.test.mjs) asserts these match src/types.ts.
export const CATEGORIES = [
  'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'ESL', 'French',
  'Theory of Knowledge', 'Board Games', 'Films', 'Book Club', 'NBE', 'Other / Uncategorized',
]
export const UNCATEGORIZED = 'Other / Uncategorized'
export const MATERIAL_TYPES = ['Book', 'Dictionary', 'ESL Material', 'Board Game', 'Film', 'Other']
