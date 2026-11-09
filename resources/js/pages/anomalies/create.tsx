import { Form, Head, Link } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/bsafe/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dashboard } from '@/routes';
import {
    create as createAnomaly,
    index as anomaliesIndex,
    store as storeAnomaly,
} from '@/routes/anomalies';

type Option = {
    value: string;
    label: string;
};

type Props = {
    types: Option[];
    risks: Option[];
};

export default function CreateAnomaly({ types, risks }: Props) {
    return (
        <>
            <Head title="Tambah Anomali" />
            <main className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title="Tambah Anomali"
                    description="Catat temuan anomali secara manual untuk ditinjau."
                />

                <Form
                    {...storeAnomaly.form()}
                    disableWhileProcessing
                    className="grid gap-6 rounded-xl border bg-card p-4 md:grid-cols-2 md:p-6"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="npwp">NPWP perusahaan</Label>
                                <Input
                                    id="npwp"
                                    name="npwp"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    maxLength={16}
                                    placeholder="16 digit angka"
                                    required
                                />
                                <InputError message={errors.npwp} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="type">Jenis anomali</Label>
                                <select
                                    id="type"
                                    name="type"
                                    required
                                    defaultValue=""
                                    className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                                >
                                    <option value="" disabled>
                                        Pilih jenis anomali
                                    </option>
                                    {types.map((type) => (
                                        <option
                                            key={type.value}
                                            value={type.value}
                                        >
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.type} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="risk">Tingkat risiko</Label>
                                <select
                                    id="risk"
                                    name="risk"
                                    required
                                    defaultValue=""
                                    className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                                >
                                    <option value="" disabled>
                                        Pilih tingkat risiko
                                    </option>
                                    {risks.map((risk) => (
                                        <option
                                            key={risk.value}
                                            value={risk.value}
                                        >
                                            {risk.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.risk} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="month">Bulan pajak</Label>
                                <select
                                    id="month"
                                    name="month"
                                    required
                                    defaultValue=""
                                    className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                                >
                                    <option value="" disabled>
                                        Pilih bulan
                                    </option>
                                    {Array.from({ length: 12 }, (_, index) => {
                                        const month = index + 1;

                                        return (
                                            <option key={month} value={month}>
                                                {String(month).padStart(2, '0')}
                                            </option>
                                        );
                                    })}
                                </select>
                                <InputError message={errors.month} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="year">Tahun pajak</Label>
                                <Input
                                    id="year"
                                    name="year"
                                    type="number"
                                    min={2000}
                                    max={new Date().getFullYear()}
                                    placeholder={String(new Date().getFullYear())}
                                    required
                                />
                                <InputError message={errors.year} />
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="summary">Keterangan temuan</Label>
                                <textarea
                                    id="summary"
                                    name="summary"
                                    required
                                    minLength={5}
                                    maxLength={2000}
                                    rows={5}
                                    placeholder="Jelaskan dasar atau ringkasan temuan anomali"
                                    className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                                />
                                <InputError message={errors.summary} />
                            </div>

                            <div className="flex flex-wrap gap-2 md:col-span-2">
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? 'Menyimpan...'
                                        : 'Simpan Anomali'}
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href={anomaliesIndex()}>
                                        Batal
                                    </Link>
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </main>
        </>
    );
}

CreateAnomaly.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Pusat Anomali', href: anomaliesIndex() },
        { title: 'Tambah Anomali', href: createAnomaly() },
    ],
};
