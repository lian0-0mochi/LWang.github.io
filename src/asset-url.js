export function assetUrl(path, base = import.meta.env?.BASE_URL ?? '/') {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return path;
  return `${base}${path.slice(1)}`;
}

export function assetSrcSet(srcSet, base) {
  return srcSet?.split(',').map((source) => {
    const [path, width] = source.trim().split(/\s+/);
    return `${assetUrl(path, base)} ${width}`;
  }).join(', ');
}
