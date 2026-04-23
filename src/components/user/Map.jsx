import React, { useEffect, useState, useRef } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
    useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import API from "../../api/Api";
import IconPlatformNorth from "../../../src/assets/icon/icon_platform_north.svg"
import IconPlatformSouth from "../../../src/assets/icon/icon_platform_south.svg"
import IconPlatformCentral from "../../../src/assets/icon/icon_platform_central.svg"
import IconPlatformOther from "../../../src/assets/icon/icon_platform_other.svg"
import IconTanker from "../../../src/assets/icon/icon_Subsea_wellhead.svg"
import IconBoat from "../../../src/assets/icon/icon_boat.svg";

// ICONS
const iconBlue = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const iconRed = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// Komponen untuk mengubah view map saat center berubah
const ChangeView = ({ center, zoom }) => {
    const map = useMap();
    const prevCenterRef = useRef(center);
    const prevZoomRef = useRef(zoom);

    useEffect(() => {
        // Hanya update view jika center atau zoom benar-benar berubah
        if (center && center.lat && center.lng &&
            (center.lat !== prevCenterRef.current?.lat ||
                center.lng !== prevCenterRef.current?.lng ||
                zoom !== prevZoomRef.current)) {

            map.setView([center.lat, center.lng], zoom || 15);

            // Update ref dengan nilai terkini
            prevCenterRef.current = center;
            prevZoomRef.current = zoom;
        }
    }, [center, zoom, map]);

    return null;
};

const Map = ({ center, apiMarkers = [], onChangeCoords, selectedPlatform, isPlatformMode }) => {
    const [destination, setDestination] = useState(null);
    const [name, setName] = useState("");
    const [isFullscreen, setIsFullscreen] = useState(false);
    const mapRef = useRef();
    const prevSelectedPlatformRef = useRef(null);

    // Custom icons untuk platform
    const centralIcon = new L.Icon({
        iconUrl: IconPlatformCentral,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -8],
    });

    const northIcon = new L.Icon({
        iconUrl: IconPlatformNorth,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -8],
    });

    const southIcon = new L.Icon({
        iconUrl: IconPlatformSouth,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -8],
    });

    const tankerIcon = new L.Icon({
        iconUrl: IconTanker,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -8],
    });

    const otherIcon = new L.Icon({
        iconUrl: IconPlatformOther,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -8],
    });

    const shipIcon = new L.Icon({
        iconUrl: IconBoat,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -8],
    });

    const [central, setCentral] = useState([]);
    const [north, setNorth] = useState([]);
    const [south, setSouth] = useState([]);
    const [tanker, setTanker] = useState([]);
    const [other, setOther] = useState([]);
    const [ship, setShip] = useState([]);

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
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setName(parsedUser.name || "Nama Tidak Ditemukan")
        };
    }, []);

    // Effect untuk mengubah destination ketika selectedPlatform berubah
    useEffect(() => {
        if (selectedPlatform && selectedPlatform.lat && selectedPlatform.lng) {
            // Cek apakah platform benar-benar berubah
            if (prevSelectedPlatformRef.current !== selectedPlatform.platform_name) {
                const newCoords = { lat: selectedPlatform.lat, lng: selectedPlatform.lng };
                setDestination(newCoords);
                if (onChangeCoords) onChangeCoords(newCoords);
                prevSelectedPlatformRef.current = selectedPlatform.platform_name;
            }
        }
    }, [selectedPlatform, onChangeCoords]);

    // Effect untuk reset destination ketika mode berubah ke current
    useEffect(() => {
        if (!isPlatformMode && center) {
            setDestination(null);
            if (onChangeCoords) onChangeCoords(center);
            prevSelectedPlatformRef.current = null;
        }
    }, [isPlatformMode, center, onChangeCoords]);

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const MapClickHandler = () => {
        const map = useMapEvents({
            click(e) {
                // Hanya izinkan klik jika bukan mode platform
                if (!isPlatformMode) {
                    const newCoords = { lat: e.latlng.lat, lng: e.latlng.lng };
                    setDestination(newCoords);
                    if (onChangeCoords) onChangeCoords(newCoords);
                    prevSelectedPlatformRef.current = null;

                    // pindah ke lokasi baru dengan zoom yang lebih dekat
                    map.setView([e.latlng.lat, e.latlng.lng], 15);
                }
            },
        });
        return null;
    };

    // Tentukan center yang akan digunakan
    const mapCenter = destination || center || [0, 0];
    const zoomLevel = destination ? 15 : 8;

    return (
        <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-full w-full'}`}>
            {/* Tombol Fullscreen */}
            <button
                onClick={toggleFullscreen}
                className="absolute top-2 right-2 z-1000 bg-white p-2 rounded-md shadow-md hover:bg-gray-100 focus:outline-none"
                style={{ zIndex: 1000 }}
            >
                {isFullscreen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                )}
            </button>

            {isFullscreen && (
                <div className="absolute top-2 left-2 z-1000 bg-white p-2 rounded-md shadow-md">
                    <p className="text-sm font-medium">
                        {selectedPlatform
                            ? `Platform: ${selectedPlatform.platform_name}`
                            : destination
                                ? `Lokasi Tujuan: ${destination.lat.toFixed(6)}, ${destination.lng.toFixed(6)}`
                                : "Pilih lokasi di peta"}
                    </p>
                </div>
            )}

            <MapContainer
                center={mapCenter.lat && mapCenter.lng ? [mapCenter.lat, mapCenter.lng] : [0, 0]}
                zoom={zoomLevel}
                style={{ height: "100%", width: "100%" }}
                whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                <ChangeView center={mapCenter} zoom={zoomLevel} />

                {/* Starting Point (User Login) */}
                {center && center.lat && center.lng && (
                    <Marker position={[center.lat, center.lng]} icon={iconBlue}>
                        <Popup>Lokasi terkini {name}</Popup>
                    </Marker>
                )}

                {/* Destination (dipilih user dengan klik map atau platform) */}
                {destination && destination.lat && destination.lng && (
                    <Marker position={[destination.lat, destination.lng]} icon={iconRed}>
                        <Popup>
                            {selectedPlatform
                                ? `Platform: ${selectedPlatform.platform_name}`
                                : "Lokasi Tujuan"}
                            <br />
                            Koordinat: {destination.lat.toFixed(6)}, {destination.lng.toFixed(6)}
                        </Popup>
                    </Marker>
                )}

                {/* Central Region */}
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
                            <br />
                            {p.latitude_decimal}, {p.longitude_decimal}
                        </Popup>
                    </Marker>
                ))}

                {/* North Region */}
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
                            <br />
                            {p.latitude_decimal}, {p.longitude_decimal}
                        </Popup>
                    </Marker>
                ))}

                {/* South Region */}
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
                            <br />
                            {p.latitude_decimal}, {p.longitude_decimal}
                        </Popup>
                    </Marker>
                ))}

                {/* Tanker/Rig/Barge */}
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
                            <br />
                            {p.latitude_decimal}, {p.longitude_decimal}
                        </Popup>
                    </Marker>
                ))}

                {/* Other Region */}
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
                            <br />
                            {p.latitude_decimal}, {p.longitude_decimal}
                        </Popup>
                    </Marker>
                ))}

                {/* Ship Data */}
                {ship.map((p) => (
                    <Marker
                        key={p.id_other_region}
                        position={[p.lat, p.lon]}
                        icon={shipIcon}
                    >
                        <Popup>
                            <b>{p.name}</b>
                            <br />
                            Ship Data
                            <br />
                            {p.lat}, {p.lon}
                        </Popup>
                    </Marker>
                ))}

                {/* Marker API */}
                {apiMarkers.map((marker, idx) => (
                    <Marker key={idx} position={[marker.lat, marker.lng]} icon={iconRed}>
                        <Popup>{marker.name}</Popup>
                    </Marker>
                ))}

                <MapClickHandler />
            </MapContainer>
        </div>
    );
};

export default Map;