import React, { useEffect, useState, useMemo } from "react";
import {
    MagnifyingGlassIcon,
    ArrowPathIcon,
    MapPinIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    FireIcon,
    GlobeAmericasIcon,
    DocumentTextIcon,
    EyeIcon,
    EyeSlashIcon,
    InformationCircleIcon,
    CalendarIcon,
    BuildingStorefrontIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    PlayIcon,
    PauseIcon,
    FunnelIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import {
    FireIcon as FireIconSolid,
    GlobeAmericasIcon as GlobeAmericasIconSolid,
    DocumentTextIcon as DocumentTextIconSolid,
    BuildingStorefrontIcon as BuildingStorefrontIconSolid,
} from "@heroicons/react/24/solid";
import API from "../../../api/Api";

const RouteMonitoring = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [expandedCards, setExpandedCards] = useState({});
    const [routeSliders, setRouteSliders] = useState({});
    
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [regionFilter, setRegionFilter] = useState("all");
    const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

    // Format date to YYYY-MM-DD
    const formatDateToYYYYMMDD = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    // Single fetch function
    const fetchData = async (filters = {}) => {
        try {
            setLoading(true);
            
            // Build query parameters
            const params = new URLSearchParams();
            
            // Apply filters from parameters or state
            const currentStartDate = filters.startDate || startDate;
            const currentEndDate = filters.endDate || endDate;
            const currentTypeFilter = filters.type || typeFilter;
            const currentRegionFilter = filters.region || regionFilter;

            // Add date filters if provided
            if (currentStartDate) {
                params.append('startDate', formatDateToYYYYMMDD(currentStartDate));
            }
            
            if (currentEndDate) {
                params.append('endDate', formatDateToYYYYMMDD(currentEndDate));
            }
            
            // Add type filter
            if (currentTypeFilter !== "all") {
                params.append('type', currentTypeFilter === "ipb" ? "IPB" : "Supply");
            }
            
            // Add region filter
            if (currentRegionFilter !== "all") {
                params.append('region', currentRegionFilter);
            }
            
            // Build URL
            const queryString = params.toString();
            const url = queryString ? `/laporan-monitoring?${queryString}` : '/laporan-monitoring';
            
            console.log("Fetching data from URL:", url);
            
            // Make API call
            const res = await API.get(url);
            
            // Validate response structure
            if (res.data && res.data.success !== undefined) {
                // If response has success field (like in your example)
                setData(res.data.data || []);
            } else if (Array.isArray(res.data)) {
                // If response is direct array
                setData(res.data);
            } else if (res.data.data) {
                // If response has data field
                setData(res.data.data);
            } else {
                setData([]);
            }
            
            setError(null);
            
        } catch (err) {
            setError("Gagal memuat data monitoring");
            console.error("Error fetching data:", err);
            console.error("Error details:", {
                message: err.message,
                status: err.response?.status,
                data: err.response?.data
            });
            
            // Set empty data on error
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch and fetch when filters change
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 300); // Debounce to prevent rapid calls
        
        return () => clearTimeout(timer);
    }, [startDate, endDate, typeFilter, regionFilter]);

    // Function to apply filters
    const applyFilters = () => {
        fetchData();
        setShowAdvancedFilter(false);
    };

    // Function to reset all filters
    const resetAllFilters = () => {
        setSearchTerm("");
        setActiveFilter("all");
        setStartDate("");
        setEndDate("");
        setTypeFilter("all");
        setRegionFilter("all");
        setExpandedCards({});
        setRouteSliders({});
        setShowAdvancedFilter(false);
        fetchData();
    };

    // Function to clear date filters only
    const clearDateFilters = () => {
        setStartDate("");
        setEndDate("");
    };

    // Function to set date range (e.g., last 7 days, last month)
    const setDateRange = (range) => {
        const today = new Date();
        const start = new Date();
        
        switch(range) {
            case 'today':
                setStartDate(today.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                break;
            case 'yesterday':
                start.setDate(today.getDate() - 1);
                setStartDate(start.toISOString().split('T')[0]);
                setEndDate(start.toISOString().split('T')[0]);
                break;
            case 'last7days':
                start.setDate(today.getDate() - 7);
                setStartDate(start.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                break;
            case 'last30days':
                start.setDate(today.getDate() - 30);
                setStartDate(start.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                break;
            case 'thismonth':
                start.setDate(1);
                setStartDate(start.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                break;
            default:
                break;
        }
    };

    // ===== HELPER FUNCTIONS =====
    const getProgressPercentage = (details) => {
        if (!details || details.length === 0) return 0;
        const completedCount = details.filter(d => d.status === 'completed').length;
        return Math.round((completedCount / details.length) * 100);
    };

    const isRouteInProgress = (details) => {
        if (!details || details.length === 0) return false;
        return details.some(d => d.status === 'pending' || d.status === 'in progress');
    };

    const isRouteCompleted = (details) => {
        if (!details || details.length === 0) return false;
        return details.every(d => d.status === 'completed');
    };

    const isRouteFleet = (route) => {
        const shipName = route.ship_name || '';
        return shipName.includes('USV ELOK JAYA') || shipName.includes('SV.GIAT JAYA');
    };

    const isRouteIpb = (route) => {
        const shipName = route.ship_name || '';
        return !isRouteFleet(route);
    };

    const getRouteType = (route) => {
        if (route.type) {
            return route.type.toLowerCase();
        }
        
        const shipName = route.ship_name || '';
        if (shipName.includes('IPB') || shipName.includes('SUPPLY')) {
            return shipName.includes('IPB') ? 'ipb' : 'supply';
        }
        
        return 'ipb';
    };

    const getRouteTypeDisplay = (route) => {
        const type = getRouteType(route);
        return type === 'ipb' ? 'IPB' : 'Supply';
    };

    const getRouteRegion = (route) => {
        if (route.region) {
            return route.region.toLowerCase();
        }
        
        const shipName = (route.ship_name || '').toLowerCase();
        const location = (route.details?.[0]?.location || '').toLowerCase();
        
        if (shipName.includes('north') || location.includes('north')) return 'north';
        if (shipName.includes('south') || location.includes('south')) return 'south';
        if (shipName.includes('central') || location.includes('central')) return 'central';
        
        return 'unknown';
    };

    const getRouteRegionDisplay = (route) => {
        const region = getRouteRegion(route);
        if (region === 'unknown') return 'Unknown';
        return region.charAt(0).toUpperCase() + region.slice(1);
    };

    // Filter routes
    const filteredRoutes = useMemo(() => {
        let routes = [...data];

        if (activeFilter !== "all") {
            routes = routes.filter(route => {
                switch (activeFilter) {
                    case "inProgress": return isRouteInProgress(route.details);
                    case "completed": return isRouteCompleted(route.details);
                    case "fleet": return isRouteFleet(route);
                    case "ipb": return isRouteIpb(route);
                    default: return true;
                }
            });
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            routes = routes.filter(route => 
                (route.ship_name && route.ship_name.toLowerCase().includes(term)) ||
                (route.id_rute_destinasi && route.id_rute_destinasi.toLowerCase().includes(term)) ||
                (route.details && route.details.some(detail => 
                    detail.location && detail.location.toLowerCase().includes(term)
                ))
            );
        }

        if (typeFilter !== "all") {
            routes = routes.filter(route => getRouteType(route) === typeFilter);
        }

        if (regionFilter !== "all") {
            routes = routes.filter(route => getRouteRegion(route) === regionFilter);
        }

        // Sorting by progress (highest first)
        return routes.sort((a, b) => {
            const aProgress = getProgressPercentage(a.details);
            const bProgress = getProgressPercentage(b.details);
            return bProgress - aProgress;
        });
    }, [data, searchTerm, activeFilter, typeFilter, regionFilter]);

    // ===== STYLING FUNCTIONS =====
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return { 
                    bg: 'bg-green-500', 
                    text: 'text-green-700', 
                    badge: 'bg-green-100 text-green-800',
                    bgLight: 'bg-green-50',
                    border: 'border-green-200'
                };
            case 'pending':
            case 'in progress':
                return { 
                    bg: 'bg-yellow-500', 
                    text: 'text-yellow-700', 
                    badge: 'bg-yellow-100 text-yellow-800',
                    bgLight: 'bg-yellow-50',
                    border: 'border-yellow-200'
                };
            default:
                return { 
                    bg: 'bg-gray-500', 
                    text: 'text-gray-700', 
                    badge: 'bg-gray-100 text-gray-800',
                    bgLight: 'bg-gray-50',
                    border: 'border-gray-200'
                };
        }
    };

    const toggleExpandCard = (routeId) => {
        setExpandedCards(prev => ({
            ...prev,
            [routeId]: !prev[routeId]
        }));
    };

    const nextRouteDetail = (routeId, totalDetails) => {
        setRouteSliders(prev => ({
            ...prev,
            [routeId]: (prev[routeId] || 0) === totalDetails - 1 ? 0 : (prev[routeId] || 0) + 1
        }));
    };

    const prevRouteDetail = (routeId, totalDetails) => {
        setRouteSliders(prev => ({
            ...prev,
            [routeId]: (prev[routeId] || 0) === 0 ? totalDetails - 1 : (prev[routeId] || 0) - 1
        }));
    };

    // ===== CONFIGURATIONS =====
    const filterConfig = [
        { id: "all", label: "Semua Perjalanan", icon: GlobeAmericasIcon, activeIcon: GlobeAmericasIconSolid },
        { id: "inProgress", label: "Dalam Perjalanan", icon: FireIcon, activeIcon: FireIconSolid },
        { id: "completed", label: "Selesai", icon: CheckCircleIcon, activeIcon: CheckCircleIcon },
        { id: "fleet", label: "Fleet", icon: GlobeAmericasIcon, activeIcon: GlobeAmericasIconSolid },
        { id: "ipb", label: "IPB", icon: DocumentTextIcon, activeIcon: DocumentTextIconSolid },
    ];

    const typeFilterConfig = [
        { id: "all", label: "Semua Tipe" },
        { id: "ipb", label: "IPB" },
        { id: "supply", label: "Supply" }
    ];

    const regionFilterConfig = [
        { id: "all", label: "Semua Region" },
        { id: "north", label: "North" },
        { id: "south", label: "South" },
        { id: "central", label: "Central" }
    ];

    const dateRangeConfig = [
        { id: "today", label: "Hari Ini" },
        { id: "yesterday", label: "Kemarin" },
        { id: "last7days", label: "7 Hari Terakhir" },
        { id: "last30days", label: "30 Hari Terakhir" },
        { id: "thismonth", label: "Bulan Ini" }
    ];

    const getFilterColorClasses = (filterId) => {
        switch (filterId) {
            case "inProgress": return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", light: "bg-red-100" };
            case "completed": return { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", light: "bg-green-100" };
            case "fleet": return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", light: "bg-blue-100" };
            case "ipb": return { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", light: "bg-purple-100" };
            default: return { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", light: "bg-gray-100" };
        }
    };

    const getTypeColorClasses = (typeId) => {
        switch (typeId) {
            case "ipb": return { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" };
            case "supply": return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" };
            default: return { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };
        }
    };

    const getRegionColorClasses = (regionId) => {
        switch (regionId) {
            case "north": return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" };
            case "south": return { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" };
            case "central": return { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" };
            default: return { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };
        }
    };

    const formatTime = (timeString) => {
        if (!timeString || timeString === 'N/A' || timeString === 'null') return '-';
        return timeString;
    };

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    // Calculate statistics
    const stats = useMemo(() => {
        const totalRoutes = filteredRoutes.length;
        const inProgressRoutes = filteredRoutes.filter(route => isRouteInProgress(route.details)).length;
        const completedRoutes = filteredRoutes.filter(route => isRouteCompleted(route.details)).length;
        const ipbRoutes = filteredRoutes.filter(route => getRouteType(route) === 'ipb').length;
        const supplyRoutes = filteredRoutes.filter(route => getRouteType(route) === 'supply').length;
        
        return {
            total: totalRoutes,
            inProgress: inProgressRoutes,
            completed: completedRoutes,
            ipb: ipbRoutes,
            supply: supplyRoutes
        };
    }, [filteredRoutes]);

    // ===== RENDER COMPONENTS =====
    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-700 font-medium">Memuat data monitoring...</p>
            </div>
        );
    }

    if (error && data.length === 0) {
        return (
            <div className="p-6">
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-6 text-center shadow-sm">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                        <XCircleIcon className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Gagal Memuat Data</h3>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={fetchData}
                            className="inline-flex items-center justify-center px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
                        >
                            <ArrowPathIcon className="h-5 w-5 mr-2" />
                            Coba Lagi
                        </button>
                        <button
                            onClick={resetAllFilters}
                            className="inline-flex items-center justify-center px-5 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
                        >
                            Reset Filter
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 shadow-sm border border-blue-100">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-white rounded-xl shadow-sm border border-blue-100">
                                <GlobeAmericasIcon className="h-7 w-7 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Monitoring Semua Perjalanan</h1>
                                <p className="text-gray-600 mt-1">Pantau perjalanan kapal secara real-time</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                                {formatDateForDisplay(startDate) || 'Semua Tanggal'} 
                                {startDate && endDate ? ` - ${formatDateForDisplay(endDate)}` : ''}
                            </span>
                            {typeFilter !== "all" && (
                                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                                    {typeFilterConfig.find(t => t.id === typeFilter)?.label}
                                </span>
                            )}
                            {regionFilter !== "all" && (
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                                    {regionFilterConfig.find(r => r.id === regionFilter)?.label}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={fetchData}
                            className="inline-flex items-center justify-center px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                        >
                            <ArrowPathIcon className="h-5 w-5 mr-2" />
                            Refresh Data
                        </button>
                        <div className="bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-sm text-gray-600">Total Perjalanan</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced Filter Button */}
            <div className="mb-6">
                <button
                    onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl hover:from-gray-900 hover:to-black transition-all shadow-md"
                >
                    <FunnelIcon className="h-5 w-5" />
                    {showAdvancedFilter ? "Sembunyikan Filter" : "Tampilkan Filter Lanjutan"}
                    {(startDate || endDate || typeFilter !== "all" || regionFilter !== "all") && (
                        <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                            Filter Aktif
                        </span>
                    )}
                </button>
            </div>

            {/* Advanced Filter Panel */}
            {showAdvancedFilter && (
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Filter Lanjutan</h3>
                        <button
                            onClick={() => setShowAdvancedFilter(false)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Date Range Quick Filters */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rentang Cepat
                            </label>
                            <div className="space-y-2">
                                {dateRangeConfig.map((range) => (
                                    <button
                                        key={range.id}
                                        onClick={() => setDateRange(range.id)}
                                        className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors"
                                    >
                                        {range.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Date Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rentang Tanggal Kustom
                            </label>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Dari Tanggal</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Sampai Tanggal</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <button
                                    onClick={clearDateFilters}
                                    className="w-full text-sm px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                >
                                    Hapus Filter Tanggal
                                </button>
                            </div>
                        </div>

                        {/* Type Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipe Perjalanan
                            </label>
                            <div className="flex flex-col gap-2">
                                {typeFilterConfig.map((type) => {
                                    const isActive = typeFilter === type.id;
                                    const colors = getTypeColorClasses(type.id);
                                    return (
                                        <button
                                            key={type.id}
                                            onClick={() => setTypeFilter(type.id)}
                                            className={`flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${
                                                isActive 
                                                    ? `${colors.bg} ${colors.border} ${colors.text} font-medium`
                                                    : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                                            }`}
                                        >
                                            <span>{type.label}</span>
                                            {isActive && (
                                                <div className={`w-2 h-2 rounded-full ${colors.bg.replace('50', '500')}`}></div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Region Filter */}
                        {(typeFilter === "ipb" || typeFilter === "all") && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Region IPB
                                </label>
                                <div className="flex flex-col gap-2">
                                    {regionFilterConfig.map((region) => {
                                        const isActive = regionFilter === region.id;
                                        const colors = getRegionColorClasses(region.id);
                                        return (
                                            <button
                                                key={region.id}
                                                onClick={() => setRegionFilter(region.id)}
                                                className={`flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${
                                                    isActive 
                                                        ? `${colors.bg} ${colors.border} ${colors.text} font-medium`
                                                        : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                                                }`}
                                            >
                                                <span>{region.label}</span>
                                                {isActive && (
                                                    <div className={`w-2 h-2 rounded-full ${colors.bg.replace('50', '500')}`}></div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col justify-end gap-3">
                            <button
                                onClick={applyFilters}
                                className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
                            >
                                <FunnelIcon className="h-5 w-5 mr-2" />
                                Terapkan Filter
                            </button>
                            <button
                                onClick={() => {
                                    setStartDate("");
                                    setEndDate("");
                                    setTypeFilter("all");
                                    setRegionFilter("all");
                                }}
                                className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-200 transition-all"
                            >
                                <ArrowPathIcon className="h-5 w-5 mr-2" />
                                Reset Filter Ini
                            </button>
                        </div>
                    </div>

                    {/* Active Filters Summary */}
                    {(startDate || endDate || typeFilter !== "all" || regionFilter !== "all") && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Filter Aktif:</h4>
                            <div className="flex flex-wrap gap-2">
                                {startDate && (
                                    <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                                        Dari: {formatDateForDisplay(startDate)}
                                        <button onClick={() => setStartDate("")} className="ml-2 text-blue-500 hover:text-blue-700">
                                            <XMarkIcon className="h-4 w-4" />
                                        </button>
                                    </span>
                                )}
                                {endDate && (
                                    <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                                        Sampai: {formatDateForDisplay(endDate)}
                                        <button onClick={() => setEndDate("")} className="ml-2 text-blue-500 hover:text-blue-700">
                                            <XMarkIcon className="h-4 w-4" />
                                        </button>
                                    </span>
                                )}
                                {typeFilter !== "all" && (
                                    <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                                        Tipe: {typeFilterConfig.find(t => t.id === typeFilter)?.label}
                                        <button onClick={() => setTypeFilter("all")} className="ml-2 text-purple-500 hover:text-purple-700">
                                            <XMarkIcon className="h-4 w-4" />
                                        </button>
                                    </span>
                                )}
                                {regionFilter !== "all" && (
                                    <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                                        Region: {regionFilterConfig.find(r => r.id === regionFilter)?.label}
                                        <button onClick={() => setRegionFilter("all")} className="ml-2 text-green-500 hover:text-green-700">
                                            <XMarkIcon className="h-4 w-4" />
                                        </button>
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Search and Filter Controls */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Search Input */}
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cari Nama Kapal, ID Rute, atau Lokasi
                        </label>
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Ketik nama kapal, ID rute, atau lokasi..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Reset Button */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reset Filter
                        </label>
                        <button
                            onClick={resetAllFilters}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors font-medium"
                        >
                            <ArrowPathIcon className="h-5 w-5" />
                            Reset Semua
                        </button>
                    </div>
                </div>

                {/* Filter Buttons */}
                <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Filter Perjalanan</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {filterConfig.map((filter) => {
                            const isActive = activeFilter === filter.id;
                            const IconComponent = isActive && filter.activeIcon ? filter.activeIcon : filter.icon;
                            const colors = getFilterColorClasses(filter.id);
                            
                            const getFilterCount = (filterId) => {
                                switch (filterId) {
                                    case "all": return data.length;
                                    case "inProgress": return data.filter(route => isRouteInProgress(route.details)).length;
                                    case "completed": return data.filter(route => isRouteCompleted(route.details)).length;
                                    case "fleet": return data.filter(route => isRouteFleet(route)).length;
                                    case "ipb": return data.filter(route => isRouteIpb(route)).length;
                                    default: return 0;
                                }
                            };

                            return (
                                <button
                                    key={filter.id}
                                    onClick={() => setActiveFilter(filter.id)}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 ${
                                        isActive 
                                            ? `${colors.bg} ${colors.border} border-2 transform scale-[1.02] shadow-md`
                                            : 'bg-white border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className={`p-3 rounded-lg mb-2 ${isActive ? colors.light : 'bg-gray-100'}`}>
                                        <IconComponent className={`h-6 w-6 ${isActive ? colors.text.replace('700', '600') : 'text-gray-500'}`} />
                                    </div>
                                    <span className={`font-medium text-sm ${isActive ? colors.text : 'text-gray-700'}`}>
                                        {filter.label}
                                    </span>
                                    <span className="text-xs text-gray-500 mt-1">
                                        {getFilterCount(filter.id)} rute
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Route Cards Grid */}
            {filteredRoutes.length === 0 ? (
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg p-12 text-center border border-gray-200">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                        <InformationCircleIcon className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Tidak Ada Perjalanan Ditemukan</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        Tidak ada perjalanan yang sesuai dengan filter pencarian Anda. Coba ubah filter atau kata kunci pencarian.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={resetAllFilters}
                            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                        >
                            Reset Semua Filter
                        </button>
                        <button
                            onClick={() => setShowAdvancedFilter(true)}
                            className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
                        >
                            <FunnelIcon className="h-5 w-5 mr-2" />
                            Ubah Filter
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {filteredRoutes.map((route) => {
                        const routeProgress = getProgressPercentage(route.details);
                        const isExpanded = expandedCards[route.id_rute_destinasi] || false;
                        const currentSlideIndex = routeSliders[route.id_rute_destinasi] || 0;
                        const statusColors = getStatusColor(
                            routeProgress === 100 ? 'completed' : 
                            routeProgress > 0 ? 'pending' : 'default'
                        );
                        const isFleet = isRouteFleet(route);
                        const routeType = getRouteType(route);
                        const routeTypeDisplay = getRouteTypeDisplay(route);
                        const routeRegion = getRouteRegion(route);
                        const routeRegionDisplay = getRouteRegionDisplay(route);

                        return (
                            <div 
                                key={route.id_rute_destinasi} 
                                className={`bg-white rounded-2xl shadow-xl overflow-hidden border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${statusColors.border}`}
                            >
                                {/* Route Header */}
                                <div className={`${statusColors.bgLight} p-6 border-b ${statusColors.border}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-xl font-bold text-gray-900">
                                                    {route.ship_name}
                                                </h3>
                                                {isFleet ? (
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                                                        FLEET
                                                    </span>
                                                ) : (
                                                    <span className={`px-2 py-1 ${
                                                        routeType === 'ipb' 
                                                            ? 'bg-purple-100 text-purple-700' 
                                                            : 'bg-blue-100 text-blue-700'
                                                    } text-xs font-bold rounded-full`}>
                                                        {routeTypeDisplay.toUpperCase()}
                                                    </span>
                                                )}
                                                {routeType === 'ipb' && routeRegion !== 'unknown' && (
                                                    <span className={`px-2 py-1 ${
                                                        routeRegion === 'north' ? 'bg-blue-100 text-blue-700' :
                                                        routeRegion === 'south' ? 'bg-green-100 text-green-700' :
                                                        'bg-orange-100 text-orange-700'
                                                    } text-xs font-medium rounded-full`}>
                                                        {routeRegionDisplay.toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm bg-white text-gray-700 px-3 py-1 rounded-full border border-gray-200">
                                                    ID: {route.id_rute_destinasi?.substring(0, 8)}...
                                                </span>
                                                <span className={`text-sm font-medium px-3 py-1 rounded-full ${statusColors.badge}`}>
                                                    {routeProgress}% Selesai
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleExpandCard(route.id_rute_destinasi)}
                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                                        >
                                            {isExpanded ? (
                                                <EyeSlashIcon className="h-5 w-5" />
                                            ) : (
                                                <EyeIcon className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-gray-700">Progress Perjalanan</span>
                                            <span className="text-sm font-bold text-blue-600">{routeProgress}%</span>
                                        </div>
                                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${routeProgress === 100 ? 'bg-green-500' : routeProgress > 0 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                                                style={{ width: `${routeProgress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Route Stats */}
                                    <div className="grid grid-cols-4 gap-3">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-gray-900">{route.total || 0}</div>
                                            <div className="text-xs text-gray-600">Total Destinasi</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-gray-900">
                                                {route.details?.filter(d => d.status === 'completed').length || 0}
                                            </div>
                                            <div className="text-xs text-gray-600">Selesai</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-gray-900">
                                                {route.details?.filter(d => d.status === 'pending' || d.status === 'in progress').length || 0}
                                            </div>
                                            <div className="text-xs text-gray-600">Berjalan</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm font-medium text-gray-900">
                                                {routeTypeDisplay}
                                            </div>
                                            <div className="text-xs text-gray-600">Tipe</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && route.details && route.details.length > 0 && (
                                    <div className="p-6">
                                        {/* Detail Slider */}
                                        <div className="mb-6">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="text-lg font-semibold text-gray-900">
                                                    Detail Perjalanan {currentSlideIndex + 1}/{route.details.length}
                                                </h4>
                                                
                                                {route.details.length > 1 && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => prevRouteDetail(route.id_rute_destinasi, route.details.length)}
                                                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                        >
                                                            <ChevronLeftIcon className="h-5 w-5" />
                                                        </button>
                                                        <span className="text-sm font-medium">
                                                            {currentSlideIndex + 1} / {route.details.length}
                                                        </span>
                                                        <button
                                                            onClick={() => nextRouteDetail(route.id_rute_destinasi, route.details.length)}
                                                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                        >
                                                            <ChevronRightIcon className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Current Detail Card */}
                                            {route.details[currentSlideIndex] && (
                                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-bold">
                                                                    {currentSlideIndex + 1}
                                                                </span>
                                                                <span className="font-bold text-gray-900">
                                                                    {route.details[currentSlideIndex].sequence}. {route.details[currentSlideIndex].location}
                                                                </span>
                                                            </div>
                                                            <div className="text-sm text-gray-600 pl-10">
                                                                {route.details[currentSlideIndex].activity || '-'}
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="text-right">
                                                            <div className="mb-2">
                                                                <div className="font-medium text-gray-900">
                                                                    {formatTime(route.details[currentSlideIndex].eta_time)}
                                                                </div>
                                                                <div className="text-sm text-gray-600">
                                                                    {route.details[currentSlideIndex].eta_date || ''}
                                                                </div>
                                                            </div>
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                                getStatusColor(route.details[currentSlideIndex].status).badge
                                                            }`}>
                                                                <span className={`w-2 h-2 rounded-full mr-2 ${
                                                                    getStatusColor(route.details[currentSlideIndex].status).bg
                                                                }`}></span>
                                                                {route.details[currentSlideIndex].status === 'completed' ? 'Selesai' : 
                                                                 route.details[currentSlideIndex].status === 'pending' ? 'Dalam Perjalanan' : 
                                                                 route.details[currentSlideIndex].status || '-'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Additional Info */}
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                            <div className="text-gray-600">Tiba</div>
                                                            <div className="font-medium">
                                                                {formatTime(route.details[currentSlideIndex].arrived_time)}
                                                            </div>
                                                        </div>
                                                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                            <div className="text-gray-600">Berangkat</div>
                                                            <div className="font-medium">
                                                                {formatTime(route.details[currentSlideIndex].departure_time)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Slider Indicators */}
                                            {route.details.length > 1 && (
                                                <div className="flex justify-center gap-1.5 mt-4">
                                                    {route.details.map((_, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => setRouteSliders(prev => ({
                                                                ...prev,
                                                                [route.id_rute_destinasi]: index
                                                            }))}
                                                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                                                index === currentSlideIndex 
                                                                    ? 'w-8 bg-blue-600' 
                                                                    : 'w-3 bg-gray-300 hover:bg-gray-400'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* All Details Table (Mini) */}
                                        <div>
                                            <h5 className="text-md font-medium text-gray-900 mb-3">Semua Destinasi</h5>
                                            <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b border-gray-200">
                                                            <th className="pb-2 text-left font-medium text-gray-700">#</th>
                                                            <th className="pb-2 text-left font-medium text-gray-700">Lokasi</th>
                                                            <th className="pb-2 text-left font-medium text-gray-700">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {route.details.map((detail, index) => {
                                                            const detailStatusColors = getStatusColor(detail.status);
                                                            return (
                                                                <tr key={index} className="border-b border-gray-100 last:border-0">
                                                                    <td className="py-2">{index + 1}</td>
                                                                    <td className="py-2">{detail.location}</td>
                                                                    <td className="py-2">
                                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${detailStatusColors.badge}`}>
                                                                            {detail.status === 'completed' ? '✓' : 
                                                                             detail.status === 'pending' ? '⏳' : '●'}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Route Footer */}
                                <div className="bg-gray-50 p-4 border-t border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <CalendarIcon className="h-4 w-4 text-gray-400" />
                                            <span>Terakhir update: {new Date().toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}</span>
                                        </div>
                                        <button
                                            onClick={() => toggleExpandCard(route.id_rute_destinasi)}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors text-sm"
                                        >
                                            {isExpanded ? (
                                                <>
                                                    <EyeSlashIcon className="h-4 w-4" />
                                                    Tutup Detail
                                                </>
                                            ) : (
                                                <>
                                                    <EyeIcon className="h-4 w-4" />
                                                    Lihat Detail
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-5 shadow-sm border border-blue-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-700 font-medium">Total Perjalanan</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <GlobeAmericasIcon className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>
                
                <div className="bg-gradient-to-br from-red-50 to-white rounded-2xl p-5 shadow-sm border border-red-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-700 font-medium">Dalam Perjalanan</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {stats.inProgress}
                            </p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-xl">
                            <FireIcon className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-5 shadow-sm border border-green-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-700 font-medium">Selesai</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {stats.completed}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-xl">
                            <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-5 shadow-sm border border-purple-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-purple-700 font-medium">IPB vs Supply</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {stats.ipb} : {stats.supply}
                            </p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <BuildingStorefrontIcon className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Info */}
            <div className="mt-8 text-center text-sm text-gray-500">
                <p>Data terakhir diperbarui: {new Date().toLocaleString('id-ID')}</p>
                <p className="mt-1">Menampilkan {filteredRoutes.length} dari {data.length} total perjalanan</p>
            </div>
        </div>
    );
};

export default RouteMonitoring;