import { Head } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';

type Props = {
    investigation: {
        company: {
            name: string;
            nib: string | null;
            npwp: string | null;
            city: string | null;
            province: string | null;
            bpjsWorkerCount: number | null;
        };
        case: {
            typeLabel: string;
            period: string;
            statusLabel: string;
            riskLabel: string;
            summary: string;
        };
        riskScore: {
            score: number | null;
            levelLabel: string;
        };
        riskIndicators: Array<{ label: string; value: string }>;
        comparisons: Array<{
            key: string;
            label: string;
            bpjsValue: string | null;
            comparisonValue: string | null;
            sourceName: string;
            sourceReference: string | null;
            result: string;
            state: string;
        }>;
        findings: Array<{
            title: string;
            description: string;
            state: string;
        }>;
        recommendation: string;
        history: Array<{
            id: number;
            title: string;
            notes: string;
            actor: string;
            previousStatusLabel: string | null;
            statusLabel: string | null;
            createdAt: string | null;
        }>;
        historyCount: number;
    };
    preparedBy: string;
    preparedAt: string;
    pdfUrl: string;
};

function formatCount(value: number | null): string {
    return value === null
        ? 'Belum tersedia'
        : `${value.toLocaleString('id-ID')} orang`;
}

export default function InvestigationReport({
    investigation,
    preparedBy,
    preparedAt,
    pdfUrl,
}: Props) {
    return (
        <>
            <Head title={`Laporan investigasi ${investigation.company.name}`} />
            <main className="mx-auto max-w-5xl space-y-6 p-4 md:p-8 print:p-0">
                <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Laporan investigasi
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {investigation.company.name} ·{' '}
                            {investigation.case.period}
                        </p>
                    </div>
                    <Button asChild>
                        <a href={pdfUrl} download>
                            <Download aria-hidden="true" />
                            Unduh PDF
                        </a>
                    </Button>
                </div>

                <article className="space-y-6 rounded-xl border bg-card p-5 shadow-sm md:p-7 print:rounded-none print:border-0 print:p-0 print:shadow-none">
                    <header className="space-y-2 border-b pb-5">
                        <p className="text-sm font-semibold tracking-wide text-primary uppercase">
                            B-SAFE · Bahan pemeriksaan internal
                        </p>
                        <h2 className="text-2xl font-bold">
                            Laporan investigasi perusahaan
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Dibuat {preparedAt} oleh {preparedBy}. Ringkasan ini
                            bukan penetapan pelanggaran.
                        </p>
                    </header>

                    <section className="grid gap-4 sm:grid-cols-2">
                        {[
                            ['Nama perusahaan', investigation.company.name],
                            [
                                'Pekerja terdaftar di BPJS',
                                formatCount(
                                    investigation.company.bpjsWorkerCount,
                                ),
                            ],
                            ['NIB (OSS)', investigation.company.nib],
                            ['NPWP (DJP)', investigation.company.npwp],
                            [
                                'Wilayah',
                                [
                                    investigation.company.city,
                                    investigation.company.province,
                                ]
                                    .filter(Boolean)
                                    .join(', ') || null,
                            ],
                            [
                                'Kasus / periode',
                                `${investigation.case.typeLabel} · ${investigation.case.period}`,
                            ],
                        ].map(([label, value]) => (
                            <div
                                key={label}
                                className="min-w-0 rounded-lg border p-3"
                            >
                                <p className="text-xs text-muted-foreground">
                                    {label}
                                </p>
                                <p className="mt-1 text-sm font-medium break-all">
                                    {value ?? 'Belum tersedia'}
                                </p>
                            </div>
                        ))}
                    </section>

                    <Card>
                        <CardHeader>
                            <CardTitle>Tingkat risiko</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <p className="text-lg font-semibold">
                                    {investigation.riskScore.levelLabel}
                                </p>
                                {investigation.riskScore.score !== null ? (
                                    <p className="text-sm text-muted-foreground">
                                        Skor{' '}
                                        {investigation.riskScore.score.toLocaleString(
                                            'id-ID',
                                        )}
                                    </p>
                                ) : null}
                            </div>
                            <ul className="grid gap-2 sm:grid-cols-3">
                                {investigation.riskIndicators.map(
                                    (indicator) => (
                                        <li
                                            key={indicator.label}
                                            className="rounded-md border p-3"
                                        >
                                            <p className="text-xs text-muted-foreground">
                                                {indicator.label}
                                            </p>
                                            <p className="mt-1 text-sm font-medium">
                                                {indicator.value}
                                            </p>
                                        </li>
                                    ),
                                )}
                            </ul>
                            <p className="text-xs text-muted-foreground">
                                Skor risiko merupakan indikator pendukung, bukan
                                kesimpulan pemeriksaan.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Perbandingan data lintas lembaga
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto rounded-md border">
                                <table className="w-full min-w-[700px] text-left text-sm">
                                    <thead className="bg-muted/50 text-xs text-muted-foreground">
                                        <tr>
                                            <th
                                                scope="col"
                                                className="px-3 py-2"
                                            >
                                                Indikator
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-3 py-2"
                                            >
                                                Dilaporkan ke BPJS
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-3 py-2"
                                            >
                                                Sumber pembanding
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-3 py-2"
                                            >
                                                Hasil
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {investigation.comparisons.map(
                                            (comparison) => (
                                                <tr key={comparison.key}>
                                                    <th
                                                        scope="row"
                                                        className="px-3 py-2 font-medium"
                                                    >
                                                        {comparison.label}
                                                    </th>
                                                    <td className="px-3 py-2">
                                                        {comparison.bpjsValue ??
                                                            'Belum tersedia'}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {comparison.comparisonValue ??
                                                            comparison.sourceName}
                                                        {comparison.sourceReference ? (
                                                            <span className="mt-1 block text-xs text-muted-foreground">
                                                                {
                                                                    comparison.sourceReference
                                                                }
                                                            </span>
                                                        ) : null}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {comparison.result}
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Ringkasan kasus</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 text-sm leading-6">
                            <p>
                                <strong>{investigation.case.typeLabel}</strong>
                                {' · '}
                                {investigation.case.summary ||
                                    'Ringkasan kasus belum tersedia.'}
                            </p>
                            {investigation.findings.length > 0 ? (
                                <ul className="grid gap-3">
                                    {investigation.findings.map((finding) => (
                                        <li
                                            key={finding.title}
                                            className="rounded-md border p-3"
                                        >
                                            <p className="font-semibold">
                                                {finding.title}
                                            </p>
                                            <p className="mt-1 text-muted-foreground">
                                                {finding.description}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted-foreground">
                                    Belum ada temuan tambahan dari perbandingan
                                    sumber yang tersedia.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Status &amp; rekomendasi tindak lanjut
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 text-sm">
                            <p>
                                Status kasus:{' '}
                                <strong>
                                    {investigation.case.statusLabel}
                                </strong>
                            </p>
                            <p className="rounded-md border border-amber-200 bg-amber-50 p-3 leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                                <strong>Rekomendasi sistem:</strong>{' '}
                                {investigation.recommendation}
                            </p>
                        </CardContent>
                    </Card>

                    <section className="space-y-3">
                        <h3 className="font-semibold">
                            Riwayat tindak lanjut (
                            {investigation.historyCount.toLocaleString('id-ID')}{' '}
                            aktivitas)
                        </h3>
                        {investigation.historyCount >
                        investigation.history.length ? (
                            <p className="text-sm text-muted-foreground">
                                Menampilkan{' '}
                                {investigation.history.length.toLocaleString(
                                    'id-ID',
                                )}{' '}
                                aktivitas terbaru.
                            </p>
                        ) : null}
                        {investigation.history.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Belum ada aktivitas tindak lanjut.
                            </p>
                        ) : (
                            <ol className="grid gap-3">
                                {investigation.history.map((activity) => (
                                    <li
                                        key={activity.id}
                                        className="rounded-lg border p-3"
                                    >
                                        <p className="text-sm font-semibold">
                                            {activity.title}
                                        </p>
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
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {activity.notes ||
                                                'Tidak ada catatan tambahan.'}
                                        </p>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            {activity.actor} ·{' '}
                                            {activity.createdAt ??
                                                'Waktu tidak tersedia'}
                                        </p>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </section>

                    <footer className="border-t pt-4 text-xs text-muted-foreground">
                        Nilai merupakan agregat dan tidak menampilkan identitas
                        pekerja perorangan.
                    </footer>
                </article>
            </main>
            <style>{`
                @media print {
                    @page { margin: 18mm; }
                    body { background: white !important; }
                }
            `}</style>
        </>
    );
}

InvestigationReport.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
