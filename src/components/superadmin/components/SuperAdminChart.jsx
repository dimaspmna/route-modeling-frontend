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
    DocumentTextIcon,
    UsersIcon,
    MagnifyingGlassIcon,
    BuildingOfficeIcon,
    ShieldCheckIcon,
    TableCellsIcon,
    TruckIcon,
    FireIcon,
    CurrencyDollarIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    GlobeAmericasIcon
} from "@heroicons/react/24/outline";
import { Bar, Pie, Doughnut, Line } from "react-chartjs-2";
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
    Title,
} from "chart.js";
import FuelLostReport from "./FuelLostReport";
import RouteMonitoring from "./RouteMonitoring";
import FilterMonitoring from "./FilterMonitoring";

ChartJS.register(
    ArcElement,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    Title
);

const SuperAdminChart = () => {
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

    // State untuk data route baru dengan default values
    const [totalReroute, setTotalReroute] = useState({
        today: {
            date: new Date().toISOString().split('T')[0],
            timezone: "Asia/Jakarta (WIB)",
            total_ipb: 0,
            total_fleet: 0,
            total_reroute_today: 0
        },
        all_time: {
            total_ipb: 0,
            total_fleet: 0,
            total_all_reroute: 0
        }
    });

    const [totalNonReroute, setTotalNonReroute] = useState({
        today: {
            date: new Date().toISOString().split('T')[0],
            timezone: "Asia/Jakarta (WIB)",
            total_ipb: 0,
            total_fleet: 0,
            total_non_reroute_today: 0
        },
        all_time: {
            total_ipb: 0,
            total_fleet: 0,
            total_all_non_reroute: 0
        }
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

    // State untuk filter fuel cost sesuai dengan struktur data yang diberikan
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

    // Format angka dengan pemisah ribuan dan desimal - DIPERBAIKI untuk menghilangkan .00
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

    // Format Rupiah dengan desimal - DIPERBAIKI untuk menghilangkan .00
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

        // Cek apakah ada desimal
        const hasDecimal = numAmount % 1 !== 0;
        const actualDecimals = hasDecimal ? decimals : 0;
        
        const formatter = new Intl.NumberFormat('id-ID', {
            style: showSymbol ? 'currency' : 'decimal',
            currency: 'IDR',
            minimumFractionDigits: actualDecimals,
            maximumFractionDigits: actualDecimals
        });
        return showSymbol ? formatter.format(numAmount) : formatter.format(numAmount).replace(/\./g, ',');
    };

    // Format untuk display di cards (lebih pendek)
    const formatCurrencyShort = (amount) => {
        if (amount === undefined || amount === null || isNaN(amount) || amount === 0) return 'Rp 0';
        
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const hasDecimal = numAmount % 1 !== 0;
        
        const formatter = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: hasDecimal ? 0 : 0,
            maximumFractionDigits: hasDecimal ? 2 : 0
        });
        
        return formatter.format(numAmount);
    };

    // Format untuk nominal panjang - menampilkan semua digit dengan desimal - DIPERBAIKI
    const formatCurrencyLong = (amount, showDecimals = false) => {
        if (amount === undefined || amount === null || isNaN(amount) || amount === 0) return 'Rp 0';
        
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        
        const hasDecimal = numAmount % 1 !== 0;
        const actualDecimals = hasDecimal || showDecimals ? 2 : 0;
        
        const formatter = new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: actualDecimals,
            maximumFractionDigits: actualDecimals
        });
        
        return `Rp ${formatter.format(numAmount)}`;
    };

    // Format untuk tampilan detail dengan koma desimal - DIPERBAIKI
    const formatCurrencyDetailed = (amount, alwaysShowDecimals = false) => {
        if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
        
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        
        // Cek apakah ada nilai desimal
        const hasDecimal = numAmount % 1 !== 0;
        const actualDecimals = hasDecimal || alwaysShowDecimals ? 2 : 0;
        
        const formatter = new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: actualDecimals,
            maximumFractionDigits: actualDecimals
        });
        
        return `Rp ${formatter.format(numAmount)}`;
    };

    // Fetch dashboard data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch semua data dengan error handling untuk setiap endpoint
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
                    { key: 'areaFilterRes', promise: API.get("/route/area-filter") }
                ];

                // Gunakan Promise.allSettled untuk menangani error individual
                const results = await Promise.allSettled(requests.map(req => req.promise));

                // Process results
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

                // Update fuel lost total dengan data yang benar
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
                        total_fuel_lost: parseFloat(processedResults.fuelLostTotalRes?.data?.total_fuel_lost) || 0,
                        total_cost: parseFloat(processedResults.fuelCostLostRes?.data?.summary?.total_cost) || 0
                    });
                }

                setCompletedRoutesMonth(processedResults.completedRoutesMonthRes?.data || { total_completed_routes: 0, month: '' });
                setCategoryChart(processedResults.categoryRes?.data?.data || []);
                setStatusChart(processedResults.statusRes?.data?.data || []);
                setVoyageChart(processedResults.voyageRes?.data?.data || []);
                setFuelLossSummary(processedResults.fuelLossSummaryRes?.data?.data || []);

                // Set data reroute dengan safe access
                const rerouteData = processedResults.totalRerouteRes?.data?.data || {};
                setTotalReroute({
                    today: {
                        date: rerouteData.today?.date || new Date().toISOString().split('T')[0],
                        timezone: rerouteData.today?.timezone || "Asia/Jakarta (WIB)",
                        total_ipb: rerouteData.today?.total_ipb || 0,
                        total_fleet: rerouteData.today?.total_fleet || 0,
                        total_reroute_today: rerouteData.today?.total_reroute_today || 0
                    },
                    all_time: {
                        total_ipb: rerouteData.all_time?.total_ipb || 0,
                        total_fleet: rerouteData.all_time?.total_fleet || 0,
                        total_all_reroute: rerouteData.all_time?.total_all_reroute || 0
                    }
                });

                // Set data non-reroute dengan safe access
                const nonRerouteData = processedResults.totalNonRerouteRes?.data?.data || {};
                setTotalNonReroute({
                    today: {
                        date: nonRerouteData.today?.date || new Date().toISOString().split('T')[0],
                        timezone: nonRerouteData.today?.timezone || "Asia/Jakarta (WIB)",
                        total_ipb: nonRerouteData.today?.total_ipb || 0,
                        total_fleet: nonRerouteData.today?.total_fleet || 0,
                        total_non_reroute_today: nonRerouteData.today?.total_non_reroute_today || 0
                    },
                    all_time: {
                        total_ipb: nonRerouteData.all_time?.total_ipb || 0,
                        total_fleet: nonRerouteData.all_time?.total_fleet || 0,
                        total_all_non_reroute: nonRerouteData.all_time?.total_all_non_reroute || 0
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

    // Fetch filtered fuel cost data dengan struktur yang benar
    const fetchFuelCostData = async () => {
        try {
            setLoadingFuel(true);
            const params = {
                ...(fuelFilter.startDate && fuelFilter.startDate !== new Date().toISOString().split('T')[0] && { start_date: fuelFilter.startDate }),
                ...(fuelFilter.endDate && fuelFilter.endDate !== new Date().toISOString().split('T')[0] && { end_date: fuelFilter.endDate }),
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

    // Reset fuel filter
    const resetFuelFilter = () => {
        const today = new Date().toISOString().split('T')[0];
        setFuelFilter({
            startDate: today,
            endDate: today,
            region: 'all',
            type: 'all'
        });
    };

    // Helper function untuk safe access
    const safeGet = (obj, path, defaultValue = 0) => {
        return path.split('.').reduce((acc, key) => {
            return acc && acc[key] !== undefined ? acc[key] : defaultValue;
        }, obj);
    };

    // Gunakan safeGet untuk mengakses data
    const rerouteToday = safeGet(totalReroute, 'today.total_reroute_today', 0);
    const rerouteTodayDate = safeGet(totalReroute, 'today.date', new Date().toISOString().split('T')[0]);
    const rerouteAllTime = safeGet(totalReroute, 'all_time.total_all_reroute', 0);
    const rerouteAllTimeIPB = safeGet(totalReroute, 'all_time.total_ipb', 0);
    const rerouteAllTimeFleet = safeGet(totalReroute, 'all_time.total_fleet', 0);

    const nonRerouteToday = safeGet(totalNonReroute, 'today.total_non_reroute_today', 0);
    const nonRerouteTodayIPB = safeGet(totalNonReroute, 'today.total_ipb', 0);
    const nonRerouteTodayFleet = safeGet(totalNonReroute, 'today.total_fleet', 0);
    const nonRerouteAllTime = safeGet(totalNonReroute, 'all_time.total_all_non_reroute', 0);
    const nonRerouteAllTimeIPB = safeGet(totalNonReroute, 'all_time.total_ipb', 0);
    const nonRerouteAllTimeFleet = safeGet(totalNonReroute, 'all_time.total_fleet', 0);

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
        labels: fuelLossSummary.map((f) => f.name || 'Unknown'),
        datasets: [
            {
                label: "Total Fuel Loss (L)",
                data: fuelLossSummary.map((f) => f.total_fuel_loss || 0),
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderColor: 'rgba(239, 68, 68, 1)',
                borderWidth: 2,
                borderRadius: 8,
            },
            {
                label: "Reroute Count",
                data: fuelLossSummary.map((f) => f.reroute_count || 0),
                backgroundColor: 'rgba(245, 158, 11, 0.8)',
                borderColor: 'rgba(245, 158, 11, 1)',
                borderWidth: 2,
                borderRadius: 8,
                type: 'line',
                tension: 0.4,
            }
        ],
    };

    // Data untuk Fuel Cost Chart berdasarkan struktur data baru
    const prepareFuelCostChartData = () => {
        const { summary_by_type, summary_by_region } = filteredFuelData;

        const labels = ['IPB', 'Supply', 'Fleet', 'Central', 'North', 'South'];

        const fuelLostData = [
            summary_by_type.IPB?.fuel_lost || 0,
            summary_by_type.Supply?.fuel_lost || 0,
            summary_by_region.fleet?.fuel_lost || 0,
            summary_by_region.central?.fuel_lost || 0,
            summary_by_region.north?.fuel_lost || 0,
            summary_by_region.south?.fuel_lost || 0
        ];

        const costData = [
            summary_by_type.IPB?.cost || 0,
            summary_by_type.Supply?.cost || 0,
            summary_by_region.fleet?.cost || 0,
            summary_by_region.central?.cost || 0,
            summary_by_region.north?.cost || 0,
            summary_by_region.south?.cost || 0
        ];

        return {
            labels,
            datasets: [
                {
                    label: 'Extra Fuel Consumption (Liters)',
                    data: fuelLostData,
                    backgroundColor: 'rgba(239, 68, 68, 0.7)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 1,
                    yAxisID: 'y',
                },
                {
                    label: 'Cost (Rp)',
                    data: costData,
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1,
                    yAxisID: 'y1',
                }
            ]
        };
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

    const dualAxisOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Fuel Loss & Cost Distribution'
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Extra Fuel Consumption (Liters)'
                },
                beginAtZero: true
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Cost (Rp)'
                },
                beginAtZero: true,
                grid: {
                    drawOnChartArea: false,
                },
            }
        }
    };

    // Card data sesuai dengan yang Anda inginkan
    const cardData = [
        {
            title: "Total Requests",
            value: cards.totalRequests || 0,
            icon: ArrowPathIcon,
            bgColor: "bg-gradient-to-br from-blue-500 to-blue-600",
            textColor: "text-white"
        },
        {
            title: "Completed Requests",
            value: cards.completedRequests || 0,
            icon: CheckCircleIcon,
            bgColor: "bg-gradient-to-br from-green-500 to-green-600",
            textColor: "text-white"
        },
        {
            title: "Pending Requests",
            value: cards.pendingRequests || 0,
            icon: ClockIcon,
            bgColor: "bg-gradient-to-br from-yellow-500 to-yellow-600",
            textColor: "text-white"
        },
        {
            title: "Total Users",
            value: cards.totalUsers || 0,
            icon: UserGroupIcon,
            bgColor: "bg-gradient-to-br from-purple-500 to-purple-600",
            textColor: "text-white"
        }
    ];

    // Additional stats cards - tanpa Cost Fuel Lost - DIPERBAIKI untuk format tanpa .00
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
    ];

    // COMPONENT TERSENDIRI UNTUK COST FUEL LOST - DIPERBAIKI untuk format tanpa .00
    const CostFuelLostCard = () => (
        <div className="mt-8 mb-8">
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
                                <p className="text-sm font-semibold">{formatCurrencyDetailed(filteredFuelData.breakdown.average_price_per_liter || 0, true)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Route statistics cards - menggunakan safeGet dan ganti icon Truck dengan GlobeAmericas
    const routeCards = [
        {
            title: "Total Reroute All Time",
            value: rerouteAllTime,
            icon: ArrowPathIcon,
            bgColor: "bg-gradient-to-br from-teal-500 to-teal-600",
            textColor: "text-white",
            description: `IPB: ${rerouteAllTimeIPB} | Fleet: ${rerouteAllTimeFleet}`
        },
        {
            title: "Total Non-Reroute All Time",
            value: nonRerouteAllTime,
            icon: CheckCircleIcon,
            bgColor: "bg-gradient-to-br from-cyan-500 to-cyan-600",
            textColor: "text-white",
            description: `IPB: ${nonRerouteAllTimeIPB} | Fleet: ${nonRerouteAllTimeFleet}`
        },
        {
            title: "Total Routes All Time",
            value: rerouteAllTime + nonRerouteAllTime,
            icon: GlobeAmericasIcon,
            bgColor: "bg-gradient-to-br from-purple-500 to-purple-600",
            textColor: "text-white",
            description: `Reroute: ${rerouteAllTime} | Non-Reroute: ${nonRerouteAllTime}`
        },
    ];

    // Today's route cards - menggunakan safeGet
    const todayRouteCards = [
        {
            title: "Reroute Today",
            value: rerouteToday,
            icon: ArrowPathIcon,
            bgColor: "bg-gradient-to-br from-pink-500 to-pink-600",
            textColor: "text-white",
            description: `Date: ${rerouteTodayDate}`
        },
        {
            title: "Non-Reroute Today",
            value: nonRerouteToday,
            icon: CheckCircleIcon,
            bgColor: "bg-gradient-to-br from-rose-500 to-rose-600",
            textColor: "text-white",
            description: `IPB: ${nonRerouteTodayIPB} | Fleet: ${nonRerouteTodayFleet}`
        },
        {
            title: "Total Routes Today",
            value: rerouteToday + nonRerouteToday,
            icon: UserGroupIcon,
            bgColor: "bg-gradient-to-br from-amber-500 to-amber-600",
            textColor: "text-white",
            description: `Reroute: ${rerouteToday} | Non-Reroute: ${nonRerouteToday}`
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

    // Fuel Cost Statistics Cards sesuai struktur data baru - DIPERBAIKI untuk format tanpa .00
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
            title: "Avg Price/Liter",
            value: formatCurrencyDetailed(filteredFuelData.breakdown.average_price_per_liter || 0, true),
            description: "Harga rata-rata per liter",
            icon: InformationCircleIcon,
            bgColor: "bg-gradient-to-br from-purple-500 to-purple-600",
            textColor: "text-white",
            detail: `Price: ${formatCurrencyDetailed(filteredFuelData.breakdown.average_price_per_liter || 0, true)}`
        }
    ];

    // Render Fuel Cost Monitoring Content - DIPERBAIKI
    const renderFuelCostMonitoring = () => {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Fuel Cost Re-Route Monitoring</h1>
                    <p className="text-gray-600 mt-2">Monitor fuel loss and associated costs with detailed breakdown</p>
                </div>

                {/* Filter Section dengan kondisional untuk IPB */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center space-x-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <FunnelIcon className="h-5 w-5 text-blue-500 mr-2" />
                                Filter Parameters
                            </h3>
                            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded">
                                Applied: {filteredFuelData.filter.type} / {filteredFuelData.filter.region} / {filteredFuelData.filter.start_date} to {filteredFuelData.filter.end_date}
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
                                        // Reset region ke 'all' ketika type berubah
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

                        {/* Region dengan opsi yang berbeda berdasarkan type */}
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

                                {/* Jika type adalah IPB, tampilkan opsi north, central, south */}
                                {fuelFilter.type === 'IPB' ? (
                                    <>
                                        <option value="north">North Area</option>
                                        <option value="central">Central Area</option>
                                        <option value="south">South Area</option>
                                    </>
                                ) : fuelFilter.type === 'Supply' ? (
                                    // Jika type adalah Supply, tampilkan fleet
                                    <option value="fleet">Fleet</option>
                                ) : (
                                    // Jika all, tampilkan semua opsi
                                    <>
                                        <option value="fleet">Fleet</option>
                                        <option value="central">Central Area</option>
                                        <option value="north">North Area</option>
                                        <option value="south">South Area</option>
                                    </>
                                )}
                            </select>
                            {fuelFilter.type === 'IPB' && (
                                <p className="text-xs text-gray-500 mt-1">
                                    IPB covers north, central, and south areas
                                </p>
                            )}
                            {fuelFilter.type === 'Supply' && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Supply covers fleet operations
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Error Message */}
                    {!filteredFuelData.success && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center">
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                                <span className="text-red-700">Failed to load fuel cost data. Please try again.</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Statistics Cards - DIPERBAIKI dengan format desimal */}
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
                                    {card.detail && (
                                        <p className="text-xs opacity-90 mt-1 font-medium">{card.detail}</p>
                                    )}
                                </div>
                                <div className="p-3 bg-white bg-opacity-20 rounded-xl ml-2">
                                    <card.icon className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Breakdown Section */}
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
                                                <span>Extra Fuel Consumption:</span>
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
                                                <span>Extra Fuel Consumption:</span>
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

                    {/* Price Information - DIPERBAIKI */}
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
                                        {formatCurrencyDetailed(filteredFuelData.breakdown.average_price_per_liter || 0, true)}
                                    </span>
                                </div>
                                <p className="text-xs text-blue-600 mt-2">
                                    Based on {filteredFuelData.breakdown.records_with_fuel_price || 0} records with actual prices
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Table - DIPERBAIKI dengan format desimal */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <TableCellsIcon className="h-5 w-5 text-blue-500 mr-2" />
                                    Fuel Cost Summary
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Period: {filteredFuelData.filter.start_date} to {filteredFuelData.filter.end_date}
                                </p>
                            </div>
                            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded">
                                Type: {filteredFuelData.filter.type} | Region: {filteredFuelData.filter.region}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type/Region
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Count
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Extra Fuel Consumption (L)
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Cost (Rp)
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Percentage
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {/* By Type Summary */}
                                <tr className="bg-blue-50">
                                    <td colSpan="6" className="px-6 py-3">
                                        <span className="font-semibold text-blue-700">BY TYPE</span>
                                    </td>
                                </tr>
                                {['IPB', 'Supply'].map((type) => {
                                    const data = filteredFuelData.summary_by_type[type] || { count: 0, fuel_lost: 0, cost: 0 };
                                    const percentage = filteredFuelData.summary.total_fuel_lost_liters > 0
                                        ? (data.fuel_lost / filteredFuelData.summary.total_fuel_lost_liters * 100).toFixed(1)
                                        : 0;

                                    return (
                                        <tr key={type} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                Type
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${type === 'IPB' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {data.count}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatNumber(data.fuel_lost, 2)} L
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                {formatCurrencyDetailed(data.cost)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="flex items-center">
                                                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                                        <div
                                                            className="h-2 rounded-full bg-blue-500"
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                    <span>{percentage}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {/* By Region Summary */}
                                <tr className="bg-green-50">
                                    <td colSpan="6" className="px-6 py-3">
                                        <span className="font-semibold text-green-700">BY REGION</span>
                                    </td>
                                </tr>
                                {['fleet', 'central', 'north', 'south'].map((region) => {
                                    const data = filteredFuelData.summary_by_region[region] || { count: 0, fuel_lost: 0, cost: 0 };
                                    const percentage = filteredFuelData.summary.total_fuel_lost_liters > 0
                                        ? (data.fuel_lost / filteredFuelData.summary.total_fuel_lost_liters * 100).toFixed(1)
                                        : 0;
                                    const regionName = region.charAt(0).toUpperCase() + region.slice(1);

                                    return (
                                        <tr key={region} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                Region
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${region === 'fleet' ? 'bg-purple-100 text-purple-800' :
                                                    region === 'central' ? 'bg-yellow-100 text-yellow-800' :
                                                        region === 'north' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-red-100 text-red-800'
                                                    }`}>
                                                    {regionName}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {data.count}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatNumber(data.fuel_lost, 2)} L
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                {formatCurrencyDetailed(data.cost)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="flex items-center">
                                                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                                        <div
                                                            className="h-2 rounded-full bg-green-500"
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                    <span>{percentage}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {/* Total Summary */}
                                <tr className="bg-gray-100 font-semibold">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" colSpan="2">
                                        TOTAL
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {filteredFuelData.summary.valid_records_processed || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatNumber(filteredFuelData.summary.total_fuel_lost_liters || 0, 2)} L
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatCurrencyDetailed(filteredFuelData.summary.total_cost || 0)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        100%
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Information */}
                    <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                        <div className="flex flex-wrap items-center justify-between">
                            <div className="text-sm text-gray-600">
                                <span className="font-medium">Data Updated:</span> {new Date().toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">
                                <span className="font-medium">Total Records:</span> {filteredFuelData.total_records || 0} | 
                                <span className="font-medium ml-2">Valid Records:</span> {filteredFuelData.summary.valid_records_processed || 0}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Render dashboard content - VERSI DIKOREKSI dengan display yang lebih baik
    const renderDashboardContent = () => {
        if (loading) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600 text-lg">Loading dashboard data...</p>
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
                    <p className="text-gray-600 mt-2">Data Route Management System</p>
                </div>

                {/* Main Cards Section */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    {cardData.map((card, index) => (
                        <div
                            key={index}
                            className={`${card.bgColor} ${card.textColor} rounded-xl p-6 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm opacity-90 font-medium">{card.title}</p>
                                    {/* Gunakan formatNumber untuk menghilangkan .00 */}
                                    <h2 className="text-2xl font-bold mt-2">{formatNumber(card.value)}</h2>
                                </div>
                                <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                                    <card.icon className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Additional Stats Cards - TANPA Cost Fuel Lost - DIPERBAIKI untuk format tanpa .00 */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                    {statsCards.map((card, index) => (
                        <div
                            key={index}
                            className={`${card.bgColor} ${card.textColor} rounded-xl p-6 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm opacity-90 font-medium">{card.title}</p>
                                    <h2 className="text-2xl font-bold mt-2">{card.value}</h2>
                                    {card.description && (
                                        <p className="text-xs opacity-80 mt-2">{card.description}</p>
                                    )}
                                </div>
                                <div className="p-3 bg-white bg-opacity-20 rounded-xl ml-4 flex-shrink-0">
                                    <card.icon className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* COST FUEL LOST CARD TERSENDIRI - DIPERBAIKI */}
                <CostFuelLostCard />

                {/* Route Statistics Cards - All Time - DIPERBAIKI untuk format tanpa .00 */}
                <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Route Statistics - All Time</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {routeCards.map((card, index) => (
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
                </div>

                {/* Today's Route Cards - DIPERBAIKI untuk format tanpa .00 */}
                <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Today's Route Statistics</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                </div>

                {/* IPB Statistics Cards - DIPERBAIKI untuk format tanpa .00 */}
                <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Area Distribution Statistics</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                            { key: "fuel-report", label: "Laporan", icon: DocumentTextIcon },
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

            {/* Tab Content - DITAMBAH Fuel Report */}
            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                {activeTab === "dashboard" && renderDashboardContent()}
                {activeTab === "monitoring" && <RouteMonitoring />}
                {activeTab === "ipb-monitoring" && <FilterMonitoring />}
                {activeTab === "fuel-cost" && renderFuelCostMonitoring()}
                {activeTab === "fuel-report" && <FuelLostReport />}
            </div>
        </div>
    );
};

export default SuperAdminChart;