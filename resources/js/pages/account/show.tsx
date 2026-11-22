import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    Clock3,
    KeyRound,
    LogOut,
    Mail,
    MapPin,
    Phone,
    UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

function initials(name: string): string {
    const firstName = name.trim().split(/\s+/)[0] ?? '';
    const letters = firstName.slice(0, 2).toUpperCase();

    return letters || 'U';
}

function formatActivityDate(date: string | null): string {
    if (!date) {
        return 'Tanggal tidak tersedia';
    }

    const parsedDate = new Date(date.replace(' ', 'T'));

    if (Number.isNaN(parsedDate.getTime())) {
        return 'Tanggal tidak tersedia';
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(parsedDate);
}

function DetailField({
    label,
    value,
    wide = false,
}: {
    label: string;
    value: string | null;
    wide?: boolean;
}) {
    return (
        <div className={wide ? 'sm:col-span-2' : undefined}>
            <dt className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                {label}
            </dt>
            <dd className="mt-1 text-sm font-medium">
                {value?.trim() || 'Belum diisi'}
            </dd>
        </div>
    );
}

export default function AccountShow({
    account,
    activities,
    activityCount,
}: Props) {
    return (
        <>
            <Head title="Informasi Akun" />
            <main className="grid gap-4 p-4 md:gap-5 md:p-6">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-xl font-semibold tracking-tight">
                        Informasi Akun
                    </h1>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm">
                            <Link href={editSecurity()}>
                                <KeyRound aria-hidden="true" />
                                Ubah Kata Sandi
                            </Link>
                        </Button>
                        <Button asChild size="sm">
                            <Link
                                href={logout()}
                                method="post"
                                as="button"
                                data-test="account-logout"
                            >
                                <LogOut aria-hidden="true" />
                                Logout
                            </Link>
                        </Button>
                    </div>
                </header>

                <Card className="gap-0 p-4 sm:p-5">
                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                        <div
                            className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-primary text-2xl font-semibold tracking-wide text-primary-foreground shadow-sm sm:size-20 sm:text-3xl"
                            aria-hidden="true"
                        >
                            <span className="px-2 py-1 sm:px-3 sm:py-2">
                                {initials(account.name)}
                            </span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="truncate text-base font-semibold sm:text-lg">
                                    {account.name}
                                </h2>
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                    <span
                                        className="size-1.5 rounded-full bg-primary"
                                        aria-hidden="true"
                                    />
                                    {account.status}
                                </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                {account.position && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <UserRound
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                        {account.position}
                                    </span>
                                )}
                                {account.nip && <span>NIP: {account.nip}</span>}
                            </div>
                            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Mail className="size-3.5" aria-hidden="true" />
                                <span className="truncate">
                                    {account.email}
                                </span>
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="gap-0 p-4 sm:p-5">
                    <section aria-labelledby="employee-details-heading">
                        <h2
                            id="employee-details-heading"
                            className="flex items-center gap-2 border-b pb-3 text-sm font-semibold"
                        >
                            <UserRound
                                className="size-4 text-primary"
                                aria-hidden="true"
                            />
                            Identitas Pegawai
                        </h2>
                        <dl className="grid gap-x-6 gap-y-4 py-4 sm:grid-cols-2">
                            <DetailField
                                label="Nama Lengkap"
                                value={account.name}
                            />
                            <DetailField label="NIP" value={account.nip} />
                            <DetailField
                                label="Jabatan / Posisi"
                                value={account.position}
                            />
                            <div>
                                <dt className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                                    Status Kepegawaian
                                </dt>
                                <dd className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                                    {account.employmentStatus && (
                                        <span
                                            className="size-1.5 rounded-full bg-primary"
                                            aria-hidden="true"
                                        />
                                    )}
                                    {account.employmentStatus?.trim() ||
                                        'Belum diisi'}
                                </dd>
                            </div>
                            <DetailField
                                label="Unit Kerja / Direktorat"
                                value={account.organizationUnit}
                                wide
                            />
                        </dl>
                    </section>

                    <section
                        aria-labelledby="contact-details-heading"
                        className="border-t pt-4"
                    >
                        <h2
                            id="contact-details-heading"
                            className="flex items-center gap-2 border-b pb-3 text-sm font-semibold"
                        >
                            <Building2
                                className="size-4 text-primary"
                                aria-hidden="true"
                            />
                            Informasi Kontak &amp; Lokasi
                        </h2>
                        <dl className="grid gap-x-6 gap-y-4 py-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <dt className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                                    Email
                                </dt>
                                <dd className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                                    <Mail
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                    {account.email}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                                    Nomor Telepon
                                </dt>
                                <dd className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium">
                                    <Phone
                                        className="size-3.5 text-muted-foreground"
                                        aria-hidden="true"
                                    />
                                    {account.phone?.trim() || 'Belum diisi'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                                    Kota Penugasan
                                </dt>
                                <dd className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium">
                                    <MapPin
                                        className="size-3.5 text-muted-foreground"
                                        aria-hidden="true"
                                    />
                                    {account.assignedCity?.trim() ||
                                        'Belum diisi'}
                                </dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                                    Kantor Penugasan
                                </dt>
                                <dd className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium">
                                    <Building2
                                        className="size-3.5 text-muted-foreground"
                                        aria-hidden="true"
                                    />
                                    {account.assignedOffice?.trim() ||
                                        'Belum diisi'}
                                </dd>
                            </div>
                        </dl>
                    </section>
                </Card>

                <Card className="gap-0 overflow-hidden py-0">
                    <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div className="flex items-start gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Clock3 className="size-4" aria-hidden="true" />
                            </span>
                            <div>
                                <h2 className="text-sm font-semibold">
                                    Ringkasan Aktivitas Terakhir
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Pemeriksaan dan kegiatan pengawasan terkini
                                    yang ditangani analis.
                                </p>
                            </div>
                        </div>
                        <p className="shrink-0 text-xs text-muted-foreground">
                            Total {activityCount} Aktivitas Terakhir
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px] text-left text-sm">
                            <thead className="bg-muted/50 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-4 py-3 sm:px-5">
                                        Tanggal
                                    </th>
                                    <th className="px-4 py-3 sm:px-5">
                                        Aktivitas / Entitas
                                    </th>
                                    <th className="px-4 py-3 sm:px-5">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {activities.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="px-5 py-8 text-center text-sm text-muted-foreground"
                                        >
                                            Belum ada aktivitas yang tercatat
                                            untuk akun ini.
                                        </td>
                                    </tr>
                                ) : (
                                    activities.map((activity) => {
                                        const completed =
                                            activity.status === 'Selesai';

                                        return (
                                            <tr key={activity.id}>
                                                <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground sm:px-5">
                                                    {formatActivityDate(
                                                        activity.date,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 sm:px-5">
                                                    <p className="font-medium">
                                                        {activity.company}
                                                    </p>
                                                    <p
                                                        className="mt-0.5 max-w-xl truncate text-xs text-muted-foreground"
                                                        title={activity.notes}
                                                    >
                                                        {activity.type}
                                                        {activity.notes
                                                            ? ` · ${activity.notes}`
                                                            : ''}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3 sm:px-5">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-medium whitespace-nowrap ${
                                                            completed
                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`size-1.5 rounded-full ${
                                                                completed
                                                                    ? 'bg-emerald-600 dark:bg-emerald-400'
                                                                    : 'bg-amber-600 dark:bg-amber-400'
                                                            }`}
                                                            aria-hidden="true"
                                                        />
                                                        {activity.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </main>
        </>
    );
}

AccountShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Informasi Akun', href: accountShow() },
    ],
};
