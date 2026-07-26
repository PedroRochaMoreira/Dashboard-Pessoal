const PALETTE = [
  '#b87333', '#d4a373', '#e0b15c', '#c96f4a',
  '#a67c52', '#8a5225', '#d99b6c', '#996633',
];

export function tagColor(tag) {
  if (!tag) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

export function isImportantTag(tag) {
  return Boolean(tag) && tag.toLowerCase().includes('importante');
}