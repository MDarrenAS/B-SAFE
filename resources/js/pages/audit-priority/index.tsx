import { Head, Link } from '@inertiajs/react';
import {
    AnomalyTable,
    type AnomalyListItem,
    type Pagination,
} from '@/components/bsafe/anomaly-table';
import { PageHeader } from '@/components/bsafe/page-header';
import { Button } from '@/components/ui/button';
import { index as auditPriorityIndex } from '@/routes/audit-priority';
import { dashboard } from '@/routes';

type Props = {
    anomalies: Pagination<AnomalyListItem>;
    filters: { period: string; type: string; region: string };
    risks: Array<{ value: string; label: string }>;
    types: Array<{ value: string; label: string }>;
};

export default function AuditPriorityIndex({
    anomalies,
    filters,
    types,
}: Props) {
    return (
        <>
            <Head title="Prioritas Audit" />
            <main className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title="Prioritas audit"
                    description="Daftar kasus tersusun berdasarkan tingkat risiko untuk mendukung penentuan prioritas pemeriksaan."
                />
                <form
                    action={auditPriorityIndex.url()}
                    method="get"
                    className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-3"
                >
                    <div className="grid gap-2">
                        <label
                            htmlFor="audit-period"
                            className="text-sm font-medium"
                        >
                            Periode
                        </label>
                        <input
                            id="audit-period"
                            type="month"
                            name="period"
                            defaultValue={filters.period}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        />
                    </div>
                    <div className="grid gap-2">
                        <label
                            htmlFor="audit-type"
                            className="text-sm font-medium"
                        >
                            Jenis anomali
                        </label>
                        <select
                            id="audit-type"
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
                            htmlFor="audit-region"
                            className="text-sm font-medium"
                        >
                            Provinsi
                        </label>
                        <input
                            id="audit-region"
                            name="region"
                            defaultValue={filters.region}
                            maxLength={120}
                            placeholder="Nama provinsi"
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        />
                    </div>
                    <div className="flex gap-2 sm:col-span-3">
                        <Button type="submit">Terapkan filter</Button>
                        <Button asChild type="button" variant="outline">
                            <Link href={auditPriorityIndex.url()}>Reset</Link>
                        </Button>
                    </div>
                </form>
                <AnomalyTable
                    anomalies={anomalies}
                    emptyMessage="Belum ada kasus untuk prioritas audit."
                />
                <p className="text-xs text-muted-foreground">
                    Pengurutan risiko membantu peninjauan; penetapan audit
                    lapangan tetap memerlukan keputusan petugas.
                </p>
            </main>
        </>
    );
}

AuditPriorityIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Prioritas audit', href: auditPriorityIndex.url() },
    ],
};
