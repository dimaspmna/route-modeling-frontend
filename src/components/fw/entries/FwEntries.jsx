import { useState, useEffect } from "react";
import { Pencil, Check, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import EditFwEntries from "./EditFwEntries";
import API from "../../../api/Api";

const FwEntries = () => {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [editData, setEditData] = useState(null);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");

    const pageSize = 10;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await API.get("/get-fw-request");
                setData(res.data || []);
            } catch (err) {
                console.error("Gagal ambil data fresh water:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredData = data.filter((item) => {
        const matchesSearch = item.name?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus =
            statusFilter === "all" ||
            item.status_request?.toLowerCase().includes(statusFilter.toLowerCase());
        const matchesPriority =
            priorityFilter === "all" || item.priority_request === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    const paginatedData = filteredData.slice(
        (page - 1) * pageSize,
        page * pageSize
    );
    const totalPages = Math.ceil(filteredData.length / pageSize);

    const handleSaveEdit = (updatedItem) => {
        const updatedData = data.map((item) =>
            item.ship_request_id === updatedItem.ship_request_id ? updatedItem : item
        );
        setData(updatedData);
        setEditData(null);
    };

    // 🔹 Update cepat status approve/reject
    const handleQuickUpdate = async (item, newStatus) => {
        try {
            await API.put(`/fw-request/${item.ship_request_id}`, {
                ...item,
                status_request: newStatus,
            });

            const updatedData = data.map((d) =>
                d.ship_request_id === item.ship_request_id
                    ? { ...d, status_request: newStatus }
                    : d
            );
            setData(updatedData);
        } catch (err) {
            console.error("Update status error:", err);
            alert("Gagal memperbarui status");
        }
    };

    const getStatusClass = (status) => {
        if (!status) return "bg-gray-100 text-gray-700";
        const s = status.toLowerCase();
        if (s.includes("ditolak") || s.includes("reject"))
            return "bg-red-100 text-red-700 border border-red-200";
        if (s.includes("menunggu") || s.includes("waiting approval") || s.includes("pending"))
            return "bg-yellow-100 text-yellow-700 border border-yellow-200";
        if (s.includes("delivered") || s.includes("complete"))
            return "bg-blue-100 text-blue-700 border border-blue-200";
        if (s.includes("success") || s.includes("approved")|| s.includes("process to fleet team"))
            return "bg-green-100 text-green-700 border border-green-200";
        if (s.includes("process"))
            return "bg-purple-100 text-purple-700 border border-purple-200";
        return "bg-gray-100 text-gray-700 border border-gray-200";
    };

    const getPriorityBadge = (priority) => {
        return priority === "priority"
            ? "bg-red-100 text-red-700 border border-red-200 px-2 py-1 rounded-full text-xs font-medium"
            : "bg-gray-100 text-gray-700 border border-gray-200 px-2 py-1 rounded-full text-xs font-medium";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat data fresh water request...</p>
                </div>
            </div>
        );
    }

    const renderTable = (rows, title) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            {title && (
                <div className="px-6 py-4 border-b bg-gray-50 border-gray-200">
                    <div className="flex items-center">
                        <h3 className="text-lg font-semibold text-gray-700">
                            {title}
                        </h3>
                        <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {rows.length} requests
                        </span>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-blue-100">
                        <tr className="border-b border-gray-200">
                            <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                            <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Peminta</th>
                            <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasi Tujuan</th>
                            <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis</th>
                            <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                            <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Request</th>
                            <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Koordinat Tujuan</th>
                            <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fleet Status</th>
                            <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                            <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {rows.map((item, index) => (
                            <tr key={item.ship_request_id} className="hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-6 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {(page - 1) * pageSize + index + 1}
                                </td>
                                <td className="py-4 px-6 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {item.name}
                                </td>
                                <td className="py-4 px-6 whitespace-nowrap text-sm font-medium text-gray-900">
                                    <span className="bg-green-200 p-2 rounded-md ">{item.destination_name}</span>
                                </td>
                                <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-600">
                                    {item.kategori_request}
                                </td>
                                <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-600">
                                    <span className="font-medium">{item.kuantitas}</span> {item.satuan}
                                </td>
                                <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-600">
                                    {new Date(item.tanggal_request).toLocaleString("id-ID", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    })}
                                </td>
                                <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-600 font-mono">
                                    {item.kordinat_request}
                                </td>
                                <td className="py-4 px-6 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(item.status_request)}`}>
                                        {item.status_request}
                                    </span>
                                </td>
                                <td className="py-4 px-6 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        {/* Fleet Status Badge */}
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(
                                                item.fleet_status
                                            )}`}
                                        >
                                            {item.fleet_status?.toLowerCase() === "waiting approval"
                                                ? "Pending"
                                                : item.fleet_status}
                                        </span>
                                    </div>
                                </td>

                                <td className="py-4 px-6 whitespace-nowrap">
                                    <span className={getPriorityBadge(item.priority_request)}>
                                        {item.priority_request || "Normal"}
                                    </span>
                                </td>
                                <td className="py-4 px-6 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center space-x-2">
                                        {/* ✅ Approve */}
                                        <button
                                            className="text-green-600 hover:text-green-800 p-1.5 rounded-lg hover:bg-green-50 transition-colors"
                                            onClick={() => handleQuickUpdate(item, "process to fleet team")}
                                            title="Approve"
                                        >
                                            <Check size={16} />
                                        </button>
                                        {/* ✏️ Edit */}
                                        <button
                                            className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                                            onClick={() => setEditData(item)}
                                            title="Edit"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        {/* ❌ Reject */}
                                        <button
                                            className="text-red-600 hover:text-red-800 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                            onClick={() => handleQuickUpdate(item, "rejected")}
                                            title="Reject"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {rows.length === 0 && (
                <div className="text-center py-12 px-6">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada data</h3>
                    <p className="text-gray-600">Tidak ada request yang sesuai dengan filter.</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Fresh Water Management</h1>
                            <p className="text-gray-600 mt-1">Kelola semua permintaan fresh water dari user</p>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Cari Nama User</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari nama user..."
                                    className="w-full bg-white text-black pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                {renderTable(paginatedData, "Fresh Water Requests")}

                {/* Pagination */}
                {filteredData.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-gray-600 mb-4 sm:mb-0">
                                Menampilkan <span className="font-medium">{(page - 1) * pageSize + 1}</span> -{" "}
                                <span className="font-medium">{Math.min(page * pageSize, filteredData.length)}</span> dari{" "}
                                <span className="font-medium">{filteredData.length}</span> entries
                            </p>

                            <div className="flex items-center space-x-2">
                                <button
                                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                    disabled={page === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        className={`w-10 h-10 rounded-lg border ${page === i + 1
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "border-gray-300 hover:bg-gray-100"
                                            } transition-colors`}
                                        onClick={() => setPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}

                                <button
                                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                                    disabled={page === totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {editData && (
                <EditFwEntries
                    data={editData}
                    onSave={handleSaveEdit}
                    onCancel={() => setEditData(null)}
                />
            )}
        </div>
    );
};

export default FwEntries;
