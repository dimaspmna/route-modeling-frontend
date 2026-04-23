import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import API from "../../api/Api";
import { useState, useEffect } from "react";
import {
    centralRegionIcon,
    northRegionIcon,
    southRegionIcon,
    tankerRigBargeIcon,
    otherRegionIcon,
    boatIcon,
} from "../../assets/mapIcon";

const FleetMap = ({ onSelectRoute, selectedRoute, captainPosition, destination }) => {
    const [markers, setMarkers] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [central, north, south, tanker, other, ship] = await Promise.all([
                    API.get("/get-all/central-region"),
                    API.get("/get-all/north-region"),
                    API.get("/get-all/south-region"),
                    API.get("/get-all/tanker-rig-barge"),
                    API.get("/get-all/other-region"),
                    API.get("/get-all/ship"),
                ]);

                const formatted = [
                    ...central.data.data.map((d) => ({
                        id: d.id_central_region,
                        name: d.platform_name,
                        lat: d.latitude_decimal,
                        lng: d.longitude_decimal,
                        type: "central",
                    })),
                    ...north.data.data.map((d) => ({
                        id: d.id_north_region,
                        name: d.platform_name,
                        lat: d.latitude_decimal,
                        lng: d.longitude_decimal,
                        type: "north",
                    })),
                    ...south.data.data.map((d) => ({
                        id: d.id_south_region,
                        name: d.platform_name,
                        lat: d.latitude_decimal,
                        lng: d.longitude_decimal,
                        type: "south",
                    })),
                    ...tanker.data.data.map((d) => ({
                        id: d.id_tanker_rig_barge,
                        name: d.platform_name,
                        lat: d.latitude_decimal,
                        lng: d.longitude_decimal,
                        type: "tanker",
                    })),
                    ...other.data.data.map((d) => ({
                        id: d.id_other_region,
                        name: d.platform_name,
                        lat: d.latitude_decimal,
                        lng: d.longitude_decimal,
                        type: "other",
                    })),
                    ...ship.data.data.map((d) => ({
                        id: d.id_ship,
                        name: d.name,
                        lat: d.lat,
                        lng: d.lon,
                        type: "ship",
                    })),
                ];

                setMarkers(formatted);
            } catch (err) {
                console.error("Gagal ambil data:", err);
            }
        };

        fetchData();
    }, []);

    // Fungsi helper untuk icon
    const getIcon = (type) => {
        switch (type) {
            case "central":
                return centralRegionIcon;
            case "north":
                return northRegionIcon;
            case "south":
                return southRegionIcon;
            case "tanker":
                return tankerRigBargeIcon;
            case "other":
                return otherRegionIcon;
            case "ship":
                return boatIcon;
            default:
                return otherRegionIcon;
        }
    };

    const defaultCenter = destination
        ? [destination.lat, destination.lon]
        : [0, 0];

    // Icon kapal kapten (biru)
    const captainIcon = new L.Icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149060.png",
        iconSize: [25, 25],
    });

    // Icon tujuan (hijau)
    const destinationIcon = new L.Icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        iconSize: [25, 25],
    });

    return (
        <MapContainer center={defaultCenter} zoom={6} style={{ height: "300px", width: "100%" }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
            />

            {/* Kapten */}
            {captainPosition && (
                <Marker
                    position={[
                        captainPosition.latitude_decimal,
                        captainPosition.longitude_decimal,
                    ]}
                    icon={captainIcon}
                >
                    <Popup>
                        Kapten: {captainPosition.name}
                        <br />
                        Status: {captainPosition.status}
                    </Popup>
                </Marker>
            )}

            {/* Tujuan */}
            {destination && (
                <Marker position={[destination.lat, destination.lon]} icon={destinationIcon}>
                    <Popup>Tujuan: {destination.name || "Lokasi Fuel"}</Popup>
                </Marker>
            )}

            {/* Marker API */}
            {markers.map((m) => (
                <Marker
                    key={m.id}
                    position={[parseFloat(m.lat), parseFloat(m.lng)]}
                    icon={getIcon(m.type)}
                >
                    <Popup>
                        <strong>{m.name}</strong>
                        <br />
                        Tipe: {m.type}
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default FleetMap;
