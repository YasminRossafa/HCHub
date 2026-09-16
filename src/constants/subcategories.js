/**
 * Sub-classification for the categories that require one. Each category key
 * maps to its own list of subcategories — these are independent, category-
 * scoped sets, not a shared enum, so the same label/key (e.g. "ACIEPE") can
 * appear under more than one category without meaning the same thing.
 *
 * A category not listed here has no subcategories at all: the certificate
 * form skips the field entirely, and `certificado.subcategoria` is never
 * stored for it.
 */
export const SUBCATEGORIES_BY_CATEGORY = {
  extensao: [
    { key: 'projetosExtensao', label: 'Projetos de Extensão' },
    { key: 'entidades', label: 'Entidades' },
    { key: 'cursosMinistrados', label: 'Cursos Ministrados' },
    { key: 'aciepe', label: 'ACIEPE' },
  ],
  atividadesComplementares: [
    { key: 'palestra', label: 'Palestra' },
    { key: 'aciepe', label: 'ACIEPE' },
    { key: 'monitoria', label: 'Monitoria' },
    { key: 'ic', label: 'IC' },
    { key: 'eventosAcademicos', label: 'Eventos Acadêmicos' },
  ],
}

/** Whether `categoryKey` requires a `subcategoria` on its certificates. */
export function categoryHasSubcategories(categoryKey) {
  return categoryKey in SUBCATEGORIES_BY_CATEGORY
}

/** The subcategory list for `categoryKey`, or `[]` if it has none. */
export function getSubcategoryOptions(categoryKey) {
  return SUBCATEGORIES_BY_CATEGORY[categoryKey] ?? []
}

/** The display label for `subcategoryKey` within `categoryKey`, or `null` if it doesn't resolve to one. */
export function getSubcategoryLabel(categoryKey, subcategoryKey) {
  return getSubcategoryOptions(categoryKey).find((option) => option.key === subcategoryKey)?.label ?? null
}
