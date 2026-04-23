import React, { useEffect, useState } from "react";
import API from "../../../api/Api";
import {
    MagnifyingGlassIcon,
    ArrowPathIcon,
    FunnelIcon,
    CalendarIcon,
    MapIcon,
    BuildingOfficeIcon,
    ShieldCheckIcon,
    ChartBarIcon,
    TableCellsIcon,
    InformationCircleIcon,
    GlobeAmericasIcon,
    XMarkIcon,
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

const FilterMonitoring = () => {
    // State untuk data IPB Monitoring dari endpoint baru
    const [ipbData, setIpbData] = useState({
        filter: { region: "all", type: "all", startDate: "", endDate: "" },
        summary: {
            total_route: 0,
            fleet: 0,
            ipb: 0,
            central: 0,
            north: 0,
            south: 0
        },
        total_routes: 0,
        data: []
    });

    // State untuk filter IPB
    const [filterRegion, setFilterRegion] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showAdvancedFilter, setShowAdvancedFilter] = useState(true); // Selalu tampilkan filter
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState("");

    // Helper function untuk safe access
    const safeGet = (obj, path, defaultValue = 0) => {
        return path.split('.').reduce((acc, key) => {
            return acc && acc[key] !== undefined ? acc[key] : defaultValue;
        }, obj);
    };

    // Format date untuk display
    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Format date untuk input
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    // Fetch data awal
    useEffect(() => {
        fetchFilteredIpbData();
    }, []);

    // Fetch filtered IPB data dengan parameter yang lengkap
    const fetchFilteredIpbData = async () => {
        try {
            setLoading(true);
            setError(null);
            let params = {};

            // Kirim type dengan format yang benar
            if (filterType !== 'all') {
                params.type = filterType === 'ipb' ? 'IPB' : 'Supply';
            }

            // Kirim region dengan format yang benar
            if (filterRegion !== 'all') {
                params.region = filterRegion;
            }

            // Kirim startDate jika ada
            if (startDate) {
                const start = new Date(startDate);
                params.startDate = start.toISOString().split('T')[0];
            }

            // Kirim endDate jika ada
            if (endDate) {
                const end = new Date(endDate);
                params.endDate = end.toISOString().split('T')[0];
            }

            console.log("Fetching dengan parameter:", params);
            const response = await API.get("/route/area-filter", { params });

            if (response.data?.success) {
                setIpbData({
                    filter: response.data.filter || {
                        region: filterRegion,
                        type: filterType,
                        startDate: startDate,
                        endDate: endDate
                    },
                    summary: response.data.summary || {
                        total_route: 0,
                        fleet: 0,
                        ipb: 0,
                        central: 0,
                        north: 0,
                        south: 0
                    },
                    total_routes: response.data.total_routes || 0,
                    data: response.data.data || []
                });
                setLastUpdated(new Date().toLocaleTimeString('id-ID'));
            } else {
                setError(response.data?.message || "Gagal mengambil data");
            }
        } catch (error) {
            console.error("Gagal mengambil data IPB:", error);
            const errorMessage = error.response?.data?.message || "Failed to fetch filtered data. Please try again.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Reset semua filter
    const resetFilter = () => {
        setFilterRegion('all');
        setFilterType('all');
        setStartDate("");
        setEndDate("");
        setSearchTerm('');
        setError(null);
        fetchFilteredIpbData();
    };

    // Reset hanya filter tanggal
    const resetDateFilter = () => {
        setStartDate("");
        setEndDate("");
        setError(null);
    };

    // Apply filter dan fetch data
    const applyFilters = () => {
        fetchFilteredIpbData();
    };

    // Format number
    const formatNumber = (num) => {
        if (num === undefined || num === null) return '0';
        return new Intl.NumberFormat('id-ID').format(num);
    };

    // Fungsi untuk menentukan apakah ada filter aktif
    const hasActiveFilters = () => {
        return startDate || endDate || filterType !== "all" || filterRegion !== "all" || searchTerm;
    };

    // Fungsi untuk menghitung hari antara dua tanggal
    const calculateDaysBetween = (start, end) => {
        if (!start || !end) return 0;
        const startDateObj = new Date(start);
        const endDateObj = new Date(end);
        const diffTime = Math.abs(endDateObj - startDateObj);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1; // Termasuk hari pertama
    };

    // IPB Statistics Cards dari data area-filter
    const ipbStatsCards = [
        {
            title: "Total Routes",
            value: safeGet(ipbData, 'summary.total_route', 0),
            icon: BuildingOfficeIcon,
            bgColor: "bg-gradient-to-br from-blue-500 to-indigo-600",
            textColor: "text-white",
            description: `Fleet: ${safeGet(ipbData, 'summary.fleet', 0)} | IPB: ${safeGet(ipbData, 'summary.ipb', 0)}`
        },
        {
            title: "North Area",
            value: safeGet(ipbData, 'summary.north', 0),
            icon: MapIcon,
            bgColor: "bg-gradient-to-br from-emerald-500 to-teal-600",
            textColor: "text-white",
            description: "Northern region routes"
        },
        {
            title: "Central Area",
            value: safeGet(ipbData, 'summary.central', 0),
            icon: MapIcon,
            bgColor: "bg-gradient-to-br from-amber-500 to-orange-600",
            textColor: "text-white",
            description: "Central region routes"
        },
        {
            title: "South Area",
            value: safeGet(ipbData, 'summary.south', 0),
            icon: MapIcon,
            bgColor: "bg-gradient-to-br from-rose-500 to-pink-600",
            textColor: "text-white",
            description: "Southern region routes"
        },
    ];

    // Filter data berdasarkan search term
    const filteredData = ipbData.data.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        return (
            (item.ship_name?.toLowerCase().includes(searchLower)) ||
            (item.id_rute_destinasi?.toLowerCase().includes(searchLower)) ||
            (item.type?.toLowerCase().includes(searchLower)) ||
            (item.region?.toLowerCase().includes(searchLower))
        );
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Route Filter Monitoring</h1>
                <p className="text-gray-600 mt-2">Filter Routes by Area, Date, and Type</p>
            </div>

            {/* Filter Section - Selalu Tampil */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                        <FunnelIcon className="h-5 w-5 text-blue-500 mr-2" />
                        Filter Monitoring
                    </h3>
                    <div className="flex items-center space-x-3">
                        {hasActiveFilters() && (
                            <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                                Filter Aktif
                            </span>
                        )}
                        <button
                            onClick={resetFilter}
                            className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
                        >
                            <ArrowPathIcon className="h-4 w-4 mr-1" />
                            Reset Semua
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                            <span className="text-red-700">{error}</span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Date Range Filter */}
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <div className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1 text-gray-500" />
                                Rentang Tanggal
                            </div>
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Dari Tanggal</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => {
                                            setStartDate(e.target.value);
                                            setError(null);
                                        }}
                                        className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        max={endDate || new Date().toISOString().split('T')[0]}
                                    />
                                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Sampai Tanggal</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => {
                                            setEndDate(e.target.value);
                                            setError(null);
                                        }}
                                        className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        min={startDate}
                                        max={new Date().toISOString().split('T')[0]}
                                    />
                                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                </div>
                            </div>
                        </div>
                        {startDate && endDate && (
                            <p className="text-xs text-green-600 mt-2">
                                Periode: {formatDateForDisplay(startDate)} - {formatDateForDisplay(endDate)} 
                                ({calculateDaysBetween(startDate, endDate)} hari)
                            </p>
                        )}
                    </div>

                    {/* Type Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <div className="flex items-center">
                                <GlobeAmericasIcon className="h-4 w-4 mr-1 text-gray-500" />
                                Tipe Perjalanan
                            </div>
                        </label>
                        <div className="space-y-2">
                            {[
                                { id: "all", label: "Semua Tipe", color: "gray" },
                                { id: "ipb", label: "IPB", color: "purple" },
                                { id: "supply", label: "Supply", color: "blue" }
                            ].map((type) => {
                                const isActive = filterType === type.id;
                                return (
                                    <button
                                        key={type.id}
                                        onClick={() => {
                                            const newType = type.id;
                                            setFilterType(newType);
                                            
                                            // Jika memilih supply, otomatis set region ke fleet
                                            if (newType === 'supply') {
                                                setFilterRegion('fleet');
                                            } 
                                            // Jika memilih ipb, reset region ke all
                                            else if (newType === 'ipb') {
                                                setFilterRegion('all');
                                            }
                                            // Jika memilih all, reset region ke all
                                            else if (newType === 'all') {
                                                setFilterRegion('all');
                                            }
                                            
                                            setError(null);
                                        }}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${
                                            isActive 
                                                ? `${
                                                    type.id === 'ipb' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                                                    type.id === 'supply' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                                    'bg-gray-50 border-gray-200 text-gray-700'
                                                } font-medium shadow-sm`
                                                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                                        }`}
                                    >
                                        <span>{type.label}</span>
                                        {isActive && (
                                            <div className={`w-2 h-2 rounded-full ${
                                                type.id === 'ipb' ? 'bg-purple-500' :
                                                type.id === 'supply' ? 'bg-blue-500' :
                                                'bg-gray-500'
                                            }`}></div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Region Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <div className="flex items-center">
                                <MapIcon className="h-4 w-4 mr-1 text-gray-500" />
                                Region
                                {filterType === "supply" && (
                                    <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                        Auto: Fleet
                                    </span>
                                )}
                            </div>
                        </label>
                        <div className="space-y-2">
                            {filterType === "supply" ? (
                                // Jika type adalah supply, region otomatis ke fleet dan nonaktif
                                <div className="w-full px-4 py-3 rounded-lg border-2 bg-blue-50 border-blue-200 text-blue-700 font-medium shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <span>Fleet</span>
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    </div>
                                    <p className="text-xs text-blue-600 mt-1">
                                        Region otomatis di-set ke Fleet untuk type Supply
                                    </p>
                                </div>
                            ) : (
                                // Jika type bukan supply, tampilkan pilihan region normal
                                [
                                    { id: "all", label: "Semua Region", color: "gray" },
                                    { id: "north", label: "North Area", color: "blue" },
                                    { id: "south", label: "South Area", color: "green" },
                                    { id: "central", label: "Central Area", color: "orange" },
                                    { id: "fleet", label: "Fleet", color: "purple" }
                                ].map((region) => {
                                    const isActive = filterRegion === region.id;
                                    return (
                                        <button
                                            key={region.id}
                                            onClick={() => {
                                                setFilterRegion(region.id);
                                                setError(null);
                                            }}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${
                                                isActive 
                                                    ? `${
                                                        region.id === 'north' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                                        region.id === 'south' ? 'bg-green-50 border-green-200 text-green-700' :
                                                        region.id === 'central' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                                                        region.id === 'fleet' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                                                        'bg-gray-50 border-gray-200 text-gray-700'
                                                    } font-medium shadow-sm`
                                                    : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                                            }`}
                                        >
                                            <span>{region.label}</span>
                                            {isActive && (
                                                <div className={`w-2 h-2 rounded-full ${
                                                    region.id === 'north' ? 'bg-blue-500' :
                                                    region.id === 'south' ? 'bg-green-500' :
                                                    region.id === 'central' ? 'bg-orange-500' :
                                                    region.id === 'fleet' ? 'bg-purple-500' :
                                                    'bg-gray-500'
                                                }`}></div>
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cari Nama Kapal atau ID Rute
                            </label>
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Ketik nama kapal, ID rute, type, atau region..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                                />
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={resetDateFilter}
                                className="px-4 py-2.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center transition-colors"
                            >
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                Reset Tanggal
                            </button>
                            <button
                                onClick={applyFilters}
                                disabled={loading}
                                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                {loading ? (
                                    <>
                                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                                        Memuat...
                                    </>
                                ) : (
                                    <>
                                        <FunnelIcon className="h-4 w-4 mr-2" />
                                        Terapkan Filter
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Active Filters Summary */}
                {hasActiveFilters() && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Filter Aktif:</h4>
                        <div className="flex flex-wrap gap-2">
                            {startDate && (
                                <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-full">
                                    Dari: {formatDateForDisplay(startDate)}
                                    <button onClick={() => { setStartDate(""); setError(null); }} className="ml-2 text-blue-500 hover:text-blue-700">
                                        <XMarkIcon className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {endDate && (
                                <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-full">
                                    Sampai: {formatDateForDisplay(endDate)}
                                    <button onClick={() => { setEndDate(""); setError(null); }} className="ml-2 text-blue-500 hover:text-blue-700">
                                        <XMarkIcon className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {filterType !== "all" && (
                                <span className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-700 text-sm rounded-full">
                                    Tipe: {filterType === 'ipb' ? 'IPB' : 'Supply'}
                                    <button onClick={() => { setFilterType("all"); setError(null); }} className="ml-2 text-purple-500 hover:text-purple-700">
                                        <XMarkIcon className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {filterRegion !== "all" && (
                                <span className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-full">
                                    Region: {filterRegion.charAt(0).toUpperCase() + filterRegion.slice(1)}
                                    <button onClick={() => { setFilterRegion("all"); setError(null); }} className="ml-2 text-green-500 hover:text-green-700">
                                        <XMarkIcon className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {searchTerm && (
                                <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full">
                                    Pencarian: {searchTerm}
                                    <button onClick={() => setSearchTerm('')} className="ml-2 text-gray-500 hover:text-gray-700">
                                        <XMarkIcon className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                        </div>
                    </div>
                )}
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
                                    <p className="text-xs opacity-80 mt-2">{card.description}</p>
                                )}
                            </div>
                            <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                                <card.icon className="h-6 w-6" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Distribution by Type</h3>
                        <ShieldCheckIcon className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <span className="text-blue-700 font-medium">Fleet Routes</span>
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
                                {safeGet(ipbData, 'summary.fleet', 0)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <span className="text-green-700 font-medium">IPB Routes</span>
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold">
                                {safeGet(ipbData, 'summary.ipb', 0)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Area Distribution</h3>
                        <MapIcon className="h-6 w-6 text-green-500" />
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                                <span className="text-gray-700">North Area</span>
                            </div>
                            <span className="font-semibold">{safeGet(ipbData, 'summary.north', 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                                <span className="text-gray-700">Central Area</span>
                            </div>
                            <span className="font-semibold">{safeGet(ipbData, 'summary.central', 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-rose-500 mr-2"></div>
                                <span className="text-gray-700">South Area</span>
                            </div>
                            <span className="font-semibold">{safeGet(ipbData, 'summary.south', 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                                <span className="text-gray-700">Fleet</span>
                            </div>
                            <span className="font-semibold">{safeGet(ipbData, 'summary.fleet', 0)}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
                        <ChartBarIcon className="h-6 w-6 text-purple-500" />
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Ships</span>
                            <span className="font-semibold">{filteredData.length || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Activities</span>
                            <span className="font-semibold">
                                {filteredData.reduce((total, item) => total + (item.total || 0), 0) || 0}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Search Results</span>
                            <span className="font-semibold">
                                {filteredData.length} of {ipbData.data.length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Route Monitoring Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <TableCellsIcon className="h-5 w-5 text-blue-500 mr-2" />
                                Route Monitoring
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <p className="text-sm text-gray-500">
                                    Menampilkan {filteredData.length} dari {safeGet(ipbData, 'total_routes', 0)} total rute
                                    {searchTerm && ` (dengan pencarian: "${searchTerm}")`}
                                </p>
                                {lastUpdated && (
                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                                        Terakhir update: {lastUpdated}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {filterType !== 'all' && (
                                <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                                    Type: {filterType === 'ipb' ? 'IPB' : 'Supply'}
                                    <button onClick={() => { setFilterType('all'); setError(null); }} className="ml-2">
                                        <XMarkIcon className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {filterRegion !== 'all' && (
                                <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                                    Region: {filterRegion.charAt(0).toUpperCase() + filterRegion.slice(1)}
                                    <button onClick={() => { setFilterRegion('all'); setError(null); }} className="ml-2">
                                        <XMarkIcon className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {startDate && endDate && (
                                <span className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full">
                                    {formatDateForDisplay(startDate)}-{formatDateForDisplay(endDate)}
                                    <button onClick={() => { setStartDate(""); setEndDate(""); setError(null); }} className="ml-2">
                                        <XMarkIcon className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {searchTerm && (
                                <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                                    Search: {searchTerm}
                                    <button onClick={() => setSearchTerm('')} className="ml-2">
                                        <XMarkIcon className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    No
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ship Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Region
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Activities
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Route ID
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center">
                                        <div className="flex justify-center items-center">
                                            <ArrowPathIcon className="h-6 w-6 text-blue-500 animate-spin mr-2" />
                                            <span>Loading route data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredData.length > 0 ? (
                                filteredData.map((item, index) => {
                                    const completedActivities = item.details?.filter(d => d.status === 'completed').length || 0;
                                    const completionRate = item.total > 0 ? Math.round((completedActivities / item.total) * 100) : 0;
                                    const itemType = item.type || (item.region === 'fleet' ? 'Supply' : 'IPB');

                                    return (
                                        <tr key={item.id_rute_destinasi || index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {item.ship_name || 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {completedActivities} of {item.total || 0} completed
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${itemType === 'IPB'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {itemType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${item.region === 'north'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : item.region === 'central'
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : item.region === 'south'
                                                            ? 'bg-rose-100 text-rose-800'
                                                            : item.region === 'fleet'
                                                                ? 'bg-purple-100 text-purple-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {item.region?.toUpperCase() || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                                                        <div
                                                            className={`h-2 rounded-full ${completionRate >= 80 ? 'bg-green-500' :
                                                                completionRate >= 50 ? 'bg-yellow-500' :
                                                                    'bg-red-500'
                                                                }`}
                                                            style={{ width: `${completionRate}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm font-medium">
                                                        {item.total || 0}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                                    {item.id_rute_destinasi?.substring(0, 12) || 'N/A'}...
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <TableCellsIcon className="h-12 w-12 text-gray-300 mb-2" />
                                            <p>Tidak ada data rute yang ditemukan</p>
                                            <p className="text-sm mt-1">Coba ubah kriteria filter Anda</p>
                                            {hasActiveFilters() && (
                                                <button
                                                    onClick={resetFilter}
                                                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                                >
                                                    Reset Semua Filter
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Summary Footer */}
                {filteredData.length > 0 && (
                    <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex flex-wrap gap-3">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                                    <span className="text-sm text-gray-600">
                                        Tinggi (≥80%): {
                                            filteredData.filter(item => {
                                                const completed = item.details?.filter(d => d.status === 'completed').length || 0;
                                                const rate = item.total > 0 ? (completed / item.total) * 100 : 0;
                                                return rate >= 80;
                                            }).length
                                        }
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                                    <span className="text-sm text-gray-600">
                                        Sedang (50-79%): {
                                            filteredData.filter(item => {
                                                const completed = item.details?.filter(d => d.status === 'completed').length || 0;
                                                const rate = item.total > 0 ? (completed / item.total) * 100 : 0;
                                                return rate >= 50 && rate < 80;
                                            }).length
                                        }
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                                    <span className="text-sm text-gray-600">
                                        Rendah (&lt;50%): {
                                            filteredData.filter(item => {
                                                const completed = item.details?.filter(d => d.status === 'completed').length || 0;
                                                const rate = item.total > 0 ? (completed / item.total) * 100 : 0;
                                                return rate < 50;
                                            }).length
                                        }
                                    </span>
                                </div>
                            </div>
                            <div className="text-sm text-gray-500">
                                Terakhir update: {new Date().toLocaleTimeString('id-ID')}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FilterMonitoring;