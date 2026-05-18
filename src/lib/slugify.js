export function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\.[^/.]+$/, "")
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

