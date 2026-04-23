import React, { useEffect, useState } from "react";
import L from "leaflet";
import API from "../../api/Api";
import "leaflet/dist/leaflet.css";

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const getFuelLossDisplay = (fuelChange) => {
    const value = parseFloat(fuelChange || 0);

    // Jika fuel saving (negatif atau 0)
    if (value <= 0) {
        const absoluteValue = Math.abs(value);
        return {
            display: `${absoluteValue.toFixed(2)} L`,
            value: absoluteValue,
            isPositive: false,
            color: "text-green-600",
            bgColor: "bg-green-50",
            label: "Fuel Saving",
            icon: "↓", // Opsional: tambah icon
        };
    }

    // Jika fuel loss (positif)
    return {
        display: `+${value.toFixed(2)} L`,
        value: value,
        isPositive: true,
        color: "text-red-600",
        bgColor: "bg-red-50",
        label: "Fuel Loss",
        icon: "↑", // Opsional: tambah icon
    };
};

const SpvApproval = () => {
    const [pendingRoutes, setPendingRoutes] = useState([]);
    const [pendingReroutes, setPendingReroutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [selectedReroute, setSelectedReroute] = useState(null);
    const [activeTab, setActiveTab] = useState("priority"); // "priority" or "reroute"
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        pendingReroutes: 0,
    });
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [showRerouteRejectionModal, setShowRerouteRejectionModal] = useState(false);
    const [showRerouteApprovalModal, setShowRerouteApprovalModal] = useState(false);
    const [approvalForm, setApprovalForm] = useState({
        nama: "",
        jabatan: "",
        bertanggungJawab: false,
    });
    const [formErrors, setFormErrors] = useState({});

    // Fetch data rute yang perlu approval
    const fetchPendingRoutes = async () => {
        try {
            setLoading(true);
            const [routesResponse, reroutesResponse] = await Promise.all([API.get("/routes-pending-approval"), API.get("/reroute-approvals/pending")]);

            const routes = routesResponse.data.pending_routes || [];
            const reroutes = reroutesResponse.data.data || [];

            console.log("📊 Reroutes data:", reroutes); // Debug log

            setPendingRoutes(routes);
            setPendingReroutes(reroutes);

            // Update stats
            setStats((prev) => ({
                ...prev,
                pending: routes.length,
                pendingReroutes: reroutes.length,
                total: routes.length + reroutes.length,
            }));
        } catch (error) {
            console.error("Error fetching pending data:", error);
            alert("Gagal mengambil data pending");
        } finally {
            setLoading(false);
        }
    };

    // Fungsi untuk mapping region ke display name
    const getRegionDisplayName = (regionCode) => {
        const regionMap = {
            central: "Transko Harmony",
            north: "OCB Tanjung Lesung",
            south: "Pulau Pabelokan",
            fleet: "Admin Fleet",
        };

        return regionMap[regionCode] || regionCode || "Unknown Region";
    };

    useEffect(() => {
        fetchPendingRoutes();

        // Real-time updates every 30 seconds
        const interval = setInterval(fetchPendingRoutes, 30000);
        return () => clearInterval(interval);
    }, []);

    // Handle approval untuk rute priority
    const handleApprove = async () => {
        // Validasi form
        const errors = {};
        if (!approvalForm.nama.trim()) errors.nama = "Nama harus diisi";
        if (!approvalForm.jabatan.trim()) errors.jabatan = "Jabatan harus diisi";
        if (!approvalForm.bertanggungJawab) errors.bertanggungJawab = "Anda harus menyetujui pernyataan tanggung jawab";

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            const user_id = "SPV_USER_ID"; // Ganti dengan user ID dari context/authentication

            await API.post(`/approve-route/${selectedRoute.id_rute_destinasi}`, {
                action: "approve",
                user_id: user_id,
                catatan: `${approvalForm.nama} - ${approvalForm.jabatan}`,
            });

            alert("Rute berhasil disetujui!");
            setShowApprovalModal(false);
            resetApprovalForm();
            fetchPendingRoutes();
            setSelectedRoute(null);
        } catch (error) {
            console.error("Error approving route:", error);
            alert(error.response?.data?.msg || "Gagal menyetujui rute");
        }
    };

    // Handle rejection untuk rute priority
    const handleReject = async (routeId) => {
        try {
            const user_id = "SPV_USER_ID"; // Ganti dengan user ID dari context/authentication

            await API.post(`/approve-route/${routeId}`, {
                action: "reject",
                user_id: user_id,
                reason: "-", // 🔥 SELALU KIRIM "-" SEBAGAI ALASAN
            });

            alert("Rute berhasil ditolak!");
            setShowRejectionModal(false);
            fetchPendingRoutes();
            setSelectedRoute(null);
        } catch (error) {
            console.error("Error rejecting route:", error);
            alert(error.response?.data?.msg || "Gagal menolak rute");
        }
    };

    // Handle approval untuk reroute - DIPERBAIKI
    const handleApproveReroute = async () => {
        // Validasi form
        const errors = {};
        if (!approvalForm.nama.trim()) errors.nama = "Nama harus diisi";
        if (!approvalForm.jabatan.trim()) errors.jabatan = "Jabatan harus diisi";

        const fuelLossValue = parseFloat(selectedReroute?.fuel_change || 0);
        const fuelLossInfo = getFuelLossDisplay(fuelLossValue);

        if (fuelLossInfo.isPositive && !approvalForm.bertanggungJawab) {
            errors.bertanggungJawab = "Anda harus menyetujui pernyataan tanggung jawab untuk fuel loss";
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            console.log("🔄 Approving reroute dengan ID:", selectedReroute.id_approval);

            // 1. Approve reroute approval
            const approveResponse = await API.patch(`/reroute-approvals/${selectedReroute.id_approval}`, {
                status: "approved",
                approved_by: 1, // Ganti dengan user ID dari context/authentication
                approval_notes: `${approvalForm.nama} - ${approvalForm.jabatan}`,
            });

            console.log("✅ Reroute approved:", approveResponse.data);

            // 2. Execute reroute - DIPERBAIKI: gunakan id_approval bukan id_rute_destinasi
            const executeResponse = await API.post(`/execute-reroute/${selectedReroute.id_approval}`);

            console.log("🚀 Reroute executed:", executeResponse.data);

            alert("Re-route berhasil disetujui dan dieksekusi!");
            setShowRerouteApprovalModal(false);
            resetApprovalForm();
            fetchPendingRoutes();
            setSelectedReroute(null);
        } catch (error) {
            console.error("❌ Error approving reroute:", error);
            const errorMessage = error.response?.data?.message || error.response?.data?.msg || "Gagal menyetujui re-route";
            alert(errorMessage);
        }
    };

    // Handle rejection untuk reroute
    const handleRejectReroute = async (approvalId) => {
        try {
            await API.patch(`/reroute-approvals/${approvalId}`, {
                status: "rejected",
                rejected_by: 1, // Ganti dengan user ID dari context/authentication
                rejection_reason: "Ditolak oleh SPV",
            });

            alert("Re-route berhasil ditolak!");
            setShowRerouteRejectionModal(false);
            fetchPendingRoutes();
            setSelectedReroute(null);
        } catch (error) {
            console.error("Error rejecting reroute:", error);
            alert(error.response?.data?.message || "Gagal menolak re-route");
        }
    };

    // Reset approval form
    const resetApprovalForm = () => {
        setApprovalForm({
            nama: "",
            jabatan: "",
            bertanggungJawab: false,
        });
        setFormErrors({});
    };

    // Handle form input changes
    const handleFormChange = (field, value) => {
        setApprovalForm((prev) => ({
            ...prev,
            [field]: value,
        }));

        // Clear error when user starts typing
        if (formErrors[field]) {
            setFormErrors((prev) => ({
                ...prev,
                [field]: "",
            }));
        }
    };

    // Open approval modal untuk priority route
    const openApprovalModal = () => {
        resetApprovalForm();
        setShowApprovalModal(true);
    };

    // Open approval modal untuk reroute
    const openRerouteApprovalModal = () => {
        resetApprovalForm();
        setShowRerouteApprovalModal(true);
    };

    // Get priority badge color
    const getPriorityColor = (priorityLevel) => {
        switch (priorityLevel) {
            case "urgent":
                return "bg-red-100 text-red-800 border-red-200";
            case "high":
                return "bg-orange-100 text-orange-800 border-orange-200";
            case "normal":
                return "bg-blue-100 text-blue-800 border-blue-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    // Get point type color
    const getPointTypeColor = (pointType) => {
        switch (pointType) {
            case "start":
                return "bg-green-500";
            case "end":
                return "bg-blue-500";
            case "visit":
                return "bg-gray-500";
            default:
                return "bg-gray-400";
        }
    };

    // Get point type label
    const getPointTypeLabel = (pointType) => {
        switch (pointType) {
            case "start":
                return "Start";
            case "end":
                return "End";
            case "visit":
                return "Visit";
            default:
                return pointType;
        }
    };

    // Calculate reroute changes - DIPERBAIKI
    const calculateRerouteChanges = (rerouteData) => {
        if (!rerouteData) return {};

        try {
            // Handle case where reroute_data is string JSON
            const data = typeof rerouteData === "string" ? JSON.parse(rerouteData) : rerouteData;

            const originalPoints = data.originalPoints || [];
            const newPoints = data.newPoints || [];

            const addedPoints = newPoints.filter((newPoint) => !originalPoints.some((original) => original.id_monitoring === newPoint.id_monitoring));

            const removedPoints = originalPoints.filter((original) => !newPoints.some((newPoint) => newPoint.id_monitoring === original.id_monitoring));

            return {
                addedPoints,
                removedPoints,
                originalDistance: data.changes?.originalDistance || 0,
                newDistance: data.changes?.newDistance || 0,
                distanceChange: data.changes?.distanceChange || 0,
                fuelChange: data.changes?.fuelChange || 0,
            };
        } catch (error) {
            console.error("Error calculating reroute changes:", error);
            return {};
        }
    };

    // Helper function untuk calculate distance
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371000;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Helper function untuk calculate route distance
    const calculateRouteDistance = (points) => {
        if (!points || points.length < 2) return 0;

        let totalDistance = 0;
        for (let i = 1; i < points.length; i++) {
            const prevPoint = points[i - 1];
            const currentPoint = points[i];

            if (prevPoint && currentPoint) {
                const distance = calculateDistance(prevPoint.latitude, prevPoint.longitude, currentPoint.latitude, currentPoint.longitude);
                totalDistance += distance / 1000;
            }
        }
        return totalDistance;
    };

    // Helper function untuk calculate fuel consumption
    const calculateFuelConsumption = (distance, fuelRate = 0.25) => {
        return distance * fuelRate;
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Get changes data untuk selected reroute
    const getRerouteChanges = () => {
        if (!selectedReroute || !selectedReroute.reroute_data) return {};
        return calculateRerouteChanges(selectedReroute.reroute_data);
    };

    const changes = getRerouteChanges();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Rejection Modal untuk Priority Route */}
            {showRejectionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-80">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Konfirmasi Penolakan</h3>
                        <p className="text-gray-600 mb-6">Apakah Anda yakin ingin menolak rute ini?</p>
                        <div className="flex space-x-3">
                            <button onClick={() => setShowRejectionModal(false)} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors">
                                Batal
                            </button>
                            <button onClick={() => handleReject(selectedRoute.id_rute_destinasi)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors">
                                Ya, Tolak Rute
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Modal untuk Reroute */}
            {showRerouteRejectionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-80">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Konfirmasi Penolakan Re-Route</h3>
                        <p className="text-gray-600 mb-6">Apakah Anda yakin ingin menolak permintaan re-route ini?</p>
                        <div className="flex space-x-3">
                            <button onClick={() => setShowRerouteRejectionModal(false)} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors">
                                Batal
                            </button>
                            <button onClick={() => handleRejectReroute(selectedReroute.id_approval)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors">
                                Ya, Tolak Re-Route
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approval Modal untuk Priority Route */}
            {showApprovalModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Persetujuan Rute</h3>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
                                <input
                                    type="text"
                                    value={approvalForm.nama}
                                    onChange={(e) => handleFormChange("nama", e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black ${
                                        formErrors.nama ? "border-red-500" : "border-gray-300"
                                    }`}
                                    placeholder="Masukkan nama lengkap"
                                />
                                {formErrors.nama && <p className="text-red-500 text-xs mt-1">{formErrors.nama}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan *</label>
                                <input
                                    type="text"
                                    value={approvalForm.jabatan}
                                    onChange={(e) => handleFormChange("jabatan", e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black ${
                                        formErrors.jabatan ? "border-red-500" : "border-gray-300"
                                    }`}
                                    placeholder="Masukkan jabatan"
                                />
                                {formErrors.jabatan && <p className="text-red-500 text-xs mt-1">{formErrors.jabatan}</p>}
                            </div>

                            <div className="flex items-start space-x-3">
                                <input
                                    type="checkbox"
                                    id="bertanggungJawab"
                                    checked={approvalForm.bertanggungJawab}
                                    onChange={(e) => handleFormChange("bertanggungJawab", e.target.checked)}
                                    className={`mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 ${formErrors.bertanggungJawab ? "border-red-500" : "border-gray-300"}`}
                                />
                                <label htmlFor="bertanggungJawab" className="text-sm text-gray-700">
                                    Saya menyetujui dan bertanggung jawab penuh atas potensi fuel loss sebesar{" "}
                                    <span className="font-semibold text-red-600">+{selectedRoute ? parseFloat(selectedRoute.fuel_loss).toFixed(2) : "0"} L</span> yang ditimbulkan oleh rute ini.
                                </label>
                            </div>
                            {formErrors.bertanggungJawab && <p className="text-red-500 text-xs mt-1">{formErrors.bertanggungJawab}</p>}
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => {
                                    setShowApprovalModal(false);
                                    resetApprovalForm();
                                }}
                                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                            >
                                Batal
                            </button>
                            <button onClick={handleApprove} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors font-semibold">
                                Setujui Rute
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approval Modal untuk Reroute */}
            {showRerouteApprovalModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Persetujuan Re-Route</h3>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
                                <input
                                    type="text"
                                    value={approvalForm.nama}
                                    onChange={(e) => handleFormChange("nama", e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black ${
                                        formErrors.nama ? "border-red-500" : "border-gray-300"
                                    }`}
                                    placeholder="Masukkan nama lengkap"
                                />
                                {formErrors.nama && <p className="text-red-500 text-xs mt-1">{formErrors.nama}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan *</label>
                                <input
                                    type="text"
                                    value={approvalForm.jabatan}
                                    onChange={(e) => handleFormChange("jabatan", e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black ${
                                        formErrors.jabatan ? "border-red-500" : "border-gray-300"
                                    }`}
                                    placeholder="Masukkan jabatan"
                                />
                                {formErrors.jabatan && <p className="text-red-500 text-xs mt-1">{formErrors.jabatan}</p>}
                            </div>

                            <div className="flex items-start space-x-3">
                                <input
                                    type="checkbox"
                                    id="bertanggungJawabReroute"
                                    checked={approvalForm.bertanggungJawab}
                                    onChange={(e) => handleFormChange("bertanggungJawab", e.target.checked)}
                                    className={`mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 ${formErrors.bertanggungJawab ? "border-red-500" : "border-gray-300"}`}
                                />
                                <label htmlFor="bertanggungJawabReroute" className="text-sm text-gray-700">
                                    {getFuelLossDisplay(selectedReroute?.fuel_change).isPositive ? (
                                        <>
                                            Saya menyetujui dan bertanggung jawab penuh atas perubahan rute ini dengan potensi fuel loss sebesar{" "}
                                            <span className="font-semibold text-red-600">{getFuelLossDisplay(selectedReroute.fuel_change).display}</span>.
                                        </>
                                    ) : (
                                        <>
                                            Saya menyetujui perubahan rute ini yang menghasilkan{" "}
                                            <span className="font-semibold text-green-600">efisiensi fuel sebesar {Math.abs(parseFloat(selectedReroute?.fuel_change || 0)).toFixed(2)} L</span>.
                                        </>
                                    )}
                                </label>
                            </div>
                            {formErrors.bertanggungJawab && <p className="text-red-500 text-xs mt-1">{formErrors.bertanggungJawab}</p>}

                            {/* Reroute Summary */}
                            {selectedReroute && (
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <h4 className="font-medium text-blue-800 mb-2">Ringkasan Perubahan:</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-blue-700">Titik Ditambah:</span>
                                            <div className="font-medium text-blue-900">{selectedReroute.points_added || 0}</div>
                                        </div>
                                        <div>
                                            <span className="text-blue-700">Titik Dihapus:</span>
                                            <div className="font-medium text-blue-900">{selectedReroute.points_removed || 0}</div>
                                        </div>
                                        <div>
                                            <span className="text-blue-700">Perubahan Jarak:</span>
                                            <div className={`font-medium ${selectedReroute.distance_change > 0 ? "text-red-600" : "text-green-600"}`}>
                                                {selectedReroute.distance_change > 0 ? "+" : ""}
                                                {parseFloat(selectedReroute.distance_change || 0).toFixed(2)} km
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-blue-700">{getFuelLossDisplay(selectedReroute?.fuel_change).label || "Fuel Change"}:</span>
                                            <div className={`font-medium ${getFuelLossDisplay(selectedReroute?.fuel_change).color}`}>{getFuelLossDisplay(selectedReroute?.fuel_change).display}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => {
                                    setShowRerouteApprovalModal(false);
                                    resetApprovalForm();
                                }}
                                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                            >
                                Batal
                            </button>
                            <button onClick={handleApproveReroute} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors font-semibold">
                                Setujui Re-Route
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Approval Supervisor</h1>
                            <p className="text-gray-600">Kelola Persetujuan Rute & Re-Route</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            {/* Stats */}
                            <div className="flex space-x-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                                    <div className="text-xs text-gray-500">Total</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                                    <div className="text-xs text-gray-500">Rute Priority</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-600">{stats.pendingReroutes}</div>
                                    <div className="text-xs text-gray-500">Re-Route</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Tab Navigation */}
                <div className="bg-white rounded-lg shadow-sm border mb-6">
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab("priority")}
                            className={`flex-1 py-4 px-6 text-center font-medium ${activeTab === "priority" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Rute Priority ({stats.pending})
                        </button>
                        <button
                            onClick={() => setActiveTab("reroute")}
                            className={`flex-1 py-4 px-6 text-center font-medium ${activeTab === "reroute" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Permintaan Re-Route ({stats.pendingReroutes})
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Sidebar - List Pending Items */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border">
                            <div className="p-4 border-b">
                                <h2 className="text-lg font-semibold text-gray-900">{activeTab === "priority" ? "Rute Priority Pending" : "Permintaan Re-Route Pending"}</h2>
                                <p className="text-sm text-gray-500">
                                    {activeTab === "priority" ? `${pendingRoutes.length} rute menunggu persetujuan` : `${pendingReroutes.length} permintaan re-route menunggu persetujuan`}
                                </p>
                            </div>

                            <div className="max-h-[600px] overflow-y-auto">
                                {activeTab === "priority" ? (
                                    pendingRoutes.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <div className="text-gray-400 mb-2">
                                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <p className="text-gray-500">Tidak ada rute priority yang pending</p>
                                        </div>
                                    ) : (
                                        pendingRoutes.map((route) => (
                                            <div
                                                key={route.id_rute_destinasi}
                                                className={`p-4 border-b cursor-pointer transition-colors hover:bg-gray-50 ${
                                                    selectedRoute?.id_rute_destinasi === route.id_rute_destinasi ? "bg-blue-50 border-blue-200" : ""
                                                }`}
                                                onClick={() => {
                                                    setSelectedRoute(route);
                                                    setSelectedReroute(null);
                                                }}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">{route.nama_rute}</h3>
                                                        <p className="text-sm text-gray-600">{route.ship_name}</p>
                                                    </div>
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center">
                                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                        priority
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                                                    <div>
                                                        <span className="text-gray-500">Jarak:</span>
                                                        <div className="font-medium">{parseFloat(route.jarak_tempuh).toFixed(2)} km</div>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Fuel:</span>
                                                        <div className="font-medium">{parseFloat(route.konsumsi_fuel).toFixed(2)} L</div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">+{parseFloat(route.fuel_loss).toFixed(2)} L potensi fuel loss</div>
                                                    <div className="text-xs text-gray-500">{Math.max((route.visited_requests?.length || 0) - 2, 0)} stops</div>
                                                </div>
                                            </div>
                                        ))
                                    )
                                ) : pendingReroutes.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <div className="text-gray-400 mb-2">
                                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-500">Tidak ada permintaan re-route yang pending</p>
                                    </div>
                                ) : (
                                    pendingReroutes.map((reroute) => (
                                        <div
                                            key={reroute.id_approval}
                                            className={`p-4 border-b cursor-pointer transition-colors hover:bg-gray-50 ${
                                                selectedReroute?.id_approval === reroute.id_approval ? "bg-blue-50 border-blue-200" : ""
                                            }`}
                                            onClick={() => {
                                                setSelectedReroute(reroute);
                                                setSelectedRoute(null);
                                            }}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{reroute.nama_rute}</h3>
                                                    <p className="text-sm text-gray-600">{reroute.ship_name}</p>
                                                </div>
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 flex items-center">
                                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    re-route
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                                                <div>
                                                    <span className="text-gray-500">Perubahan:</span>
                                                    <div className="font-medium">
                                                        +{reroute.points_added || 0}/-{reroute.points_removed || 0} titik
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">{getFuelLossDisplay(reroute.fuel_change).label || "Fuel Change"}:</span>
                                                    <div className={`font-medium ${getFuelLossDisplay(reroute.fuel_change).color}`}>{getFuelLossDisplay(reroute.fuel_change).display}</div>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">{formatDate(reroute.requested_at)}</div>
                                                <div className="text-xs text-gray-500">Diajukan : {getRegionDisplayName(reroute.region)}</div>
                                            </div>

                                            {reroute.reroute_reason && (
                                                <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                                    <strong>Alasan:</strong> {reroute.reroute_reason}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Content - Details & Actions */}
                    <div className="lg:col-span-2">
                        {activeTab === "priority" ? (
                            selectedRoute ? (
                                <div className="space-y-6">
                                    {/* Route Details Card */}
                                    <div className="bg-white rounded-lg shadow-sm border">
                                        <div className="p-6 border-b">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h2 className="text-xl font-bold text-gray-900">{selectedRoute.nama_rute}</h2>
                                                    <p className="text-gray-600">{selectedRoute.ship_name}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 flex items-center">
                                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                        pending
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            {/* Route Summary */}
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                                <div className="bg-blue-50 p-4 rounded-lg">
                                                    <div className="text-blue-600 font-semibold text-sm">Total Jarak</div>
                                                    <div className="text-xl font-bold text-gray-900">{parseFloat(selectedRoute.jarak_tempuh).toFixed(2)} km</div>
                                                </div>
                                                <div className="bg-green-50 p-4 rounded-lg">
                                                    <div className="text-green-600 font-semibold text-sm">Konsumsi Fuel</div>
                                                    <div className="text-xl font-bold text-gray-900">{parseFloat(selectedRoute.konsumsi_fuel).toFixed(2)} L</div>
                                                </div>
                                                <div className="bg-red-50 p-4 rounded-lg">
                                                    <div className="text-red-600 font-semibold text-sm">Potensi Fuel Loss</div>
                                                    <div className="text-xl font-bold text-gray-900">+{parseFloat(selectedRoute.fuel_loss).toFixed(2)} L</div>
                                                </div>
                                                <div className="bg-purple-50 p-4 rounded-lg">
                                                    <div className="text-purple-600 font-semibold text-sm">Total Tujuan</div>
                                                    <div className="text-xl font-bold text-gray-900">{Math.max((selectedRoute.visited_requests?.length || 0) - 2, 0)}</div>
                                                </div>
                                            </div>

                                            {/* Horizontal Stepping Stone */}
                                            <div className="mb-6">
                                                <h3 className="font-semibold text-gray-900 mb-4">Stepping Stone Rute</h3>
                                                <div className="relative">
                                                    {/* Connection Line */}
                                                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-300 transform -translate-y-1/2"></div>

                                                    <div className="flex justify-between items-start relative z-10">
                                                        {selectedRoute.visited_requests?.map((point, index) => (
                                                            <div key={point.sequence} className="flex flex-col items-center w-24">
                                                                {/* Point Circle */}
                                                                <div
                                                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm mb-2 ${getPointTypeColor(
                                                                        point.point_type
                                                                    )}`}
                                                                >
                                                                    {point.sequence}
                                                                </div>

                                                                {/* Point Name */}
                                                                <div className="text-center">
                                                                    <div className="font-medium text-gray-900 text-xs mb-1 truncate w-full">{point.point_name}</div>

                                                                    {/* Priority Badge */}
                                                                    <span className={`px-1 py-0.5 rounded text-xs border ${getPriorityColor(point.priority_level)}`}>{point.priority_level}</span>

                                                                    {/* Point Type */}
                                                                    <div className="text-xs text-gray-500 mt-1">{getPointTypeLabel(point.point_type)}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex space-x-4 pt-4 border-t">
                                                <button
                                                    onClick={() => setShowRejectionModal(true)}
                                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center"
                                                >
                                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    Tolak Rute
                                                </button>
                                                <button
                                                    onClick={openApprovalModal}
                                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center"
                                                >
                                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Setujui Rute
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                                    <div className="text-gray-400 mb-4">
                                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-700 mb-2">Pilih Rute Prioritas</h3>
                                    <p className="text-gray-500">Pilih salah satu rute prioritas dari daftar di sebelah kiri untuk melihat detail dan mengambil keputusan</p>
                                </div>
                            )
                        ) : selectedReroute ? (
                            <div className="space-y-6">
                                {/* Reroute Details Card */}
                                <div className="bg-white rounded-lg shadow-sm border">
                                    <div className="p-6 border-b">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">Permintaan Re-Route: {selectedReroute.nama_rute}</h2>
                                                <p className="text-gray-600">{selectedReroute.ship_name}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 flex items-center">
                                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    re-route pending
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        {/* Reroute Summary */}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                            <div className="bg-blue-50 p-4 rounded-lg">
                                                <div className="text-blue-600 font-semibold text-sm">Titik Ditambah</div>
                                                <div className="text-xl font-bold text-gray-900">{selectedReroute.points_added || 0}</div>
                                            </div>
                                            <div className="bg-red-50 p-4 rounded-lg">
                                                <div className="text-red-600 font-semibold text-sm">Titik Dihapus</div>
                                                <div className="text-xl font-bold text-gray-900">{selectedReroute.points_removed || 0}</div>
                                            </div>
                                            <div className="bg-green-50 p-4 rounded-lg">
                                                <div className="text-green-600 font-semibold text-sm">Perubahan Jarak</div>
                                                <div className={`text-xl font-bold ${selectedReroute.distance_change > 0 ? "text-red-600" : "text-green-600"}`}>
                                                    {selectedReroute.distance_change > 0 ? "+" : ""}
                                                    {parseFloat(selectedReroute.distance_change || 0).toFixed(2)} km
                                                </div>
                                            </div>
                                            <div className={`p-4 rounded-lg ${getFuelLossDisplay(selectedReroute?.fuel_change).bgColor}`}>
                                                <div className={`font-semibold text-sm ${getFuelLossDisplay(selectedReroute?.fuel_change).color}`}>
                                                    {getFuelLossDisplay(selectedReroute?.fuel_change).label || "Fuel Change"}
                                                </div>
                                                <div className={`text-xl font-bold ${getFuelLossDisplay(selectedReroute?.fuel_change).color}`}>
                                                    {getFuelLossDisplay(selectedReroute?.fuel_change).display}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Alasan Reroute */}
                                        {selectedReroute.reroute_reason && (
                                            <div className="mb-6">
                                                <h3 className="font-semibold text-gray-900 mb-2">Alasan Re-Route</h3>
                                                <div className="bg-gray-50 p-4 rounded-lg border">
                                                    <p className="text-gray-700">{selectedReroute.reroute_reason}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Informasi Request */}
                                        <div className="mb-6">
                                            <h3 className="font-semibold text-gray-900 mb-3">Informasi Request</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-600">Diajukan :</span>
                                                    <div className="font-medium">{getRegionDisplayName(selectedReroute.region)}</div>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Tanggal Request:</span>
                                                    <div className="font-medium">{formatDate(selectedReroute.requested_at)}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Detail Perubahan */}
                                        {(changes.addedPoints?.length > 0 || changes.removedPoints?.length > 0) && (
                                            <div className="mb-6">
                                                <h3 className="font-semibold text-gray-900 mb-3">Detail Perubahan</h3>
                                                <div className="space-y-3">
                                                    {changes.addedPoints?.length > 0 && (
                                                        <div>
                                                            <h4 className="font-medium text-green-600 mb-2">Titik yang Ditambahkan:</h4>
                                                            <div className="space-y-2">
                                                                {changes.addedPoints.map((point, index) => (
                                                                    <div key={index} className="flex items-center p-2 bg-green-50 rounded border border-green-200">
                                                                        <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs mr-3">+</div>
                                                                        <div>
                                                                            <div className="font-medium">{point.point_name}</div>
                                                                            <div className="text-xs text-gray-600">
                                                                                {point.latitude?.toFixed(4)}, {point.longitude?.toFixed(4)}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {changes.removedPoints?.length > 0 && (
                                                        <div>
                                                            <h4 className="font-medium text-red-600 mb-2">Titik yang Dihapus:</h4>
                                                            <div className="space-y-2">
                                                                {changes.removedPoints.map((point, index) => (
                                                                    <div key={index} className="flex items-center p-2 bg-red-50 rounded border border-red-200">
                                                                        <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs mr-3">-</div>
                                                                        <div>
                                                                            <div className="font-medium">{point.point_name}</div>
                                                                            <div className="text-xs text-gray-600">
                                                                                {point.latitude?.toFixed(4)}, {point.longitude?.toFixed(4)}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex space-x-4 pt-4 border-t">
                                            <button
                                                onClick={() => setShowRerouteRejectionModal(true)}
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center"
                                            >
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                Tolak Re-Route
                                            </button>
                                            <button
                                                onClick={openRerouteApprovalModal}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center"
                                            >
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Setujui Re-Route
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                                <div className="text-gray-400 mb-4">
                                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1}
                                            d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-700 mb-2">Pilih Permintaan Re-Route</h3>
                                <p className="text-gray-500">Pilih salah satu permintaan re-route dari daftar di sebelah kiri untuk melihat detail dan mengambil keputusan</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpvApproval;
