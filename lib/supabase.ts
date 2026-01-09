import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Storage bucket name for avatars
export const AVATAR_BUCKET = 'avatars'

export async function uploadAvatar(file: File, userId: string): Promise<string | null> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    const { error } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
        })

    if (error) {
        console.error('Error uploading avatar:', error)
        return null
    }

    const { data } = supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(filePath)

    return data.publicUrl
}

export async function deleteAvatar(url: string): Promise<boolean> {
    // Extract file path from URL
    const parts = url.split(`/${AVATAR_BUCKET}/`)
    if (parts.length < 2) return false

    const filePath = parts[1]

    const { error } = await supabase.storage
        .from(AVATAR_BUCKET)
        .remove([filePath])

    return !error
}
