export interface CompressOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
}

/**
 * Compress an image to a small WebP File. `browser-image-compression` is loaded
 * dynamically so it is code-split out of the main bundle.
 */
export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  const { default: imageCompression } = await import('browser-image-compression')
  return imageCompression(file, {
    maxSizeMB: opts.maxSizeMB ?? 0.3,
    maxWidthOrHeight: opts.maxWidthOrHeight ?? 1024,
    useWebWorker: false,
    fileType: 'image/webp',
  })
}
