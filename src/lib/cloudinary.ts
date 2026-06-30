import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export interface UploadResult {
  url: string
  publicId: string
  width?: number
  height?: number
  format?: string
  bytes?: number
}

export async function uploadImage(
  file: Buffer | string,
  folder: string,
  options: {
    maxWidth?: number
    quality?: number
    format?: string
    transformation?: object[]
  } = {}
): Promise<UploadResult> {
  const { maxWidth = 1920, quality = 80, format = 'webp', transformation = [] } = options

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      typeof file === 'string' ? file : `data:image/jpeg;base64,${file.toString('base64')}`,
      {
        folder: `staynest/${folder}`,
        transformation: [
          { width: maxWidth, crop: 'limit' },
          { quality },
          { format },
          ...transformation,
        ],
        resource_type: 'image',
      },
      (error, result) => {
        if (error) reject(error)
        else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          })
        }
      }
    )
  })
}

export async function uploadVideo(file: Buffer | string, folder: string): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      typeof file === 'string' ? file : `data:video/mp4;base64,${file.toString('base64')}`,
      {
        folder: `staynest/${folder}`,
        resource_type: 'video',
        chunk_size: 6000000,
      },
      (error, result) => {
        if (error) reject(error)
        else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            bytes: result.bytes,
          })
        }
      }
    )
  })
}

export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    await cloudinary.uploader.destroy(publicId)
    return true
  } catch {
    return false
  }
}

export async function generateSignedUploadUrl(folder: string) {
  const timestamp = Math.round(new Date().getTime() / 1000)
  const params = {
    timestamp,
    folder: `staynest/${folder}`,
    upload_preset: 'staynest_upload',
  }
  
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!)
  
  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  }
}

export function getOptimizedUrl(publicId: string, options: {
  width?: number
  height?: number
  crop?: string
  quality?: number
} = {}): string {
  const { width, height, crop = 'fill', quality = 80 } = options
  return cloudinary.url(publicId, {
    transformation: [
      ...(width || height ? [{ width, height, crop }] : []),
      { quality },
      { format: 'webp' },
    ],
    secure: true,
  })
}
