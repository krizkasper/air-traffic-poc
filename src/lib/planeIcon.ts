export function createPlaneIcon(size = 32, color = '#3fb6ff'): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = color

  // Simple triangle pointing up (nose north, heading 0)
  ctx.beginPath()
  ctx.moveTo(size / 2, 0)
  ctx.lineTo(size, size)
  ctx.lineTo(size / 2, size * 0.7)
  ctx.lineTo(0, size)
  ctx.closePath()
  ctx.fill()

  return ctx.getImageData(0, 0, size, size)
}
