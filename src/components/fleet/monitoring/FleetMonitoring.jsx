import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, LayersControl } from "react-leaflet";
import L from "leaflet";
import API from "../../../api/Api";
import "leaflet/dist/leaflet.css";
import IconPlatformNorth from "../../../../src/assets/icon/icon_platform_north.svg";
import IconPlatformSouth from "../../../../src/assets/icon/icon_platform_south.svg";
import IconPlatformCentral from "../../../../src/assets/icon/icon_platform_central.svg";
import IconPlatformOther from "../../../../src/assets/icon/icon_platform_other.svg";
import IconTanker from "../../../../src/assets/icon/icon_Subsea_wellhead.svg";
import IconBoat from "../../../../src/assets/icon/icon_boat.svg";
import IconKapalPengirim from "../../../../src/assets/icon/icon_kapal_pengirim.svg";
import IconDestination from "../../../../src/assets/icon/icon_destination.svg";

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

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

const calculateFuelConsumption = (distance, fuelRate = 4.22) => {
    return distance * fuelRate;
};

const calculateFuelCost = (fuelAmount, fuelPrice) => {
    return fuelAmount * fuelPrice;
};

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

const shipDestinationIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/2857/2857301.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
});

const RoutePointList = ({ points, onReorder, onRemove, onMove, allowEditCompleted = false }) => {
    const [draggedIndex, setDraggedIndex] = useState(null);

    const validPoints = points.filter((point) => point && point.latitude !== undefined && point.longitude !== undefined && !isNaN(point.latitude) && !isNaN(point.longitude));

    const handleDragStart = (e, index) => {
        const point = validPoints[index];
        if (!allowEditCompleted && point.status === "completed") {
            e.preventDefault();
            return;
        }
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index.toString());
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e, targetIndex) => {
        e.preventDefault();
        const sourceIndex = draggedIndex;

        if (sourceIndex !== null && sourceIndex !== targetIndex) {
            const sourcePoint = validPoints[sourceIndex];
            const targetPoint = validPoints[targetIndex];

            if (!allowEditCompleted && (sourcePoint.status === "completed" || targetPoint.status === "completed")) {
                setDraggedIndex(null);
                return;
            }

            const pendingPoints = validPoints.filter((p) => p.status !== "completed");
            const sourcePendingIndex = pendingPoints.findIndex((p) => p.id_monitoring === sourcePoint.id_monitoring);
            const targetPendingIndex = pendingPoints.findIndex((p) => p.id_monitoring === targetPoint.id_monitoring);

            if (sourcePendingIndex === -1 || targetPendingIndex === -1) {
                setDraggedIndex(null);
                return;
            }

            onReorder(sourcePendingIndex, targetPendingIndex);
        }
        setDraggedIndex(null);
    };

    const isPointEditable = (point) => {
        return allowEditCompleted || point.status !== "completed";
    };

    const handleMove = (index, direction) => {
        const point = validPoints[index];
        if (!isPointEditable(point)) return;

        const pendingPoints = validPoints.filter((p) => p.status !== "completed");
        const actualPendingIndex = pendingPoints.findIndex((p) => p.id_monitoring === point.id_monitoring);

        if (actualPendingIndex === -1) return;

        onMove(actualPendingIndex, direction);
    };

    const handleRemove = (index) => {
        const point = validPoints[index];
        if (!isPointEditable(point)) return;

        const pendingPoints = validPoints.filter((p) => p.status !== "completed");
        const actualPendingIndex = pendingPoints.findIndex((p) => p.id_monitoring === point.id_monitoring);

        if (actualPendingIndex === -1) return;

        onRemove(actualPendingIndex);
    };

    return (
        <div className="space-y-2">
            {validPoints.map((point, index) => {
                const isEditable = isPointEditable(point);
                const isCompleted = point.status === "completed";

                return (
                    <div
                        key={point.id_monitoring || `point-${index}`}
                        className={`flex items-center p-3 border rounded-lg shadow-sm transition-all ${
                            !isEditable ? "bg-gray-100 border-gray-300 cursor-not-allowed" : draggedIndex === index ? "border-blue-500 bg-blue-50" : "bg-white border-gray-200"
                        } ${isCompleted ? "opacity-75" : ""}`}
                        draggable={isEditable}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                    >
                        <div className={`mr-3 ${isEditable ? "cursor-move text-gray-400 hover:text-gray-600" : "text-gray-300 cursor-not-allowed"}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            </svg>
                        </div>

                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold mr-3 ${
                            point.destination_type === "ship" 
                                ? "bg-blue-500 text-white" 
                                : isCompleted 
                                ? "bg-green-500 text-white" 
                                : "bg-blue-500 text-white"
                        }`}>
                            {point.sequence}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center">
                                <p className={`font-medium ${isCompleted ? "text-gray-600" : "text-gray-900"}`}>
                                    {point.point_name}
                                </p>
                                {point.destination_type === "ship" && (
                                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        Kapal
                                    </span>
                                )}
                                {point.is_new_platform && (
                                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                        Platform Baru
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-600">
                                {point.latitude?.toFixed(4) || "N/A"}, {point.longitude?.toFixed(4) || "N/A"}
                            </p>
                            {point.description && <p className="text-xs text-gray-500 mt-1">{point.description}</p>}
                        </div>

                        {isEditable ? (
                            <div className="flex space-x-1">
                                <button
                                    onClick={() => handleMove(index, "up")}
                                    disabled={index === 0 || !isPointEditable(validPoints[index - 1])}
                                    className={`p-1 rounded ${index === 0 || !isPointEditable(validPoints[index - 1]) ? "text-gray-300 cursor-not-allowed" : "text-green-600 hover:bg-green-100"}`}
                                    title="Pindah ke atas"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                </button>

                                <button
                                    onClick={() => handleMove(index, "down")}
                                    disabled={index === validPoints.length - 1 || !isPointEditable(validPoints[index + 1])}
                                    className={`p-1 rounded ${
                                        index === validPoints.length - 1 || !isPointEditable(validPoints[index + 1]) ? "text-gray-300 cursor-not-allowed" : "text-green-600 hover:bg-green-100"
                                    }`}
                                    title="Pindah ke bawah"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                <button onClick={() => handleRemove(index)} className="p-1 text-red-600 hover:bg-red-100 rounded" title="Hapus titik">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <div className="text-xs text-green-600 px-2 py-1 bg-green-100 rounded">Complete</div>
                        )}
                    </div>
                );
            })}

            {validPoints.length === 0 && <div className="text-center py-4 text-gray-500">Belum ada titik yang ditambahkan.</div>}
        </div>
    );
};

const DestinationModal = ({ isOpen, onClose, regions, ships, onSelect }) => {
    const [description, setDescription] = useState("");
    const [selectedDestination, setSelectedDestination] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [error, setError] = useState("");
    const [destinationType, setDestinationType] = useState("all");

    useEffect(() => {
        if (isOpen) {
            console.log('Regions data structure:', {
                central: regions?.central?.length || 0,
                north: regions?.north?.length || 0,
                south: regions?.south?.length || 0,
                tanker: regions?.tanker?.length || 0,
                other: regions?.other?.length || 0,
                ship: regions?.ship?.length || 0
            });
            
            // Debug: lihat struktur data kapal
            if (regions?.ship && regions.ship.length > 0) {
                console.log('First ship data:', regions.ship[0]);
                console.log('Ship keys:', Object.keys(regions.ship[0]));
            }
        }
    }, [isOpen, regions]);

    if (!isOpen) return null;

    // Fungsi helper untuk mendapatkan nama
    const getShipName = (ship) => {
        return ship.name || `Kapal ${ship.mmsi || ship.ship_position_id || 'Unknown'}`;
    };

    const allDestinations = [
        ...(regions?.central || []).map((p) => ({ 
            ...p, 
            type: "platform",
            region: "central",
            destination_name: p.platform_name || `Platform ${p.id_central_region || p.id}`,
            latitude_decimal: parseFloat(p.latitude_decimal) || 0,
            longitude_decimal: parseFloat(p.longitude_decimal) || 0
        })),
        ...(regions?.north || []).map((p) => ({ 
            ...p, 
            type: "platform",
            region: "north",
            destination_name: p.platform_name || `Platform ${p.id_north_region || p.id}`,
            latitude_decimal: parseFloat(p.latitude_decimal) || 0,
            longitude_decimal: parseFloat(p.longitude_decimal) || 0
        })),
        ...(regions?.south || []).map((p) => ({ 
            ...p, 
            type: "platform",
            region: "south",
            destination_name: p.platform_name || `Platform ${p.id_south_region || p.id}`,
            latitude_decimal: parseFloat(p.latitude_decimal) || 0,
            longitude_decimal: parseFloat(p.longitude_decimal) || 0
        })),
        ...(regions?.tanker || []).map((p) => ({ 
            ...p, 
            type: "platform",
            region: "tanker",
            destination_name: p.platform_name || `Tanker ${p.id_tanker_rig_barge || p.id}`,
            latitude_decimal: parseFloat(p.latitude_decimal) || 0,
            longitude_decimal: parseFloat(p.longitude_decimal) || 0
        })),
        ...(regions?.other || []).map((p) => ({ 
            ...p, 
            type: "platform",
            region: "other",
            destination_name: p.platform_name || `Platform ${p.id_other_region || p.id}`,
            latitude_decimal: parseFloat(p.latitude_decimal) || 0,
            longitude_decimal: parseFloat(p.longitude_decimal) || 0
        })),
        ...((regions?.ship || [])).map((ship) => ({
            ...ship,
            type: "ship",
            region: "ship",
            destination_name: getShipName(ship),
            latitude_decimal: parseFloat(ship.lat) || 0,
            longitude_decimal: parseFloat(ship.lon) || 0,
            mmsi: ship.mmsi,
            speed: ship.speed,
            heading: ship.heading,
            port: ship.port,
            date: ship.date,
        })),
    ].filter(destination => {
        // Filter hanya yang memiliki koordinat valid
        const hasValidCoords = 
            destination.latitude_decimal !== 0 && 
            destination.longitude_decimal !== 0 &&
            !isNaN(destination.latitude_decimal) && 
            !isNaN(destination.longitude_decimal);
        
        // Filter hanya yang memiliki nama
        const hasName = destination.destination_name && 
                       destination.destination_name.trim() !== "";
        
        return hasValidCoords && hasName;
    });

    console.log('All destinations count:', allDestinations.length);
    console.log('Platforms:', allDestinations.filter(d => d.type === "platform").length);
    console.log('Ships:', allDestinations.filter(d => d.type === "ship").length);

    const filteredDestinations = allDestinations.filter((destination) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
            destination.destination_name?.toLowerCase().includes(searchLower) ||
            destination.description?.toLowerCase().includes(searchLower) ||
            (destination.type === "ship" && destination.mmsi?.toString().includes(searchTerm));
        
        if (destinationType === "platform") {
            return matchesSearch && destination.type === "platform";
        } else if (destinationType === "ship") {
            return matchesSearch && destination.type === "ship";
        }
        return matchesSearch;
    });

    const handleDestinationSelect = (destination) => {
        console.log('Selected destination:', destination);
        setSelectedDestination(destination);
        setIsDropdownOpen(false);
        setSearchTerm("");
        setError("");
    };

    const handleConfirmSelection = () => {
        if (!selectedDestination) {
            setError("Silakan pilih tujuan terlebih dahulu.");
            return;
        }
        if (!description.trim()) {
            setError("Keterangan wajib diisi.");
            return;
        }

        console.log('Adding to route:', selectedDestination, description);
        onSelect(selectedDestination, description);
        setDescription("");
        setSelectedDestination(null);
        setSearchTerm("");
        setError("");
    };

    const getRegionName = (region, type) => {
        if (type === "ship") return "Kapal";
        
        const regionNames = {
            central: "Central Region",
            north: "North Region",
            south: "South Region",
            tanker: "Tanker/Rig/Barge",
            other: "Other Region",
        };
        return regionNames[region] || region;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Tambah Tujuan ke Rute</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            ✕
                        </button>
                    </div>

                    <div className="mb-4">
                        <div className="flex space-x-2 border-b border-gray-200">
                            <button
                                onClick={() => {
                                    setDestinationType("all");
                                    setSelectedDestination(null);
                                }}
                                className={`pb-2 px-4 text-sm font-medium ${
                                    destinationType === "all"
                                        ? "text-blue-600 border-b-2 border-blue-600"
                                        : "text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                Semua ({allDestinations.length})
                            </button>
                            <button
                                onClick={() => {
                                    setDestinationType("platform");
                                    setSelectedDestination(null);
                                }}
                                className={`pb-2 px-4 text-sm font-medium ${
                                    destinationType === "platform"
                                        ? "text-blue-600 border-b-2 border-blue-600"
                                        : "text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                Platform ({allDestinations.filter(d => d.type === "platform").length})
                            </button>
                            <button
                                onClick={() => {
                                    setDestinationType("ship");
                                    setSelectedDestination(null);
                                }}
                                className={`pb-2 px-4 text-sm font-medium ${
                                    destinationType === "ship"
                                        ? "text-blue-600 border-b-2 border-blue-600"
                                        : "text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                Kapal ({allDestinations.filter(d => d.type === "ship").length})
                            </button>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pilih Tujuan {destinationType !== "all" && `(${destinationType === "ship" ? "Kapal" : "Platform"})`}:
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full p-3 text-left border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-50"
                            >
                                {selectedDestination ? (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-medium">{selectedDestination.destination_name}</span>
                                            <span className="ml-2 text-xs px-2 py-1 rounded" style={{
                                                backgroundColor: selectedDestination.type === "ship" ? "#dbeafe" : "#dcfce7",
                                                color: selectedDestination.type === "ship" ? "#1e40af" : "#166534"
                                            }}>
                                                {selectedDestination.type === "ship" ? "Kapal" : "Platform"}
                                                {selectedDestination.type === "ship" && selectedDestination.mmsi && ` • MMSI: ${selectedDestination.mmsi}`}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {selectedDestination.latitude_decimal?.toFixed(4)}, {selectedDestination.longitude_decimal?.toFixed(4)}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-gray-500">
                                        {destinationType === "ship" ? "Klik untuk memilih kapal..." : 
                                         destinationType === "platform" ? "Klik untuk memilih platform..." : 
                                         "Klik untuk memilih platform atau kapal..."}
                                    </span>
                                )}
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    <div className="p-2 border-b border-gray-200">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder={
                                                    destinationType === "platform" 
                                                        ? "Cari platform..." 
                                                        : destinationType === "ship" 
                                                        ? "Cari kapal atau MMSI..." 
                                                        : "Cari platform atau kapal..."
                                                }
                                                className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                autoFocus
                                            />
                                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-xs text-gray-500">
                                            {filteredDestinations.length} tujuan ditemukan
                                            {destinationType === "all" && ` (${filteredDestinations.filter(d => d.type === "ship").length} kapal, ${filteredDestinations.filter(d => d.type === "platform").length} platform)`}
                                        </div>
                                    </div>

                                    <div className="py-1">
                                        {filteredDestinations.length === 0 ? (
                                            <div className="px-4 py-8 text-center text-gray-500">
                                                <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p>Tidak ada tujuan yang sesuai</p>
                                                <p className="text-sm text-gray-400 mt-1">
                                                    {destinationType === "ship" 
                                                        ? "Pastikan data kapal tersedia di sistem" 
                                                        : "Coba gunakan kata kunci lain"}
                                                </p>
                                            </div>
                                        ) : (
                                            filteredDestinations.map((destination, index) => (
                                                <button
                                                    key={destination.type === "platform" 
                                                        ? destination.id_central_region ||
                                                          destination.id_north_region ||
                                                          destination.id_south_region ||
                                                          destination.id_tanker_rig_barge ||
                                                          destination.id_other_region ||
                                                          `platform-${index}`
                                                        : destination.mmsi || destination.ship_position_id || `ship-${index}`
                                                    }
                                                    onClick={() => handleDestinationSelect(destination)}
                                                    className="w-full text-left px-4 py-3 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className="flex items-center mb-1">
                                                                <span className="font-medium text-gray-900">
                                                                    {destination.destination_name}
                                                                </span>
                                                                <span className={`ml-2 text-xs px-2 py-0.5 rounded ${destination.type === "ship" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
                                                                    {destination.type === "ship" ? "Kapal" : "Platform"}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-gray-600">
                                                                {destination.type === "ship" && destination.mmsi && (
                                                                    <span className="ml-2">MMSI: {destination.mmsi}</span>
                                                                )}
                                                                {destination.type === "ship" && destination.port && (
                                                                    <span className="ml-2">• Port: {destination.port}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-gray-500 text-right">
                                                            <div>{destination.latitude_decimal?.toFixed(4)}</div>
                                                            <div>{destination.longitude_decimal?.toFixed(4)}</div>
                                                            {destination.type === "ship" && destination.date && (
                                                                <div className="text-gray-400 text-xs mt-1">
                                                                    {new Date(destination.date).toLocaleDateString('id-ID')}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Debug info */}
                        <div className="mt-2 text-xs text-gray-500">
                            Total data: {allDestinations.length} tujuan 
                            ({allDestinations.filter(d => d.type === "ship").length} kapal, 
                            {allDestinations.filter(d => d.type === "platform").length} platform)
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Keterangan <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={
                                selectedDestination?.type === "ship" 
                                    ? "Contoh: Mengantar suku cadang, transfer crew, dll."
                                    : "Tambahkan keterangan tentang tujuan ini..."
                            }
                            rows="3"
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
                        />
                    </div>

                    {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</div>}

                    {selectedDestination && (
                        <div className="mb-4 p-3 rounded-lg border" style={{
                            backgroundColor: selectedDestination.type === "ship" ? "#eff6ff" : "#f0fdf4",
                            borderColor: selectedDestination.type === "ship" ? "#bfdbfe" : "#bbf7d0"
                        }}>
                            <h4 className="font-medium mb-1 flex items-center" style={{
                                color: selectedDestination.type === "ship" ? "#1e40af" : "#166534"
                            }}>
                                {selectedDestination.type === "ship" ? (
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                                        <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                                        <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                )}
                                Tujuan Terpilih
                            </h4>
                            <p className="text-sm mb-1" style={{ color: selectedDestination.type === "ship" ? "#1e40af" : "#166534" }}>
                                <strong>{selectedDestination.destination_name}</strong> • {getRegionName(selectedDestination.region, selectedDestination.type)}
                            </p>
                            <p className="text-xs" style={{ color: selectedDestination.type === "ship" ? "#3b82f6" : "#22c55e" }}>
                                {selectedDestination.type === "ship" && selectedDestination.mmsi && `MMSI: ${selectedDestination.mmsi} • `}
                                Koordinat: {selectedDestination.latitude_decimal?.toFixed(4)}, {selectedDestination.longitude_decimal?.toFixed(4)}
                            </p>
                            {selectedDestination.type === "ship" && selectedDestination.port && (
                                <p className="text-xs mt-1" style={{ color: selectedDestination.type === "ship" ? "#3b82f6" : "#22c55e" }}>
                                    Port: {selectedDestination.port}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end space-x-2 mt-6">
                        <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">
                            Batal
                        </button>
                        <button
                            onClick={handleConfirmSelection}
                            disabled={!selectedDestination || !description.trim()}
                            className={`px-4 py-2 text-white rounded-lg font-medium ${
                                selectedDestination && description.trim() 
                                    ? selectedDestination.type === "ship" 
                                        ? "bg-blue-500 hover:bg-blue-600" 
                                        : "bg-green-500 hover:bg-green-600"
                                    : "bg-gray-400 cursor-not-allowed"
                            }`}
                        >
                            {selectedDestination?.type === "ship" ? "Tambah Kapal ke Rute" : "Tambah Platform ke Rute"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RerouteApprovalModal = ({ 
    isOpen, 
    onClose, 
    rerouteData, 
    onApprove, 
    onReject, 
    rerouteReason,
    setRerouteReason 
}) => {
    const [errors, setErrors] = useState({});

    if (!isOpen) return null;

    const calculateChanges = () => {
        const originalPoints = rerouteData.originalPoints || [];
        const newPoints = rerouteData.newPoints || [];
        
        const addedPoints = newPoints.filter(newPoint => 
            !originalPoints.some(original => original.id_monitoring === newPoint.id_monitoring)
        );
        
        const removedPoints = originalPoints.filter(original => 
            !newPoints.some(newPoint => newPoint.id_monitoring === original.id_monitoring)
        );

        const originalDistance = calculateRouteDistance(originalPoints);
        const newDistance = calculateRouteDistance(newPoints);
        const distanceChange = newDistance - originalDistance;
        const fuelChange = calculateFuelConsumption(distanceChange);

        return {
            addedPoints,
            removedPoints,
            originalDistance,
            newDistance,
            distanceChange,
            fuelChange
        };
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!rerouteReason.trim()) {
            newErrors.rerouteReason = "Alasan reroute wajib diisi";
        }
        
        if (rerouteReason.trim().length < 10) {
            newErrors.rerouteReason = "Alasan reroute minimal 10 karakter";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleApprove = (type) => {
        if (!validateForm()) return;
        onApprove(type);
    };

    const changes = calculateChanges();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Konfirmasi Re-Route
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            ✕
                        </button>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Alasan Re-Route <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={rerouteReason}
                            onChange={(e) => setRerouteReason(e.target.value)}
                            placeholder="Jelaskan alasan melakukan re-route (minimal 10 karakter)..."
                            rows="3"
                            className={`w-full p-3 border rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-black ${
                                errors.rerouteReason ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.rerouteReason && (
                            <p className="text-red-500 text-sm mt-1">{errors.rerouteReason}</p>
                        )}
                        
                        <div className="mt-2 text-sm text-gray-500">
                            Contoh: Penambahan titik untuk pengiriman darurat, perubahan jadual, kondisi cuaca, dll.
                        </div>
                    </div>

                    <div className="mb-6">
                        <h4 className="font-medium text-gray-700 mb-3">Ringkasan Perubahan Rute:</h4>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <div className="text-sm text-blue-700 font-medium">Titik Ditambahkan</div>
                                <div className="text-lg font-bold text-blue-800">{changes.addedPoints.length}</div>
                                {changes.addedPoints.length > 0 && (
                                    <div className="text-xs text-blue-600 mt-1">
                                        {changes.addedPoints.map(p => p.point_name).join(', ')}
                                    </div>
                                )}
                            </div>
                            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                <div className="text-sm text-red-700 font-medium">Titik Dihapus</div>
                                <div className="text-lg font-bold text-red-800">{changes.removedPoints.length}</div>
                                {changes.removedPoints.length > 0 && (
                                    <div className="text-xs text-red-600 mt-1">
                                        {changes.removedPoints.map(p => p.point_name).join(', ')}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2 text-sm bg-gray-50 p-3 rounded-lg">
                            <div className="flex justify-between">
                                <span className="font-medium">Jarak Sebelumnya:</span>
                                <span>{changes.originalDistance.toFixed(2)} km</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Jarak Baru:</span>
                                <span>{changes.newDistance.toFixed(2)} km</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Perubahan Jarak:</span>
                                <span className={changes.distanceChange > 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                                    {changes.distanceChange > 0 ? "+" : ""}{changes.distanceChange.toFixed(2)} km
                                </span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                                <span className="font-medium">Estimasi Fuel Tambahan:</span>
                                <span className={changes.fuelChange > 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                                    {changes.fuelChange > 0 ? "+" : ""}{changes.fuelChange.toFixed(2)} L
                                </span>
                            </div>
                        </div>

                        {changes.addedPoints.length > 0 && (
                            <div className="mt-4">
                                <h5 className="font-medium text-gray-700 mb-2">Detail Titik yang Ditambahkan:</h5>
                                <div className="space-y-2">
                                    {changes.addedPoints.map((point, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                                            <div className="flex items-center">
                                                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs mr-2">
                                                    +
                                                </div>
                                                <span className="font-medium">{point.point_name}</span>
                                                {point.destination_type === "ship" && (
                                                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                                        Kapal
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium"
                        >
                            Batal
                        </button>
                        <button
                            onClick={() => handleApprove("direct")}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
                        >
                            Re-Route Langsung
                        </button>
                        <button
                            onClick={() => handleApprove("request")}
                            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium"
                        >
                            Minta Approval SPV
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RerouteHistoryModal = ({ isOpen, onClose, logs, loading, routeName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">History Re-route - {routeName}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            ✕
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="text-gray-500 mt-2">Memuat history...</p>
                        </div>
                    ) : (
                        <div className="overflow-y-auto max-h-96">
                            {logs.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">Belum ada history reroute untuk rute ini.</div>
                            ) : (
                                <div className="space-y-4">
                                    {logs.map((log, index) => (
                                        <div key={log.id_reroute_log} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span
                                                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                                            log.action_type === "reroute_completed"
                                                                ? "bg-green-100 text-green-800"
                                                                : log.action_type === "point_added"
                                                                ? "bg-blue-100 text-blue-800"
                                                                : log.action_type === "point_removed"
                                                                ? "bg-red-100 text-red-800"
                                                                : "bg-gray-100 text-gray-800"
                                                        }`}
                                                    >
                                                        {log.action_type}
                                                    </span>
                                                    <span className="text-xs text-gray-500 ml-2">{new Date(log.created_at).toLocaleString("id-ID")}</span>
                                                </div>
                                                {log.fuel_loss > 0 && (
                                                    <div className="text-right">
                                                        <div className="text-sm font-medium text-red-600">+{parseFloat(log.fuel_loss).toFixed(2)} L</div>
                                                    </div>
                                                )}
                                            </div>

                                            <p className="text-sm text-gray-700 mb-2">{log.description}</p>

                                            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                                                <div>
                                                    <span className="font-medium">Titik:</span> {log.total_points_before} → {log.total_points_after}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Perubahan:</span>+{log.points_added_count} / -{log.points_removed_count}
                                                </div>
                                                {log.distance_change !== 0 && (
                                                    <div className="col-span-2">
                                                        <span className="font-medium">Jarak:</span>
                                                        <span className={log.distance_change > 0 ? "text-red-600" : "text-green-600"}>
                                                            {log.distance_change > 0 ? "+" : ""}
                                                            {parseFloat(log.distance_change).toFixed(2)} km
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const FleetMonitoring = () => {
    const [submittedRoutes, setSubmittedRoutes] = useState([]);
    const [routeMonitoring, setRouteMonitoring] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [selectedRoutePoints, setSelectedRoutePoints] = useState([]);
    const [shipPositions, setShipPositions] = useState({});
    const [realTimeTracking, setRealTimeTracking] = useState({});
    const [fuelPrices, setFuelPrices] = useState({});
    const [userData, setUserData] = useState(null);
    
    const getFuelPrice = (route) => {
        if (!route || !route.id_fuel_price) return 0;
        return fuelPrices[route.id_fuel_price] || 0;
    };

    const [rerouteData, setRerouteData] = useState({
        isActive: false,
        routeId: null,
        newPoints: [],
        showPlatformModal: false,
    });

    const [approvalModal, setApprovalModal] = useState({
        isOpen: false,
        routeId: null,
        rerouteData: null,
        pendingApproval: false
    });

    const [rerouteReason, setRerouteReason] = useState("");

    const [historyModal, setHistoryModal] = useState({
        isOpen: false,
        routeId: null,
        logs: [],
        loading: false,
    });

    const [currentUser] = useState({ id: 1, name: "Admin" });

    const mapRef = useRef();

    const [regions, setRegions] = useState({
        central: [],
        north: [],
        south: [],
        tanker: [],
        other: [],
        ship: [],
    });

    const regionIcons = {
        central: new L.Icon({
            iconUrl: IconPlatformCentral,
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            iconSize: [12, 12],
            iconAnchor: [4, 14],
            popupAnchor: [0, -11],
            shadowSize: [14, 14],
        }),
        north: new L.Icon({
            iconUrl: IconPlatformNorth,
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            iconSize: [12, 12],
            iconAnchor: [4, 14],
            popupAnchor: [0, -11],
            shadowSize: [14, 14],
        }),
        south: new L.Icon({
            iconUrl: IconPlatformSouth,
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            iconSize: [12, 12],
            iconAnchor: [4, 14],
            popupAnchor: [0, -11],
            shadowSize: [14, 14],
        }),
        tanker: new L.Icon({
            iconUrl: IconTanker,
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            iconSize: [12, 12],
            iconAnchor: [4, 14],
            popupAnchor: [0, -11],
            shadowSize: [14, 14],
        }),
        other: new L.Icon({
            iconUrl: IconPlatformOther,
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            iconSize: [12, 12],
            iconAnchor: [4, 14],
            popupAnchor: [0, -11],
            shadowSize: [14, 14],
        }),
        boat: new L.Icon({
            iconUrl: IconBoat,
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            iconSize: [12, 12],
            iconAnchor: [4, 14],
            popupAnchor: [0, -11],
            shadowSize: [14, 14],
        }),
    };

    // Fungsi untuk update data rute di tabel rute_destinasi
    const updateRouteDistanceAndFuel = async (routeId, newDistance, newFuelConsumption) => {
        try {
            const fuelPrice = getFuelPrice(selectedRoute);
            const fuelCost = calculateFuelCost(newFuelConsumption, fuelPrice);
            
            const updateData = {
                jarak_tempuh: newDistance,
                konsumsi_fuel: newFuelConsumption.toFixed(2),
                // estimated_fuel_cost: fuelCost.toFixed(2)
            };

            console.log('Updating route data:', {
                routeId,
                updateData
            });

            await API.put(`/rute-destinasi/${routeId}`, updateData);
            
            // Update state submittedRoutes
            setSubmittedRoutes(prev => 
                prev.map(route => 
                    route.id_rute_destinasi === routeId 
                        ? { 
                            ...route, 
                            total_distance: newDistance,
                            konsumsi_fuel: newFuelConsumption.toFixed(2),
                            estimated_fuel_cost: fuelCost.toFixed(2)
                        } 
                        : route
                )
            );
            
            // Update selectedRoute jika sedang aktif
            if (selectedRoute?.id_rute_destinasi === routeId) {
                setSelectedRoute(prev => ({
                    ...prev,
                    total_distance: newDistance,
                    konsumsi_fuel: newFuelConsumption.toFixed(2),
                    estimated_fuel_cost: fuelCost.toFixed(2)
                }));
            }
            
            console.log('Route data updated successfully');
            return true;
        } catch (error) {
            console.error('Failed to update route data:', error);
            return false;
        }
    };

    const createPointsSnapshot = (points) => {
        return points.map((point) => ({
            id_monitoring: point.id_monitoring,
            point_name: point.point_name,
            id_captain_ship: point.id_captain_ship,
            sequence: point.sequence,
            latitude: point.latitude,
            longitude: point.longitude,
            status: point.status,
            description: point.description,
            region: point.region,
            destination_type: point.destination_type,
            is_new_platform: point.is_new_platform,
            is_new_ship: point.is_new_ship,
            mmsi: point.mmsi,
        }));
    };

    const logRerouteAction = async (actionType, description, changes = {}) => {
        if (!rerouteData.routeId) return;

        try {
            const logData = {
                id_rute_destinasi: rerouteData.routeId,
                id_user: currentUser.id,
                id_captain_ship: selectedRoute.id_captain_ship,
                action_type: actionType,
                description: description,
                reroute_reason: rerouteReason,
                points_before: changes.pointsBefore || null,
                points_after: changes.pointsAfter || null,
                changes_summary: changes.changesSummary || {
                    points_added: changes.pointsAdded || [],
                    points_removed: changes.pointsRemoved || [],
                    sequence_changes: changes.sequenceChanges || [],
                    total_points_before: changes.totalPointsBefore || 0,
                    total_points_after: changes.totalPointsAfter || 0,
                    summary: changes.summary || "",
                },
                fuel_loss: changes.fuelLoss || 0,
                fuel_cost: changes.fuelCost || 0,
                distance_change: changes.distanceChange || 0,
                estimated_fuel_before: changes.estimatedFuelBefore || 0,
                estimated_fuel_after: changes.estimatedFuelAfter || 0,
                total_points_before: changes.totalPointsBefore || 0,
                total_points_after: changes.totalPointsAfter || 0,
                points_added_count: changes.pointsAddedCount || 0,
                points_removed_count: changes.pointsRemovedCount || 0,
            };

            await API.post("/reroute-logs", logData);
        } catch (error) {
            console.error("Gagal mencatat log reroute:", error);
            return null;
        }
    };

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                setUserData(user);
                console.log('User data loaded:', user);
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                
                const savedUser = localStorage.getItem('user');
                let userRegion = null;
                
                if (savedUser) {
                    try {
                        const user = JSON.parse(savedUser);
                        setUserData(user);
                        userRegion = user.region;
                        console.log('User region:', userRegion);
                    } catch (error) {
                        console.error('Error parsing user data:', error);
                    }
                }
                
                // Fetch semua data termasuk kapal
                const [routesRes, monitoringRes, fuelPricesRes, centralRes, northRes, southRes, tankerRes, otherRes, shipsRes] = await Promise.all([
                    API.get("/rute-destinasi"),
                    API.get("/rute-monitoring"),
                    API.get("/get-fuel-prices"),
                    API.get("/get-all/central-region"),
                    API.get("/get-all/north-region"),
                    API.get("/get-all/south-region"),
                    API.get("/get-all/tanker-rig-barge"),
                    API.get("/get-all/other-region"),
                    API.get("/ship-positions-all"),
                ]);

                let allRoutes = routesRes.data || [];
                let filteredRoutes = allRoutes;

                if (userRegion) {
                    filteredRoutes = allRoutes.filter(route => {
                        if (route.region) {
                            return route.region === userRegion;
                        }
                        return false;
                    });
                    console.log(`Filtered routes for region ${userRegion}:`, filteredRoutes.length, 'from', allRoutes.length);
                }

                filteredRoutes = filteredRoutes.filter(route => {
                    const routeStatus = route.status_rute?.toLowerCase() || '';
                    return routeStatus === 'terjadwal' || 
                        routeStatus === 'dalam perjalanan';
                });

                console.log(`Routes after status filtering:`, filteredRoutes.length);

                setSubmittedRoutes(filteredRoutes);

                const monitoringData = (monitoringRes.data || []).map((point) => ({
                    ...point,
                    latitude: parseFloat(point.latitude),
                    longitude: parseFloat(point.longitude),
                }));
                setRouteMonitoring(monitoringData);

                // Proses data kapal dengan benar
                let shipsData = [];
                console.log('Ships API response:', shipsRes.data);
                
                if (shipsRes.data && shipsRes.data.success && Array.isArray(shipsRes.data.data)) {
                    shipsData = shipsRes.data.data;
                    console.log(`Found ${shipsData.length} ships from API`);
                    
                    // Tampilkan beberapa data kapal untuk debugging
                    if (shipsData.length > 0) {
                        console.log('Sample ship data:', {
                            name: shipsData[0].name,
                            mmsi: shipsData[0].mmsi,
                            lat: shipsData[0].lat,
                            lon: shipsData[0].lon,
                            port: shipsData[0].port,
                            speed: shipsData[0].speed
                        });
                    }
                }

                setRegions({ 
                    central: centralRes.data?.data || [], 
                    north: northRes.data?.data || [], 
                    south: southRes.data?.data || [], 
                    tanker: tankerRes.data?.data || [], 
                    other: otherRes.data?.data || [], 
                    ship: shipsData 
                });

                const fuelPricesMap = {};
                (fuelPricesRes.data?.data || []).forEach(fuel => {
                    fuelPricesMap[fuel.id_fuel_price] = parseFloat(fuel.price);
                });
                setFuelPrices(fuelPricesMap);

            } catch (err) {
                console.error("Gagal ambil data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // Debug logging untuk data kapal
    useEffect(() => {
        console.log('Current regions state:', {
            shipCount: regions.ship?.length || 0,
            shipDataSample: regions.ship?.slice(0, 3) || 'No ship data'
        });
        
        // Debug: cek jika ada kapal di modal
        if (rerouteData.showPlatformModal) {
            console.log('Platform modal open, ships available:', regions.ship?.length || 0);
        }
    }, [regions, rerouteData.showPlatformModal]);

    useEffect(() => {
        if (!submittedRoutes.length) return;

        const fetchShipPositions = async () => {
            try {
                const res = await API.get("/ship-positions-all");
                const ships = res.data.data || [];

                const updatedPositions = {};
                const updatedTracking = {};

                ships.forEach((ship) => {
                    const shipPosition = {
                        lat: parseFloat(ship.lat),
                        lng: parseFloat(ship.lon),
                        name: ship.name,
                    };
                    updatedPositions[ship.mmsi] = shipPosition;

                    const activeRoutes = submittedRoutes.filter((route) => route.id_captain_ship === ship.mmsi && ["Terjadwal", "dalam perjalanan"].includes(route.status_rute));

                    if (activeRoutes.length > 0) {
                        if (!realTimeTracking[ship.mmsi]) {
                            updatedTracking[ship.mmsi] = [shipPosition];
                        } else {
                            const existingTracking = [...realTimeTracking[ship.mmsi]];
                            const lastPosition = existingTracking[existingTracking.length - 1];
                            const distance = calculateDistance(lastPosition.lat, lastPosition.lng, shipPosition.lat, shipPosition.lng);

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
                    setRealTimeTracking((prev) => ({ ...prev, ...updatedTracking }));
                }

                checkProximityToPoints(updatedPositions);
            } catch (err) {
                console.error("Gagal ambil posisi kapal:", err);
            }
        };

        fetchShipPositions();
        const interval = setInterval(fetchShipPositions, 10000);
        return () => clearInterval(interval);
    }, [submittedRoutes]);

    const getRoutePoints = (routeId) => {
        return routeMonitoring.filter((point) => point.id_rute_destinasi === routeId).sort((a, b) => a.sequence - b.sequence);
    };

    const getRandomColor = (index) => {
        const colors = ["blue", "green", "red", "purple", "orange", "darkred", "lightred", "darkblue", "darkgreen"];
        return colors[index % colors.length];
    };

    const getStatusText = (status) => {
        switch (status) {
            case "completed":
                return "Selesai";
            case "in_progress":
                return "Dalam Proses";
            default:
                return "Menunggu";
        }
    };

    const updateRouteStatus = async (routeId, newStatus) => {
        try {
            await API.patch(`/rute-destinasi/${routeId}`, { status_rute: newStatus });
            setSubmittedRoutes((prev) => prev.map((route) => (route.id_rute_destinasi === routeId ? { ...route, status_rute: newStatus } : route)));
            if (selectedRoute?.id_rute_destinasi === routeId) {
                setSelectedRoute((prev) => ({ ...prev, status_rute: newStatus }));
            }
            alert("Status rute berhasil diubah!");
        } catch (err) {
            console.error("Gagal mengubah status rute:", err);
            alert("Gagal mengubah status rute");
        }
    };

    const updateShipRequestStatus = async (pointId) => {
        try {
            const point = routeMonitoring.find((p) => p.id_monitoring === pointId);
            if (!point) return;

            if (point.ship_request_id) {
                await API.patch(`/update-fleet-status/${point.ship_request_id}`, {
                    fleet_status: "complete",
                });
            }
        } catch (err) {
            console.error("Gagal mengubah fleet status:", err);
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

            setRouteMonitoring((prev) => prev.map((point) => (point.id_monitoring === pointId ? { ...point, ...updateData } : point)));

            if (selectedRoutePoints.some((point) => point.id_monitoring === pointId)) {
                setSelectedRoutePoints((prev) => prev.map((point) => (point.id_monitoring === pointId ? { ...point, ...updateData } : point)));
            }
        } catch (err) {
            console.error("Gagal mengubah status titik:", err);
        }
    };

    const handleSelectRoute = (route) => {
        setSelectedRoute(route);
        setSelectedRoutePoints(getRoutePoints(route.id_rute_destinasi));
        setRerouteData({ isActive: false, routeId: null, newPoints: [], showPlatformModal: false });
    };

    const checkProximityToPoints = (positions) => {
        Object.keys(positions).forEach((shipId) => {
            const shipPos = positions[shipId];
            const activeRoutes = submittedRoutes.filter((route) => route.id_captain_ship === shipId && ["Terjadwal", "dalam perjalanan"].includes(route.status_rute));

            activeRoutes.forEach((route) => {
                const points = getRoutePoints(route.id_rute_destinasi);
                const pendingPoints = points.filter((point) => point.status !== "completed");

                if (pendingPoints.length > 0) {
                    const nextPoint = pendingPoints[0];
                    const distance = calculateDistance(shipPos.lat, shipPos.lng, nextPoint.latitude, nextPoint.longitude);

                    if (distance <= 50) {
                        updatePointStatus(nextPoint.id_monitoring, "completed");

                        const updatedPoints = points.map((p) => (p.id_monitoring === nextPoint.id_monitoring ? { ...p, status: "completed", actual_timestamp: new Date().toISOString() } : p));

                        if (updatedPoints.every((p) => p.status === "completed")) {
                            updateRouteStatus(route.id_rute_destinasi, "completed");
                        }
                    }
                }
            });
        });
    };

    const startReroute = () => {
        if (!selectedRoute) return;

        const allPoints = [...selectedRoutePoints];

        setRerouteData({
            isActive: true,
            routeId: selectedRoute.id_rute_destinasi,
            newPoints: allPoints.map((point) => ({
                ...point,
                status: point.status,
                ship_request_id: point.ship_request_id,
                destination_type: point.destination_type || "platform",
                id_captain_ship: point.id_captain_ship || selectedRoute.id_captain_ship,
            })),
            showPlatformModal: false,
        });
    };

    const cancelReroute = () => {
        setRerouteData({
            isActive: false,
            routeId: null,
            newPoints: [],
            showPlatformModal: false,
        });
        setRerouteReason("");
    };

    const addDestinationToReroute = (destination, description) => {
        const lat = destination.type === "ship" 
            ? parseFloat(destination.lat) || parseFloat(destination.latitude_decimal)
            : parseFloat(destination.latitude_decimal);
        
        const lng = destination.type === "ship"
            ? parseFloat(destination.lon) || parseFloat(destination.longitude_decimal)
            : parseFloat(destination.longitude_decimal);

        if (isNaN(lat) || isNaN(lng)) {
            alert("Koordinat tidak valid untuk tujuan ini");
            console.log('Invalid coordinates:', { lat, lng, destination });
            return;
        }

        const getRegionDisplayName = (region, type) => {
            if (type === "ship") return "Kapal";
            
            const regionNames = {
                central: "Central Region",
                north: "North Region",
                south: "South Region",
                tanker: "Tanker/Rig/Barge",
                other: "Other Region",
            };
            return regionNames[region] || region;
        };

        const pointsBefore = createPointsSnapshot(rerouteData.newPoints);

        const newPoint = {
            id_monitoring: `new-${Date.now()}-${Math.random()}`,
            sequence: rerouteData.newPoints.length + 1,
            id_captain_ship: selectedRoute?.id_captain_ship || null,
            point_name: destination.destination_name,
            latitude: lat,
            longitude: lng,
            point_type: "visit",
            priority_level: "normal",
            status: "pending",
            is_new_platform: destination.type === "platform",
            is_new_ship: destination.type === "ship",
            destination_type: destination.type,
            description: description,
            region: destination.region,
            region_name: getRegionDisplayName(destination.region, destination.type),
            mmsi: destination.type === "ship" ? destination.mmsi : null,
            port: destination.type === "ship" ? destination.port : null,
            speed: destination.type === "ship" ? destination.speed : null,
            heading: destination.type === "ship" ? destination.heading : null,
            planned_timestamp: null,
            actual_timestamp: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const updatedPoints = [...rerouteData.newPoints, newPoint];

        setRerouteData((prev) => ({
            ...prev,
            newPoints: updatedPoints,
            showPlatformModal: false,
        }));

        logRerouteAction("point_added", 
            destination.type === "ship" 
                ? `Menambahkan kapal ${destination.name || destination.destination_name} ke rute` 
                : `Menambahkan platform ${destination.destination_name} ke rute`, 
            {
                pointsBefore: pointsBefore,
                pointsAfter: createPointsSnapshot(updatedPoints),
                pointsAdded: [
                    {
                        point_name: newPoint.point_name,
                        sequence: newPoint.sequence,
                        coordinates: { lat, lng },
                        type: destination.type,
                        mmsi: destination.type === "ship" ? destination.mmsi : null,
                    },
                ],
                totalPointsBefore: pointsBefore.length,
                totalPointsAfter: updatedPoints.length,
                pointsAddedCount: 1,
            }
        );
    };

    const updatePointSequence = (fromPendingIndex, toPendingIndex) => {
        if (fromPendingIndex === toPendingIndex) return;

        const pointsBefore = createPointsSnapshot(rerouteData.newPoints);

        const completedPoints = rerouteData.newPoints.filter((point) => point.status === "completed");
        const pendingPoints = rerouteData.newPoints.filter((point) => point.status !== "completed");

        if (fromPendingIndex < 0 || fromPendingIndex >= pendingPoints.length || toPendingIndex < 0 || toPendingIndex >= pendingPoints.length) {
            return;
        }

        try {
            const newPendingPoints = [...pendingPoints];
            const [movedPoint] = newPendingPoints.splice(fromPendingIndex, 1);
            newPendingPoints.splice(toPendingIndex, 0, movedPoint);

            const allPoints = [...completedPoints, ...newPendingPoints];
            const updatedPoints = allPoints.map((point, index) => ({
                ...point,
                sequence: index + 1,
            }));

            setRerouteData((prev) => ({
                ...prev,
                newPoints: updatedPoints,
            }));

            logRerouteAction("sequence_changed", `Mengubah urutan titik ${movedPoint.point_name} dari posisi ${fromPendingIndex + 1} ke ${toPendingIndex + 1}`, {
                pointsBefore: pointsBefore,
                pointsAfter: createPointsSnapshot(updatedPoints),
                sequenceChanges: [
                    {
                        point_name: movedPoint.point_name,
                        from_sequence: fromPendingIndex + 1,
                        to_sequence: toPendingIndex + 1,
                    },
                ],
                totalPointsBefore: pointsBefore.length,
                totalPointsAfter: updatedPoints.length,
                pointsReorderedCount: 1,
            });
        } catch (error) {
            console.error("Error during reordering:", error);
        }
    };

    const movePoint = (pendingIndex, direction) => {
        const pendingPoints = rerouteData.newPoints.filter((point) => point.status !== "completed");

        if (pendingIndex < 0 || pendingIndex >= pendingPoints.length) return;

        if (direction === "up") {
            if (pendingIndex > 0) {
                updatePointSequence(pendingIndex, pendingIndex - 1);
            }
        } else if (direction === "down") {
            if (pendingIndex < pendingPoints.length - 1) {
                updatePointSequence(pendingIndex, pendingIndex + 1);
            }
        }
    };

    const removeReroutePoint = (pendingIndex) => {
        const pointsBefore = createPointsSnapshot(rerouteData.newPoints);
        const pendingPoints = rerouteData.newPoints.filter((point) => point.status !== "completed");

        if (pendingIndex < 0 || pendingIndex >= pendingPoints.length) return;

        const pointToRemove = pendingPoints[pendingIndex];
        const updatedPoints = rerouteData.newPoints.filter((point) => point.id_monitoring !== pointToRemove.id_monitoring);

        const finalPoints = updatedPoints.map((point, idx) => ({
            ...point,
            sequence: idx + 1,
        }));

        setRerouteData((prev) => ({
            ...prev,
            newPoints: finalPoints,
        }));

        logRerouteAction("point_removed", `Menghapus titik ${pointToRemove.point_name} dari rute`, {
            pointsBefore: pointsBefore,
            pointsAfter: createPointsSnapshot(finalPoints),
            pointsRemoved: [
                {
                    point_name: pointToRemove.point_name,
                    sequence: pointToRemove.sequence,
                    coordinates: {
                        lat: pointToRemove.latitude,
                        lng: pointToRemove.longitude,
                    },
                },
            ],
            totalPointsBefore: pointsBefore.length,
            totalPointsAfter: finalPoints.length,
            pointsRemovedCount: 1,
        });
    };

    const requestRerouteApproval = async (approvalType) => {
        try {
            const changes = calculateRerouteChanges(selectedRoutePoints, rerouteData.newPoints);
            
            const approvalData = {
                id_rute_destinasi: rerouteData.routeId,
                id_user: currentUser.id,
                approval_type: approvalType,
                status: approvalType === "direct" ? "approved" : "pending",
                reroute_reason: rerouteReason,
                requested_at: new Date().toISOString(),
                region: userData?.region,
                reroute_data: {
                    newPoints: rerouteData.newPoints,
                    originalPoints: selectedRoutePoints,
                    changes: changes,
                    completed_points_at_request: selectedRoutePoints.filter(p => p.status === "completed").length
                },
                points_added: changes.pointsAdded,
                points_removed: changes.pointsRemoved,
                distance_change: changes.distanceChange,
                fuel_change: changes.fuelChange
            };

            if (approvalType === "direct") {
                await executeReroute();
                alert("Re-route berhasil dilakukan!");
            } else {
                await API.post("/reroute-approvals", approvalData);
                setApprovalModal({
                    isOpen: false,
                    routeId: null,
                    rerouteData: null,
                    pendingApproval: true
                });
                alert("Permintaan approval re-route telah dikirim ke SPV");
            }

            setRerouteData({
                isActive: false,
                routeId: null,
                newPoints: [],
                showPlatformModal: false,
            });
            setRerouteReason("");
        } catch (error) {
            console.error("Gagal memproses reroute:", error);
            alert("Gagal memproses reroute");
        }
    };

    const executeReroute = async () => {
        if (!rerouteData.isActive || rerouteData.newPoints.length === 0) return;

        try {
            const originalDistance = calculateRouteDistance(selectedRoutePoints);
            const newDistance = calculateRouteDistance(rerouteData.newPoints);
            const distanceChange = newDistance - originalDistance;

            const fuelPrice = getFuelPrice(selectedRoute);
            const fuelLoss = distanceChange > 0 ? calculateFuelConsumption(distanceChange) : 0;
            const fuelCost = calculateFuelCost(fuelLoss, fuelPrice); 

            const estimatedFuelBefore = calculateFuelConsumption(originalDistance);
            const estimatedFuelAfter = calculateFuelConsumption(newDistance);

            const originalPoints = createPointsSnapshot(selectedRoutePoints);
            const newPointsSnapshot = createPointsSnapshot(rerouteData.newPoints);

            const completedPoints = rerouteData.newPoints.filter((point) => point.status === "completed");
            const pendingPoints = rerouteData.newPoints.filter((point) => point.status !== "completed");

            const originalPendingPoints = selectedRoutePoints.filter((point) => point.status !== "completed");

            const pointsAdded = pendingPoints.filter((newPoint) => !originalPendingPoints.some((originalPoint) => originalPoint.id_monitoring === newPoint.id_monitoring));

            const pointsRemoved = originalPendingPoints.filter((originalPoint) => !pendingPoints.some((newPoint) => newPoint.id_monitoring === originalPoint.id_monitoring));

            const pointsToDelete = selectedRoutePoints.filter((point) => point.status !== "completed").map((point) => point.id_monitoring);

            if (pointsToDelete.length > 0) {
                await API.delete("/rute-monitoring/bulk", {
                    data: { ids: pointsToDelete },
                });
            }

            if (pendingPoints.length > 0) {
                const newPointsData = pendingPoints.map((point, index) => {
                    const originalPoint = selectedRoutePoints.find((p) => p.point_name === point.point_name || (p.latitude === point.latitude && p.longitude === point.longitude));

                    return {
                        id_rute_destinasi: rerouteData.routeId,
                        point_name: point.point_name,
                        id_captain_ship: point.id_captain_ship || selectedRoute?.id_captain_ship,
                        latitude: point.latitude,
                        longitude: point.longitude,
                        sequence: completedPoints.length + index + 1,
                        status: "pending",
                        point_type: point.point_type,
                        priority_level: point.priority_level,
                        description: point.description || null,
                        ship_request_id: originalPoint?.ship_request_id || point.ship_request_id || point.point_name,
                    };
                });

                await API.post("/rute-monitoring/bulk", newPointsData);
            }

            const updateSuccess = await updateRouteDistanceAndFuel(
                rerouteData.routeId,
                newDistance,
                estimatedFuelAfter
            );

            if (!updateSuccess) {
                throw new Error("Failed to update route distance and fuel");
            }

            await logRerouteAction(
                "reroute_completed",
                `Re-route rute ${selectedRoute.nama_rute} selesai. ${
                    distanceChange > 0 ? `Menambah jarak ${distanceChange.toFixed(2)} km` : `Mengurangi jarak ${Math.abs(distanceChange).toFixed(2)} km`
                }. Alasan: ${rerouteReason}`,
                {
                    pointsBefore: originalPoints,
                    pointsAfter: newPointsSnapshot,
                    pointsAdded: pointsAdded.map((p) => ({
                        point_name: p.point_name,
                        sequence: p.sequence,
                        coordinates: { lat: p.latitude, lng: p.longitude },
                        type: p.destination_type,
                    })),
                    pointsRemoved: pointsRemoved.map((p) => ({
                        point_name: p.point_name,
                        sequence: p.sequence,
                        coordinates: { lat: p.latitude, lng: p.longitude },
                    })),
                    totalPointsBefore: originalPoints.length,
                    totalPointsAfter: newPointsSnapshot.length,
                    summary: `Ditambah ${pointsAdded.length} titik, dihapus ${pointsRemoved.length} titik`,

                    fuelLoss: fuelLoss,
                    fuelCost: fuelCost,
                    distanceChange: distanceChange,
                    estimatedFuelBefore: estimatedFuelBefore,
                    estimatedFuelAfter: estimatedFuelAfter,
                    pointsAddedCount: pointsAdded.length,
                    pointsRemovedCount: pointsRemoved.length,
                }
            );

            await new Promise((resolve) => setTimeout(resolve, 500));

            const monitoringRes = await API.get("/rute-monitoring");
            const monitoringData = (monitoringRes.data || []).map((point) => ({
                ...point,
                latitude: parseFloat(point.latitude),
                longitude: parseFloat(point.longitude),
                ship_request_id: point.ship_request_id,
            }));
            setRouteMonitoring(monitoringData);

            if (selectedRoute) {
                const updatedPoints = monitoringData.filter((point) => point.id_rute_destinasi === selectedRoute.id_rute_destinasi).sort((a, b) => a.sequence - b.sequence);
                setSelectedRoutePoints(updatedPoints);
            }

            return true;
        } catch (err) {
            console.error("Gagal menyimpan re-route:", err);

            await logRerouteAction("reroute_failed", `Gagal menyimpan re-route: ${err.message}`, {
                error: err.message,
                routeId: rerouteData.routeId,
                fuelLoss: 0,
                fuelCost: 0,
            });

            throw err;
        }
    };

    const calculateRerouteChanges = (originalPoints, newPoints) => {
        const originalDistance = calculateRouteDistance(originalPoints);
        const newDistance = calculateRouteDistance(newPoints);
        const distanceChange = newDistance - originalDistance;
        
        const pointsAdded = newPoints.filter(np => 
            !originalPoints.some(op => op.id_monitoring === np.id_monitoring && op.status !== "completed")
        ).length;
        
        const pointsRemoved = originalPoints.filter(op => 
            !newPoints.some(np => np.id_monitoring === op.id_monitoring && op.status !== "completed")
        ).length;

        const fuelChange = calculateFuelConsumption(distanceChange);

        return {
            originalDistance,
            newDistance,
            distanceChange,
            fuelChange,
            pointsAdded,
            pointsRemoved
        };
    };

    const saveReroute = () => {
        if (!rerouteData.isActive || rerouteData.newPoints.length === 0) return;

        setApprovalModal({
            isOpen: true,
            routeId: rerouteData.routeId,
            rerouteData: {
                ...rerouteData,
                originalPoints: selectedRoutePoints,
                completedPointsAtRequest: selectedRoutePoints.filter(p => p.status === "completed").length
            },
            pendingApproval: false
        });
    };

    const viewRerouteHistory = async (routeId) => {
        try {
            setHistoryModal((prev) => ({ ...prev, loading: true }));

            const response = await API.get(`/reroute-logs/route/${routeId}`);

            setHistoryModal({
                isOpen: true,
                routeId: routeId,
                logs: response.data.data || [],
                loading: false,
            });
        } catch (error) {
            console.error("Gagal mengambil history reroute:", error);
            setHistoryModal((prev) => ({ ...prev, loading: false }));
            alert("Gagal mengambil history reroute");
        }
    };

    const getRemainingRoute = (shipId, routePoints) => {
        if (!shipPositions[shipId] || !routePoints || routePoints.length === 0) return null;

        const currentShipPosition = shipPositions[shipId];
        const pendingPoints = routePoints.filter((point) => point.status !== "completed");
        if (pendingPoints.length === 0) return null;

        const line = [[currentShipPosition.lat, currentShipPosition.lng]];
        pendingPoints.forEach((point) => line.push([point.latitude, point.longitude]));
        return line;
    };

    const renderRegionMarkers = (regionType, data) => {
        const validData = data.filter(region => {
            const lat = parseFloat(region.latitude_decimal);
            const lng = parseFloat(region.longitude_decimal);
            return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
        });

        return validData.map((region) => {
            const lat = parseFloat(region.latitude_decimal);
            const lng = parseFloat(region.longitude_decimal);
            
            return (
            <Marker 
                key={region[`id_${regionType}_region`] || region.id_tanker_rig_barge || region.id} 
                position={[lat, lng]} 
                icon={regionIcons[regionType]}
            >
                <Popup>
                <b>{region.platform_name || region.name || 'Unknown Platform'}</b>
                <br />
                {regionType.charAt(0).toUpperCase() + regionType.slice(1)} Region
                <br />
                Koordinat: {lat.toFixed(4)}, {lng.toFixed(4)}
                </Popup>
            </Marker>
            );
        });
    };

    if (loading || !userData) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <p className="ml-4 text-gray-600">Memuat data pengguna...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <header className="bg-white shadow-sm">
                <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-blue-700">Monitoring Rute Kapal</h1>
                    <p className="text-gray-600">
                        Rute pengiriman yang sudah disubmit
                        {userData?.region && (
                            <span className="ml-2 text-blue-600 font-medium">
                                • Region: {userData.region}
                            </span>
                        )}
                    </p>
                </div>
            </header>

            <div className="mx-auto sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-800">Daftar Rute</h2>
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                                    {submittedRoutes.length} Rute Aktif
                                </span>
                            </div>
                            
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                {submittedRoutes.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        {userData?.region ? (
                                            <>
                                                <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                                </svg>
                                                <p className="text-gray-600">Tidak ada rute untuk region</p>
                                                <p className="font-medium text-gray-800 mt-1">{userData.region}</p>
                                                <p className="text-sm text-gray-400 mt-2">Silakan hubungi administrator</p>
                                            </>
                                        ) : (
                                            <p className="text-gray-600">Tidak ada rute yang tersedia</p>
                                        )}
                                    </div>
                                ) : (
                                    submittedRoutes.map((route, index) => (
                                        <div
                                            key={route.id_rute_destinasi}
                                            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                                                selectedRoute?.id_rute_destinasi === route.id_rute_destinasi 
                                                    ? "bg-blue-50 border border-blue-200 shadow-sm" 
                                                    : "bg-gray-50 hover:bg-gray-100 border border-transparent"
                                            }`}
                                            onClick={() => handleSelectRoute(route)}
                                        >
                                            {/* Baris pertama: Nama Kapal dan Tanggal */}
                                            <div className="flex justify-between items-center mb-3">
                                                {/* Nama Kapal */}
                                                <div className="flex-1 pr-2">
                                                    <p className="font-bold text-gray-900 text-lg truncate">
                                                        {route.ship_name || "Nama Kapal Tidak Tersedia"}
                                                    </p>
                                                </div>
                                                
                                                {/* Tanggal - sekarang sejajar dengan tengah */}
                                                <div className="text-right shrink-0">
                                                    <p className="text-base text-gray-500 whitespace-nowrap">
                                                        {route.createdAt 
                                                            ? new Date(route.createdAt).toLocaleDateString('id-ID', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                hour12: false,
                                                                timeZone: 'Asia/Jakarta'
                                                            })
                                                            : "-"
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Baris kedua: Status dan Route Type */}
                                            <div className="flex justify-between items-center">
                                                {/* Status Rute */}
                                                <div>
                                                    <span
                                                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                                            route.status_rute === "Terjadwal"
                                                                ? "bg-green-100 text-green-800"
                                                                : route.status_rute === "dalam perjalanan"
                                                                ? "bg-blue-100 text-blue-800"
                                                                : route.status_rute === "completed"
                                                                ? "bg-purple-100 text-purple-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {route.status_rute || "Status Tidak Diketahui"}
                                                    </span>
                                                </div>
                                                
                                                {/* Route Type */}
                                                <div>
                                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                                        route.route_type === "optimal"
                                                            ? "bg-green-100 text-green-800"
                                                            : route.route_type === "priority"
                                                            ? "bg-yellow-100 text-red-800"
                                                            : "bg-gray-100 text-gray-800"
                                                    }`}>
                                                        {route.route_type ? 
                                                            (() => {
                                                                switch(route.route_type.toLowerCase()) {
                                                                    case 'optimal': return 'OPTIMAL';
                                                                    case 'priority': return 'PRIORITY';
                                                                    default: return route.route_type.toUpperCase();
                                                                }
                                                            })() 
                                                            : "STANDARD"
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                            <div className="h-96 md:min-h-screen">
                                <MapContainer
                                    center={[-5.06, 106.3]}
                                    zoom={9}
                                    className="h-full w-full rounded-lg"
                                    ref={mapRef}
                                    style={{
                                        position: "relative",
                                        zIndex: 1,
                                        minHeight: "400px",
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
                                                attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                                            />
                                        </LayersControl.BaseLayer>
                                    </LayersControl>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                                    {renderRegionMarkers("central", regions.central)}
                                    {renderRegionMarkers("north", regions.north)}
                                    {renderRegionMarkers("south", regions.south)}
                                    {renderRegionMarkers("tanker", regions.tanker)}
                                    {renderRegionMarkers("other", regions.other)}

                                    {Object.keys(shipPositions).map((shipId) => {
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

                                    {selectedRoute && selectedRoutePoints.length > 0 && !rerouteData.isActive && (
                                        <>
                                            {selectedRoutePoints
                                                .filter((point) => !/^waypoint_/i.test(point.point_type))
                                                .map((point) => (
                                                    <Marker
                                                        key={point.id_monitoring}
                                                        position={[point.latitude, point.longitude]}
                                                        icon={
                                                            point.destination_type === "ship"
                                                                ? shipDestinationIcon
                                                                : point.point_type === "start"
                                                                ? startIcon
                                                                : point.point_type === "end"
                                                                ? endIcon
                                                                : destinationIcon
                                                        }
                                                    >
                                                        <Popup>
                                                            <div className="font-medium">{point.point_name}</div>
                                                            <div className="text-sm">
                                                                {point.point_type === "start" ? "Titik Awal" : point.point_type === "end" ? "Titik Akhir" : `Titik ${point.sequence}`}
                                                            </div>
                                                            <div className="text-sm">Status: {getStatusText(point.status)}</div>
                                                            {point.description && <div className="text-sm text-gray-600 mt-1">Keterangan: {point.description}</div>}
                                                            {point.destination_type === "ship" && (
                                                                <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mt-1">Kapal</div>
                                                            )}
                                                        </Popup>
                                                    </Marker>
                                                ))}

                                            <Polyline positions={selectedRoutePoints.map((p) => [p.latitude, p.longitude])} color="#10B981" weight={4} opacity={0.3} />

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

                                    {rerouteData.isActive && rerouteData.newPoints.length > 0 && (
                                        <>
                                            {rerouteData.newPoints.map((point, idx) => (
                                                <Marker
                                                    key={point.id_monitoring || `reroute-${idx}`}
                                                    position={[point.latitude, point.longitude]}
                                                    icon={
                                                        point.destination_type === "ship"
                                                            ? shipDestinationIcon
                                                            : point.status === "completed"
                                                            ? point.point_type === "start"
                                                                ? startIcon
                                                                : point.point_type === "end"
                                                                ? endIcon
                                                                : destinationIcon
                                                            : point.point_type === "start"
                                                            ? startIcon
                                                            : point.point_type === "end"
                                                            ? endIcon
                                                            : destinationIcon
                                                    }
                                                >
                                                    <Popup>
                                                        <div className="text-center">
                                                            <div className="flex items-center justify-center mb-2">
                                                                <div
                                                                    className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold ${
                                                                        point.status === "completed" ? "bg-green-500" : "bg-blue-500"
                                                                    }`}
                                                                >
                                                                    {point.status === "completed" ? "✓" : point.sequence}
                                                                </div>
                                                                {point.destination_type === "ship" && (
                                                                    <div className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                                        Kapal
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="font-medium">{point.point_name}</div>
                                                            <div className="text-sm text-gray-600">
                                                                {point.is_new_ship ? "Kapal" : point.is_new_platform ? "Platform Baru" : `Titik ke-${point.sequence}`}
                                                            </div>
                                                            {point.region_name && (
                                                                <div className={`text-xs mt-1 px-2 py-1 rounded ${
                                                                    point.destination_type === "ship" 
                                                                        ? "bg-blue-100 text-blue-800" 
                                                                        : "bg-green-100 text-green-800"
                                                                }`}>
                                                                    {point.region_name}
                                                                </div>
                                                            )}
                                                            {point.description && (
                                                                <div className="text-xs text-gray-500 mt-1">{point.description}</div>
                                                            )}
                                                            <div
                                                                className={`text-xs mt-1 px-2 py-1 rounded ${
                                                                    point.status === "completed" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                                                                }`}
                                                            >
                                                                Status: {getStatusText(point.status)}
                                                            </div>
                                                        </div>
                                                    </Popup>
                                                </Marker>
                                            ))}

                                            <Polyline positions={rerouteData.newPoints.map((p) => [p.latitude, p.longitude])} color="red" weight={4} opacity={0.7} dashArray="10, 10" />
                                        </>
                                    )}
                                </MapContainer>
                            </div>
                        </div>

                        {selectedRoute ? (
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-xl font-bold text-blue-700">Detail Rute</h2>

                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => viewRerouteHistory(selectedRoute.id_rute_destinasi)}
                                            className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded font-medium"
                                        >
                                            Lihat History
                                        </button>

                                        {!rerouteData.isActive ? (
                                            <button onClick={startReroute} className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded font-medium">
                                                Re-Route
                                            </button>
                                        ) : (
                                            <div className="flex space-x-2">
                                                <button onClick={cancelReroute} className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded font-medium">
                                                    Batal
                                                </button>
                                                <button onClick={saveReroute} className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded font-medium">
                                                    Simpan Re-Route
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {rerouteData.isActive && (
                                    <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <h3 className="font-semibold text-yellow-800 mb-3 flex items-center">
                                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            Mode Edit Rute - Atur Urutan Titik
                                        </h3>

                                        <div className="mb-4">
                                            <p className="text-sm text-yellow-700">Atur urutan titik rute dengan drag & drop atau menggunakan tombol panah.</p>
                                        </div>

                                        <RoutePointList points={rerouteData.newPoints} onReorder={updatePointSequence} onRemove={removeReroutePoint} onMove={movePoint} allowEditCompleted={false} />

                                        <div className="mt-4 flex justify-between items-center">
                                            <div className="text-sm text-yellow-700">
                                                <div>Total: {rerouteData.newPoints.length} titik</div>
                                                <div className="text-xs">
                                                    (Selesai: {rerouteData.newPoints.filter((p) => p.status === "completed").length}, Pending:{" "}
                                                    {rerouteData.newPoints.filter((p) => p.status !== "completed").length})
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setRerouteData((prev) => ({ ...prev, showPlatformModal: true }))}
                                                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded text-sm"
                                            >
                                                + Tambah Tujuan
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="font-semibold text-gray-700 mb-2">Informasi Rute</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Nama Rute:</span>
                                                <span className="font-medium">{selectedRoute.nama_rute}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Kapal:</span>
                                                <span className="font-medium">{selectedRoute.ship_name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Status:</span>
                                                <span
                                                    className={`font-medium px-2 py-1 rounded-full text-xs ${
                                                        selectedRoute.status_rute === "Terjadwal"
                                                            ? "bg-green-100 text-green-800"
                                                            : selectedRoute.status_rute === "dalam perjalanan"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : selectedRoute.status_rute === "tertunda"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : selectedRoute.status_rute === "completed"
                                                            ? "bg-purple-100 text-purple-800"
                                                            : "bg-red-100 text-red-800"
                                                    }`}
                                                >
                                                    {selectedRoute.status_rute}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="font-semibold text-gray-700 mb-2">Statistik Rute</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Total Titik:</span>
                                                <span className="font-medium">{selectedRoutePoints.length}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Selesai:</span>
                                                <span className="font-medium text-green-600">{selectedRoutePoints.filter((p) => p.status === "completed").length}</span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Perkiraan Penggunaan Fuel ⛽:</span>
                                                <span className="font-medium">{Number(selectedRoute.konsumsi_fuel).toFixed(2) + " " + selectedRoute.satuan_konsumsi}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-3">Titik-titik Rute</h3>
                                    <div className="space-y-3">
                                        {selectedRoutePoints.length === 0 ? (
                                            <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">Tidak ada titik rute yang tersedia</div>
                                        ) : (
                                            selectedRoutePoints.map((point, index) => (
                                                <div key={point.id_monitoring} className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                    <div
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold mr-4 ${
                                                            point.destination_type === "ship"
                                                                ? "bg-blue-500 text-white"
                                                                : point.status === "completed"
                                                                ? "bg-green-500 text-white"
                                                                : point.status === "in_progress"
                                                                ? "bg-blue-500 text-white"
                                                                : "bg-gray-500 text-white"
                                                        }`}
                                                    >
                                                        {point.sequence}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <div className="flex items-center">
                                                                <span className="font-medium text-gray-900">{point.point_name}</span>
                                                                {point.destination_type === "ship" && (
                                                                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                                                        Kapal
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span
                                                                className={`text-xs px-2 py-1 rounded-full ${
                                                                    point.status === "completed"
                                                                        ? "bg-green-100 text-green-800"
                                                                        : point.status === "in_progress"
                                                                        ? "bg-blue-100 text-blue-800"
                                                                        : "bg-gray-100 text-gray-800"
                                                                }`}
                                                            >
                                                                {getStatusText(point.status)}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                                                        </div>
                                                        {point.description && <div className="text-xs text-gray-500 mt-1">Keterangan: {point.description}</div>}
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {point.point_type === "start" ? "Titik Awal" : point.point_type === "end" ? "Titik Akhir" : `Tujuan ${point.sequence}`}
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        {point.status !== "completed" && (
                                                            <button
                                                                onClick={() => updatePointStatus(point.id_monitoring, "completed")}
                                                                className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-sm"
                                                            >
                                                                Tandai Selesai
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow p-8 text-center">
                                <div className="text-gray-400 mb-4">
                                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1}
                                            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-700 mb-2">Belum ada rute yang dipilih</h3>
                                <p className="text-gray-500">
                                    {userData?.region ? 
                                        `Pilih salah satu rute dari daftar region ${userData.region} di sebelah kiri` : 
                                        "Pilih salah satu rute dari daftar di sebelah kiri"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <DestinationModal
                isOpen={rerouteData.showPlatformModal}
                onClose={() => setRerouteData((prev) => ({ ...prev, showPlatformModal: false }))}
                regions={regions}
                ships={regions.ship}
                onSelect={addDestinationToReroute}
            />

            <RerouteApprovalModal
                isOpen={approvalModal.isOpen}
                onClose={() => {
                    setApprovalModal({
                        isOpen: false,
                        routeId: null,
                        rerouteData: null,
                        pendingApproval: false
                    });
                    setRerouteReason("");
                }}
                rerouteData={approvalModal.rerouteData}
                onApprove={requestRerouteApproval}
                onReject={() => {
                    setApprovalModal({
                        isOpen: false,
                        routeId: null,
                        rerouteData: null,
                        pendingApproval: false
                    });
                    setRerouteReason("");
                }}
                rerouteReason={rerouteReason}
                setRerouteReason={setRerouteReason}
            />

            <RerouteHistoryModal
                isOpen={historyModal.isOpen}
                onClose={() => setHistoryModal({ isOpen: false, routeId: null, logs: [], loading: false })}
                logs={historyModal.logs}
                loading={historyModal.loading}
                routeName={selectedRoute?.nama_rute || ""}
            />
        </div>
    );
};

export default FleetMonitoring;