export function normalizeRemoteMediaUrl(value: string) {
  const url = value.trim();

  if (url.startsWith('http://')) {
    return `https://${url.slice('http://'.length)}`;
  }

  return url;
}
