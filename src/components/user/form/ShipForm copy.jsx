import React, { useEffect, useState } from "react";
import Map from "../Map";
import SuccessAlert from "../components/SuccessAlert";
import { v4 as uuidv4 } from "uuid";
import API from "../../../api/Api";

const ShipForm = () => {
    const [jenisRequest, setJenisRequest] = useState("");
    const [jenisMaterial, setJenisMaterial] = useState("");
    const [kuantitas, setKuantitas] = useState("");
    const [deskripsi, setDeskripsi] = useState("");
    const [satuan, setSatuan] = useState("");
    const [name, setName] = useState("");
    const [destinationName, setDestinationName] = useState("");
    const [tanggal, setTanggal] = useState(new Date());
    const [tanggalDisplay, setTanggalDisplay] = useState("");
    const [requestId, setRequestId] = useState("");
    const [currentCoords, setCurrentCoords] = useState(null);
    const [destinationCoords, setDestinationCoords] = useState(null);
    const [apiCoords, setApiCoords] = useState([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [priority, setPriority] = useState("normal");
    const [formErrors, setFormErrors] = useState({});

    const [modeTujuan, setModeTujuan] = useState("current");
    const [platformList, setPlatformList] = useState([]);
    const [shipList, setShipList] = useState([]);
    const [searchPlatform, setSearchPlatform] = useState("");
    const [selectedPlatform, setSelectedPlatform] = useState(null);
    const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setName(parsedUser.name || "Nama Tidak Ditemukan");

            if (parsedUser.lat && parsedUser.lng) {
                const startCoords = {
                    lat: parseFloat(parsedUser.lat),
                    lng: parseFloat(parsedUser.lng),
                };
                setCurrentCoords(startCoords);
                setDestinationCoords(startCoords);
            }
        }

        setRequestId(uuidv4().slice(0, 8).toUpperCase());

        const updateTime = () => {
            const now = new Date();
            setTanggal(now);

            const optionsDate = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };
            const datePart = now.toLocaleDateString('id-ID', optionsDate);

            const optionsTime = {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            };
            const timePart = now.toLocaleTimeString('id-ID', optionsTime);

            setTanggalDisplay(`${datePart} ${timePart}`);
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchPlatformsAndShips = async () => {
            setIsLoadingPlatforms(true);
            try {
                const endpoints = [
                    "/get-all/central-region",
                    "/get-all/conductor",
                    "/get-all/north-region",
                    "/get-all/other-region",
                    "/get-all/south-region",
                    "/get-all/tanker-rig-barge",
                    "/get-all/subsea-wellhead",
                    "/ship-positions-all",
                ];

                let allPlatforms = [];
                let allShips = [];

                for (let ep of endpoints) {
                    try {
                        const res = await API.get(ep);

                        let data = [];
                        if (Array.isArray(res.data)) {
                            data = res.data;
                        } else if (res.data && Array.isArray(res.data.data)) {
                            data = res.data.data;
                        }

                        const isShipEndpoint = ep.includes("ship");

                        if (isShipEndpoint) {
                            const shipFormatted = data.map((item) => ({
                                name: item.name || "Unnamed Ship",
                                platform_name: item.name || "Unnamed Ship",
                                lat: parseFloat(item.lat || item.latitude_decimal || 0),
                                lng: parseFloat(item.lon || item.lng || item.longitude_decimal || 0),
                                type: "ship"
                            })).filter(s => s.lat !== 0 && s.lng !== 0);

                            allShips = [...allShips, ...shipFormatted];
                        } else {
                            const platformFormatted = data.map((item) => ({
                                platform_name: item.platform_name || item.name || "Unnamed Platform",
                                name: item.platform_name || item.name || "Unnamed Platform",
                                lat: parseFloat(item.latitude_decimal || item.lat || 0),
                                lng: parseFloat(item.longitude_decimal || item.lon || item.lng || 0),
                                type: "platform"
                            })).filter(p => p.lat !== 0 && p.lng !== 0);

                            allPlatforms = [...allPlatforms, ...platformFormatted];
                        }
                    } catch (err) {
                        console.error(`Gagal ambil data dari ${ep}`, err);
                    }
                }

                const combinedList = [...allPlatforms, ...allShips];
                setPlatformList(combinedList);
                setShipList(allShips);
            } catch (err) {
                console.error("Gagal ambil data platform dan ships", err);
            } finally {
                setIsLoadingPlatforms(false);
            }
        };

        fetchPlatformsAndShips();
    }, []);

    const filteredPlatforms = platformList.filter((p) =>
        p.platform_name.toLowerCase().includes(searchPlatform.toLowerCase()) ||
        p.name.toLowerCase().includes(searchPlatform.toLowerCase())
    );

    const validateForm = () => {
        const errors = {};

        if (!jenisRequest) errors.jenisRequest = "Jenis request harus dipilih";
        if (jenisRequest === "fuel" && !jenisMaterial) errors.jenisMaterial = "Jenis material harus dipilih";
        if (!kuantitas || kuantitas <= 0) errors.kuantitas = "Kuantitas harus diisi dengan benar";
        if (jenisRequest === "fuel" && !satuan) errors.satuan = "Jenis material harus dipilih";
        if (jenisRequest === "fresh_water" && !satuan) errors.satuan = "Jenis material harus dipilih";
        if (jenisRequest === "passenger" && !satuan) errors.satuan = "Jenis material harus dipilih";
        if (!destinationCoords) errors.destinationCoords = "Lokasi tujuan harus dipilih";

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            const storedUser = localStorage.getItem("user");
            const parsedUser = storedUser ? JSON.parse(storedUser) : {};
            const email = parsedUser.email || null;

            // Tentukan status_request berdasarkan jenis request
            let statusRequest = "waiting approval"; // default value

            // Jika request adalah passenger, material, atau foodstuff
            if (jenisRequest === "passenger" || jenisRequest === "material" || jenisRequest === "foodstuff") {
                statusRequest = "process to fleet team";
            }

            // Format koordinat dengan null check
            const formattedCoords = destinationCoords 
                ? `${destinationCoords.lat.toFixed(6)}, ${destinationCoords.lng.toFixed(6)}`
                : "0, 0";

            const payload = {
                ship_request_id: requestId || uuidv4(),
                name,
                destination_name:
                    modeTujuan === "current"
                        ? name
                        : modeTujuan === "manual"
                            ? `Manual (${destinationCoords?.lat?.toFixed(6) || '0'}, ${destinationCoords?.lng?.toFixed(6) || '0'})`
                            : modeTujuan === "platform"
                                ? selectedPlatform?.platform_name || selectedPlatform?.name || "Unknown User"
                                : "Unknown Destination",
                tanggal_request: tanggal,
                kategori_request: jenisRequest,
                jenis_material: jenisMaterial || null,
                kuantitas,
                satuan,
                deskripsi,
                kordinat_request: formattedCoords,
                lat_request: destinationCoords?.lat || 0,
                lng_request: destinationCoords?.lng || 0,
                email,
                priority_request: priority,
                fleet_status: "pending",
                status_request: statusRequest,
                lat: currentCoords?.lat || null,
                lng: currentCoords?.lng || null,
            };

            await API.post("/create-user-form-request", payload);

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            setShowSummary(false);

            resetForm();
        } catch (err) {
            console.error("Gagal kirim data", err);
            alert("Gagal mengirim data ke server!");
        }
    };
    
    const resetForm = () => {
        setJenisRequest("");
        setJenisMaterial("");
        setKuantitas("");
        setDeskripsi("");
        setSatuan("");
        setPriority("normal");
        setRequestId(uuidv4().slice(0, 8).toUpperCase());
        setFormErrors({});
        setModeTujuan("current");
        setSelectedPlatform(null);
        setSearchPlatform("");

        if (currentCoords) {
            setDestinationCoords(currentCoords);
        } else {
            setDestinationCoords(null);
        }
    };

    const getSatuanOptions = () => {
        if (jenisRequest === "passenger") return ["Orang"];
        if (jenisRequest === "fuel" || jenisRequest === "fresh_water") return ["Liter"];
        return [];
    };

    const handleLanjutClick = () => {
        if (validateForm()) {
            setShowSummary(true);
        }
    };

    const handlePlatformSelect = (platform) => {
        setSelectedPlatform(platform);
        setDestinationCoords({ lat: platform.lat, lng: platform.lng });
        setSearchPlatform(platform.platform_name || platform.name);
        setDestinationName(platform.platform_name || platform.name || "Unknown User");
    };

    // Helper function untuk format koordinat dengan null check
    const formatCoords = (coords) => {
        if (!coords) return "Belum ada tujuan";
        return `${coords.lat?.toFixed(6) || '0'}, ${coords.lng?.toFixed(6) || '0'}`;
    };

    return (
        <div className="bg-gray-50 md:p-6 text-gray-800 min-h-screen relative">
            <div className="mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Route Modelling</h1>
                    <p className="text-sm font-medium text-gray-600 mt-1">Form Request</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Nama User</p>
                            <p className="font-semibold text-gray-900 mt-1 truncate">{name}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Tanggal Request</p>
                            <p className="font-semibold text-gray-900 mt-1">{tanggalDisplay}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">No. ID Request</p>
                            <p className="font-semibold text-gray-900 mt-1">{requestId}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Jenis Request</label>
                                <select
                                    value={jenisRequest}
                                    onChange={(e) => {
                                        setJenisRequest(e.target.value);
                                        setJenisMaterial("");
                                        setSatuan("");
                                        setDeskripsi("");
                                        setFormErrors({ ...formErrors, jenisRequest: "" });
                                    }}
                                    className={`w-full bg-white text-black border ${formErrors.jenisRequest ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
                                >
                                    <option value="">-- Pilih Jenis Request --</option>
                                    <option value="fuel">Fuel</option>
                                    <option value="fresh_water">Fresh Water</option>
                                    <option value="passenger">Passenger</option>
                                    <option value="material">Material</option>
                                    <option value="foodstuff">Food Stuff</option>
                                </select>
                                {formErrors.jenisRequest && <p className="mt-1 text-sm text-red-600">{formErrors.jenisRequest}</p>}
                            </div>

                            {jenisRequest === "fuel" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Jenis Fuel</label>
                                    <select
                                        value={jenisMaterial}
                                        onChange={(e) => {
                                            setJenisMaterial(e.target.value);
                                            setFormErrors({ ...formErrors, jenisMaterial: "" });
                                        }}
                                        className={`w-full border bg-white text-black ${formErrors.jenisMaterial ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
                                    >
                                        <option value="">-- Pilih Jenis Fuel --</option>
                                        <option value="biogas">Bio Solar</option>
                                        <option value="lng">LNG (Liquefied Natural Gas)</option>
                                    </select>
                                    {formErrors.jenisMaterial && <p className="mt-1 text-sm text-red-600">{formErrors.jenisMaterial}</p>}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {jenisRequest === "passenger" ? "Jumlah Penumpang" : "Masukkan Volume"}
                                </label>
                                <input
                                    type="number"
                                    value={kuantitas}
                                    onChange={(e) => {
                                        setKuantitas(e.target.value);
                                        setFormErrors({ ...formErrors, kuantitas: "" });
                                    }}
                                    className={`w-full border bg-white text-black ${formErrors.kuantitas ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
                                    placeholder="Masukkan jumlah"
                                    min="1"
                                />
                                {formErrors.kuantitas && <p className="mt-1 text-sm text-red-600">{formErrors.kuantitas}</p>}
                            </div>

                            {jenisRequest === "fuel" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Satuan Ukur</label>
                                    <select
                                        value={satuan}
                                        onChange={(e) => {
                                            setSatuan(e.target.value);
                                            setFormErrors({ ...formErrors, satuan: "" });
                                        }}
                                        className={`w-full border bg-white text-black ${formErrors.satuan ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
                                    >
                                        <option value="">-- Pilih Satuan --</option>
                                        {getSatuanOptions().map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                    {formErrors.satuan && <p className="mt-1 text-sm text-red-600">{formErrors.satuan}</p>}
                                </div>
                            )}

                            {jenisRequest === "fresh_water" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Satuan Ukur</label>
                                    <select
                                        value={satuan}
                                        onChange={(e) => {
                                            setSatuan(e.target.value);
                                            setFormErrors({ ...formErrors, satuan: "" });
                                        }}
                                        className={`w-full border bg-white text-black ${formErrors.satuan ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
                                    >
                                        <option value="">-- Pilih Satuan --</option>
                                        {getSatuanOptions().map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                    {formErrors.satuan && <p className="mt-1 text-sm text-red-600">{formErrors.satuan}</p>}
                                </div>
                            )}

                            {jenisRequest === "passenger" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Satuan Ukur</label>
                                    <select
                                        value={satuan}
                                        onChange={(e) => {
                                            setSatuan(e.target.value);
                                            setFormErrors({ ...formErrors, satuan: "" });
                                        }}
                                        className={`w-full border bg-white text-black ${formErrors.satuan ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
                                    >
                                        <option value="">-- Pilih Satuan --</option>
                                        {getSatuanOptions().map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                    {formErrors.satuan && <p className="mt-1 text-sm text-red-600">{formErrors.satuan}</p>}
                                </div>
                            )}

                            {jenisRequest === "material" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Deskripsi Material
                                    </label>
                                    <textarea
                                        type="text"
                                        value={deskripsi}
                                        onChange={(e) => {
                                            setDeskripsi(e.target.value);
                                            setFormErrors({ ...formErrors, deskripsi: "" });
                                        }}
                                        className={`w-full h-40 border bg-white text-black ${formErrors.deskripsi ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
                                        placeholder="Deskripsi Material"
                                        min="1"
                                    />
                                    {formErrors.deskripsi && <p className="mt-1 text-sm text-red-600">{formErrors.deskripsi}</p>}
                                </div>
                            )}

                            {jenisRequest === "foodstuff" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Deskripsi Food Stuff
                                    </label>
                                    <textarea
                                        type="text"
                                        value={deskripsi}
                                        onChange={(e) => {
                                            setDeskripsi(e.target.value);
                                            setFormErrors({ ...formErrors, deskripsi: "" });
                                        }}
                                        className={`w-full h-40 border bg-white text-black ${formErrors.deskripsi ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
                                        placeholder="Deskripsi Material"
                                        min="1"
                                    />
                                    {formErrors.deskripsi && <p className="mt-1 text-sm text-red-600">{formErrors.deskripsi}</p>}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-200 rounded-md p-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Prioritas Request</label>
                                <div className="flex space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => setPriority("normal")}
                                        className={`flex-1 py-3 px-4 rounded-lg border ${priority === "normal" ? 'bg-blue-100 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700'} transition-colors`}
                                    >
                                        Normal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPriority("priority")}
                                        className={`flex-1 py-3 px-4 rounded-lg border ${priority === "priority" ? 'bg-red-100 border-red-500 text-red-700 font-medium' : 'bg-white border-gray-300 text-gray-700'} transition-colors`}
                                    >
                                        Priority
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Lokasi Tujuan</label>
                                <div className="flex space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setModeTujuan("current");
                                            if (currentCoords) setDestinationCoords(currentCoords);
                                            setSelectedPlatform(null);
                                            setSearchPlatform("");
                                        }}
                                        className={`flex-1 py-2 px-3 rounded-lg border ${modeTujuan === "current"
                                            ? "bg-blue-100 border-blue-500 text-blue-700"
                                            : "bg-white border-gray-300 text-gray-700"
                                            }`}
                                    >
                                        Lokasi Terkini
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setModeTujuan("platform");
                                            setSearchPlatform("");
                                        }}
                                        className={`flex-1 py-2 px-3 rounded-lg border ${modeTujuan === "platform"
                                            ? "bg-blue-100 border-blue-500 text-blue-700"
                                            : "bg-white border-gray-300 text-gray-700"
                                            }`}
                                    >
                                        Lokasi Lain
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Lokasi Tujuan</label>
                            <div className={`border ${formErrors.destinationCoords ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 bg-gray-50`}>
                                <p className="text-gray-900 font-medium">
                                    {formatCoords(destinationCoords)}
                                </p>
                                {selectedPlatform && (
                                    <p className="text-sm text-blue-600 mt-1">User: {selectedPlatform.platform_name || selectedPlatform.name}</p>
                                )}
                            </div>
                            {formErrors.destinationCoords && <p className="mt-1 text-sm text-red-600">{formErrors.destinationCoords}</p>}
                        </div>

                        {modeTujuan === "platform" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Cari User</label>
                                <input
                                    type="text"
                                    placeholder="Cari User..."
                                    value={searchPlatform}
                                    onChange={(e) => setSearchPlatform(e.target.value)}
                                    className="w-full border border-gray-300 bg-white text-black rounded-lg px-4 py-2 mb-3 shadow-sm focus:ring-2 focus:ring-blue-400"
                                />

                                {isLoadingPlatforms ? (
                                    <div className="text-center py-4">
                                        <p className="text-gray-500">Memuat data user...</p>
                                    </div>
                                ) : (
                                    <div className="max-h-40 overflow-y-auto border rounded-lg mb-4">
                                        {filteredPlatforms.length > 0 ? (
                                            filteredPlatforms.map((p, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => handlePlatformSelect(p)}
                                                    className={`w-full text-left px-3 py-2 hover:bg-blue-100 ${selectedPlatform?.platform_name === p.platform_name
                                                        ? "bg-blue-200 font-semibold"
                                                        : ""
                                                        }`}
                                                >
                                                    {p.platform_name || p.name}
                                                    {p.type === "ship" && " (Ship)"}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-gray-500">
                                                {searchPlatform ? "User tidak ditemukan" : "Tidak ada user tersedia"}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {modeTujuan === "platform" && selectedPlatform
                                    ? `Lokasi User: ${selectedPlatform.platform_name || selectedPlatform.name}`
                                    : "Lokasi Tujuan"}
                            </label>
                            <div className="h-[400px] w-full relative z-0 rounded-lg overflow-hidden border border-gray-300">
                                <Map
                                    center={currentCoords}
                                    onChangeCoords={(newCoords) => {
                                        if (modeTujuan !== "platform") {
                                            setDestinationCoords(newCoords);
                                            setFormErrors({ ...formErrors, destinationCoords: "" });
                                            setSelectedPlatform(null);
                                        }
                                    }}
                                    selectedPlatform={selectedPlatform}
                                    isPlatformMode={modeTujuan === "platform"}
                                />
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                                {modeTujuan === "platform" && selectedPlatform
                                    ? "Peta menampilkan lokasi user yang dipilih"
                                    : "Klik pada peta untuk memilih lokasi tujuan"}
                            </p>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={handleLanjutClick}
                                className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                            >
                                Lanjut
                            </button>
                            {showSummary && (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="px-6 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
                                >
                                    Submit
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showSuccess && (
                <div className="fixed bottom-4 right-4 z-50">
                    <SuccessAlert message="Request berhasil dikirim!" />
                </div>
            )}

            {showSummary && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Ringkasan Request</h2>
                            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                ID: {requestId}
                            </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg mb-4">
                            <p className="text-sm text-gray-600">Waktu Request</p>
                            <p className="font-medium text-gray-800">{tanggalDisplay}</p>
                        </div>

                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Jenis Request</p>
                                    <p className="font-medium text-gray-800 capitalize">
                                        {jenisRequest === "fuel" ? "Fuel" :
                                            jenisRequest === "fresh_water" ? "Fresh Water" :
                                                jenisRequest === "passenger" ? "Passenger" : jenisRequest}
                                    </p>
                                </div>

                                {jenisRequest === "fuel" && (
                                    <div>
                                        <p className="text-sm text-gray-600">Jenis Material</p>
                                        <p className="font-medium text-gray-800 capitalize">
                                            {jenisMaterial === "biogas" ? "Bio Solar" :
                                                jenisMaterial === "lng" ? "LNG" : jenisMaterial}
                                        </p>
                                    </div>
                                )}

                                {jenisRequest === "material" && (
                                    <div>
                                        <p className="text-sm text-gray-600">Deskripsi Material</p>
                                        <p className="font-medium text-gray-800 capitalize">
                                            {deskripsi}
                                        </p>
                                    </div>
                                )}

                                {jenisRequest === "foodstuff" && (
                                    <div>
                                        <p className="text-sm text-gray-600">Deskripsi Material</p>
                                        <p className="font-medium text-gray-800 capitalize">
                                            {deskripsi}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Kuantitas</p>
                                    <p className="font-medium text-gray-800">{kuantitas} {satuan}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-600">Prioritas</p>
                                    <p className={`font-medium ${priority === "priority" ? "text-red-600" : "text-gray-800"} capitalize`}>
                                        {priority === "priority" ? "Prioritas Tinggi" : "Normal"}
                                    </p>
                                </div>
                            </div>

                            {(jenisRequest === "passenger" || jenisRequest === "material" || jenisRequest === "foodstuff") && (
                                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                    <p className="text-sm text-yellow-700 font-medium">
                                        Status: <span className="text-green-600">Process to Fleet Team</span>
                                    </p>
                                    <p className="text-xs text-yellow-600 mt-1">
                                        Request ini akan secara otomatis diproses oleh tim fleet
                                    </p>
                                </div>
                            )}

                            <div className="border-t pt-3 mt-3">
                                <p className="text-sm text-gray-600 mb-2">Lokasi Tujuan</p>
                                {selectedPlatform ? (
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <p className="font-medium text-blue-800">{selectedPlatform.platform_name || selectedPlatform.name}</p>
                                        <p className="text-xs text-blue-600 mt-1">
                                            {formatCoords(destinationCoords)}
                                        </p>
                                    </div>
                                ) : destinationCoords ? (
                                    <div className="bg-green-50 p-3 rounded-lg">
                                        <p className="font-medium text-green-800">Lokasi Anda</p>
                                        <p className="text-xs text-green-600 mt-1">
                                            {formatCoords(destinationCoords)}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic">Belum ada tujuan</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-6 mt-4 border-t">
                            <button
                                type="button"
                                onClick={() => setShowSummary(false)}
                                className="px-5 py-2.5 rounded-lg bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition-colors"
                            >
                                Kembali Edit
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="px-5 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Konfirmasi & Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShipForm;