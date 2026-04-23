import React, { useState, useEffect } from 'react';
import API from '../../../api/Api';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    UserGroupIcon,
    KeyIcon
} from '@heroicons/react/24/outline';
import SuccessAlertSA from '../components/SuccessAlertSA';

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

const UsersData = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });

    // Form states sesuai dengan field database
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user',
        type: 'ship',
        lat: '', // Sesuai dengan field di database
        lng: '', // Sesuai dengan field di database
        region: ''
    });

    const [passwordForm, setPasswordForm] = useState({
        password: '',
        confirmPassword: ''
    });

    // Roles yang diperbolehkan sesuai enum di database
    const roleOptions = [
        { value: 'fuel', label: 'Fuel Manager' },
        { value: 'fw', label: 'Fresh Water Manager' },
        { value: 'fleet', label: 'Fleet Manager' },
        { value: 'captain', label: 'Captain' },
        { value: 'spv', label: 'Supervisor / Superintenden / Manager' },
        { value: 'user', label: 'User' },
        { value: 'ipb', label: 'IPB Operator' }
    ];

    // Types yang diperbolehkan sesuai enum di database
    const typeOptions = [
        { value: 'ship', label: 'Ship' },
        { value: 'barge', label: 'Barge' },
        { value: 'tanker', label: 'Tanker' }
    ];

    // Region options
    const regionOptions = [
        { value: 'north', label: 'North' },
        { value: 'south', label: 'South' },
        { value: 'central', label: 'Central' },
        { value: 'fleet', label: 'Fleet' },
        { value: 'specific operation', label: 'Specific Operation' },
        { value: 'dedicated', label: 'Dedicated' }
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await API.get('/allUsers');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            showAlert('Gagal memuat data users', 'error');
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
            // Validasi form
            if (!formData.name.trim()) {
                showAlert('Nama lengkap wajib diisi', 'error');
                return;
            }
            if (!formData.email.trim()) {
                showAlert('Email wajib diisi', 'error');
                return;
            }
            if (!formData.role) {
                showAlert('Role wajib dipilih', 'error');
                return;
            }
            if (!formData.type) {
                showAlert('Type wajib dipilih', 'error');
                return;
            }

            if (editingUser) {
                // Update user data - sesuaikan dengan field database
                const updateData = {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    type: formData.type,
                    lat: formData.lat || null, // Menggunakan lat sesuai database
                    lng: formData.lng || null, // Menggunakan lng sesuai database
                    region: formData.region || null
                };

                await API.put(`/updateUser/${editingUser.id}`, updateData);
                showAlert('User berhasil diupdate');
            } else {
                // Create new user
                if (!formData.password) {
                    showAlert('Password wajib diisi untuk user baru', 'error');
                    return;
                }

                const userData = {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                    type: formData.type,
                    lat: formData.lat || null, // Menggunakan lat sesuai database
                    lng: formData.lng || null, // Menggunakan lng sesuai database
                    region: formData.region || null
                };

                await API.post('/createUser', userData);
                showAlert('User berhasil dibuat');
            }

            setShowModal(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            const errorMessage = error.response?.data?.msg || error.response?.data?.message || 'Gagal menyimpan user';
            showAlert(errorMessage, 'error');
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();

        if (passwordForm.password !== passwordForm.confirmPassword) {
            showAlert('Password dan confirm password tidak cocok', 'error');
            return;
        }

        if (passwordForm.password.length < 6) {
            showAlert('Password minimal 6 karakter', 'error');
            return;
        }

        try {
            await API.patch(`/updateUsersPassword/${selectedUser.id}`, {
                password: passwordForm.password
            });

            showAlert('Password berhasil diubah');
            setShowPasswordModal(false);
            resetPasswordForm();
        } catch (error) {
            console.error('Error updating password:', error);
            const errorMessage = error.response?.data?.msg || 'Gagal mengubah password';
            showAlert(errorMessage, 'error');
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name || '',
            email: user.email || '',
            password: '', // Kosongkan password saat edit
            role: user.role || 'user',
            type: user.type || 'ship',
            lat: user.lat || '', // Menggunakan lat sesuai database
            lng: user.lng || '', // Menggunakan lng sesuai database
            region: user.region || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (user) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus user ${user.name}?`)) {
            try {
                await API.delete(`/deleteUser/${user.id}`);
                showAlert('User berhasil dihapus');
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                showAlert('Gagal menghapus user', 'error');
            }
        }
    };

    const handleView = (user) => {
        setSelectedUser(user);
        setShowDetailModal(true);
    };

    const handleChangePasswordClick = (user) => {
        setSelectedUser(user);
        setPasswordForm({
            password: '',
            confirmPassword: ''
        });
        setShowPasswordModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'user',
            type: 'ship',
            lat: '', // Menggunakan lat sesuai database
            lng: '', // Menggunakan lng sesuai database
            region: ''
        });
        setEditingUser(null);
    };

    const resetPasswordForm = () => {
        setPasswordForm({
            password: '',
            confirmPassword: ''
        });
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadgeColor = (role) => {
        const colors = {
            admin: 'bg-red-100 text-red-800 border border-red-200',
            fuel: 'bg-orange-100 text-orange-800 border border-orange-200',
            fw: 'bg-blue-100 text-blue-800 border border-blue-200',
            passenger: 'bg-green-100 text-green-800 border border-green-200',
            fleet: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
            captain: 'bg-purple-100 text-purple-800 border border-purple-200',
            spv: 'bg-pink-100 text-pink-800 border border-pink-200',
            user: 'bg-gray-100 text-gray-800 border border-gray-200',
            ipb: 'bg-cyan-100 text-cyan-800 border border-cyan-200'
        };
        return colors[role] || colors.user;
    };

    const getRoleDisplayName = (role) => {
        const names = {
            fuel: 'Fuel Manager',
            fw: 'Fresh Water Manager',
            fleet: 'Fleet Manager',
            captain: 'Captain',
            spv: 'Supervisor / Superintenden / Manager',
            user: 'User',
            ipb: 'IPB Operator'
        };
        return names[role] || role;
    };

    const getTypeDisplayName = (type) => {
        const names = {
            ship: 'Ship',
            barge: 'Barge',
            tanker: 'Tanker'
        };
        return names[type] || type;
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
        return names[region] || region || '-';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat data users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Alerts */}
            {alert.show && alert.type === 'success' && (
                <SuccessAlertSA
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
                            Manajemen Users
                        </h1>
                        <p className="text-gray-600 mt-2">Kelola data pengguna sistem</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center transition-colors duration-200"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Tambah User
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
                            placeholder="Cari user berdasarkan nama, email, role, atau type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
                <div className="bg-green-100 rounded-lg shadow p-4 border border-green-200">
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Region
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        {searchTerm ? 'Tidak ada user yang sesuai dengan pencarian' : 'Belum ada data user'}
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                                                    <span className="text-white font-semibold text-sm">
                                                        {user.name?.charAt(0).toUpperCase() || 'U'}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {user.name || 'N/A'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        ID: {user.id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{user.email || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                                                {getRoleDisplayName(user.role)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                                                {getTypeDisplayName(user.type)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{getRegionDisplayName(user.region)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-3">
                                                <button
                                                    onClick={() => handleView(user)}
                                                    className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                                                    title="Lihat Detail"
                                                >
                                                    <EyeIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="text-green-600 hover:text-green-900 transition-colors duration-200"
                                                    title="Edit User"
                                                >
                                                    <PencilIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleChangePasswordClick(user)}
                                                    className="text-yellow-600 hover:text-yellow-900 transition-colors duration-200"
                                                    title="Reset Password"
                                                >
                                                    <KeyIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    className="text-red-600 hover:text-red-900 transition-colors duration-200"
                                                    title="Hapus User"
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

            {/* Add/Edit User Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                {editingUser ? 'Edit User' : 'Tambah User Baru'}
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Nama Lengkap */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nama Lengkap *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Masukkan nama lengkap"
                                        />
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Username *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Masukkan Username"
                                        />
                                    </div>

                                    {/* Password (hanya untuk create) */}
                                    {!editingUser && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Password *
                                            </label>
                                            <input
                                                type="password"
                                                required
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full px-4 py-3 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Masukkan password"
                                                minLength="6"
                                            />
                                        </div>
                                    )}

                                    {/* Role */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Role *
                                        </label>
                                        <select
                                            required
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full px-4 py-3 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            {roleOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Type *
                                        </label>
                                        <select
                                            required
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full px-4 py-3 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            {typeOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Latitude (lat) */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Latitude (lat)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.lat}
                                            onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                                            className="w-full px-4 py-3 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Contoh: -6.2088"
                                        />
                                    </div>

                                    {/* Longitude (lng) */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Longitude (lng)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.lng}
                                            onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                                            className="w-full px-4 py-3 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Contoh: 106.8456"
                                        />
                                    </div>

                                    {/* Region */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Region
                                        </label>
                                        <select
                                            value={formData.region}
                                            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                            className="w-full px-4 py-3 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Pilih Region</option>
                                            {regionOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
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
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                                    >
                                        {editingUser ? 'Update User' : 'Simpan User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* User Detail Modal */}
            {showDetailModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Detail User</h2>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0 h-16 w-16 bg-blue-500 rounded-full flex items-center justify-center">
                                        <span className="text-white font-semibold text-xl">
                                            {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{selectedUser.name || 'N/A'}</h3>
                                        <p className="text-gray-500">ID: {selectedUser.id}</p>
                                    </div>
                                </div>
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Email</p>
                                                <p className="text-sm font-medium text-gray-900">{selectedUser.email || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Role</p>
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(selectedUser.role)}`}>
                                                    {getRoleDisplayName(selectedUser.role)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Type</p>
                                                <p className="text-sm font-medium text-gray-900">{getTypeDisplayName(selectedUser.type)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Region</p>
                                                <p className="text-sm font-medium text-gray-900">{getRegionDisplayName(selectedUser.region)}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Latitude (lat)</p>
                                                <p className="text-sm font-medium text-gray-900">{selectedUser.lat || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Longitude (lng)</p>
                                                <p className="text-sm font-medium text-gray-900">{selectedUser.lng || '-'}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Dibuat</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString('id-ID') : '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Diupdate</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleString('id-ID') : '-'}
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
            {showPasswordModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Reset Password</h2>
                            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                    <strong>Reset password untuk:</strong> {selectedUser.name}
                                </p>
                                <p className="text-xs text-yellow-600 mt-1">
                                    Email: {selectedUser.email}
                                </p>
                            </div>
                            <form onSubmit={handleUpdatePassword}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Password Baru *
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
                                            Konfirmasi Password Baru *
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
        </div>
    );
};

export default UsersData;