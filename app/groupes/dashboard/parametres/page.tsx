"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Bell, User, Shield, Palette, Save, Check } from "lucide-react";

export default function ParametresPage() {
    const { data: session } = useSession();
    const user = session?.user;

    const [saved, setSaved] = useState(false);
    const [settings, setSettings] = useState({
        // Notifications
        emailNewTexte: true,
        emailVote: false,
        emailNewsletter: true,
        pushNotifications: false,

        // Privacy
        profilePublic: true,
        showFollows: true,
    });

    const handleSave = () => {
        // TODO: Save settings to database
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const toggleSetting = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
                <p className="text-muted-foreground">
                    Gérez vos préférences et paramètres de compte
                </p>
            </div>

            <div className="grid gap-6">
                {/* Profile Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            <CardTitle>Profil</CardTitle>
                        </div>
                        <CardDescription>
                            Vos informations personnelles
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={user?.image || ""} />
                                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-accent/20">
                                    {user?.name?.[0] || user?.email?.[0] || "?"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <Button variant="outline" size="sm">
                                    Changer la photo
                                </Button>
                                <p className="text-xs text-muted-foreground">
                                    JPG, PNG ou GIF. Max 2MB.
                                </p>
                            </div>
                        </div>

                        <Separator />

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nom</Label>
                                <Input
                                    id="name"
                                    defaultValue={user?.name || ""}
                                    placeholder="Votre nom"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    defaultValue={user?.email || ""}
                                    disabled
                                    className="bg-muted"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary" />
                            <CardTitle>Notifications</CardTitle>
                        </div>
                        <CardDescription>
                            Configurez comment vous souhaitez être alerté
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Nouveaux textes de loi</Label>
                                <p className="text-sm text-muted-foreground">
                                    Recevoir un email pour chaque nouveau texte
                                </p>
                            </div>
                            <Switch
                                checked={settings.emailNewTexte}
                                onCheckedChange={() => toggleSetting("emailNewTexte")}
                            />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Résultats de votes</Label>
                                <p className="text-sm text-muted-foreground">
                                    Être notifié des résultats de scrutins
                                </p>
                            </div>
                            <Switch
                                checked={settings.emailVote}
                                onCheckedChange={() => toggleSetting("emailVote")}
                            />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Newsletter hebdomadaire</Label>
                                <p className="text-sm text-muted-foreground">
                                    Résumé des activités parlementaires
                                </p>
                            </div>
                            <Switch
                                checked={settings.emailNewsletter}
                                onCheckedChange={() => toggleSetting("emailNewsletter")}
                            />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Notifications push</Label>
                                <p className="text-sm text-muted-foreground">
                                    Recevoir des alertes dans le navigateur
                                </p>
                            </div>
                            <Switch
                                checked={settings.pushNotifications}
                                onCheckedChange={() => toggleSetting("pushNotifications")}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Privacy Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            <CardTitle>Confidentialité</CardTitle>
                        </div>
                        <CardDescription>
                            Gérez la visibilité de votre profil
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Profil public</Label>
                                <p className="text-sm text-muted-foreground">
                                    Permettre aux autres utilisateurs de voir votre profil
                                </p>
                            </div>
                            <Switch
                                checked={settings.profilePublic}
                                onCheckedChange={() => toggleSetting("profilePublic")}
                            />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Afficher mes suivis</Label>
                                <p className="text-sm text-muted-foreground">
                                    Montrer les députés et causes que vous suivez
                                </p>
                            </div>
                            <Switch
                                checked={settings.showFollows}
                                onCheckedChange={() => toggleSetting("showFollows")}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                    <Button onClick={handleSave} className="gap-2">
                        {saved ? (
                            <>
                                <Check className="h-4 w-4" />
                                Enregistré !
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Enregistrer les modifications
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
