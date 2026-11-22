import { Form, Head } from '@inertiajs/react';
import { ArrowRight, KeyRound, UserRound } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import PasskeyVerify from '@/components/passkey-verify';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Masuk" />
            <div className="mb-7">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Masuk ke Akun Pengawas
                </h1>
                <p className="mt-1.5 text-sm leading-5 text-slate-500">
                    Silakan masukkan kredensial resmi BPJS Ketenagakerjaan /
                    Kesehatan Anda.
                </p>
            </div>

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col"
            >
                {({ processing, errors }) => (
                    <>
                        {status && (
                            <p
                                role="status"
                                className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800"
                            >
                                {status}
                            </p>
                        )}

                        <PasskeyVerify
                            label="Masuk dengan Passkey"
                            loadingLabel="Memverifikasi..."
                            separator="ATAU DENGAN AKUN"
                            buttonClassName="border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-800"
                            separatorClassName="bg-white text-slate-400"
                        />

                        <div className="grid gap-4">
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="email"
                                    className="text-[11px] font-semibold tracking-wide text-slate-700"
                                >
                                    EMAIL PENGAWAS
                                </Label>
                                <div className="relative">
                                    <UserRound
                                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                                        aria-hidden="true"
                                    />
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        autoComplete="email"
                                        placeholder="nama.analisis@bpjs.go.id"
                                        className="h-10 rounded-xl border-slate-200 pl-10 text-sm placeholder:text-slate-400 focus-visible:border-emerald-700 focus-visible:ring-emerald-700/15"
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="password"
                                    className="text-[11px] font-semibold tracking-wide text-slate-700"
                                >
                                    KATA SANDI
                                </Label>
                                <div className="relative">
                                    <KeyRound
                                        className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-slate-400"
                                        aria-hidden="true"
                                    />
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        autoComplete="current-password"
                                        placeholder="Masukkan kata sandi"
                                        className="h-10 rounded-xl border-slate-200 pl-10 text-sm placeholder:text-slate-400 focus-visible:border-emerald-700 focus-visible:ring-emerald-700/15"
                                    />
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            <div className="mt-0.5 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <Checkbox id="remember" name="remember" />
                                    <Label
                                        htmlFor="remember"
                                        className="text-xs font-normal text-slate-600"
                                    >
                                        Ingat saya di perangkat ini
                                    </Label>
                                </div>
                                {canResetPassword && (
                                    <TextLink
                                        href={request()}
                                        className="text-xs font-semibold text-[#0a7a4b] hover:underline"
                                    >
                                        Lupa kata sandi?
                                    </TextLink>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="mt-1 h-11 w-full rounded-xl bg-[#0a7a4b] text-sm font-semibold text-white shadow-[0_8px_16px_rgba(10,122,75,0.2)] hover:bg-[#086c42]"
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Masuk ke Dashboard
                                <ArrowRight className="size-4" />
                            </Button>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Login.layout = {
    title: 'Masuk ke Akun Pengawas',
    description:
        'Silakan masukkan kredensial resmi BPJS Ketenagakerjaan / Kesehatan Anda.',
};
