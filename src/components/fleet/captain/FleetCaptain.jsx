import React, { useState, useEffect } from 'react';
import API from '../../../api/Api';
import {
    PencilIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    UserGroupIcon,
    MapPinIcon,
    CheckIcon,
    XMarkIcon
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

const FleetCaptain = () => {
    const [captains, setCaptains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCaptain, setSelectedCaptain] = useState(null);
    const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
    const [editingRegion, setEditingRegion] = useState(null);
    const [tempRegion, setTempRegion] = useState('');
    const [editingStatus, setEditingStatus] = useState(null);
    const [tempStatus, setTempStatus] = useState('');

    // Region options sesuai enum di database
    const regionOptions = [
        { value: 'north', label: 'North' },
        { value: 'south', label: 'South' },
        { value: 'central', label: 'Central' },
        { value: 'fleet', label: 'Fleet' },
        { value: 'specific operation', label: 'Specific Operation' },
        { value: 'dedicated', label: 'Dedicated' }
    ];

    // Status options sesuai enum di database
    const statusOptions = [
        { value: 'active', label: 'Active' },
        { value: 'repair', label: 'Repair' },
        { value: 'docking', label: 'Docking' },
        { value: 'off', label: 'Off' }
    ];

    useEffect(() => {
        fetchCaptains();
    }, []);

    const fetchCaptains = async () => {
        try {
            const response = await API.get('/captains');
            setCaptains(response.data);
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

    const handleUpdateRegion = async (captainId, newRegion) => {
        try {
            await API.patch(`/updateCaptainShipRegion/${captainId}`, {
                region: newRegion
            });

            showAlert('Region captain berhasil diubah');
            
            // Update local state
            setCaptains(prevCaptains => 
                prevCaptains.map(captain => 
                    captain.id_captain_ship === captainId 
                        ? { ...captain, region: newRegion }
                        : captain
                )
            );
            
            setEditingRegion(null);
        } catch (error) {
            console.error('Error updating captain region:', error);
            const errorMessage = error.response?.data?.msg || 'Gagal mengubah region captain';
            showAlert(errorMessage, 'error');
        }
    };

    const handleUpdateStatus = async (captainId, newStatus) => {
        try {
            await API.patch(`/updateCaptainShipStatus/${captainId}`, {
                status: newStatus
            });

            showAlert('Status captain berhasil diubah');
            
            // Update local state
            setCaptains(prevCaptains => 
                prevCaptains.map(captain => 
                    captain.id_captain_ship === captainId 
                        ? { ...captain, status: newStatus }
                        : captain
                )
            );
            
            setEditingStatus(null);
        } catch (error) {
            console.error('Error updating captain status:', error);
            const errorMessage = error.response?.data?.msg || 'Gagal mengubah status captain';
            showAlert(errorMessage, 'error');
        }
    };

    const handleEditRegionClick = (captain) => {
        setEditingRegion(captain.id_captain_ship);
        setTempRegion(captain.region || '');
    };

    const handleEditStatusClick = (captain) => {
        setEditingStatus(captain.id_captain_ship);
        setTempStatus(captain.status || 'active');
    };

    const handleSaveRegion = (captainId) => {
        if (tempRegion) {
            handleUpdateRegion(captainId, tempRegion);
        } else {
            setEditingRegion(null);
        }
    };

    const handleSaveStatus = (captainId) => {
        if (tempStatus) {
            handleUpdateStatus(captainId, tempStatus);
        } else {
            setEditingStatus(null);
        }
    };

    const handleCancelEdit = () => {
        setEditingRegion(null);
        setEditingStatus(null);
        setTempRegion('');
        setTempStatus('');
    };

    const handleView = (captain) => {
        setSelectedCaptain(captain);
        setShowDetailModal(true);
    };

    const filteredCaptains = captains.filter(captain =>
        captain.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        captain.ID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        captain.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        captain.type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadgeColor = (status) => {
        const colors = {
            active: 'bg-green-100 text-green-800 border border-green-200',
            repair: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
            docking: 'bg-blue-100 text-blue-800 border border-blue-200',
            off: 'bg-red-100 text-red-800 border border-red-200'
        };
        return colors[status] || colors.active;
    };

    const getStatusDisplayName = (status) => {
        const names = {
            active: 'Active',
            repair: 'Repair',
            docking: 'Docking',
            off: 'Off'
        };
        return names[status] || 'Active';
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
            island: 'bg-teal-100 text-teal-800'
        };
        return colors[type] || colors.ship;
    };

    const getRegionBadgeColor = (region) => {
        const colors = {
            north: 'bg-blue-100 text-blue-800',
            south: 'bg-green-100 text-green-800',
            central: 'bg-purple-100 text-purple-800',
            fleet: 'bg-orange-100 text-orange-800',
            'specific operation': 'bg-indigo-100 text-indigo-800',
            dedicated: 'bg-pink-100 text-pink-800'
        };
        return colors[region] || 'bg-gray-100 text-gray-800';
    };

    const getRegionDisplayName = (region) => {
        const names = {
            north: 'North',
            south: 'South',
            central: 'Central',
            fleet: 'Fleet',
            'specific operation': 'Specific Operation',
            dedicated: 'Dedicated'
        };
        return names[region] || 'Belum diatur';
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
                </div>
            </div>

            {/* Search and Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                <div className="lg:col-span-3">
                    <div className="relative">
                        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari captain berdasarkan nama, ID, region, atau type..."
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
                                    Role
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Informasi Kapal
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Region
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
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
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
                                            <div className="text-xs text-gray-400 mt-1">
                                                Lat: {formatCoordinate(captain.latitude_decimal)}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                Long: {formatCoordinate(captain.longitude_decimal)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {editingRegion === captain.id_captain_ship ? (
                                                <div className="flex items-center space-x-2">
                                                    <select
                                                        value={tempRegion}
                                                        onChange={(e) => setTempRegion(e.target.value)}
                                                        className="text-sm border border-gray-300 rounded bg-white text-black px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    >
                                                        <option value="">Pilih Region</option>
                                                        {regionOptions.map(option => (
                                                            <option key={option.value} value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => handleSaveRegion(captain.id_captain_ship)}
                                                        className="text-green-600 hover:text-green-800 transition-colors duration-200"
                                                        title="Simpan"
                                                    >
                                                        <CheckIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="text-red-600 hover:text-red-800 transition-colors duration-200"
                                                        title="Batal"
                                                    >
                                                        <XMarkIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center space-x-2">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getRegionBadgeColor(captain.region)}`}>
                                                        {getRegionDisplayName(captain.region)}
                                                    </span>
                                                    <button
                                                        onClick={() => handleEditRegionClick(captain)}
                                                        className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
                                                        title="Ubah Region"
                                                    >
                                                        <PencilIcon className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {editingStatus === captain.id_captain_ship ? (
                                                <div className="flex items-center space-x-2">
                                                    <select
                                                        value={tempStatus}
                                                        onChange={(e) => setTempStatus(e.target.value)}
                                                        className="text-sm border border-gray-300 rounded bg-white text-black px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    >
                                                        {statusOptions.map(option => (
                                                            <option key={option.value} value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => handleSaveStatus(captain.id_captain_ship)}
                                                        className="text-green-600 hover:text-green-800 transition-colors duration-200"
                                                        title="Simpan Status"
                                                    >
                                                        <CheckIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="text-red-600 hover:text-red-800 transition-colors duration-200"
                                                        title="Batal"
                                                    >
                                                        <XMarkIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center space-x-2">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(captain.status)}`}>
                                                        {getStatusDisplayName(captain.status)}
                                                    </span>
                                                    <button
                                                        onClick={() => handleEditStatusClick(captain)}
                                                        className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
                                                        title="Ubah Status"
                                                    >
                                                        <PencilIcon className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            )}
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
                                            <p className="text-sm text-gray-500">ID</p>
                                            <p className="text-sm font-medium text-gray-900">{selectedCaptain.ID || 'N/A'}</p>
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
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRegionBadgeColor(selectedCaptain.region)}`}>
                                                {getRegionDisplayName(selectedCaptain.region)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Status</p>
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedCaptain.status)}`}>
                                                {getStatusDisplayName(selectedCaptain.status)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Koordinat</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {formatCoordinate(selectedCaptain.latitude_decimal)}, {formatCoordinate(selectedCaptain.longitude_decimal)}
                                            </p>
                                        </div>
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
        </div>
    );
};

export default FleetCaptain;