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

// Fungsi untuk mendapatkan platform berdasarkan region user
const getPlatformsByRegion = (region, centralData, northData, southData, otherData, tankerData) => {
    switch (region?.toLowerCase()) {
        case "central":
            return centralData.map((platform) => ({
                ...platform,
                region: "central",
                platform_name: platform.platform_name,
                latitude: parseFloat(platform.latitude_decimal),
                longitude: parseFloat(platform.longitude_decimal),
            }));
        case "north":
            return northData.map((platform) => ({
                ...platform,
                region: "north",
                platform_name: platform.platform_name,
                latitude: parseFloat(platform.latitude_decimal),
                longitude: parseFloat(platform.longitude_decimal),
            }));
        case "south":
            return southData.map((platform) => ({
                ...platform,
                region: "south",
                platform_name: platform.platform_name,
                latitude: parseFloat(platform.latitude_decimal),
                longitude: parseFloat(platform.longitude_decimal),
            }));
        case "other":
            return otherData.map((platform) => ({
                ...platform,
                region: "other",
                platform_name: platform.platform_name,
                latitude: parseFloat(platform.latitude_decimal),
                longitude: parseFloat(platform.longitude_decimal),
            }));
        case "tanker":
            return tankerData.map((platform) => ({
                ...platform,
                region: "tanker",
                platform_name: platform.platform_name,
                latitude: parseFloat(platform.latitude_decimal),
                longitude: parseFloat(platform.longitude_decimal),
            }));
        default:
            // Jika region tidak dikenali, gabungkan semua data
            return [
                ...centralData.map((p) => ({
                    ...p,
                    region: "central",
                    latitude: parseFloat(p.latitude_decimal),
                    longitude: parseFloat(p.longitude_decimal),
                })),
                ...northData.map((p) => ({
                    ...p,
                    region: "north",
                    latitude: parseFloat(p.latitude_decimal),
                    longitude: parseFloat(p.longitude_decimal),
                })),
                ...southData.map((p) => ({
                    ...p,
                    region: "south",
                    latitude: parseFloat(p.latitude_decimal),
                    longitude: parseFloat(p.longitude_decimal),
                })),
                ...otherData.map((p) => ({
                    ...p,
                    region: "other",
                    latitude: parseFloat(p.latitude_decimal),
                    longitude: parseFloat(p.longitude_decimal),
                })),
                ...tankerData.map((p) => ({
                    ...p,
                    region: "tanker",
                    latitude: parseFloat(p.latitude_decimal),
                    longitude: parseFloat(p.longitude_decimal),
                })),
            ];
    }
};

const IpbRoute = () => {
    const [platforms, setPlatforms] = useState([]);
    const [filteredPlatforms, setFilteredPlatforms] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
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
    const [displayMode, setDisplayMode] = useState("optimal");
    const [routeColors, setRouteColors] = useState({});

    // State untuk input penumpang
    const [passengerInputs, setPassengerInputs] = useState({});

    // tambahkan state untuk kapal
    const [shipsData, setShipsData] = useState([]);
    const [harborShips, setHarborShips] = useState([]); // Kapal yang dijadikan pelabuhan

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

    const [intermediatePoints, setIntermediatePoints] = useState([]);
    const [returnToIntermediate, setReturnToIntermediate] = useState(false);
    const [returnIntermediatePoints, setReturnIntermediatePoints] = useState([]);

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
                setShipsData(sh.data.data || []); // Simpan semua data kapal

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

    // Effect untuk memuat platform berdasarkan region user
    useEffect(() => {
        if (central.length > 0 || north.length > 0 || south.length > 0 || other.length > 0 || tanker.length > 0) {
            const userPlatforms = getPlatformsByRegion(userData?.region, central, north, south, other, tanker);

            setPlatforms(userPlatforms);
            setFilteredPlatforms(userPlatforms);
            setLoading(false);
        }
    }, [central, north, south, other, tanker, userData]);

    // Effect untuk filter platform berdasarkan search term
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredPlatforms(platforms);
        } else {
            const filtered = platforms.filter((platform) => platform.platform_name.toLowerCase().includes(searchTerm.toLowerCase()));
            setFilteredPlatforms(filtered);
        }
    }, [searchTerm, platforms]);

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
                    max_fuel: parseFloat(c.max_load_fuel) || 100000,
                    max_fresh_water: parseFloat(c.max_load_fw) || 100000,
                    max_passengers: parseInt(c.max_passenger) || 10,
                    fuel_demand: 0,
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

    // Fungsi untuk handle perubahan input penumpang
    const handlePassengerChange = (platformId, value) => {
        // Handle empty string case
        if (value === "") {
            setPassengerInputs((prev) => ({
                ...prev,
                [platformId]: 0,
            }));

            setSelectedPoints((prev) => prev.map((p) => (p.id === platformId || p.platform_name === platformId ? { ...p, passenger_demand: 0 } : p)));
            return;
        }

        const passengerCount = parseInt(value) || 0;

        // Update passengerInputs state
        setPassengerInputs((prev) => ({
            ...prev,
            [platformId]: passengerCount,
        }));

        // Update selectedPoints jika platform sudah dipilih
        setSelectedPoints((prev) => prev.map((p) => (p.id === platformId || p.platform_name === platformId ? { ...p, passenger_demand: passengerCount } : p)));
    };

    // Modifikasi fungsi togglePoint untuk include passenger_demand
    const togglePoint = (platform) => {
        const platformId = platform.id || platform.platform_name;
        const exists = selectedPoints.find((p) => p.id === platformId || p.platform_name === platformId);
        if (exists) {
            setSelectedPoints(selectedPoints.filter((p) => p.id !== platformId && p.platform_name !== platformId));
            // Hapus juga dari passengerInputs
            setPassengerInputs((prev) => {
                const newInputs = { ...prev };
                delete newInputs[platformId];
                return newInputs;
            });
        } else {
            const newPoint = {
                ...platform,
                id: platformId,
                destination_name: platform.platform_name,
                priority_level: "normal",
                fuel_demand: platform.fuel_demand || 0,
                fresh_water_demand: platform.fresh_water_demand || 0,
                passenger_demand: passengerInputs[platformId] || 0,
            };
            setSelectedPoints([...selectedPoints, newPoint]);
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

    // Fungsi validasi kapasitas penumpang
    const validatePassengerCapacity = () => {
        const totalPassengers = selectedPoints.reduce((sum, point) => sum + (point.passenger_demand || 0), 0);
        const totalShipCapacity = selectedShips.reduce((sum, ship) => sum + (ship.max_passengers || 0), 0);

        if (totalPassengers > totalShipCapacity) {
            alert(`Total penumpang (${totalPassengers}) melebihi kapasitas kapal (${totalShipCapacity})`);
            return false;
        }
        return true;
    };

    const handleCalculate = async () => {
        if (!selectedPoints.length) return alert("Pilih minimal 1 platform");
        if (selectedShips.length === 0) return alert("Pilih minimal 1 kapal");

        // Validasi kapasitas penumpang
        if (!validatePassengerCapacity()) {
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
                            name: selected.name,
                            latitude: matched?.lat || selected.latitude,
                            longitude: matched?.lon || selected.longitude,
                            priority_level: "normal",
                            is_intermediate: false,
                            start_type: "current",
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
                            name: selected.name,
                            destination_name: selectedStartHarbor.name,
                            latitude: selectedStartHarbor.latitude,
                            longitude: selectedStartHarbor.longitude,
                            priority_level: "normal",
                            is_intermediate: false,
                            start_type: "harbor",
                            harbor_name: selectedStartHarbor.name,
                            fuel_demand: 0,
                            fresh_water_demand: 0,
                            passenger_demand: 0,
                        };
                    }

                    return startData;
                })
                .filter(Boolean),

            points: selectedPoints.map((p) => ({
                ship_request_id: p.id || `platform_${p.platform_name}`,
                name: p.platform_name,
                destination_name: p.platform_name,
                latitude: parseFloat(p.latitude),
                longitude: parseFloat(p.longitude),
                priority_level: p.priority_level || "normal",
                is_intermediate: false,
                fuel_demand: p.fuel_demand || 0,
                fresh_water_demand: p.fresh_water_demand || 0,
                passenger_demand: p.passenger_demand || 0, // Data penumpang dikirim ke VRP
            })),
            intermediate_points: intermediatePoints.map((point, index) => ({
                ship_request_id: `intermediate_${point.id}_${index}`,
                name: point.name,
                latitude: point.latitude,
                longitude: point.longitude,
                priority_level: "normal",
                is_intermediate: true,
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
            ship_capacities: selectedShips.map((ship) => ({
                max_fuel: ship.max_fuel || 1000,
                max_fresh_water: ship.max_fresh_water || 500,
                max_passengers: ship.max_passengers || 10,
            })),
        };

        console.log("VRP Request Body dengan Penumpang:", body);

        try {
            const res = await axios.post(process.env.REACT_APP_VRP_API_URL + '/solve-vrp', body, {
                timeout: 120000,
            });

            console.log("VRP Response dengan Penumpang:", res.data);

            results = res.data.routes.map((routeData) => ({
                ship: routeData.ship,
                routes: routeData.routes,
                has_priority_points: routeData.has_priority_points,
                capacity_info: routeData.capacity_info,
            }));
        } catch (error) {
            console.error("VRP calculation error:", error);
            alert("Error dalam perhitungan VRP: " + (error.response?.data?.detail || error.message));
            setLoading(false);
            return;
        }

        setRouteResult(results);
        setVisibleRoutes(results.map((r) => r.ship.ship_request_id));
        setDisplayMode("optimal");
        setLoading(false);
    };

    const handlePriorityChange = (platformId, newLevel) => {
        setSelectedPoints((prev) => prev.map((p) => (p.id === platformId || p.platform_name === platformId ? { ...p, priority_level: newLevel } : p)));
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

    const getActiveRoute = (routeData) => {
        if (!routeData.routes) return null;

        if (displayMode === "priority" && routeData.routes.priority_route) {
            return routeData.routes.priority_route;
        }
        return routeData.routes.optimal_route;
    };

    const renderCapacityInfo = (routeData) => {
        if (!routeData.capacity_info) return null;

        const { max_fuel, max_fresh_water, max_passengers } = routeData.capacity_info;
        const activeRoute = getActiveRoute(routeData);
        const usedCapacity = activeRoute?.capacity_used || { fuel: 0, fresh_water: 0, passengers: 0 };

        return (
            <div className="mt-3 p-2 bg-gray-50 rounded border">
                <h4 className="font-medium text-sm mb-2">📊 Kapasitas Kapal:</h4>
                <div className="space-y-1 text-xs">
                    {/* <div className="flex justify-between">
                        <span>Fuel:</span>
                        <span>
                            {usedCapacity.fuel?.toFixed(1)} / {max_fuel} L
                            <span className="ml-1 text-gray-500">
                                ({((usedCapacity.fuel / max_fuel) * 100).toFixed(1)}%)
                            </span>
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Fresh Water:</span>
                        <span>
                            {usedCapacity.fresh_water?.toFixed(1)} / {max_fresh_water} L
                            <span className="ml-1 text-gray-500">
                                ({((usedCapacity.fresh_water / max_fresh_water) * 100).toFixed(1)}%)
                            </span>
                        </span>
                    </div> */}
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

    const hasValidRoute = (routeData) => {
        if (!routeData.routes) return false;

        const optimalRoute = routeData.routes.optimal_route;
        const priorityRoute = routeData.routes.priority_route;

        const hasValidOptimal = optimalRoute?.route?.length > 1;
        const hasValidPriority = priorityRoute?.route?.length > 1;

        return hasValidOptimal || hasValidPriority;
    };

    const hasPriorityPoints = () => {
        return routeResult?.some((routeData) => routeData.has_priority_points === true);
    };

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

    const handleCommit = async () => {
        if (!routeResult || (!Array.isArray(routeResult) && !Array.isArray(routeResult.routes))) {
            return alert("Belum ada hasil perhitungan!");
        }

        try {
            console.log("🔍 Debug routeResult:", routeResult);

            const routeArray = Array.isArray(routeResult.routes) ? routeResult.routes : routeResult;

            const routesForCommit = [];
            const user_id = "USER_ID"; // Ganti dengan user ID dari context/auth

            // Format data untuk endpoint /commit-routes
            for (const routeItem of routeArray) {
                const { ship, routes } = routeItem || {};

                if (!ship || !routes) {
                    console.warn("❌ Data rute tidak lengkap:", routeItem);
                    continue;
                }

                if (!hasValidRoute(routeItem)) {
                    console.log(`⏭️ Skip kapal ${ship.name} - tidak ada rute yang valid`);
                    continue;
                }

                console.log(`🚢 Processing ship: ${ship.name}`, ship.ship_request_id);

                // ✅ PERBAIKAN: Format optimal route dengan SEMUA data yang diperlukan
                const optimalRoute = {
                    distance: routes.optimal_route?.distance || 0,
                    fuel_usage: routes.optimal_route?.fuel_usage || 0,
                    fuel_loss: 0, // Optimal route tidak ada fuel loss
                    est_waktu_tempuh: (routes.optimal_route?.distance || 0) / 36,
                    full_route_sequence:
                        routes.optimal_route?.route?.map((point, index) => ({
                            sequence: index + 1,
                            ship_request_id: point.ship_request_id || "",
                            id_captain_ship: point.id_captain_ship,
                            point_name: point.destination_name || point.name || `Point ${index + 1}`,
                            latitude: point.latitude || 0,
                            longitude: point.longitude || 0,
                            point_type: index === 0 ? "start" : index === routes.optimal_route.route.length - 1 ? "end" : "visit",
                            priority_level: point.priority_level || "normal",
                            passenger_demand: point.passenger_demand || 0,
                            timestamp: new Date(Date.now() + index * 600000).toISOString(),
                        })) || [],
                };

                // Format sesuai dengan yang diharapkan oleh commitRoutes
                const routeData = {
                    ship: {
                        ship_request_id: ship.ship_request_id,
                        name: ship.name,
                    },
                    optimal_route: optimalRoute,
                };

                // ✅ PERBAIKAN: Tambahkan priority route jika ada dengan SEMUA data
                if (routes.priority_route?.route?.length > 1) {
                    routeData.priority_route = {
                        distance: routes.priority_route?.distance || 0,
                        fuel_usage: routes.priority_route?.fuel_usage || 0,
                        fuel_loss: routes.priority_route?.fuel_loss || 0,
                        est_waktu_tempuh: (routes.priority_route?.distance || 0) / 36,
                        full_route_sequence: routes.priority_route.route.map((point, index) => ({
                            sequence: index + 1,
                            ship_request_id: point.ship_request_id || "",
                            id_captain_ship: point.id_captain_ship,
                            point_name: point.destination_name || point.name || `Point ${index + 1}`,
                            latitude: point.latitude || 0,
                            longitude: point.longitude || 0,
                            point_type: index === 0 ? "start" : index === routes.priority_route.route.length - 1 ? "end" : "visit",
                            priority_level: point.priority_level || "normal",
                            passenger_demand: point.passenger_demand || 0,
                            timestamp: new Date(Date.now() + index * 600000).toISOString(),
                        })),
                    };
                }

                routesForCommit.push(routeData);
            }

            if (routesForCommit.length === 0) {
                alert("Tidak ada rute yang valid untuk di-commit");
                return;
            }

            // Gunakan endpoint /commit-routes yang sudah benar
            const commitData = {
                routes: routesForCommit,
                user_id: user_id,
            };

            console.log("📤 Mengirim ke endpoint /commit-routes:", commitData);

            const response = await API.post("/commit-routes", commitData);

            console.log("✅ Response commit:", response.data);

            if (response.data.saved_routes) {
                const savedRoutes = response.data.saved_routes;
                const totalOptimal = savedRoutes.filter((r) => r.optimal_route_id).length;
                const totalPriority = savedRoutes.filter((r) => r.priority_route_id).length;

                let successMessage = `✅ Commit selesai!\n\n` + `• Total rute: ${response.data.total_routes}\n` + `• Rute optimal: ${totalOptimal}\n` + `• Rute priority: ${totalPriority}\n\n`;

                // Tampilkan detail priority routes
                if (totalPriority > 0) {
                    successMessage += `📊 Rute priority (butuh approval SPV):\n`;
                    savedRoutes.forEach((route, index) => {
                        if (route.priority_route_id) {
                            successMessage += `- Priority ID: ${route.priority_route_id}\n`;
                            successMessage += `  Parent ID: ${route.optimal_route_id}\n`;
                            successMessage += `  Status: ${route.needs_approval ? "Butuh Approval" : "Tidak Butuh"}\n\n`;
                        }
                    });
                }

                alert(successMessage);
            } else {
                alert(`✅ ${response.data.msg}`);
            }

            setRouteResult(null);
        } catch (err) {
            console.error("❌ Commit gagal:", err);
            alert("Gagal commit rute: " + (err.response?.data?.msg || err.message));
        }
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
                    <h1 className="text-2xl font-bold text-blue-700">IPB Route Management</h1>
                    <p className="text-gray-600">Optimalkan rute pengiriman {userData?.region || "All"} Region</p>
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
                                                Kapasitas: {c.max_fuel}L fuel, {c.max_fresh_water}L air, {c.max_passengers} penumpang
                                            </p>
                                        </div>
                                        <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Platform Section dengan Search Bar - Improved UI */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                            {/* Header dengan gradient */}
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-xl font-bold text-gray-800 flex items-center truncate">
                                        <svg className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="truncate">Radop {userData?.region ? `(${userData.region})` : ""}</span>
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1 truncate">Pilih tujuan pengiriman</p>
                                </div>
                                <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-full shadow-sm flex-shrink-0 ml-4">
                                    {selectedPoints.length} dipilih
                                </span>
                            </div>

                            {/* Search Bar dengan icon */}
                            <div className="mb-6 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Cari Tujuan..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-200"
                                />
                            </div>

                            {/* Platform List */}
                            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                                {filteredPlatforms.map((platform) => {
                                    const platformId = platform.id || platform.platform_name;
                                    const isSelected = selectedPoints.find((p) => p.id === platformId || p.platform_name === platformId);
                                    const passengerCount = passengerInputs[platformId] || 0;

                                    return (
                                        <div
                                            key={platformId}
                                            className={`p-4 rounded-xl transition-all duration-200 border-2 ${
                                                isSelected
                                                    ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-md"
                                                    : "bg-gray-50 border-gray-200 hover:bg-white hover:border-gray-300 hover:shadow-sm"
                                            }`}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                                {/* Platform Info - Left Side */}
                                                <div className="flex items-start cursor-pointer flex-1 min-w-0" onClick={() => togglePoint(platform)}>
                                                    <div
                                                        className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                                            isSelected ? "bg-green-500 border-green-500 shadow-inner" : "border-gray-400 hover:border-gray-500"
                                                        }`}
                                                    >
                                                        {isSelected && (
                                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0 ml-3">
                                                        <div className="flex items-center flex-wrap gap-2">
                                                            <p className="font-semibold text-gray-900 text-base truncate min-w-0" title={platform.platform_name}>
                                                                {platform.platform_name}
                                                            </p>
                                                            {isSelected?.priority_level && (
                                                                <span
                                                                    className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
                                                                        isSelected.priority_level === "emergency"
                                                                            ? "bg-red-100 text-red-800 border border-red-200"
                                                                            : isSelected.priority_level === "urgent"
                                                                            ? "bg-orange-100 text-orange-800 border border-orange-200"
                                                                            : "bg-blue-100 text-blue-800 border border-blue-200"
                                                                    }`}
                                                                >
                                                                    {isSelected.priority_level}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Controls - Right Side */}
                                                <div className="flex flex-col sm:items-end gap-2 flex-shrink-0">
                                                    {/* Passenger Input Compact */}
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-xs font-medium text-gray-700 whitespace-nowrap hidden sm:block">Penumpang:</label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="50"
                                                                value={passengerInputs[platformId] || ""}
                                                                onChange={(e) => handlePassengerChange(platformId, e.target.value)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                placeholder="0"
                                                            />
                                                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Priority Select Compact */}
                                                    <select
                                                        value={isSelected?.priority_level || "normal"}
                                                        onChange={(e) => handlePriorityChange(platformId, e.target.value)}
                                                        className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-full sm:w-auto min-w-32"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <option value="normal">🟢 Normal</option>
                                                        <option value="urgent">🟡 Urgent</option>
                                                        <option value="emergency">🔴 Emergency</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Selected Status - Full width */}
                                            {isSelected && (
                                                <div className="mt-3 flex items-center space-x-4">
                                                    <div className="flex items-center text-sm text-green-600 font-medium">
                                                        <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                        Terpilih untuk rute
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Empty State */}
                                {filteredPlatforms.length === 0 && (
                                    <div className="text-center py-12">
                                        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1}
                                                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">{searchTerm ? "Tujuan tidak ditemukan" : "Tidak ada tujuan tersedia"}</h3>
                                        <p className="text-gray-600 max-w-sm mx-auto">
                                            {searchTerm ? "Coba gunakan kata kunci lain atau periksa region yang dipilih" : "Tujuan akan muncul setelah data region dimuat"}
                                        </p>
                                        {searchTerm && (
                                            <button
                                                onClick={() => setSearchTerm("")}
                                                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                                            >
                                                Reset Pencarian
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Selected Summary */}
                            {selectedPoints.length > 0 && (
                                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-blue-900 flex items-center">
                                                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                Ringkasan Tujuan Terpilih
                                            </h4>
                                            <p className="text-sm text-blue-700 mt-1">
                                                Total {selectedPoints.length} tujuan • {selectedPoints.reduce((sum, p) => sum + (p.passenger_demand || 0), 0)} penumpang
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedPoints.some((p) => p.priority_level === "emergency") && (
                                                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full border border-red-200 whitespace-nowrap">
                                                    🔴 Emergency: {selectedPoints.filter((p) => p.priority_level === "emergency").length}
                                                </span>
                                            )}
                                            {selectedPoints.some((p) => p.priority_level === "urgent") && (
                                                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full border border-orange-200 whitespace-nowrap">
                                                    🟡 Urgent: {selectedPoints.filter((p) => p.priority_level === "urgent").length}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tambahkan CSS untuk custom scrollbar */}
                        <style jsx>{`
                            .custom-scrollbar::-webkit-scrollbar {
                                width: 6px;
                            }
                            .custom-scrollbar::-webkit-scrollbar-track {
                                background: #f1f5f9;
                                border-radius: 3px;
                            }
                            .custom-scrollbar::-webkit-scrollbar-thumb {
                                background: #cbd5e1;
                                border-radius: 3px;
                            }
                            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                                background: #94a3b8;
                            }
                        `}</style>

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
                                        {/* Di bagian pilihan pelabuhan */}
                                        <select
                                            value={selectedStartHarbor ? selectedStartHarbor.id : ""}
                                            onChange={(e) => {
                                                const selected = allHarborPoints.find((harbor) => harbor.id === e.target.value);
                                                setSelectedStartHarbor(selected || null);
                                            }}
                                            className="w-full border rounded px-3 py-2 text-sm focus:outline-none bg-white focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="">Pilih pelabuhan...</option>
                                            {allHarborPoints.map((harbor) => (
                                                <option key={harbor.id} value={harbor.id}>
                                                    {harbor.name} {harbor.is_ship ? "🚢" : ""}
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
                                                <p className="text-xs text-gray-600">Supply Point</p>
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
                                    {/* Di bagian dropdown untuk menambah titik perantara */}
                                    <select
                                        value=""
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const selected = allIntermediatePoints.find((point) => point.id === e.target.value);
                                                if (selected && !intermediatePoints.find((p) => p.id === selected.id)) {
                                                    setIntermediatePoints([...intermediatePoints, selected]);
                                                }
                                            }
                                        }}
                                        className="w-full border rounded px-2 py-1 text-sm focus:outline-none bg-white focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">Tambah Lokasi Pengambilan Supply</option>
                                        {allIntermediatePoints.map((point) => (
                                            <option key={point.id} value={point.id}>
                                                {point.name} {point.is_ship ? "🚢" : ""}
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
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
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
                                    {/* Markers for selected platforms */}
                                    {selectedPoints.map((p) => (
                                        <Marker key={p.id || p.platform_name} position={[p.latitude, p.longitude]} icon={destinationIcon}>
                                            <Popup>
                                                <div className="font-medium">{p.platform_name}</div>
                                                <div className="text-sm">
                                                    Priority Level: <span className={getPriorityColor(p.priority_level).replace("bg-", "text-")}>{p.priority_level}</span>
                                                </div>
                                                <div className="text-sm">Region: {p.region}</div>
                                                {p.passenger_demand > 0 && <div className="text-sm text-green-600">Penumpang: {p.passenger_demand} orang</div>}
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
                                                            Kapasitas: {c.max_fuel}L fuel, {c.max_fresh_water}L air, {c.max_passengers} penumpang
                                                        </div>
                                                    </Popup>
                                                </Marker>
                                            );
                                        })}
                                    {/* Region Markers - semua platform */}
                                    {platforms.map((p) => (
                                        <Marker
                                            key={p.id || p.platform_name}
                                            position={[p.latitude, p.longitude]}
                                            icon={
                                                p.region === "central"
                                                    ? centralIcon
                                                    : p.region === "north"
                                                    ? northIcon
                                                    : p.region === "south"
                                                    ? southIcon
                                                    : p.region === "tanker"
                                                    ? tankerIcon
                                                    : otherIcon
                                            }
                                        >
                                            <Popup>
                                                <b>{p.platform_name}</b>
                                                <br />
                                                {p.region} Region
                                                {selectedPoints.find((sp) => sp.id === p.id || sp.platform_name === p.platform_name) && (
                                                    <div className="mt-1 text-green-600 font-medium">✓ Dipilih untuk rute</div>
                                                )}
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
                                    {/* Route lines */}
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

                                                        {renderCapacityInfo(routeData)}

                                                        <div className="mt-4 pt-3 border-t border-gray-200">
                                                            <h4 className="font-medium mb-2 text-sm text-gray-700">Urutan Rute:</h4>
                                                            <div className="text-sm space-y-1 max-h-40 overflow-y-auto">
                                                                {activeRoute.route.map((point, index) => {
                                                                    const isIntermediate = point.is_intermediate || !point.ship_request_id;
                                                                    const isStart = index === 0;
                                                                    const isEnd = index === activeRoute.route.length - 1;
                                                                    const passengerCount = point.passenger_demand || 0;

                                                                    return (
                                                                        <div
                                                                            key={index}
                                                                            className={`flex items-center justify-between ${
                                                                                isStart ? "font-semibold text-green-600" : isEnd ? "font-semibold text-blue-600" : isIntermediate ? "text-blue-600" : ""
                                                                            }`}
                                                                        >
                                                                            <div className="flex items-center">
                                                                                <span className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full text-xs flex items-center justify-center mr-2">
                                                                                    {index + 1}
                                                                                </span>
                                                                                <span>
                                                                                    {point.destination_name || point.name}
                                                                                    {isIntermediate}
                                                                                    {point.priority_level && point.priority_level !== "normal" && !isIntermediate && (
                                                                                        <span className={`ml-2 text-xs px-1 rounded ${getPriorityColor(point.priority_level)}`}>
                                                                                            {point.priority_level}
                                                                                        </span>
                                                                                    )}
                                                                                </span>
                                                                            </div>

                                                                            {/* Tampilkan jumlah penumpang jika ada */}
                                                                            {passengerCount > 0 && !isIntermediate && !isStart && !isEnd && (
                                                                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">👥 {passengerCount}</span>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-center py-4 text-gray-500">
                                                        <p>Kapal ini tidak mendapatkan rute pengiriman</p>
                                                        {/* <p className="text-sm mt-1">Tidak ada platform yang dapat dijangkau</p> */}
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

export default IpbRoute;
