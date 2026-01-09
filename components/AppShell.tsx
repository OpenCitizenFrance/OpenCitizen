"use client";

import Link from "next/link";
import { useSession, SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlobalSearch } from "./GlobalSearch";
import { signOut } from "next-auth/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Routes that should show the full app layout with sidebar
const appRoutes = [
    "/deputies",
    "/groupes",
    "/textes",
    "/commissions",
    "/causes",
    "/dossiers",
    "/messages",
];

// Routes that should show a minimal layout (no sidebar, no navbar)
const minimalRoutes = [
    "/auth/signin",
    "/auth/signup",
    "/auth/forgot-password",
    "/auth/reset-password",
];

function NavbarContent() {
    const { data: session } = useSession();
    const user = session?.user;

    return (
        <div className="border-b">
            <div className="flex h-16 items-center px-4">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0">
                        <Sidebar className="w-full border-r-0 block" />
                    </SheetContent>
                </Sheet>
                <div className="ml-4 flex items-center md:ml-6 gap-4 w-full">

                    <div className="flex items-center gap-4 flex-1 justify-end">
                        <GlobalSearch />

                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={user.image || ""} alt={user.name || ""} />
                                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                                                {user.name?.[0] || user.email?.[0] || "?"}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{user.name}</p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {user.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="cursor-pointer" asChild>
                                        <Link href="/groupes/dashboard">
                                            <User className="mr-2 h-4 w-4" />
                                            Mon espace
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer" asChild>
                                        <Link href="/groupes/dashboard/parametres">
                                            <Settings className="mr-2 h-4 w-4" />
                                            Paramètres
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="cursor-pointer text-destructive focus:text-destructive"
                                        onClick={() => signOut({ callbackUrl: "/" })}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Se déconnecter
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Link href="/auth/signin">
                                <Button>Se connecter</Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function AppShellContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Check if current route is an app route (needs full layout)
    const isAppRoute = appRoutes.some(route => pathname.startsWith(route));

    // Check if current route is a minimal route (auth pages)
    const isMinimalRoute = minimalRoutes.some(route => pathname.startsWith(route));

    // Landing page (/) and other public pages - minimal layout without sidebar
    const isLandingPage = pathname === "/";

    // Auth pages - no layout at all
    if (isMinimalRoute) {
        return <>{children}</>;
    }

    // Landing page - just the content, no sidebar/navbar
    if (isLandingPage) {
        return (
            <div className="min-h-screen bg-background">
                {children}
            </div>
        );
    }

    // App pages - full layout with sidebar and navbar
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <NavbarContent />
                <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

export function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <AppShellContent>
                {children}
            </AppShellContent>
        </SessionProvider>
    );
}
