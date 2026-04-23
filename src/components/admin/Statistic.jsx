import React, { useEffect, useState } from "react";
import axios from "axios";
import API from "../../api/Api";

const Statistic = () => {
    const [ships, setShips] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [showShips, setShowShips] = useState(true); // NEW: Toggle state

    const fetchShipData = async () => {
        try {
            const res = await API.get("/ships?mmsi=all");
            const data = res.data.data || [];

            setShips(data);

            const latest = data
                .map((s) => new Date(s.date))
                .sort((a, b) => b - a)[0];

            setLastUpdated(latest ? latest.toLocaleString("id-ID") : null);
        } catch (err) {
            console.error("Gagal ambil data kapal:", err);
        }
    };

    useEffect(() => {
        fetchShipData();
        const interval = setInterval(fetchShipData, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full space-y-10 px-4">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center">
                    <p className="text-4xl mb-2">🚢</p>
                    <p className="text-gray-500 dark:text-gray-300 mb-2">Jumlah Kapal</p>
                    <p className="text-3xl font-semibold text-black dark:text-white">
                        {ships.length}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center">
                    <p className="text-4xl mb-2">⏱️</p>
                    <p className="text-gray-500 dark:text-gray-300 mb-2">Terakhir Diperbarui</p>
                    <p className="text-lg font-medium text-black dark:text-white">
                        {lastUpdated || "Memuat..."}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center">
                    <p className="text-4xl mb-2">📋</p>
                    <p className="text-gray-500 dark:text-gray-300 mb-2">Data Tercatat</p>
                    <p className="text-3xl font-semibold text-black dark:text-white">
                        {ships.reduce((acc, ship) => (ship.name ? acc + 1 : acc), 0)}
                    </p>
                </div>
            </div>

            {/* Toggle Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Daftar Kapal Terpantau
                </h2>
                <button
                    onClick={() => setShowShips(!showShips)}
                    className="text-sm px-4 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition"
                >
                    {showShips ? "Sembunyikan" : "Lihat"}
                </button>
            </div>

            {/* TABEL DESKTOP */}
            {showShips && (
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 hidden sm:block">
                    {ships.length === 0 ? (
                        <p className="text-gray-500">Data kapal belum tersedia.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm text-left text-gray-700 dark:text-gray-300">
                                <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-2">#</th>
                                        <th className="px-4 py-2">Nama Kapal</th>
                                        <th className="px-4 py-2">MMSI</th>
                                        <th className="px-4 py-2">Posisi</th>
                                        <th className="px-4 py-2">Tanggal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ships.map((ship, i) => (
                                        <tr
                                            key={i}
                                            className="border-b border-gray-100 dark:border-gray-700"
                                        >
                                            <td className="px-4 py-2">{i + 1}</td>
                                            <td className="px-4 py-2">{ship.name}</td>
                                            <td className="px-4 py-2">{ship.mmsi || ship.MMSI}</td>
                                            <td className="px-4 py-2">
                                                {ship.lat}, {ship.lon}
                                            </td>
                                            <td className="px-4 py-2">
                                                {new Date(ship.date).toLocaleString("id-ID")}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAMPILAN MOBILE */}
            {showShips && (
                <div className="sm:hidden space-y-4">
                    {ships.length === 0 ? (
                        <p className="text-gray-500">Data kapal belum tersedia.</p>
                    ) : (
                        ships.map((ship, i) => (
                            <div
                                key={i}
                                className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 text-sm space-y-1"
                            >
                                <p>
                                    <span className="font-semibold">No:</span> {i + 1}
                                </p>
                                <p>
                                    <span className="font-semibold">Nama:</span> {ship.name}
                                </p>
                                <p>
                                    <span className="font-semibold">Posisi:</span> {ship.lat}, {ship.lon}
                                </p>
                                <p>
                                    <span className="font-semibold">Tanggal:</span>{" "}
                                    {new Date(ship.date).toLocaleString("id-ID")}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default Statistic;
