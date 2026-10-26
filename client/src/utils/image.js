const MAX_SOURCE_BYTES = 8 * 1024 * 1024
const MAX_OUTPUT_CHARS = 1.8 * 1024 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not read that image. Try another file.'))
    image.src = src
  })
}

// Resizes a photo before upload so trainer profiles stay small. The API stores
// the compressed data URL directly in the trainers.img column.
export async function imageFileToDataUrl(file, { maxWidth = 720, maxHeight = 900, quality = 0.82 } = {}) {
  if (!file) throw new Error('Choose a photo to upload.')
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Choose a PNG, JPG or WebP photo.')
  if (file.size > MAX_SOURCE_BYTES) throw new Error('That photo is larger than 8 MB. Please choose a smaller file.')

  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await loadImage(objectUrl)
    const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight)
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Your browser could not process that photo.')

    context.fillStyle = '#1b1d22'
    context.fillRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)

    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    if (dataUrl.length > MAX_OUTPUT_CHARS) {
      throw new Error('That photo is still too large after resizing. Try a smaller image.')
    }
    return dataUrl
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

// Seed images are plain filenames; uploaded photos are data URLs.
export function trainerImageSrc(img) {
  if (!img) return ''
  if (/^(data:|blob:|https?:\/\/|\/)/i.test(img)) return img
  return `/images/${img}`
}
