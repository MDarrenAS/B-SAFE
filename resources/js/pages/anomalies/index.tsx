import { Head, Link } from '@inertiajs/react';
import {
    AnomalyTable,
    type Pagination,
    type AnomalyListItem,
} from '@/components/bsafe/anomaly-table';
import { PageHeader } from '@/components/bsafe/page-header';
import { Button } from '@/components/ui/button';
import {
    create as createAnomaly,
    index as anomaliesIndex,
} from '@/routes/anomalies';
import { dashboard } from '@/routes';

type Props = {
    anomalies: Pagination<AnomalyListItem>;
    filters: {
        q: string;
        type: string;
        risk: string;
        status: string;
        period: string;
    };
    types: Array<{ value: string; label: string }>;
};

const risks = [
    { value: 'TINGGI', label: 'Tinggi' },
    { value: 'SEDANG', label: 'Sedang' },
    { value: 'RENDAH', label: 'Rendah' },
];

const statuses = [
    { value: 'waiting_review', label: 'Menunggu tinjauan' },
    { value: 'in_review', label: 'Dalam peninjauan' },
    { value: 'field_audit_priority', label: 'Prioritas audit lapangan' },
    { value: 'completed', label: 'Selesai' },
];

export default function AnomaliesIndex({ anomalies, filters, types }: Props) {
    return (
        <>
            <Head title="Pusat Anomali" />
            <main className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title="Pusat Anomali"
                    description="Cari dan saring temuan lintas instansi untuk ditinjau lebih lanjut."
                    actions={
                        <Button asChild>
                            <Link href={createAnomaly()}>
                                Tambah Anomali
                            </Link>
                        </Button>
                    }
                />

                <form
                    action={anomaliesIndex.url()}
                    method="get"
                    className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2 xl:grid-cols-6"
                >
                    <div className="grid gap-2 sm:col-span-2 xl:col-span-2">
                        <label
                            htmlFor="anomaly-q"
                            className="text-sm font-medium"
                        >
                            Pencarian
                        </label>
                        <input
                            id="anomaly-q"
                            name="q"
                            defaultValue={filters.q}
                            placeholder="Nama perusahaan atau ID tersamarkan"
                            maxLength={100}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        />
                    </div>
                    {[
                        {
                            name: 'type',
                            label: 'Jenis anomali',
                            value: filters.type,
                            options: types,
                        },
                        {
                            name: 'risk',
                            label: 'Tingkat risiko',
                            value: filters.risk,
                            options: risks,
                        },
                        {
                            name: 'status',
                            label: 'Status kasus',
                            value: filters.status,
                            options: statuses,
                        },
                    ].map((filter) => (
                        <div key={filter.name} className="grid gap-2">
                            <label
                                htmlFor={`filter-${filter.name}`}
                                className="text-sm font-medium"
                            >
                                {filter.label}
                            </label>
                            <select
                                id={`filter-${filter.name}`}
                                name={filter.name}
                                defaultValue={filter.value}
                                className="h-9 min-w-0 rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="">Semua</option>
                                {filter.options.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}
                    <div className="grid gap-2">
                        <label
                            htmlFor="filter-period"
                            className="text-sm font-medium"
                        >
                            Periode
                        </label>
                        <input
                            id="filter-period"
                            type="month"
                            name="period"
                            defaultValue={filters.period}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        />
                    </div>
                    <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-6">
                        <Button type="submit">Terapkan filter</Button>
                        <Button asChild type="button" variant="outline">
                            <Link href={anomaliesIndex.url()}>Reset</Link>
                        </Button>
                    </div>
                </form>

                <AnomalyTable anomalies={anomalies} />
            </main>
        </>
    );
}

AnomaliesIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Pusat Anomali', href: anomaliesIndex.url() },
    ],
};
