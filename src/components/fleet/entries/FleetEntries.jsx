import { useState, useEffect } from "react";
import { Search, CheckCircle, Clock, AlertTriangle, Ship, Package, Calendar, MapPin, Filter, Navigation } from "lucide-react";
import API from "../../../api/Api";
import { useNavigate } from "react-router-dom";
import {
    ChevronRightIcon,
    ChevronLeftIcon
} from '@heroicons/react/24/outline';

const FleetEntries = () => {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const navigate = useNavigate();

    const pageSize = 10;

    const fetchData = async () => {
        try {
            const res = await API.get("/get-approved-request");
            setData(res.data || []);
        } catch (err) {
            console.error("Gagal ambil data fleet:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApprove = async (id) => {
        try {
            await API.patch(`/update-fleet-status/${id}`, {
                fleet_status: "process",
            });
            fetchData();
        } catch (err) {
            console.error("Gagal update status fleet:", err);
            alert("Gagal update status fleet!");
        }
    };

    const filteredData = data.filter((item) => {
        const matchesSearch = item.name?.toLowerCase().includes(search.toLowerCase()) ||
            item.ship_request_id?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || item.fleet_status === statusFilter;
        const matchesPriority = priorityFilter === "all" ||
            (priorityFilter === "priority" && item.priority_request === "priority") ||
            (priorityFilter === "normal" && item.priority_request !== "priority");
        return matchesSearch && matchesStatus && matchesPriority;
    });

    // Urutkan data: priority di atas, lalu berdasarkan tanggal (terbaru di atas)
    const sortedData = [...filteredData].sort((a, b) => {
        // Priority first
        if (a.priority_request === "priority" && b.priority_request !== "priority") return -1;
        if (a.priority_request !== "priority" && b.priority_request === "priority") return 1;

        // Then by date (newest first)
        return new Date(b.tanggal_request) - new Date(a.tanggal_request);
    });

    const paginatedData = sortedData.slice(
        (page - 1) * pageSize,
        page * pageSize
    );
    const totalPages = Math.ceil(sortedData.length / pageSize);

    const getFleetStatusClass = (status) => {
        if (!status) return "bg-gray-100 text-gray-700";
        const s = status.toLowerCase();
        if (s.includes("pending") || s.includes("reject"))
            return "bg-red-100 text-red-700 border border-red-200";
        if (s.includes("approved"))
            return "bg-green-100 text-green-700 border border-green-200";
        if (s.includes("process"))
            return "bg-yellow-100 text-yellow-700 border border-yellow-200";
        if (s.includes("delivered"))
            return "bg-purple-100 text-purple-700 border border-purple-200";
        if (s.includes("complete") || s.includes("success"))
            return "bg-blue-100 text-blue-700 border border-blue-200";
        return "bg-gray-100 text-gray-700 border border-gray-200";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat data fleet request...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-2">
            <div className="mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
                                <Navigation className="h-8 w-8 text-blue-600 mr-3" />
                                Admin Fleet Management
                            </h1>
                            <p className="text-gray-600 mt-2">Kelola semua permintaan fleet dari user</p>
                        </div>
                        <button
                            className="flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium mt-4 lg:mt-0"
                            onClick={() => navigate("/fleet/route")}
                        >
                            <Navigation className="h-4 w-4 mr-2" />
                            Generate Route
                        </button>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Cari User atau ID Request</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari berdasarkan nama user atau ID request..."
                                    className="w-full pl-10 bg-white text-black pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status Fleet</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-4 py-3 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                                <option value="all">Semua Status</option>
                                <option value="pending">Pending</option>
                                <option value="process">Process</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Prioritas</label>
                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="w-full px-4 py-3 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                                <option value="all">Semua Prioritas</option>
                                <option value="priority">Priority</option>
                                <option value="normal">Normal</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tabel Utama */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                    <div className="px-6 py-4 border-b bg-blue-50 border-blue-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <h3 className="text-lg font-semibold text-blue-700">
                                    Semua Fleet Requests
                                </h3>
                                <span className="ml-3 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                    {sortedData.length} requests
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr className="border-b border-gray-200">
                                    <th className="py-4 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                                    <th className="py-4 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Request</th>
                                    <th className="py-4 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Peminta</th>
                                    <th className="py-4 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasi Tujuan</th>
                                    <th className="py-4 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Request</th>
                                    <th className="py-4 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                                    <th className="py-4 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                                    <th className="py-4 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Request</th>
                                    <th className="py-4 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasi</th>
                                    <th className="py-4 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Fleet</th>
                                    <th className="py-4 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                    <th className="py-4 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedData.map((item, index) => (
                                    <tr key={item.ship_request_id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {(page - 1) * pageSize + index + 1}
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                    {item.ship_request_id}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Ship className="h-4 w-4 text-blue-400 mr-2" />
                                                <span className="text-sm font-medium text-gray-900">{item.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Ship className="h-4 w-4 text-blue-400 mr-2" />
                                                <span className="text-sm font-medium text-gray-900">{item.destination_name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                                            {item.kategori_request?.replace("_", " ")}
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-600">
                                            {item.jenis_material || "-"}
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Package className="h-4 w-4 text-green-400 mr-2" />
                                                <span className="text-sm text-gray-600">
                                                    <span className="font-medium">{item.kuantitas}</span> {item.satuan}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Calendar className="h-4 w-4 text-purple-400 mr-2" />
                                                <span className="text-sm text-gray-600">
                                                    {new Date(item.tanggal_request).toLocaleString("id-ID", {
                                                        dateStyle: "medium",
                                                        timeStyle: "short",
                                                    })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <MapPin className="h-4 w-4 text-red-400 mr-2" />
                                                <span className="text-sm text-gray-600 font-mono">
                                                    {item.kordinat_request}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${getFleetStatusClass(item.fleet_status)}`}>
                                                {item.fleet_status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                                                {item.fleet_status === "approved" && <CheckCircle className="h-3 w-3 mr-1" />}
                                                {item.fleet_status === "process" && <Clock className="h-3 w-3 mr-1" />}
                                                {item.fleet_status === "completed" && <CheckCircle className="h-3 w-3 mr-1" />}
                                                {item.fleet_status || "Unknown"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${item.priority_request === "priority"
                                                ? "bg-red-100 text-red-700 border border-red-200 flex items-center"
                                                : "bg-gray-100 text-gray-700 border border-gray-200"
                                                }`}>
                                                {item.priority_request === "priority" && <AlertTriangle className="h-3 w-3 mr-1" />}
                                                {item.priority_request || "Normal"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            {item.fleet_status === "pending" ? (
                                                <button
                                                    className="flex items-center px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                                                    onClick={() => handleApprove(item.ship_request_id)}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    Process
                                                </button>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1.5 bg-green-300 text-black rounded-full text-xs font-medium">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Process
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {sortedData.length === 0 && (
                        <div className="text-center py-16 px-6">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data</h3>
                            <p className="text-gray-600">Tidak ada request yang sesuai dengan filter yang dipilih.</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {sortedData.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-gray-600 mb-4 sm:mb-0">
                                Menampilkan <span className="font-medium">{(page - 1) * pageSize + 1}</span> -{" "}
                                <span className="font-medium">{Math.min(page * pageSize, sortedData.length)}</span> dari{" "}
                                <span className="font-medium">{sortedData.length}</span> entries
                            </p>

                            <div className="flex items-center space-x-2">
                                <button
                                    className="p-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                    disabled={page === 1}
                                >
                                    <ChevronLeftIcon className="h-4 w-4" />
                                </button>

                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        className={`w-10 h-10 rounded-lg border transition-colors ${page === i + 1
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "border-gray-300 hover:bg-gray-50 text-gray-700"
                                            }`}
                                        onClick={() => setPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}

                                <button
                                    className="p-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                                    disabled={page === totalPages}
                                >
                                    <ChevronRightIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FleetEntries;