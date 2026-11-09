import { Head, Link } from '@inertiajs/react';
import { MapPinned } from 'lucide-react';
import { PageHeader } from '@/components/bsafe/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { index as riskMapIndex } from '@/routes/risk-map';
import { dashboard } from '@/routes';

type Props = {
    regions: Array<{
        regionCode: string;
        city: string;
        province: string;
        monitoredCompanies: number;
        anomalyCompanies: number;
        ratio: number;
    }>;
    filters: { period: string; type: string; region: string; city: string };
    types: Array<{ value: string; label: string }>;
};

export default function RiskMapIndex({ regions, filters, types }: Props) {
    const maxRatio = Math.max(0.01, ...regions.map((region) => region.ratio));

    return (
        <>
            <Head title="Peta Risiko Wilayah" />
            <main className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title="Risiko wilayah"
                    description="Perbandingan proporsi perusahaan dengan temuan per wilayah. Visualisasi ini menggunakan agregat tabel, bukan batas geografis."
                    actions={
                        <span className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground">
                            <MapPinned className="size-4" aria-hidden="true" />
                            Ringkasan wilayah
                        </span>
                    }
                />
                <form
                    action={riskMapIndex.url()}
                    method="get"
                    className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    <div className="grid gap-2">
                        <label
                            htmlFor="risk-period"
                            className="text-sm font-medium"
                        >
                            Periode
                        </label>
                        <input
                            id="risk-period"
                            type="month"
                            name="period"
                            defaultValue={filters.period}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        />
                    </div>
                    <div className="grid gap-2">
                        <label
                            htmlFor="risk-type"
                            className="text-sm font-medium"
                        >
                            Jenis anomali
                        </label>
                        <select
                            id="risk-type"
                            name="type"
                            defaultValue={filters.type}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <option value="">Semua jenis</option>
                            {types.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid gap-2">
                        <label
                            htmlFor="risk-region"
                            className="text-sm font-medium"
                        >
                            Provinsi
                        </label>
                        <input
                            id="risk-region"
                            name="region"
                            defaultValue={filters.region}
                            maxLength={120}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        />
                    </div>
                    <div className="grid gap-2">
                        <label
                            htmlFor="risk-city"
                            className="text-sm font-medium"
                        >
                            Kota/Kabupaten
                        </label>
                        <input
                            id="risk-city"
                            name="city"
                            defaultValue={filters.city}
                            maxLength={120}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        />
                    </div>
                    <div className="flex gap-2 sm:col-span-2 xl:col-span-4">
                        <Button type="submit">Terapkan filter</Button>
                        <Button asChild type="button" variant="outline">
                            <Link href={riskMapIndex.url()}>Reset</Link>
                        </Button>
                    </div>
                </form>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            Perbandingan temuan berdasarkan kota/kabupaten
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {regions.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                Data wilayah tidak tersedia untuk filter ini.
                            </p>
                        ) : (
                            regions.map((region) => (
                                <div
                                    key={`${region.regionCode}-${region.city}`}
                                    className="grid gap-2 rounded-lg border p-4"
                                >
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="font-medium">
                                                {region.city}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {region.province} · kode wilayah{' '}
                                                {region.regionCode ||
                                                    'tidak tersedia'}
                                            </p>
                                        </div>
                                        <p className="text-sm">
                                            <span className="font-semibold">
                                                {(
                                                    region.ratio * 100
                                                ).toLocaleString('id-ID', {
                                                    maximumFractionDigits: 1,
                                                })}
                                                %
                                            </span>
                                            <span className="text-muted-foreground">
                                                {' '}
                                                ({
                                                    region.anomalyCompanies
                                                } dari{' '}
                                                {region.monitoredCompanies})
                                            </span>
                                        </p>
                                    </div>
                                    <div
                                        className="h-2 overflow-hidden rounded-full bg-muted"
                                        role="img"
                                        aria-label={`Proporsi anomali ${region.city}: ${(region.ratio * 100).toFixed(1)} persen`}
                                    >
                                        <div
                                            className="h-full rounded-full bg-primary"
                                            style={{
                                                width: `${(region.ratio / maxRatio) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}

RiskMapIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Risiko wilayah', href: riskMapIndex.url() },
    ],
};
