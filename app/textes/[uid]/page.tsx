import { redirect } from 'next/navigation';

export default function OldLawPage({ params }: { params: { uid: string } }) {
    redirect(`/dossiers/${params.uid}`);
}
