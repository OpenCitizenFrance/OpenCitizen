"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, ArrowLeft, Upload, User, Mail, Lock, MapPin, Check, Github, Eye, EyeOff } from "lucide-react";
import { registerUser } from "@/lib/auth-actions";
import { uploadAvatar } from "@/lib/supabase";

const INTERESTS = [
    "Économie", "Écologie", "Éducation", "Santé", "Justice",
    "Sécurité", "Culture", "Logement", "Transports", "Travail",
    "Europe", "Immigration", "Numérique", "Agriculture"
];

const DEPARTMENTS = [
    { code: "75", name: "Paris" },
    { code: "69", name: "Rhône" },
    { code: "13", name: "Bouches-du-Rhône" },
    { code: "33", name: "Gironde" },
    { code: "59", name: "Nord" },
    { code: "31", name: "Haute-Garonne" },
    { code: "44", name: "Loire-Atlantique" },
    { code: "67", name: "Bas-Rhin" },
    // Add more as needed
];

export default function SignUpPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        constituencyCode: "",
        bio: "",
        interests: [] as string[]
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleInterest = (interest: string) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const nextStep = () => {
        if (step === 1) {
            if (!formData.name || !formData.email || !formData.password) {
                setError("Veuillez remplir tous les champs obligatoires.");
                return;
            }
            if (formData.password.length < 8) {
                setError("Le mot de passe doit contenir au moins 8 caractères.");
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError("Les mots de passe ne correspondent pas.");
                return;
            }
        }
        setError(null);
        setStep(s => s + 1);
    };

    const prevStep = () => setStep(s => s - 1);

    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Upload avatar if provided
            let imageUrl = null;
            if (avatarFile) {
                // Generate a temporary ID for the upload
                imageUrl = await uploadAvatar(avatarFile, `temp-${Date.now()}`);
            }

            const data = new FormData();
            data.append("name", formData.name);
            data.append("email", formData.email);
            data.append("password", formData.password);
            data.append("confirmPassword", formData.confirmPassword);
            data.append("constituencyCode", formData.constituencyCode);
            data.append("bio", formData.bio);
            if (imageUrl) data.append("imageUrl", imageUrl);

            const result = await registerUser(data);

            if (result.success) {
                router.push("/auth/signin?registered=true");
            } else {
                setError(result.error || "Une erreur est survenue.");
            }
        } catch (err) {
            setError("Une erreur est survenue.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
            <div className="w-full max-w-lg animate-fade-in">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-2 mb-8">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
                        <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold gradient-text">OpenCitizen</span>
                </Link>

                <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
                    <CardHeader className="text-center space-y-2">
                        <CardTitle className="text-2xl">Créer un compte</CardTitle>
                        <CardDescription>
                            Rejoignez la communauté citoyenne
                        </CardDescription>

                        {/* Stepper */}
                        <div className="flex items-center justify-center gap-2 pt-4">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex items-center gap-2">
                                    <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                    ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                  `}>
                                        {step > s ? <Check className="h-4 w-4" /> : s}
                                    </div>
                                    {s < 3 && (
                                        <div className={`w-8 h-0.5 ${step > s ? 'bg-primary' : 'bg-muted'}`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                {error}
                            </div>
                        )}

                        {/* Step 1: Account Info */}
                        {step === 1 && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Nom complet *
                                    </label>
                                    <Input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Jean Dupont"
                                        className="h-11"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        Email *
                                    </label>
                                    <Input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="jean@example.com"
                                        className="h-11"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Lock className="h-4 w-4" />
                                        Mot de passe *
                                    </label>
                                    <div className="relative">
                                        <Input
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Minimum 8 caractères"
                                            className="h-11 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Lock className="h-4 w-4" />
                                        Confirmer le mot de passe *
                                    </label>
                                    <Input
                                        name="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Retapez votre mot de passe"
                                        className="h-11"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 2: Profile Info */}
                        {step === 2 && (
                            <div className="space-y-6 animate-fade-in">
                                {/* Avatar Upload */}
                                <div className="flex flex-col items-center gap-4">
                                    <Avatar className="h-24 w-24 ring-4 ring-primary/20 cursor-pointer hover:ring-primary/40 transition-all"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <AvatarImage src={avatarPreview || ""} />
                                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-2xl">
                                            {formData.name?.[0] || <Upload className="h-8 w-8 text-muted-foreground" />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                    />
                                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        {avatarPreview ? "Changer la photo" : "Ajouter une photo"}
                                    </Button>
                                    <p className="text-xs text-muted-foreground">Optionnel</p>
                                </div>

                                {/* Department */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Département (optionnel)
                                    </label>
                                    <select
                                        name="constituencyCode"
                                        value={formData.constituencyCode}
                                        onChange={handleChange}
                                        className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
                                    >
                                        <option value="">Sélectionner un département</option>
                                        {DEPARTMENTS.map(d => (
                                            <option key={d.code} value={d.code}>{d.code} - {d.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-muted-foreground">
                                        Pour identifier votre député local
                                    </p>
                                </div>

                                {/* Bio */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Présentation (optionnel)</label>
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        placeholder="Quelques mots sur vous..."
                                        className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 3: Interests */}
                        {step === 3 && (
                            <div className="space-y-4 animate-fade-in">
                                <p className="text-sm text-muted-foreground text-center">
                                    Sélectionnez les sujets qui vous intéressent (optionnel)
                                </p>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {INTERESTS.map((interest) => (
                                        <Badge
                                            key={interest}
                                            variant={formData.interests.includes(interest) ? "default" : "outline"}
                                            className="cursor-pointer transition-all hover:scale-105 py-1.5 px-3"
                                            onClick={() => toggleInterest(interest)}
                                        >
                                            {formData.interests.includes(interest) && <Check className="mr-1 h-3 w-3" />}
                                            {interest}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex gap-3 pt-4">
                            {step > 1 && (
                                <Button variant="outline" onClick={prevStep} className="flex-1">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Retour
                                </Button>
                            )}

                            {step < 3 ? (
                                <Button onClick={nextStep} className="flex-1">
                                    Suivant
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSubmit}
                                    className="flex-1 shadow-lg shadow-primary/25"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Création..." : "Créer mon compte"}
                                    <Sparkles className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {/* Divider */}
                        {step === 1 && (
                            <>
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs">
                                        <span className="bg-card px-2 text-muted-foreground">ou</span>
                                    </div>
                                </div>

                                <Button variant="outline" className="w-full h-11" asChild>
                                    <Link href="/api/auth/signin?provider=github">
                                        <Github className="mr-2 h-5 w-5" />
                                        Continuer avec GitHub
                                    </Link>
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Sign in link */}
                <p className="text-center text-sm text-muted-foreground mt-6">
                    Déjà inscrit ?{" "}
                    <Link href="/auth/signin" className="text-primary hover:underline font-medium">
                        Se connecter
                    </Link>
                </p>
            </div>
        </div>
    );
}
