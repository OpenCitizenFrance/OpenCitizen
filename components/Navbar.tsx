import Link from "next/link";
import { Sidebar } from "./Sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar() {
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
                <div className="ml-4 flex items-center md:ml-0 gap-4 w-full justify-between">
                    <div className="font-bold text-xl hidden md:block">
                        OpenCitizen
                    </div>

                    <div className="flex items-center gap-4 flex-1 justify-end">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search deputies, laws..." className="pl-8" />
                        </div>
                        <Avatar>
                            <AvatarImage src="" />
                            <AvatarFallback>OC</AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </div>
        </div>
    );
}
