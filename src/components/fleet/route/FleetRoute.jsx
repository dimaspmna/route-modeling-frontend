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
const harborIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/984/984617.png",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
});

// Di dalam komponen, setelah definisi icon
const predefinedIntermediates = [
    {
        id: "pabelokan",
        name: "Pulau Pabelokan",
        latitude: -5.480025,
        longitude: 106.393659,
        type: "island",
    },
    {
        id: "tanjungpriok",
        name: "Pelabuhan Tanjung Priok",
        latitude: -6.094178,
        longitude: 106.881621,
        type: "harbor",
    },
    {
        id: "kalijapat",
        name: "Pelabuhan Kalijapat",
        latitude: -6.114481,
        longitude: 106.861788,
        type: "harbor",
    },
];

// Data Pelabuhan untuk titik start
const predefinedHarbors = [
    {
        id: "tanjungpriok",
        name: "Pelabuhan Tanjung Priok",
        latitude: -6.094178,
        longitude: 106.881621,
        type: "harbor",
    },
    {
        id: "kalijapat",
        name: "Pelabuhan Kalijapat",
        latitude: -6.114481,
        longitude: 106.861788,
        type: "harbor",
    },
    {
        id: "pabelokan",
        name: "Pulau Pabelokan",
        latitude: -5.480025,
        longitude: 106.393659,
        type: "harbor",
    },
];

// Fungsi sederhana untuk menentukan demand dari request
const getDemandFromRequest = (kategori_request, kuantitas) => {
    const qty = parseFloat(kuantitas) || 0;

    if (kategori_request?.includes("fuel")) {
        return { fuel_demand: qty, fresh_water_demand: 0, passenger_demand: 0 };
    }

    if (kategori_request?.includes("fresh_water")) {
        return { fuel_demand: 0, fresh_water_demand: qty, passenger_demand: 0 };
    }

    if (kategori_request?.includes("passenger")) {
        return { fuel_demand: 0, fresh_water_demand: 0, passenger_demand: qty };
    }

    // Default untuk kategori lainnya
    return { fuel_demand: 0, fresh_water_demand: 0, passenger_demand: 0 };
};

const FleetRoute = () => {
    const [requests, setRequests] = useState([]);
    const [captains, setCaptains] = useState([]);
    const [routeResult, setRouteResult] = useState(null);
    const [selectedPoints, setSelectedPoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedShips, setSelectedShips] = useState([]);
    const [visibleRoutes, setVisibleRoutes] = useState([]);
    const [userData, setUserData] = useState(null);

    // State baru untuk start point
    const [startPointType, setStartPointType] = useState("current");
    const [selectedStartHarbor, setSelectedStartHarbor] = useState(null);

    // State untuk mengelola tampilan rute
    const [displayMode, setDisplayMode] = useState("optimal"); // 'optimal' atau 'priority'
    const [routeColors, setRouteColors] = useState({});

    // State untuk menambah lokasi custom dari platform
    const [showAddPlatform, setShowAddPlatform] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredPlatforms, setFilteredPlatforms] = useState([]);

    const [shipsData, setShipsData] = useState([]);
    const [harborShips, setHarborShips] = useState([]); // Kapal yang

    // State untuk input demand untuk platform custom
    const [customDemand, setCustomDemand] = useState({
        fuel_demand: 0,
        fresh_water_demand: 0,
        passenger_demand: 0,
        priority_level: "normal",
    });

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

    // Gabungkan semua platform menjadi satu array
    const [allPlatforms, setAllPlatforms] = useState([]);

    const [intermediatePoints, setIntermediatePoints] = useState([]);
    const [returnToIntermediate, setReturnToIntermediate] = useState(false);
    const [returnIntermediatePoints, setReturnIntermediatePoints] = useState([]);

    // Custom locations yang ditambahkan user dari platform
    const [customPlatforms, setCustomPlatforms] = useState([]);

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                setUserData(user);
            } catch (error) {
                console.error("Error parsing user data:", error);
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

                // Gabungkan semua platform
                const platforms = [
                    ...(c.data.data || []).map((p) => ({ ...p, region: "central" })),
                    ...(n.data.data || []).map((p) => ({ ...p, region: "north" })),
                    ...(s.data.data || []).map((p) => ({ ...p, region: "south" })),
                    ...(t.data.data || []).map((p) => ({ ...p, region: "tanker" })),
                    ...(o.data.data || []).map((p) => ({ ...p, region: "other" })),
                ];

                setAllPlatforms(platforms);
                setFilteredPlatforms(platforms);

                // Filter kapal yang akan dijadikan pelabuhan
                const harborShipNames = ["TRANSKO HARMONY", "OCBTANJUNGLESUNG"];
                const filteredHarborShips = sh.data.data
                    .filter((ship) => harborShipNames.includes(ship.name))
                    .map((ship) => ({
                        id: `${ship.mmsi}`,
                        name: ship.name,
                        latitude: parseFloat(ship.lat),
                        longitude: parseFloat(ship.lon),
                        type: "ship_harbor",
                        mmsi: ship.mmsi,
                        is_ship: true,
                    }));
                setHarborShips(filteredHarborShips);
            } catch (err) {
                console.error("Gagal ambil data region:", err);
            }
        };
        fetchRegions();
    }, []);

    const allHarborPoints = React.useMemo(() => {
        return [...predefinedHarbors, ...harborShips];
    }, [harborShips]);

    const allIntermediatePoints = React.useMemo(() => {
        return [...predefinedIntermediates, ...harborShips];
    }, [harborShips]);

    // Effect untuk filter platform berdasarkan search term
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredPlatforms(allPlatforms);
        } else {
            const filtered = allPlatforms.filter((platform) => platform.platform_name.toLowerCase().includes(searchTerm.toLowerCase()));
            setFilteredPlatforms(filtered);
        }
    }, [searchTerm, allPlatforms]);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await API.get("/get-approved-request");
                const filtered = res.data.filter((r) => [r.status_request === "approved" && "approve with note"] && r.fleet_status === "process");
                const points = filtered.map((r) => {
                    const demand = getDemandFromRequest(r.kategori_request, r.kuantitas);

                    return {
                        latitude: parseFloat(r.lat_request),
                        longitude: parseFloat(r.lng_request),
                        name: r.name,
                        destination_name: r.destination_name,
                        priority_level: r.priority_level || "normal",
                        ship_request_id: r.ship_request_id,
                        kategori_request: r.kategori_request || "-",
                        jenis_material: r.jenis_material || "-",
                        kuantitas: r.kuantitas || "-",
                        satuan: r.satuan || "-",
                        // Data demand dari database request
                        fuel_demand: demand.fuel_demand,
                        fresh_water_demand: demand.fresh_water_demand,
                        passenger_demand: demand.passenger_demand,
                        isRequest: true, // Flag untuk membedakan dengan custom platform
                    };
                });
                setRequests(points);
                // Auto select semua approved requests
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
            if (!userData?.region) return;
            try {
                const userRegion = userData?.region;
                console.log("Fetching captains with region:", userRegion);

                const res = await API.get(`/captains?status=active&region=${userRegion}`);
                const formatted = res.data.map((c) => ({
                    ship_request_id: c.id_captain_ship,
                    name: c.name,
                    latitude: parseFloat(c.latitude),
                    longitude: parseFloat(c.longitude),
                    // ✅ Data kapasitas dari tabel captain
                    max_fuel: parseFloat(c.max_load_fuel) || 100000,
                    max_fresh_water: parseFloat(c.max_load_fw) || 100000,
                    max_passengers: parseInt(c.max_passenger) || 10,
                    // Data tambahan jika ada
                    fuel_demand: 0, // Kapal tidak punya demand, hanya capacity
                    fresh_water_demand: 0,
                    passenger_demand: 0,
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

    // Fungsi untuk menambah platform custom
    const handleAddPlatform = () => {
        if (!selectedPlatform) {
            alert("Pilih platform terlebih dahulu!");
            return;
        }

        const customId = `custom_${Date.now()}`;
        const newCustomPlatform = {
            customId,
            name: selectedPlatform.platform_name,
            destination_name: selectedPlatform.platform_name,
            latitude: parseFloat(selectedPlatform.latitude_decimal),
            longitude: parseFloat(selectedPlatform.longitude_decimal),
            priority_level: customDemand.priority_level,
            fuel_demand: customDemand.fuel_demand || 0,
            fresh_water_demand: customDemand.fresh_water_demand || 0,
            passenger_demand: customDemand.passenger_demand || 0,
            region: selectedPlatform.region,
            isCustom: true,
        };

        setCustomPlatforms([...customPlatforms, newCustomPlatform]);
        setSelectedPoints([...selectedPoints, newCustomPlatform]);

        // Reset form
        setSelectedPlatform(null);
        setCustomDemand({
            fuel_demand: 0,
            fresh_water_demand: 0,
            passenger_demand: 0,
            priority_level: "normal",
        });
        setShowAddPlatform(false);
    };

    // Fungsi untuk menghapus platform custom
    const handleRemoveCustomPlatform = (customId) => {
        setCustomPlatforms((prev) => prev.filter((platform) => platform.customId !== customId));
        setSelectedPoints((prev) => prev.filter((p) => p.customId !== customId));
    };

    // Toggle point selection
    const togglePoint = (point) => {
        const pointId = point.ship_request_id || point.customId;
        const exists = selectedPoints.find((p) => p.ship_request_id === pointId || p.customId === pointId);

        if (exists) {
            setSelectedPoints(selectedPoints.filter((p) => p.ship_request_id !== pointId && p.customId !== pointId));
        } else {
            setSelectedPoints([...selectedPoints, point]);
        }
    };

    // Fungsi helper untuk format waktu
    const formatJamMenit = (jam) => {
        const totalMenit = jam * 60;
        const jamInt = Math.floor(totalMenit / 60);
        const menit = Math.floor(totalMenit % 60);

        if (jamInt === 0) return `${menit} menit`;
        if (menit === 0) return `${jamInt} jam`;
        return `${jamInt} jam ${menit} menit`;
    };

    // Fungsi untuk menghasilkan warna yang konsisten
    const getRouteColor = (shipId, type = "optimal") => {
        const key = `${shipId}_${type}`;
        if (!routeColors[key]) {
            const colors = ["#3B82F6", "#10B981", "#EF4444", "#8B5CF6", "#F59E0B", "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1"];
            const colorIndex = Object.keys(routeColors).length % colors.length;
            setRouteColors((prev) => ({
                ...prev,
                [key]: colors[colorIndex],
            }));
            return colors[colorIndex];
        }
        return routeColors[key];
    };

    // Fungsi validasi kapasitas
    const validateCapacity = () => {
        let totalFuel = 0;
        let totalFreshWater = 0;
        let totalPassengers = 0;

        selectedPoints.forEach((point) => {
            totalFuel += point.fuel_demand || 0;
            totalFreshWater += point.fresh_water_demand || 0;
            totalPassengers += point.passenger_demand || 0;
        });

        const totalShipFuel = selectedShips.reduce((sum, ship) => sum + (ship.max_fuel || 0), 0);
        const totalShipFreshWater = selectedShips.reduce((sum, ship) => sum + (ship.max_fresh_water || 0), 0);
        const totalShipPassengers = selectedShips.reduce((sum, ship) => sum + (ship.max_passengers || 0), 0);

        const errors = [];

        if (totalFuel > totalShipFuel) {
            errors.push(`Total fuel demand (${totalFuel}L) melebihi kapasitas kapal (${totalShipFuel}L)`);
        }
        if (totalFreshWater > totalShipFreshWater) {
            errors.push(`Total fresh water demand (${totalFreshWater}L) melebihi kapasitas kapal (${totalShipFreshWater}L)`);
        }
        if (totalPassengers > totalShipPassengers) {
            errors.push(`Total pax (${totalPassengers}) melebihi kapasitas kapal (${totalShipPassengers})`);
        }

        if (errors.length > 0) {
            alert(errors.join("\n"));
            return false;
        }

        return true;
    };

    const handleCalculate = async () => {
        if (!selectedPoints.length) return alert("Pilih minimal 1 titik");
        if (selectedShips.length === 0) return alert("Pilih minimal 1 kapal");

        // Validasi kapasitas
        if (!validateCapacity()) {
            return;
        }

        let results = [];
        setLoading(true);

        const body = {
            starts: selectedShips
                .map((selected) => {
                    let startData;

                    if (startPointType === "current") {
                        const matched = ship.find((s) => s.mmsi === selected.ship_request_id);
                        startData = {
                            ship_request_id: selected.ship_request_id,
                            name: selected.name, // Nama kapal untuk start dari posisi kapal
                            destination_name: selected.name, // Tambahkan destination_name
                            latitude: matched?.lat || selected.latitude,
                            longitude: matched?.lon || selected.longitude,
                            priority_level: selected.priority_level || "normal",
                            is_intermediate: false,
                            start_type: "current",
                            // ✅ Data demand untuk start point (selalu 0)
                            fuel_demand: 0,
                            fresh_water_demand: 0,
                            passenger_demand: 0,
                        };
                    } else {
                        if (!selectedStartHarbor) {
                            console.warn(`⚠️ Harbor not selected for VRP`);
                            return null;
                        }
                        startData = {
                            ship_request_id: selected.ship_request_id,
                            name: selected.name, // Nama pelabuhan untuk start dari pelabuhan
                            destination_name: selectedStartHarbor.name, // Destination name juga pelabuhan
                            latitude: selectedStartHarbor.latitude,
                            longitude: selectedStartHarbor.longitude,
                            priority_level: "normal",
                            is_intermediate: false,
                            start_type: "harbor",
                            harbor_name: selectedStartHarbor.name,
                            // ✅ Data demand untuk start point (selalu 0)
                            fuel_demand: 0,
                            fresh_water_demand: 0,
                            passenger_demand: 0,
                        };
                    }

                    return startData;
                })
                .filter(Boolean),

            points: selectedPoints.map((p) => ({
                ship_request_id: p.ship_request_id || p.customId || `custom_${Date.now()}`,
                name: p.name || p.destination_name,
                destination_name: p.destination_name || p.name,
                latitude: parseFloat(p.latitude),
                longitude: parseFloat(p.longitude),
                priority_level: p.priority_level || "normal",
                is_intermediate: false,
                // ✅ Data demand untuk setiap titik
                fuel_demand: p.fuel_demand || 0,
                fresh_water_demand: p.fresh_water_demand || 0,
                passenger_demand: p.passenger_demand || 0,
            })),
            intermediate_points: intermediatePoints.map((point, index) => ({
                ship_request_id: `intermediate_${point.id}_${index}`,
                name: point.name,
                destination_name: point.name, // Tambahkan destination_name
                latitude: point.latitude,
                longitude: point.longitude,
                priority_level: "normal",
                is_intermediate: true,
                // ✅ Data demand untuk intermediate points (selalu 0)
                fuel_demand: 0,
                fresh_water_demand: 0,
                passenger_demand: 0,
            })),
            return_to_intermediate: returnToIntermediate,
            return_intermediate_points:
                returnToIntermediate && returnIntermediatePoints.length > 0
                    ? returnIntermediatePoints.map((point, idx) => ({
                          ship_request_id: `return_intermediate_${point.id}_${idx}`,
                          name: point.name,
                          latitude: point.latitude,
                          longitude: point.longitude,
                          priority_level: "normal",
                          is_intermediate: true,
                          fuel_demand: 0,
                          fresh_water_demand: 0,
                          passenger_demand: 0,
                      }))
                    : [],
            return_to_start: !returnToIntermediate,
            time_limit_seconds: 5,
            // ✅ Ship capacities dari data captain
            ship_capacities: selectedShips.map((ship) => ({
                max_fuel: ship.max_fuel || 1000,
                max_fresh_water: ship.max_fresh_water || 500,
                max_passengers: ship.max_passengers || 10,
            })),
        };

        console.log("VRP Request Body dengan Kapasitas:", body);

        try {
            const res = await axios.post(process.env.REACT_APP_VRP_API_URL + '/solve-vrp', body, {
                timeout: 120000,
            });

            console.log("VRP Response dengan Kapasitas:", res.data);

            // Handle new response format with both routes
            results = res.data.routes.map((routeData) => ({
                ship: routeData.ship,
                routes: routeData.routes,
                has_priority_points: routeData.has_priority_points,
                capacity_info: routeData.capacity_info, // ✅ Include capacity info
            }));
        } catch (error) {
            console.error("VRP calculation error:", error);
            alert("Error dalam perhitungan VRP: " + (error.response?.data?.detail || error.message));
            setLoading(false);
            return;
        }

        setRouteResult(results);
        setVisibleRoutes(results.map((r) => r.ship.ship_request_id));
        setDisplayMode("optimal"); // Default tampilkan rute optimal
        setLoading(false);
    };

    const handlePriorityChange = async (pointId, newLevel) => {
        try {
            // Jika ini adalah approved request, update ke backend
            if (!pointId.startsWith("custom_")) {
                await API.put(`/ship-requests/${pointId}`, {
                    priority_level: newLevel,
                });
            }

            // Update requests state
            setRequests((prev) => prev.map((r) => (r.ship_request_id === pointId ? { ...r, priority_level: newLevel } : r)));

            // Update selected points
            setSelectedPoints((prev) =>
                prev.map((p) => {
                    if (p.ship_request_id === pointId || p.customId === pointId) {
                        return { ...p, priority_level: newLevel };
                    }
                    return p;
                })
            );

            // Update custom platforms
            setCustomPlatforms((prev) => prev.map((platform) => (platform.customId === pointId ? { ...platform, priority_level: newLevel } : platform)));
        } catch (err) {
            console.error("Error update priority", err);
        }
    };

    // Helper function untuk mengecek apakah ada priority points
    const hasPriorityPoints = () => {
        return routeResult?.some((routeData) => routeData.has_priority_points === true);
    };

    // Helper function untuk mengecek apakah ada rute priority yang butuh approval
    const hasPriorityRoutes = () => {
        return routeResult?.some((routeData) => routeData.routes?.priority_route && routeData.routes.priority_route.fuel_loss > 0);
    };

    // Helper function untuk mengecek apakah kapal punya rute yang valid
    const hasValidRoute = (routeData) => {
        if (!routeData.routes) return false;

        const optimalRoute = routeData.routes.optimal_route;
        const priorityRoute = routeData.routes.priority_route;

        // Kapal dianggap punya rute valid jika:
        // 1. Optimal route ada dan punya lebih dari 1 titik (start + minimal 1 destination)
        // 2. Atau priority route ada dan punya lebih dari 1 titik
        const hasValidOptimal = optimalRoute?.route?.length > 1;
        const hasValidPriority = priorityRoute?.route?.length > 1;

        return hasValidOptimal || hasValidPriority;
    };

    // Fungsi commit yang baru untuk menyimpan kedua rute
    const handleCommit = async () => {
        if (!routeResult || (!Array.isArray(routeResult) && !Array.isArray(routeResult.routes))) {
            return alert("Belum ada hasil perhitungan!");
        }

        try {
            console.log("🔍 Debug routeResult:", routeResult);

            const routeArray = Array.isArray(routeResult.routes) ? routeResult.routes : routeResult;

            const routesForCommit = [];
            const user_id = "USER_ID"; // Ganti dengan user ID dari context/auth

            // ✅ CEK APAKAH ADA PRIORITY POINTS
            const hasPriorityPoints = routeArray.some((routeItem) => routeItem.has_priority_points === true);

            console.log(`📊 Status Priority Points: ${hasPriorityPoints ? "ADA" : "TIDAK ADA"}`);

            let totalShipsSkipped = 0;
            const skippedShips = [];

            // Format data untuk endpoint /commit-routes
            for (const routeItem of routeArray) {
                const { ship, routes } = routeItem || {};

                if (!ship || !routes) {
                    console.warn("❌ Data rute tidak lengkap:", routeItem);
                    continue;
                }

                // ✅ CEK APAKAH KAPAL INI PUNYA RUTE YANG VALID
                if (!hasValidRoute(routeItem)) {
                    console.log(`⏭️ Skip kapal ${ship.name} - tidak ada rute yang valid`);
                    totalShipsSkipped++;
                    skippedShips.push(ship.name);
                    continue;
                }

                console.log(`🚢 Processing ship: ${ship.name}`, ship.ship_request_id);

                // ✅ PERBAIKAN: DAPATKAN NAMA KAPAL YANG BENAR DARI DATA CAPTAINS
                const shipName = captains.find((captain) => captain.ship_request_id === ship.ship_request_id)?.name || ship.name || "Unknown Ship";

                console.log(`📝 Nama kapal yang akan disimpan: ${shipName}`);

                // Format optimal route
                const optimalRoute = {
                    distance: routes.optimal_route?.distance || 0,
                    fuel_usage: routes.optimal_route?.fuel_usage || 0,
                    fuel_loss: 0, // Optimal route tidak ada fuel loss
                    est_waktu_tempuh: (routes.optimal_route?.distance || 0) / 36,
                    full_route_sequence:
                        routes.optimal_route?.route?.map((point, index) => ({
                            sequence: index + 1,
                            ship_request_id: point.ship_request_id || "",
                            point_id: point.id || `${ship.ship_request_id}_${index}`,
                            point_name: point.destination_name || point.name || `Point ${index + 1}`,
                            latitude: point.latitude || 0,
                            longitude: point.longitude || 0,
                            point_type: index === 0 ? "start" : index === routes.optimal_route.route.length - 1 ? "end" : "visit",
                            priority_level: point.priority_level || "normal",
                            passenger_demand: point.passenger_demand || 0,
                            fuel_demand: point.fuel_demand || 0,
                            fresh_water_demand: point.fresh_water_demand || 0,
                            timestamp: new Date(Date.now() + index * 600000).toISOString(),
                            is_intermediate: !point.ship_request_id,
                            // Tambahkan informasi start jika point pertama
                            ...(index === 0 && {
                                start_type: ship.start_type || "current",
                                harbor_name: ship.harbor_name || null,
                            }),
                        })) || [],
                };

                // Format priority route jika ada
                let priorityRoute = null;
                if (hasPriorityPoints && routes.priority_route?.route?.length > 1) {
                    priorityRoute = {
                        distance: routes.priority_route?.distance || 0,
                        fuel_usage: routes.priority_route?.fuel_usage || 0,
                        fuel_loss: routes.priority_route?.fuel_loss || 0,
                        est_waktu_tempuh: (routes.priority_route?.distance || 0) / 36,
                        full_route_sequence: routes.priority_route.route.map((point, index) => ({
                            sequence: index + 1,
                            ship_request_id: point.ship_request_id || "",
                            point_id: point.id || `${ship.ship_request_id}_${index}`,
                            point_name: point.destination_name || point.name || `Point ${index + 1}`,
                            latitude: point.latitude || 0,
                            longitude: point.longitude || 0,
                            point_type: index === 0 ? "start" : index === routes.priority_route.route.length - 1 ? "end" : "visit",
                            priority_level: point.priority_level || "normal",
                            passenger_demand: point.passenger_demand || 0,
                            fuel_demand: point.fuel_demand || 0,
                            fresh_water_demand: point.fresh_water_demand || 0,
                            timestamp: new Date(Date.now() + index * 600000).toISOString(),
                            is_intermediate: !point.ship_request_id,
                            // Tambahkan informasi start jika point pertama
                            ...(index === 0 && {
                                start_type: ship.start_type || "current",
                                harbor_name: ship.harbor_name || null,
                            }),
                        })),
                    };
                }

                // Tambahkan data untuk commit
                routesForCommit.push({
                    ship: {
                        ship_request_id: ship.ship_request_id || "",
                        name: shipName,
                    },
                    optimal_route: optimalRoute,
                    priority_route: priorityRoute,
                });
            }

            if (routesForCommit.length === 0) {
                alert("Tidak ada rute yang valid untuk di-commit");
                return;
            }

            // Gunakan endpoint /commit-routes
            const commitData = {
                routes: routesForCommit,
                user_id: user_id,
            };

            console.log("📤 Mengirim ke endpoint /commit-routes:", commitData);

            // Kirim ke endpoint /commit-routes
            const response = await API.post("/commit-routes", commitData);

            console.log("✅ Response commit:", response.data);

            // Update status request untuk points yang sudah di-deliver
            let totalStatusUpdated = 0;
            const errors = [];

            // Loop melalui semua routes untuk update status
            for (const routeItem of routesForCommit) {
                const { ship, optimal_route, priority_route } = routeItem;

                // Update status untuk optimal route
                if (optimal_route?.full_route_sequence) {
                    const pointsWithRequestId = optimal_route.full_route_sequence.filter(
                        (p) =>
                            p &&
                            p.ship_request_id &&
                            typeof p.ship_request_id === "string" &&
                            p.ship_request_id.length > 0 &&
                            !p.ship_request_id.startsWith("custom_") &&
                            !p.ship_request_id.startsWith("intermediate_") &&
                            !p.ship_request_id.startsWith("return_intermediate_") &&
                            !p.ship_request_id.startsWith("waypoint_") &&
                            !p.is_intermediate &&
                            p.ship_request_id !== ship.ship_request_id &&
                            p.point_type === "visit" // Hanya update status untuk titik visit, bukan start/end
                    );

                    for (const point of pointsWithRequestId) {
                        try {
                            await API.patch(`/update-fleet-status/${point.ship_request_id}`, {
                                fleet_status: "delivered",
                                status_request: "approved",
                            });
                            totalStatusUpdated++;
                            console.log(`✅ Status updated untuk: ${point.ship_request_id}`);
                        } catch (updateError) {
                            const errorMsg = `Gagal update status ${point.ship_request_id}: ${updateError.response?.data?.msg || updateError.message}`;
                            console.error(`❌ ${errorMsg}`);
                            errors.push(errorMsg);
                        }
                    }
                }
            }

            // Tampilkan hasil
            if (response.data.saved_routes) {
                const savedRoutes = response.data.saved_routes;
                const totalOptimal = savedRoutes.filter((r) => r.optimal_route_id).length;
                const totalPriority = savedRoutes.filter((r) => r.priority_route_id).length;

                let successMessage =
                    `✅ Commit selesai!\n\n` +
                    `• Total rute: ${response.data.total_routes}\n` +
                    `• Rute optimal: ${totalOptimal}\n` +
                    `• Rute priority: ${totalPriority}\n` +
                    `• ${totalStatusUpdated} status request diupdate\n` +
                    `• ${totalShipsSkipped} kapal dilewati\n\n`;

                // Tampilkan detail priority routes jika ada
                if (totalPriority > 0) {
                    successMessage += `📊 Rute priority (butuh approval SPV):\n`;
                    savedRoutes.forEach((route, index) => {
                        if (route.priority_route_id) {
                            successMessage += `- Priority ID: ${route.priority_route_id}\n`;
                            successMessage += `  Parent ID: ${route.optimal_route_id || "Tidak ada"}\n`;
                            successMessage += `  Status: ${route.needs_approval ? "Butuh Approval" : "Tidak Butuh"}\n\n`;
                        }
                    });
                }

                // Tambahkan informasi kapal yang dilewati jika ada
                if (skippedShips.length > 0) {
                    successMessage += `⏭️ Kapal yang dilewati:\n- ${skippedShips.join("\n- ")}`;
                }

                if (errors.length > 0) {
                    alert(
                        `Proses commit selesai dengan beberapa error:\n\n` +
                            successMessage +
                            `\n\n❌ ${errors.length} error saat update status:\n- ${errors.slice(0, 5).join("\n- ")}${errors.length > 5 ? "\n- ..." : ""}`
                    );
                } else {
                    alert(successMessage);
                }
            } else {
                alert(`✅ ${response.data.msg}`);
            }

            // Reset state
            setRouteResult(null);
        } catch (err) {
            console.error("❌ Commit gagal:", err.response?.data || err.message);
            alert("Gagal commit rute: " + (err.response?.data?.msg || err.message));
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

    // Helper function untuk mendapatkan rute yang aktif berdasarkan display mode
    const getActiveRoute = (routeData) => {
        if (!routeData.routes) return null;

        if (displayMode === "priority" && routeData.routes.priority_route) {
            return routeData.routes.priority_route;
        }
        return routeData.routes.optimal_route;
    };

    // Fungsi untuk menampilkan informasi kapasitas di UI
    const renderCapacityInfo = (routeData) => {
        if (!routeData.capacity_info) return null;

        const { max_fuel, max_fresh_water, max_passengers } = routeData.capacity_info;
        const activeRoute = getActiveRoute(routeData);
        const usedCapacity = activeRoute?.capacity_used || { fuel: 0, fresh_water: 0, passengers: 0 };

        return (
            <div className="mt-3 p-2 bg-gray-50 rounded border">
                <h4 className="font-medium text-sm mb-2">📊 Kapasitas Kapal:</h4>
                <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                        <span>Fuel:</span>
                        <span>
                            {usedCapacity.fuel?.toFixed(1)} / {max_fuel} L<span className="ml-1 text-gray-500">({((usedCapacity.fuel / max_fuel) * 100).toFixed(1)}%)</span>
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Fresh Water:</span>
                        <span>
                            {usedCapacity.fresh_water?.toFixed(1)} / {max_fresh_water} L<span className="ml-1 text-gray-500">({((usedCapacity.fresh_water / max_fresh_water) * 100).toFixed(1)}%)</span>
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Passengers:</span>
                        <span>
                            {usedCapacity.passengers} / {max_passengers}
                            <span className="ml-1 text-gray-500">({((usedCapacity.passengers / max_passengers) * 100).toFixed(1)}%)</span>
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    // Helper function untuk menampilkan jumlah kapal yang akan di-commit
    const getCommitSummary = () => {
        if (!routeResult) return null;

        const totalShips = routeResult.length;
        const shipsWithRoutes = routeResult.filter(hasValidRoute).length;
        const shipsWithoutRoutes = totalShips - shipsWithRoutes;

        return {
            totalShips,
            shipsWithRoutes,
            shipsWithoutRoutes,
        };
    };

    const commitSummary = getCommitSummary();

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
                <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-blue-700">Fleet Route Management</h1>
                    <p className="text-gray-600">Optimalkan rute pengiriman dengan VRP</p>
                </div>
            </header>

            <div className="mx-auto sm:px-6 lg:px-8 py-6">
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
                                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                                            selectedShips.some((s) => s.ship_request_id === c.ship_request_id) ? "bg-blue-50 border border-blue-200" : "bg-gray-50 hover:bg-gray-100"
                                        }`}
                                        onClick={() => {
                                            const exists = selectedShips.find((s) => s.ship_request_id === c.ship_request_id);
                                            if (exists) {
                                                setSelectedShips(selectedShips.filter((s) => s.ship_request_id !== c.ship_request_id));
                                            } else {
                                                setSelectedShips([...selectedShips, c]);
                                            }
                                        }}
                                    >
                                        <div
                                            className={`w-4 h-4 rounded-full mr-3 ${selectedShips.some((s) => s.ship_request_id === c.ship_request_id) ? "bg-blue-500" : "border-2 border-gray-300"}`}
                                        ></div>
                                        <div className="flex-1">
                                            <p className="font-medium">{c.name}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Kapasitas: {c.max_fuel}L fuel, {c.max_fresh_water}L air, {c.max_passengers} pax
                                            </p>
                                        </div>
                                        <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Titik Section dengan fitur tambah platform */}
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-lg font-semibold text-gray-700">Titik Pengiriman</h2>
                                <div className="flex items-center space-x-2">
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{selectedPoints.length} dipilih</span>
                                    <button onClick={() => setShowAddPlatform(true)} className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded-lg flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Tambah Tujuan
                                    </button>
                                </div>
                            </div>

                            {/* Form pilih platform dan isi demand */}
                            {showAddPlatform && (
                                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <h3 className="font-medium text-blue-800 mb-3">📍 Tambah Tujuan</h3>
                                    <div className="space-y-3">
                                        {/* Search Bar untuk platform */}
                                        <div>
                                            <input
                                                type="text"
                                                placeholder="Cari Tujuan..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                            />
                                        </div>

                                        {/* List platform */}
                                        <div className="max-h-40 overflow-y-auto border rounded">
                                            {filteredPlatforms.map((platform) => (
                                                <div
                                                    key={`${platform.region}_${platform.platform_name}`}
                                                    className={`p-2 cursor-pointer hover:bg-gray-100 ${selectedPlatform?.platform_name === platform.platform_name ? "bg-blue-100" : ""}`}
                                                    onClick={() => setSelectedPlatform(platform)}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="font-medium text-sm">{platform.platform_name}</p>
                                                            <p className="text-xs text-gray-500">{platform.region} Region</p>
                                                        </div>
                                                        {selectedPlatform?.platform_name === platform.platform_name && (
                                                            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Form input demand untuk platform yang dipilih */}
                                        {selectedPlatform && (
                                            <div className="mt-3 p-3 bg-white rounded border">
                                                <h4 className="font-medium text-sm mb-2">Demand untuk {selectedPlatform.platform_name}</h4>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Fuel (L)</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            placeholder="0"
                                                            value={customDemand.fuel_demand === 0 ? "" : customDemand.fuel_demand}
                                                            onChange={(e) =>
                                                                setCustomDemand({
                                                                    ...customDemand,
                                                                    fuel_demand: parseFloat(e.target.value) || 0,
                                                                })
                                                            }
                                                            className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Fresh Water (L)</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            placeholder="0"
                                                            value={customDemand.fresh_water_demand === 0 ? "" : customDemand.fresh_water_demand}
                                                            onChange={(e) =>
                                                                setCustomDemand({
                                                                    ...customDemand,
                                                                    fresh_water_demand: parseFloat(e.target.value) || 0,
                                                                })
                                                            }
                                                            className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Passenger</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            placeholder="0"
                                                            value={customDemand.passenger_demand === 0 ? "" : customDemand.passenger_demand}
                                                            onChange={(e) =>
                                                                setCustomDemand({
                                                                    ...customDemand,
                                                                    passenger_demand: parseInt(e.target.value) || 0,
                                                                })
                                                            }
                                                            className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="mt-2">
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Priority Level</label>
                                                    <select
                                                        value={customDemand.priority_level}
                                                        onChange={(e) => setCustomDemand({ ...customDemand, priority_level: e.target.value })}
                                                        className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                                    >
                                                        <option value="normal">Normal</option>
                                                        <option value="urgent">Urgent</option>
                                                        <option value="emergency">Emergency</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex space-x-2">
                                            <button
                                                onClick={handleAddPlatform}
                                                disabled={!selectedPlatform}
                                                className={`flex-1 py-2 px-4 rounded text-sm font-medium ${
                                                    selectedPlatform ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                }`}
                                            >
                                                Tambah Tujuan
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowAddPlatform(false);
                                                    setSelectedPlatform(null);
                                                    setSearchTerm("");
                                                    setCustomDemand({
                                                        fuel_demand: 0,
                                                        fresh_water_demand: 0,
                                                        passenger_demand: 0,
                                                        priority_level: "normal",
                                                    });
                                                }}
                                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded text-sm font-medium"
                                            >
                                                Batal
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {/* Approved Requests - TIDAK PERLU INPUT DEMAND */}
                                {requests.map((r) => {
                                    const pointId = r.ship_request_id;
                                    const isSelected = selectedPoints.find((p) => p.ship_request_id === pointId);

                                    return (
                                        <div key={pointId} className={`p-3 rounded-lg transition-all ${isSelected ? "bg-green-50 border border-green-200" : "bg-gray-50 hover:bg-gray-100"}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center cursor-pointer flex-1" onClick={() => togglePoint(r)}>
                                                    <div className={`w-4 h-4 rounded-full mr-3 ${isSelected ? "bg-green-500" : "border-2 border-gray-300"}`}></div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <p className="font-medium text-gray-900">{r.destination_name}</p>
                                                        </div>
                                                        <div className="flex items-center mt-1">
                                                            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(r.priority_level)}`}>{r.priority_level}</span>
                                                        </div>
                                                        <div className="mt-2 text-xs text-gray-600">
                                                            <div className="flex justify-between">
                                                                <span className="font-medium capitalize">Demand: {r.kategori_request?.replace("_", " ")}</span>
                                                                {r.kuantitas !== "-" && (
                                                                    <span className="text-blue-600">
                                                                        {r.kuantitas} {r.satuan}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {r.jenis_material !== "-" && <div className="mt-1">Material: {r.jenis_material}</div>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <select
                                                    value={r.priority_level}
                                                    onChange={(e) => handlePriorityChange(pointId, e.target.value)}
                                                    className="text-xs border rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <option value="normal">Normal</option>
                                                    <option value="urgent">Urgent</option>
                                                    <option value="emergency">Emergency</option>
                                                </select>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Custom Platforms - DENGAN INPUT DEMAND */}
                                {customPlatforms.map((platform) => {
                                    const pointId = platform.customId;
                                    const isSelected = selectedPoints.find((p) => p.customId === pointId);

                                    return (
                                        <div key={pointId} className={`p-3 rounded-lg transition-all ${isSelected ? "bg-purple-50 border border-purple-200" : "bg-gray-50 hover:bg-gray-100"}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center cursor-pointer flex-1" onClick={() => togglePoint(platform)}>
                                                    <div className={`w-4 h-4 rounded-full mr-3 ${isSelected ? "bg-purple-500" : "border-2 border-gray-300"}`}></div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <p className="font-medium text-gray-900">{platform.destination_name}</p>
                                                            <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">Custom</span>
                                                        </div>
                                                        <div className="flex items-center mt-1">
                                                            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(platform.priority_level)}`}>{platform.priority_level}</span>
                                                            <span className="text-xs text-gray-500 ml-2">{platform.region} Region</span>
                                                        </div>
                                                        <div className="mt-2 text-xs text-gray-600">
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <div>Fuel: {platform.fuel_demand}L</div>
                                                                <div>Water: {platform.fresh_water_demand}L</div>
                                                                <div>Passenger: {platform.passenger_demand} Pax</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end space-y-1">
                                                    <div className="flex space-x-1">
                                                        <select
                                                            value={platform.priority_level}
                                                            onChange={(e) => handlePriorityChange(pointId, e.target.value)}
                                                            className="text-xs border rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <option value="normal">Normal</option>
                                                            <option value="urgent">Urgent</option>
                                                            <option value="emergency">Emergency</option>
                                                        </select>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveCustomPlatform(pointId);
                                                            }}
                                                            className="text-red-500 hover:text-red-700 text-sm"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* SETTING RUTE SECTION */}
                        <div className="bg-white rounded-lg shadow p-4">
                            <h2 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">⚙️ Pengaturan Rute</h2>

                            {/* Titik Start Keberangkatan */}
                            <div className="mb-4 pb-3 border-b">
                                <h3 className="font-medium text-gray-700 mb-3">Titik Keberangkatan</h3>

                                <div className="flex space-x-2 mb-3">
                                    <button
                                        onClick={() => setStartPointType("current")}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                            startPointType === "current" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                        }`}
                                    >
                                        Posisi Kapal Sekarang
                                    </button>
                                    <button
                                        onClick={() => setStartPointType("harbor")}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                            startPointType === "harbor" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                        }`}
                                    >
                                        Dari Pelabuhan
                                    </button>
                                </div>

                                {startPointType === "harbor" && (
                                    <div className="mt-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Pelabuhan:</label>
                                        <select
                                            value={selectedStartHarbor ? selectedStartHarbor.id : ""}
                                            onChange={(e) => {
                                                const selected = predefinedHarbors.find((harbor) => harbor.id === e.target.value);
                                                setSelectedStartHarbor(selected || null);
                                            }}
                                            className="w-full border rounded px-3 py-2 text-sm focus:outline-none bg-white focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="">Pilih pelabuhan...</option>
                                            {predefinedHarbors.map((harbor) => (
                                                <option key={harbor.id} value={harbor.id}>
                                                    {harbor.name}
                                                </option>
                                            ))}
                                        </select>
                                        {selectedStartHarbor && (
                                            <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                                                <p className="text-sm font-medium text-green-800">Titik Keberangkatan: {selectedStartHarbor.name}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {startPointType === "current" && (
                                    <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                        <p className="text-sm font-medium text-blue-800">Posisi kapal saat ini</p>
                                    </div>
                                )}
                            </div>

                            {/* Lokasi Pengambilan Supply */}
                            <div className="mb-2">
                                <h3 className="font-medium text-gray-700 mb-3">📦 Lokasi Pengambilan Supply</h3>

                                <div className="mb-3 space-y-2 max-h-32 overflow-y-auto">
                                    {intermediatePoints.map((point, index) => (
                                        <div key={`${point.id}-${index}`} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                                            <div>
                                                <p className="text-sm font-medium">{point.name}</p>
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

                                <div className="mb-3">
                                    <select
                                        value=""
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const selected = predefinedIntermediates.find((point) => point.id === e.target.value);
                                                if (selected && !intermediatePoints.find((p) => p.id === selected.id)) {
                                                    setIntermediatePoints([...intermediatePoints, selected]);
                                                }
                                            }
                                        }}
                                        className="w-full border rounded px-2 py-1 text-sm focus:outline-none bg-white focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">Tambah Lokasi Pengambilan Supply</option>
                                        {predefinedIntermediates.map((point) => (
                                            <option key={point.id} value={point.id}>
                                                {point.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={returnToIntermediate}
                                            onChange={() => {
                                                setReturnToIntermediate(!returnToIntermediate);
                                                // Reset return points jika checkbox diuncheck
                                                if (returnToIntermediate) {
                                                    setReturnIntermediatePoints([]);
                                                }
                                            }}
                                            className="mr-2"
                                        />
                                        <span className="text-sm">Titik Kembali</span>
                                    </label>
                                </div>

                                {returnToIntermediate && (
                                    <div className="space-y-3">
                                        {/* Daftar titik kembali yang sudah dipilih */}
                                        {returnIntermediatePoints.length > 0 && (
                                            <div className="mb-2">
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Titik Kembali Terpilih:</h4>
                                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                                    {returnIntermediatePoints.map((point, index) => (
                                                        <div key={`return-${point.id}-${index}`} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                                                            <div className="flex items-center">
                                                                <div className="w-6 h-6 bg-green-100 text-green-800 rounded-full text-xs flex items-center justify-center mr-2">{index + 1}</div>
                                                                <div>
                                                                    <p className="text-sm font-medium">{point.name}</p>
                                                                    <p className="text-xs text-gray-600">Titik Kembali</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    const newPoints = [...returnIntermediatePoints];
                                                                    newPoints.splice(index, 1);
                                                                    setReturnIntermediatePoints(newPoints);
                                                                }}
                                                                className="text-red-500 hover:text-red-700 text-sm"
                                                            >
                                                                Hapus
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Dropdown untuk menambah titik kembali */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tambah Titik Kembali:</label>
                                            {/* Di bagian dropdown untuk menambah titik kembali */}
                                            <select
                                                value=""
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        const selected = allIntermediatePoints.find((point) => point.id === e.target.value);
                                                        if (selected && !returnIntermediatePoints.find((p) => p.id === selected.id)) {
                                                            setReturnIntermediatePoints([...returnIntermediatePoints, selected]);
                                                        }
                                                    }
                                                }}
                                                className="w-full border rounded px-3 py-2 text-sm focus:outline-none bg-white focus:ring-1 focus:ring-blue-500"
                                            >
                                                <option value="">Pilih titik kembali...</option>
                                                {allIntermediatePoints
                                                    .filter((point) => !returnIntermediatePoints.find((p) => p.id === point.id))
                                                    .map((point) => (
                                                        <option key={point.id} value={point.id}>
                                                            {point.name} {point.is_ship ? "🚢" : ""}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>

                                        {/* Tombol untuk reset semua titik kembali */}
                                        {returnIntermediatePoints.length > 0 && (
                                            <button
                                                onClick={() => setReturnIntermediatePoints([])}
                                                className="w-full py-1.5 px-3 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded border border-red-200 transition-colors"
                                            >
                                                Hapus Semua Titik Kembali
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Calculate Button */}
                        <button
                            onClick={handleCalculate}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium shadow-md transition-colors flex items-center justify-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            Hitung Rute VRP
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Map Section */}
                        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                            <div className="h-96 md:min-h-screen">
                                <MapContainer center={[-5.06, 106.3]} zoom={9} className="h-full w-full rounded-lg" style={{ position: "relative", zIndex: 1 }}>
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
                                                attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                                            />
                                        </LayersControl.BaseLayer>
                                    </LayersControl>
                                    {/* Control untuk toggle rute dan kapal */}
                                    {routeResult && routeResult.length > 0 && (
                                        <div className="absolute top-2 right-2 bg-white rounded shadow p-3 space-y-2 z-[1000] max-w-xs">
                                            <h3 className="text-sm font-semibold mb-1">Tampilkan Rute:</h3>

                                            {/* Toggle Display Mode */}
                                            <div className="flex space-x-2 mb-2">
                                                <button
                                                    onClick={() => setDisplayMode("optimal")}
                                                    className={`flex-1 py-1 px-2 text-xs rounded ${displayMode === "optimal" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
                                                >
                                                    Optimal
                                                </button>
                                                <button
                                                    onClick={() => setDisplayMode("priority")}
                                                    className={`flex-1 py-1 px-2 text-xs rounded ${displayMode === "priority" ? "bg-red-500 text-white" : "bg-gray-200 text-gray-700"}`}
                                                >
                                                    Priority
                                                </button>
                                            </div>

                                            <h3 className="text-sm font-semibold mb-1">Tampilkan Kapal:</h3>
                                            {routeResult.map(({ ship }, index) => (
                                                <label key={ship.ship_request_id} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={visibleRoutes.includes(ship.ship_request_id)}
                                                        onChange={() => {
                                                            setVisibleRoutes((prev) =>
                                                                prev.includes(ship.ship_request_id) ? prev.filter((id) => id !== ship.ship_request_id) : [...prev, ship.ship_request_id]
                                                            );
                                                        }}
                                                    />
                                                    <span
                                                        className="text-sm"
                                                        style={{
                                                            color: visibleRoutes.includes(ship.ship_request_id) ? getRouteColor(ship.ship_request_id, displayMode) : "#6B7280",
                                                        }}
                                                    >
                                                        {ship.name}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    {/* Marker untuk start point */}
                                    {startPointType === "harbor" && selectedStartHarbor && (
                                        <Marker position={[selectedStartHarbor.latitude, selectedStartHarbor.longitude]} icon={startIcon}>
                                            <Popup>
                                                <div className="font-medium">{selectedStartHarbor.name}</div>
                                                <div className="text-sm">Titik Keberangkatan</div>
                                            </Popup>
                                        </Marker>
                                    )}
                                    {/* Markers for selected points (approved requests + custom platforms) */}
                                    {selectedPoints.map((p) => (
                                        <Marker key={p.ship_request_id || p.customId} position={[p.latitude, p.longitude]} icon={destinationIcon}>
                                            <Popup>
                                                <div className="font-medium">{p.destination_name || p.name}</div>
                                                <div className="text-sm">
                                                    Priority Level: <span className={getPriorityColor(p.priority_level).replace("bg-", "text-")}>{p.priority_level}</span>
                                                </div>
                                                {p.isCustom ? (
                                                    <div className="text-sm text-purple-600">📍 Custom Platform ({p.region} Region)</div>
                                                ) : (
                                                    <div className="text-sm text-green-600">✅ Approved Request</div>
                                                )}
                                                {(p.fuel_demand > 0 || p.fresh_water_demand > 0 || p.passenger_demand > 0) && (
                                                    <div className="text-sm mt-1">
                                                        Demand: Fuel {p.fuel_demand}L, Air {p.fresh_water_demand}L, Penumpang {p.passenger_demand}
                                                    </div>
                                                )}
                                            </Popup>
                                        </Marker>
                                    ))}
                                    {/* Markers for ships (jika start dari current position) */}
                                    {startPointType === "current" &&
                                        captains.map((c) => {
                                            const matched = ship.find((s) => s.mmsi === c.ship_request_id);
                                            if (!matched || !matched.lat || !matched.lon) {
                                                return null;
                                            }
                                            const lat = parseFloat(matched.lat);
                                            const lon = parseFloat(matched.lon);
                                            if (isNaN(lat) || isNaN(lon)) {
                                                return null;
                                            }
                                            return (
                                                <Marker key={c.ship_request_id} position={[lat, lon]} icon={startIcon}>
                                                    <Popup>
                                                        <div className="font-medium">{c.name}</div>
                                                        <div className="text-sm">Posisi Saat Ini</div>
                                                        <div className="text-sm">
                                                            Kapasitas: {c.max_fuel}L fuel, {c.max_fresh_water}L air, {c.max_passengers} pax
                                                        </div>
                                                    </Popup>
                                                </Marker>
                                            );
                                        })}
                                    {/* Region Markers - semua platform di map */}
                                    {central.map((p) => (
                                        <Marker key={p.id_central_region} position={[p.latitude_decimal, p.longitude_decimal]} icon={centralIcon}>
                                            <Popup>
                                                <b>{p.platform_name}</b>
                                                <br />
                                                Central Region
                                            </Popup>
                                        </Marker>
                                    ))}
                                    {north.map((p) => (
                                        <Marker key={p.id_north_region} position={[p.latitude_decimal, p.longitude_decimal]} icon={northIcon}>
                                            <Popup>
                                                <b>{p.platform_name}</b>
                                                <br />
                                                North Region
                                            </Popup>
                                        </Marker>
                                    ))}
                                    {south.map((p) => (
                                        <Marker key={p.id_south_region} position={[p.latitude_decimal, p.longitude_decimal]} icon={southIcon}>
                                            <Popup>
                                                <b>{p.platform_name}</b>
                                                <br />
                                                South Region
                                            </Popup>
                                        </Marker>
                                    ))}
                                    {tanker.map((p) => (
                                        <Marker key={p.id_tanker_rig_barge} position={[p.latitude_decimal, p.longitude_decimal]} icon={tankerIcon}>
                                            <Popup>
                                                <b>{p.platform_name}</b>
                                                <br />
                                                Tanker/Rig/Barge
                                            </Popup>
                                        </Marker>
                                    ))}
                                    {other.map((p) => (
                                        <Marker key={p.id_other_region} position={[p.latitude_decimal, p.longitude_decimal]} icon={otherIcon}>
                                            <Popup>
                                                <b>{p.platform_name}</b>
                                                <br />
                                                Other Region
                                            </Popup>
                                        </Marker>
                                    ))}
                                    {ship.map((p) => (
                                        <Marker key={p.name} position={[p.lat, p.lon]} icon={shipIcon}>
                                            <Popup>
                                                <b>{p.name}</b>
                                                <br />
                                                Ship
                                            </Popup>
                                        </Marker>
                                    ))}
                                    {/* Intermediate Points */}
                                    {intermediatePoints.map((point, index) => (
                                        <Marker
                                            key={`intermediate-${point.id}-${index}`}
                                            position={[point.latitude, point.longitude]}
                                            icon={
                                                new L.Icon({
                                                    iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
                                                    iconSize: [25, 25],
                                                })
                                            }
                                        >
                                            <Popup>
                                                <div className="font-medium">{point.name}</div>
                                            </Popup>
                                        </Marker>
                                    ))}
                                    {returnToIntermediate &&
                                        returnIntermediatePoints.map((point, index) => (
                                            <Marker
                                                key={`return-${point.id}-${index}`}
                                                position={[point.latitude, point.longitude]}
                                                icon={
                                                    new L.Icon({
                                                        iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684818.png",
                                                        iconSize: [30, 30],
                                                        iconAnchor: [15, 30],
                                                    })
                                                }
                                            >
                                                <Popup>
                                                    <div className="font-medium">{point.name}</div>
                                                    <div className="text-sm">Titik Kembali #{index + 1}</div>
                                                </Popup>
                                            </Marker>
                                        ))}
                                    // Tambahkan styling untuk badge jumlah titik kembali
                                    {returnToIntermediate && returnIntermediatePoints.length > 0 && (
                                        <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                                            <p className="text-sm font-medium text-green-800">{returnIntermediatePoints.length} titik kembali dipilih</p>
                                        </div>
                                    )}
                                    {/* Route lines - HANYA TAMPILKAN KAPAL YANG PUNYA RUTE VALID */}
                                    {routeResult &&
                                        Array.isArray(routeResult) &&
                                        routeResult.map((routeData, idx) => {
                                            if (!visibleRoutes.includes(routeData.ship.ship_request_id)) return null;
                                            if (!hasValidRoute(routeData)) return null;

                                            const activeRoute = getActiveRoute(routeData);
                                            if (!activeRoute || !activeRoute.route) return null;

                                            const routeColor = getRouteColor(routeData.ship.ship_request_id, displayMode);
                                            const isPriority = displayMode === "priority";

                                            return (
                                                <React.Fragment key={routeData.ship.ship_request_id}>
                                                    {/* Garis untuk rute */}
                                                    <Polyline
                                                        positions={activeRoute.route.map((p) => [p.latitude, p.longitude])}
                                                        color={routeColor}
                                                        weight={isPriority ? 5 : 4}
                                                        opacity={0.8}
                                                        dashArray={isPriority ? "10, 5" : undefined}
                                                    >
                                                        <Popup>
                                                            <div>
                                                                <b>{routeData.ship.name}</b>
                                                                <br />
                                                                <span style={{ color: routeColor }}>{isPriority ? "Rute Priority" : "Rute Optimal"}</span>
                                                                <br />
                                                                Jarak: {activeRoute.distance?.toFixed(2)} km
                                                                <br />
                                                                Fuel: {activeRoute.fuel_usage?.toFixed(2)} L
                                                                {isPriority && activeRoute.fuel_loss > 0 && <br /> && (
                                                                    <span style={{ color: "red" }}>Fuel Loss: {activeRoute.fuel_loss?.toFixed(2)} L</span>
                                                                )}
                                                            </div>
                                                        </Popup>
                                                    </Polyline>
                                                </React.Fragment>
                                            );
                                        })}
                                </MapContainer>
                            </div>
                        </div>

                        {/* Results Section */}
                        {routeResult && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-blue-700">Hasil Perhitungan VRP</h2>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setDisplayMode("optimal")}
                                            className={`px-3 py-1 rounded text-sm font-medium ${displayMode === "optimal" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
                                        >
                                            Tampilkan Optimal
                                        </button>
                                        <button
                                            onClick={() => setDisplayMode("priority")}
                                            className={`px-3 py-1 rounded text-sm font-medium ${displayMode === "priority" ? "bg-red-500 text-white" : "bg-gray-200 text-gray-700"}`}
                                        >
                                            Tampilkan Priority
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {routeResult.map((routeData, idx) => {
                                        const activeRoute = getActiveRoute(routeData);
                                        if (!activeRoute) return null;

                                        const isPriority = displayMode === "priority";
                                        const hasPriorityRoute = routeData.routes?.priority_route;
                                        const routeColor = getRouteColor(routeData.ship.ship_request_id, displayMode);
                                        const isValidRoute = hasValidRoute(routeData);

                                        return (
                                            <div
                                                key={routeData.ship.ship_request_id}
                                                className={`border rounded-lg p-4 ${
                                                    isValidRoute ? "bg-gradient-to-br from-blue-50 to-indigo-50" : "bg-gradient-to-br from-gray-100 to-gray-200 opacity-70"
                                                }`}
                                                style={{ borderLeft: `4px solid ${isValidRoute ? routeColor : "#9CA3AF"}` }}
                                            >
                                                <div className="flex items-center mb-3">
                                                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: isValidRoute ? routeColor : "#9CA3AF" }}></div>
                                                    <h3 className="font-semibold text-lg">{routeData.ship.name}</h3>
                                                    {isPriority && hasPriorityRoute && <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Priority Route</span>}
                                                    {!isValidRoute && <span className="ml-2 bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Tidak Ada Rute</span>}
                                                </div>

                                                {isValidRoute ? (
                                                    <>
                                                        <div className="mb-3 p-2 bg-blue-100 rounded">
                                                            <p className="text-sm font-medium text-blue-800">
                                                                {startPointType === "current" ? "🚢 Start dari posisi kapal saat ini" : `🏁 Start dari ${selectedStartHarbor?.name}`}
                                                            </p>
                                                        </div>

                                                        <div className="space-y-2 mb-4">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Total Jarak:</span>
                                                                <span className="font-medium">{activeRoute.distance?.toFixed(2) ?? 0} km</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Perkiraan Fuel:</span>
                                                                <span className="font-medium">{activeRoute.fuel_usage?.toFixed(2) ?? 0} Liter</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Perkiraan Waktu Tempuh:</span>
                                                                <span className="font-medium">{formatJamMenit((activeRoute.distance || 0) / 36)}</span>
                                                            </div>
                                                            {isPriority && activeRoute.fuel_loss > 0 && (
                                                                <div className="flex justify-between text-red-600">
                                                                    <span>Fuel Loss karena priority:</span>
                                                                    <span className="font-medium">{activeRoute.fuel_loss?.toFixed(2) ?? 0} Liter</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* ✅ TAMBAH: Informasi Kapasitas */}
                                                        {renderCapacityInfo(routeData)}

                                                        <div className="mt-4 pt-3 border-t border-gray-200">
                                                            <h4 className="font-medium mb-2 text-sm text-gray-700">Urutan Rute:</h4>
                                                            <div className="text-sm space-y-1 max-h-40 overflow-y-auto">
                                                                {activeRoute.route.map((point, index) => {
                                                                    const isIntermediate = point.is_intermediate || !point.ship_request_id;
                                                                    const isStart = index === 0;
                                                                    const isEnd = index === activeRoute.route.length - 1;
                                                                    const isCustom = point.ship_request_id?.startsWith("custom_");

                                                                    return (
                                                                        <div
                                                                            key={index}
                                                                            className={`flex items-center ${
                                                                                isStart
                                                                                    ? "font-semibold text-green-600"
                                                                                    : isEnd
                                                                                    ? "font-semibold text-blue-600"
                                                                                    : isIntermediate
                                                                                    ? "text-blue-600"
                                                                                    : isCustom
                                                                                    ? "text-purple-600"
                                                                                    : "text-green-600"
                                                                            }`}
                                                                        >
                                                                            <span className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full text-xs flex items-center justify-center mr-2">
                                                                                {index + 1}
                                                                            </span>
                                                                            <span>
                                                                                {point.destination_name || point.name}
                                                                                {point.priority_level && point.priority_level !== "normal" && !isIntermediate && (
                                                                                    <span className={`ml-2 text-xs px-1 rounded ${getPriorityColor(point.priority_level)}`}>
                                                                                        {point.priority_level}
                                                                                    </span>
                                                                                )}
                                                                                {/* ✅ TAMBAH: Tampilkan demand jika ada */}
                                                                                {(point.fuel_demand > 0 || point.fresh_water_demand > 0 || point.passenger_demand > 0) && !isIntermediate && (
                                                                                    <span className="ml-2 text-xs text-gray-500">
                                                                                        (F:{point.fuel_demand}L, W:{point.fresh_water_demand}
                                                                                        L, P:{point.passenger_demand})
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-center py-4 text-gray-500">
                                                        <p>Kapal ini tidak mendapatkan rute pengiriman</p>
                                                        <p className="text-sm mt-1">Tidak akan di-commit</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-6 flex justify-between items-center">
                                    <div>
                                        {hasPriorityPoints() ? (
                                            <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">⚠️ Beberapa rute priority membutuhkan approval SPV karena ada fuel loss</div>
                                        ) : (
                                            <div className="text-sm text-green-600 bg-green-50 p-2 rounded">✅ Semua rute optimal langsung aktif (tidak ada priority points)</div>
                                        )}
                                        {commitSummary?.shipsWithoutRoutes > 0 && (
                                            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-2">⏭️ {commitSummary.shipsWithoutRoutes} kapal tanpa rute akan dilewati</div>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleCommit}
                                        disabled={commitSummary?.shipsWithRoutes === 0}
                                        className={`${
                                            hasPriorityPoints() ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"
                                        } text-white py-2 px-4 rounded-lg font-medium shadow-md transition-colors ${commitSummary?.shipsWithRoutes === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        {hasPriorityPoints() ? "Commit Semua Rute" : "Commit Rute Optimal"}
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
