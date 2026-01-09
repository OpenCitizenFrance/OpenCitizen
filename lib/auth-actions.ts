'use server'

import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { signIn } from '@/auth'
import { redirect } from 'next/navigation'

export type RegisterResult = {
    success: boolean
    error?: string
}

export async function registerUser(formData: FormData): Promise<RegisterResult> {
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const constituencyCode = formData.get('constituencyCode') as string | null
    const bio = formData.get('bio') as string | null
    const imageUrl = formData.get('imageUrl') as string | null

    // Validation
    if (!name || !email || !password) {
        return { success: false, error: 'Tous les champs obligatoires doivent être remplis.' }
    }

    if (password.length < 8) {
        return { success: false, error: 'Le mot de passe doit contenir au moins 8 caractères.' }
    }

    if (password !== confirmPassword) {
        return { success: false, error: 'Les mots de passe ne correspondent pas.' }
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { email }
    })

    if (existingUser) {
        return { success: false, error: 'Un compte existe déjà avec cet email.' }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    try {
        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                constituencyCode: constituencyCode || null,
                bio: bio || null,
                image: imageUrl || null
            }
        })

        return { success: true }
    } catch (error) {
        console.error('Registration error:', error)
        return { success: false, error: 'Une erreur est survenue lors de l\'inscription.' }
    }
}

export async function loginWithCredentials(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
        await signIn('credentials', {
            email,
            password,
            redirect: false
        })
        redirect('/groupes/dashboard')
    } catch (error) {
        return { error: 'Email ou mot de passe incorrect.' }
    }
}

export async function loginWithGitHub() {
    await signIn('github', { redirectTo: '/groupes/dashboard' })
}

// ============================================
// PASSWORD RESET
// ============================================

export type PasswordResetResult = {
    success: boolean
    error?: string
}

export async function requestPasswordReset(email: string): Promise<PasswordResetResult> {
    if (!email) {
        return { success: false, error: 'Veuillez entrer votre adresse email.' }
    }

    try {
        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        })

        // Always return success even if user doesn't exist (security)
        if (!user) {
            console.log(`[Password Reset] No user found for email: ${email}`)
            return { success: true }
        }

        // Generate a secure token
        const token = crypto.randomUUID() + '-' + crypto.randomUUID()
        const expires = new Date(Date.now() + 3600000) // 1 hour from now

        // Store token in VerificationToken table
        await prisma.verificationToken.upsert({
            where: {
                identifier_token: {
                    identifier: email,
                    token: token
                }
            },
            update: {
                token,
                expires
            },
            create: {
                identifier: email,
                token,
                expires
            }
        })

        // In production, send email here
        // For now, log the reset URL to console
        const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/auth/reset-password?token=${token}`
        console.log('====================================')
        console.log('[Password Reset] Reset URL:')
        console.log(resetUrl)
        console.log('====================================')

        return { success: true }
    } catch (error) {
        console.error('Password reset request error:', error)
        return { success: false, error: 'Une erreur est survenue.' }
    }
}

export async function resetPassword(token: string, newPassword: string): Promise<PasswordResetResult> {
    if (!token || !newPassword) {
        return { success: false, error: 'Paramètres invalides.' }
    }

    if (newPassword.length < 8) {
        return { success: false, error: 'Le mot de passe doit contenir au moins 8 caractères.' }
    }

    try {
        // Find the token
        const verificationToken = await prisma.verificationToken.findFirst({
            where: {
                token,
                expires: { gt: new Date() }
            }
        })

        if (!verificationToken) {
            return { success: false, error: 'Ce lien a expiré ou est invalide.' }
        }

        // Find the user
        const user = await prisma.user.findUnique({
            where: { email: verificationToken.identifier }
        })

        if (!user) {
            return { success: false, error: 'Utilisateur introuvable.' }
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12)

        // Update user password
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        })

        // Delete the used token
        await prisma.verificationToken.delete({
            where: {
                identifier_token: {
                    identifier: verificationToken.identifier,
                    token: verificationToken.token
                }
            }
        })

        console.log(`[Password Reset] Password updated for user: ${user.email}`)
        return { success: true }
    } catch (error) {
        console.error('Password reset error:', error)
        return { success: false, error: 'Une erreur est survenue.' }
    }
}

