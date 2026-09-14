export const MAX_ANEXO_BYTES = 400 * 1024

export function isAcceptedAnexoType(file) {
  return file.type.startsWith('image/') || file.type === 'application/pdf'
}

/** Reads a File as a base64 data URL (embeds its mime type, so no need to track it separately). */
export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler o arquivo.'))
    reader.readAsDataURL(file)
  })
}
