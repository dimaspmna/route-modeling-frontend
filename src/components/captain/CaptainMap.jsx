import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, LayersControl } from "react-leaflet";
import L from "leaflet";
import API from "../../api/Api";
import "leaflet/dist/leaflet.css";
import IconPlatformNorth from "../../../src/assets/icon/icon_platform_north.svg";
import IconPlatformSouth from "../../../src/assets/icon/icon_platform_south.svg";
import IconPlatformCentral from "../../../src/assets/icon/icon_platform_central.svg";
import IconPlatformOther from "../../../src/assets/icon/icon_platform_other.svg";
import IconTanker from "../../../src/assets/icon/icon_Subsea_wellhead.svg";
import IconBoat from "../../../src/assets/icon/icon_boat.svg";
import IconKapalPengirim from "../../../src/assets/icon/icon_kapal_pengirim.svg";
import IconDestination from "../../../src/assets/icon/icon_destination.svg";

// Helper function untuk menghitung jarak antara dua koordinat (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Icon Marker
const destinationIcon = new L.Icon({
    iconUrl: IconDestination,
    iconSize: [60, 60],
    iconAnchor: [30, 55],
});

const startIcon = new L.Icon({
    iconUrl: IconKapalPengirim,
    iconSize: [60, 60],
    iconAnchor: [30, 40],
});

const endIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684857.png",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
});

const CaptainMap = () => {
    const [submittedRoutes, setSubmittedRoutes] = useState([]);
    const [routeMonitoring, setRouteMonitoring] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [selectedRoutePoints, setSelectedRoutePoints] = useState([]);
    const [shipPositions, setShipPositions] = useState({});
    const [realTimeTracking, setRealTimeTracking] = useState({});
    const [captainData, setCaptainData] = useState(null);
    
    // Data region
    const [regions, setRegions] = useState({
        central: [], north: [], south: [], tanker: [], other: [], ship: []
    });

    const regionIcons = {
        central: new L.Icon({
            iconUrl: IconPlatformCentral,
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            iconSize: [12, 12], iconAnchor: [4, 14], popupAnchor: [0, -11], shadowSize: [14, 14],
        }),
        north: new L.Icon({
            iconUrl: IconPlatformNorth,
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            iconSize: [12, 12], iconAnchor: [4, 14], popupAnchor: [0, -11], shadowSize: [14, 14],
        }),
        south: new L.Icon({
            iconUrl: IconPlatformSouth,
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            iconSize: [12, 12], iconAnchor: [4, 14], popupAnchor: [0, -11], shadowSize: [14, 14],
        }),
        tanker: new L.Icon({
            iconUrl: IconTanker,
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            iconSize: [12, 12], iconAnchor: [4, 14], popupAnchor: [0, -11], shadowSize: [14, 14],
        }),
        other: new L.Icon({
            iconUrl: IconPlatformOther,
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            iconSize: [12, 12], iconAnchor: [4, 14], popupAnchor: [0, -11], shadowSize: [14, 14],
        }),
        boat: new L.Icon({
            iconUrl: IconBoat,
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            iconSize: [12, 12], iconAnchor: [4, 14], popupAnchor: [0, -11], shadowSize: [14, 14],
        })
    };

    const mapRef = useRef();

    // Fetch captain data dari localStorage
    useEffect(() => {
        const fetchCaptainData = () => {
            try {
                const storedCaptain = localStorage.getItem('user');
                if (storedCaptain) {
                    const data = JSON.parse(storedCaptain);
                    if (data.user) {
                        setCaptainData(data.user);
                    } else if (data.id) {
                        setCaptainData(data);
                    }
                }
            } catch (err) {
                console.error("Error fetching captain data:", err);
            }
        };

        fetchCaptainData();
    }, []);

    // Fetch data awal - hanya rute untuk kapten yang login
    // Ganti useEffect fetchInitialData
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                
                // Fetch semua data
                const [routesRes, monitoringRes, regionsRes] = await Promise.all([
                    API.get("/rute-destinasi"),
                    API.get("/rute-monitoring"),
                    Promise.all([
                        API.get("/get-all/central-region"),
                        API.get("/get-all/north-region"),
                        API.get("/get-all/south-region"),
                        API.get("/get-all/tanker-rig-barge"),
                        API.get("/get-all/other-region"),
                        API.get("/ship-positions-all"),
                    ])
                ]);

                // Filter rute hanya untuk kapten yang login DAN belum selesai
                const allRoutes = routesRes.data || [];
                const captainRoutes = captainData ? 
                    allRoutes.filter(route => 
                        route.id_captain_ship === captainData.id && 
                        route.status_rute !== "completed" // FILTER: hanya rute belum selesai
                        && route.approval_status === "approved"
                    ) : 
                    [];

                setSubmittedRoutes(captainRoutes);

                const monitoringData = (monitoringRes.data || []).map(point => ({
                    ...point,
                    latitude: parseFloat(point.latitude),
                    longitude: parseFloat(point.longitude),
                }));
                setRouteMonitoring(monitoringData);

                const [central, north, south, tanker, other, ships] = regionsRes.map(res => res.data.data || []);
                setRegions({ central, north, south, tanker, other, ship: ships });

                const initialShipPositions = {};
                ships.forEach(ship => {
                    initialShipPositions[ship.mmsi] = {
                        lat: parseFloat(ship.lat),
                        lng: parseFloat(ship.lon),
                        name: ship.name,
                    };
                });
                setShipPositions(initialShipPositions);

            } catch (err) {
                console.error("Gagal ambil data:", err);
            } finally {
                setLoading(false);
            }
        };

        if (captainData) {
            fetchInitialData();
        }
    }, [captainData]);

    // Ganti useEffect auto-select
    useEffect(() => {
        if (submittedRoutes.length > 0 && !selectedRoute) {
            // Hanya pilih otomatis jika ada rute yang belum selesai
            const activeRoutes = submittedRoutes.filter(route => 
                route.status_rute !== "completed" && 
                ["Terjadwal", "dalam perjalanan", "Disetujui"].includes(route.status_rute)
            );
            
            if (activeRoutes.length > 0) {
                // Prioritaskan rute yang sedang berjalan
                const inProgressRoute = activeRoutes.find(route => route.status_rute === "dalam perjalanan");
                if (inProgressRoute) {
                    setSelectedRoute(inProgressRoute);
                    handleSelectRoute(inProgressRoute);
                } else {
                    // Jika tidak ada yang berjalan, pilih rute terjadwal pertama
                    setSelectedRoute(activeRoutes[0]);
                    handleSelectRoute(activeRoutes[0]);
                }
            }
            // Jika tidak ada rute aktif, biarkan selectedRoute tetap null
        }
    }, [submittedRoutes]);

    // Real-time ship tracking
    useEffect(() => {
        if (!submittedRoutes.length) return;

        const fetchShipPositions = async () => {
            try {
                const res = await API.get("/ship-positions-all");
                const ships = res.data.data || [];

                const updatedPositions = {};
                const updatedTracking = {};

                ships.forEach(ship => {
                    const shipPosition = {
                        lat: parseFloat(ship.lat),
                        lng: parseFloat(ship.lon),
                        name: ship.name,
                    };
                    updatedPositions[ship.mmsi] = shipPosition;

                    const activeRoutes = submittedRoutes.filter(
                        route => route.id_captain_ship === ship.mmsi && 
                        ["Terjadwal", "dalam perjalanan", "Disetujui"].includes(route.status_rute)
                    );

                    if (activeRoutes.length > 0) {
                        if (!realTimeTracking[ship.mmsi]) {
                            updatedTracking[ship.mmsi] = [shipPosition];
                        } else {
                            const existingTracking = [...realTimeTracking[ship.mmsi]];
                            const lastPosition = existingTracking[existingTracking.length - 1];
                            const distance = calculateDistance(
                                lastPosition.lat, lastPosition.lng,
                                shipPosition.lat, shipPosition.lng
                            );
                            
                            if (distance > 50) {
                                updatedTracking[ship.mmsi] = [...existingTracking, shipPosition];
                                if (updatedTracking[ship.mmsi].length > 100) {
                                    updatedTracking[ship.mmsi] = updatedTracking[ship.mmsi].slice(-100);
                                }
                            } else {
                                updatedTracking[ship.mmsi] = existingTracking;
                            }
                        }
                    }
                });

                setShipPositions(updatedPositions);
                if (Object.keys(updatedTracking).length > 0) {
                    setRealTimeTracking(prev => ({ ...prev, ...updatedTracking }));
                }

                checkProximityToPoints(updatedPositions);
            } catch (err) {
                console.error("Gagal ambil posisi kapal:", err);
            }
        };

        fetchShipPositions();
        const interval = setInterval(fetchShipPositions, 30000);
        return () => clearInterval(interval);
    }, [submittedRoutes]);

    // Helper functions
    const getRoutePoints = (routeId) => {
        return routeMonitoring
            .filter(point => point.id_rute_destinasi === routeId)
            .sort((a, b) => a.sequence - b.sequence);
    };

    const getRandomColor = (index) => {
        const colors = ["blue", "green", "red", "purple", "orange", "darkred", "lightred", "darkblue", "darkgreen"];
        return colors[index % colors.length];
    };

    const getStatusText = (status) => {
        switch (status) {
            case "completed": return "Selesai";
            case "in_progress": return "Dalam Proses";
            default: return "Menunggu";
        }
    };

    // Route management functions
    const updateRouteStatus = async (routeId, newStatus) => {
        try {
            await API.patch(`/rute-destinasi/${routeId}`, { status_rute: newStatus });
            setSubmittedRoutes(prev => prev.map(route => 
                route.id_rute_destinasi === routeId ? { ...route, status_rute: newStatus } : route
            ));
            if (selectedRoute?.id_rute_destinasi === routeId) {
                setSelectedRoute(prev => ({ ...prev, status_rute: newStatus }));
            }
            alert("Status rute berhasil diubah!");
        } catch (err) {
            console.error("Gagal mengubah status rute:", err);
            alert("Gagal mengubah status rute");
        }
    };

    const updateShipRequestStatus = async (pointId) => {
        try {
            const point = routeMonitoring.find(p => p.id_monitoring === pointId);
            if (!point) {
                console.error('Point tidak ditemukan');
                return;
            }

            if (point.ship_request_id) {
                await API.patch(`/update-fleet-status/${point.ship_request_id}`, {
                    fleet_status: "complete",
                });
                console.log(`Fleet status berhasil diubah menjadi: delivered untuk request ${point.ship_request_id}`);
            } else {
                console.warn('Point tidak memiliki ship_request_id:', point);
            }
        } catch (err) {
            console.error("Gagal mengubah fleet status:", err);
        }
    };

    // Fungsi untuk cek dan complete rute otomatis
    const checkAndCompleteRoute = async (routeId) => {
    try {
        console.log(`🔍 Checking auto-complete for route: ${routeId}`);
        
        // Ambil data monitoring terbaru untuk rute ini
        const monitoringRes = await API.get("/rute-monitoring");
        const allMonitoring = monitoringRes.data || [];
        
        const routePoints = allMonitoring
        .filter(point => point.id_rute_destinasi === routeId)
        .sort((a, b) => a.sequence - b.sequence);

        // Filter hanya titik yang bukan waypoint dan bukan start point
        const relevantPoints = routePoints.filter(point => 
        !/^waypoint_/i.test(point.point_id) && 
        point.point_type !== "start"
        );

        const totalPoints = relevantPoints.length;
        const completedPoints = relevantPoints.filter(point => point.status === "completed").length;

        console.log(`📊 Route ${routeId} completion status:`, {
        totalPoints,
        completedPoints,
        allCompleted: totalPoints > 0 && totalPoints === completedPoints
        });

        // Jika semua titik sudah completed, update status rute
        if (totalPoints > 0 && totalPoints === completedPoints) {
        console.log(`🎉 All points completed! Auto-completing route ${routeId}`);
        await updateRouteStatus(routeId, "completed");
        }

    } catch (err) {
        console.error("Error in checkAndCompleteRoute:", err);
    }
    };

    const updatePointStatus = async (pointId, newStatus) => {
        try {
            const updateData = {
                status: newStatus,
                actual_timestamp: newStatus === "completed" ? new Date().toISOString() : null,
            };
            
            await API.patch(`/rute-monitoring/${pointId}`, updateData);
            
            if (newStatus === "completed") {
                await updateShipRequestStatus(pointId);
            }
            
            setRouteMonitoring(prev => prev.map(point => 
                point.id_monitoring === pointId ? { ...point, ...updateData } : point
            ));

            if (newStatus === "completed" && selectedRoute) {
                await checkAndCompleteRoute(selectedRoute.id_rute_destinasi);
            }
            
            if (selectedRoutePoints.some(point => point.id_monitoring === pointId)) {
                setSelectedRoutePoints(prev => prev.map(point => 
                    point.id_monitoring === pointId ? { ...point, ...updateData } : point
                ));
            }
        } catch (err) {
            console.error("Gagal mengubah status titik:", err);
        }
    };

    const handleSelectRoute = (route) => {
        setSelectedRoute(route);
        setSelectedRoutePoints(getRoutePoints(route.id_rute_destinasi));
    };

    // Proximity check
    const checkProximityToPoints = (positions) => {
    Object.keys(positions).forEach(shipId => {
        const shipPos = positions[shipId];
        const activeRoutes = submittedRoutes.filter(route => 
        route.id_captain_ship === shipId && 
        ["Terjadwal", "dalam perjalanan", "Disetujui"].includes(route.status_rute)
        );

        activeRoutes.forEach(route => {
        const points = getRoutePoints(route.id_rute_destinasi);
        const pendingPoints = points.filter(point => 
            point.status !== "completed" && 
            !/^waypoint_/i.test(point.point_id) // Exclude waypoints
        );

        if (pendingPoints.length > 0) {
            const nextPoint = pendingPoints[0];
            const distance = calculateDistance(shipPos.lat, shipPos.lng, nextPoint.latitude, nextPoint.longitude);

            if (distance <= 50) {
            console.log(`📍 Kapal dekat dengan ${nextPoint.point_name}, menandai selesai`);
            
            // Update point status (akan trigger auto-complete otomatis)
            updatePointStatus(nextPoint.id_monitoring, "completed");
            }
        } else {
            // Jika tidak ada pending points, cek apakah rute perlu di-complete
            checkAndCompleteRoute(route.id_rute_destinasi);
        }
        });
    });
    };

    // Map utility functions
    const getRemainingRoute = (shipId, routePoints) => {
        if (!shipPositions[shipId] || !routePoints || routePoints.length === 0) return null;
        
        const currentShipPosition = shipPositions[shipId];
        const pendingPoints = routePoints.filter(point => point.status !== "completed");
        if (pendingPoints.length === 0) return null;
        
        const line = [[currentShipPosition.lat, currentShipPosition.lng]];
        pendingPoints.forEach(point => line.push([point.latitude, point.longitude]));
        return line;
    };

    // Render Region Markers
    const renderRegionMarkers = (regionType, data) => {
        return data.map(region => (
            <Marker 
                key={region[`id_${regionType}_region`] || region.id_tanker_rig_barge}
                position={[region.latitude_decimal, region.longitude_decimal]}
                icon={regionIcons[regionType]}
            >
                <Popup>
                    <b>{region.platform_name}</b>
                    <br />
                    {regionType.charAt(0).toUpperCase() + regionType.slice(1)} Region
                </Popup>
            </Marker>
        ));
    };

    const filteredPoints = selectedRoutePoints.filter(
        (point) => !/^waypoint_/i.test(point.point_id)
    );

    if (loading) return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <header className="bg-white shadow-sm">
                <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-blue-700">Dashboard Captain</h1>
                            <p className="text-gray-600">Monitoring Rute Kapal</p>
                        </div>
                        {captainData && (
                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                <div className="flex items-center">
                                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">{captainData.name}</h3>
                                        <p className="text-sm text-gray-600">ID: {captainData.id}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="mx-auto sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-lg font-semibold text-gray-700">Daftar Rute </h2>
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                    {submittedRoutes.length} rute
                                </span>
                            </div>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {submittedRoutes.map((route, index) => (
                                    <div
                                        key={route.id_rute_destinasi}
                                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                                            selectedRoute?.id_rute_destinasi === route.id_rute_destinasi ? 
                                            "bg-blue-50 border border-blue-200" : "bg-gray-50 hover:bg-gray-100"
                                        }`}
                                        onClick={() => handleSelectRoute(route)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{route.nama_rute}</p>
                                                <p className="text-sm text-gray-600">Kapal: {route.ship_name}</p>
                                                <span className={`text-xs px-2 py-1 rounded-full ${
                                                    route.status_rute === "Terjadwal" ? "bg-green-100 text-green-800" :
                                                    route.status_rute === "Disetujui" ? "bg-green-100 text-green-800" :
                                                    route.status_rute === "dalam perjalanan" ? "bg-blue-100 text-blue-800" :
                                                    route.status_rute === "tertunda" ? "bg-yellow-100 text-yellow-800" :
                                                    route.status_rute === "completed" ? "bg-purple-100 text-purple-800" :
                                                    "bg-red-100 text-red-800"
                                                }`}>
                                                    {route.status_rute}
                                                </span>
                                            </div>
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getRandomColor(index) }}></div>
                                        </div>
                                    </div>
                                ))}
                                {submittedRoutes.length === 0 && (
                                    <div className="text-center py-4 text-gray-500">
                                        Tidak ada rute yang ditugaskan kepada Anda.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Statistik Captain & Informasi Rute */}
                        {selectedRoute && (
                            <div className="bg-white rounded-lg shadow p-4">
                                <h2 className="text-lg font-semibold text-gray-700 mb-3">Statistik</h2>
                                
                                {/* Informasi Rute yang Dipilih */}
                                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <h3 className="font-semibold text-blue-800 mb-2">Rute yang Dipilih</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-blue-700">Nama Rute:</span>
                                            <span className="font-medium">{selectedRoute.nama_rute}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-blue-700">Kapal:</span>
                                            <span className="font-medium">{selectedRoute.ship_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-blue-700">Status:</span>
                                            <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                                                selectedRoute.status_rute === "Terjadwal" ? "bg-green-100 text-green-800" :
                                                selectedRoute.status_rute === "Disetujui" ? "bg-green-100 text-green-800" :
                                                selectedRoute.status_rute === "dalam perjalanan" ? "bg-blue-100 text-blue-800" :
                                                selectedRoute.status_rute === "tertunda" ? "bg-yellow-100 text-yellow-800" :
                                                selectedRoute.status_rute === "completed" ? "bg-purple-100 text-purple-800" :
                                                "bg-red-100 text-red-800"
                                            }`}>
                                                {selectedRoute.status_rute}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-blue-700">Tanggal:</span>
                                            <span className="font-medium">
                                                {selectedRoute.tanggal_keberangkatan ? 
                                                    new Date(selectedRoute.tanggal_keberangkatan).toLocaleDateString("id-ID") : 
                                                    "Tidak tersedia"
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Statistik Rute */}
                                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                    <h3 className="font-semibold text-green-800 mb-2">Statistik Rute</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-green-700">Total Titik:</span>
                                            <span className="font-medium">{filteredPoints.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-green-700">Selesai:</span>
                                            <span className="font-medium text-green-600">
                                                {filteredPoints.filter(p => p.status === "completed").length}
                                            </span>
                                        </div>
                                        {/* <div className="flex justify-between">
                                            <span className="text-green-700">Dalam Proses:</span>
                                            <span className="font-medium text-blue-600">
                                                {filteredPoints.filter(p => p.status === "in_progress").length}
                                            </span>
                                        </div> */}
                                        {/* <div className="flex justify-between">
                                            <span className="text-green-700">Menunggu:</span>
                                            <span className="font-medium text-gray-600">
                                                {filteredPoints.filter(p => p.status === "pending").length}
                                            </span>
                                        </div> */}
                                        <div className="flex justify-between">
                                            <span className="text-green-700">Perkiraan Penggunaan Fuel ⛽:</span>
                                            <span className="font-medium text-gray-600">
                                                {Number(selectedRoute.konsumsi_fuel).toFixed(2) + " " + selectedRoute.satuan_konsumsi}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Statistik Keseluruhan */}
                                {/* <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                    <h3 className="font-semibold text-purple-800 mb-2">Statistik Keseluruhan</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-purple-700">Total Rute:</span>
                                            <span className="font-medium">{submittedRoutes.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-purple-700">Rute Selesai:</span>
                                            <span className="font-medium text-green-600">
                                                {submittedRoutes.filter(r => r.status_rute === "completed").length}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-purple-700">Dalam Perjalanan:</span>
                                            <span className="font-medium text-blue-600">
                                                {submittedRoutes.filter(r => r.status_rute === "dalam perjalanan").length}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-purple-700">Tertunda:</span>
                                            <span className="font-medium text-yellow-600">
                                                {submittedRoutes.filter(r => r.status_rute === "tertunda").length}
                                            </span>
                                        </div>
                                    </div>
                                </div> */}

                                {/* Tombol Aksi */}
                                <div className="mt-4 flex space-x-2">
                                    {selectedRoute.status_rute !== "dalam perjalanan" && selectedRoute.status_rute !== "completed" && (
                                        <button 
                                            onClick={() => updateRouteStatus(selectedRoute.id_rute_destinasi, "dalam perjalanan")}
                                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium"
                                        >
                                            Mulai Perjalanan
                                        </button>
                                    )}
                                    {/* {selectedRoute.status_rute === "dalam perjalanan" && (
                                        <button 
                                            onClick={() => updateRouteStatus(selectedRoute.id_rute_destinasi, "completed")}
                                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded text-sm font-medium"
                                        >
                                            Tandai Selesai
                                        </button>
                                    )} */}
                                </div>
                            </div>
                        )}

                        {/* Statistik Default (jika tidak ada rute yang dipilih) */}
                        {!selectedRoute && submittedRoutes.length > 0 && (
                            <div className="bg-white rounded-lg shadow p-4">
                                <h2 className="text-lg font-semibold text-gray-700 mb-3">Statistik </h2>
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <h3 className="font-semibold text-gray-800 mb-2">Statistik Keseluruhan</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-700">Total Rute:</span>
                                            <span className="font-medium">{submittedRoutes.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-700">Rute Selesai:</span>
                                            <span className="font-medium text-green-600">
                                                {submittedRoutes.filter(r => r.status_rute === "completed").length}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-700">Dalam Perjalanan:</span>
                                            <span className="font-medium text-blue-600">
                                                {submittedRoutes.filter(r => r.status_rute === "dalam perjalanan").length}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-700">Tertunda:</span>
                                            <span className="font-medium text-yellow-600">
                                                {submittedRoutes.filter(r => r.status_rute === "tertunda").length}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 text-center text-sm text-gray-500">
                                    Pilih rute untuk melihat detail lengkap
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Map Section */}
                        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                            <div className="h-96 md:min-h-screen">
                                <MapContainer 
                                    center={[-5.06, 106.3]} 
                                    zoom={9} 
                                    className="h-full w-full rounded-lg" 
                                    ref={mapRef}
                                    style={{ 
                                        position: 'relative', 
                                        zIndex: 1,
                                        minHeight: '400px'
                                    }}
                                >
                                    <LayersControl position="topright">
                                        <LayersControl.BaseLayer checked name="OpenStreetMap">
                                            <TileLayer
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                            />
                                        </LayersControl.BaseLayer>
                                        <LayersControl.BaseLayer name="Satellite">
                                            <TileLayer
                                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                                            />
                                        </LayersControl.BaseLayer>
                                    </LayersControl>

                                    {/* Render semua region markers */}
                                    {renderRegionMarkers('central', regions.central)}
                                    {renderRegionMarkers('north', regions.north)}
                                    {renderRegionMarkers('south', regions.south)}
                                    {renderRegionMarkers('tanker', regions.tanker)}
                                    {renderRegionMarkers('other', regions.other)}

                                    {/* Ship markers */}
                                    {Object.keys(shipPositions).map(shipId => {
                                        const ship = shipPositions[shipId];
                                        return (
                                            <Marker key={shipId} position={[ship.lat, ship.lng]} icon={regionIcons.boat}>
                                                <Popup>
                                                    <b>{ship.name}</b>
                                                    <br />
                                                    Posisi Real-time
                                                </Popup>
                                            </Marker>
                                        );
                                    })}

                                    {/* Selected route display */}
                                    {selectedRoute && selectedRoutePoints.length > 0 && (
                                        <>
                                            {selectedRoutePoints.filter(point => !/^waypoint_/i.test(point.point_id)).map(point => (
                                                <Marker
                                                    key={point.id_monitoring}
                                                    position={[point.latitude, point.longitude]}
                                                    icon={point.point_type === "start" ? startIcon : 
                                                          point.point_type === "end" ? endIcon : destinationIcon}
                                                >
                                                    <Popup>
                                                        <div className="font-medium">{point.point_name}</div>
                                                        <div className="text-sm">
                                                            {point.point_type === "start" ? "Titik Awal" : 
                                                             point.point_type === "end" ? "Titik Akhir" : 
                                                             `Titik ${point.sequence}`}
                                                        </div>
                                                        <div className="text-sm">Status: {getStatusText(point.status)}</div>
                                                        {point.description && (
                                                            <div className="text-sm text-gray-600 mt-1">
                                                                Keterangan: {point.description}
                                                            </div>
                                                        )}
                                                    </Popup>
                                                </Marker>
                                            ))}

                                            <Polyline
                                                positions={selectedRoutePoints.map(p => [p.latitude, p.longitude])}
                                                color="#10B981"
                                                weight={4}
                                                opacity={0.3}
                                            />

                                            {shipPositions[selectedRoute.id_captain_ship] && (
                                                <>
                                                    {getRemainingRoute(selectedRoute.id_captain_ship, selectedRoutePoints) && (
                                                        <Polyline
                                                            positions={getRemainingRoute(selectedRoute.id_captain_ship, selectedRoutePoints)}
                                                            color="#3B82F6"
                                                            weight={4}
                                                            opacity={0.8}
                                                            dashArray="5, 5"
                                                        />
                                                    )}
                                                </>
                                            )}
                                        </>
                                    )}
                                </MapContainer>
                            </div>
                        </div>

                        {/* Detail Rute Section - Hanya menampilkan titik-titik rute */}
                        {selectedRoute ? (
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-xl font-bold text-blue-700">Detail Titik Rute</h2>
                                </div>

                                {/* Route Points List */}
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-3">Titik-titik Rute</h3>
                                    <div className="space-y-3">
                                        {selectedRoutePoints.length === 0 ? (
                                            <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                                                Tidak ada titik rute yang tersedia
                                            </div>
                                        ) : (
                                            selectedRoutePoints
                                                .slice(1)
                                                .filter(point => !/^waypoint_/i.test(point.point_id))
                                                .map((point, index, filteredPoints) => {
                                                    const actualIndex = index + 1;
                                                    // Cari titik berikutnya yang belum selesai
                                                    const nextPendingPoint = filteredPoints.find(p => 
                                                        p.status !== "completed" && 
                                                        !/^waypoint_/i.test(p.point_id)
                                                    );
                                                    
                                                    const isNextDestination = nextPendingPoint && 
                                                        point.id_monitoring === nextPendingPoint.id_monitoring;
                                                    
                                                    return (
                                                        <div 
                                                            key={point.id_monitoring} 
                                                            className={`flex items-center p-4 rounded-lg border ${
                                                                isNextDestination
                                                                    ? "bg-yellow-50 border-yellow-300 shadow-sm" // Highlight untuk tujuan berikutnya
                                                                    : point.status === "completed"
                                                                    ? "bg-green-50 border-green-200" // Selesai
                                                                    : "bg-gray-50 border-gray-200" // Belum dimulai
                                                            }`}
                                                        >
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold mr-4 ${
                                                                isNextDestination
                                                                    ? "bg-yellow-500 text-white animate-pulse" // Animasi untuk tujuan berikutnya
                                                                    : point.status === "completed"
                                                                    ? "bg-green-500 text-white"
                                                                    : point.status === "in_progress"
                                                                    ? "bg-blue-500 text-white"
                                                                    : "bg-gray-400 text-white"
                                                            }`}>
                                                                {actualIndex}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className={`font-medium ${
                                                                        isNextDestination ? "text-yellow-800" : "text-gray-900"
                                                                    }`}>
                                                                        {point.point_name}
                                                                        {isNextDestination && (
                                                                            <span className="ml-2 bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                                                                Berikutnya
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                                                        isNextDestination
                                                                            ? "bg-yellow-100 text-yellow-800 font-bold"
                                                                            : point.status === "completed"
                                                                            ? "bg-green-100 text-green-800"
                                                                            : point.status === "in_progress"
                                                                            ? "bg-blue-100 text-blue-800"
                                                                            : "bg-gray-100 text-gray-800"
                                                                    }`}>
                                                                        {getStatusText(point.status)}
                                                                    </span>
                                                                </div>
                                                                <div className="text-sm text-gray-600">
                                                                    {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                                                                </div>
                                                                {point.description && (
                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                        Keterangan: {point.description}
                                                                    </div>
                                                                )}
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    {point.point_type === "start" ? "Titik Awal" : 
                                                                    point.point_type === "end" ? "Titik Akhir" : 
                                                                    `Tujuan ${actualIndex}`}
                                                                </div>
                                                            </div>
                                                            <div className="ml-4">
                                                                {point.status !== "completed" && selectedRoute.status_rute === "dalam perjalanan" && (
                                                                    <button 
                                                                        onClick={() => updatePointStatus(point.id_monitoring, "completed")}
                                                                        className={`py-1 px-3 rounded text-sm font-medium ${
                                                                            isNextDestination
                                                                                ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                                                                                : "bg-green-500 hover:bg-green-600 text-white"
                                                                        }`}
                                                                    >
                                                                        {isNextDestination ? "Tandai Selesai" : "Tandai Selesai"}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow p-8 text-center">
                                <div className="text-gray-400 mb-4">
                                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-700 mb-2">Belum ada rute yang dipilih</h3>
                                <p className="text-gray-500">Pilih salah satu rute dari daftar di sebelah kiri untuk melihat detailnya</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CaptainMap;