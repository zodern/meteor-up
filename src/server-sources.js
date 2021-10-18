export const serverSources = Object.create(null);

export function registerServerSource(type, { load, upToDate, update } = {}) {
  if (type in serverSources) {
    throw new Error(`Duplicate server sources: ${type}`);
  }

  serverSources[type] = { load, upToDate, update };
}
