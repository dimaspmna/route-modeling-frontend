import React, { useState } from "react";
import { X, Save, RotateCcw } from "lucide-react";
import API from "../../../api/Api";
import SuccessAlertFuel from "../components/SuccessAlertFuel";

const EditFuelEntries = ({ data, onSave, onCancel }) => {
    const [volume, setVolume] = useState(data?.kuantitas || "");
    const [status, setStatus] = useState("approved with note");
    const [note, setNote] = useState(data?.admin_note || "");
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSave = async () => {
        if (!volume) {
            alert("Volume tidak boleh kosong");
            return;
        }

        setLoading(true);
        try {
            await API.put(`/fuel-request/${data.ship_request_id}`, {
                kuantitas: volume,
                status_request: status,
                admin_note: note,
            });

            setShowSuccess(true);

            // tunda close modal 3 detik (sesuai auto-close SuccessAlertFuel)
            setTimeout(() => {
                onSave({
                    ...data,
                    kuantitas: volume,
                    status_request: status,
                    admin_note: note,
                });
            }, 3000);

        } catch (err) {
            console.error("Update error:", err);
            alert("Terjadi error saat menyimpan");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setVolume(data?.kuantitas || "");
        setStatus(data?.status_request || "need to process");
        setNote(data?.admin_note || "");
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 overflow-auto backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">Edit Fuel Request</h2>
                            <button
                                onClick={onCancel}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Info request yang tidak bisa diubah */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nama User</label>
                                <div className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-gray-200 font-bold text-gray-600">
                                    {data?.name || "-"}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Request</label>
                                <div className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-gray-200 text-gray-600">
                                    {data?.tanggal_request
                                        ? new Date(data.tanggal_request).toLocaleString("id-ID", {
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                        })
                                        : "-"}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">No. ID Request</label>
                                <div className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-gray-200 text-gray-600 font-mono">
                                    {data?.ship_request_id || "-"}
                                </div>
                            </div>
                        </div>

                        {/* Jenis fuel */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Request</label>
                                <div className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-gray-200 text-gray-600 capitalize">
                                    {data?.kategori_request?.replace("_", " ") || "-"}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Fuel</label>
                                <div className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-gray-200 text-gray-600">
                                    {data?.jenis_material || "-"}
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Koordinat Lokasi</label>
                                <div className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-gray-200 text-gray-600 font-mono">
                                    {data?.kordinat_request || "-"}
                                </div>
                            </div>
                        </div>

                        {/* Editable fields */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Kuantitas Volume *
                                </label>
                                <input
                                    type="number"
                                    value={volume}
                                    onChange={(e) => setVolume(e.target.value)}
                                    className="w-full border bg-white text-black border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Satuan</label>
                                <div className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-gray-200 text-gray-600">
                                    {data?.satuan || "-"}
                                </div>
                            </div>
                        </div>

                        {/* Status ACC hanya satu opsi */}
                        <div className="mb-6 bg-blue-100 rounded-md p-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status Request</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                disabled // dropdown dikunci
                                className="w-full border bg-gray-200 text-gray-600 border-gray-300 px-4 py-3 rounded-lg"
                            >
                                <option value="approved with note">✅ Approved with Note</option>
                            </select>
                        </div>


                        {/* Catatan admin */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Admin</label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Tambahkan catatan perubahan jika ada..."
                                className="w-full border bg-white text-black border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                                rows={3}
                            />
                        </div>

                        {/* Tombol aksi */}
                        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                            <button
                                onClick={handleReset}
                                className="flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={loading}
                            >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Reset
                            </button>
                            <button
                                onClick={onCancel}
                                className="flex items-center justify-center px-4 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                                disabled={loading}
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                {loading ? "Menyimpan..." : "Simpan Perubahan"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showSuccess && (
                <SuccessAlertFuel
                    message="Data fuel request berhasil diperbarui!"
                    onClose={() => setShowSuccess(false)}
                />
            )}
        </>
    );
};

export default EditFuelEntries;