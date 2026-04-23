import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, LayersControl } from "react-leaflet";
import L from "leaflet";
import API from "../../../api/Api";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import IconPlatformNorth from "../../../../src/assets/icon/icon_platform_north.svg";
import IconPlatformSouth from "../../../../src/assets/icon/icon_platform_south.svg";
import IconPlatformCentral from "../../../../src/assets/icon/icon_platform_central.svg";
import IconPlatformOther from "../../../../src/assets/icon/icon_platform_other.svg";
import IconTanker from "../../../../src/assets/icon/icon_Subsea_wellhead.svg";
import IconBoat from "../../../../src/assets/icon/icon_boat.svg";
import IconKapalPengirim from "../../../../src/assets/icon/icon_kapal_pengirim.svg";
import IconDestination from "../../../../src/assets/icon/icon_destination.svg";

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

// Icon untuk Pelabuhan
// const harborIcon = new L.Icon({
//     iconUrl: "https://cdn-icons-png.flaticon.com/512/984/984617.png",
//     iconSize: [30, 30],
//     iconAnchor: [15, 15],
//     popupAnchor: [0, -15]
// });

// Di dalam komponen, setelah definisi icon
const predefinedIntermediates = [
    {
        id: "pabelokan",
        name: "Pulau Pabelokan",
        latitude: -5.480025,
        longitude: 106.393659,
        type: "island"
    },
    {
        id: "tanjungpriok",
        name: "Pelabuhan Tanjung Priok",
        latitude: -6.094178,
        longitude: 106.881621,
        type: "harbor"
    },
    {
        id: "kalijapat",
        name: "Pelabuhan Kalijapat",
        latitude: -6.114481, 
        longitude: 106.861788,
        type: "harbor"
    }
];

// Data Pelabuhan untuk titik start
const predefinedHarbors = [
    {
        id: "tanjungpriok",
        name: "Pelabuhan Tanjung Priok",
        latitude: -6.094178,
        longitude: 106.881621,
        type: "harbor"
    },
    {
        id: "kalijapat",
        name: "Pelabuhan Kalijapat",
        latitude: -6.114481,
        longitude: 106.861788,
        type: "harbor"
    },
    {
        id: "pabelokan",
        name: "Pulau Pabelokan",
        latitude: -5.480025,
        longitude: 106.393659,
        type: "harbor"
    },
];

function haversine(p1, p2) {
    const R = 6371; // km
    const lat1 = (p1.latitude * Math.PI) / 180;
    const lon1 = (p1.longitude * Math.PI) / 180;
    const lat2 = (p2.latitude * Math.PI) / 180;
    const lon2 = (p2.longitude * Math.PI) / 180;

    const dlat = lat2 - lat1;
    const dlon = lon2 - lon1;

    const a =
        Math.sin(dlat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function predictRoute(points, fuelRate = 0.25, intermediates = [], returnToIntermediate = false, returnIntermediate = null) {
    if (points.length <= 2) {
        let dist = 0;
        if (points.length === 2) {
            dist = haversine(points[0], points[1]);
            // Jika kembali ke titik perantara, tambahkan jarak ke titik perantara
            if (returnToIntermediate && returnIntermediate) {
                dist += haversine(points[1], returnIntermediate);
            } else {
                dist += haversine(points[1], points[0]);
            }
        }
        const fuel = dist * fuelRate;

        let optimalRoute = [...points];
        if (returnToIntermediate && returnIntermediate) {
            optimalRoute.push(returnIntermediate);
        } else {
            optimalRoute.push(points[0]);
        }

        return {
            optimal_route: optimalRoute,
            distance: dist,
            fuel_usage: fuel,
            fuel_loss: 0,
        };
    }

    const start = points[0];
    const targets = points.slice(1);

    // 🔹 Kelompokkan berdasarkan priority_level
    const emergency = targets.filter((p) => p.priority_level === "emergency");
    const urgent = targets.filter((p) => p.priority_level === "urgent");
    const normal = targets.filter((p) => !p.priority_level || p.priority_level === "normal");

    const permute = (arr) => {
        if (arr.length <= 1) return [arr];
        const result = [];
        for (let i = 0; i < arr.length; i++) {
            const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
            for (const p of permute(rest)) {
                result.push([arr[i], ...p]);
            }
        }
        return result;
    };

    // 🔹 Cari rute terpendek (tanpa aturan priority, baseline)
    let baselineRoute = null;
    let baselineDist = Infinity;
    let baselineFuel = 0;

    for (const perm of permute(targets)) {
        let routeWithIntermediate = [...intermediates, ...perm];
        let endPoint = start; // Default kembali ke titik awal

        // Jika kembali ke titik perantara, set endpoint ke titik perantara
        if (returnToIntermediate && returnIntermediate) {
            endPoint = returnIntermediate;
        }

        const [dist, fuel] = calculateRouteWithEndPoint(start, routeWithIntermediate, endPoint, fuelRate);
        if (dist < baselineDist) {
            baselineDist = dist;
            baselineRoute = routeWithIntermediate;
            baselineFuel = fuel;
        }
    }

    // 🔹 Cari rute sesuai priority (emergency → urgent → normal)
    let bestRoute = null;
    let bestDist = Infinity;
    let bestFuel = 0;

    const emergencyPerms = emergency.length ? permute(emergency) : [[]];
    const urgentPerms = urgent.length ? permute(urgent) : [[]];
    const normalPerms = normal.length ? permute(normal) : [[]];

    for (const e of emergencyPerms) {
        for (const u of urgentPerms) {
            for (const n of normalPerms) {
                let route = [...e, ...u, ...n].filter(Boolean);
                if (route.length === 0) continue;

                // Tambahkan titik perantara di awal
                route = [...intermediates, ...route];

                let endPoint = start; // Default kembali ke titik awal

                // Jika kembali ke titik perantara, set endpoint ke titik perantara
                if (returnToIntermediate && returnIntermediate) {
                    endPoint = returnIntermediate;
                }

                const [dist, fuel] = calculateRouteWithEndPoint(start, route, endPoint, fuelRate);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestRoute = route;
                    bestFuel = fuel;
                }
            }
        }
    }

    let optimalRoute = [start, ...bestRoute];

    // Tambahkan titik akhir (bisa titik awal atau titik perantara)
    if (returnToIntermediate && returnIntermediate) {
        optimalRoute.push(returnIntermediate);
    } else {
        optimalRoute.push(start);
    }

    return {
        optimal_route: optimalRoute,
        distance: bestDist,
        fuel_usage: bestFuel,
        fuel_loss: bestFuel - baselineFuel,
    };
}

// Fungsi baru untuk menghitung rute dengan titik akhir yang berbeda
function calculateRouteWithEndPoint(start, route, endPoint, fuelRate) {
    let totalDist = 0;
    let fuelUsed = 0;
    let prev = start;

    for (let current of route) {
        const seg = haversine(prev, current);
        totalDist += seg;
        fuelUsed += seg * fuelRate;
        prev = current;
    }

    // Tambahkan jarak dari titik terakhir ke endpoint
    if (route.length > 0) {
        const seg = haversine(route[route.length - 1], endPoint);
        totalDist += seg;
        fuelUsed += seg * fuelRate;
    }

    return [totalDist, fuelUsed];
}

const FleetRoute = () => {
    const [requests, setRequests] = useState([]);
    const [captains, setCaptains] = useState([]);
    const [routeResult, setRouteResult] = useState(null);
    const [selectedPoints, setSelectedPoints] = useState([]);
    const [startPoint, setStartPoint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isVRP, setIsVRP] = useState(true);
    const [selectedShips, setSelectedShips] = useState([]);
    const [visibleRoutes, setVisibleRoutes] = useState([]);
    const [userData, setUserData] = useState(null);
    
    // State baru untuk start point
    const [startPointType, setStartPointType] = useState('current'); // 'current' atau 'harbor'
    const [selectedStartHarbor, setSelectedStartHarbor] = useState(null);

    // Pakai CDN Leaflet-color-markers
    const centralIcon = new L.Icon({
        iconUrl: IconPlatformCentral,
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        iconSize: [12, 12],
        iconAnchor: [4, 14],
        popupAnchor: [0, -11],
        shadowSize: [14, 14],
    });

    const northIcon = new L.Icon({
        iconUrl: IconPlatformNorth,
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        iconSize: [12, 12],
        iconAnchor: [4, 14],
        popupAnchor: [0, -11],
        shadowSize: [14, 14],
    });

    const southIcon = new L.Icon({
        iconUrl: IconPlatformSouth,
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        iconSize: [12, 12],
        iconAnchor: [4, 14],
        popupAnchor: [0, -11],
        shadowSize: [14, 14],
    });

    const tankerIcon = new L.Icon({
        iconUrl: IconTanker,
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        iconSize: [12, 12],
        iconAnchor: [4, 14],
        popupAnchor: [0, -11],
        shadowSize: [14, 14],
    });

    const otherIcon = new L.Icon({
        iconUrl: IconPlatformOther,
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        iconSize: [12, 12],
        iconAnchor: [4, 14],
        popupAnchor: [0, -11],
        shadowSize: [14, 14],
    });

    const shipIcon = new L.Icon({
        iconUrl: IconBoat,
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        iconSize: [12, 12],
        iconAnchor: [4, 14],
        popupAnchor: [0, -11],
        shadowSize: [14, 14],
    });

    // Tambahkan setelah definisi icon lainnya
    const returnIntermediateIcon = new L.Icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684818.png",
        iconSize: [25, 25],
    });

    const [central, setCentral] = useState([]);
    const [north, setNorth] = useState([]);
    const [south, setSouth] = useState([]);
    const [tanker, setTanker] = useState([]);
    const [other, setOther] = useState([]);
    const [ship, setShip] = useState([]);

    const [intermediatePoints, setIntermediatePoints] = useState([]);
    const [returnToIntermediate, setReturnToIntermediate] = useState(false);
    const [returnIntermediatePoint, setReturnIntermediatePoint] = useState(null);

    useEffect(() => {
        // Ambil data user dari localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                setUserData(user);
                // console.log('User data loaded:', user);
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    }, []);

    useEffect(() => {
        const fetchRegions = async () => {
            try {
                const [c, n, s, t, o, sh] = await Promise.all([
                    API.get("/get-all/central-region"),
                    API.get("/get-all/north-region"),
                    API.get("/get-all/south-region"),
                    API.get("/get-all/tanker-rig-barge"),
                    API.get("/get-all/other-region"),
                    API.get("/ship-positions-all"),
                ]);

                setCentral(c.data.data || []);
                setNorth(n.data.data || []);
                setSouth(s.data.data || []);
                setTanker(t.data.data || []);
                setOther(o.data.data || []);
                setShip(sh.data.data || []);
            } catch (err) {
                console.error("Gagal ambil data region:", err);
            }
        };
        fetchRegions();
    }, []);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await API.get("/get-approved-request");
                // filter fleet_status pending atau approved
                const filtered = res.data.filter(
                    (r) =>
                        [r.status_request === "approved" && "approve with note"] && r.fleet_status === "process"
                );
                // transform ke format { latitude, longitude, name, priority }
                const points = filtered.map((r) => ({
                    latitude: parseFloat(r.lat_request),
                    longitude: parseFloat(r.lng_request),
                    name: r.name,
                    destination_name: r.destination_name,
                    priority: r.priority_request === "priority",
                    priority_level: r.priority_level || "normal",
                    ship_request_id: r.ship_request_id,
                    kategori_request: r.kategori_request || "-",
                    jenis_material: r.jenis_material || "-",
                    kuantitas: r.kuantitas || "-",
                    satuan: r.satuan || "-",
                }));
                setRequests(points);
                setSelectedPoints(points);
            } catch (err) {
                console.error("Gagal ambil data requests:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, []);

    useEffect(() => {
        const fetchCaptains = async () => {
            if (!userData?.region) return; // cegah eksekusi sebelum userData siap
            try {

                const userRegion = userData?.region;
            
                console.log('Fetching captains with region:', userRegion);
                
                const res = await API.get(`/captains?status=active&region=${userRegion}`);
                // transform ke format yang sama seperti requests
                const formatted = res.data.map((c) => ({
                    ship_request_id: c.id_captain_ship,
                    name: c.name,
                    latitude: parseFloat(c.latitude),
                    longitude: parseFloat(c.longitude),
                }));
                setCaptains(formatted);
                if (formatted.length > 0) {
                    setSelectedShips([formatted[0]]);
                }
            } catch (err) {
                console.error("Gagal ambil data kapal aktif:", err);
            }
        };
        fetchCaptains();
    }, [userData]);

    function normalizeResult(ship, routeData) {
        return {
            ship,
            route: {
                optimal_route: routeData?.optimal_route || [],
                distance: routeData?.distance || 0,
                fuel_usage: routeData?.fuel_usage || 0,
                fuel_loss: routeData?.fuel_loss || 0,
            },
        };
    }

    const handleCalculate = async () => {
        if (!selectedPoints.length) return alert("Pilih minimal 1 titik");
        if (selectedShips.length === 0) return alert("Pilih minimal 1 kapal");

        let results = [];
        setLoading(true);

        if (!isVRP) {
            results = selectedShips.map((selected) => {
                // Tentukan start point berdasarkan pilihan
                let startPoint;
                
                if (startPointType === 'current') {
                    // ✅ Gunakan posisi kapal saat ini
                    const matchedShip = ship.find((s) => s.mmsi === selected.ship_request_id);
                    if (!matchedShip) {
                        console.warn(`⚠️ Ship data not found for ID: ${selected.ship_request_id}`);
                        return normalizeResult(selected, {});
                    }
                    startPoint = {
                        ...selected,
                        latitude: matchedShip.lat,
                        longitude: matchedShip.lon,
                    };
                } else {
                    // ✅ Gunakan pelabuhan yang dipilih
                    if (!selectedStartHarbor) {
                        console.warn(`⚠️ Harbor not selected`);
                        return normalizeResult(selected, {});
                    }
                    startPoint = {
                        ...selected,
                        latitude: selectedStartHarbor.latitude,
                        longitude: selectedStartHarbor.longitude,
                        name: `${selected.name} (Start dari ${selectedStartHarbor.name})`,
                        is_start_from_harbor: true,
                        harbor_name: selectedStartHarbor.name
                    };
                }

                // ✅ Pastikan start point paling pertama
                const pointsWithStart = [
                    startPoint,
                    ...selectedPoints.filter(
                        (p) => p.ship_request_id !== selected.ship_request_id
                    ),
                ];

                const routeData = predictRoute(
                    pointsWithStart,
                    0.25,
                    intermediatePoints,
                    returnToIntermediate,
                    returnIntermediatePoint
                );

                return normalizeResult(startPoint, routeData);
            });
        } else {
            // ✅ MODE VRP - dengan start point yang fleksibel
            const body = {
                starts: selectedShips.map((selected) => {
                    let startData;
                    
                    if (startPointType === 'current') {
                        // Posisi kapal saat ini
                        const matched = ship.find((s) => s.mmsi === selected.ship_request_id);
                        startData = {
                            ship_request_id: selected.ship_request_id,
                            name: selected.name,
                            latitude: matched?.lat || selected.latitude,
                            longitude: matched?.lon || selected.longitude,
                            priority_level: selected.priority_level || "normal",
                            is_intermediate: false,
                            start_type: 'current'
                        };
                    } else {
                        // Start dari pelabuhan
                        if (!selectedStartHarbor) {
                            console.warn(`⚠️ Harbor not selected for VRP`);
                            return null;
                        }
                        startData = {
                            ship_request_id: selected.ship_request_id,
                            name: `${selected.name} (Start dari ${selectedStartHarbor.name})`,
                            latitude: selectedStartHarbor.latitude,
                            longitude: selectedStartHarbor.longitude,
                            priority_level: "normal",
                            is_intermediate: false,
                            start_type: 'harbor',
                            harbor_name: selectedStartHarbor.name
                        };
                    }

                    return startData;
                }).filter(Boolean), // Filter out null values

                points: selectedPoints.map((p) => ({
                    ship_request_id: p.ship_request_id,
                    name: p.name,
                    destination_name: p.destination_name,
                    latitude: parseFloat(p.latitude),
                    longitude: parseFloat(p.longitude),
                    priority_level: p.priority_level || "normal",
                    is_intermediate: false,
                })),
                intermediate_points: intermediatePoints.map((point, index) => ({
                    ship_request_id: `intermediate_${point.id}_${index}`,
                    name: point.name,
                    latitude: point.latitude,
                    longitude: point.longitude,
                    priority_level: "normal",
                    is_intermediate: true,
                })),
                return_to_intermediate: returnToIntermediate,
                return_intermediate_point: returnToIntermediate && returnIntermediatePoint ? {
                    ship_request_id: `return_intermediate_${returnIntermediatePoint.id}`,
                    name: returnIntermediatePoint.name,
                    latitude: returnIntermediatePoint.latitude,
                    longitude: returnIntermediatePoint.longitude,
                    priority_level: "normal",
                    is_intermediate: true,
                } : null,
                return_to_start: !returnToIntermediate,
                time_limit_seconds: 10,
            };

            try {
                const res = await axios.post(process.env.REACT_APP_VRP_API_URL + '/solve-vrp', body, {
                    timeout: 120000,
                });

                const routes = res?.data?.routes || [];

                results = routes.map((routeData) => {
                    const ship = selectedShips.find(
                        (s) => s.ship_request_id === routeData.ship?.ship_request_id
                    ) || routeData.ship;
                    return normalizeResult(ship, routeData.route);
                });
            } catch (error) {
                console.error("VRP calculation error:", error);
                alert("Error dalam perhitungan VRP: " + (error.response?.data?.detail || error.message));
                setLoading(false);
                return;
            }
        }

        setRouteResult(results);
        setVisibleRoutes(results.map((r) => r.ship.ship_request_id));
        setLoading(false);
    };

    const togglePoint = (point) => {
        const exists = selectedPoints.find((p) => p.ship_request_id === point.ship_request_id);
        if (exists) {
            setSelectedPoints(selectedPoints.filter((p) => p.ship_request_id !== point.ship_request_id));
        } else {
            setSelectedPoints([...selectedPoints, point]);
        }
    };

    const handlePriorityChange = async (pointId, newLevel) => {
        try {
            await API.put(`/ship-requests/${pointId}`, {
                priority_level: newLevel,
            });

            setRequests((prev) =>
                prev.map((r) =>
                    r.ship_request_id === pointId ? { ...r, priority_level: newLevel } : r
                )
            );
            setSelectedPoints((prev) =>
                prev.map((p) =>
                    p.ship_request_id === pointId ? { ...p, priority_level: newLevel } : p
                )
            );
        } catch (err) {
            console.error("Error update priority", err);
        }
    };

    // Fungsi untuk menampilkan preview data yang akan di-commit
    const handleCommit = async () => {
        if (!routeResult || !Array.isArray(routeResult)) {
            return alert("Belum ada hasil perhitungan!");
        }

        try {
            for (const { ship, route } of routeResult) {
            // 1. Siapkan data urutan lengkap semua titik
            const fullRouteSequence = route.optimal_route.map((point, index) => ({
                sequence: index + 1,
                ship_request_id: point.ship_request_id,
                point_type: index === 0 ? "start" :
                            index === route.optimal_route.length - 1 ? "end" :
                            "visit",
                point_id: point.ship_request_id || point.id || `intermediate_${index}`,
                point_name: point.destination_name ?? point.name,
                latitude: point.latitude,
                longitude: point.longitude,
                is_intermediate: !point.ship_request_id,
                priority_level: point.priority_level || "normal",
                timestamp: new Date(Date.now() + index * 600000).toISOString() // estimasi waktu
            }));

            // 2. Payload rute utama (satu insert per rute)
            const payload = {
                id_captain_ship: ship.ship_request_id,
                ship_name: ship.name,
                tanggal_keberangkatan: new Date().toISOString(),
                nama_rute: `Rute-${ship.name}-${Date.now()}`,
                jarak_tempuh: route.distance || 0,
                est_waktu_tempuh: (route.distance / 30) || 0,
                kecepatan_knoot: 30,
                konsumsi_fuel: route.fuel_usage || 0,
                satuan_konsumsi: "L",
                los_fuel_summary: route.fuel_loss || 0,
                satuan_los_fuel_summary: "L",
                status_rute: "Terjadwal",
                catatan: null,
                alasan: null,
                visited_requests: JSON.stringify(fullRouteSequence)
            };

            await API.post("/rute-destinasi", payload);

            // 3. Update status request untuk titik yang memiliki ship_request_id
            const pointsWithRequestId = route.optimal_route.filter(p => p.ship_request_id);
            for (const point of pointsWithRequestId) {
                try {
                await API.patch(`/update-fleet-status/${point.ship_request_id}`, {
                    fleet_status: "delivered",
                    status_request: "approved"
                });
                } catch (err) {
                console.warn(`Gagal update status ${point.ship_request_id}:`, err.response?.data || err);
                }
            }
            }

            alert("Semua rute berhasil di-commit dan status diubah ke delivered!");
        } catch (err) {
            console.error("Commit gagal:", err.response?.data || err);
            alert("Gagal commit rute, cek console.");
        }
    };

    const getPriorityColor = (level) => {
        switch (level) {
            case "emergency":
                return "bg-red-600 text-white";
            case "urgent":
                return "bg-orange-500 text-white";
            default:
                return "bg-blue-100 text-blue-800";
        }
    };

    // Fungsi untuk mendapatkan warna acak untuk setiap rute
    const getRandomColor = (index) => {
        const colors = [
            'blue', 'green', 'red', 'purple', 'orange',
            'darkred', 'lightred', 'darkblue', 'darkgreen',
            'cadetblue', 'darkpurple', 'pink', 'lightblue'
        ];
        return colors[index % colors.length];
    };

    if (loading)
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-blue-700">Fleet Route Management</h1>
                    <p className="text-gray-600">Optimalkan rute pengiriman</p>
                </div>
            </header>

            <div className=" mx-auto sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Kapal Section */}
                        <div className="bg-white rounded-lg shadow p-4">
                            <h2 className="text-lg font-semibold mb-3 text-gray-700">Pilih Kapal Pengirim</h2>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {captains.map((c) => (
                                    <div
                                        key={c.ship_request_id}
                                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${selectedShips.some((s) => s.ship_request_id === c.ship_request_id)
                                            ? "bg-blue-50 border border-blue-200"
                                            : "bg-gray-50 hover:bg-gray-100"
                                            }`}
                                        onClick={() => {
                                            const exists = selectedShips.find(
                                                (s) => s.ship_request_id === c.ship_request_id
                                            );
                                            if (exists) {
                                                setSelectedShips(
                                                    selectedShips.filter((s) => s.ship_request_id !== c.ship_request_id)
                                                );
                                            } else {
                                                setSelectedShips([...selectedShips, c]);
                                            }
                                        }}
                                    >
                                        <div
                                            className={`w-4 h-4 rounded-full mr-3 ${selectedShips.some((s) => s.ship_request_id === c.ship_request_id)
                                                ? "bg-blue-500"
                                                : "border-2 border-gray-300"
                                                }`}
                                        ></div>
                                        <div className="flex-1">
                                            <p className="font-medium">{c.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {/* {c.latitude.toFixed(4)}, {c.longitude.toFixed(4)} */}
                                            </p>
                                        </div>
                                        <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Titik Section */}
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-lg font-semibold text-gray-700">Titik Pengiriman</h2>
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                    {selectedPoints.length} dipilih
                                </span>
                            </div>
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {requests.map((r) => (
                                    <div
                                        key={r.ship_request_id}
                                        className={`p-3 rounded-lg transition-all ${selectedPoints.find((p) => p.ship_request_id === r.ship_request_id)
                                            ? "bg-green-50 border border-green-200"
                                            : "bg-gray-50 hover:bg-gray-100"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div
                                                className="flex items-center cursor-pointer flex-1"
                                                onClick={() => togglePoint(r)}
                                            >
                                                <div
                                                    className={`w-4 h-4 rounded-full mr-3 ${selectedPoints.find((p) => p.ship_request_id === r.ship_request_id)
                                                        ? "bg-green-500"
                                                        : "border-2 border-gray-300"
                                                        }`}
                                                ></div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">{r.destination_name}</p>
                                                    <div className="flex items-center mt-1">
                                                        <span
                                                            className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(r.priority_level)}`}
                                                        >
                                                            {r.priority_level}
                                                        </span>
                                                        {r.priority && (
                                                            <span className="ml-2 text-red-500 text-sm">🚨 Priority</span>
                                                        )}
                                                    </div>
                                                    {/* Informasi Tambahan - dalam satu baris */}
                                                    <div className="mt-2 text-xs text-gray-600">
                                                        <div className="flex justify-between">
                                                            <span className="font-medium capitalize">Demand: {r.kategori_request?.replace('_', ' ')} {r.jenis_material !== "-" ? `| Material: ${r.jenis_material}` : ""} {r.kuantitas !== "-" ? `| Kuantitas: ${r.kuantitas} ${r.satuan}` : ""}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <select
                                                value={r.priority_level}
                                                onChange={(e) => handlePriorityChange(r.ship_request_id, e.target.value)}
                                                className="text-xs border rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="normal">Normal</option>
                                                <option value="urgent">Urgent</option>
                                                <option value="emergency">Emergency</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SETTING RUTE SECTION - Gabungan semua setting */}
                        <div className="bg-white rounded-lg shadow p-4">
                            <h2 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">⚙️ Pengaturan Rute</h2>
                            
                            {/* Mode VRP */}
                            <div className="mb-4 pb-3 border-b">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium text-gray-700">Mode Multi-VRP</h3>
                                        <p className="text-xs text-gray-500">Vehicle Routing Problem</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isVRP}
                                            onChange={() => setIsVRP(!isVRP)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>

                            {/* Titik Start Keberangkatan */}
                            <div className="mb-4 pb-3 border-b">
                                <h3 className="font-medium text-gray-700 mb-3">Titik Keberangkatan</h3>
                                
                                {/* Toggle Type */}
                                <div className="flex space-x-2 mb-3">
                                    <button
                                        onClick={() => setStartPointType('current')}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                            startPointType === 'current' 
                                                ? 'bg-blue-500 text-white' 
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        Posisi Kapal Sekarang
                                    </button>
                                    <button
                                        onClick={() => setStartPointType('harbor')}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                            startPointType === 'harbor' 
                                                ? 'bg-blue-500 text-white' 
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        Dari Pelabuhan
                                    </button>
                                </div>

                                {/* Pilihan Pelabuhan jika memilih start dari harbor */}
                                {startPointType === 'harbor' && (
                                    <div className="mt-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Pilih Pelabuhan:
                                        </label>
                                        <select
                                            value={selectedStartHarbor ? selectedStartHarbor.id : ""}
                                            onChange={(e) => {
                                                const selected = predefinedHarbors.find(
                                                    harbor => harbor.id === e.target.value
                                                );
                                                setSelectedStartHarbor(selected || null);
                                            }}
                                            className="w-full border rounded px-3 py-2 text-sm focus:outline-none bg-white focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="">Pilih pelabuhan...</option>
                                            {predefinedHarbors.map(harbor => (
                                                <option key={harbor.id} value={harbor.id}>
                                                    {harbor.name}
                                                </option>
                                            ))}
                                        </select>
                                        {selectedStartHarbor && (
                                            <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                                                <p className="text-sm font-medium text-green-800">
                                                    Titik Keberangkatan: {selectedStartHarbor.name}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {startPointType === 'current' && (
                                    <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                        <p className="text-sm font-medium text-blue-800">
                                            posisi kapal saat ini
                                        </p>
                                        <p className="text-xs text-blue-600">
                                            Menggunakan koordinat real-time kapal
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Lokasi Pengambilan Supply */}
                            <div className="mb-2">
                                <h3 className="font-medium text-gray-700 mb-3">📦 Lokasi Pengambilan Supply</h3>

                                {/* Daftar titik perantara yang dipilih */}
                                <div className="mb-3 space-y-2 max-h-32 overflow-y-auto">
                                    {intermediatePoints.map((point, index) => (
                                        <div key={`${point.id}-${index}`} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                                            <div>
                                                <p className="text-sm font-medium">{point.name}</p>
                                                <p className="text-xs text-gray-500">Urutan: {index + 1}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const newPoints = [...intermediatePoints];
                                                    newPoints.splice(index, 1);
                                                    setIntermediatePoints(newPoints);
                                                }}
                                                className="text-red-500 hover:text-red-700 text-sm"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Form tambah titik perantara */}
                                <div className="mb-3">
                                    <select
                                        value=""
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const selected = predefinedIntermediates.find(
                                                    point => point.id === e.target.value
                                                );
                                                if (selected && !intermediatePoints.find(p => p.id === selected.id)) {
                                                    setIntermediatePoints([...intermediatePoints, selected]);
                                                }
                                            }
                                        }}
                                        className="w-full border rounded px-2 py-1 text-sm focus:outline-none bg-white focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">Tambah Lokasi Pengambilan Supply</option>
                                        {predefinedIntermediates.map(point => (
                                            <option key={point.id} value={point.id}>
                                                {point.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Opsi kembali ke titik perantara */}
                                <div className="mb-3">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={returnToIntermediate}
                                            onChange={() => setReturnToIntermediate(!returnToIntermediate)}
                                            className="mr-2"
                                        />
                                        <span className="text-sm">Kembali ke titik lain</span>
                                    </label>
                                </div>

                                {returnToIntermediate && (
                                    <div className="mb-3">
                                        <select
                                            value={returnIntermediatePoint ? returnIntermediatePoint.id : ""}
                                            onChange={(e) => {
                                                const selected = predefinedIntermediates.find(
                                                    point => point.id === e.target.value
                                                );
                                                setReturnIntermediatePoint(selected || null);
                                            }}
                                            className="w-full border rounded px-2 py-1 text-sm focus:outline-none bg-white focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="">Pilih titik kembali</option>
                                            {predefinedIntermediates.map(point => (
                                                <option key={point.id} value={point.id}>
                                                    {point.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Tombol untuk mengatur urutan */}
                                {intermediatePoints.length > 1 && (
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => {
                                                // Pindahkan item pertama ke akhir
                                                const newPoints = [...intermediatePoints];
                                                const first = newPoints.shift();
                                                newPoints.push(first);
                                                setIntermediatePoints(newPoints);
                                            }}
                                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-2 rounded text-xs"
                                        >
                                            Geser Urutan
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Calculate Button */}
                        <button
                            onClick={handleCalculate}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium shadow-md transition-colors flex items-center justify-center"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 mr-2"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            Hitung Rute Optimal
                        </button>
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
                                    style={{ position: 'relative', zIndex: 1 }}
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
                                    {routeResult && routeResult.length > 1 && (
                                        <div className="absolute top-2 right-2 bg-white rounded shadow p-3 space-y-2 z-[1000]">
                                            <h3 className="text-sm font-semibold mb-1">Tampilkan Rute Kapal:</h3>
                                            {routeResult.map(({ ship }, index) => (
                                                <label key={ship.ship_request_id} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={visibleRoutes.includes(ship.ship_request_id)}
                                                        onChange={() => {
                                                            setVisibleRoutes((prev) =>
                                                                prev.includes(ship.ship_request_id)
                                                                    ? prev.filter((id) => id !== ship.ship_request_id)
                                                                    : [...prev, ship.ship_request_id]
                                                            );
                                                        }}
                                                    />
                                                    <span
                                                        className="text-sm"
                                                        style={{ color: visibleRoutes.includes(ship.ship_request_id) ? getRandomColor(index) : '#6B7280' }}
                                                    >
                                                        {ship.name}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                                    {/* Marker untuk start point */}
                                    {startPointType === 'harbor' && selectedStartHarbor && (
                                        <Marker
                                            position={[selectedStartHarbor.latitude, selectedStartHarbor.longitude]}
                                            // icon={harborIcon}
                                        >
                                            <Popup>
                                                <div className="font-medium">
                                                    {selectedStartHarbor.name}
                                                </div>
                                                <div className="text-sm">
                                                    Titik Keberangkatan
                                                </div>
                                                {selectedShips.length > 0 && (
                                                    <div className="text-xs text-blue-600 mt-1">
                                                        Kapal: {selectedShips.map(s => s.name).join(', ')}
                                                    </div>
                                                )}
                                            </Popup>
                                        </Marker>
                                    )}

                                    {/* Markers for platforms */}
                                    {selectedPoints.map((p) => (
                                        <Marker
                                            key={p.ship_request_id}
                                            position={[p.latitude, p.longitude]}
                                            icon={destinationIcon}
                                        >
                                            <Popup>
                                                <div className="font-medium">{p.destination_name}</div>
                                                <div className="text-sm">
                                                    Priority: {p.priority ? "🚨 Yes" : "No"}
                                                    <br />
                                                    Level: <span className={getPriorityColor(p.priority_level).replace('bg-', 'text-')}>{p.priority_level}</span>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    ))}

                                    {/* Markers for ships (jika start dari current position) */}
                                    {startPointType === 'current' && captains.map((c) => {
                                        // cari data posisi terbaru dari state ship
                                        const matched = ship.find((s) => s.mmsi === c.ship_request_id);

                                        // kalau gak ada data posisi kapal, skip render Marker
                                        if (!matched || !matched.lat || !matched.lon) {
                                            console.warn(`⚠️ Tidak ada data posisi kapal untuk Captain ID: ${c.id_captain_ship}`);
                                            return null;
                                        }

                                        const lat = parseFloat(matched.lat);
                                        const lon = parseFloat(matched.lon);

                                        // cek valid angka (biar gak error di map)
                                        if (isNaN(lat) || isNaN(lon)) {
                                            console.warn(`⚠️ Koordinat tidak valid untuk Captain ID: ${c.id_captain_ship}`);
                                            return null;
                                        }

                                        return (
                                            <Marker
                                                key={c.ship_request_id}
                                                position={[lat, lon]}
                                                icon={startIcon}
                                            >
                                                <Popup>
                                                    <div className="font-medium">{c.name}</div>
                                                    <div className="text-sm">Posisi Saat Ini</div>
                                                </Popup>
                                            </Marker>
                                        );
                                    })}

                                    {/* Region Markers */}
                                    {central.map((p) => (
                                        <Marker
                                            key={p.id_central_region}
                                            position={[p.latitude_decimal, p.longitude_decimal]}
                                            icon={centralIcon}
                                        >
                                            <Popup>
                                                <b>{p.platform_name}</b>
                                                <br />
                                                Central Region
                                            </Popup>
                                        </Marker>
                                    ))}

                                    {north.map((p) => (
                                        <Marker
                                            key={p.id_north_region}
                                            position={[p.latitude_decimal, p.longitude_decimal]}
                                            icon={northIcon}
                                        >
                                            <Popup>
                                                <b>{p.platform_name}</b>
                                                <br />
                                                North Region
                                            </Popup>
                                        </Marker>
                                    ))}

                                    {south.map((p) => (
                                        <Marker
                                            key={p.id_south_region}
                                            position={[p.latitude_decimal, p.longitude_decimal]}
                                            icon={southIcon}
                                        >
                                            <Popup>
                                                <b>{p.platform_name}</b>
                                                <br />
                                                South Region
                                            </Popup>
                                        </Marker>
                                    ))}

                                    {tanker.map((p) => (
                                        <Marker
                                            key={p.id_tanker_rig_barge}
                                            position={[p.latitude_decimal, p.longitude_decimal]}
                                            icon={tankerIcon}
                                        >
                                            <Popup>
                                                <b>{p.platform_name}</b>
                                                <br />
                                                Tanker/Rig/Barge
                                            </Popup>
                                        </Marker>
                                    ))}

                                    {other.map((p) => (
                                        <Marker
                                            key={p.id_other_region}
                                            position={[p.latitude_decimal, p.longitude_decimal]}
                                            icon={otherIcon}
                                        >
                                            <Popup>
                                                <b>{p.platform_name}</b>
                                                <br />
                                                Other Region
                                            </Popup>
                                        </Marker>
                                    ))}

                                    {ship.map((p) => (
                                        <Marker
                                            key={p.name}
                                            position={[p.lat, p.lon]}
                                            icon={shipIcon}
                                        >
                                            <Popup>
                                                <b>{p.name}</b>
                                                <br />
                                                Ship
                                            </Popup>
                                        </Marker>
                                    ))}

                                    {/* Di dalam MapContainer, setelah marker untuk region */}
                                    {intermediatePoints.map((point, index) => (
                                        <Marker
                                            key={`intermediate-${point.id}-${index}`}
                                            position={[point.latitude, point.longitude]}
                                            icon={new L.Icon({
                                                iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
                                                iconSize: [25, 25],
                                                className: "intermediate-marker"
                                            })}
                                        >
                                            <Popup>
                                                <div className="font-medium">{point.name}</div>
                                                <div className="text-sm">Titik Perantara (Urutan: {index + 1})</div>
                                            </Popup>
                                        </Marker>
                                    ))}

                                    {returnToIntermediate && returnIntermediatePoint && (
                                        <Marker
                                            position={[returnIntermediatePoint.latitude, returnIntermediatePoint.longitude]}
                                            icon={new L.Icon({
                                                iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
                                                iconSize: [25, 25],
                                                className: "return-intermediate-marker"
                                            })}
                                        >
                                            <Popup>
                                                <div className="font-medium">{returnIntermediatePoint.name}</div>
                                                <div className="text-sm">Titik Kembali</div>
                                            </Popup>
                                        </Marker>
                                    )}

                                    {/* Route lines */}
                                    {routeResult &&
                                        Array.isArray(routeResult) &&
                                        routeResult.map((r, idx) =>
                                            visibleRoutes.includes(r.ship.ship_request_id) ? (
                                                <>
                                                    {/* Garis untuk rute pergi (dari kapal ke platform) */}
                                                    <Polyline
                                                        key={`${r.ship.ship_request_id}-go`}
                                                        positions={r.route.optimal_route
                                                            .slice(0, -1)
                                                            .map((p) => [p.latitude, p.longitude])}
                                                        color={getRandomColor(idx)}
                                                        weight={4}
                                                        opacity={0.7}
                                                    >
                                                    </Polyline>

                                                    {/* Garis untuk rute pulang (dari platform terakhir ke titik akhir) */}
                                                    <Polyline
                                                        key={`${r.ship.ship_request_id}-return`}
                                                        positions={[
                                                            r.route.optimal_route[r.route.optimal_route.length - 2],
                                                            r.route.optimal_route[r.route.optimal_route.length - 1]
                                                        ].map((p) => [p.latitude, p.longitude])}
                                                        color={getRandomColor(idx)}
                                                        weight={4}
                                                        dashArray="10, 10"
                                                        opacity={0.7}
                                                    >
                                                        <Popup>
                                                            <div>
                                                                <b>Rute Pulang:</b> {r.route.optimal_route[r.route.optimal_route.length - 2].name} → {r.route.optimal_route[r.route.optimal_route.length - 1].name}
                                                            </div>
                                                        </Popup>
                                                    </Polyline>
                                                </>
                                            ) : null
                                        )}
                                </MapContainer>
                            </div>
                        </div>

                        {/* Results Section - Tampil di bawah map */}
                        {routeResult && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-bold mb-4 text-blue-700">Hasil Perhitungan Rute</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {Array.isArray(routeResult) ? (
                                        routeResult.map(({ ship, route }, idx) => (
                                            <div
                                                key={ship.ship_request_id}
                                                className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-indigo-50"
                                            >
                                                <div className="flex items-center mb-3">
                                                    <div
                                                        className="w-3 h-3 rounded-full mr-2"
                                                        style={{ backgroundColor: getRandomColor(idx) }}
                                                    ></div>
                                                    <h3 className="font-semibold text-lg">{ship.name}</h3>
                                                </div>
                                                
                                                {/* Info Start Point */}
                                                <div className="mb-3 p-2 bg-blue-100 rounded">
                                                    <p className="text-sm font-medium text-blue-800">
                                                        {startPointType === 'current' 
                                                            ? '🚢 Start dari posisi kapal saat ini' 
                                                            : `🏁 Start dari ${selectedStartHarbor?.name}`}
                                                    </p>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Total Jarak:</span>
                                                        <span className="font-medium">{route.distance?.toFixed(2) ?? 0} km</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Perkiraan Fuel:</span>
                                                        <span className="font-medium">
                                                            {route.fuel_usage?.toFixed(2) ?? 0} Liter
                                                        </span>
                                                    </div>
                                                    {route.fuel_loss > 0 && (
                                                        <div className="flex justify-between text-red-600">
                                                            <span>Fuel Loss karena priority:</span>
                                                            <span className="font-medium">
                                                                {route.fuel_loss?.toFixed(2) ?? 0} Liter
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Di bagian hasil perhitungan */}
                                                <div className="mt-4 pt-3 border-t border-gray-200">
                                                    <h4 className="font-medium mb-2 text-sm text-gray-700">Urutan Rute:</h4>
                                                    <div className="text-sm space-y-1">
                                                        <div className="font-semibold">
                                                            1. {startPointType === 'current' 
                                                                ? `${ship.name} (Posisi Saat Ini)`
                                                                : `${selectedStartHarbor?.name} (Start Pelabuhan)`}
                                                        </div>
                                                        {route.optimal_route.slice(1, -1).filter(point => 
                                                            !point.ship_request_id?.toLowerCase().includes('waypoint') 
                                                        ).map((point, index) => {
                                                            const isIntermediate = point.is_intermediate || !point.ship_request_id;
                                                            return (
                                                                <div key={index} className={`pl-4 ${isIntermediate ? 'text-blue-600' : ''}`}>
                                                                    {index + 2}. {point.destination_name || point.name} 
                                                                    {isIntermediate && '(Titik Perantara)'}
                                                                    {point.priority_level && point.priority_level !== 'normal' && (
                                                                        <span className={`ml-2 text-xs px-1 rounded ${getPriorityColor(point.priority_level)}`}>
                                                                            {point.priority_level}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                        <div className="font-semibold">
                                                            {route.optimal_route.length}. {returnToIntermediate && returnIntermediatePoint
                                                                ? returnIntermediatePoint.name 
                                                                : (startPointType === 'current' ? ship.name : selectedStartHarbor?.name)}
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 text-xs text-gray-500">
                                                        Total Jarak: {route.distance?.toFixed(2)} km |
                                                        Fuel: {route.fuel_usage?.toFixed(2)} Liter
                                                        {route.fuel_loss > 0 && (
                                                            <span className="text-red-600"> | Fuel Loss: {route.fuel_loss?.toFixed(2)} Liter</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Total Jarak:</span>
                                                    <span className="font-medium">
                                                        {routeResult.distance?.toFixed(2) ?? 0} km
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Perkiraan Fuel:</span>
                                                    <span className="font-medium">
                                                        {routeResult.fuel_usage?.toFixed(2) ?? 0} Liter
                                                    </span>
                                                </div>
                                                {routeResult.fuel_loss > 0 && (
                                                    <div className="flex justify-between text-red-600">
                                                        <span>Fuel Loss karena priority:</span>
                                                        <span className="font-medium">
                                                            {routeResult.fuel_loss?.toFixed(2) ?? 0} Liter
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={handleCommit}
                                        className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium shadow-md transition-colors"
                                    >
                                        Commit Rute
                                    </button>
                                </div>
                            </div>

                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FleetRoute;