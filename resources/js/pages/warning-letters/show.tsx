import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { PageHeader } from '@/components/bsafe/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { dashboard } from '@/routes';

type Props = {
    letter: {
        id: number;
        status: string;
        data: {
            company?: {
                name?: string;
                nib?: string | null;
                npwp?: string | null;
            };
            type?: string;
            period?: string;
            summary?: string;
            created_at?: string;
            notice?: string;
        };
    };
};

export default function WarningLetterShow({ letter }: Props) {
    return (
        <>
            <Head title="Draf Surat Peringatan" />
            <main className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
                <PageHeader
                    title="Draf surat peringatan"
                    description="Dokumen ini masih berupa draf internal dan belum disetujui atau dikirim."
                    actions={
                        <Button type="button" onClick={() => window.print()}>
                            <Printer aria-hidden="true" />
                            Cetak draf
                        </Button>
                    }
                />
                <Card>
                    <CardContent className="space-y-6 py-6">
                        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                            {letter.data.notice ??
                                'DRAF — belum disetujui atau dikirim.'}
                        </div>
                        <header className="space-y-2 border-b pb-4 text-center">
                            <p className="text-sm font-semibold tracking-widest uppercase">
                                Draf surat
                            </p>
                            <h1 className="text-xl font-bold">
                                Pemberitahuan hasil pengawasan
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Nomor surat dan identitas pejabat belum
                                ditetapkan.
                            </p>
                        </header>
                        <section className="space-y-3 text-sm leading-6">
                            <p>
                                Kepada Yth. Pengelola{' '}
                                {letter.data.company?.name ?? 'Perusahaan'}
                            </p>
                            <p>
                                Berdasarkan peninjauan data untuk periode{' '}
                                <strong>
                                    {letter.data.period ?? 'tidak tersedia'}
                                </strong>
                                , teridentifikasi indikator{' '}
                                <strong>{letter.data.type ?? 'anomali'}</strong>
                                .
                            </p>
                            <p>
                                {letter.data.summary ??
                                    'Ringkasan temuan tidak tersedia.'}
                            </p>
                            <p>
                                Mohon melakukan klarifikasi melalui petugas yang
                                berwenang. Dokumen ini tidak menyatakan adanya
                                pelanggaran dan harus ditinjau sebelum
                                digunakan.
                            </p>
                        </section>
                        <footer className="border-t pt-4 text-xs text-muted-foreground">
                            Draf dibuat{' '}
                            {letter.data.created_at ??
                                'pada waktu tidak tersedia'}{' '}
                            · status: {letter.status}
                        </footer>
                    </CardContent>
                </Card>
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

WarningLetterShow.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
