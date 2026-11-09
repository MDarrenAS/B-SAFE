import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type Props = {
    label: string;
    value: string | number;
    detail: string;
    icon: LucideIcon;
};

export function MetricCard({ label, value, detail, icon: Icon }: Props) {
    return (
        <Card className="gap-4">
            <CardContent className="flex items-start justify-between gap-4">
                <div className="grid gap-2">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-3xl font-semibold tracking-tight">
                        {value}
                    </p>
                    <p className="text-xs text-muted-foreground">{detail}</p>
                </div>
                <span className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                </span>
            </CardContent>
        </Card>
    );
}
