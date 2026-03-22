export const TAG_COLORS: Record<string, string> = {
  important: '#ff6b6b',
  review:    '#ffa94d',
  note:      '#74c0fc',
  question:  '#a9e34b',
  todo:      '#da77f2',
  key:       '#f783ac',
};

export function parseTags(description: string): string[] {
  if (!description) return [];
  const matches = description.match(/#(\w+)/g);
  return matches ? matches.map(t => t.slice(1).toLowerCase()) : [];
}

export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 60%, 60%)`;
}

export function getTagColor(tags: string[]): string {
  if (!tags || tags.length === 0) return '#4da1ee';
  return TAG_COLORS[tags[0]] || stringToColor(tags[0]);
}
