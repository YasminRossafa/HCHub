/** Lowercases, strips accents, and dashes-out whitespace — for building filenames from a person's name. */
export function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
}
