"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    UsersRound,
    Target,
    Sparkles,
    LayoutGrid
} from "lucide-react";

const navItems = [
    { href: "/groupes/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/deputies", icon: Users, label: "Députés" },
    { href: "/groupes", icon: UsersRound, label: "Groupes", exact: false },
    { href: "/textes", icon: BookOpen, label: "Textes de loi" },
    { href: "/commissions", icon: LayoutGrid, label: "Commissions" },
    { href: "/causes", icon: Target, label: "Causes" },
];

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();

    const isActive = (href: string, exact = true) => {
        if (href === "/groupes/dashboard") {
            return pathname === "/groupes/dashboard" || pathname.startsWith("/groupes/dashboard/");
        }
        if (href === "/groupes") {
            return pathname === "/groupes" || (pathname.startsWith("/groupes/") && !pathname.startsWith("/groupes/dashboard"));
        }
        if (exact) return pathname === href;
        return pathname.startsWith(href);
    };

    return (
        <div
            className={cn(
                "group/sidebar pb-12 border-r h-screen sticky top-0 hidden md:flex flex-col bg-card/50 backdrop-blur-sm",
                "w-16 hover:w-64 transition-all duration-300 ease-in-out",
                className
            )}
        >
            <div className="flex flex-col h-full">
                {/* Logo with hover color effect */}
                <div className="p-4 border-b flex items-center overflow-hidden">
                    <Link href="/groupes/dashboard" className="flex items-center gap-2">
                        {/* Icon: grayscale by default, colored on sidebar hover */}
                        <div className="p-1.5 rounded-lg bg-muted/50 group-hover/sidebar:bg-gradient-to-br group-hover/sidebar:from-primary group-hover/sidebar:to-accent transition-all duration-300 shrink-0">
                            <Sparkles className="h-5 w-5 text-muted-foreground group-hover/sidebar:text-white transition-colors duration-300" />
                        </div>
                        {/* Text: appears with fade and gradient color on hover */}
                        <span className="text-xl font-bold whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-all duration-300 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            OpenCitizen
                        </span>
                    </Link>
                </div>

                {/* Main Nav */}
                <nav className="flex-1 p-2 space-y-1">
                    {navItems.map((item) => {
                        const active = isActive(item.href, item.exact !== false);
                        return (
                            <Link key={item.href} href={item.href} title={item.label}>
                                <Button
                                    variant={active ? "secondary" : "ghost"}
                                    className={cn(
                                        "w-full transition-all justify-start gap-3 overflow-hidden",
                                        active && "bg-primary/10 text-primary font-medium shadow-sm"
                                    )}
                                >
                                    <item.icon className={cn(
                                        "h-4 w-4 shrink-0",
                                        active ? "text-primary" : "text-muted-foreground"
                                    )} />
                                    <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
                                        {item.label}
                                    </span>
                                </Button>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
