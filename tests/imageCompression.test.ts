import { describe, it, expect, vi, beforeEach } from 'vitest'

const { compressMock } = vi.hoisted(() => ({ compressMock: vi.fn() }))
vi.mock('browser-image-compression', () => ({ default: compressMock }))

import { compressImage } from '@/lib/imageCompression'

describe('compressImage', () => {
  beforeEach(() => compressMock.mockReset())

  it('requests a small WebP and returns the compressed file', async () => {
    const input = new File(['x'], 'a.png', { type: 'image/png' })
    const output = new File(['y'], 'a.webp', { type: 'image/webp' })
    compressMock.mockResolvedValue(output)

    const result = await compressImage(input, { maxSizeMB: 0.2 })

    expect(result).toBe(output)
    expect(compressMock).toHaveBeenCalledWith(
      input,
      expect.objectContaining({ fileType: 'image/webp', maxSizeMB: 0.2, maxWidthOrHeight: 1024 }),
    )
  })
})
