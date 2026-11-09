import { Head, Link } from '@inertiajs/react';
import { Clock3, Shield, UserRound } from 'lucide-react';
import { PageHeader } from '@/components/bsafe/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard, logout } from '@/routes';
import { show as accountShow } from '@/routes/account';
import { edit as editSecurity } from '@/routes/security';

type Props = {
    account: {
        name: string;
        email: string;
        status: string;
        nip: string | null;
        position: string | null;
        employmentStatus: string | null;
        organizationUnit: string | null;
        phone: string | null;
        assignedCity: string | null;
        assignedOffice: string | null;
    };
    activities: Array<{
        id: number;
        date: string | null;
        company: string;
        type: string;
        notes: string;
        status: string;
    }>;
    activityCount: number;
};

export default function AccountShow({
    account,
    activities,
    activityCount,
}: Props) {
    return (
        <>
            <Head title="Akun dan Aktivitas" />
            <main className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title="Akun dan aktivitas"
                    description="Informasi akun petugas dan catatan tindak lanjut terbaru."
                    actions={
                        <>
                            <Button asChild variant="outline">
                                <Link href={editSecurity()}>
                                    <Shield aria-hidden="true" />
                                    Pengaturan keamanan
                                </Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href={logout()} method="post" as="button">
                                    Keluar
                                </Link>
                            </Button>
                        </>
                    }
                />

                <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserRound
                                    className="size-5 text-primary"
                                    aria-hidden="true"
                                />
                                Profil petugas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid gap-4 sm:grid-cols-2">
                                {[
                                    ['Nama', account.name],
                                    ['Email', account.email],
                                    ['Status akun', account.status],
                                    ['NIP', account.nip],
                                    ['Jabatan', account.position],
                                    [
                                        'Status kepegawaian',
                                        account.employmentStatus,
                                    ],
                                    [
                                        'Unit organisasi',
                                        account.organizationUnit,
                                    ],
                                    ['Nomor telepon', account.phone],
                                    ['Kota penugasan', account.assignedCity],
                                    [
                                        'Kantor penugasan',
                                        account.assignedOffice,
                                    ],
                                ].map(([label, value]) => (
                                    <div key={label} className="grid gap-1">
                                        <dt className="text-xs text-muted-foreground">
                                            {label}
                                        </dt>
                                        <dd className="text-sm font-medium">
                                            {value ?? 'Belum diisi'}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock3
                                    className="size-5 text-primary"
                                    aria-hidden="true"
                                />
                                Aktivitas terkini
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {activities.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Belum ada tindak lanjut yang tercatat untuk
                                    akun ini.
                                </p>
                            ) : (
                                activities.map((activity) => (
                                    <article
                                        key={activity.id}
                                        className="grid gap-1 border-b pb-4 last:border-b-0 last:pb-0"
                                    >
                                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                            <h3 className="text-sm font-medium">
                                                {activity.type} ·{' '}
                                                {activity.company}
                                            </h3>
                                            <time className="text-xs text-muted-foreground">
                                                {activity.date ??
                                                    'Waktu tidak tersedia'}
                                            </time>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {activity.notes ||
                                                'Tidak ada catatan.'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Status kasus: {activity.status}
                                        </p>
                                    </article>
                                ))
                            )}
                            <p className="text-xs text-muted-foreground">
                                Menampilkan {activityCount} aktivitas terbaru.
                            </p>
                        </CardContent>
                    </Card>
                </section>
            </main>
        </>
    );
}

AccountShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Akun dan aktivitas', href: accountShow() },
    ],
};
