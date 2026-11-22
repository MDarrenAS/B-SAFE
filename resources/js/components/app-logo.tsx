import { usePage } from '@inertiajs/react';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <img
            src="/images/logo.png"
            alt={name}
            className="h-auto w-full max-w-full object-contain"
        />
    );
}
