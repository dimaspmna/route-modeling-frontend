import React, { useEffect, useState } from "react";
import API from "../../../api/Api";
import {
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    MapPinIcon,
    ClipboardDocumentCheckIcon,
    EyeIcon,
    CalendarIcon,
     GlobeAmericasIcon,
    ExclamationCircleIcon,
    CubeIcon,
    DocumentTextIcon,
    FlagIcon,
    MagnifyingGlassIcon,
    FunnelIcon
} from "@heroicons/react/24/outline";

const FleetHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await API.get("/fleet-history");
                setHistory(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Gagal ambil history fleet:", err);
                setHistory([]);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const getStatusIcon = (status) => {
        if (!status) return <ClockIcon className="h-4 w-4 text-gray-400" />;

        switch (status.toLowerCase()) {
            case "pending":
                return <ClockIcon className="h-4 w-4 text-yellow-500" />;
            case "process":
            case "process to fleet team":
                return <ArrowPathIcon className="h-4 w-4 text-blue-500" />;
            case "approved":
            case "approved with note":
                return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
            case "rejected":
                return <XCircleIcon className="h-4 w-4 text-red-500" />;
            case "delivered":
                return <ClipboardDocumentCheckIcon className="h-4 w-4 text-teal-500" />;
            case "complete":
                return <CheckCircleIcon className="h-4 w-4 text-purple-500" />;
            default:
                return <ClockIcon className="h-4 w-4 text-gray-400" />;
        }
    };

    const getFleetStatusClass = (status) => {
        if (!status) return "bg-gray-100 text-gray-800 border-gray-200";

        switch (status.toLowerCase()) {
            case "pending":
                return "bg-yellow-50 text-yellow-700 border-yellow-200";
            case "process":
            case "process to fleet team":
                return "bg-blue-50 text-blue-700 border-blue-200";
            case "approved":
            case "approved with note":
                return "bg-green-50 text-green-700 border-green-200";
            case "rejected":
                return "bg-red-50 text-red-700 border-red-200";
            case "delivered":
                return "bg-teal-50 text-teal-700 border-teal-200";
            case "complete":
                return "bg-purple-50 text-purple-700 border-purple-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    // Filter data
    const filteredHistory = history.filter(item => {
        // Filter by search term
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return (
                item.ship_request_id?.toLowerCase().includes(searchLower) ||
                item.destination_name?.toLowerCase().includes(searchLower) ||
                item.kategori_request?.toLowerCase().includes(searchLower) ||
                item.jenis_material?.toLowerCase().includes(searchLower)
            );
        }
        
        // Filter by status
        if (statusFilter !== "all") {
            return item.fleet_status?.toLowerCase() === statusFilter.toLowerCase();
        }
        
        return true;
    });

    // Get unique statuses for filter
    const uniqueStatuses = [...new Set(history.map(item => item.fleet_status).filter(Boolean))];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-lg font-medium text-gray-700">Memuat history fleet...</p>
                    <p className="text-sm text-gray-500">Sedang mengambil data</p>
                </div>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center max-w-md">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-200 rounded-full mb-6">
                        < GlobeAmericasIcon className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Belum Ada History</h3>
                    <p className="text-gray-600 mb-6">
                        Saat ini belum ada fleet request yang selesai. History akan muncul di sini setelah fleet request diselesaikan.
                    </p>
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
                                < GlobeAmericasIcon className="h-7 w-7 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Fleet History</h1>
                                <p className="text-gray-600 mt-1">Riwayat permintaan fleet yang sudah selesai</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mt-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-gray-700">Approved</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <span className="text-gray-700">Pending</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-gray-700">Process</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
                        <p className="text-sm text-gray-600">Total History</p>
                        <p className="text-2xl font-bold text-gray-900">{filteredHistory.length}</p>
                    </div>
                </div>
            </div>

            {/* Filter Controls */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Search Input */}
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cari History
                        </label>
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari berdasarkan ID, lokasi, atau material..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filter Status
                        </label>
                        <div className="relative">
                            <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white appearance-none"
                            >
                                <option value="all">Semua Status</option>
                                {uniqueStatuses.map((status, index) => (
                                    <option key={index} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-5 shadow-sm border border-blue-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-700 font-medium">Total Request</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{history.length}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-5 shadow-sm border border-green-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-700 font-medium">Completed</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {history.filter(item => item.fleet_status?.toLowerCase() === 'complete').length}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-xl">
                            <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>
                
                <div className="bg-gradient-to-br from-yellow-50 to-white rounded-2xl p-5 shadow-sm border border-yellow-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-yellow-700 font-medium">In Process</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {history.filter(item => 
                                    item.fleet_status?.toLowerCase() === 'process' ||
                                    item.fleet_status?.toLowerCase() === 'process to fleet team'
                                ).length}
                            </p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-xl">
                            <ArrowPathIcon className="h-6 w-6 text-yellow-600" />
                        </div>
                    </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-5 shadow-sm border border-purple-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-purple-700 font-medium">Priority</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {history.filter(item => item.priority_request?.toLowerCase() === 'priority').length}
                            </p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <FlagIcon className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* History Table */}
            {filteredHistory.length === 0 ? (
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg p-12 text-center border border-gray-200">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                        <MagnifyingGlassIcon className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Tidak Ada Data Ditemukan</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        Tidak ada history yang sesuai dengan filter pencarian Anda. Coba gunakan kata kunci yang berbeda atau reset filter.
                    </p>
                    <button
                        onClick={() => {
                            setSearchTerm("");
                            setStatusFilter("all");
                        }}
                        className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                    >
                        Reset Filter
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                                <tr>
                                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <DocumentTextIcon className="h-4 w-4" />
                                            ID Request
                                        </div>
                                    </th>
                                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4" />
                                            Tanggal
                                        </div>
                                    </th>
                                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <MapPinIcon className="h-4 w-4" />
                                            Lokasi
                                        </div>
                                    </th>
                                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <CubeIcon className="h-4 w-4" />
                                            Material & Volume
                                        </div>
                                    </th>
                                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <FlagIcon className="h-4 w-4" />
                                            Priority
                                        </div>
                                    </th>
                                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                        <div className="flex items-center gap-2">
                                            < GlobeAmericasIcon className="h-4 w-4" />
                                            Status
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredHistory.map((item, index) => (
                                    <tr 
                                        key={`${item.ship_request_id}-${index}`}
                                        className="hover:bg-gray-50/50 transition-colors duration-150"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                        <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">
                                                        {item.ship_request_id}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {item.kategori_request}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-900">
                                                    {item.tanggal_request 
                                                        ? new Date(item.tanggal_request).toLocaleDateString("id-ID", {
                                                            weekday: 'short',
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })
                                                        : "-"}
                                                </div>
                                                <div className="text-gray-500">
                                                    {item.tanggal_request 
                                                        ? new Date(item.tanggal_request).toLocaleTimeString("id-ID", {
                                                            hour: "2-digit",
                                                            minute: "2-digit"
                                                        })
                                                        : "-"}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-gray-100 rounded-lg">
                                                    <MapPinIcon className="h-4 w-4 text-gray-600" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {item.destination_name || "-"}
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                                        {item.kordinat_request 
                                                            ? item.kordinat_request
                                                                .split(",")
                                                                .map(coord => parseFloat(coord).toFixed(6))
                                                                .join(", ")
                                                            : "Koordinat tidak tersedia"}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-gray-100 rounded-lg">
                                                    <CubeIcon className="h-4 w-4 text-gray-600" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {item.jenis_material || "-"}
                                                    </div>
                                                    <div className="text-sm text-gray-700">
                                                        {item.kuantitas} {item.satuan}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${
                                                item.priority_request === "priority" 
                                                    ? "bg-red-50 text-red-700 border border-red-200" 
                                                    : "bg-gray-50 text-gray-700 border border-gray-200"
                                            }`}>
                                                {item.priority_request === "priority" ? (
                                                    <FlagIcon className="h-4 w-4" />
                                                ) : (
                                                    <span className="text-xs">●</span>
                                                )}
                                                <span className="text-sm font-medium">
                                                    {item.priority_request === "priority" ? "Priority" : "Normal"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <div>
                                                    {getStatusIcon(item.fleet_status)}
                                                </div>
                                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${
                                                    getFleetStatusClass(item.fleet_status)
                                                }`}>
                                                    {item.fleet_status || "Unknown"}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Table Footer */}
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <ClockIcon className="h-4 w-4 text-gray-400" />
                                <span>Terakhir update: {new Date().toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-gray-700">
                                    Menampilkan <span className="font-bold">{filteredHistory.length}</span> dari <span className="font-bold">{history.length}</span> data
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FleetHistory;