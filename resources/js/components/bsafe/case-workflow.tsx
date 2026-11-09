import { Link, router, useForm } from '@inertiajs/react';
import { FileText, Flag, MessageSquareText } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { AnomalyListItem } from '@/components/bsafe/anomaly-table';
import { RiskBadge, StatusBadge } from '@/components/bsafe/anomaly-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { update as updateStatus } from '@/routes/anomalies/status';
import { store as storeFollowUp } from '@/routes/anomalies/follow-ups';
import { prioritizeAudit } from '@/routes/anomalies';
import { show as investigationReport } from '@/routes/reports';
import { store as createWarningLetter } from '@/routes/anomalies/warning-letter';

const caseStatuses = [
    { value: 'waiting_review', label: 'Menunggu tinjauan' },
    { value: 'in_review', label: 'Dalam peninjauan' },
    { value: 'field_audit_priority', label: 'Prioritas audit lapangan' },
    { value: 'completed', label: 'Selesai' },
];

type Props = {
    anomaly: AnomalyListItem & {
        followUps: Array<{
            id: number;
            title: string;
            notes: string;
            actor: string;
            statusLabel: string | null;
            createdAt: string | null;
        }>;
    };
};

export function CaseWorkflow({ anomaly }: Props) {
    const [status, setStatus] = useState(anomaly.status);
    const statusForm = useForm({ status, notes: '' });
    const noteForm = useForm({ notes: '' });

    function saveStatus(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        statusForm.patch(updateStatus(anomaly.id).url, {
            preserveScroll: true,
            onSuccess: () => statusForm.setData('notes', ''),
        });
    }

    function saveNote(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        noteForm.post(storeFollowUp(anomaly.id).url, {
            preserveScroll: true,
            onSuccess: () => noteForm.reset(),
        });
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="grid gap-2">
                        <CardTitle>{anomaly.typeLabel}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Periode {anomaly.period} · {anomaly.affectedWorkers}{' '}
                            pekerja terdampak
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <RiskBadge
                            risk={anomaly.risk}
                            label={anomaly.riskLabel}
                        />
                        <StatusBadge label={anomaly.statusLabel} />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                    <div className="grid gap-3">
                        <p className="text-sm">{anomaly.summary}</p>
                        <dl className="grid gap-2 sm:grid-cols-3">
                            {[
                                ['Peserta BPJS', anomaly.values.bpjs],
                                ['Data pembanding', anomaly.values.comparison],
                                ['Selisih', anomaly.values.difference],
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className="rounded-lg border bg-muted/20 p-3"
                                >
                                    <dt className="text-xs text-muted-foreground">
                                        {label}
                                    </dt>
                                    <dd className="mt-1 text-sm font-medium">
                                        {value ?? 'Tidak tersedia'}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:flex-col">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                router.post(
                                    prioritizeAudit(anomaly.id).url,
                                    {},
                                    {
                                        preserveScroll: true,
                                    },
                                )
                            }
                            disabled={anomaly.auditPrioritized}
                        >
                            <Flag aria-hidden="true" />
                            {anomaly.auditPrioritized
                                ? 'Prioritas audit aktif'
                                : 'Prioritaskan audit'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                router.post(
                                    createWarningLetter(anomaly.id).url,
                                    {},
                                    {
                                        preserveScroll: true,
                                    },
                                )
                            }
                        >
                            <FileText aria-hidden="true" />
                            Buat draf surat
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={investigationReport(anomaly.id).url}>
                                <FileText aria-hidden="true" />
                                Cetak laporan
                            </Link>
                        </Button>
                    </div>
                </div>

                <form
                    onSubmit={saveStatus}
                    className="grid gap-3 rounded-lg border p-4"
                >
                    <h3 className="text-sm font-semibold">
                        Pembaruan status kasus
                    </h3>
                    <div className="grid gap-3 md:grid-cols-[220px_1fr_auto] md:items-end">
                        <div className="grid gap-2">
                            <label
                                className="text-sm font-medium"
                                htmlFor={`status-${anomaly.id}`}
                            >
                                Status
                            </label>
                            <Select
                                value={status}
                                onValueChange={(value) => {
                                    setStatus(value);
                                    statusForm.setData('status', value);
                                }}
                            >
                                <SelectTrigger id={`status-${anomaly.id}`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {caseStatuses.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {statusForm.errors.status ? (
                                <p className="text-xs text-destructive">
                                    {statusForm.errors.status}
                                </p>
                            ) : null}
                        </div>
                        <div className="grid gap-2">
                            <label
                                className="text-sm font-medium"
                                htmlFor={`status-note-${anomaly.id}`}
                            >
                                Catatan pemeriksaan
                            </label>
                            <textarea
                                id={`status-note-${anomaly.id}`}
                                className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                value={statusForm.data.notes}
                                onChange={(event) =>
                                    statusForm.setData(
                                        'notes',
                                        event.target.value,
                                    )
                                }
                                placeholder="Tuliskan hasil pemeriksaan atau rencana tindak lanjut."
                                maxLength={2000}
                            />
                            {statusForm.errors.notes ? (
                                <p className="text-xs text-destructive">
                                    {statusForm.errors.notes}
                                </p>
                            ) : null}
                        </div>
                        <Button type="submit" disabled={statusForm.processing}>
                            Simpan status
                        </Button>
                    </div>
                </form>

                <form
                    onSubmit={saveNote}
                    className="grid gap-3 rounded-lg border p-4"
                >
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                        <MessageSquareText
                            className="size-4"
                            aria-hidden="true"
                        />
                        Tambah catatan tindak lanjut
                    </h3>
                    <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                        <div className="grid gap-2">
                            <label
                                className="text-sm font-medium"
                                htmlFor={`follow-up-${anomaly.id}`}
                            >
                                Catatan
                            </label>
                            <textarea
                                id={`follow-up-${anomaly.id}`}
                                className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                value={noteForm.data.notes}
                                onChange={(event) =>
                                    noteForm.setData(
                                        'notes',
                                        event.target.value,
                                    )
                                }
                                placeholder="Catatan pemeriksaan, klarifikasi, atau tindak lanjut."
                                maxLength={2000}
                            />
                            {noteForm.errors.notes ? (
                                <p className="text-xs text-destructive">
                                    {noteForm.errors.notes}
                                </p>
                            ) : null}
                        </div>
                        <Button type="submit" disabled={noteForm.processing}>
                            Simpan catatan
                        </Button>
                    </div>
                </form>

                <div className="grid gap-3">
                    <h3 className="text-sm font-semibold">
                        Riwayat tindak lanjut
                    </h3>
                    {anomaly.followUps.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Belum ada tindak lanjut yang tercatat.
                        </p>
                    ) : (
                        <ol className="grid gap-3 border-l pl-4">
                            {anomaly.followUps.map((followUp) => (
                                <li key={followUp.id} className="grid gap-1">
                                    <p className="text-sm font-medium">
                                        {followUp.title}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {followUp.notes ||
                                            'Tidak ada catatan tambahan.'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {followUp.actor} ·{' '}
                                        {followUp.createdAt ??
                                            'Waktu tidak tersedia'}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
