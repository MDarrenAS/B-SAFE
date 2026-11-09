import { Head, Link } from '@inertiajs/react';
import { Activity, Building2, CircleAlert, ShieldCheck } from 'lucide-react';
import { MetricCard } from '@/components/bsafe/metric-card';
import { PageHeader } from '@/components/bsafe/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { index as anomaliesIndex } from '@/routes/anomalies';
import { dashboard } from '@/routes';

type Props = {
    filters: { period: string };
    periods: string[];
    summary: {
        totalCompanies: number;
        anomalyCompanies: number;
        complianceRate: number | null;
        riskDistribution: Array<{
            value: string;
            label: string;
            count: number;
        }>;
        anomaliesByType: Array<{ value: string; label: string; count: number }>;
    };
    dataSource: string;
};

export default function Dashboard({
    filters,
    periods,
    summary,
    dataSource,
}: Props) {
    const largestTypeCount = Math.max(
        1,
        ...summary.anomaliesByType.map((item) => item.count),
    );

    return (
        <>
            <Head title="Dashboard B-SAFE" />
            <main className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title="Dashboard B-SAFE"
                    description="Ringkasan pengawasan kepatuhan perusahaan dan indikator anomali lintas instansi."
                    actions={
                        <Button asChild>
                            <Link href={anomaliesIndex.url()}>
                                <Activity aria-hidden="true" />
                                Buka pusat anomali
                            </Link>
                        </Button>
                    }
                />

                <form
                    action={dashboard.url()}
                    method="get"
                    className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-end"
                >
                    <div className="grid gap-2">
                        <label
                            htmlFor="dashboard-period"
                            className="text-sm font-medium"
                        >
                            Periode pemantauan
                        </label>
                        <select
                            id="dashboard-period"
                            name="period"
                            defaultValue={filters.period}
                            className="h-9 min-w-48 rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <option value="">Semua periode</option>
                            {periods.map((period) => (
                                <option key={period} value={period}>
                                    {period}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Button type="submit" variant="outline">
                        Terapkan
                    </Button>
                </form>

                <section
                    aria-label="Ringkasan kepatuhan"
                    className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    <MetricCard
                        label="Perusahaan aktif terpantau"
                        value={summary.totalCompanies.toLocaleString('id-ID')}
                        detail="Sumber data ketenagakerjaan"
                        icon={Building2}
                    />
                    <MetricCard
                        label="Perusahaan dengan anomali"
                        value={summary.anomalyCompanies.toLocaleString('id-ID')}
                        detail="Perusahaan unik pada periode pilihan"
                        icon={CircleAlert}
                    />
                    <MetricCard
                        label="Indikator kepatuhan"
                        value={
                            summary.complianceRate === null
                                ? '—'
                                : `${summary.complianceRate}%`
                        }
                        detail="Estimasi berbasis data simulasi"
                        icon={ShieldCheck}
                    />
                    <MetricCard
                        label="Jenis anomali"
                        value={
                            summary.anomaliesByType.filter(
                                (item) => item.count > 0,
                            ).length
                        }
                        detail="Kategori dengan temuan pada filter aktif"
                        icon={Activity}
                    />
                </section>

                <section className="grid gap-4 xl:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Distribusi tingkat risiko</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {summary.riskDistribution.map((risk) => {
                                const total = summary.riskDistribution.reduce(
                                    (sum, item) => sum + item.count,
                                    0,
                                );
                                const width =
                                    total === 0
                                        ? 0
                                        : (risk.count / total) * 100;
                                const color =
                                    risk.value === 'TINGGI'
                                        ? 'bg-red-500'
                                        : risk.value === 'SEDANG'
                                          ? 'bg-amber-500'
                                          : 'bg-emerald-500';

                                return (
                                    <div
                                        key={risk.value}
                                        className="grid gap-2"
                                    >
                                        <div className="flex justify-between gap-4 text-sm">
                                            <span>{risk.label}</span>
                                            <span className="font-medium">
                                                {risk.count.toLocaleString(
                                                    'id-ID',
                                                )}
                                            </span>
                                        </div>
                                        <div
                                            className="h-2 overflow-hidden rounded-full bg-muted"
                                            role="img"
                                            aria-label={`${risk.label}: ${risk.count} perusahaan`}
                                        >
                                            <div
                                                className={`h-full rounded-full ${color}`}
                                                style={{ width: `${width}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Temuan berdasarkan jenis anomali
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {summary.anomaliesByType.map((item) => (
                                <div key={item.value} className="grid gap-2">
                                    <div className="flex justify-between gap-4 text-sm">
                                        <span>{item.label}</span>
                                        <span className="font-medium">
                                            {item.count.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full bg-primary"
                                            style={{
                                                width: `${(item.count / largestTypeCount) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>

                <p className="text-xs text-muted-foreground">{dataSource}</p>
            </main>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
