import React, { useState, useEffect } from "react";
import FleetMap from "../FleetMap";
import API from "../../../api/Api";

const EditFleetEntries = ({ data, onSave, onCancel }) => {
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [captains, setCaptains] = useState([]);
    const [selectedShip, setSelectedShip] = useState(null);

    // Ambil daftar kapal aktif dari backend
    useEffect(() => {
        const fetchCaptains = async () => {
            try {
                const res = await API.get("/captains?status=active");
                setCaptains(res.data);
            } catch (err) {
                console.error("Gagal ambil data kapal aktif:", err);
            }
        };
        fetchCaptains();
    }, []);

    const handleSave = () => {
        if (!selectedRoute) {
            alert("Silakan pilih route terlebih dahulu!");
            return;
        }
        if (!selectedShip) {
            alert("Silakan pilih kapal supply!");
            return;
        }

        onSave({
            ...data,
            selectedRoute,
            selectedShip,
        });
    };

    // Parsing koordinat request
    const destination = data?.kordinat_request
        ? {
            lat: parseFloat(data.kordinat_request.split(",")[0]),
            lon: parseFloat(data.kordinat_request.split(",")[1]),
            name: data.name
        }
        : null;

    return (
        <div className="fixed inset-0 p-6 bg-black bg-opacity-40 z-50 md:flex justify-center items-center overflow-auto">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl">
                <h2 className="text-xl font-semibold mb-6">Fleet Request - Pilih Route & Kapal</h2>

                {/* Info Request */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm mb-1">Nama Kapal Request</label>
                        <input type="text" value={data?.name || ""} disabled className="w-full border px-3 py-2 rounded bg-gray-100" />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Tanggal Request</label>
                        <input
                            type="text"
                            value={
                                data?.tanggal_request
                                    ? new Date(data.tanggal_request).toLocaleString("id-ID", {
                                        dateStyle: "short",
                                        timeStyle: "short",
                                    })
                                    : ""
                            }
                            disabled
                            className="w-full border px-3 py-2 rounded bg-gray-100"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">No. ID Request</label>
                        <input type="text" value={data?.ship_request_id || ""} disabled className="w-full border px-3 py-2 rounded bg-gray-100" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm mb-1">Jenis Fuel</label>
                        <input type="text" value={data?.jenis_material || ""} disabled className="w-full border px-3 py-2 rounded bg-gray-100" />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Volume</label>
                        <input type="text" value={`${data?.kuantitas} ${data?.satuan || "KL"}`} disabled className="w-full border px-3 py-2 rounded bg-gray-100" />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Koordinat Tujuan</label>
                        <input type="text" value={data?.kordinat_request || ""} disabled className="w-full border px-3 py-2 rounded bg-gray-100" />
                    </div>
                </div>

                {/* Dropdown Pilih Kapal Aktif */}
                <div className="mb-4">
                    <label className="block text-sm mb-1">Pilih Kapal Pengirim</label>
                    <select
                        value={selectedShip?.id_captain_ship || ""}
                        onChange={(e) => {
                            const ship = captains.find(c => c.id_captain_ship === e.target.value);
                            setSelectedShip(ship);
                        }}
                        className="w-full border px-3 py-2 rounded bg-white"
                    >
                        <option value="">-- Pilih Kapal --</option>
                        {captains.map(captain => (
                            <option key={captain.id_captain_ship} value={captain.id_captain_ship}>
                                {captain.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* FleetMap untuk pilih route */}
                <div className="mb-4">
                    <label className="block text-sm mb-2">Pilih Route</label>
                    <FleetMap
                        onSelectRoute={setSelectedRoute}
                        selectedRoute={selectedRoute}
                        captainPosition={selectedShip}
                        destination={destination}
                    />
                </div>

                {/* Contoh info rute terdekat */}
                {selectedRoute && (
                    <div className="border rounded-xl p-4 my-4 shadow-sm flex items-start justify-between bg-blue-50">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                                    Jarak Terdekat
                                </span>
                                <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                                    📍 {selectedRoute.distance} km
                                </span>
                            </div>
                            <p className="font-semibold text-xs">
                                Rute - {selectedRoute.name}
                            </p>
                        </div>
                        <div className="mt-2 md:mt-0">
                            <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                        </div>
                    </div>
                )}

                {/* Tombol aksi */}
                <div className="flex justify-end gap-2">
                    <button onClick={onCancel} className="bg-red-500 text-white px-4 py-2 rounded">
                        Batal
                    </button>
                    <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded">
                        Lanjut
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditFleetEntries;
