const BASE = process.env.REACT_APP_ASSET_URL ?? "";

const assetUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BASE}${path}`;
};

export default assetUrl;
