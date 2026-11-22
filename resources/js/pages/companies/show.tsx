import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    Download,
    Flag,
    History,
    LoaderCircle,
    Mail,
    ShieldCheck,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/bsafe/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { update as updateStatus } from '@/routes/anomalies/status';
import { prioritizeAudit } from '@/routes/anomalies';
import { store as createWarningLetter } from '@/routes/anomalies/warning-letter';
import { dashboard } from '@/routes';

type Company = {
    name: string;
    nib: string | null;
    npwp: string | null;
    city: string | null;
    province: string | null;
    bpjsWorkerCount: number | null;
};

type InvestigationCase = {
    id: number;
    type: string;
    typeLabel: string;
    period: string;
    summary: string;
    status: string;
    statusLabel: string;
    risk: string | null;
    riskLabel: string;
    auditPrioritized: boolean;
};

type Comparison = {
    key: string;
    label: string;
    bpjsValue: string | null;
    comparisonValue: string | null;
    sourceName: string;
    sourceReference: string | null;
    difference: number | null;
    differenceLabel: string | null;
    result: string;
    state: 'match' | 'mismatch' | 'warning' | 'unavailable';
    detected: boolean;
};

type Finding = {
    title: string;
    description: string;
    state: 'mismatch' | 'warning';
};

type Activity = {
    id: number;
    title: string;
    notes: string;
    actor: string;
    previousStatusLabel: string | null;
    statusLabel: string | null;
    createdAt: string | null;
};

type Props = {
    company: Company;
    case: InvestigationCase;
    riskScore: {
        score: number | null;
        level: string | null;
        levelLabel: string;
        generatedAt: string | null;
        breakdown: Record<string, unknown> | null;
    };
    comparisons: Comparison[];
    riskIndicators: Array<{
        label: string;
        value: string;
        state: Comparison['state'];
    }>;
    findings: Finding[];
    recommendation: string;
    history: Activity[];
    historyCount: number;
    backUrl: string;
    reportPdfUrl: string;
    statusOptions: Array<{ value: string; label: string }>;
    actor: { name: string; role: string };
};

const stateClasses: Record<Comparison['state'], string> = {
    mismatch: 'bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200',
    warning:
        'bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100',
    match: 'bg-emerald-50/50 text-foreground dark:bg-emerald-950/10',
    unavailable: 'bg-muted/30 text-muted-foreground',
};

function formatCount(value: number | null): string {
    return value === null
        ? 'Belum tersedia'
        : `${value.toLocaleString('id-ID')} orang`;
}

function formatDateTime(value: string | null): string {
    if (!value) {
        return 'Waktu tidak tersedia';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Jakarta',
    }).format(date);
}

function riskClasses(level: string | null): string {
    if (level === 'TINGGI') {
        return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200';
    }

    if (level === 'SEDANG') {
        return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200';
    }

    if (level === 'RENDAH') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200';
    }

    return 'border-border bg-muted text-muted-foreground';
}

export default function CompanyShow({
    company,
    case: investigation,
    riskScore,
    comparisons,
    riskIndicators,
    findings,
    recommendation,
    history,
    historyCount,
    backUrl,
    reportPdfUrl,
    statusOptions,
    actor,
}: Props) {
    const [downloading, setDownloading] = useState(false);
    const [auditDialogOpen, setAuditDialogOpen] = useState(false);
    const [prioritizing, setPrioritizing] = useState(false);
    const [warningDialogOpen, setWarningDialogOpen] = useState(false);
    const [creatingWarning, setCreatingWarning] = useState(false);
    const statusForm = useForm({
        status: investigation.status,
        notes: '',
    });

    useEffect(() => {
        statusForm.setData('status', investigation.status);
    }, [investigation.status]);

    function saveStatus(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        statusForm.patch(updateStatus(investigation.id).url, {
            preserveScroll: true,
            onSuccess: () => statusForm.setData('notes', ''),
            onError: () =>
                toast.error(
                    'Status belum tersimpan. Periksa kembali isian Anda.',
                ),
        });
    }

    function prioritizeCase() {
        router.post(
            prioritizeAudit(investigation.id).url,
            {},
            {
                preserveScroll: true,
                onStart: () => setPrioritizing(true),
                onFinish: () => setPrioritizing(false),
                onSuccess: () => setAuditDialogOpen(false),
                onError: () =>
                    toast.error('Prioritas audit gagal diperbarui. Coba lagi.'),
            },
        );
    }

    function confirmWarningLetter() {
        router.post(
            createWarningLetter(investigation.id).url,
            {},
            {
                preserveScroll: true,
                onStart: () => setCreatingWarning(true),
                onFinish: () => setCreatingWarning(false),
                onSuccess: () => setWarningDialogOpen(false),
                onError: () =>
                    toast.error('Draf surat gagal dibuat. Coba lagi.'),
            },
        );
    }

    async function downloadReport() {
        setDownloading(true);

        try {
            const response = await fetch(reportPdfUrl, {
                credentials: 'same-origin',
                headers: { Accept: 'application/pdf' },
            });
            const contentType = response.headers.get('content-type') ?? '';

            if (!response.ok || !contentType.includes('application/pdf')) {
                throw new Error('Server tidak mengembalikan berkas PDF.');
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const period = investigation.period.replace(/[^0-9-]/g, '');
            const identifier = company.nib ?? `kasus-${investigation.id}`;

            link.href = objectUrl;
            link.download = `laporan-investigasi-${identifier}-${period || 'terbaru'}.pdf`;
            document.body.append(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
            toast.success('Laporan investigasi berhasil dibuat.');
        } catch (error) {
            console.error('Gagal mengunduh laporan investigasi.', error);
            toast.error('Laporan PDF gagal dibuat. Silakan coba kembali.');
        } finally {
            setDownloading(false);
        }
    }

    return (
        <>
            <Head title={`Investigasi ${company.name}`} />
            <main className="space-y-6 p-4 md:p-6">
                <div className="grid gap-2">
                    <Link
                        href={backUrl}
                        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-primary hover:underline"
                    >
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        Kembali
                    </Link>
                    <PageHeader
                        title={company.name}
                        description={`Detail investigasi • ${investigation.typeLabel} • ${investigation.period}`}
                    />
                </div>

                <section className="grid gap-4 xl:grid-cols-2">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2
                                    className="size-5 text-primary"
                                    aria-hidden="true"
                                />
                                Profil perusahaan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-[minmax(150px,0.65fr)_1fr]">
                                {[
                                    ['Nama', company.name || null],
                                    ['NIB (OSS)', company.nib],
                                    ['NPWP (DJP)', company.npwp],
                                    [
                                        'Pekerja terdaftar di BPJS',
                                        formatCount(company.bpjsWorkerCount),
                                    ],
                                ].map(([label, value]) => (
                                    <div key={label} className="contents">
                                        <dt className="text-sm text-muted-foreground">
                                            {label}
                                        </dt>
                                        <dd className="min-w-0 text-sm font-medium break-all">
                                            {value ?? 'Belum tersedia'}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </CardContent>
                    </Card>

                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck
                                    className="size-5 text-primary"
                                    aria-hidden="true"
                                />
                                Tingkat risiko
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-5">
                            <div className="flex justify-center">
                                <Badge
                                    className={`min-w-52 justify-center rounded-full px-6 py-3 text-lg ${riskClasses(riskScore.level)}`}
                                >
                                    {riskScore.levelLabel}
                                </Badge>
                            </div>
                            <div className="grid gap-3">
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <p className="text-sm font-semibold">
                                        Indikator risiko
                                    </p>
                                    {riskScore.score !== null ? (
                                        <span className="text-xs text-muted-foreground">
                                            Skor{' '}
                                            {riskScore.score.toLocaleString(
                                                'id-ID',
                                            )}
                                        </span>
                                    ) : null}
                                </div>
                                <ul className="grid gap-2">
                                    {riskIndicators.map((indicator) => (
                                        <li
                                            key={indicator.label}
                                            className="flex flex-col gap-1 text-sm sm:flex-row sm:justify-between sm:gap-4"
                                        >
                                            <span className="text-muted-foreground">
                                                {indicator.label}
                                            </span>
                                            <span
                                                className={`font-medium ${
                                                    indicator.state ===
                                                    'mismatch'
                                                        ? 'text-destructive'
                                                        : indicator.state ===
                                                            'warning'
                                                          ? 'text-amber-700 dark:text-amber-300'
                                                          : ''
                                                }`}
                                            >
                                                {indicator.value}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-xs text-muted-foreground">
                                    Tingkat risiko mengikuti skor kasus yang
                                    tersimpan; indikator bukan kesimpulan
                                    pemeriksaan.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>Perbandingan data lintas lembaga</CardTitle>
                        <Button
                            type="button"
                            onClick={downloadReport}
                            disabled={downloading}
                            aria-busy={downloading}
                        >
                            {downloading ? (
                                <LoaderCircle
                                    className="animate-spin"
                                    aria-hidden="true"
                                />
                            ) : (
                                <Download aria-hidden="true" />
                            )}
                            {downloading
                                ? 'Menyiapkan PDF...'
                                : 'Buat laporan PDF'}
                        </Button>
                    </CardHeader>
                    <CardContent className="grid gap-5">
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full min-w-[780px] text-left text-sm">
                                <thead className="bg-muted/50 text-xs text-muted-foreground">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-4 py-3 font-medium"
                                        >
                                            Indikator
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-4 py-3 font-medium"
                                        >
                                            Dilaporkan ke BPJS
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-4 py-3 font-medium"
                                        >
                                            Sumber pembanding
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-4 py-3 font-medium"
                                        >
                                            Hasil
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {comparisons.map((comparison) => (
                                        <tr
                                            key={comparison.key}
                                            className={
                                                stateClasses[comparison.state]
                                            }
                                        >
                                            <th
                                                scope="row"
                                                className="px-4 py-3 font-medium"
                                            >
                                                {comparison.label}
                                            </th>
                                            <td className="px-4 py-3">
                                                {comparison.bpjsValue ??
                                                    'Belum tersedia'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-medium">
                                                    {comparison.comparisonValue ??
                                                        comparison.sourceName}
                                                </span>
                                                {comparison.sourceReference ? (
                                                    <span className="mt-1 block text-xs text-muted-foreground">
                                                        {
                                                            comparison.sourceReference
                                                        }
                                                    </span>
                                                ) : null}
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                {comparison.result}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {findings.length > 0 ? (
                            <div className="grid gap-2">
                                {findings.map((finding) => (
                                    <div
                                        key={finding.title}
                                        role="status"
                                        className={`rounded-md border-l-4 p-4 text-sm ${
                                            finding.state === 'mismatch'
                                                ? 'border-destructive bg-red-50 text-red-900 dark:bg-red-950/30 dark:text-red-100'
                                                : 'border-amber-500 bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100'
                                        }`}
                                    >
                                        <p className="font-semibold">
                                            {finding.title}
                                        </p>
                                        <p className="mt-1 leading-6">
                                            {finding.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                                Belum ada temuan tambahan dari perbandingan
                                sumber yang tersedia.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="gap-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="grid gap-2">
                                <CardTitle>
                                    Status &amp; Rekomendasi Tindak Lanjut
                                </CardTitle>
                                <div>
                                    <Badge variant="outline">
                                        {investigation.statusLabel}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Perbarui tahapan penanganan kasus dan catat
                                    instruksi investigasi terpadu.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    onClick={() => setAuditDialogOpen(true)}
                                    disabled={
                                        investigation.auditPrioritized ||
                                        prioritizing
                                    }
                                >
                                    <Flag aria-hidden="true" />
                                    {investigation.auditPrioritized
                                        ? 'Prioritas audit aktif'
                                        : 'Prioritaskan Audit'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setWarningDialogOpen(true)}
                                >
                                    <Mail aria-hidden="true" />
                                    Buat Draf Surat Peringatan
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-5">
                        <div
                            role="status"
                            className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
                        >
                            <p className="font-semibold">Rekomendasi Sistem</p>
                            <p className="mt-1 leading-6">{recommendation}</p>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-2">
                            <form
                                onSubmit={saveStatus}
                                className="grid content-start gap-4 rounded-lg border bg-muted/20 p-4"
                            >
                                <h3 className="text-sm font-semibold tracking-wide uppercase">
                                    Formulir Pembaruan Status Kasus
                                </h3>
                                <div className="grid gap-2">
                                    <label
                                        htmlFor="case-status"
                                        className="text-sm font-medium"
                                    >
                                        Ubah Status Penanganan
                                    </label>
                                    <select
                                        id="case-status"
                                        value={statusForm.data.status}
                                        onChange={(event) =>
                                            statusForm.setData(
                                                'status',
                                                event.target.value,
                                            )
                                        }
                                        aria-invalid={
                                            statusForm.errors.status
                                                ? 'true'
                                                : 'false'
                                        }
                                        aria-describedby={
                                            statusForm.errors.status
                                                ? 'case-status-error'
                                                : undefined
                                        }
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                    >
                                        {statusOptions.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    {statusForm.errors.status ? (
                                        <p
                                            id="case-status-error"
                                            className="text-sm text-destructive"
                                        >
                                            {statusForm.errors.status}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="grid gap-2">
                                    <label
                                        htmlFor="case-notes"
                                        className="text-sm font-medium"
                                    >
                                        Catatan Hasil Pemeriksaan &amp; Tindak
                                        Lanjut
                                    </label>
                                    <textarea
                                        id="case-notes"
                                        value={statusForm.data.notes}
                                        onChange={(event) =>
                                            statusForm.setData(
                                                'notes',
                                                event.target.value,
                                            )
                                        }
                                        required
                                        minLength={5}
                                        maxLength={2000}
                                        aria-invalid={
                                            statusForm.errors.notes
                                                ? 'true'
                                                : 'false'
                                        }
                                        aria-describedby={
                                            statusForm.errors.notes
                                                ? 'case-notes-error'
                                                : undefined
                                        }
                                        placeholder="Tuliskan hasil pemeriksaan atau instruksi tindak lanjut."
                                        className="min-h-28 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    />
                                    {statusForm.errors.notes ? (
                                        <p
                                            id="case-notes-error"
                                            className="text-sm text-destructive"
                                        >
                                            {statusForm.errors.notes}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-xs text-muted-foreground">
                                        Petugas: <strong>{actor.name}</strong>
                                        {' · '}
                                        {actor.role}
                                    </p>
                                    <Button
                                        type="submit"
                                        disabled={statusForm.processing}
                                    >
                                        {statusForm.processing
                                            ? 'Menyimpan...'
                                            : 'Simpan Pembaruan Status'}
                                    </Button>
                                </div>
                            </form>

                            <section
                                aria-labelledby="case-history-title"
                                className="grid content-start gap-4 rounded-lg border p-4"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                                    <h3
                                        id="case-history-title"
                                        className="flex items-center gap-2 text-sm font-semibold tracking-wide uppercase"
                                    >
                                        <History
                                            className="size-4 text-primary"
                                            aria-hidden="true"
                                        />
                                        Riwayat Tindak Lanjut
                                    </h3>
                                    <span className="text-xs text-muted-foreground">
                                        {history.length < historyCount
                                            ? `${history.length.toLocaleString('id-ID')} dari ${historyCount.toLocaleString('id-ID')} aktivitas ditampilkan`
                                            : `${historyCount.toLocaleString('id-ID')} aktivitas tercatat`}
                                    </span>
                                </div>
                                {history.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        Belum ada aktivitas tindak lanjut.
                                    </p>
                                ) : (
                                    <ol className="grid gap-4">
                                        {history.map((activity) => (
                                            <li
                                                key={activity.id}
                                                className="relative grid gap-1 border-l-2 border-primary/30 pl-4 before:absolute before:top-1 before:-left-[5px] before:size-2 before:rounded-full before:bg-primary"
                                            >
                                                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                                                    <p className="text-sm font-semibold">
                                                        {activity.title}
                                                    </p>
                                                    <time
                                                        className="text-xs text-muted-foreground"
                                                        dateTime={
                                                            activity.createdAt ??
                                                            undefined
                                                        }
                                                    >
                                                        {formatDateTime(
                                                            activity.createdAt,
                                                        )}
                                                    </time>
                                                </div>
                                                {activity.previousStatusLabel ||
                                                activity.statusLabel ? (
                                                    <p className="text-xs text-muted-foreground">
                                                        {activity.previousStatusLabel ??
                                                            'Status sebelumnya tidak tersedia'}
                                                        {' → '}
                                                        {activity.statusLabel ??
                                                            'Status baru tidak tersedia'}
                                                    </p>
                                                ) : null}
                                                {activity.notes ? (
                                                    <p className="text-sm leading-6 text-muted-foreground">
                                                        {activity.notes}
                                                    </p>
                                                ) : null}
                                                <p className="text-xs text-muted-foreground">
                                                    Oleh: {activity.actor}
                                                </p>
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </section>
                        </div>
                    </CardContent>
                </Card>
            </main>

            <Dialog open={auditDialogOpen} onOpenChange={setAuditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Prioritaskan audit lapangan?</DialogTitle>
                        <DialogDescription>
                            Kasus akan dipindahkan ke status prioritas audit
                            lapangan dan perubahan ini dicatat pada riwayat
                            tindak lanjut.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setAuditDialogOpen(false)}
                            disabled={prioritizing}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={prioritizeCase}
                            disabled={prioritizing}
                        >
                            {prioritizing
                                ? 'Memperbarui...'
                                : 'Konfirmasi prioritas audit'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={warningDialogOpen}
                onOpenChange={setWarningDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Buat draf surat peringatan?</DialogTitle>
                        <DialogDescription>
                            Draf akan disimpan untuk ditinjau. B-SAFE tidak
                            mengirim surat ini secara otomatis.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-md border bg-muted/30 p-3 text-sm">
                        <p className="font-medium">{company.name}</p>
                        <p className="mt-1 text-muted-foreground">
                            {investigation.typeLabel} · {investigation.period}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setWarningDialogOpen(false)}
                            disabled={creatingWarning}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={confirmWarningLetter}
                            disabled={creatingWarning}
                        >
                            {creatingWarning
                                ? 'Membuat draf...'
                                : 'Konfirmasi buat draf'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

CompanyShow.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
