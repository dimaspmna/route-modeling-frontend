import React, { useState, useEffect } from 'react';
import API from '../../../api/Api';
import {
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    UserGroupIcon,
    KeyIcon,
    DocumentTextIcon,
    PlusIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

// Komponen Success Alert
const SuccessAlert = ({ message, onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [onClose, duration]);

    return (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-lg max-w-sm">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                    <div className="ml-3">
                        <p className="text-green-800 font-medium text-sm">{message}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-auto text-green-400 hover:text-green-600 transition-colors duration-200"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Komponen Error Alert
const ErrorAlert = ({ message, onClose, duration = 5000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [onClose, duration]);

    return (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg max-w-sm">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    </div>
                    <div className="ml-3">
                        <p className="text-red-800 font-medium text-sm">{message}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-auto text-red-400 hover:text-red-600 transition-colors duration-200"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Komponen AddCaptainFromPositionModal
const AddCaptainFromPositionModal = ({ isOpen, onClose, onSuccess }) => {
    const [shipPositions, setShipPositions] = useState([]);
    const [filteredShips, setFilteredShips] = useState([]);
    const [selectedShip, setSelectedShip] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [shipsLoading, setShipsLoading] = useState(true);
    const [formData, setFormData] = useState({
        email: '', // ID/Email diisi manual oleh admin
        password: '',
        confirmPassword: '',
        role: 'captain',
        type: 'ipb',
        region: '',
        status: 'active',
        max_load_fuel: '',
        max_load_fw: '',
        max_passenger: ''
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            fetchShipPositions();
            resetForm();
        }
    }, [isOpen]);

    const fetchShipPositions = async () => {
        try {
            setShipsLoading(true);
            // PERBAIKAN: Gunakan endpoint yang lengkap
            const response = await API.get('/getShipPositionsSP');
            console.log('🔍 Ship Positions API Response:', response.data); // Debug log

            const shipData = response.data.data || response.data || [];
            console.log('📦 Processed Ship Data:', shipData); // Debug log

            // Cek struktur data dan cari field yang berisi ID
            if (shipData.length > 0) {
                console.log('🚢 First ship item:', shipData[0]);
                console.log('🔑 Available keys:', Object.keys(shipData[0]));
            }

            setShipPositions(shipData);
            setFilteredShips(shipData);
        } catch (error) {
            console.error('❌ Error fetching ship positions:', error);
            setErrors({ submit: 'Gagal memuat data ship positions' });
        } finally {
            setShipsLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedShip(null);
        setSearchTerm('');
        setFormData({
            email: '',
            password: '',
            confirmPassword: '',
            role: 'captain',
            type: 'ipb',
            region: '',
            status: 'active',
            max_load_fuel: '',
            max_load_fw: '',
            max_passenger: ''
        });
        setErrors({});
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
        if (term === '') {
            setFilteredShips(shipPositions);
        } else {
            const filtered = shipPositions.filter(ship =>
                ship.name?.toLowerCase().includes(term.toLowerCase()) ||
                ship.port?.toLowerCase().includes(term.toLowerCase()) ||
                ship.mmsi?.toString().includes(term) ||
                ship.region?.toLowerCase().includes(term.toLowerCase())
            );
            setFilteredShips(filtered);
        }
    };

    const handleSelectShip = (ship) => {
        console.log('🎯 Selected Ship:', ship); // Debug log
        setSelectedShip(ship);
        // Auto-fill form data berdasarkan ship position
        setFormData(prev => ({
            ...prev,
            type: ship.type === 'ipb' || ship.type === 'supply' ? ship.type : 'ipb',
            region: ship.region || ''
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Helper function untuk mendapatkan ID ship
    const getShipId = (ship) => {
        // Coba berbagai kemungkinan field ID
        return ship.ship_position_id || ship.id || ship.ship_id || 'N/A';
    };

    const validateForm = () => {
        const newErrors = {};

        if (!selectedShip) {
            newErrors.ship = 'Pilih kapal dari daftar';
        } else {
            // PERBAIKAN: Cek apakah ship_position_id ada
            const shipId = getShipId(selectedShip);
            if (!shipId || shipId === 'N/A') {
                newErrors.ship = 'Data kapal tidak valid (missing ID)';
                console.error('❌ Selected ship missing ID:', selectedShip);
            }
        }

        if (!formData.email.trim()) newErrors.email = 'ID/Email harus diisi';
        if (!formData.password) newErrors.password = 'Password harus diisi';
        if (!formData.confirmPassword) newErrors.confirmPassword = 'Konfirmasi password harus diisi';
        if (!formData.role) newErrors.role = 'Role harus dipilih';
        if (!formData.type) newErrors.type = 'Type harus dipilih';

        if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Password minimal 6 karakter';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Password tidak cocok';
        }

        // Validasi type sesuai backend
        const validTypes = ["ipb", "supply"];
        if (formData.type && !validTypes.includes(formData.type)) {
            newErrors.type = 'Type harus ipb atau supply';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        try {
            const shipPositionId = getShipId(selectedShip);

            if (!shipPositionId || shipPositionId === 'N/A') {
                throw new Error('Ship position ID tidak ditemukan');
            }

            // Kirim ID ke dalam body
            const payload = {
                ship_position_id: shipPositionId,
                email: formData.email,
                role: formData.role,
                password: formData.password,
                type: formData.type,
                region: formData.region,
                status: formData.status,
                max_load_fuel: formData.max_load_fuel || null,
                max_load_fw: formData.max_load_fw || null,
                max_passenger: formData.max_passenger || null
            };

            console.log("📤 Submitting payload:", payload);

            // Tetap gunakan endpoint tanpa parameter
            const response = await API.post('/createCaptainShipFromPosition', payload);

            console.log("✅ Create captain response:", response.data);

            onSuccess(response.data.message || "Captain berhasil dibuat dari data ship position");
            onClose();
            resetForm();
        } catch (error) {
            console.error("❌ Error creating captain from position:", error);
            const errorMessage =
                error.response?.data?.message ||
                error.response?.data?.msg ||
                error.message ||
                "Gagal membuat captain";
            setErrors({ submit: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Tambah Captain dari Ship Position</h2>
                            <p className="text-gray-600 mt-1">Pilih kapal dari daftar ship position yang tersedia</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex h-[calc(90vh-200px)]">
                    {/* Left Panel - Daftar Ship Positions */}
                    <div className="w-1/2 border-r border-gray-200">
                        <div className="p-4">
                            <div className="relative mb-4">
                                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari kapal berdasarkan nama, port, MMSI..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="h-96 overflow-y-auto">
                                {shipsLoading ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                                        <p className="text-gray-600 mt-2">Memuat data kapal...</p>
                                    </div>
                                ) : filteredShips.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        {searchTerm ? 'Tidak ada kapal yang sesuai' : 'Tidak ada data ship position'}
                                    </div>
                                ) : (
                                    filteredShips.map((ship) => (
                                        <div
                                            key={getShipId(ship)}
                                            onClick={() => handleSelectShip(ship)}
                                            className={`p-4 border rounded-lg mb-2 cursor-pointer transition-all duration-200 ${selectedShip && getShipId(selectedShip) === getShipId(ship)
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900">{ship.name}</h3>
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        <p>Port: {ship.port || 'N/A'}</p>
                                                        <p>MMSI: {ship.mmsi || 'N/A'}</p>
                                                        <p>Type: {ship.type || 'N/A'}</p>
                                                        <p>Region: {ship.region || 'N/A'}</p>
                                                        <p className="text-xs text-gray-400">ID: {getShipId(ship)}</p>
                                                    </div>
                                                </div>
                                                {selectedShip && getShipId(selectedShip) === getShipId(ship) && (
                                                    <CheckCircleIcon className="h-6 w-6 text-blue-500 flex-shrink-0" />
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Form Captain */}
                    <div className="w-1/2">
                        <form onSubmit={handleSubmit} className="h-full flex flex-col">
                            <div className="p-4 flex-1 overflow-y-auto">
                                {selectedShip ? (
                                    <>
                                        {/* Info Kapal Terpilih */}
                                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <h3 className="font-semibold text-blue-900 mb-2">Kapal Terpilih</h3>
                                            <div className="text-sm text-blue-800">
                                                <p><strong>Nama:</strong> {selectedShip.name}</p>
                                                <p><strong>Port:</strong> {selectedShip.port || 'N/A'}</p>
                                                <p><strong>MMSI:</strong> {selectedShip.mmsi || 'N/A'}</p>
                                                <p><strong>Type:</strong> {selectedShip.type || 'N/A'}</p>
                                                <p><strong>Region:</strong> {selectedShip.region || 'N/A'}</p>
                                                <p><strong>Ship ID:</strong> {getShipId(selectedShip)}</p>
                                            </div>
                                        </div>

                                        {/* Form Input */}
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    ID *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className="w-full px-3 py-2 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Masukkan ID"
                                                />
                                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Password *
                                                    </label>
                                                    <input
                                                        type="password"
                                                        name="password"
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="Minimal 6 karakter"
                                                    />
                                                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Konfirmasi Password *
                                                    </label>
                                                    <input
                                                        type="password"
                                                        name="confirmPassword"
                                                        value={formData.confirmPassword}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="Ulangi password"
                                                    />
                                                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Role *
                                                    </label>
                                                    <select
                                                        name="role"
                                                        value={formData.role}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    >
                                                        <option value="captain">Captain</option>
                                                        <option value="admin">Admin</option>
                                                        <option value="fuel">Fuel</option>
                                                        <option value="fw">Fresh Water</option>
                                                        <option value="fleet">Fleet</option>
                                                        <option value="spv">Supervisor</option>
                                                        <option value="user">User</option>
                                                    </select>
                                                    {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Type *
                                                    </label>
                                                    <select
                                                        name="type"
                                                        value={formData.type}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    >
                                                        <option value="ipb">IPB</option>
                                                        <option value="supply">Supply</option>
                                                    </select>
                                                    {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Region
                                                    </label>
                                                    <select
                                                        name="region"
                                                        value={formData.region}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    >
                                                        <option value="">Pilih Region</option>
                                                        <option value="north">North</option>
                                                        <option value="south">South</option>
                                                        <option value="central">Central</option>
                                                        <option value="fleet">Fleet</option>
                                                        <option value="specific operation">Specific Operation</option>
                                                        <option value="dedicated">Dedicated</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Status
                                                    </label>
                                                    <select
                                                        name="status"
                                                        value={formData.status}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    >
                                                        <option value="active">Active</option>
                                                        <option value="repair">Repair</option>
                                                        <option value="docking">Docking</option>
                                                        <option value="off">Off</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Optional Fields */}
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Max Fuel
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="max_load_fuel"
                                                        value={formData.max_load_fuel}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="Optional"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Max FW
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="max_load_fw"
                                                        value={formData.max_load_fw}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="Optional"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Max Passenger
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="max_passenger"
                                                        value={formData.max_passenger}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="Optional"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                        <p>Pilih kapal dari daftar di sebelah kiri untuk mulai membuat captain</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-gray-200 bg-gray-50">
                                {errors.submit && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-red-800 text-sm">{errors.submit}</p>
                                    </div>
                                )}
                                {errors.ship && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-red-800 text-sm">{errors.ship}</p>
                                    </div>
                                )}
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onClose();
                                            resetForm();
                                        }}
                                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!selectedShip || loading}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Membuat...
                                            </>
                                        ) : (
                                            <>
                                                <PlusIcon className="h-4 w-4 mr-2" />
                                                Buat Captain
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CaptainData = () => {
    const [captains, setCaptains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCaptain, setSelectedCaptain] = useState(null);
    const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });

    // Form states
    const [passwordForm, setPasswordForm] = useState({
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        fetchCaptains();
    }, []);

    const fetchCaptains = async () => {
        try {
            setLoading(true);
            const response = await API.get('/captains');
            setCaptains(response.data.data || response.data);
        } catch (error) {
            console.error('Error fetching captains:', error);
            showAlert('Gagal memuat data captain', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (message, type = 'success') => {
        setAlert({ show: true, message, type });
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();

        // Validasi password
        if (passwordForm.password !== passwordForm.confirmPassword) {
            showAlert('Password dan konfirmasi password tidak cocok', 'error');
            return;
        }

        if (passwordForm.password.length < 6) {
            showAlert('Password minimal 6 karakter', 'error');
            return;
        }

        try {
            await API.patch(`/updateCaptainShipPassword/${selectedCaptain.id_captain_ship}`, {
                password: passwordForm.password
            });

            showAlert('Password captain berhasil diubah');
            setShowPasswordModal(false);
            resetPasswordForm();
        } catch (error) {
            console.error('Error updating captain password:', error);
            const errorMessage = error.response?.data?.msg ||
                error.response?.data?.message ||
                'Gagal mengubah password captain';
            showAlert(errorMessage, 'error');
        }
    };

    const handleDelete = async (captain) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus captain ${captain.name}?`)) {
            try {
                await API.delete(`/deleteCaptainShip/${captain.id_captain_ship}`);
                showAlert('Captain berhasil dihapus');
                fetchCaptains();
            } catch (error) {
                console.error('Error deleting captain:', error);
                const errorMessage = error.response?.data?.message ||
                    error.response?.data?.msg ||
                    'Gagal menghapus captain';
                showAlert(errorMessage, 'error');
            }
        }
    };

    const handleView = (captain) => {
        setSelectedCaptain(captain);
        setShowDetailModal(true);
    };

    const handleChangePasswordClick = (captain) => {
        setSelectedCaptain(captain);
        setPasswordForm({
            password: '',
            confirmPassword: ''
        });
        setShowPasswordModal(true);
    };

    const handleAddSuccess = (message) => {
        showAlert(message);
        fetchCaptains(); // Refresh data
    };

    const resetPasswordForm = () => {
        setPasswordForm({
            password: '',
            confirmPassword: ''
        });
    };

    const filteredCaptains = captains.filter(captain =>
        captain.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        captain.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        captain.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        captain.type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadgeColor = (status) => {
        const colors = {
            active: 'bg-green-100 text-green-800',
            repair: 'bg-yellow-100 text-yellow-800',
            docking: 'bg-blue-100 text-blue-800',
            off: 'bg-red-100 text-red-800',
            inactive: 'bg-gray-100 text-gray-800'
        };
        return colors[status] || colors.active;
    };

    const getRoleBadgeColor = (role) => {
        const colors = {
            admin: 'bg-red-100 text-red-800',
            captain: 'bg-blue-100 text-blue-800',
            fuel: 'bg-orange-100 text-orange-800',
            fw: 'bg-cyan-100 text-cyan-800',
            passenger: 'bg-green-100 text-green-800',
            fleet: 'bg-indigo-100 text-indigo-800',
            spv: 'bg-pink-100 text-pink-800',
            user: 'bg-gray-100 text-gray-800'
        };
        return colors[role] || colors.user;
    };

    const getTypeBadgeColor = (type) => {
        const colors = {
            ship: 'bg-blue-100 text-blue-800',
            platform: 'bg-purple-100 text-purple-800',
            buoy: 'bg-yellow-100 text-yellow-800',
            subsea_wellhead: 'bg-red-100 text-red-800',
            conductor: 'bg-green-100 text-green-800',
            tanker: 'bg-orange-100 text-orange-800',
            rig: 'bg-indigo-100 text-indigo-800',
            barge: 'bg-pink-100 text-pink-800',
            island: 'bg-teal-100 text-teal-800',
            ipb: 'bg-purple-100 text-purple-800',
            supply: 'bg-orange-100 text-orange-800'
        };
        return colors[type] || colors.ship;
    };

    const formatCoordinate = (coord) => {
        return coord ? parseFloat(coord).toFixed(6) : 'N/A';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat data captain...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Alerts */}
            {alert.show && alert.type === 'success' && (
                <SuccessAlert
                    message={alert.message}
                    onClose={() => setAlert({ show: false, message: '', type: 'success' })}
                />
            )}
            {alert.show && alert.type === 'error' && (
                <ErrorAlert
                    message={alert.message}
                    onClose={() => setAlert({ show: false, message: '', type: 'success' })}
                />
            )}

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                            <UserGroupIcon className="h-8 w-8 text-blue-500 mr-3" />
                            Manajemen Captain & Kapal
                        </h1>
                        <p className="text-gray-600 mt-2">Kelola data captain dan informasi kapal</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Tambah Captain
                    </button>
                </div>
            </div>

            {/* Search and Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                <div className="lg:col-span-3">
                    <div className="relative">
                        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari captain berdasarkan nama, ID/Email, region, atau type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
                <div className="bg-blue-100 rounded-lg shadow p-4 border border-blue-200">
                    <p className="text-sm text-gray-600">Total Captain</p>
                    <p className="text-2xl font-bold text-gray-900">{captains.length}</p>
                </div>
            </div>

            {/* Captains Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Captain
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ID/Email & Role
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Informasi Kapal
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCaptains.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        {searchTerm ? 'Tidak ada captain yang sesuai dengan pencarian' : 'Belum ada data captain'}
                                    </td>
                                </tr>
                            ) : (
                                filteredCaptains.map((captain) => (
                                    <tr key={captain.id_captain_ship} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                                                    <span className="text-white font-semibold text-sm">
                                                        {captain.name?.charAt(0).toUpperCase() || 'C'}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {captain.name || 'N/A'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        ID: {captain.id_captain_ship}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{captain.email || 'N/A'}</div>
                                            <div className="mt-1">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(captain.role)}`}>
                                                    {captain.role || 'user'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(captain.type)}`}>
                                                    {captain.type || 'ship'}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-500 mt-1">
                                                {captain.region || 'N/A'}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                Lat: {formatCoordinate(captain.latitude_decimal)}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                Long: {formatCoordinate(captain.longitude_decimal)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(captain.status)}`}>
                                                {captain.status || 'active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-3">
                                                <button
                                                    onClick={() => handleView(captain)}
                                                    className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                                                    title="Lihat Detail"
                                                >
                                                    <EyeIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleChangePasswordClick(captain)}
                                                    className="text-yellow-600 hover:text-yellow-900 transition-colors duration-200"
                                                    title="Reset Password"
                                                >
                                                    <KeyIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(captain)}
                                                    className="text-red-600 hover:text-red-900 transition-colors duration-200"
                                                    title="Hapus Captain"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Captain Detail Modal */}
            {showDetailModal && selectedCaptain && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Detail Captain</h2>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0 h-16 w-16 bg-blue-500 rounded-full flex items-center justify-center">
                                        <span className="text-white font-semibold text-xl">
                                            {selectedCaptain.name?.charAt(0).toUpperCase() || 'C'}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{selectedCaptain.name || 'N/A'}</h3>
                                        <p className="text-gray-500">ID: {selectedCaptain.id_captain_ship}</p>
                                    </div>
                                </div>
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">ID/Email</p>
                                            <p className="text-sm font-medium text-gray-900">{selectedCaptain.email || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Role</p>
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(selectedCaptain.role)}`}>
                                                {selectedCaptain.role || 'user'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Type</p>
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(selectedCaptain.type)}`}>
                                                {selectedCaptain.type || 'ship'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Region</p>
                                            <p className="text-sm font-medium text-gray-900">{selectedCaptain.region || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Status</p>
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedCaptain.status)}`}>
                                                {selectedCaptain.status || 'active'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Koordinat</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {formatCoordinate(selectedCaptain.latitude_decimal)}, {formatCoordinate(selectedCaptain.longitude_decimal)}
                                            </p>
                                        </div>
                                        {selectedCaptain.max_load_fuel && (
                                            <div>
                                                <p className="text-sm text-gray-500">Max Fuel</p>
                                                <p className="text-sm font-medium text-gray-900">{selectedCaptain.max_load_fuel}</p>
                                            </div>
                                        )}
                                        {selectedCaptain.max_load_fw && (
                                            <div>
                                                <p className="text-sm text-gray-500">Max Fresh Water</p>
                                                <p className="text-sm font-medium text-gray-900">{selectedCaptain.max_load_fw}</p>
                                            </div>
                                        )}
                                        {selectedCaptain.max_passenger && (
                                            <div>
                                                <p className="text-sm text-gray-500">Max Passenger</p>
                                                <p className="text-sm font-medium text-gray-900">{selectedCaptain.max_passenger}</p>
                                            </div>
                                        )}
                                        <div className="col-span-2">
                                            <p className="text-sm text-gray-500">Koordinat String</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                Lat: {selectedCaptain.latitude || 'N/A'}, Long: {selectedCaptain.longitude || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-sm text-gray-500">Dibuat</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {selectedCaptain.createdAt ? new Date(selectedCaptain.createdAt).toLocaleString('id-ID') : 'N/A'}
                                            </p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-sm text-gray-500">Diupdate</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {selectedCaptain.updatedAt ? new Date(selectedCaptain.updatedAt).toLocaleString('id-ID') : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end mt-6">
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Password Modal */}
            {showPasswordModal && selectedCaptain && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Reset Password Captain</h2>
                            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                    <strong>Reset password untuk:</strong> {selectedCaptain.name}
                                </p>
                                <p className="text-xs text-yellow-600 mt-1">
                                    ID: {selectedCaptain.id_captain_ship}
                                </p>
                            </div>
                            <form onSubmit={handleUpdatePassword}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Password Baru
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            value={passwordForm.password}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                                            className="w-full px-4 py-3 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Masukkan password baru"
                                            minLength="6"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Konfirmasi Password Baru
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            value={passwordForm.confirmPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                            className="w-full px-4 py-3 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Konfirmasi password baru"
                                            minLength="6"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPasswordModal(false);
                                            resetPasswordForm();
                                        }}
                                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200"
                                    >
                                        Reset Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Tambah Captain */}
            <AddCaptainFromPositionModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={handleAddSuccess}
            />
        </div>
    );
};

export default CaptainData;