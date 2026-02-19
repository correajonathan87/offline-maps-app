const DB_KEY = 'offline-osm-data-v1';

const defaultState = {
  pois: [],
  routes: [],
  mapEdits: []
};

export function loadState() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) return structuredClone(defaultState);
  try {
    const parsed = JSON.parse(raw);
    return { ...structuredClone(defaultState), ...parsed };
  } catch {
    return structuredClone(defaultState);
  }
}

export function saveState(state) {
  localStorage.setItem(DB_KEY, JSON.stringify(state));
}
