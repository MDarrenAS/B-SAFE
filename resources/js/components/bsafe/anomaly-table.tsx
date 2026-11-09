import { Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export type AnomalyListItem = {
    id: number;
    company: {
        name: string;
        nib: string | null;
        npwp: string | null;
        city: string | null;
        province: string | null;
        regionCode: string | null;
        detailUrl: string | null;
    };
    type: string;
    typeLabel: string;
    risk: string;
    riskLabel: string;
    status: string;
    statusLabel: string;
    period: string;
    summary: string;
    affectedWorkers: number;
    createdAt: string | null;
    auditPrioritized: boolean;
    values: {
        bpjs: string | null;
        comparison: string | null;
        difference: string | null;
    };
};

export type Pagination<T> = {
    data: T[];
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    total: number;
    current_page: number;
    last_page: number;
};

type Props = {
    anomalies: Pagination<AnomalyListItem>;
    emptyMessage?: string;
};

export function RiskBadge({ risk, label }: { risk: string; label: string }) {
    const color =
        risk === 'TINGGI'
            ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
            : risk === 'SEDANG'
              ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300'
              : 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300';

    return <Badge className={color}>{label}</Badge>;
}

export function StatusBadge({ label }: { label: string }) {
    return <Badge variant="outline">{label}</Badge>;
}

export function AnomalyTable({
    anomalies,
    emptyMessage = 'Belum ada kasus yang sesuai dengan filter ini.',
}: Props) {
    if (anomalies.data.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                    {emptyMessage}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="gap-0 overflow-hidden py-0">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-b bg-muted/40 text-xs tracking-wide text-muted-foreground uppercase">
                        <tr>
                            <th className="px-5 py-3 font-medium">
                                Perusahaan
                            </th>
                            <th className="px-5 py-3 font-medium">Anomali</th>
                            <th className="px-5 py-3 font-medium">Periode</th>
                            <th className="px-5 py-3 font-medium">Risiko</th>
                            <th className="px-5 py-3 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {anomalies.data.map((anomaly) => (
                            <tr
                                key={anomaly.id}
                                className="transition-colors hover:bg-muted/30"
                            >
                                <td className="px-5 py-4">
                                    {anomaly.company.detailUrl ? (
                                        <Link
                                            href={anomaly.company.detailUrl}
                                            className="font-medium text-foreground hover:underline"
                                        >
                                            {anomaly.company.name}
                                        </Link>
                                    ) : (
                                        <span className="font-medium">
                                            {anomaly.company.name}
                                        </span>
                                    )}
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {[
                                            anomaly.company.city,
                                            anomaly.company.province,
                                        ]
                                            .filter(Boolean)
                                            .join(', ') ||
                                            'Wilayah tidak tersedia'}
                                    </p>
                                </td>
                                <td className="px-5 py-4">
                                    {anomaly.typeLabel}
                                </td>
                                <td className="px-5 py-4 text-muted-foreground">
                                    {anomaly.period}
                                </td>
                                <td className="px-5 py-4">
                                    <RiskBadge
                                        risk={anomaly.risk}
                                        label={anomaly.riskLabel}
                                    />
                                </td>
                                <td className="px-5 py-4">
                                    <StatusBadge label={anomaly.statusLabel} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex flex-col gap-3 border-t px-5 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>
                    {anomalies.total} kasus · halaman {anomalies.current_page}{' '}
                    dari {anomalies.last_page}
                </span>
                <nav
                    aria-label="Navigasi halaman"
                    className="flex flex-wrap gap-1"
                >
                    {anomalies.links.map((link, index) => {
                        const label = link.label
                            .replace(/&laquo;|&raquo;/g, '')
                            .trim();

                        return link.url ? (
                            <Link
                                key={`${link.label}-${index}`}
                                href={link.url}
                                preserveScroll
                                className={`rounded-md border px-3 py-1.5 ${
                                    link.active
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border hover:bg-muted'
                                }`}
                            >
                                {label}
                            </Link>
                        ) : (
                            <span
                                key={`${link.label}-${index}`}
                                className="rounded-md border border-border px-3 py-1.5 opacity-50"
                            >
                                {label}
                            </span>
                        );
                    })}
                </nav>
            </div>
        </Card>
    );
}
