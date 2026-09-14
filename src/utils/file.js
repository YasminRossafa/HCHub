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

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Não foi possível gerar a imagem.'))), 'image/jpeg', quality)
  })
}

/**
 * Resizes an image file to fit within `maxDimension` on its longest side and
 * re-encodes it as JPEG, stepping quality down until it's under
 * `targetBytes` (or a quality floor is hit). Returns a JPEG Blob, ready to
 * upload to Firebase Storage — smaller files still mean faster uploads and
 * faster loads later, even without localStorage's size constraints.
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
    let blob = await canvasToBlob(canvas, quality)
    while (blob.size > targetBytes && quality > 0.3) {
      quality -= 0.15
      blob = await canvasToBlob(canvas, quality)
    }
    return blob
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
