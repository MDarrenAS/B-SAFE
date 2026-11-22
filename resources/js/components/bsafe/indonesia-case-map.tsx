import type { FeatureCollection, Geometry } from 'geojson';
import type { Layer, PathOptions } from 'leaflet';
import { useEffect, useMemo, useState } from 'react';
import { GeoJSON, MapContainer, TileLayer, ZoomControl } from 'react-leaflet';

type ProvinceProperties = {
    PROVINSI: string;
    KODE_PROV: string;
};

type ProvinceCollection = FeatureCollection<Geometry, ProvinceProperties>;

type Props = {
    caseCountsByProvince: Array<{ province: string; caseCount: number }>;
};

const provinceAliases: Record<string, string> = {
    'DAERAH ISTIMEWA YOGYAKARTA': 'DI YOGYAKARTA',
    'KEPULAUAN BANGKA BELITUNG': 'BANGKA BELITUNG',
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isProvinceCollection(value: unknown): value is ProvinceCollection {
    if (
        !isRecord(value) ||
        value.type !== 'FeatureCollection' ||
        !Array.isArray(value.features)
    ) {
        return false;
    }

    return value.features.every((feature) => {
        if (
            !isRecord(feature) ||
            !isRecord(feature.properties) ||
            !isRecord(feature.geometry)
        ) {
            return false;
        }

        return (
            typeof feature.properties.PROVINSI === 'string' &&
            typeof feature.properties.KODE_PROV === 'string'
        );
    });
}

function getProvinceName(properties: unknown): string | undefined {
    if (!isRecord(properties) || typeof properties.PROVINSI !== 'string') {
        return undefined;
    }

    return properties.PROVINSI;
}

function provinceKey(name: string): string {
    const normalized = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\./g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();

    return provinceAliases[normalized] ?? normalized;
}

function fillColor(caseCount: number, maximumCases: number): string {
    if (caseCount === 0) {
        return '#e2e8f0';
    }

    const share = caseCount / maximumCases;

    if (share <= 0.25) {
        return '#bbf7d0';
    }

    if (share <= 0.5) {
        return '#4ade80';
    }

    if (share <= 0.75) {
        return '#16a34a';
    }

    return '#14532d';
}

export default function IndonesiaCaseMap({ caseCountsByProvince }: Props) {
    const [boundaries, setBoundaries] = useState<ProvinceCollection | null>(
        null,
    );
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const loadBoundaries = async () => {
            try {
                const response = await fetch(
                    '/data/indonesia-38-provinces.geojson',
                    { signal: controller.signal },
                );

                if (!response.ok) {
                    throw new Error(
                        `Gagal memuat batas provinsi (HTTP ${response.status}).`,
                    );
                }

                const data: unknown = await response.json();

                if (!isProvinceCollection(data)) {
                    throw new Error('Data batas provinsi tidak valid.');
                }

                setBoundaries(data);
            } catch (error) {
                if (controller.signal.aborted) {
                    return;
                }

                setLoadError(
                    error instanceof Error
                        ? error.message
                        : 'Gagal memuat peta provinsi.',
                );
            }
        };

        void loadBoundaries();

        return () => controller.abort();
    }, []);

    const provinceCounts = useMemo(() => {
        const counts = new Map<string, number>();

        caseCountsByProvince.forEach(({ province, caseCount }) => {
            const key = provinceKey(province);
            counts.set(key, (counts.get(key) ?? 0) + caseCount);
        });

        return counts;
    }, [caseCountsByProvince]);
    const maximumCases = Math.max(1, ...provinceCounts.values());
    const totalCases = Array.from(provinceCounts.values()).reduce(
        (total, caseCount) => total + caseCount,
        0,
    );
    const affectedProvinces = Array.from(provinceCounts.values()).filter(
        (caseCount) => caseCount > 0,
    ).length;

    if (loadError) {
        return (
            <div
                className="flex h-[360px] items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 px-6 text-center text-sm text-destructive sm:h-[460px]"
                role="alert"
            >
                {loadError}
            </div>
        );
    }

    if (!boundaries) {
        return (
            <div
                className="flex h-[360px] items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground sm:h-[460px]"
                role="status"
            >
                Memuat peta provinsi...
            </div>
        );
    }

    return (
        <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <p className="font-medium">
                    {totalCases.toLocaleString('id-ID')} kasus di{' '}
                    {affectedProvinces} provinsi
                </p>
                <div
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
                    aria-label="Legenda jumlah kasus"
                >
                    {[
                        { label: '0', color: '#e2e8f0' },
                        { label: 'Rendah', color: '#bbf7d0' },
                        { label: 'Sedang', color: '#4ade80' },
                        { label: 'Tinggi', color: '#16a34a' },
                        { label: 'Tertinggi', color: '#14532d' },
                    ].map((item) => (
                        <span
                            key={item.label}
                            className="inline-flex items-center gap-1.5"
                        >
                            <span
                                className="size-3 rounded-sm border border-black/10"
                                style={{ backgroundColor: item.color }}
                                aria-hidden="true"
                            />
                            {item.label}
                        </span>
                    ))}
                </div>
            </div>

            <MapContainer
                center={[-2.2, 118]}
                zoom={4}
                minZoom={3}
                maxZoom={10}
                scrollWheelZoom
                zoomControl={false}
                className="z-0 h-[360px] w-full rounded-lg sm:h-[460px]"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ZoomControl position="topright" />
                <GeoJSON
                    data={boundaries}
                    style={(feature): PathOptions => {
                        const name = getProvinceName(feature?.properties);
                        const caseCount = name
                            ? (provinceCounts.get(provinceKey(name)) ?? 0)
                            : 0;

                        return {
                            color: '#ffffff',
                            weight: 1.25,
                            fillColor: fillColor(caseCount, maximumCases),
                            fillOpacity: 0.82,
                        };
                    }}
                    onEachFeature={(feature, layer: Layer) => {
                        const province = getProvinceName(feature.properties);

                        if (!province) {
                            return;
                        }

                        const caseCount =
                            provinceCounts.get(provinceKey(province)) ?? 0;
                        const countLabel = `${caseCount.toLocaleString('id-ID')} kasus anomali`;
                        const tooltip = document.createElement('span');
                        tooltip.textContent = `${province}: ${countLabel}`;
                        layer.bindTooltip(tooltip, {
                            sticky: true,
                            direction: 'auto',
                        });

                        const popup = document.createElement('div');
                        const title = document.createElement('strong');
                        const count = document.createElement('div');
                        title.textContent = province;
                        count.textContent = countLabel;
                        popup.append(title, count);
                        layer.bindPopup(popup);
                    }}
                />
            </MapContainer>
        </div>
    );
}
