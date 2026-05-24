import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

const BUCKET = 'plan-images'
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
const MAX_BYTES = 3 * 1024 * 1024 // 3 MB

async function ensureBucket() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  if (buckets?.find((b) => b.name === BUCKET)) return
  await supabaseAdmin.storage.createBucket(BUCKET, { public: true, allowedMimeTypes: ALLOWED_TYPES, fileSizeLimit: MAX_BYTES })
}

export async function POST(req: Request) {
  try {
    await requireAdmin()
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await req.formData()
  const file = form.get('file') as File | null

  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) return Response.json({ error: 'Only JPG and PNG files are allowed' }, { status: 400 })
  if (file.size > MAX_BYTES) return Response.json({ error: 'File too large (max 3 MB)' }, { status: 400 })

  await ensureBucket()

  const ext = file.type === 'image/png' ? 'png' : 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(filename, bytes, {
    contentType: file.type,
    upsert: false,
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filename)

  return Response.json({ url: publicUrl })
}
