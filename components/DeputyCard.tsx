import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface DeputyCardProps {
    uid: string;
    name: string;
    party: string;
    imageUrl?: string;
    slug: string;
}

export function DeputyCard({ uid, name, party, imageUrl, slug }: DeputyCardProps) {
    return (
        <Link href={`/deputies/${slug}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={imageUrl} alt={name} />
                        <AvatarFallback>{name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <h3 className="font-semibold">{name}</h3>
                        <Badge variant="secondary" className="w-fit mt-1">{party}</Badge>
                    </div>
                </CardHeader>
            </Card>
        </Link>
    );
}
