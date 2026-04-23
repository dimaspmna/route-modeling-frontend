import React, { useEffect, useState } from "react";
import API from "../../../api/Api";
import {
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    MapPinIcon,
    EyeIcon
} from "@heroicons/react/24/outline";

const PassengerHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("all");
    const [sortBy, setSortBy] = useState("newest");

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const storedUser = localStorage.getItem("user");
                const parsedUser = storedUser ? JSON.parse(storedUser) : {};
                const email = parsedUser.email;

                if (!email) return;

                const res = await API.get(`/passenger/history`);
                setHistory(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Gagal ambil history request:", err);
                setHistory([]);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const getStatusIcon = (status) => {
        if (!status) return <ClockIcon className="h-4 w-4" />;
        switch (status.toLowerCase()) {
            case "process to fleet team":
                return <ArrowPathIcon className="h-4 w-4" />;
            case "approved":
                return <CheckCircleIcon className="h-4 w-4" />;
            case "approved with note":
                return <CheckCircleIcon className="h-4 w-4" />;
            case "rejected":
                return <XCircleIcon className="h-4 w-4" />;
            default:
                return <ClockIcon className="h-4 w-4" />;
        }
    };

    const getStatusClass = (status) => {
        if (!status) return "bg-gray-100 text-gray-800";
        switch (status.toLowerCase()) {
            case "process to fleet team":
                return "bg-yellow-100 text-yellow-800";
            case "approved":
                return "bg-green-100 text-green-800";
            case "approved with note":
                return "bg-green-100 text-green-800";
            case "rejected":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getPriorityClass = (priority) => {
        return priority === "priority"
            ? "bg-red-100 text-red-800 border border-red-200"
            : "bg-blue-100 text-blue-800 border border-blue-200";
    };

    // Filter and sort history
    const filteredHistory = history
        .filter(item => {
            if (filterStatus === "all") return true;
            return item.status_request?.toLowerCase() === filterStatus.toLowerCase();
        })
        .sort((a, b) => {
            const dateA = new Date(a.tanggal_request || 0);
            const dateB = new Date(b.tanggal_request || 0);

            return sortBy === "newest"
                ? dateB - dateA
                : dateA - dateB;
        });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat history...</p>
                </div>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ClockIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">Belum ada riwayat</h2>
                        <p className="text-gray-600">Anda belum melakukan request apapun.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Riwayat Request</h1>
                    <p className="text-gray-600 mt-1">Lihat semua permintaan yang telah Anda ajukan</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filter Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full border bg-white text-black border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Semua Status</option>
                                <option value="approved">Approved</option>
                                <option value="approved with note">Approved With Note</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>

                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Urutkan</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full border bg-white text-black border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="newest">Terbaru</option>
                                <option value="oldest">Terlama</option>
                            </select>
                        </div>

                        <div className="flex md:mt-6 items-end">
                            <span className="text-sm text-gray-600 bg-gray-100 py-2 px-4 rounded-lg">
                                {filteredHistory.length} permintaan
                            </span>
                        </div>
                    </div>
                </div>

                {/* History Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                                    <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                    <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Peminta</th>
                                    <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasi Tujuan</th>
                                    <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis</th>
                                    <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kuantitas</th>
                                    <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioritas</th>
                                    <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredHistory.map((item, index) => (
                                    <tr key={`${item.ship_request_id}-${index}`} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900">{item.ship_request_id}</span>
                                                {(item.status_request?.toLowerCase() === "approved" || item.status_request?.toLowerCase() === "approved with note") && (
                                                    <button
                                                        className="mt-1 inline-flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
                                                        onClick={() => alert("Fungsi melihat map belum tersedia")}
                                                    >
                                                        <EyeIcon className="h-3 w-3 mr-1" />
                                                        Lihat Rute
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {item.tanggal_request
                                                    ? `${new Date(item.tanggal_request).toLocaleDateString("id-ID")} ${new Date(item.tanggal_request).toLocaleTimeString("id-ID", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}`
                                                    : "-"}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center text-sm text-gray-500">
                                                <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                                                <span className="truncate max-w-xs">
                                                    {item.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center text-sm text-gray-500">
                                                <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                                                <span className="truncate max-w-xs">
                                                    {item.destination_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 capitalize">
                                                {item.kategori_request?.replace("_", " ") || "-"}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {item.jenis_material || "-"}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{item.kuantitas}</div>
                                            <div className="text-xs text-gray-500">{item.satuan}</div>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityClass(item.priority_request)}`}>
                                                {item.priority_request === "priority" ? "Prioritas" : "Normal"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <div className="inline-flex items-center">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(item.status_request)}`}>
                                                    {getStatusIcon(item.status_request)}
                                                    <span className="ml-1.5">{item.status_request || "Unknown"}</span>
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredHistory.length === 0 && (
                        <div className="text-center py-12 px-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ClockIcon className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada data</h3>
                            <p className="text-gray-600">Tidak ada request dengan status yang dipilih.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PassengerHistory;