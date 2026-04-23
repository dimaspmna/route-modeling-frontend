import React, { useState, useEffect } from 'react';
import API from '../../../api/Api';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    CurrencyDollarIcon,
    PencilIcon,
    CheckIcon,
    XMarkIcon,
    EyeIcon,
    EyeSlashIcon,
    TrashIcon
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

const FuelPrice = () => {
    const [fuelPrices, setFuelPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
    const [editingPrice, setEditingPrice] = useState(null);
    const [tempPrice, setTempPrice] = useState('');

    // Form states
    const [formData, setFormData] = useState({
        fuel_type: 'biosolar',
        price: '',
        effective_date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    useEffect(() => {
        fetchFuelPrices();
    }, []);

    const fetchFuelPrices = async () => {
        try {
            const response = await API.get('/get-fuel-prices');
            setFuelPrices(response.data.data);
        } catch (error) {
            console.error('Error fetching fuel prices:', error);
            showAlert('Gagal memuat data harga fuel', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (message, type = 'success') => {
        setAlert({ show: true, message, type });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.post('/fuel-prices', formData);
            showAlert('Harga fuel berhasil ditambahkan');
            setShowModal(false);
            resetForm();
            fetchFuelPrices();
        } catch (error) {
            console.error('Error creating fuel price:', error);
            const errorMessage = error.response?.data?.message || 'Gagal menambahkan harga fuel';
            showAlert(errorMessage, 'error');
        }
    };

    const handleUpdatePrice = async (id, newPrice) => {
        try {
            const priceValue = parseFloat(newPrice);
            if (isNaN(priceValue) || priceValue < 0) {
                showAlert('Harga fuel harus berupa angka positif', 'error');
                return;
            }

            await API.put(`/fuel-prices/${id}`, {
                price: priceValue
            });

            showAlert('Harga fuel berhasil diupdate');
            
            setFuelPrices(prevPrices => 
                prevPrices.map(price => 
                    price.id_fuel_price === id 
                        ? { ...price, price: priceValue }
                        : price
                )
            );
            
            setEditingPrice(null);
        } catch (error) {
            console.error('Error updating fuel price:', error);
            const errorMessage = error.response?.data?.message || 'Gagal mengubah harga fuel';
            showAlert(errorMessage, 'error');
        }
    };

    const handleSetActive = async (id) => {
        try {
            await API.patch(`/fuel-prices/${id}/activate`);
            showAlert('Harga fuel berhasil diaktifkan');
            fetchFuelPrices();
        } catch (error) {
            console.error('Error setting active fuel price:', error);
            const errorMessage = error.response?.data?.message || 'Gagal mengaktifkan harga fuel';
            showAlert(errorMessage, 'error');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus harga fuel ini?')) {
            try {
                await API.delete(`/fuel-prices/${id}`);
                showAlert('Harga fuel berhasil dihapus');
                fetchFuelPrices();
            } catch (error) {
                console.error('Error deleting fuel price:', error);
                const errorMessage = error.response?.data?.message || 'Gagal menghapus harga fuel';
                showAlert(errorMessage, 'error');
            }
        }
    };

    const handleEditPriceClick = (fuelPrice) => {
        setEditingPrice(fuelPrice.id_fuel_price);
        setTempPrice(fuelPrice.price || '');
    };

    const handleSavePrice = (id) => {
        if (tempPrice !== '') {
            handleUpdatePrice(id, tempPrice);
        } else {
            setEditingPrice(null);
        }
    };

    const handleCancelEdit = () => {
        setEditingPrice(null);
        setTempPrice('');
    };

    const resetForm = () => {
        setFormData({
            fuel_type: 'biosolar',
            price: '',
            effective_date: new Date().toISOString().split('T')[0],
            notes: ''
        });
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '-';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getFuelTypeDisplay = (type) => {
        const types = {
            'biosolar': 'Bio Solar',
            'lng': 'LNG'
        };
        return types[type] || type;
    };

    const getStatusBadge = (status) => {
        return status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800';
    };

    const filteredFuelPrices = fuelPrices.filter(price =>
        getFuelTypeDisplay(price.fuel_type).toLowerCase().includes(searchTerm.toLowerCase()) ||
        price.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        price.price?.toString().includes(searchTerm)
    );

    const activePrices = fuelPrices.filter(price => price.status === 'active');

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat data harga fuel...</p>
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
                            <CurrencyDollarIcon className="h-8 w-8 text-green-500 mr-3" />
                            Manajemen Harga Fuel
                        </h1>
                        <p className="text-gray-600 mt-2">Kelola harga berbagai jenis fuel yang dapat berubah sewaktu-waktu</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg flex items-center transition-colors duration-200"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Tambah Harga Baru
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-green-100 rounded-lg shadow p-4 border border-green-200">
                    <p className="text-sm text-gray-600">Total Harga Fuel</p>
                    <p className="text-2xl font-bold text-gray-900">{fuelPrices.length}</p>
                </div>
                <div className="bg-blue-100 rounded-lg shadow p-4 border border-blue-200">
                    <p className="text-sm text-gray-600">Harga Aktif</p>
                    <p className="text-2xl font-bold text-gray-900">{activePrices.length}</p>
                </div>
                <div className="bg-yellow-100 rounded-lg shadow p-4 border border-yellow-200">
                    <p className="text-sm text-gray-600">Bio Solar</p>
                    <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(activePrices.find(p => p.fuel_type === 'biosolar')?.price || 0)}
                    </p>
                </div>
                <div className="bg-purple-100 rounded-lg shadow p-4 border border-purple-200">
                    <p className="text-sm text-gray-600">LNG</p>
                    <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(activePrices.find(p => p.fuel_type === 'lng')?.price || 0)}
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari berdasarkan jenis fuel, catatan, atau harga..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Fuel Prices Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Jenis Fuel
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Harga
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tanggal Efektif
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Catatan
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredFuelPrices.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        {searchTerm ? 'Tidak ada data harga fuel yang sesuai dengan pencarian' : 'Belum ada data harga fuel'}
                                    </td>
                                </tr>
                            ) : (
                                filteredFuelPrices.map((fuelPrice) => (
                                    <tr key={fuelPrice.id_fuel_price} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {getFuelTypeDisplay(fuelPrice.fuel_type)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {editingPrice === fuelPrice.id_fuel_price ? (
                                                <div className="flex items-center space-x-2">
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                                                        <input
                                                            type="number"
                                                            value={tempPrice}
                                                            onChange={(e) => setTempPrice(e.target.value)}
                                                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32"
                                                            placeholder="0"
                                                            min="0"
                                                            step="1000"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => handleSavePrice(fuelPrice.id_fuel_price)}
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
                                                    <span className="text-lg font-semibold text-green-600">
                                                        {formatCurrency(fuelPrice.price)}
                                                    </span>
                                                    <button
                                                        onClick={() => handleEditPriceClick(fuelPrice)}
                                                        className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
                                                        title="Edit Harga"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(fuelPrice.status)}`}>
                                                {fuelPrice.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {formatDate(fuelPrice.effective_date)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs truncate">
                                                {fuelPrice.notes || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-3">
                                                {fuelPrice.status !== 'active' && (
                                                    <button
                                                        onClick={() => handleSetActive(fuelPrice.id_fuel_price)}
                                                        className="text-blue-600 hover:text-blue-900 transition-colors duration-200 flex items-center space-x-1"
                                                        title="Aktifkan Harga"
                                                    >
                                                        <EyeIcon className="h-4 w-4" />
                                                        <span>Aktifkan</span>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(fuelPrice.id_fuel_price)}
                                                    className="text-red-600 hover:text-red-900 transition-colors duration-200 flex items-center space-x-1"
                                                    title="Hapus Harga"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                    <span>Hapus</span>
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

            {/* Add Fuel Price Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Tambah Harga Fuel Baru</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Jenis Fuel *
                                        </label>
                                        <select
                                            value={formData.fuel_type}
                                            onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                                            className="w-full px-4 py-3 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        >
                                            <option value="biosolar">Bio Solar</option>
                                            <option value="lng">LNG</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Harga (IDR) *
                                        </label>
                                        <input
                                            required
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full px-4 py-3 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Masukkan harga"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tanggal Efektif
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.effective_date}
                                            onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                                            className="w-full px-4 py-3 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Catatan
                                        </label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            className="w-full px-4 py-3 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Tambahkan catatan (opsional)"
                                            rows="3"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            resetForm();
                                        }}
                                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                                    >
                                        Simpan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Info Section */}
            {/* <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Informasi:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Hanya satu harga yang dapat aktif untuk setiap jenis fuel</li>
                    <li>• Klik ikon pensil untuk mengubah harga fuel</li>
                    <li>• Gunakan tombol "Aktifkan" untuk mengubah harga yang berlaku</li>
                    <li>• Harga fuel akan digunakan dalam perhitungan biaya operasional</li>
                </ul>
            </div> */}
        </div>
    );
};

export default FuelPrice;