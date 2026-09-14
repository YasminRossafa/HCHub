export const MAX_ANEXO_ORIGINAL_BYTES = 5 * 1024 * 1024
export const ANEXO_TARGET_BYTES = 150 * 1024
export const ANEXO_MAX_DIMENSION = 1000

export function isImageFile(file) {
  return file.type === 'image/jpeg' || file.type === 'image/png'
}

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ img, objectUrl })
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Não foi possível ler a imagem.'))
    }
    img.src = objectUrl
  })
}

/**
 * Resizes an image file to fit within `maxDimension` on its longest side and
 * re-encodes it as JPEG, stepping quality down until it's under
 * `targetBytes` (or a quality floor is hit). Returns a JPEG data URL — this
 * is what keeps a "5MB photo" from a phone camera down to a size that's
 * still reasonable to store in localStorage and, later, in a shareable link.
 */
export async function compressImage(file, { maxDimension = ANEXO_MAX_DIMENSION, targetBytes = ANEXO_TARGET_BYTES } = {}) {
  const { img, objectUrl } = await loadImageElement(file)
  try {
    const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight))
    const width = Math.max(1, Math.round(img.naturalWidth * scale))
    const height = Math.max(1, Math.round(img.naturalHeight * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, width, height)

    let quality = 0.85
    let dataUrl = canvas.toDataURL('image/jpeg', quality)
    // Base64 inflates bytes by ~4/3; approximate the decoded size from string length.
    while (dataUrl.length * 0.75 > targetBytes && quality > 0.3) {
      quality -= 0.15
      dataUrl = canvas.toDataURL('image/jpeg', quality)
    }
    return dataUrl
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
