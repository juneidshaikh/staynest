import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { uploadImage, uploadVideo } from '@/lib/cloudinary'
import { uploadRateLimit } from '@/lib/rate-limit'

async function postHandler(req: AuthenticatedRequest) {
  const limited = uploadRateLimit(req)
  if (limited) return limited

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'general'
    const type = (formData.get('type') as string) || 'image'

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/avi', 'video/webm']

    if (type === 'image' && !allowedImageTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid image format. Use JPEG, PNG, or WebP.' }, { status: 400 })
    }
    if (type === 'video' && !allowedVideoTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid video format. Use MP4, MOV, or WebM.' }, { status: 400 })
    }

    // Size limits
    const maxImageSize = 10 * 1024 * 1024 // 10MB
    const maxVideoSize = 100 * 1024 * 1024 // 100MB
    if (type === 'image' && file.size > maxImageSize) {
      return NextResponse.json({ success: false, error: 'Image too large. Max size is 10MB.' }, { status: 400 })
    }
    if (type === 'video' && file.size > maxVideoSize) {
      return NextResponse.json({ success: false, error: 'Video too large. Max size is 100MB.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    
    let result
    if (type === 'video') {
      result = await uploadVideo(buffer, folder)
    } else {
      result = await uploadImage(buffer, folder, {
        maxWidth: 1920,
        quality: 80,
      })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}

// GET signed upload URL
async function getHandler(req: AuthenticatedRequest) {
  try {
    const url = new URL(req.url)
    const folder = url.searchParams.get('folder') || 'general'
    const { generateSignedUploadUrl } = await import('@/lib/cloudinary')
    const signedUrl = await generateSignedUploadUrl(folder)
    return NextResponse.json({ success: true, data: signedUrl })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to generate upload URL' }, { status: 500 })
  }
}

export const POST = withAuth(postHandler)
export const GET = withAuth(getHandler)
