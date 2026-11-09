import { Head } from '@inertiajs/react';
import { Building2, ShieldCheck } from 'lucide-react';
import { CaseWorkflow } from '@/components/bsafe/case-workflow';
import type { AnomalyListItem } from '@/components/bsafe/anomaly-table';
import { PageHeader } from '@/components/bsafe/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';

type Props = {
    company: {
        name: string;
        nib: string | null;
        npwp: string | null;
        city: string | null;
        province: string | null;
        regionCode: string | null;
        detailUrl: string | null;
    };
    anomalies: Array<
        AnomalyListItem & {
            followUps: Array<{
                id: number;
                title: string;
                notes: string;
                actor: string;
                statusLabel: string | null;
                createdAt: string | null;
            }>;
        }
    >;
    riskScore: {
        score: number;
        level: string;
        breakdown: Record<string, unknown> | null;
        generatedAt: string | null;
    } | null;
};

export default function CompanyShow({ company, anomalies, riskScore }: Props) {
    return (
        <>
            <Head title={`Pemeriksaan ${company.name}`} />
            <main className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title={company.name}
                    description="Profil perusahaan dan riwayat penanganan temuan."
                />

                <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
                    <Card>
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
                            <dl className="grid gap-4 sm:grid-cols-2">
                                {[
                                    ['NIB', company.nib],
                                    ['NPWP', company.npwp],
                                    ['Kota/Kabupaten', company.city],
                                    ['Provinsi', company.province],
                                ].map(([label, value]) => (
                                    <div key={label} className="grid gap-1">
                                        <dt className="text-xs text-muted-foreground">
                                            {label}
                                        </dt>
                                        <dd className="text-sm font-medium">
                                            {value ?? 'Tidak tersedia'}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck
                                    className="size-5 text-primary"
                                    aria-hidden="true"
                                />
                                Skor risiko
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3">
                            {riskScore ? (
                                <>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-3xl font-semibold">
                                            {riskScore.score.toLocaleString(
                                                'id-ID',
                                            )}
                                        </span>
                                        <Badge variant="outline">
                                            {riskScore.level}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Dihitung{' '}
                                        {riskScore.generatedAt ??
                                            'pada waktu tidak tersedia'}
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Skor belum tersedia. Konfigurasi parameter
                                    risiko belum lengkap.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-4">
                    <div>
                        <h2 className="text-lg font-semibold">
                            Kasus dan tindak lanjut
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {anomalies.length} kasus tercatat untuk perusahaan
                            ini.
                        </p>
                    </div>
                    {anomalies.length > 0 ? (
                        anomalies.map((anomaly) => (
                            <CaseWorkflow key={anomaly.id} anomaly={anomaly} />
                        ))
                    ) : (
                        <Card>
                            <CardContent className="py-10 text-center text-sm text-muted-foreground">
                                Belum ada kasus anomali untuk perusahaan ini.
                            </CardContent>
                        </Card>
                    )}
                </section>
            </main>
        </>
    );
}

CompanyShow.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
