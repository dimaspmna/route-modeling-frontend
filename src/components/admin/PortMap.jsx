import React, { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
} from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import API from "../../api/Api";

// Fix default icon Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const shipEmojiIcon = new L.DivIcon({
    html: "🏗️",
    className: "ship-emoji-icon",
    iconSize: [52, 52],
    iconAnchor: [16, 16],
});

// Data platform tetap
const platforms = [
    { name: "AIDA-A*", latitude: -4.723458, longitude: 106.586242, region: "North Region" },
    { name: "ARYANI-A*", latitude: -4.621440, longitude: 106.640452, region: "North Region" },
    { name: "CHESSY-A*", latitude: -4.667109, longitude: 106.675306, region: "North Region" },
    { name: "INDRI-A", latitude: -4.646330, longitude: 106.598759, region: "North Region" },
    { name: "INTAN-A*", latitude: -4.584678, longitude: 106.642714, region: "North Region" },
    { name: "INTAN-AC (B.MONOPOD)*", latitude: -4.584951, longitude: 106.642491, region: "North Region" },
    { name: "INTAN-B*", latitude: -4.579017, longitude: 106.660452, region: "North Region" },
    { name: "INTAN-BPC*", latitude: -4.579306, longitude: 106.660136, region: "North Region" },
    { name: "LIDYA-A*", latitude: -4.620297, longitude: 106.560748, region: "North Region" },
    { name: "NE.INTAN-A", latitude: -4.559817, longitude: 106.700339, region: "North Region" },
    { name: "NE.INTAN-AC (MONOPOD)", latitude: -4.559699, longitude: 106.700657, region: "North Region" },
    { name: "VITA-A (MONOPOD)", latitude: -4.627497, longitude: 106.621025, region: "North Region" },
    { name: "WIDURI-A*", latitude: -4.667019, longitude: 106.629006, region: "North Region" },
    { name: "WIDURI-B", latitude: -4.683746, longitude: 106.631933, region: "North Region" },
    { name: "WIDURI-C", latitude: -4.664775, longitude: 106.646793, region: "North Region" },
    { name: "WIDURI-D*", latitude: -4.680854, longitude: 106.610069, region: "North Region" },
    { name: "WIDURI-DC*", latitude: -4.681247, longitude: 106.610056, region: "North Region" },
    { name: "WIDURI-E*", latitude: -4.708022, longitude: 106.609054, region: "North Region" },
    { name: "WIDURI-F (MONOPOD)", latitude: -4.686969, longitude: 106.567886, region: "North Region" },
    { name: "WIDURI-G (MONOPOD)", latitude: -4.679824, longitude: 106.622081, region: "North Region" },
    { name: "WIDURI-H (MONOPOD)*", latitude: -4.667435, longitude: 106.637584, region: "North Region" },
    { name: "WIDURI-P*", latitude: -4.667113, longitude: 106.629831, region: "North Region" },
    { name: "WINDRI-A (MONOPOD)", latitude: -4.666727, longitude: 106.592226, region: "Central Region" },
];


const PortMap = () => {
    const [ships, setShips] = useState([]);
    const [selectedShip, setSelectedShip] = useState("ALL");
    const [allShipNames, setAllShipNames] = useState([]);

    const fetchAllShips = async () => {
        try {
            const res = await API.get("/ships?mmsi=all");
            const data = res.data.data || [];
            setShips(data);
            const names = [...new Set(data.map((ship) => ship.name))];
            setAllShipNames(names);
        } catch (error) {
            console.error("Gagal mengambil semua data kapal:", error);
        }
    };

    const fetchOneShip = async () => {
        try {
            const res = await API.get(`/ships/local?name=${encodeURIComponent(selectedShip)}`);
            const sortedData = (res.data || []).sort(
                (a, b) => new Date(a.date) - new Date(b.date)
            );
            setShips(sortedData);
        } catch (error) {
            console.error("Gagal mengambil kapal lokal:", error);
        }
    };

    useEffect(() => {
        if (selectedShip === "ALL") {
            fetchAllShips();
            const interval = setInterval(fetchAllShips, 5000);
            return () => clearInterval(interval);
        } else {
            fetchOneShip();
            const interval = setInterval(fetchOneShip, 5000);
            return () => clearInterval(interval);
        }
    }, [selectedShip]);

    const shipPaths = ships.reduce((acc, ship) => {
        if (!acc[ship.name]) acc[ship.name] = [];
        acc[ship.name].push([ship.lat, ship.lon]);
        return acc;
    }, {});

    const lastPosition =
        selectedShip !== "ALL" && ships.length > 0
            ? ships[ships.length - 1]
            : null;

    return (
        <div className="w-full mt-4">
            {/* Dropdown PILIH KAPAL di ATAS */}
            <div className="mb-3 flex flex-wrap items-center gap-3">
                <label htmlFor="ship-select" className="text-sm font-medium text-gray-700">
                    Pilih Kapal:
                </label>
                <select
                    id="ship-select"
                    value={selectedShip}
                    onChange={(e) => setSelectedShip(e.target.value)}
                    className="border bg-white rounded-md border-gray-300 px-2 py-1 text-sm"
                >
                    <option value="ALL">Semua Kapal</option>
                    {allShipNames.map((name, index) => (
                        <option key={index} value={name}>
                            {name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Map */}
            <div className="h-[300px] rounded-lg overflow-hidden shadow border border-gray-300">
                <MapContainer
                    center={[-4.65, 106.63]}
                    zoom={8}
                    scrollWheelZoom
                    className="w-full h-full"
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap contributors"
                    />

                    {/* Kapal */}
                    {selectedShip === "ALL" ? (
                        ships.map((ship, index) => (
                            <Marker key={index} position={[ship.lat, ship.lon]}>
                                <Popup>
                                    <strong>MMSI: {ship.MMSI}</strong><br />
                                    <strong>{ship.name}</strong><br />
                                    Port: {ship.port}<br />
                                    Lat: {ship.lat}, Lon: {ship.lon}
                                </Popup>
                            </Marker>
                        ))
                    ) : (
                        lastPosition && (
                            <Marker position={[lastPosition.lat, lastPosition.lon]}>
                                <Popup>
                                    <strong>MMSI: {lastPosition.mmsi}</strong><br />
                                    <strong>{lastPosition.name}</strong><br />
                                    Port: {lastPosition.port}<br />
                                    Lat: {lastPosition.lat}, Lon: {lastPosition.lon}
                                </Popup>
                            </Marker>
                        )
                    )}

                    {/* Garis pelayaran */}
                    {selectedShip === "ALL"
                        ? Object.entries(shipPaths).map(([name, path], i) => (
                            <Polyline key={i} positions={path} color="#4f46e5" weight={3} />
                        ))
                        : ships.length > 1 && (
                            <Polyline positions={ships.map((s) => [s.lat, s.lon])} color="#4f46e5" weight={3} />
                        )}

                    {/* Platform marker */}
                    {platforms.map((platform, index) => (
                        <Marker
                            key={`platform-${index}`}
                            position={[platform.latitude, platform.longitude]}
                            icon={shipEmojiIcon}
                        >
                            <Popup>
                                <strong>{platform.name}</strong><br />
                                Region: {platform.region}<br />
                                Lat: {platform.latitude}, Lon: {platform.longitude}
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
};

export default PortMap;
