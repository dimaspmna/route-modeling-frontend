import React, { useEffect, useState } from "react";
import API from "../../../api/Api";
import {
    ClockIcon,
    CheckCircleIcon,
    ArrowPathIcon,
    UserGroupIcon,
    ChartBarIcon,
    ChartPieIcon,
    GlobeAsiaAustraliaIcon,
    FunnelIcon,
    CalendarIcon,
    MapIcon,
    BuildingOfficeIcon,
    TableCellsIcon,
    FireIcon,
    CurrencyDollarIcon,
    InformationCircleIcon,
    GlobeAmericasIcon,
    MagnifyingGlassIcon
} from "@heroicons/react/24/outline";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    LineController,
} from "chart.js";
import FuelLostReport from "./FuelLostReport";
import RouteMonitoring from "./RouteMonitoring";
import FilterMonitoring from "./FilterMonitoring";

ChartJS.register(ArcElement, BarElement, LineController, CategoryScale, LinearScale, Tooltip, Legend, PointElement, LineElement);

const SpvChart = () => {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [cards, setCards] = useState({
        totalRequests: 0,
        totalUsers: 0,
        pendingRequests: 0,
        completedRequests: 0
    });
    const [categoryChart, setCategoryChart] = useState([]);
    const [statusChart, setStatusChart] = useState([]);
    const [voyageChart, setVoyageChart] = useState([]);
    const [fuelLostTotal, setFuelLostTotal] = useState({ total_fuel_lost: 0, total_cost: 0 });
    const [fuelLossSummary, setFuelLossSummary] = useState([]);
    const [totalPerjalanan, setTotalPerjalanan] = useState({ total_all_perjalanan: 0 });
    const [completedRoutesMonth, setCompletedRoutesMonth] = useState({ total_completed_routes: 0, month: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State untuk data baru dari endpoint reroute dan non-reroute
    const [totalReroute, setTotalReroute] = useState({
        today: { total_reroute_today: 0, total_ipb: 0, total_fleet: 0, date: new Date().toISOString().split('T')[0] },
        all_time: { total_all_reroute: 0, total_ipb: 0, total_fleet: 0 }
    });
    const [totalNonReroute, setTotalNonReroute] = useState({
        today: { total_non_reroute_today: 0, total_ipb: 0, total_fleet: 0, date: new Date().toISOString().split('T')[0] },
        all_time: { total_all_non_reroute: 0, total_ipb: 0, total_fleet: 0 }
    });
    const [totalRoutePerDay, setTotalRoutePerDay] = useState({
        today: { total_route_today: 0, total_ipb: 0, total_fleet: 0, date: new Date().toISOString().split('T')[0] },
        all_time: { total_all_route: 0, total_ipb: 0, total_fleet: 0 }
    });

    // State untuk data area filter (untuk dashboard summary)
    const [ipbSummaryData, setIpbSummaryData] = useState({
        total_route: 0,
        fleet: 0,
        ipb: 0,
        central: 0,
        north: 0,
        south: 0
    });

    // State untuk filter fuel cost - DITAMBAHKAN
    const [fuelFilter, setFuelFilter] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        region: 'all',
        type: 'all'
    });

    const [filteredFuelData, setFilteredFuelData] = useState({
        success: false,
        filter: {
            type: "all",
            region: "all",
            start_date: "all",
            end_date: "all"
        },
        summary: {
            total_fuel_lost_liters: 0,
            total_cost: 0,
            valid_records_processed: 0
        },
        summary_by_type: {
            IPB: {
                count: 0,
                fuel_lost: 0,
                cost: 0
            },
            Supply: {
                count: 0,
                fuel_lost: 0,
                cost: 0
            }
        },
        summary_by_region: {
            fleet: {
                count: 0,
                fuel_lost: 0,
                cost: 0
            },
            central: {
                count: 0,
                fuel_lost: 0,
                cost: 0
            },
            north: {
                count: 0,
                fuel_lost: 0,
                cost: 0
            },
            south: {
                count: 0,
                fuel_lost: 0,
                cost: 0
            }
        },
        breakdown: {
            records_with_fuel_price: 0,
            records_using_fallback_price: 0,
            fallback_price_used: 13500,
            average_price_per_liter: 13500
        },
        total_records: 0
    });

    const [loadingFuel, setLoadingFuel] = useState(false);

    // Helper function untuk safe access
    const safeGet = (obj, path, defaultValue = null) => {
        return path.split('.').reduce((acc, key) => {
            return acc && acc[key] !== undefined ? acc[key] : defaultValue;
        }, obj);
    };

    // Format angka dengan pemisah ribuan dan desimal - DIPERBAIKI
    const formatNumber = (num, decimals = 0) => {
        if (num === undefined || num === null || isNaN(num)) return '0';

        const number = typeof num === 'string' ? parseFloat(num) : num;

        // Cek apakah angka memiliki desimal
        const hasDecimal = number % 1 !== 0;
        const actualDecimals = hasDecimal ? decimals : 0;

        return new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: actualDecimals,
            maximumFractionDigits: actualDecimals
        }).format(number);
    };

    // Format Rupiah dengan desimal - DIPERBAIKI
    const formatRupiah = (amount, options = {}) => {
        const { showSymbol = true, decimals = 0, fullFormat = false } = options;
        if (amount === undefined || amount === null || isNaN(amount)) return showSymbol ? 'Rp 0' : '0';

        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

        if (fullFormat) {
            const formatter = new Intl.NumberFormat('id-ID', {
                style: showSymbol ? 'currency' : 'decimal',
                currency: 'IDR',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            return showSymbol ? formatter.format(numAmount) : formatter.format(numAmount).replace(/\./g, ',');
        }

        const formatter = new Intl.NumberFormat('id-ID', {
            style: showSymbol ? 'currency' : 'decimal',
            currency: 'IDR',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
        return showSymbol ? formatter.format(numAmount) : formatter.format(numAmount).replace(/\./g, ',');
    };

    // Format untuk display di cards (lebih pendek)
    const formatCurrencyShort = (amount) => {
        if (amount === undefined || amount === null || isNaN(amount) || amount === 0) return 'Rp 0';
        const formatter = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        return formatter.format(amount);
    };

    // Format untuk nominal panjang - menampilkan semua digit dengan desimal - DITAMBAHKAN
    const formatCurrencyDetailed = (amount) => {
        if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0,00';
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const hasDecimal = numAmount % 1 !== 0;
        const formatter = new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: hasDecimal ? 2 : 0,
            maximumFractionDigits: hasDecimal ? 2 : 0
        });
        return `Rp ${formatter.format(numAmount)}`;
    };

    // Get today's date
    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    // Fetch dashboard data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Gunakan Promise.allSettled untuk menangani error individual
                const requests = [
                    { key: 'cardRes', promise: API.get("/cards/dashboard") },
                    { key: 'totalPerjalananRes', promise: API.get("/dashboard/total-perjalanan") },
                    { key: 'fuelLostTotalRes', promise: API.get("/dashboard/fuel-lost/total") },
                    { key: 'completedRoutesMonthRes', promise: API.get("/dashboard/completed-routes-month") },
                    { key: 'fuelCostLostRes', promise: API.get("/dashboard/fuel-lost/cost") },
                    { key: 'categoryRes', promise: API.get("/chart/category") },
                    { key: 'statusRes', promise: API.get("/pie/status") },
                    { key: 'voyageRes', promise: API.get("/dashboard/perjalanan") },
                    { key: 'fuelLossSummaryRes', promise: API.get("/dashboard/fuel-lost/reroute") },
                    { key: 'totalRerouteRes', promise: API.get("/dashboard/total-reroute") },
                    { key: 'totalNonRerouteRes', promise: API.get("/dashboard/total-non-reroute") },
                    { key: 'totalRoutePerDayRes', promise: API.get("/dashboard/total-route-per-day") },
                    { key: 'areaFilterRes', promise: API.get("/route/area-filter") }
                ];

                const results = await Promise.allSettled(requests.map(req => req.promise));
                const processedResults = {};
                results.forEach((result, index) => {
                    const key = requests[index].key;
                    if (result.status === 'fulfilled') {
                        processedResults[key] = result.value;
                    } else {
                        console.warn(`Failed to fetch ${key}:`, result.reason);
                        processedResults[key] = { data: null };
                    }
                });

                // Set data dengan struktur yang sesuai dari API response
                setCards(processedResults.cardRes?.data || {
                    totalRequests: 0,
                    totalUsers: 0,
                    pendingRequests: 0,
                    completedRequests: 0
                });
                setTotalPerjalanan(processedResults.totalPerjalananRes?.data || { total_all_perjalanan: 0 });

                // Update fuel lost data dengan data yang benar dari fuel cost endpoint
                if (processedResults.fuelCostLostRes?.data?.success) {
                    const fuelData = processedResults.fuelCostLostRes.data;
                    setFuelLostTotal({
                        total_fuel_lost: fuelData.summary?.total_fuel_lost_liters || 0,
                        total_cost: fuelData.summary?.total_cost || 0
                    });
                    // Set juga filteredFuelData dengan data awal
                    setFilteredFuelData(fuelData);
                } else {
                    // Fallback data jika response tidak sesuai
                    setFuelLostTotal({
                        total_fuel_lost: parseFloat(safeGet(processedResults.fuelLostTotalRes?.data, 'total_fuel_lost', 0)) || 0,
                        total_cost: parseFloat(safeGet(processedResults.fuelCostLostRes?.data?.summary, 'total_cost', 0)) || 0
                    });
                }

                setCompletedRoutesMonth(processedResults.completedRoutesMonthRes?.data || { total_completed_routes: 0, month: '' });
                setCategoryChart(safeGet(processedResults.categoryRes?.data, 'data', []));
                setStatusChart(safeGet(processedResults.statusRes?.data, 'data', []));
                setVoyageChart(safeGet(processedResults.voyageRes?.data, 'data', []));
                setFuelLossSummary(safeGet(processedResults.fuelLossSummaryRes?.data, 'data', []));

                // Set data dari endpoint baru dengan default values yang aman
                const rerouteData = safeGet(processedResults.totalRerouteRes?.data, 'data', {});
                setTotalReroute({
                    today: {
                        total_reroute_today: safeGet(rerouteData, 'today.total_reroute_today', 0),
                        total_ipb: safeGet(rerouteData, 'today.total_ipb', 0),
                        total_fleet: safeGet(rerouteData, 'today.total_fleet', 0),
                        date: safeGet(rerouteData, 'today.date', getTodayDate())
                    },
                    all_time: {
                        total_all_reroute: safeGet(rerouteData, 'all_time.total_all_reroute', 0),
                        total_ipb: safeGet(rerouteData, 'all_time.total_ipb', 0),
                        total_fleet: safeGet(rerouteData, 'all_time.total_fleet', 0)
                    }
                });

                const nonRerouteData = safeGet(processedResults.totalNonRerouteRes?.data, 'data', {});
                setTotalNonReroute({
                    today: {
                        total_non_reroute_today: safeGet(nonRerouteData, 'today.total_non_reroute_today', 0),
                        total_ipb: safeGet(nonRerouteData, 'today.total_ipb', 0),
                        total_fleet: safeGet(nonRerouteData, 'today.total_fleet', 0),
                        date: safeGet(nonRerouteData, 'today.date', getTodayDate())
                    },
                    all_time: {
                        total_all_non_reroute: safeGet(nonRerouteData, 'all_time.total_all_non_reroute', 0),
                        total_ipb: safeGet(nonRerouteData, 'all_time.total_ipb', 0),
                        total_fleet: safeGet(nonRerouteData, 'all_time.total_fleet', 0)
                    }
                });

                const routePerDayData = safeGet(processedResults.totalRoutePerDayRes?.data, 'data', {});
                setTotalRoutePerDay({
                    today: {
                        total_route_today: safeGet(routePerDayData, 'today.total_route_today', 0),
                        total_ipb: safeGet(routePerDayData, 'today.total_ipb', 0),
                        total_fleet: safeGet(routePerDayData, 'today.total_fleet', 0),
                        date: safeGet(routePerDayData, 'today.date', getTodayDate())
                    },
                    all_time: {
                        total_all_route: safeGet(routePerDayData, 'all_time.total_all_route', 0),
                        total_ipb: safeGet(routePerDayData, 'all_time.total_ipb', 0),
                        total_fleet: safeGet(routePerDayData, 'all_time.total_fleet', 0)
                    }
                });

                // Set data area filter untuk dashboard summary
                if (processedResults.areaFilterRes?.data?.success) {
                    setIpbSummaryData(processedResults.areaFilterRes.data.summary || {
                        total_route: 0,
                        fleet: 0,
                        ipb: 0,
                        central: 0,
                        north: 0,
                        south: 0
                    });
                }

            } catch (error) {
                console.error("Gagal mengambil data chart:", error);
                setError("Failed to load dashboard data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Fetch filtered fuel cost data dengan struktur yang benar - DITAMBAHKAN
    const fetchFuelCostData = async () => {
        try {
            setLoadingFuel(true);
            const params = {
                ...(fuelFilter.startDate && fuelFilter.startDate !== getTodayDate() && { start_date: fuelFilter.startDate }),
                ...(fuelFilter.endDate && fuelFilter.endDate !== getTodayDate() && { end_date: fuelFilter.endDate }),
                ...(fuelFilter.region !== 'all' && { region: fuelFilter.region }),
                ...(fuelFilter.type !== 'all' && { type: fuelFilter.type })
            };

            const response = await API.get("/dashboard/fuel-lost/cost", { params });

            if (response.data?.success) {
                setFilteredFuelData(response.data);
                // Update juga fuelLostTotal untuk konsistensi
                setFuelLostTotal({
                    total_fuel_lost: response.data.summary?.total_fuel_lost_liters || 0,
                    total_cost: response.data.summary?.total_cost || 0
                });
            } else {
                // Fallback data jika response tidak sesuai
                setFilteredFuelData({
                    success: true,
                    filter: {
                        type: fuelFilter.type,
                        region: fuelFilter.region,
                        start_date: fuelFilter.startDate,
                        end_date: fuelFilter.endDate
                    },
                    summary: {
                        total_fuel_lost_liters: 0,
                        total_cost: 0,
                        valid_records_processed: 0
                    },
                    summary_by_type: {
                        IPB: { count: 0, fuel_lost: 0, cost: 0 },
                        Supply: { count: 0, fuel_lost: 0, cost: 0 }
                    },
                    summary_by_region: {
                        fleet: { count: 0, fuel_lost: 0, cost: 0 },
                        central: { count: 0, fuel_lost: 0, cost: 0 },
                        north: { count: 0, fuel_lost: 0, cost: 0 },
                        south: { count: 0, fuel_lost: 0, cost: 0 }
                    },
                    breakdown: {
                        records_with_fuel_price: 0,
                        records_using_fallback_price: 0,
                        fallback_price_used: 13500,
                        average_price_per_liter: 13500
                    },
                    total_records: 0
                });
            }
        } catch (error) {
            console.error("Error fetching fuel cost data:", error);
            setFilteredFuelData({
                success: false,
                filter: {
                    type: fuelFilter.type,
                    region: fuelFilter.region,
                    start_date: fuelFilter.startDate,
                    end_date: fuelFilter.endDate
                },
                summary: { total_fuel_lost_liters: 0, total_cost: 0, valid_records_processed: 0 },
                summary_by_type: {
                    IPB: { count: 0, fuel_lost: 0, cost: 0 },
                    Supply: { count: 0, fuel_lost: 0, cost: 0 }
                },
                summary_by_region: {
                    fleet: { count: 0, fuel_lost: 0, cost: 0 },
                    central: { count: 0, fuel_lost: 0, cost: 0 },
                    north: { count: 0, fuel_lost: 0, cost: 0 },
                    south: { count: 0, fuel_lost: 0, cost: 0 }
                },
                breakdown: {
                    records_with_fuel_price: 0,
                    records_using_fallback_price: 0,
                    fallback_price_used: 13500,
                    average_price_per_liter: 13500
                },
                total_records: 0
            });
        } finally {
            setLoadingFuel(false);
        }
    };

    // Reset fuel filter - DITAMBAHKAN
    const resetFuelFilter = () => {
        const today = getTodayDate();
        setFuelFilter({
            startDate: today,
            endDate: today,
            region: 'all',
            type: 'all'
        });
    };

    // Palet warna untuk chart
    const categoryColors = [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(14, 165, 233, 0.8)',
        'rgba(20, 184, 166, 0.8)',
        'rgba(244, 63, 94, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(120, 113, 108, 0.8)',
    ];

    const statusColorMap = {
        'waiting approval': 'rgba(245, 158, 11, 0.8)',
        'process to fleet team': 'rgba(59, 130, 246, 0.8)',
        'approved': 'rgba(16, 185, 129, 0.8)',
        'rejected': 'rgba(239, 68, 68, 0.8)',
        'pending': 'rgba(156, 163, 175, 0.8)',
        'completed': 'rgba(139, 92, 246, 0.8)',
        'cancelled': 'rgba(120, 113, 108, 0.8)',
        'draft': 'rgba(14, 165, 233, 0.8)',
    };

    // Data untuk Bar Chart (Category)
    const categoryData = {
        labels: categoryChart.map((c) => {
            const category = c?.category || "";
            return category.toString().replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
        }),
        datasets: [
            {
                label: "Total Requests",
                data: categoryChart.map((c) => c?.total || 0),
                backgroundColor: categoryChart.map((_, index) =>
                    categoryColors[index % categoryColors.length]
                ),
                borderColor: categoryChart.map((_, index) =>
                    categoryColors[index % categoryColors.length].replace('0.8', '1')
                ),
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            },
        ],
    };

    // Data untuk Pie Chart (Status)
    const formatStatusLabel = (status) => {
        const labelMap = {
            'waiting approval': 'Waiting Approval',
            'process to fleet team': 'Process to Fleet Team',
            'approved': 'Approved',
            'rejected': 'Rejected',
            'pending': 'Pending',
            'completed': 'Completed',
            'cancelled': 'Cancelled',
            'draft': 'Draft'
        };
        return labelMap[status] || status.toString().replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    };

    const pieData = {
        labels: statusChart.map((s) => {
            const status = s?.status || "";
            return formatStatusLabel(status);
        }),
        datasets: [
            {
                data: statusChart.map((s) => s?.total || 0),
                backgroundColor: statusChart.map((s) => {
                    const status = s?.status || "";
                    return statusColorMap[status] || 'rgba(156, 163, 175, 0.8)';
                }),
                borderColor: statusChart.map((s) => {
                    const status = s?.status || "";
                    return statusColorMap[status]?.replace('0.8', '1') || 'rgba(156, 163, 175, 1)';
                }),
                borderWidth: 3,
                hoverBorderWidth: 4,
                hoverOffset: 8,
            },
        ],
    };

    // Data untuk Voyage Chart
    const voyageData = {
        labels: voyageChart.map((v) => {
            const type = v?.type || "Unknown";
            return type.charAt(0).toUpperCase() + type.slice(1);
        }),
        datasets: [
            {
                label: "Total Voyages",
                data: voyageChart.map((v) => v?.totalVoyage || 0),
                backgroundColor: voyageChart.map((_, index) =>
                    categoryColors[index % categoryColors.length]
                ),
                borderColor: voyageChart.map((_, index) =>
                    categoryColors[index % categoryColors.length].replace('0.8', '1')
                ),
                borderWidth: 3,
                hoverBorderWidth: 4,
                hoverOffset: 8,
            },
        ],
    };

    // Data untuk Fuel Loss Summary
    const fuelLossData = {
        labels: fuelLossSummary.map((f) => f?.name || 'Unknown'),
        datasets: [
            {
                label: "Total Fuel Loss (L)",
                data: fuelLossSummary.map((f) => f?.total_fuel_loss || 0),
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderColor: 'rgba(239, 68, 68, 1)',
                borderWidth: 2,
                borderRadius: 8,
            },
            {
                label: "Reroute Count",
                data: fuelLossSummary.map((f) => f?.reroute_count || 0),
                backgroundColor: 'rgba(245, 158, 11, 0.8)',
                borderColor: 'rgba(245, 158, 11, 1)',
                borderWidth: 2,
                borderRadius: 8,
                type: 'line',
                tension: 0.4,
            }
        ],
    };

    // Chart options
    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#1F2937',
                bodyColor: '#374151',
                borderColor: '#E5E7EB',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                boxPadding: 6,
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(243, 244, 246, 0.8)',
                },
                ticks: {
                    color: '#6B7280',
                    precision: 0
                }
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#6B7280',
                }
            }
        },
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle',
                }
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const label = context.label || '';
                        const value = context.parsed;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = Math.round((value / total) * 100);
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        },
    };

    const doughnutOptions = {
        ...pieOptions,
        cutout: '50%',
    };

    const lineBarOptions = {
        ...barOptions,
        scales: {
            ...barOptions.scales,
            y: {
                ...barOptions.scales.y,
                beginAtZero: true,
            }
        }
    };

    // COMPONENT TERSENDIRI UNTUK COST FUEL LOST - DIPERBAIKI
    const CostFuelLostCard = () => (
        <div className="mb-8">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6 shadow-lg">
                <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <div className="p-3 bg-white bg-opacity-20 rounded-xl mr-4">
                                <CurrencyDollarIcon className="h-8 w-8" />
                            </div>
                            <div>
                                <p className="text-sm opacity-90 font-medium">Cost Extra Fuel Consumption</p>
                                <p className="text-xs opacity-80 mt-1">Total biaya fuel hilang</p>
                            </div>
                        </div>
                        <div className="text-xs opacity-80 bg-white bg-opacity-20 px-3 py-1 rounded">
                            {filteredFuelData.filter.start_date !== 'all' ?
                                `Period: ${filteredFuelData.filter.start_date} to ${filteredFuelData.filter.end_date}` :
                                'All Time'}
                        </div>
                    </div>
                    <div className="mt-2">
                        <h2 className="text-2xl sm:text-3xl font-bold break-words leading-tight">
                            {formatCurrencyDetailed(filteredFuelData.summary.total_cost || 0)}
                        </h2>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                                <p className="text-xs opacity-90">Extra Fuel Consumption</p>
                                <p className="text-sm font-semibold">{formatNumber(filteredFuelData.summary.total_fuel_lost_liters || 0, 2)} L</p>
                            </div>
                            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                                <p className="text-xs opacity-90">Valid Records</p>
                                <p className="text-sm font-semibold">{filteredFuelData.summary.valid_records_processed || 0}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                                <p className="text-xs opacity-90">Avg Price/Liter</p>
                                <p className="text-sm font-semibold">{formatCurrencyDetailed(filteredFuelData.breakdown.average_price_per_liter || 0)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Card data - menggunakan data dari endpoint baru dengan safeGet
    const cardData = [
        {
            title: "Total Route All Time",
            value: safeGet(totalRoutePerDay, 'all_time.total_all_route', 0),
            icon: ArrowPathIcon,
            bgColor: "bg-gradient-to-br from-blue-500 to-blue-600",
            textColor: "text-white",
            description: `IPB: ${safeGet(totalRoutePerDay, 'all_time.total_ipb', 0)} | Fleet: ${safeGet(totalRoutePerDay, 'all_time.total_fleet', 0)}`
        },
        {
            title: "Total Reroute All Time",
            value: safeGet(totalReroute, 'all_time.total_all_reroute', 0),
            icon: CheckCircleIcon,
            bgColor: "bg-gradient-to-br from-green-500 to-green-600",
            textColor: "text-white",
            description: `IPB: ${safeGet(totalReroute, 'all_time.total_ipb', 0)} | Fleet: ${safeGet(totalReroute, 'all_time.total_fleet', 0)}`
        },
        {
            title: "Total Non-Reroute All Time",
            value: safeGet(totalNonReroute, 'all_time.total_all_non_reroute', 0),
            icon: ClockIcon,
            bgColor: "bg-gradient-to-br from-yellow-500 to-yellow-600",
            textColor: "text-white",
            description: `IPB: ${safeGet(totalNonReroute, 'all_time.total_ipb', 0)} | Fleet: ${safeGet(totalNonReroute, 'all_time.total_fleet', 0)}`
        },
    ];

    // Additional stats cards - DIPERBAIKI untuk format desimal
    const statsCards = [
        {
            title: "Total Perjalanan",
            value: formatNumber(totalPerjalanan.total_all_perjalanan || 0),
            icon: GlobeAsiaAustraliaIcon,
            bgColor: "bg-gradient-to-br from-indigo-500 to-indigo-600",
            textColor: "text-white",
            description: "Total semua perjalanan"
        },
        {
            title: "Completed This Month",
            value: completedRoutesMonth.total_completed_routes || 0,
            icon: CalendarIcon,
            bgColor: "bg-gradient-to-br from-emerald-500 to-emerald-600",
            textColor: "text-white",
            description: `Month: ${completedRoutesMonth.month || 'Current'}`
        },
        {
            title: "Total Extra Fuel Consumption",
            value: `${formatNumber(fuelLostTotal.total_fuel_lost || 0, 2)} L`,
            icon: FunnelIcon,
            bgColor: "bg-gradient-to-br from-red-500 to-red-600",
            textColor: "text-white",
            description: "Total volume fuel hilang"
        },
        {
            title: "Avg Price/Liter",
            value: formatCurrencyDetailed(filteredFuelData.breakdown.average_price_per_liter || 0),
            icon: CurrencyDollarIcon,
            bgColor: "bg-gradient-to-br from-orange-500 to-orange-600",
            textColor: "text-white",
            description: "Harga rata-rata per liter"
        }
    ];

    // Today's route cards - menggunakan safeGet
    const todayRouteCards = [
        {
            title: "Reroute Today",
            value: safeGet(totalReroute, 'today.total_reroute_today', 0),
            icon: ArrowPathIcon,
            bgColor: "bg-gradient-to-br from-pink-500 to-pink-600",
            textColor: "text-white",
            description: `Date: ${safeGet(totalReroute, 'today.date', getTodayDate())}`
        },
        {
            title: "Non-Reroute Today",
            value: safeGet(totalNonReroute, 'today.total_non_reroute_today', 0),
            icon: CheckCircleIcon,
            bgColor: "bg-gradient-to-br from-rose-500 to-rose-600",
            textColor: "text-white",
            description: `IPB: ${safeGet(totalNonReroute, 'today.total_ipb', 0)} | Fleet: ${safeGet(totalNonReroute, 'today.total_fleet', 0)}`
        },
        {
            title: "Total Routes Today",
            value: safeGet(totalReroute, 'today.total_reroute_today', 0) + safeGet(totalNonReroute, 'today.total_non_reroute_today', 0),
            icon: UserGroupIcon,
            bgColor: "bg-gradient-to-br from-amber-500 to-amber-600",
            textColor: "text-white",
            description: `Reroute: ${safeGet(totalReroute, 'today.total_reroute_today', 0)} | Non-Reroute: ${safeGet(totalNonReroute, 'today.total_non_reroute_today', 0)}`
        },
    ];

    // IPB Statistics Cards dari data area-filter untuk dashboard
    const ipbStatsCards = [
        {
            title: "Total Routes",
            value: ipbSummaryData.total_route || 0,
            icon: BuildingOfficeIcon,
            bgColor: "bg-gradient-to-br from-blue-500 to-indigo-600",
            textColor: "text-white",
            description: `Fleet: ${ipbSummaryData.fleet || 0} | IPB: ${ipbSummaryData.ipb || 0}`
        },
        {
            title: "North Area",
            value: ipbSummaryData.north || 0,
            icon: MapIcon,
            bgColor: "bg-gradient-to-br from-emerald-500 to-teal-600",
            textColor: "text-white",
            description: "Northern region routes"
        },
        {
            title: "Central Area",
            value: ipbSummaryData.central || 0,
            icon: MapIcon,
            bgColor: "bg-gradient-to-br from-amber-500 to-orange-600",
            textColor: "text-white",
            description: "Central region routes"
        },
        {
            title: "South Area",
            value: ipbSummaryData.south || 0,
            icon: MapIcon,
            bgColor: "bg-gradient-to-br from-rose-500 to-pink-600",
            textColor: "text-white",
            description: "Southern region routes"
        },
    ];

    // Fuel Cost Statistics Cards sesuai struktur data baru - DITAMBAHKAN
    const fuelCostCards = [
        {
            title: "Total Extra Fuel Consumption",
            value: `${formatNumber(filteredFuelData.summary.total_fuel_lost_liters || 0, 2)} L`,
            description: "Total volume fuel yang hilang",
            icon: FunnelIcon,
            bgColor: "bg-gradient-to-br from-red-500 to-red-600",
            textColor: "text-white",
            detail: `Liter: ${formatNumber(filteredFuelData.summary.total_fuel_lost_liters || 0, 2)}`
        },
        {
            title: "Total Cost",
            value: formatCurrencyDetailed(filteredFuelData.summary.total_cost || 0),
            description: "Total biaya fuel yang hilang",
            icon: CurrencyDollarIcon,
            bgColor: "bg-gradient-to-br from-green-500 to-green-600",
            textColor: "text-white",
            detail: `Cost: ${formatCurrencyDetailed(filteredFuelData.summary.total_cost || 0)}`
        },
        {
            title: "Valid Records",
            value: filteredFuelData.summary.valid_records_processed || 0,
            description: "Data yang berhasil diproses",
            icon: ChartBarIcon,
            bgColor: "bg-gradient-to-br from-blue-500 to-blue-600",
            textColor: "text-white",
            detail: `Records: ${filteredFuelData.summary.valid_records_processed || 0}`
        },
        {
            title: "Total Records",
            value: filteredFuelData.total_records || 0,
            description: "Total data dalam sistem",
            icon: TableCellsIcon,
            bgColor: "bg-gradient-to-br from-purple-500 to-purple-600",
            textColor: "text-white",
            detail: `Total: ${filteredFuelData.total_records || 0}`
        }
    ];

    // Render Fuel Cost Monitoring Content - DITAMBAHKAN
    const renderFuelCostMonitoring = () => {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Fuel Cost Monitoring</h1>
                    <p className="text-gray-600 mt-2">Monitor fuel loss and associated costs</p>
                </div>

                {/* Filter Section */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <FunnelIcon className="h-5 w-5 text-blue-500 mr-2" />
                                Filter Parameters
                            </h3>
                            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded break-all">
                                Applied: {filteredFuelData.filter.type} / {filteredFuelData.filter.region} / {filteredFuelData.filter.start_date} - {filteredFuelData.filter.end_date}
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={resetFuelFilter}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center transition-colors"
                            >
                                <ArrowPathIcon className="h-4 w-4 mr-2" />
                                Reset
                            </button>
                            <button
                                onClick={fetchFuelCostData}
                                disabled={loadingFuel}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loadingFuel ? (
                                    <>
                                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                                        Apply Filter
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Filter Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Start Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <div className="flex items-center">
                                    <CalendarIcon className="h-4 w-4 mr-1 text-gray-500" />
                                    Start Date
                                </div>
                            </label>
                            <input
                                type="date"
                                value={fuelFilter.startDate}
                                onChange={(e) => setFuelFilter({ ...fuelFilter, startDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                max={fuelFilter.endDate}
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <div className="flex items-center">
                                    <CalendarIcon className="h-4 w-4 mr-1 text-gray-500" />
                                    End Date
                                </div>
                            </label>
                            <input
                                type="date"
                                value={fuelFilter.endDate}
                                onChange={(e) => setFuelFilter({ ...fuelFilter, endDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                min={fuelFilter.startDate}
                            />
                        </div>

                        {/* Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <div className="flex items-center">
                                    <GlobeAmericasIcon className="h-4 w-4 mr-1 text-gray-500" />
                                    Type
                                </div>
                            </label>
                            <select
                                value={fuelFilter.type}
                                onChange={(e) => {
                                    const newType = e.target.value;
                                    setFuelFilter({
                                        ...fuelFilter,
                                        type: newType,
                                        region: newType === 'IPB' ? 'all' : fuelFilter.region
                                    });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                                <option value="all">All Types</option>
                                <option value="IPB">IPB (north, central, south)</option>
                                <option value="Supply">Supply (fleet)</option>
                            </select>
                        </div>

                        {/* Region */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <div className="flex items-center">
                                    <MapIcon className="h-4 w-4 mr-1 text-gray-500" />
                                    Region
                                </div>
                            </label>
                            <select
                                value={fuelFilter.region}
                                onChange={(e) => setFuelFilter({ ...fuelFilter, region: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                                <option value="all">All Regions</option>
                                {fuelFilter.type === 'IPB' ? (
                                    <>
                                        <option value="north">North Area</option>
                                        <option value="central">Central Area</option>
                                        <option value="south">South Area</option>
                                    </>
                                ) : fuelFilter.type === 'Supply' ? (
                                    <option value="fleet">Fleet</option>
                                ) : (
                                    <>
                                        <option value="fleet">Fleet</option>
                                        <option value="central">Central Area</option>
                                        <option value="north">North Area</option>
                                        <option value="south">South Area</option>
                                    </>
                                )}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {fuelCostCards.map((card, index) => (
                        <div
                            key={index}
                            className={`${card.bgColor} ${card.textColor} rounded-xl p-6 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm opacity-90 font-medium">{card.title}</p>
                                    <h2 className="text-xl sm:text-2xl font-bold mt-2 break-all">{card.value}</h2>
                                    <p className="text-xs opacity-80 mt-2">{card.description}</p>
                                </div>
                                <div className="p-3 bg-white bg-opacity-20 rounded-xl ml-2">
                                    <card.icon className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* By Type Breakdown */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <GlobeAmericasIcon className="h-5 w-5 text-blue-500 mr-2" />
                            Breakdown by Type
                        </h3>
                        <div className="space-y-4">
                            {['IPB', 'Supply'].map((type) => {
                                const data = filteredFuelData.summary_by_type[type] || { count: 0, fuel_lost: 0, cost: 0 };
                                const percentage = filteredFuelData.summary.total_fuel_lost_liters > 0
                                    ? (data.fuel_lost / filteredFuelData.summary.total_fuel_lost_liters * 100).toFixed(1)
                                    : 0;

                                return (
                                    <div key={type} className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-medium text-gray-700">{type}</span>
                                            <span className="text-sm text-gray-500">{percentage}%</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Count:</span>
                                                <span className="font-medium">{data.count}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Fuel Lost:</span>
                                                <span className="font-medium">{formatNumber(data.fuel_lost, 2)} L</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Cost:</span>
                                                <span className="font-medium">{formatCurrencyDetailed(data.cost)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* By Region Breakdown */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <MapIcon className="h-5 w-5 text-green-500 mr-2" />
                            Breakdown by Region
                        </h3>
                        <div className="space-y-4">
                            {['fleet', 'central', 'north', 'south'].map((region) => {
                                const data = filteredFuelData.summary_by_region[region] || { count: 0, fuel_lost: 0, cost: 0 };
                                const percentage = filteredFuelData.summary.total_fuel_lost_liters > 0
                                    ? (data.fuel_lost / filteredFuelData.summary.total_fuel_lost_liters * 100).toFixed(1)
                                    : 0;
                                const regionName = region.charAt(0).toUpperCase() + region.slice(1);

                                return (
                                    <div key={region} className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-medium text-gray-700">{regionName}</span>
                                            <span className="text-sm text-gray-500">{percentage}%</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Count:</span>
                                                <span className="font-medium">{data.count}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Fuel Lost:</span>
                                                <span className="font-medium">{formatNumber(data.fuel_lost, 2)} L</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Cost:</span>
                                                <span className="font-medium">{formatCurrencyDetailed(data.cost)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Price Information */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <InformationCircleIcon className="h-5 w-5 text-purple-500 mr-2" />
                            Price Information
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-blue-700">Average Price per Liter</span>
                                    <span className="text-lg font-bold text-blue-700">
                                        {formatCurrencyDetailed(filteredFuelData.breakdown.average_price_per_liter || 0)}
                                    </span>
                                </div>
                                <p className="text-xs text-blue-600 mt-2">
                                    Based on {filteredFuelData.breakdown.records_with_fuel_price || 0} records with actual prices
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Render dashboard content
    const renderDashboardContent = () => {
        if (loading) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600 text-lg">Memuat data dashboard...</p>
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg max-w-md">
                            <p className="font-semibold">Error</p>
                            <p className="mt-2">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <>
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                    <p className="text-gray-600 mt-2">Data Route Management System - Supervisor View</p>
                </div>

                {/* Main Cards Section */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                    {cardData.map((card, index) => (
                        <div
                            key={index}
                            className={`${card.bgColor} ${card.textColor} rounded-xl p-6 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm opacity-90 font-medium">{card.title}</p>
                                    <h2 className="text-2xl font-bold mt-2">{formatNumber(card.value)}</h2>
                                    {card.description && (
                                        <p className="text-xs opacity-80 mt-2 bg-white bg-opacity-20 px-2 py-1 rounded">
                                            {card.description}
                                        </p>
                                    )}
                                </div>
                                <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                                    <card.icon className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Additional Stats Cards - DIPERBAIKI */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    {statsCards.map((card, index) => (
                        <div
                            key={index}
                            className={`${card.bgColor} ${card.textColor} rounded-xl p-6 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm opacity-90 font-medium">{card.title}</p>
                                    <h2 className="text-2xl font-bold mt-2 truncate">{card.value}</h2>
                                    {card.description && (
                                        <p className="text-xs opacity-80 mt-2 truncate">{card.description}</p>
                                    )}
                                </div>
                                <div className="p-3 bg-white bg-opacity-20 rounded-xl ml-4 flex-shrink-0">
                                    <card.icon className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* COST FUEL LOST CARD TERSENDIRI */}
                <CostFuelLostCard />

                {/* Today's Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                    {todayRouteCards.map((card, index) => (
                        <div
                            key={index}
                            className={`${card.bgColor} ${card.textColor} rounded-xl p-6 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm opacity-90 font-medium">{card.title}</p>
                                    <h2 className="text-2xl font-bold mt-2">{formatNumber(card.value)}</h2>
                                    {card.description && (
                                        <p className="text-xs opacity-80 mt-2 bg-white bg-opacity-20 px-2 py-1 rounded">
                                            {card.description}
                                        </p>
                                    )}
                                </div>
                                <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                                    <card.icon className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* IPB Statistics Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    {ipbStatsCards.map((card, index) => (
                        <div
                            key={index}
                            className={`${card.bgColor} ${card.textColor} rounded-xl p-6 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm opacity-90 font-medium">{card.title}</p>
                                    <h2 className="text-2xl font-bold mt-2">{formatNumber(card.value)}</h2>
                                    {card.description && (
                                        <p className="text-xs opacity-80 mt-2 bg-white bg-opacity-20 px-2 py-1 rounded">
                                            {card.description}
                                        </p>
                                    )}
                                </div>
                                <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                                    <card.icon className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts Grid */}
                <div className="space-y-8">
                    {/* Baris 1: Category Chart dan Voyage Chart */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Category Bar Chart */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 xl:col-span-2">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                                    <ChartBarIcon className="h-6 w-6 text-blue-500 mr-3" />
                                    Requests per Category
                                </h3>
                                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                    {categoryChart.length} Categories
                                </span>
                            </div>
                            <div className="h-80">
                                {categoryChart.length > 0 ? (
                                    <Bar data={categoryData} options={barOptions} />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-500">
                                        <ChartBarIcon className="h-12 w-12 text-gray-300 mb-2" />
                                        <p className="text-sm">No category data available</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Voyage Doughnut Chart */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                                    <GlobeAsiaAustraliaIcon className="h-6 w-6 text-indigo-500 mr-3" />
                                    Voyages by Ship Type
                                </h3>
                                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                    {voyageChart.length} Types
                                </span>
                            </div>
                            <div className="h-80">
                                {voyageChart.length > 0 ? (
                                    <Doughnut data={voyageData} options={doughnutOptions} />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-500">
                                        <GlobeAsiaAustraliaIcon className="h-12 w-12 text-gray-300 mb-2" />
                                        <p className="text-sm">No voyage data available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Baris 2: Status Chart dan Fuel Loss Summary */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Status Pie Chart */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                                    <ChartPieIcon className="h-6 w-6 text-purple-500 mr-3" />
                                    Requests per Status
                                </h3>
                                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                    {statusChart.length} Status
                                </span>
                            </div>
                            <div className="h-80">
                                {statusChart.length > 0 ? (
                                    <Pie data={pieData} options={pieOptions} />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-500">
                                        <ChartPieIcon className="h-12 w-12 text-gray-300 mb-2" />
                                        <p className="text-sm">No status data available</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Fuel Loss Summary */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 xl:col-span-2">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                                    <FunnelIcon className="h-6 w-6 text-red-500 mr-3" />
                                    Fuel Loss Summary
                                </h3>
                                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                    {fuelLossSummary.length} Captains
                                </span>
                            </div>
                            <div className="h-80">
                                {fuelLossSummary.length > 0 ? (
                                    <Bar data={fuelLossData} options={lineBarOptions} />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-500">
                                        <FunnelIcon className="h-12 w-12 text-gray-300 mb-2" />
                                        <p className="text-sm">No fuel loss data available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Tab Navigation */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex overflow-x-auto scrollbar-hide -mb-px">
                        {[
                            { key: "dashboard", label: "Dashboard", icon: ChartBarIcon },
                            { key: "monitoring", label: "Perjalanan", icon: MapIcon },
                            { key: "ipb-monitoring", label: "Filter Route", icon: BuildingOfficeIcon },
                            { key: "fuel-cost", label: "Fuel Cost", icon: FireIcon },
                            { key: "fuel-lost-report", label: "Laporan", icon: InformationCircleIcon },
                        ].map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`flex items-center whitespace-nowrap px-3 py-3 sm:px-4 text-xs sm:text-sm font-medium border-b-2 transition-colors flex-shrink-0 ${
                                    activeTab === key
                                        ? "border-blue-600 text-blue-600 bg-blue-50"
                                        : "border-transparent text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                                }`}
                            >
                                <Icon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab Content - DIPERBAIKI untuk menambahkan Fuel Cost Monitoring */}
            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                {activeTab === "dashboard" && renderDashboardContent()}
                {activeTab === "monitoring" && <RouteMonitoring />}
                {activeTab === "ipb-monitoring" && <FilterMonitoring />}
                {activeTab === "fuel-cost" && renderFuelCostMonitoring()}
                {activeTab === "fuel-lost-report" && <FuelLostReport />}
            </div>
        </div>
    );
};

export default SpvChart;