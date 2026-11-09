import { Link } from '@inertiajs/react';
import {
    Activity,
    BookOpen,
    ClipboardCheck,
    FolderGit2,
    LayoutGrid,
    MapPinned,
    UserRound,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as anomaliesIndex } from '@/routes/anomalies';
import { index as auditPriorityIndex } from '@/routes/audit-priority';
import { show as accountShow } from '@/routes/account';
import { index as riskMapIndex } from '@/routes/risk-map';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Pusat Anomali',
        href: anomaliesIndex(),
        icon: Activity,
    },
    {
        title: 'Prioritas Audit',
        href: auditPriorityIndex(),
        icon: ClipboardCheck,
    },
    {
        title: 'Risiko Wilayah',
        href: riskMapIndex(),
        icon: MapPinned,
    },
    {
        title: 'Akun dan Aktivitas',
        href: accountShow(),
        icon: UserRound,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
