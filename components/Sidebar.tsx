"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, BookOpen, User, UsersRound, Target, Sparkles } from "lucide-react";

const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/deputies", icon: Users, label: "Députés" },
    { href: "/groupes", icon: UsersRound, label: "Groupes" },
    { href: "/textes", icon: BookOpen, label: "Textes de loi" },
    { href: "/causes", icon: Target, label: "Causes" },
];

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <div className={cn("pb-12 w-64 border-r min-h-screen hidden md:block bg-card/50 backdrop-blur-sm", className)}>
            <div className="flex flex-col h-full">
                {/* Logo */}
                <div className="p-6 border-b">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-accent">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            OpenCitizen
                        </span>
                    </Link>
                </div>

                {/* Main Nav */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link key={item.href} href={item.href}>
                                <Button
                                    variant={active ? "secondary" : "ghost"}
                                    className={cn(
                                        "w-full justify-start gap-3 transition-all",
                                        active && "bg-primary/10 text-primary font-medium shadow-sm"
                                    )}
                                >
                                    <item.icon className={cn(
                                        "h-4 w-4",
                                        active ? "text-primary" : "text-muted-foreground"
                                    )} />
                                    {item.label}
                                </Button>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t mt-auto">
                    <Link href="/mon-espace">
                        <Button
                            variant={isActive("/mon-espace") ? "secondary" : "ghost"}
                            className={cn(
                                "w-full justify-start gap-3",
                                isActive("/mon-espace") && "bg-primary/10 text-primary font-medium"
                            )}
                        >
                            <User className={cn(
                                "h-4 w-4",
                                isActive("/mon-espace") ? "text-primary" : "text-muted-foreground"
                            )} />
                            Mon Espace
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
