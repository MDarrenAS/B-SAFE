import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import {
    AnomalyListItem,
    RiskBadge,
    StatusBadge,
} from '@/components/bsafe/anomaly-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';

type FollowUp = {
    id: number;
    title: string;
    notes: string;
    actor: string;
    statusLabel: string | null;
    createdAt: string | null;
};

type Props = {
    case: AnomalyListItem & { evidence?: Record<string, unknown> };
    riskScore: {
        score: number;
        level: string;
        breakdown: Record<string, unknown> | null;
    } | null;
    followUps: FollowUp[];
    preparedBy: string;
    preparedAt: string;
};

export default function InvestigationReport({
    case: investigation,
    riskScore,
    followUps,
    preparedBy,
    preparedAt,
}: Props) {
    return (
        <>
            <Head title={`Laporan Pemeriksaan ${investigation.company.name}`} />
            <main className="mx-auto max-w-4xl space-y-6 p-4 md:p-8 print:p-0">
                <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                    <h1 className="text-2xl font-semibold">
                        Laporan pemeriksaan
                    </h1>
                    <Button type="button" onClick={() => window.print()}>
                        <Printer aria-hidden="true" />
                        Cetak / Simpan PDF
                    </Button>
                </div>

                <article className="space-y-6 rounded-xl border bg-card p-6 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
                    <header className="space-y-2 border-b pb-5">
                        <p className="text-sm font-semibold tracking-wide text-primary uppercase">
                            B-SAFE · Bahan pemeriksaan internal
                        </p>
                        <h2 className="text-2xl font-bold">
                            Ringkasan kasus pengawasan
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Dokumen ini merupakan ringkasan untuk keperluan
                            pemeriksaan, bukan penetapan pelanggaran.
                        </p>
                    </header>

                    <section className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Perusahaan
                            </p>
                            <p className="font-semibold">
                                {investigation.company.name}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Wilayah
                            </p>
                            <p className="font-semibold">
                                {[
                                    investigation.company.city,
                                    investigation.company.province,
                                ]
                                    .filter(Boolean)
                                    .join(', ') || 'Tidak tersedia'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Jenis anomali
                            </p>
                            <p className="font-semibold">
                                {investigation.typeLabel}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Periode data
                            </p>
                            <p className="font-semibold">
                                {investigation.period}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Tingkat risiko dan status
                            </p>
                            <div className="mt-1 flex flex-wrap gap-2">
                                <RiskBadge
                                    risk={investigation.risk}
                                    label={investigation.riskLabel}
                                />
                                <StatusBadge
                                    label={investigation.statusLabel}
                                />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Pekerja terdampak
                            </p>
                            <p className="font-semibold">
                                {investigation.affectedWorkers.toLocaleString(
                                    'id-ID',
                                )}
                            </p>
                        </div>
                    </section>

                    <Card>
                        <CardHeader>
                            <CardTitle>Ringkasan temuan</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm leading-6">
                            {investigation.summary}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Data identifikasi tersamarkan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid gap-4 sm:grid-cols-3">
                                {[
                                    ['NIB', investigation.company.nib],
                                    ['NPWP', investigation.company.npwp],
                                    [
                                        'Data peserta BPJS',
                                        investigation.values.bpjs,
                                    ],
                                    [
                                        'Data pembanding',
                                        investigation.values.comparison,
                                    ],
                                    [
                                        'Selisih',
                                        investigation.values.difference,
                                    ],
                                ].map(([label, value]) => (
                                    <div key={label}>
                                        <dt className="text-xs text-muted-foreground">
                                            {label}
                                        </dt>
                                        <dd className="mt-1 text-sm font-medium">
                                            {value ?? 'Tidak tersedia'}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </CardContent>
                    </Card>

                    <section className="space-y-3">
                        <h3 className="font-semibold">Riwayat tindak lanjut</h3>
                        {followUps.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Belum ada tindak lanjut yang tercatat.
                            </p>
                        ) : (
                            <ol className="grid gap-3">
                                {followUps.map((followUp) => (
                                    <li
                                        key={followUp.id}
                                        className="rounded-lg border p-3"
                                    >
                                        <p className="text-sm font-medium">
                                            {followUp.title}
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {followUp.notes ||
                                                'Tidak ada catatan tambahan.'}
                                        </p>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            {followUp.actor} ·{' '}
                                            {followUp.createdAt ??
                                                'Waktu tidak tersedia'}
                                        </p>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </section>

                    {riskScore ? (
                        <section className="space-y-2 border-t pt-4">
                            <h3 className="font-semibold">
                                Skor risiko perusahaan
                            </h3>
                            <p className="text-sm">
                                Skor {riskScore.score.toLocaleString('id-ID')} ·{' '}
                                {riskScore.level}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Skor merupakan indikator pendukung, bukan
                                kesimpulan pemeriksaan.
                            </p>
                        </section>
                    ) : null}

                    <footer className="border-t pt-4 text-xs text-muted-foreground">
                        Disiapkan oleh {preparedBy} pada {preparedAt}. Data
                        identifikasi dan nilai sensitif disamarkan.
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
