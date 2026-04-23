import React, { useState, useEffect } from 'react';
import API from "../../../api/Api";
import ExcelJS from "exceljs";
import {
    FunnelIcon,
    DocumentArrowDownIcon,
    CalendarIcon,
    MagnifyingGlassIcon,
    GlobeAsiaAustraliaIcon,
    ArrowsRightLeftIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    XMarkIcon,
    BuildingStorefrontIcon,
    MapPinIcon,
    UserIcon,
    DocumentTextIcon
} from "@heroicons/react/24/outline";
import {
    BuildingStorefrontIcon as BuildingStorefrontIconSolid,
    MapPinIcon as MapPinIconSolid,
    UserIcon as UserIconSolid,
    DocumentTextIcon as DocumentTextIconSolid
} from "@heroicons/react/24/solid";

const FuelLostReport = () => {
    // State untuk ketiga jenis laporan
    const [fuelLostData, setFuelLostData] = useState([]);
    const [perjalananData, setPerjalananData] = useState([]);
    const [rerouteData, setRerouteData] = useState([]);
    const [expandedRows, setExpandedRows] = useState({});

    // State untuk pagination
    const [pagination, setPagination] = useState({
        fuelLost: {
            currentPage: 1,
            itemsPerPage: 20,
            totalItems: 0
        },
        perjalanan: {
            currentPage: 1,
            itemsPerPage: 20,
            totalItems: 0
        },
        reroute: {
            currentPage: 1,
            itemsPerPage: 20,
            totalItems: 0
        }
    });

    const [loading, setLoading] = useState({
        fuelLost: false,
        perjalanan: false,
        reroute: false
    });

    const [globalFilters, setGlobalFilters] = useState({
        period: 'monthly',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        startDate: '',
        endDate: '',
        typeFilter: 'all', // all, IPB, Supply
        regionFilter: 'all' // all, north, south, central
    });

    const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

    // ========== FUNGSI HELPER TYPE & REGION ==========
    
    // Fungsi untuk menentukan type berdasarkan nama kapal atau data lainnya
    const getRouteType = (route) => {
        if (route.type) return route.type;
        
        const shipName = route.ship_name || '';
        if (shipName.includes('IPB') || shipName.includes('SUPPLY')) {
            return shipName.includes('IPB') ? 'IPB' : 'Supply';
        }
        
        // Default ke IPB jika tidak ada indikasi Supply
        return 'IPB';
    };

    // Fungsi untuk mendapatkan region dari data
    const getRouteRegion = (route) => {
        if (route.region) return route.region.toLowerCase();
        
        const shipName = (route.ship_name || '').toLowerCase();
        const location = route.details?.[0]?.location || '';
        
        if (shipName.includes('north') || location.includes('north')) return 'north';
        if (shipName.includes('south') || location.includes('south')) return 'south';
        if (shipName.includes('central') || location.includes('central')) return 'central';
        
        return 'unknown';
    };

    // Type filter configuration - sesuai dengan yang diharapkan backend
    const typeFilterConfig = [
        { id: "all", label: "Semua Tipe", color: "gray" },
        { id: "IPB", label: "IPB", color: "purple" },
        { id: "Supply", label: "Supply", color: "blue" }
    ];

    // Region filter configuration
    const regionFilterConfig = [
        { id: "all", label: "Semua Region", color: "gray" },
        { id: "north", label: "North", color: "blue" },
        { id: "south", label: "South", color: "green" },
        { id: "central", label: "Central", color: "orange" }
    ];

    // Get type color classes
    const getTypeColorClasses = (typeId) => {
        switch (typeId) {
            case "IPB":
                return {
                    bg: "bg-purple-50",
                    text: "text-purple-700",
                    border: "border-purple-200",
                    icon: "text-purple-600",
                    light: "bg-purple-100"
                };
            case "Supply":
                return {
                    bg: "bg-blue-50",
                    text: "text-blue-700",
                    border: "border-blue-200",
                    icon: "text-blue-600",
                    light: "bg-blue-100"
                };
            default:
                return {
                    bg: "bg-gray-50",
                    text: "text-gray-700",
                    border: "border-gray-200",
                    icon: "text-gray-600",
                    light: "bg-gray-100"
                };
        }
    };

    // Get region color classes
    const getRegionColorClasses = (regionId) => {
        switch (regionId) {
            case "north":
                return {
                    bg: "bg-blue-50",
                    text: "text-blue-700",
                    border: "border-blue-200",
                    icon: "text-blue-600",
                    light: "bg-blue-100"
                };
            case "south":
                return {
                    bg: "bg-green-50",
                    text: "text-green-700",
                    border: "border-green-200",
                    icon: "text-green-600",
                    light: "bg-green-100"
                };
            case "central":
                return {
                    bg: "bg-orange-50",
                    text: "text-orange-700",
                    border: "border-orange-200",
                    icon: "text-orange-600",
                    light: "bg-orange-100"
                };
            default:
                return {
                    bg: "bg-gray-50",
                    text: "text-gray-700",
                    border: "border-gray-200",
                    icon: "text-gray-600",
                    light: "bg-gray-100"
                };
        }
    };

    // ========== FUNGSI HELPER PAGINATION ==========
    
    const getPaginatedData = (data, paginationKey) => {
        const { currentPage, itemsPerPage } = pagination[paginationKey];
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return data.slice(startIndex, endIndex);
    };

    const handlePageChange = (reportType, pageNumber) => {
        if (pageNumber < 1) return;
        
        const totalPages = Math.ceil(pagination[reportType].totalItems / pagination[reportType].itemsPerPage);
        if (pageNumber > totalPages) return;

        setPagination(prev => ({
            ...prev,
            [reportType]: {
                ...prev[reportType],
                currentPage: pageNumber
            }
        }));

        // Reset expanded rows ketika ganti halaman
        if (reportType === 'perjalanan') {
            setExpandedRows({});
        }
    };

    const renderPagination = (reportType, totalItems) => {
        const { currentPage, itemsPerPage } = pagination[reportType];
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        if (totalPages <= 1) return null;

        const pageNumbers = [];
        const maxVisiblePages = 5;
        
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
                <div className="flex flex-1 justify-between sm:hidden">
                    <button
                        onClick={() => handlePageChange(reportType, currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
                            currentPage === 1 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => handlePageChange(reportType, currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
                            currentPage === totalPages 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Next
                    </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                            <span className="font-medium">
                                {Math.min(currentPage * itemsPerPage, totalItems)}
                            </span> of{' '}
                            <span className="font-medium">{totalItems}</span> results
                        </p>
                    </div>
                    <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                            <button
                                onClick={() => handlePageChange(reportType, currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${
                                    currentPage === 1 
                                        ? 'cursor-not-allowed bg-gray-50' 
                                        : 'hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                }`}
                            >
                                <span className="sr-only">Previous</span>
                                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                            
                            {startPage > 1 && (
                                <>
                                    <button
                                        onClick={() => handlePageChange(reportType, 1)}
                                        className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                                    >
                                        1
                                    </button>
                                    {startPage > 2 && (
                                        <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                                            ...
                                        </span>
                                    )}
                                </>
                            )}
                            
                            {pageNumbers.map((pageNum) => (
                                <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(reportType, pageNum)}
                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                        currentPage === pageNum
                                            ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            ))}
                            
                            {endPage < totalPages && (
                                <>
                                    {endPage < totalPages - 1 && (
                                        <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                                            ...
                                        </span>
                                    )}
                                    <button
                                        onClick={() => handlePageChange(reportType, totalPages)}
                                        className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                                    >
                                        {totalPages}
                                    </button>
                                </>
                            )}
                            
                            <button
                                onClick={() => handlePageChange(reportType, currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${
                                    currentPage === totalPages 
                                        ? 'cursor-not-allowed bg-gray-50' 
                                        : 'hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                }`}
                            >
                                <span className="sr-only">Next</span>
                                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        );
    };

    // ========== FUNGSI HELPER TANGGAL ==========
    
    const formatDateToAPI = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
            return localDate.toISOString().split('T')[0];
        } catch (error) {
            console.error("Error formatting date to API:", dateString, error);
            return '';
        }
    };

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            const adjustedDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
            return adjustedDate.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            console.error("Error formatting date for display:", dateString, error);
            return '-';
        }
    };

    const formatDateTimeForDisplay = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            const adjustedDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
            return adjustedDate.toLocaleString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error("Error formatting date time for display:", dateString, error);
            return '-';
        }
    };

    const parseDate = (dateString) => {
        if (!dateString) return null;
        try {
            let date = new Date(dateString);
            
            if (isNaN(date.getTime())) {
                const parts = dateString.split('/');
                if (parts.length === 3) {
                    date = new Date(parts[2], parts[1] - 1, parts[0]);
                }
            }
            
            return isNaN(date.getTime()) ? null : date;
        } catch (error) {
            console.error("Error parsing date:", dateString, error);
            return null;
        }
    };

    const toISODateString = (date) => {
        if (!date) return '';
        try {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error("Error converting to ISO date string:", error);
            return '';
        }
    };

    const getMonthRange = (month, year) => {
        try {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            
            return {
                start: toISODateString(startDate),
                end: toISODateString(endDate)
            };
        } catch (error) {
            console.error("Error getting month range:", error);
            return { start: '', end: '' };
        }
    };

    // ========== FUNGSI API CALL ==========

    const fetchFuelLostReport = async () => {
        try {
            setLoading(prev => ({ ...prev, fuelLost: true }));
            let params = {};

            if (globalFilters.period === 'monthly') {
                const { start, end } = getMonthRange(globalFilters.month, globalFilters.year);
                params.startDate = start;
                params.endDate = end;
            } else if (globalFilters.period === 'custom') {
                if (globalFilters.startDate && globalFilters.endDate) {
                    params.startDate = formatDateToAPI(globalFilters.startDate);
                    params.endDate = formatDateToAPI(globalFilters.endDate);
                }
            }

            // Kirim parameter type dan region ke API - type dalam format yang benar
            if (globalFilters.typeFilter !== 'all') {
                params.type = globalFilters.typeFilter; // Sudah dalam format 'IPB' atau 'Supply'
            }
            if (globalFilters.regionFilter !== 'all') {
                params.region = globalFilters.regionFilter;
            }

            console.log('Fetching fuel lost with params:', params);

            const response = await API.get("/laporan/fuel-lost", { params });
            
            if (response.data.success === false) {
                throw new Error(response.data.message);
            }
            
            const filteredData = response.data?.data || [];
            
            setFuelLostData(filteredData);
            // Update pagination total items
            setPagination(prev => ({
                ...prev,
                fuelLost: {
                    ...prev.fuelLost,
                    totalItems: filteredData.length,
                    currentPage: 1
                }
            }));
        } catch (error) {
            console.error("Gagal mengambil laporan fuel lost:", error);
            alert(`Gagal mengambil data laporan fuel lost: ${error.message}`);
        } finally {
            setLoading(prev => ({ ...prev, fuelLost: false }));
        }
    };

    const fetchPerjalananReport = async () => {
        try {
            setLoading(prev => ({ ...prev, perjalanan: true }));
            let params = {};

            if (globalFilters.period === 'monthly') {
                const { start, end } = getMonthRange(globalFilters.month, globalFilters.year);
                params.startDate = start;
                params.endDate = end;
            } else if (globalFilters.period === 'custom') {
                if (globalFilters.startDate && globalFilters.endDate) {
                    params.startDate = formatDateToAPI(globalFilters.startDate);
                    params.endDate = formatDateToAPI(globalFilters.endDate);
                }
            }

            // Kirim parameter type dan region ke API - type dalam format yang benar
            if (globalFilters.typeFilter !== 'all') {
                params.type = globalFilters.typeFilter; // Sudah dalam format 'IPB' atau 'Supply'
            }
            if (globalFilters.regionFilter !== 'all') {
                params.region = globalFilters.regionFilter;
            }

            console.log('Fetching perjalanan with params:', params);

            const response = await API.get("/laporan-perjalanan", { params });
            
            if (response.data.success === false) {
                throw new Error(response.data.message);
            }
            
            const filteredData = response.data?.data || [];
            
            setPerjalananData(filteredData);
            // Update pagination total items
            setPagination(prev => ({
                ...prev,
                perjalanan: {
                    ...prev.perjalanan,
                    totalItems: filteredData.length,
                    currentPage: 1
                }
            }));
        } catch (error) {
            console.error("Gagal mengambil laporan perjalanan:", error);
            alert(`Gagal mengambil data laporan perjalanan: ${error.message}`);
        } finally {
            setLoading(prev => ({ ...prev, perjalanan: false }));
        }
    };

    const fetchRerouteReport = async () => {
        try {
            setLoading(prev => ({ ...prev, reroute: true }));
            let params = {};

            if (globalFilters.period === 'monthly') {
                const { start, end } = getMonthRange(globalFilters.month, globalFilters.year);
                params.startDate = start;
                params.endDate = end;
            } else if (globalFilters.period === 'custom') {
                if (globalFilters.startDate && globalFilters.endDate) {
                    params.startDate = formatDateToAPI(globalFilters.startDate);
                    params.endDate = formatDateToAPI(globalFilters.endDate);
                }
            }

            // Kirim parameter type dan region ke API - type dalam format yang benar
            if (globalFilters.typeFilter !== 'all') {
                params.type = globalFilters.typeFilter; // Sudah dalam format 'IPB' atau 'Supply'
            }
            if (globalFilters.regionFilter !== 'all') {
                params.region = globalFilters.regionFilter;
            }

            console.log('Fetching reroute with params:', params);

            const response = await API.get("/laporan-fuel-lost-reroute", { params });
            
            if (response.data.success === false) {
                throw new Error(response.data.message);
            }
            
            const filteredData = response.data?.data || [];
            
            setRerouteData(filteredData);
            // Update pagination total items
            setPagination(prev => ({
                ...prev,
                reroute: {
                    ...prev.reroute,
                    totalItems: filteredData.length,
                    currentPage: 1
                }
            }));
        } catch (error) {
            console.error("Gagal mengambil laporan reroute:", error);
            alert(`Gagal mengambil data laporan reroute: ${error.message}`);
        } finally {
            setLoading(prev => ({ ...prev, reroute: false }));
        }
    };

    // ========== FUNGSI DOWNLOAD PDF ==========

    const downloadAllPDF = async (reportType, columns, filename) => {
        try {
            // Import jsPDF secara dinamis
            const jsPDFModule = await import('jspdf');
            const { jsPDF } = jsPDFModule;
            
            // Juga import autoTable jika diperlukan
            const autoTableModule = await import('jspdf-autotable');
            const autoTable = autoTableModule.default;

            const doc = new jsPDF();

            // Judul
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text(filename, 105, 15, { align: 'center' });

            // Periode
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            const monthName = getMonthName(globalFilters.month);
            let periodText = 'SEMUA DATA';
            
            if (globalFilters.period === 'monthly') {
                periodText = `PERIODE: ${monthName} ${globalFilters.year}`;
            } else if (globalFilters.period === 'custom') {
                periodText = `PERIODE: ${globalFilters.startDate} s/d ${globalFilters.endDate}`;
            }
            
            // Filter info
            let filterInfo = '';
            if (globalFilters.typeFilter !== 'all') {
                const typeLabel = typeFilterConfig.find(t => t.id === globalFilters.typeFilter)?.label;
                filterInfo += ` | Tipe: ${typeLabel}`;
            }
            if (globalFilters.regionFilter !== 'all') {
                const regionLabel = regionFilterConfig.find(r => r.id === globalFilters.regionFilter)?.label;
                filterInfo += ` | Region: ${regionLabel}`;
            }
            
            doc.text(periodText + filterInfo, 105, 22, { align: 'center' });
            doc.text(`Tanggal Generate: ${new Date().toLocaleDateString('id-ID')}`, 105, 27, { align: 'center' });

            try {
                setLoading(prev => ({ ...prev, [reportType]: true }));

                const params = {};
                
                if (globalFilters.period === 'monthly') {
                    const { start, end } = getMonthRange(globalFilters.month, globalFilters.year);
                    params.startDate = start;
                    params.endDate = end;
                } else if (globalFilters.period === 'custom') {
                    if (globalFilters.startDate && globalFilters.endDate) {
                        params.startDate = formatDateToAPI(globalFilters.startDate);
                        params.endDate = formatDateToAPI(globalFilters.endDate);
                    }
                }

                // Kirim parameter type dan region ke API - type dalam format yang benar
                if (globalFilters.typeFilter !== 'all') {
                    params.type = globalFilters.typeFilter; // Sudah dalam format 'IPB' atau 'Supply'
                }
                if (globalFilters.regionFilter !== 'all') {
                    params.region = globalFilters.regionFilter;
                }

                console.log('Download PDF fetching with params:', params);

                let allData = [];

                switch (reportType) {
                    case 'fuelLost':
                        const fuelResponse = await API.get("/laporan/fuel-lost", { params });
                        if (fuelResponse.data.success === false) {
                            throw new Error(fuelResponse.data.message);
                        }
                        allData = fuelResponse.data?.data || [];
                        break;
                    case 'perjalanan':
                        const perjalananResponse = await API.get("/laporan-perjalanan", { params });
                        if (perjalananResponse.data.success === false) {
                            throw new Error(perjalananResponse.data.message);
                        }
                        allData = perjalananResponse.data?.data || [];
                        break;
                    case 'reroute':
                        const rerouteResponse = await API.get("/laporan-fuel-lost-reroute", { params });
                        if (rerouteResponse.data.success === false) {
                            throw new Error(rerouteResponse.data.message);
                        }
                        allData = rerouteResponse.data?.data || [];
                        break;
                }

                // Data khusus untuk laporan perjalanan
                if (reportType === 'perjalanan') {
                    // Header utama
                    const mainHeaders = ['No', 'Nama Kapal', 'Tipe', 'Region', 'Tanggal', 'Total Points', 'Progress'];
                    
                    const mainData = allData.map((item, index) => {
                        const complete = item.status_perjalanan?.complete || 0;
                        const inprogress = item.status_perjalanan?.inprogress || 0;
                        const total = complete + inprogress;
                        const percentage = total > 0 ? Math.round((complete / total) * 100) : 0;
                        const routeType = getRouteType(item);
                        const routeRegion = getRouteRegion(item);
                        
                        return [
                            index + 1,
                            item.ship_name || '-',
                            routeType.toUpperCase(),
                            routeRegion.toUpperCase(),
                            item.tanggal_keberangkatan ? new Date(item.tanggal_keberangkatan).toLocaleDateString('id-ID') : '-',
                            item.monitoring_points?.length || 0,
                            `${complete}/${total} (${percentage}%)`
                        ];
                    });

                    // Buat tabel utama
                    autoTable(doc, {
                        head: [mainHeaders],
                        body: mainData,
                        startY: 35,
                        styles: {
                            fontSize: 8,
                            cellPadding: 2
                        },
                        headStyles: {
                            fillColor: [59, 130, 246],
                            textColor: 255,
                            fontStyle: 'bold'
                        },
                        alternateRowStyles: {
                            fillColor: [245, 245, 245]
                        },
                        margin: { top: 35 }
                    });

                    // Tambahkan detail monitoring points untuk setiap perjalanan
                    let currentY = doc.lastAutoTable.finalY + 10;
                    
                    allData.forEach((item, mainIndex) => {
                        if (item.monitoring_points && item.monitoring_points.length > 0) {
                            // Tambahkan judul detail points untuk perjalanan ini
                            if (currentY > 270) {
                                doc.addPage();
                                currentY = 20;
                            }
                            
                            doc.setFontSize(10);
                            doc.setFont("helvetica", "bold");
                            const routeType = getRouteType(item);
                            const routeRegion = getRouteRegion(item);
                            doc.text(`Detail Monitoring Points - ${item.ship_name || 'Kapal'} (${routeType.toUpperCase()}, ${routeRegion.toUpperCase()})`, 14, currentY);
                            currentY += 8;
                            
                            // Header untuk detail points
                            const detailHeaders = ['No', 'Nama Point', 'Tipe', 'Status', 'Priority', 'Rencana', 'Aktual'];
                            
                            const detailData = item.monitoring_points.map((point, pointIndex) => {
                                return [
                                    pointIndex + 1,
                                    point.point_name || '-',
                                    point.point_type || '-',
                                    point.status || '-',
                                    point.priority_level || '-',
                                    point.planned_timestamp ? formatDateTimeForDisplay(point.planned_timestamp) : '-',
                                    point.actual_timestamp ? formatDateTimeForDisplay(point.actual_timestamp) : '-'
                                ];
                            });
                            
                            // Buat tabel detail points
                            autoTable(doc, {
                                head: [detailHeaders],
                                body: detailData,
                                startY: currentY,
                                styles: {
                                    fontSize: 7,
                                    cellPadding: 1
                                },
                                headStyles: {
                                    fillColor: [75, 192, 192],
                                    textColor: 255,
                                    fontStyle: 'bold'
                                },
                                alternateRowStyles: {
                                    fillColor: [250, 250, 250]
                                },
                                margin: { left: 20 }
                            });
                            
                            currentY = doc.lastAutoTable.finalY + 15;
                        }
                    });
                } else if (reportType === 'reroute') {
                    // Data khusus untuk laporan reroute (mengelompokkan berdasarkan id_rute_destinasi)
                    const mainHeaders = ['No', 'Nama Kapal', 'Tipe', 'Region', 'Tanggal', 'Jumlah Reroute', 'Total Fuel Lost', 'Total Biaya', 'Perubahan Jarak'];
                    
                    const mainData = allData.map((item, index) => {
                        const routeType = getRouteType(item);
                        const routeRegion = getRouteRegion(item);
                        return [
                            index + 1,
                            item.ship_name || '-',
                            routeType.toUpperCase(),
                            routeRegion.toUpperCase(),
                            item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-',
                            item.jumlah_reroute_log || 0,
                            item.total_fuel_lost_reroute ? parseFloat(item.total_fuel_lost_reroute).toFixed(2) : '0.00',
                            item.total_fuel_cost ? `Rp ${parseFloat(item.total_fuel_cost).toLocaleString('id-ID')}` : 'Rp 0',
                            item.total_perubahan_jarak ? parseFloat(item.total_perubahan_jarak).toFixed(2) + ' km' : '0.00 km'
                        ];
                    });

                    // Buat tabel utama
                    autoTable(doc, {
                        head: [mainHeaders],
                        body: mainData,
                        startY: 35,
                        styles: {
                            fontSize: 8,
                            cellPadding: 2
                        },
                        headStyles: {
                            fillColor: [59, 130, 246],
                            textColor: 255,
                            fontStyle: 'bold'
                        },
                        alternateRowStyles: {
                            fillColor: [245, 245, 245]
                        },
                        margin: { top: 35 }
                    });

                    // Tambahkan detail reroute logs untuk setiap rute
                    let currentY = doc.lastAutoTable.finalY + 10;
                    
                    allData.forEach((item, mainIndex) => {
                        if (item.reroute_logs && item.reroute_logs.length > 0) {
                            // Tambahkan judul detail reroute logs
                            if (currentY > 270) {
                                doc.addPage();
                                currentY = 20;
                            }
                            
                            doc.setFontSize(10);
                            doc.setFont("helvetica", "bold");
                            const routeType = getRouteType(item);
                            const routeRegion = getRouteRegion(item);
                            doc.text(`Detail Reroute Logs - ${item.ship_name || 'Kapal'} (${routeType.toUpperCase()}, ${routeRegion.toUpperCase()})`, 14, currentY);
                            currentY += 8;
                            
                            // Header untuk detail reroute logs dengan kolom tambahan
                            const detailHeaders = ['No', 'Tanggal', 'Nama Pereroute', 'Catatan', 'Fuel Lost', 'Biaya', 'Perubahan Jarak'];
                            
                            const detailData = item.reroute_logs.map((log, logIndex) => {
                                return [
                                    logIndex + 1,
                                    log.tanggal ? new Date(log.tanggal).toLocaleDateString('id-ID') : '-',
                                    log.nama_pereroute || '-',
                                    log.reroute_reason || '-',
                                    log.fuel_lost_reroute ? parseFloat(log.fuel_lost_reroute).toFixed(2) : '0.00',
                                    log.fuel_cost ? `Rp ${parseFloat(log.fuel_cost).toLocaleString('id-ID')}` : 'Rp 0',
                                    log.perubahan_jarak ? parseFloat(log.perubahan_jarak).toFixed(2) + ' km' : '0.00 km'
                                ];
                            });
                            
                            // Buat tabel detail reroute logs
                            autoTable(doc, {
                                head: [detailHeaders],
                                body: detailData,
                                startY: currentY,
                                styles: {
                                    fontSize: 7,
                                    cellPadding: 1
                                },
                                headStyles: {
                                    fillColor: [255, 159, 64],
                                    textColor: 255,
                                    fontStyle: 'bold'
                                },
                                alternateRowStyles: {
                                    fillColor: [250, 250, 250]
                                },
                                margin: { left: 20 }
                            });
                            
                            currentY = doc.lastAutoTable.finalY + 15;
                        }
                    });
                } else {
                    // Untuk laporan fuelLost (normal)
                    const tableData = allData.map((item, index) => {
                        const routeType = getRouteType(item);
                        const routeRegion = getRouteRegion(item);
                        const rowData = [
                            routeType.toUpperCase(),
                            routeRegion.toUpperCase(),
                            ...columns.slice(1).map(col => {
                                let value = '';

                                if (col.format === 'date') {
                                    value = item[col.key] ? new Date(item[col.key]).toLocaleDateString('id-ID') : '-';
                                } else if (col.format === 'number') {
                                    value = item[col.key] ? parseFloat(item[col.key]).toFixed(2) : '0.00';
                                } else if (col.format === 'currency') {
                                    value = item[col.key] ? `Rp ${parseFloat(item[col.key]).toLocaleString('id-ID')}` : 'Rp 0';
                                } else {
                                    value = item[col.key] || '-';
                                }

                                return value;
                            })
                        ];

                        return [index + 1, ...rowData];
                    });

                    // Header tabel
                    const tableHeaders = ['No', 'Tipe', 'Region', ...columns.slice(1).map(col => col.header)];

                    // Buat tabel
                    autoTable(doc, {
                        head: [tableHeaders],
                        body: tableData,
                        startY: 35,
                        styles: {
                            fontSize: 8,
                            cellPadding: 2
                        },
                        headStyles: {
                            fillColor: [59, 130, 246],
                            textColor: 255,
                            fontStyle: 'bold'
                        },
                        alternateRowStyles: {
                            fillColor: [245, 245, 245]
                        },
                        margin: { top: 35 }
                    });
                }

                // Summary
                const finalY = doc.lastAutoTable.finalY + 10;
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.text('RINGKASAN:', 14, finalY);
                doc.setFont("helvetica", "normal");
                
                let totalPoints = 0;
                if (reportType === 'perjalanan') {
                    allData.forEach(item => {
                        totalPoints += item.monitoring_points?.length || 0;
                    });
                    doc.text(`Total Data: ${allData.length} perjalanan`, 14, finalY + 5);
                    doc.text(`Total Monitoring Points: ${totalPoints} points`, 14, finalY + 10);
                    
                    // Hitung berdasarkan tipe
                    const typeCounts = {};
                    allData.forEach(item => {
                        const type = getRouteType(item);
                        typeCounts[type] = (typeCounts[type] || 0) + 1;
                    });
                    
                    let yOffset = finalY + 15;
                    Object.entries(typeCounts).forEach(([type, count]) => {
                        const typeLabel = type === 'IPB' ? 'IPB' : 'Supply';
                        doc.text(`${typeLabel}: ${count} perjalanan`, 14, yOffset);
                        yOffset += 5;
                    });
                } else if (reportType === 'reroute') {
                    let totalRerouteLogs = 0;
                    let totalFuelLost = 0;
                    let totalCost = 0;
                    
                    allData.forEach(item => {
                        totalRerouteLogs += item.jumlah_reroute_log || 0;
                        totalFuelLost += parseFloat(item.total_fuel_lost_reroute) || 0;
                        totalCost += parseFloat(item.total_fuel_cost) || 0;
                    });
                    
                    doc.text(`Total Data: ${allData.length} rute`, 14, finalY + 5);
                    doc.text(`Total Reroute Logs: ${totalRerouteLogs} perubahan`, 14, finalY + 10);
                    doc.text(`Total Fuel Lost: ${totalFuelLost.toFixed(2)} L`, 14, finalY + 15);
                    doc.text(`Total Biaya: Rp ${totalCost.toLocaleString('id-ID')}`, 14, finalY + 20);
                    
                    // Hitung berdasarkan tipe
                    const typeCounts = {};
                    allData.forEach(item => {
                        const type = getRouteType(item);
                        typeCounts[type] = (typeCounts[type] || 0) + 1;
                    });
                    
                    let yOffset = finalY + 25;
                    Object.entries(typeCounts).forEach(([type, count]) => {
                        const typeLabel = type === 'IPB' ? 'IPB' : 'Supply';
                        doc.text(`${typeLabel}: ${count} rute`, 14, yOffset);
                        yOffset += 5;
                    });
                } else {
                    doc.text(`Total Data: ${allData.length} entri`, 14, finalY + 5);
                    
                    // Hitung berdasarkan tipe
                    const typeCounts = {};
                    allData.forEach(item => {
                        const type = getRouteType(item);
                        typeCounts[type] = (typeCounts[type] || 0) + 1;
                    });
                    
                    let yOffset = finalY + 10;
                    Object.entries(typeCounts).forEach(([type, count]) => {
                        const typeLabel = type === 'IPB' ? 'IPB' : 'Supply';
                        doc.text(`${typeLabel}: ${count} entri`, 14, yOffset);
                        yOffset += 5;
                    });
                }

                // Save PDF
                const dateStr = new Date().toISOString().split('T')[0];
                doc.save(`${filename}-${dateStr}.pdf`);

            } catch (error) {
                console.error("Error fetching data for PDF:", error);
                alert(`Gagal mengambil data untuk PDF: ${error.message}`);
            } finally {
                setLoading(prev => ({ ...prev, [reportType]: false }));
            }

        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Gagal generate file PDF");
        }
    };

    // ========== FUNGSI DOWNLOAD EXCEL ==========

    const downloadAllExcel = async (reportType, columns, filename) => {
        try {
            const workbook = new ExcelJS.Workbook();
            
            try {
                setLoading(prev => ({ ...prev, [reportType]: true }));

                const params = {};
                
                if (globalFilters.period === 'monthly') {
                    const { start, end } = getMonthRange(globalFilters.month, globalFilters.year);
                    params.startDate = start;
                    params.endDate = end;
                } else if (globalFilters.period === 'custom') {
                    if (globalFilters.startDate && globalFilters.endDate) {
                        params.startDate = formatDateToAPI(globalFilters.startDate);
                        params.endDate = formatDateToAPI(globalFilters.endDate);
                    }
                }

                // Kirim parameter type dan region ke API - type dalam format yang benar
                if (globalFilters.typeFilter !== 'all') {
                    params.type = globalFilters.typeFilter; // Sudah dalam format 'IPB' atau 'Supply'
                }
                if (globalFilters.regionFilter !== 'all') {
                    params.region = globalFilters.regionFilter;
                }

                console.log('Download Excel fetching with params:', params);

                let allData = [];

                switch (reportType) {
                    case 'fuelLost':
                        const fuelResponse = await API.get("/laporan/fuel-lost", { params });
                        if (fuelResponse.data.success === false) {
                            throw new Error(fuelResponse.data.message);
                        }
                        allData = fuelResponse.data?.data || [];
                        break;
                    case 'perjalanan':
                        const perjalananResponse = await API.get("/laporan-perjalanan", { params });
                        if (perjalananResponse.data.success === false) {
                            throw new Error(perjalananResponse.data.message);
                        }
                        allData = perjalananResponse.data?.data || [];
                        break;
                    case 'reroute':
                        const rerouteResponse = await API.get("/laporan-fuel-lost-reroute", { params });
                        if (rerouteResponse.data.success === false) {
                            throw new Error(rerouteResponse.data.message);
                        }
                        allData = rerouteResponse.data?.data || [];
                        break;
                }

                // Data khusus untuk laporan perjalanan
                if (reportType === 'perjalanan') {
                    const worksheet = workbook.addWorksheet('Laporan Perjalanan');

                    // Judul
                    worksheet.mergeCells('A1:I1');
                    worksheet.getCell('A1').value = filename;
                    worksheet.getCell('A1').font = { bold: true, size: 16 };
                    worksheet.getCell('A1').alignment = { horizontal: 'center' };

                    // Periode dan filter
                    worksheet.mergeCells('A2:I2');
                    const monthName = getMonthName(globalFilters.month);
                    let periodText = 'SEMUA DATA';
                    
                    if (globalFilters.period === 'monthly') {
                        periodText = `PERIODE: ${monthName} ${globalFilters.year}`;
                    } else if (globalFilters.period === 'custom') {
                        periodText = `PERIODE: ${globalFilters.startDate} s/d ${globalFilters.endDate}`;
                    }
                    
                    // Filter info
                    let filterInfo = '';
                    if (globalFilters.typeFilter !== 'all') {
                        const typeLabel = typeFilterConfig.find(t => t.id === globalFilters.typeFilter)?.label;
                        filterInfo += ` | Tipe: ${typeLabel}`;
                    }
                    if (globalFilters.regionFilter !== 'all') {
                        const regionLabel = regionFilterConfig.find(r => r.id === globalFilters.regionFilter)?.label;
                        filterInfo += ` | Region: ${regionLabel}`;
                    }
                    
                    worksheet.getCell('A2').value = periodText + filterInfo;
                    worksheet.getCell('A2').alignment = { horizontal: 'center' };

                    // Tanggal generate
                    worksheet.mergeCells('A3:I3');
                    worksheet.getCell('A3').value = `Tanggal Generate: ${new Date().toLocaleDateString('id-ID')}`;
                    worksheet.getCell('A3').alignment = { horizontal: 'center' };

                    // Header utama perjalanan
                    worksheet.addRow([]);
                    const mainHeaderRow = worksheet.addRow(['No', 'Nama Kapal', 'Tipe', 'Region', 'Tanggal', 'Total Points', 'Progress']);
                    
                    // Style header utama
                    mainHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
                    mainHeaderRow.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: '3B82F6' }
                    };
                    mainHeaderRow.alignment = { horizontal: 'center' };
                    mainHeaderRow.height = 20;

                    let currentRow = 6; // Mulai dari baris 6
                    
                    // Data utama perjalanan dan detail points
                    allData.forEach((item, index) => {
                        const complete = item.status_perjalanan?.complete || 0;
                        const inprogress = item.status_perjalanan?.inprogress || 0;
                        const total = complete + inprogress;
                        const percentage = total > 0 ? Math.round((complete / total) * 100) : 0;
                        const routeType = getRouteType(item);
                        const routeRegion = getRouteRegion(item);
                        
                        // Tambahkan baris utama perjalanan
                        const mainRow = worksheet.addRow([
                            index + 1,
                            item.ship_name || '-',
                            routeType.toUpperCase(),
                            routeRegion.toUpperCase(),
                            item.tanggal_keberangkatan ? new Date(item.tanggal_keberangkatan).toLocaleDateString('id-ID') : '-',
                            item.monitoring_points?.length || 0,
                            `${complete}/${total} (${percentage}%)`
                        ]);
                        
                        // Bold baris utama
                        mainRow.font = { bold: true };
                        
                        // Tambahkan detail monitoring points
                        if (item.monitoring_points && item.monitoring_points.length > 0) {
                            // Tambahkan header detail
                            const detailHeaderRow = worksheet.addRow(['', 'Detail Monitoring Points:', '', '', '', '', '']);
                            detailHeaderRow.font = { bold: true, italic: true };
                            
                            // Header tabel detail
                            const pointHeaderRow = worksheet.addRow(['', 'No', 'Nama Point', 'Tipe', 'Status', 'Priority', 'Rencana', 'Aktual']);
                            pointHeaderRow.font = { bold: true };
                            pointHeaderRow.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'E8F4FD' }
                            };
                            
                            // Data detail points
                            item.monitoring_points.forEach((point, pointIndex) => {
                                const detailRow = worksheet.addRow([
                                    '',
                                    pointIndex + 1,
                                    point.point_name || '-',
                                    point.point_type || '-',
                                    point.status || '-',
                                    point.priority_level || '-',
                                    point.planned_timestamp ? formatDateTimeForDisplay(point.planned_timestamp) : '-',
                                    point.actual_timestamp ? formatDateTimeForDisplay(point.actual_timestamp) : '-'
                                ]);
                                
                                // Warna bergantian untuk detail rows
                                if (pointIndex % 2 === 0) {
                                    detailRow.fill = {
                                        type: 'pattern',
                                        pattern: 'solid',
                                        fgColor: { argb: 'F8F9FA' }
                                    };
                                }
                            });
                            
                            // Tambahkan baris kosong setelah detail points
                            worksheet.addRow([]);
                        }
                    });

                    // Set column widths
                    worksheet.columns = [
                        { width: 8 },  // No
                        { width: 20 }, // Nama Kapal
                        { width: 10 }, // Tipe
                        { width: 12 }, // Region
                        { width: 15 }, // Tanggal
                        { width: 12 }, // Total Points
                        { width: 15 }  // Progress
                    ];

                    // Summary
                    let totalPoints = 0;
                    allData.forEach(item => {
                        totalPoints += item.monitoring_points?.length || 0;
                    });
                    
                    const summaryRow1 = worksheet.addRow(['RINGKASAN:', '', '', '', '', '', '']);
                    summaryRow1.font = { bold: true };
                    
                    const summaryRow2 = worksheet.addRow(['Total Perjalanan:', '', '', '', '', allData.length, '']);
                    summaryRow2.font = { bold: true };
                    
                    const summaryRow3 = worksheet.addRow(['Total Monitoring Points:', '', '', '', '', totalPoints, '']);
                    summaryRow3.font = { bold: true };
                    
                    // Hitung berdasarkan tipe
                    const typeCounts = {};
                    allData.forEach(item => {
                        const type = getRouteType(item);
                        typeCounts[type] = (typeCounts[type] || 0) + 1;
                    });
                    
                    let summaryRowNum = 4;
                    Object.entries(typeCounts).forEach(([type, count]) => {
                        const typeLabel = type === 'IPB' ? 'IPB' : 'Supply';
                        const summaryRow = worksheet.addRow([`${typeLabel}:`, '', '', '', '', count, '']);
                        summaryRow.font = { bold: true };
                        summaryRowNum++;
                    });

                } else if (reportType === 'reroute') {
                    // Data khusus untuk laporan reroute
                    const worksheet = workbook.addWorksheet('Laporan Reroute');

                    // Judul
                    worksheet.mergeCells('A1:K1');
                    worksheet.getCell('A1').value = filename;
                    worksheet.getCell('A1').font = { bold: true, size: 16 };
                    worksheet.getCell('A1').alignment = { horizontal: 'center' };

                    // Periode dan filter
                    worksheet.mergeCells('A2:K2');
                    const monthName = getMonthName(globalFilters.month);
                    let periodText = 'SEMUA DATA';
                    
                    if (globalFilters.period === 'monthly') {
                        periodText = `PERIODE: ${monthName} ${globalFilters.year}`;
                    } else if (globalFilters.period === 'custom') {
                        periodText = `PERIODE: ${globalFilters.startDate} s/d ${globalFilters.endDate}`;
                    }
                    
                    // Filter info
                    let filterInfo = '';
                    if (globalFilters.typeFilter !== 'all') {
                        const typeLabel = typeFilterConfig.find(t => t.id === globalFilters.typeFilter)?.label;
                        filterInfo += ` | Tipe: ${typeLabel}`;
                    }
                    if (globalFilters.regionFilter !== 'all') {
                        const regionLabel = regionFilterConfig.find(r => r.id === globalFilters.regionFilter)?.label;
                        filterInfo += ` | Region: ${regionLabel}`;
                    }
                    
                    worksheet.getCell('A2').value = periodText + filterInfo;
                    worksheet.getCell('A2').alignment = { horizontal: 'center' };

                    // Tanggal generate
                    worksheet.mergeCells('A3:K3');
                    worksheet.getCell('A3').value = `Tanggal Generate: ${new Date().toLocaleDateString('id-ID')}`;
                    worksheet.getCell('A3').alignment = { horizontal: 'center' };

                    // Header utama reroute dengan kolom tambahan
                    worksheet.addRow([]);
                    const mainHeaderRow = worksheet.addRow([
                        'No', 'Nama Kapal', 'Tipe', 'Region', 'Tanggal', 'Jumlah Reroute', 
                        'Total Fuel Lost', 'Total Biaya', 'Perubahan Jarak', 'Nama Pereroute', 'Catatan'
                    ]);
                    
                    // Style header utama
                    mainHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
                    mainHeaderRow.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF9F40' }
                    };
                    mainHeaderRow.alignment = { horizontal: 'center' };
                    mainHeaderRow.height = 20;

                    let currentRow = 6; // Mulai dari baris 6
                    
                    // Data utama reroute dan detail logs
                    allData.forEach((item, index) => {
                        const routeType = getRouteType(item);
                        const routeRegion = getRouteRegion(item);
                        
                        // Tambahkan baris utama reroute
                        const mainRow = worksheet.addRow([
                            index + 1,
                            item.ship_name || '-',
                            routeType.toUpperCase(),
                            routeRegion.toUpperCase(),
                            item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-',
                            item.jumlah_reroute_log || 0,
                            item.total_fuel_lost_reroute || 0,
                            item.total_fuel_cost || 0,
                            item.total_perubahan_jarak || 0,
                            item.nama_pereroute || '-',
                            item.reroute_reason || '-'
                        ]);
                        
                        // Bold baris utama
                        mainRow.font = { bold: true };
                        
                        // Tambahkan detail reroute logs
                        if (item.reroute_logs && item.reroute_logs.length > 0) {
                            // Tambahkan header detail
                            const detailHeaderRow = worksheet.addRow(['', 'Detail Reroute Logs:', '', '', '', '', '', '', '', '', '']);
                            detailHeaderRow.font = { bold: true, italic: true };
                            
                            // Header tabel detail
                            const logHeaderRow = worksheet.addRow(['', 'No', 'Tanggal', 'Nama Pereroute', 'Catatan', 'Fuel Lost', 'Biaya', 'Perubahan Jarak']);
                            logHeaderRow.font = { bold: true };
                            logHeaderRow.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFF0E6' }
                            };
                            
                            // Data detail logs
                            item.reroute_logs.forEach((log, logIndex) => {
                                const detailRow = worksheet.addRow([
                                    '',
                                    logIndex + 1,
                                    log.tanggal ? new Date(log.tanggal).toLocaleDateString('id-ID') : '-',
                                    log.nama_pereroute || '-',
                                    log.reroute_reason || '-',
                                    log.fuel_lost_reroute || 0,
                                    log.fuel_cost || 0,
                                    log.perubahan_jarak || 0
                                ]);
                                
                                // Warna bergantian untuk detail rows
                                if (logIndex % 2 === 0) {
                                    detailRow.fill = {
                                        type: 'pattern',
                                        pattern: 'solid',
                                        fgColor: { argb: 'F8F9FA' }
                                    };
                                }
                            });
                            
                            // Tambahkan baris kosong setelah detail logs
                            worksheet.addRow([]);
                        }
                    });

                    // Set column widths
                    worksheet.columns = [
                        { width: 8 },   // No
                        { width: 20 },  // Nama Kapal
                        { width: 10 },  // Tipe
                        { width: 12 },  // Region
                        { width: 15 },  // Tanggal
                        { width: 15 },  // Jumlah Reroute
                        { width: 15 },  // Total Fuel Lost
                        { width: 15 },  // Total Biaya
                        { width: 15 },  // Perubahan Jarak
                        { width: 20 },  // Nama Pereroute
                        { width: 25 }   // Catatan
                    ];

                    // Format number columns
                    const numberColumns = ['G', 'H', 'I']; // Fuel Lost, Biaya, Perubahan Jarak
                    numberColumns.forEach(col => {
                        worksheet.getColumn(col).numFmt = '#,##0.00';
                    });

                    // Summary
                    let totalRerouteLogs = 0;
                    let totalFuelLost = 0;
                    let totalCost = 0;
                    
                    allData.forEach(item => {
                        totalRerouteLogs += item.jumlah_reroute_log || 0;
                        totalFuelLost += parseFloat(item.total_fuel_lost_reroute) || 0;
                        totalCost += parseFloat(item.total_fuel_cost) || 0;
                    });
                    
                    const summaryRow1 = worksheet.addRow(['RINGKASAN:', '', '', '', '', '', '', '', '', '', '']);
                    summaryRow1.font = { bold: true };
                    
                    const summaryRow2 = worksheet.addRow(['Total Rute:', '', '', '', '', allData.length, '', '', '', '', '']);
                    summaryRow2.font = { bold: true };
                    
                    const summaryRow3 = worksheet.addRow(['Total Reroute Logs:', '', '', '', '', totalRerouteLogs, '', '', '', '', '']);
                    summaryRow3.font = { bold: true };
                    
                    const summaryRow4 = worksheet.addRow(['Total Fuel Lost:', '', '', '', '', totalFuelLost, '', '', '', '', '']);
                    summaryRow4.font = { bold: true };
                    
                    const summaryRow5 = worksheet.addRow(['Total Biaya:', '', '', '', '', totalCost, '', '', '', '', '']);
                    summaryRow5.font = { bold: true };
                    
                    // Hitung berdasarkan tipe
                    const typeCounts = {};
                    allData.forEach(item => {
                        const type = getRouteType(item);
                        typeCounts[type] = (typeCounts[type] || 0) + 1;
                    });
                    
                    let summaryRowNum = 6;
                    Object.entries(typeCounts).forEach(([type, count]) => {
                        const typeLabel = type === 'IPB' ? 'IPB' : 'Supply';
                        const summaryRow = worksheet.addRow([`${typeLabel}:`, '', '', '', '', count, '', '', '', '', '']);
                        summaryRow.font = { bold: true };
                        summaryRowNum++;
                    });

                } else {
                    // Untuk laporan fuelLost (normal)
                    const worksheet = workbook.addWorksheet('Laporan');

                    // Judul
                    worksheet.mergeCells('A1:J1');
                    worksheet.getCell('A1').value = filename;
                    worksheet.getCell('A1').font = { bold: true, size: 16 };
                    worksheet.getCell('A1').alignment = { horizontal: 'center' };

                    // Periode dan filter
                    worksheet.mergeCells('A2:J2');
                    const monthName = getMonthName(globalFilters.month);
                    let periodText = 'SEMUA DATA';
                    
                    if (globalFilters.period === 'monthly') {
                        periodText = `PERIODE: ${monthName} ${globalFilters.year}`;
                    } else if (globalFilters.period === 'custom') {
                        periodText = `PERIODE: ${globalFilters.startDate} s/d ${globalFilters.endDate}`;
                    }
                    
                    // Filter info
                    let filterInfo = '';
                    if (globalFilters.typeFilter !== 'all') {
                        const typeLabel = typeFilterConfig.find(t => t.id === globalFilters.typeFilter)?.label;
                        filterInfo += ` | Tipe: ${typeLabel}`;
                    }
                    if (globalFilters.regionFilter !== 'all') {
                        const regionLabel = regionFilterConfig.find(r => r.id === globalFilters.regionFilter)?.label;
                        filterInfo += ` | Region: ${regionLabel}`;
                    }
                    
                    worksheet.getCell('A2').value = periodText + filterInfo;
                    worksheet.getCell('A2').alignment = { horizontal: 'center' };

                    // Tanggal generate
                    worksheet.mergeCells('A3:J3');
                    worksheet.getCell('A3').value = `Tanggal Generate: ${new Date().toLocaleDateString('id-ID')}`;
                    worksheet.getCell('A3').alignment = { horizontal: 'center' };

                    // Header tabel dengan tambahan kolom Tipe dan Region
                    worksheet.addRow([]);
                    const headerRow = worksheet.addRow(['No', 'Tipe', 'Region', ...columns.map(col => col.header)]);

                    // Style header
                    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
                    headerRow.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: '3B82F6' }
                    };
                    headerRow.alignment = { horizontal: 'center' };
                    headerRow.height = 20;

                    // Data rows
                    allData.forEach((item, index) => {
                        const routeType = getRouteType(item);
                        const routeRegion = getRouteRegion(item);
                        
                        const rowData = [
                            routeType.toUpperCase(),
                            routeRegion.toUpperCase(),
                            ...columns.map(col => {
                                if (col.format === 'date') {
                                    return item[col.key] ? new Date(item[col.key]).toLocaleDateString('id-ID') : '-';
                                }
                                if (col.format === 'number') {
                                    return item[col.key] || 0;
                                }
                                if (col.format === 'currency') {
                                    return item[col.key] || 0;
                                }
                                return item[col.key] || '-';
                            })
                        ];
                        worksheet.addRow([index + 1, ...rowData]);
                    });

                    // Set column widths
                    const colWidths = [8, 10, 12]; // No, Tipe, Region
                    columns.forEach(col => {
                        colWidths.push(col.width || 20);
                    });
                    
                    worksheet.columns = colWidths.map(width => ({ width }));

                    // Format number cells
                    for (let i = 0; i < allData.length; i++) {
                        // Skip kolom No, Tipe, Region
                        columns.forEach((col, colIndex) => {
                            const cell = worksheet.getCell(i + 6, colIndex + 4); // Offset untuk kolom tambahan
                            if (col.format === 'currency') {
                                cell.numFmt = '"Rp" #,##0';
                            } else if (col.format === 'number') {
                                cell.numFmt = '0.00';
                            }
                        });
                    }

                    // Summary
                    const summaryRow1 = worksheet.addRow(['RINGKASAN:', '', '', '', '', '', '', '', '', '']);
                    summaryRow1.font = { bold: true };
                    
                    const summaryRow2 = worksheet.addRow(['Total Data:', '', '', '', '', allData.length, '', '', '', '']);
                    summaryRow2.getCell(2).font = { bold: true };
                    
                    // Hitung berdasarkan tipe
                    const typeCounts = {};
                    allData.forEach(item => {
                        const type = getRouteType(item);
                        typeCounts[type] = (typeCounts[type] || 0) + 1;
                    });
                    
                    let summaryRowNum = 3;
                    Object.entries(typeCounts).forEach(([type, count]) => {
                        const typeLabel = type === 'IPB' ? 'IPB' : 'Supply';
                        const summaryRow = worksheet.addRow([`${typeLabel}:`, '', '', '', '', count, '', '', '', '']);
                        summaryRow.font = { bold: true };
                        summaryRowNum++;
                    });
                }

                // Download file
                const buffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob([buffer], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                
                const dateStr = new Date().toISOString().split('T')[0];
                link.setAttribute('download', `${filename}-${dateStr}.xlsx`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);

            } catch (error) {
                console.error("Error fetching data for Excel:", error);
                alert(`Gagal mengambil data untuk Excel: ${error.message}`);
            } finally {
                setLoading(prev => ({ ...prev, [reportType]: false }));
            }

        } catch (error) {
            console.error("Error generating Excel:", error);
            alert("Gagal generate file Excel");
        }
    };

    // ========== HANDLERS ==========

    const handleGlobalFilterChange = (field, value) => {
        setGlobalFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSearchAllData = async () => {
        await Promise.all([
            fetchFuelLostReport(),
            fetchPerjalananReport(),
            fetchRerouteReport()
        ]);
    };

    const handleResetAllFilters = () => {
        const now = new Date();
        setGlobalFilters({
            period: 'monthly',
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            startDate: '',
            endDate: '',
            typeFilter: 'all',
            regionFilter: 'all'
        });
        setShowAdvancedFilter(false);

        setTimeout(() => {
            handleSearchAllData();
        }, 100);
    };

    const handleApplyAdvancedFilters = () => {
        handleSearchAllData();
        setShowAdvancedFilter(false);
    };

    // ========== USE EFFECT ==========

    useEffect(() => {
        handleSearchAllData();
    }, []);

    // ========== HELPER FUNCTIONS ==========

    const getMonthName = (monthNumber) => {
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return months[monthNumber - 1] || '';
    };

    // Toggle expanded row untuk monitoring points
    const toggleRowExpansion = (index) => {
        setExpandedRows(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    // Toggle expanded row untuk reroute logs
    const toggleRerouteExpansion = (index) => {
        setExpandedRows(prev => ({
            ...prev,
            [`reroute-${index}`]: !prev[`reroute-${index}`]
        }));
    };

    // Komponen untuk menampilkan monitoring points
    const MonitoringPointsDetail = ({ points }) => {
        const formatDateTime = (dateString) => {
            if (!dateString) return '-';
            try {
                const date = new Date(dateString);
                return date.toLocaleString('id-ID', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (error) {
                return '-';
            }
        };

        return (
            <div className="bg-gray-50 p-4 rounded-lg mt-2">
                <h4 className="font-semibold text-sm text-gray-700 mb-3">Detail Monitoring Points:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {points.map((point, index) => (
                        <div key={index} className="bg-white p-3 rounded border border-gray-200">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${point.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    point.status === 'inprogress' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                    {point.status}
                                </span>
                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${point.priority_level === 'urgent' ? 'bg-red-100 text-red-800' :
                                    'bg-blue-100 text-blue-800'
                                    }`}>
                                    {point.priority_level}
                                </span>
                            </div>
                            <p className="font-medium text-sm text-gray-900">{point.point_name}</p>
                            <p className="text-xs text-gray-600 mt-1">Tipe: {point.point_type}</p>
                            <p className="text-xs text-gray-600">
                                Rencana: {formatDateTime(point.planned_timestamp)}
                            </p>
                            <p className="text-xs text-gray-600">
                                Aktual: {formatDateTime(point.actual_timestamp)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Komponen untuk menampilkan reroute logs (DIPERBARUI DENGAN KOLOM TAMBAHAN)
    const RerouteLogsDetail = ({ logs }) => {
        const formatCurrency = (value) => {
            if (!value && value !== 0) return 'Rp 0';
            const numValue = parseFloat(value);
            if (isNaN(numValue)) return 'Rp 0';
            return `Rp ${numValue.toLocaleString('id-ID', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            })}`;
        };

        return (
            <div className="bg-gray-50 p-4 rounded-lg mt-2">
                <h4 className="font-semibold text-sm text-gray-700 mb-3">Detail Reroute Logs:</h4>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    No
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    Tanggal
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    Nama Pereroute
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    Catatan
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    Fuel Lost (L)
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    Biaya (Rp)
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    Perubahan Jarak (km)
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {logs.map((log, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                        {index + 1}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                        {formatDateTimeForDisplay(log.tanggal)}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center">
                                            <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                                            <span>{log.nama_pereroute || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-sm text-gray-500">
                                        <div className="flex items-start">
                                            <DocumentTextIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                                            <span className="break-words">{log.reroute_reason || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                        {log.fuel_lost_reroute ? parseFloat(log.fuel_lost_reroute).toFixed(2) : '0.00'}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                        {formatCurrency(log.fuel_cost)}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                        {log.perubahan_jarak ? parseFloat(log.perubahan_jarak).toFixed(2) : '0.00'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // ========== KOLOM UNTUK DOWNLOAD ==========
    const fuelLostColumns = [
        { key: 'ship_name', header: 'Nama Kapal', width: 20 },
        { key: 'nama_rute', header: 'Rute', width: 25 },
        { key: 'tanggal_keberangkatan', header: 'Tanggal', format: 'date', width: 15 },
        { key: 'fuel_type', header: 'Jenis Fuel', width: 15 },
        { key: 'los_fuel_summary', header: 'Fuel Lost (L)', format: 'number', width: 12 },
        { key: 'total_lost_value', header: 'Kerugian (Rp)', format: 'currency', width: 15 },
        { key: 'status', header: 'Status', width: 12 }
    ];

    const perjalananColumns = [
        { key: 'ship_name', header: 'Nama Kapal', width: 20 },
        { key: 'tanggal_keberangkatan', header: 'Tanggal', format: 'date', width: 15 },
        { key: 'monitoring_points', header: 'Total Points', width: 12 },
        { key: 'status_perjalanan', header: 'Progress', width: 15 }
    ];

    // KOLOM REROUTE DIPERBARUI DENGAN KOLOM TAMBAHAN
    const rerouteColumns = [
        { key: 'ship_name', header: 'Nama Kapal', width: 20 },
        { key: 'tanggal', header: 'Tanggal', format: 'date', width: 15 },
        { key: 'jumlah_reroute_log', header: 'Jumlah Reroute', width: 15 },
        { key: 'total_fuel_lost_reroute', header: 'Total Fuel Lost', format: 'number', width: 15 },
        { key: 'total_fuel_cost', header: 'Total Biaya', format: 'currency', width: 15 },
        { key: 'total_perubahan_jarak', header: 'Perubahan Jarak', format: 'number', width: 15 },
        { key: 'nama_pereroute', header: 'Nama Pereroute', width: 20 },
        { key: 'reroute_reason', header: 'Catatan', width: 25 }
    ];

    // ========== KOMPONEN UTAMA ==========

    const AdvancedFilterPanel = () => {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Filter Lanjutan</h3>
                    <button
                        onClick={() => setShowAdvancedFilter(false)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Type Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipe Perjalanan
                        </label>
                        <div className="flex flex-col gap-2">
                            {typeFilterConfig.map((type) => {
                                const isActive = globalFilters.typeFilter === type.id;
                                const colors = getTypeColorClasses(type.id);
                                return (
                                    <button
                                        key={type.id}
                                        onClick={() => handleGlobalFilterChange("typeFilter", type.id)}
                                        className={`flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${
                                            isActive 
                                                ? `${colors.bg} ${colors.border} ${colors.text} font-medium`
                                                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                                        }`}
                                    >
                                        <span>{type.label}</span>
                                        {isActive && (
                                            <div className={`w-2 h-2 rounded-full ${colors.bg.replace('50', '500')}`}></div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Region Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Region IPB
                        </label>
                        <div className="flex flex-col gap-2">
                            {regionFilterConfig.map((region) => {
                                const isActive = globalFilters.regionFilter === region.id;
                                const colors = getRegionColorClasses(region.id);
                                return (
                                    <button
                                        key={region.id}
                                        onClick={() => handleGlobalFilterChange("regionFilter", region.id)}
                                        className={`flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${
                                            isActive 
                                                ? `${colors.bg} ${colors.border} ${colors.text} font-medium`
                                                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                                        }`}
                                    >
                                        <span>{region.label}</span>
                                        {isActive && (
                                            <div className={`w-2 h-2 rounded-full ${colors.bg.replace('50', '500')}`}></div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col justify-end gap-3">
                        <button
                            onClick={handleApplyAdvancedFilters}
                            className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
                        >
                            <FunnelIcon className="h-5 w-5 mr-2" />
                            Terapkan Filter
                        </button>
                        <button
                            onClick={() => {
                                handleGlobalFilterChange("typeFilter", "all");
                                handleGlobalFilterChange("regionFilter", "all");
                            }}
                            className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-200 transition-all"
                        >
                            Reset Filter Ini
                        </button>
                    </div>
                </div>

                {/* Active Filters Summary */}
                {(globalFilters.typeFilter !== "all" || globalFilters.regionFilter !== "all") && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Filter Aktif:</h4>
                        <div className="flex flex-wrap gap-2">
                            {globalFilters.typeFilter !== "all" && (
                                <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                                    Tipe: {typeFilterConfig.find(t => t.id === globalFilters.typeFilter)?.label}
                                    <button onClick={() => handleGlobalFilterChange("typeFilter", "all")} className="ml-2 text-purple-500 hover:text-purple-700">
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                </span>
                            )}
                            {globalFilters.regionFilter !== "all" && (
                                <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                                    Region: {regionFilterConfig.find(r => r.id === globalFilters.regionFilter)?.label}
                                    <button onClick={() => handleGlobalFilterChange("regionFilter", "all")} className="ml-2 text-green-500 hover:text-green-700">
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const GlobalFilter = () => {
        const isLoading = loading.fuelLost || loading.perjalanan || loading.reroute;
        const monthName = getMonthName(globalFilters.month);
        const hasActiveFilters = globalFilters.typeFilter !== "all" || globalFilters.regionFilter !== "all";

        return (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                        <FunnelIcon className="h-6 w-6 text-blue-500 mr-3" />
                        Filter Laporan
                    </h3>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg hover:from-gray-900 hover:to-black transition-all shadow-md text-sm"
                        >
                            <BuildingStorefrontIcon className="h-4 w-4" />
                            {showAdvancedFilter ? "Sembunyikan Filter" : "Filter Lanjutan"}
                            {hasActiveFilters && (
                                <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                    Filter Aktif
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {showAdvancedFilter && <AdvancedFilterPanel />}

                <div className="flex flex-col sm:flex-row gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Periode</label>
                            <select
                                value={globalFilters.period}
                                onChange={(e) => handleGlobalFilterChange("period", e.target.value)}
                                className="w-full px-3 py-2 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            >
                                <option value="monthly">Bulanan</option>
                                <option value="custom">Custom Date</option>
                            </select>
                        </div>

                        {globalFilters.period === "monthly" ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
                                    <select
                                        value={globalFilters.month}
                                        onChange={(e) => handleGlobalFilterChange("month", parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>
                                                {getMonthName(i + 1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                                    <input
                                        type="number"
                                        value={globalFilters.year}
                                        onChange={(e) => handleGlobalFilterChange("year", parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        placeholder="Tahun"
                                        min="2000"
                                        max="2030"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tanggal Mulai
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={globalFilters.startDate}
                                            onChange={(e) => handleGlobalFilterChange("startDate", e.target.value)}
                                            className="w-full px-3 py-2 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        />
                                        <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tanggal Akhir
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={globalFilters.endDate}
                                            onChange={(e) => handleGlobalFilterChange("endDate", e.target.value)}
                                            className="w-full px-3 py-2 border bg-white text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        />
                                        <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </>
                        )}

                        <div></div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 justify-center items-center">
                        <div>
                            <button
                                onClick={handleSearchAllData}
                                disabled={isLoading}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center text-sm h-10"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        <span>Memuat semua data...</span>
                                    </>
                                ) : (
                                    <>
                                        <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                                        <span>Cari Semua Data</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <div>
                            <button
                                onClick={handleResetAllFilters}
                                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center justify-center text-sm h-10"
                            >
                                Reset Semua Filter
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <strong>Filter Aktif:</strong>
                        {globalFilters.period === 'monthly' &&
                            ` Periode: ${monthName} ${globalFilters.year}`}
                        {globalFilters.period === 'custom' &&
                            ` Custom: ${globalFilters.startDate} s/d ${globalFilters.endDate}`}
                        {globalFilters.typeFilter !== 'all' &&
                            ` | Tipe: ${typeFilterConfig.find(t => t.id === globalFilters.typeFilter)?.label}`}
                        {globalFilters.regionFilter !== 'all' &&
                            ` | Region: ${regionFilterConfig.find(r => r.id === globalFilters.regionFilter)?.label}`}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                        Filter ini berlaku untuk ketiga tabel di bawah (Fuel Lost, Perjalanan, dan Reroute)
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                        Parameter yang dikirim ke API: startDate, endDate, type, region
                    </p>
                    <p className="text-xs text-blue-600 mt-1 font-medium">
                        Note: Type harus dalam format 'IPB' atau 'Supply' (huruf kapital)
                    </p>
                </div>
            </div>
        );
    };

    // ========== KOMPONEN TABEL FUEL LOST ==========
    const FuelLostTable = () => {
        const formatCurrency = (value) => {
            if (!value && value !== 0) return 'Rp 0';
            const numValue = parseFloat(value);
            if (isNaN(numValue)) return 'Rp 0';
            return `Rp ${numValue.toLocaleString('id-ID', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        };

        const paginatedData = getPaginatedData(fuelLostData, 'fuelLost');

        return (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                        <FunnelIcon className="h-6 w-6 text-red-500 mr-3" />
                        Laporan Fuel Lost
                    </h3>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            {fuelLostData.length} Data
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => downloadAllPDF('fuelLost', fuelLostColumns, "Laporan Fuel Lost")}
                                disabled={loading.fuelLost}
                                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center text-sm"
                            >
                                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                                PDF
                            </button>
                            <button
                                onClick={() => downloadAllExcel('fuelLost', fuelLostColumns, "Laporan Fuel Lost")}
                                disabled={loading.fuelLost}
                                className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center text-sm"
                            >
                                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                                Excel
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    No
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nama Kapal
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipe
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Region
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rute
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tanggal
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Jenis Fuel
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fuel Lost (L)
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Kerugian (Rp)
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedData.map((item, index) => {
                                const globalIndex = (pagination.fuelLost.currentPage - 1) * pagination.fuelLost.itemsPerPage + index;
                                const routeType = getRouteType(item);
                                const routeRegion = getRouteRegion(item);
                                
                                return (
                                    <tr key={globalIndex} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {globalIndex + 1}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {item.ship_name || '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                routeType === 'IPB' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                            }`}>
                                                {routeType.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                routeRegion === 'north' ? 'bg-blue-100 text-blue-800' :
                                                routeRegion === 'south' ? 'bg-green-100 text-green-800' :
                                                routeRegion === 'central' ? 'bg-orange-100 text-orange-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {routeRegion.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {item.nama_rute || '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {formatDateForDisplay(item.tanggal_keberangkatan)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {item.fuel_type || '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {item.los_fuel_summary ? parseFloat(item.los_fuel_summary).toFixed(2) : '0.00'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {formatCurrency(item.total_lost_value)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {item.status || '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                            {paginatedData.length === 0 && !loading.fuelLost && (
                                <tr>
                                    <td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-500">
                                        <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                        <p>Tidak ada data laporan fuel lost</p>
                                        <p className="text-xs mt-1">Data akan ditampilkan sesuai dengan filter yang diterapkan</p>
                                    </td>
                                </tr>
                            )}
                            {loading.fuelLost && (
                                <tr>
                                    <td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-500">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                                        <p className="mt-2">Memuat data...</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {renderPagination('fuelLost', fuelLostData.length)}
            </div>
        );
    };

    // ========== KOMPONEN TABEL PERJALANAN (DENGAN DROPDOWN) ==========
    const PerjalananTable = () => {
        const getProgress = (item) => {
            const complete = item.status_perjalanan?.complete || 0;
            const inprogress = item.status_perjalanan?.inprogress || 0;
            const total = complete + inprogress;
            const percentage = total > 0 ? Math.round((complete / total) * 100) : 0;
            return `${complete}/${total} (${percentage}%)`;
        };

        const getPointsSummary = (item) => {
            const points = item.monitoring_points || [];
            if (points.length === 0) return '-';
            const firstTwo = points.slice(0, 2).map(p => p.point_name).join(', ');
            return points.length > 2 ? `${firstTwo}...` : firstTwo;
        };

        const paginatedData = getPaginatedData(perjalananData, 'perjalanan');

        return (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                        <GlobeAsiaAustraliaIcon className="h-6 w-6 text-blue-500 mr-3" />
                        Laporan Perjalanan
                    </h3>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            {perjalananData.length} Data
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => downloadAllPDF('perjalanan', perjalananColumns, "Laporan Perjalanan")}
                                disabled={loading.perjalanan}
                                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center text-sm"
                            >
                                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                                PDF
                            </button>
                            <button
                                onClick={() => downloadAllExcel('perjalanan', perjalananColumns, "Laporan Perjalanan")}
                                disabled={loading.perjalanan}
                                className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center text-sm"
                            >
                                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                                Excel
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                                    {/* Empty for expand button */}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    No
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nama Kapal
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipe
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Region
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tanggal
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Points
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Progress
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Detail Points
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedData.map((item, index) => {
                                const globalIndex = (pagination.perjalanan.currentPage - 1) * pagination.perjalanan.itemsPerPage + index;
                                const routeType = getRouteType(item);
                                const routeRegion = getRouteRegion(item);
                                
                                return (
                                    <React.Fragment key={globalIndex}>
                                        <tr className="hover:bg-gray-50">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {item.monitoring_points && item.monitoring_points.length > 0 && (
                                                    <button
                                                        onClick={() => toggleRowExpansion(globalIndex)}
                                                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                                                        title={expandedRows[globalIndex] ? "Tutup detail" : "Lihat detail points"}
                                                    >
                                                        {expandedRows[globalIndex] ? (
                                                            <ChevronUpIcon className="h-4 w-4 text-gray-600" />
                                                        ) : (
                                                            <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                                                        )}
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                {globalIndex + 1}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                {item.ship_name || '-'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    routeType === 'IPB' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {routeType.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    routeRegion === 'north' ? 'bg-blue-100 text-blue-800' :
                                                    routeRegion === 'south' ? 'bg-green-100 text-green-800' :
                                                    routeRegion === 'central' ? 'bg-orange-100 text-orange-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {routeRegion.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                {formatDateForDisplay(item.tanggal_keberangkatan)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                {item.monitoring_points?.length || 0}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                {getProgress(item)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                                                {getPointsSummary(item)}
                                            </td>
                                        </tr>
                                        {expandedRows[globalIndex] && item.monitoring_points && item.monitoring_points.length > 0 && (
                                            <tr>
                                                <td colSpan={9} className="px-4 py-3 bg-gray-50">
                                                    <MonitoringPointsDetail points={item.monitoring_points} />
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                            {paginatedData.length === 0 && !loading.perjalanan && (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500">
                                        <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                        <p>Tidak ada data laporan perjalanan</p>
                                        <p className="text-xs mt-1">Data akan ditampilkan sesuai dengan filter yang diterapkan</p>
                                    </td>
                                </tr>
                            )}
                            {loading.perjalanan && (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                                        <p className="mt-2">Memuat data...</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {renderPagination('perjalanan', perjalananData.length)}
            </div>
        );
    };

    // ========== KOMPONEN TABEL REROUTE (DIPERBARUI DENGAN KOLOM TAMBAHAN) ==========
    const RerouteTable = () => {
        const formatCurrency = (value) => {
            if (!value && value !== 0) return 'Rp 0';
            const numValue = parseFloat(value);
            if (isNaN(numValue)) return 'Rp 0';
            return `Rp ${numValue.toLocaleString('id-ID', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            })}`;
        };

        const getRerouteSummary = (item) => {
            const logs = item.reroute_logs || [];
            if (logs.length === 0) return '-';
            const firstTwo = logs.slice(0, 2).map(log => {
                const name = log.nama_pereroute || '-';
                return name.length > 15 ? name.substring(0, 15) + '...' : name;
            }).join(', ');
            return logs.length > 2 ? `${firstTwo}...` : firstTwo;
        };

        const paginatedData = getPaginatedData(rerouteData, 'reroute');

        return (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                        <ArrowsRightLeftIcon className="h-6 w-6 text-orange-500 mr-3" />
                        Laporan Fuel Lost Reroute
                    </h3>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            {rerouteData.length} Data
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => downloadAllPDF('reroute', rerouteColumns, "Laporan Fuel Lost Reroute")}
                                disabled={loading.reroute}
                                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center text-sm"
                            >
                                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                                PDF
                            </button>
                            <button
                                onClick={() => downloadAllExcel('reroute', rerouteColumns, "Laporan Fuel Lost Reroute")}
                                disabled={loading.reroute}
                                className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center text-sm"
                            >
                                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                                Excel
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                                    {/* Empty for expand button */}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    No
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nama Kapal
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipe
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Region
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tanggal
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Jumlah Reroute
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Fuel Lost
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Biaya
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Perubahan Jarak
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nama Pereroute
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Catatan
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Detail Reroute
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedData.map((item, index) => {
                                const globalIndex = (pagination.reroute.currentPage - 1) * pagination.reroute.itemsPerPage + index;
                                const routeType = getRouteType(item);
                                const routeRegion = getRouteRegion(item);
                                
                                return (
                                    <React.Fragment key={globalIndex}>
                                        <tr className="hover:bg-gray-50">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {item.reroute_logs && item.reroute_logs.length > 0 && (
                                                    <button
                                                        onClick={() => toggleRerouteExpansion(globalIndex)}
                                                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                                                        title={expandedRows[`reroute-${globalIndex}`] ? "Tutup detail" : "Lihat detail reroute"}
                                                    >
                                                        {expandedRows[`reroute-${globalIndex}`] ? (
                                                            <ChevronUpIcon className="h-4 w-4 text-gray-600" />
                                                        ) : (
                                                            <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                                                        )}
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                {globalIndex + 1}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                {item.ship_name || '-'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    routeType === 'IPB' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {routeType.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    routeRegion === 'north' ? 'bg-blue-100 text-blue-800' :
                                                    routeRegion === 'south' ? 'bg-green-100 text-green-800' :
                                                    routeRegion === 'central' ? 'bg-orange-100 text-orange-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {routeRegion.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                {formatDateTimeForDisplay(item.tanggal)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {item.jumlah_reroute_log || 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${parseFloat(item.total_fuel_lost_reroute) > 10 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {item.total_fuel_lost_reroute ? parseFloat(item.total_fuel_lost_reroute).toFixed(2) : '0.00'} L
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                {formatCurrency(item.total_fuel_cost)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                {item.total_perubahan_jarak ? `${parseFloat(item.total_perubahan_jarak).toFixed(2)} km` : '0.00 km'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <UserIcon className="h-4 w-4 text-gray-400 mr-1" />
                                                    <span>{item.nama_pereroute || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <DocumentTextIcon className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
                                                    <span className="truncate max-w-[150px]">{item.reroute_reason || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                                                {getRerouteSummary(item)}
                                            </td>
                                        </tr>
                                        {expandedRows[`reroute-${globalIndex}`] && item.reroute_logs && item.reroute_logs.length > 0 && (
                                            <tr>
                                                <td colSpan={13} className="px-4 py-3 bg-gray-50">
                                                    <RerouteLogsDetail logs={item.reroute_logs} />
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                            {paginatedData.length === 0 && !loading.reroute && (
                                <tr>
                                    <td colSpan={13} className="px-4 py-8 text-center text-sm text-gray-500">
                                        <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                        <p>Tidak ada data laporan reroute</p>
                                        <p className="text-xs mt-1">Data akan ditampilkan sesuai dengan filter yang diterapkan</p>
                                    </td>
                                </tr>
                            )}
                            {loading.reroute && (
                                <tr>
                                    <td colSpan={13} className="px-4 py-8 text-center text-sm text-gray-500">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                                        <p className="mt-2">Memuat data...</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {renderPagination('reroute', rerouteData.length)}
            </div>
        );
    };

    // ========== RENDER KOMPONEN UTAMA ==========
    return (
        <div className="space-y-8">
            <GlobalFilter />
            <FuelLostTable />
            <PerjalananTable />
            <RerouteTable />
        </div>
    );
};

export default FuelLostReport;