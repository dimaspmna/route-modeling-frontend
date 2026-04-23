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
    const [showSuccess, setShowSuccess] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [priority, setPriority] = useState("normal");
    const [formErrors, setFormErrors] = useState({});
    const [modeTujuan, setModeTujuan] = useState("current");
    const [platformList, setPlatformList] = useState([]);
    const [searchPlatform, setSearchPlatform] = useState("");
    const [selectedPlatform, setSelectedPlatform] = useState(null);
    const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [locationStatus, setLocationStatus] = useState("");
    const [alertMessage, setAlertMessage] = useState(""); // State untuk pesan alert

    // Inisialisasi form
    // Di bagian useEffect inisialisasi form, ganti ini:
    useEffect(() => {
        const initializeForm = async () => {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setName(parsedUser.name || "Nama Tidak Ditemukan");

                if (parsedUser.lat && parsedUser.lng) {
                    const savedCoords = {
                        lat: parseFloat(parsedUser.lat),
                        lng: parseFloat(parsedUser.lng)
                    };
                    setCurrentCoords(savedCoords);
                    setDestinationCoords(savedCoords);
                    setLocationStatus("Lokasi diambil dari penyimpanan lokal");
                } else {
                    await getCurrentLocation();
                }
            } else {
                setName("Guest User");
                await getCurrentLocation();
            }

            setRequestId(uuidv4().slice(0, 8).toUpperCase());
        };

        initializeForm();

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
                    // "/get-all/central-region",
                    // "/get-all/conductor",
                    // "/get-all/north-region",
                    // "/get-all/other-region",
                    // "/get-all/south-region",
                    // "/get-all/tanker-rig-barge",
                    // "/get-all/subsea-wellhead",
                    "/ship-positions-all",
                    "/allUsers",
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
            } catch (err) {
                console.error("Gagal ambil data platform dan ships", err);
            } finally {
                setIsLoadingPlatforms(false);
            }
        };

        fetchPlatformsAndShips();
    }, []);

    // Fungsi untuk mendapatkan lokasi terkini
    // GANTI fungsi getCurrentLocation dengan ini:
const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
        setIsGettingLocation(true);
        setLocationStatus("Mendapatkan lokasi...");
        
        // Force re-render dengan mengosongkan koordinat sementara
        setCurrentCoords(null);
        setDestinationCoords(null);

        if (!navigator.geolocation) {
            const error = "Geolocation tidak didukung oleh browser Anda";
            setLocationStatus(error);
            setIsGettingLocation(false);
            setAlertMessage(error);
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setAlertMessage("");
            }, 3000);
            reject(error);
            return;
        }

        let timeoutId;

        timeoutId = setTimeout(() => {
            setIsGettingLocation(false);
            setLocationStatus("GPS timeout, menggunakan lokasi terakhir...");

            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    if (parsedUser.lat && parsedUser.lng) {
                        const fallbackCoords = {
                            lat: parseFloat(parsedUser.lat),
                            lng: parseFloat(parsedUser.lng)
                        };
                        // Gunakan setTimeout untuk memastikan state update
                        setTimeout(() => {
                            setCurrentCoords(fallbackCoords);
                            setDestinationCoords(fallbackCoords);
                        }, 100);

                        setAlertMessage("Menggunakan lokasi terakhir dari GPS");
                        setShowSuccess(true);
                        setTimeout(() => {
                            setShowSuccess(false);
                            setAlertMessage("");
                        }, 3000);

                        resolve(fallbackCoords);
                        return;
                    }
                } catch (e) {
                    console.error("Error parsing stored user:", e);
                }
            }

            const defaultCoords = { lat: -6.2088, lng: 106.8456 };
            // Gunakan setTimeout untuk memastikan state update
            setTimeout(() => {
                setCurrentCoords(defaultCoords);
                setDestinationCoords(defaultCoords);
            }, 100);

            setAlertMessage("Menggunakan lokasi default (GPS tidak merespons)");
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setAlertMessage("");
            }, 3000);

            resolve(defaultCoords);
        }, 15000);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                clearTimeout(timeoutId);
                
                const newCoords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                console.log("GPS Location obtained:", newCoords); // Debug log

                // Update state secara synchronous
                setIsGettingLocation(false);
                
                // Update koordinat dengan nilai baru
                setCurrentCoords(newCoords);
                setDestinationCoords(newCoords);
                
                // Update mode tujuan otomatis ke current
                if (modeTujuan === "current") {
                    setModeTujuan("current");
                }

                const time = new Date().toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
                setLocationStatus(`Lokasi diperbarui: ${time}`);

                // Simpan ke localStorage
                const storedUser = localStorage.getItem("user");
                if (storedUser) {
                    try {
                        const parsedUser = JSON.parse(storedUser);
                        parsedUser.lat = newCoords.lat.toString();
                        parsedUser.lng = newCoords.lng.toString();
                        localStorage.setItem("user", JSON.stringify(parsedUser));
                    } catch (e) {
                        console.error("Error saving to localStorage:", e);
                    }
                }

                // Tampilkan alert dengan setTimeout untuk memastikan state sudah update
                setTimeout(() => {
                    setAlertMessage("Lokasi berhasil diperbarui!");
                    setShowSuccess(true);
                    setTimeout(() => {
                        setShowSuccess(false);
                        setAlertMessage("");
                    }, 3000);
                }, 100);

                resolve(newCoords);
            },
            (error) => {
                clearTimeout(timeoutId);
                console.error("Error getting location:", error);
                setIsGettingLocation(false);

                let errorMessage = "";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Izin lokasi ditolak. Izinkan akses lokasi di pengaturan browser.";
                        setLocationStatus("Izin lokasi ditolak");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Informasi lokasi tidak tersedia";
                        setLocationStatus("Lokasi tidak tersedia");
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Waktu tunggu habis. Menggunakan lokasi terakhir.";
                        setLocationStatus("GPS timeout");
                        break;
                    default:
                        errorMessage = "Gagal mendapatkan lokasi";
                        setLocationStatus("Error mendapatkan lokasi");
                        break;
                }

                // Tampilkan alert error
                setAlertMessage(errorMessage);
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    setAlertMessage("");
                }, 3000);

                // Fallback ke lokasi default atau tersimpan
                const fallbackCoords = fallbackToDefaultOrStored();
                resolve(fallbackCoords);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0 // Selalu ambil lokasi baru, jangan gunakan cache
            }
        );

        // Fungsi helper untuk fallback
        const fallbackToDefaultOrStored = () => {
            const storedUser = localStorage.getItem("user");
            let fallbackCoords;

            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    if (parsedUser.lat && parsedUser.lng) {
                        fallbackCoords = {
                            lat: parseFloat(parsedUser.lat),
                            lng: parseFloat(parsedUser.lng)
                        };
                        setAlertMessage("Menggunakan lokasi terakhir dari GPS");
                    }
                } catch (e) {
                    console.error("Error parsing stored user:", e);
                }
            }

            if (!fallbackCoords) {
                fallbackCoords = { lat: -6.2088, lng: 106.8456 };
                setAlertMessage("Menggunakan lokasi default");
            }

            // Gunakan setTimeout untuk memastikan state update
            setTimeout(() => {
                setCurrentCoords(fallbackCoords);
                setDestinationCoords(fallbackCoords);
            }, 100);

            // Update mode tujuan otomatis ke current
            if (modeTujuan === "current") {
                setModeTujuan("current");
            }

            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setAlertMessage("");
            }, 3000);

            return fallbackCoords;
        };
    });
};

    // Fungsi untuk mengambil lokasi dari database
    const getLocationFromDatabase = async () => {
        try {
            const storedUser = localStorage.getItem("user");
            if (!storedUser) {
                throw new Error("User tidak ditemukan");
            }

            const parsedUser = JSON.parse(storedUser);
            const email = parsedUser.email || parsedUser.name;

            // Contoh endpoint untuk mengambil lokasi dari database
            // Ganti dengan endpoint yang sesuai di API Anda
            const response = await API.get(`/get-user-location/${email}`);

            if (response.data && response.data.lat && response.data.lng) {
                const dbCoords = {
                    lat: parseFloat(response.data.lat),
                    lng: parseFloat(response.data.lng)
                };

                setCurrentCoords(dbCoords);
                setDestinationCoords(dbCoords);

                // Update localStorage
                parsedUser.lat = dbCoords.lat.toString();
                parsedUser.lng = dbCoords.lng.toString();
                localStorage.setItem("user", JSON.stringify(parsedUser));

                setLocationStatus("Lokasi diambil dari database");

                // Tampilkan alert sukses untuk lokasi
                setAlertMessage("Lokasi berhasil diambil dari database!");
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    setAlertMessage("");
                }, 3000);

                return dbCoords;
            } else {
                throw new Error("Lokasi tidak ditemukan di database");
            }
        } catch (error) {
            console.error("Gagal mengambil lokasi dari database:", error);
            alert("Gagal mengambil lokasi dari database. Menggunakan GPS...");
            // Fallback ke GPS
            return await getCurrentLocation();
        }
    };

    const filteredPlatforms = platformList.filter((p) =>
        p.platform_name.toLowerCase().includes(searchPlatform.toLowerCase()) ||
        p.name.toLowerCase().includes(searchPlatform.toLowerCase())
    );

    const validateForm = () => {
        const errors = {};

        if (!jenisRequest) errors.jenisRequest = "Jenis request harus dipilih";
        if (jenisRequest === "fuel" && !jenisMaterial) errors.jenisMaterial = "Jenis material harus dipilih";
        if (!kuantitas || kuantitas <= 0) errors.kuantitas = "Kuantitas harus diisi dengan benar";
        if (jenisRequest === "fuel" && !satuan) errors.satuan = "Satuan harus dipilih";
        if (jenisRequest === "fresh_water" && !satuan) errors.satuan = "Satuan harus dipilih";
        if (jenisRequest === "passenger" && !satuan) errors.satuan = "Satuan harus dipilih";
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

            let statusRequest = "waiting approval";
            if (jenisRequest === "passenger" || jenisRequest === "material" || jenisRequest === "foodstuff") {
                statusRequest = "process to fleet team";
            }

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
                location_timestamp: new Date().toISOString()
            };

            await API.post("/create-user-form-request", payload);

            // Tampilkan alert sukses untuk form submission
            setAlertMessage("Request berhasil dikirim!");
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setAlertMessage("");
            }, 3000);

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

    const formatCoords = (coords) => {
        if (!coords) return "Belum ada tujuan";
        return `${coords.lat?.toFixed(6) || '0'}, ${coords.lng?.toFixed(6) || '0'}`;
    };

    const getLocationStatusText = () => {
        if (isGettingLocation) return "Mendapatkan lokasi...";
        if (!currentCoords) return "Lokasi belum diambil";

        const time = new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });

        return `Lokasi terbaru: ${time}`;
    };

    return (
        <div className="bg-gray-50 md:p-6 text-gray-800 min-h-screen relative">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Route Modelling</h1>
                    <p className="text-sm font-medium text-gray-600 mt-1">Form Request</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-100 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Nama User</p>
                                    <p className="font-semibold text-gray-900 mt-1 truncate">{name}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={getCurrentLocation}
                                    disabled={isGettingLocation}
                                    className="ml-2 p-2 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Refresh Lokasi GPS"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className={`h-5 w-5 text-blue-600 ${isGettingLocation ? 'animate-spin' : ''}`}
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100 shadow-sm">
                            <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Tanggal Request</p>
                            <p className="font-semibold text-gray-900 mt-1">{tanggalDisplay}</p>
                        </div>

                        <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-4 border border-purple-100 shadow-sm">
                            <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">No. ID Request</p>
                            <p className="font-semibold text-gray-900 mt-1">{requestId}</p>
                            <p className="text-xs text-gray-500 mt-2">ID unik untuk tracking</p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-lg">Lokasi Anda</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {currentCoords
                                                ? `Koordinat: ${formatCoords(currentCoords)}`
                                                : "Lokasi belum terdeteksi"}
                                        </p>
                                    </div>
                                </div>

                                {currentCoords && (
                                    <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <span className="text-xs text-gray-500 font-medium">LATITUDE</span>
                                                <p className="font-mono font-bold text-gray-800 text-sm">
                                                    {currentCoords.lat?.toFixed(6)}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500 font-medium">LONGITUDE</span>
                                                <p className="font-mono font-bold text-gray-800 text-sm">
                                                    {currentCoords.lng?.toFixed(6)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex my-4 flex-col gap-3">
                                    <button
                                        type="button"
                                        onClick={getCurrentLocation}
                                        disabled={isGettingLocation}
                                        className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${isGettingLocation
                                            ? 'bg-blue-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                                            } text-white shadow-md hover:shadow-lg`}
                                    >
                                        {isGettingLocation ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Memproses...</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                </svg>
                                                <span>Ambil Lokasi GPS</span>
                                            </>
                                        )}
                                    </button>

                                    {/* <button
                                    type="button"
                                    onClick={getLocationFromDatabase}
                                    disabled={isGettingLocation}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                    </svg>
                                    <span>Ambil dari Database</span>
                                </button> */}
                                </div>
                            </div>

                        </div>

                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex items-start">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm text-blue-700">
                                    <span className="font-medium">Tips:</span> Pastikan lokasi Anda akurat sebelum mengirim request.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Pilih Jenis Request <span className="text-red-500">*</span>
                                </label>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Pilih Jenis Fuel <span className="text-red-500">*</span>
                                    </label>
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
                                    {jenisRequest === "passenger" ? "Jumlah Penumpang" : "Masukkan Volume"} <span className="text-red-500">*</span>
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

                            {(jenisRequest === "fuel" || jenisRequest === "fresh_water" || jenisRequest === "passenger") && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Satuan Ukur <span className="text-red-500">*</span>
                                    </label>
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
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Deskripsi Material <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={deskripsi}
                                        onChange={(e) => {
                                            setDeskripsi(e.target.value);
                                            setFormErrors({ ...formErrors, deskripsi: "" });
                                        }}
                                        className={`w-full border bg-white text-black ${formErrors.deskripsi ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
                                        placeholder="Deskripsi material yang dibutuhkan"
                                        rows="4"
                                    />
                                    {formErrors.deskripsi && <p className="mt-1 text-sm text-red-600">{formErrors.deskripsi}</p>}
                                </div>
                            )}

                            {jenisRequest === "foodstuff" && (
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Deskripsi Food Stuff <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={deskripsi}
                                        onChange={(e) => {
                                            setDeskripsi(e.target.value);
                                            setFormErrors({ ...formErrors, deskripsi: "" });
                                        }}
                                        className={`w-full border bg-white text-black ${formErrors.deskripsi ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
                                        placeholder="Deskripsi food stuff yang dibutuhkan"
                                        rows="4"
                                    />
                                    {formErrors.deskripsi && <p className="mt-1 text-sm text-red-600">{formErrors.deskripsi}</p>}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Prioritas Request
                                </label>
                                <div className="flex space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => setPriority("normal")}
                                        className={`flex-1 py-3 px-4 rounded-lg border-2 ${priority === "normal" ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'} transition-all`}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                            </svg>
                                            <span>Normal</span>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPriority("priority")}
                                        className={`flex-1 py-3 px-4 rounded-lg border-2 ${priority === "priority" ? 'bg-red-50 border-red-500 text-red-700 font-semibold' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'} transition-all`}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                                            </svg>
                                            <span>Priority</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Pilih Lokasi Tujuan <span className="text-red-500">*</span>
                                </label>
                                <div className="flex space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setModeTujuan("current");
                                            if (currentCoords) setDestinationCoords(currentCoords);
                                            setSelectedPlatform(null);
                                            setSearchPlatform("");
                                        }}
                                        className={`flex-1 py-2.5 px-3 rounded-lg border-2 ${modeTujuan === "current"
                                            ? "bg-blue-50 border-blue-500 text-blue-700 font-medium"
                                            : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                                            } transition-all`}
                                    >
                                        Lokasi Terkini
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setModeTujuan("platform");
                                            setSearchPlatform("");
                                        }}
                                        className={`flex-1 py-2.5 px-3 rounded-lg border-2 ${modeTujuan === "platform"
                                            ? "bg-blue-50 border-blue-500 text-blue-700 font-medium"
                                            : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                                            } transition-all`}
                                    >
                                        Lokasi Lain
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    {modeTujuan === "current"
                                        ? "Menggunakan lokasi Anda saat ini"
                                        : "Pilih lokasi tujuan lain"}
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Lokasi Tujuan (Pastikan titik sesuai)<span className="text-red-500">*</span>
                            </label>
                            <div className={`border-2 ${formErrors.destinationCoords ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50'} rounded-lg p-4`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-900 font-semibold text-lg">
                                            {formatCoords(destinationCoords)}
                                        </p>
                                        {selectedPlatform ? (
                                            <p className="text-sm text-blue-600 mt-1 flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                </svg>
                                                User: {selectedPlatform.platform_name || selectedPlatform.name}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-gray-500 mt-1">
                                                {modeTujuan === "current" ? "Lokasi Anda saat ini" : "Klik pada peta untuk memilih lokasi"}
                                            </p>
                                        )}
                                    </div>
                                    {destinationCoords && (
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {formErrors.destinationCoords && <p className="mt-1 text-sm text-red-600">{formErrors.destinationCoords}</p>}
                        </div>

                        {modeTujuan === "platform" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cari User
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Cari platform atau ship..."
                                        value={searchPlatform}
                                        onChange={(e) => setSearchPlatform(e.target.value)}
                                        className="w-full border border-gray-300 bg-white text-black rounded-lg px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent pr-10"
                                    />
                                    <div className="absolute right-3 top-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>

                                {isLoadingPlatforms ? (
                                    <div className="text-center py-6">
                                        <div className="inline-flex items-center">
                                            <svg className="animate-spin h-5 w-5 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <p className="text-gray-600">Memuat data...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="max-h-60 overflow-y-auto border rounded-lg mt-3 shadow-inner">
                                        {filteredPlatforms.length > 0 ? (
                                            filteredPlatforms.map((p, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => handlePlatformSelect(p)}
                                                    className={`w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors ${selectedPlatform?.platform_name === p.platform_name
                                                        ? "bg-blue-100 border-l-4 border-l-blue-500"
                                                        : ""
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium text-gray-800">
                                                                {p.platform_name || p.name}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`text-xs px-2 py-1 rounded-full ${p.type === "ship" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}>
                                                                    {p.type === "ship" ? "Ship" : "Platform"}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    {formatCoords(p)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {selectedPlatform?.platform_name === p.platform_name && (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-6 text-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p className="text-gray-500 mt-2">
                                                    {searchPlatform ? "Data tidak ditemukan" : "Tidak ada data tersedia"}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    {modeTujuan === "platform" && selectedPlatform
                                        ? `Peta Lokasi: ${selectedPlatform.platform_name || selectedPlatform.name}`
                                        : "Pilih Lokasi di Peta"}
                                </label>
                                {currentCoords && (
                                    <span className="text-xs text-gray-500">
                                        Lokasi Anda: {currentCoords.lat?.toFixed(4)}, {currentCoords.lng?.toFixed(4)}
                                    </span>
                                )}
                            </div>
                            <div className="h-[400px] w-full relative z-0 rounded-xl overflow-hidden border-2 border-gray-300 shadow-sm">
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
                                    ? "Peta menampilkan lokasi yang dipilih"
                                    : "Klik pada peta untuk memilih lokasi tujuan"}
                            </p>
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                            <button
                                type="button"
                                onClick={handleLanjutClick}
                                className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                            >
                                Lanjutkan
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Alert */}
            {showSuccess && (
                <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
                    <SuccessAlert message={alertMessage} />
                </div>
            )}

            {/* Modal Summary */}
            {showSummary && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Ringkasan Request</h2>
                                <p className="text-sm text-gray-600 mt-1">Review data sebelum submit</p>
                            </div>
                            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-4 py-2 rounded-full text-sm font-bold">
                                ID: {requestId}
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-blue-700">Waktu Request</p>
                                    <p className="font-bold text-gray-800 text-lg">{tanggalDisplay}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm font-medium text-gray-500 mb-2">Jenis Request</p>
                                <p className="font-bold text-gray-800 text-lg capitalize">
                                    {jenisRequest === "fuel" ? "Fuel" :
                                        jenisRequest === "fresh_water" ? "Fresh Water" :
                                            jenisRequest === "passenger" ? "Passenger" :
                                                jenisRequest === "material" ? "Material" :
                                                    jenisRequest === "foodstuff" ? "Food Stuff" : jenisRequest}
                                </p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm font-medium text-gray-500 mb-2">Kuantitas</p>
                                <p className="font-bold text-gray-800 text-lg">{kuantitas} {satuan}</p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm font-medium text-gray-500 mb-2">Prioritas</p>
                                <p className={`font-bold text-lg ${priority === "priority" ? "text-red-600" : "text-blue-600"}`}>
                                    {priority === "priority" ? "Prioritas Tinggi" : "Normal"}
                                </p>
                            </div>

                            {jenisRequest === "fuel" && jenisMaterial && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm font-medium text-gray-500 mb-2">Jenis Fuel</p>
                                    <p className="font-bold text-gray-800 text-lg capitalize">
                                        {jenisMaterial === "biogas" ? "Bio Solar" :
                                            jenisMaterial === "lng" ? "LNG" : jenisMaterial}
                                    </p>
                                </div>
                            )}

                            {(jenisRequest === "material" || jenisRequest === "foodstuff") && deskripsi && (
                                <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm font-medium text-gray-500 mb-2">Deskripsi</p>
                                    <p className="font-medium text-gray-800">{deskripsi}</p>
                                </div>
                            )}
                        </div>

                        {(jenisRequest === "passenger" || jenisRequest === "material" || jenisRequest === "foodstuff") && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mb-6">
                                <div className="flex items-start">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600 mr-3 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="font-bold text-yellow-800">Status Otomatis: Process to Fleet Team</p>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            Request ini akan secara otomatis diproses oleh tim fleet.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-white rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-lg">Lokasi Tujuan</p>
                                    <p className="text-sm text-gray-600">
                                        {selectedPlatform ? "Lokasi User" : "Lokasi Anda"}
                                    </p>
                                </div>
                            </div>

                            {selectedPlatform ? (
                                <div className="bg-white p-4 rounded-lg border border-blue-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-blue-800 text-lg">
                                                {selectedPlatform.platform_name || selectedPlatform.name}
                                            </p>
                                            <p className="text-sm text-gray-600 mt-2">
                                                {formatCoords(destinationCoords)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : destinationCoords ? (
                                <div className="bg-white p-4 rounded-lg border border-green-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-green-800 text-lg">Lokasi Anda</p>
                                            <p className="text-sm text-gray-600 mt-2">
                                                {formatCoords(destinationCoords)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-100 p-4 rounded-lg text-center">
                                    <p className="text-gray-500 italic">Belum ada lokasi tujuan</p>
                                </div>
                            )}
                        </div>

                        <div className="border-t pt-6 mt-4">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="text-sm text-gray-500">
                                    <p>Pastikan semua data sudah benar sebelum submit.</p>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowSummary(false)}
                                        className="px-6 py-3 rounded-lg bg-gray-200 text-gray-800 font-bold hover:bg-gray-300 transition-colors"
                                    >
                                        Kembali Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
                                    >
                                        Konfirmasi & Submit
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShipForm;