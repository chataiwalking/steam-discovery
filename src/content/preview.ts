export function previewURL(id: string): string {
  return `${import.meta.env.BASE_URL}previews/${id}.png?v=${__PREVIEW_REVISIONS__[id]}`;
}
