import { Link } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { home } from '@/routes';

const integrations = [
    { name: 'BPJS', description: 'Kesehatan / TK' },
    { name: 'DJP', description: 'Kemenkeu RI' },
    { name: 'KEMNAKER', description: 'Wajib Lapor' },
    { name: 'DUKCAPIL', description: 'Identitas NIK' },
];

export default function LoginLayout({ children }: PropsWithChildren) {
    return (
        <main className="flex min-h-svh items-center justify-center bg-[#edf5f1] p-4 sm:p-8 lg:p-10">
            <div className="grid min-h-[650px] w-full max-w-[1008px] grid-cols-1 overflow-hidden rounded-[20px] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,35,28,0.12)] lg:grid-cols-2">
                <section className="flex min-h-[420px] flex-col justify-between bg-gradient-to-br from-[#062b21] via-[#07533e] to-[#0a7a4b] px-8 py-8 text-white sm:px-10 sm:py-10 lg:min-h-[650px] lg:px-11">
                    <div className="flex flex-1 flex-col">
                        <Link
                            href={home()}
                            aria-label="B-SAFE"
                            className="mx-auto mt-3 block w-full max-w-[21rem]"
                        >
                            <img
                                src="/images/logo.png"
                                alt="B-SAFE"
                                className="h-auto w-full object-contain"
                            />
                        </Link>

                        <div className="mt-10 sm:mt-12">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-emerald-200">
                                <ShieldCheck className="size-3.5 text-emerald-300" />
                                INOVASI HEALTHKATHON 2026
                            </span>
                            <p className="mt-4 max-w-md text-sm leading-[1.55] text-emerald-50/75 sm:text-[15px]">
                                Sistem Terpadu Validasi &amp; Pengawasan
                                Integritas Jaminan Sosial Nasional. Mengawal
                                kepatuhan dan presisi data kepesertaan secara
                                mutakhir.
                            </p>
                        </div>
                    </div>

                    <div className="mt-10 border-t border-white/10 pt-7">
                        <p className="mb-3 text-[10px] font-semibold tracking-wider text-emerald-100/60">
                            TERINTEGRASI DENGAN
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {integrations.map((integration) => (
                                <div
                                    key={integration.name}
                                    className="flex min-h-[52px] flex-col items-center justify-center rounded-lg border border-white/10 bg-white/[0.08] px-2 py-2 text-center"
                                >
                                    <span className="text-[10px] font-semibold text-emerald-200">
                                        {integration.name}
                                    </span>
                                    <span className="mt-0.5 text-[9px] text-emerald-50/60">
                                        {integration.description}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="flex items-center justify-center bg-white px-7 py-10 sm:px-12 lg:px-[55px]">
                    <div className="w-full max-w-[392px]">{children}</div>
                </section>
            </div>
        </main>
    );
}
