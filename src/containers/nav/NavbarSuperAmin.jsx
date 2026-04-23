import { useState, useEffect } from 'react';
import { Dialog, Menu } from '@headlessui/react';
import {
    Bars3Icon,
    BellIcon,
    XMarkIcon,
    ChevronDownIcon,
    ChartBarIcon,
    ShieldCheckIcon,
    CurrencyDollarIcon,
    KeyIcon,
    UserIcon
} from '@heroicons/react/24/outline';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../../api/Api';

const navigation = [
    {
        section: "Dashboard",
        icon: <ChartBarIcon className="w-5 h-5" />,
        href: "/superadmin/dashboard"
    },
    {
        section: "Data",
        icon: <ShieldCheckIcon className="w-5 h-5" />,
        items: [
            { name: "Users", href: "/superadmin/users", icon: <UserIcon className="w-4 h-4" /> },
            // { name: "Ships", href: "/superadmin/ships", icon: <SparklesIcon className="w-4 h-4" /> },
            { name: "Captains", href: "/superadmin/captains", icon: <KeyIcon className="w-4 h-4" /> },
            // { name: "Central Region", href: "/superadmin/central", icon: <MinusCircleIcon className="w-4 h-4" /> },
            // { name: "South Region", href: "/superadmin/south", icon: <ChevronDoubleDownIcon className="w-4 h-4" /> },
            // { name: "North Region", href: "/superadmin/north", icon: <ChevronDoubleUpIcon className="w-4 h-4" /> },
            // { name: "Other Region", href: "/superadmin/other", icon: <GlobeAmericasIcon className="w-4 h-4" /> },
            // { name: "Islands", href: "/superadmin/islands", icon: <GlobeAltIcon className="w-4 h-4" /> },
            // { name: "Conductors", href: "/superadmin/conductors", icon: <FunnelIcon className="w-4 h-4" /> },
            // { name: "Subsea Wallhead", href: "/superadmin/subsea-wallhead", icon: <ExclamationCircleIcon className="w-4 h-4" /> },
            // { name: "Tanker Rig Barge", href: "/superadmin/tanker-rig-barge", icon: <ExclamationTriangleIcon className="w-4 h-4" /> },
        ],
    },
    {
        section: "Transaction",
        icon: <ShieldCheckIcon className="w-5 h-5" />,
        items: [
            { name: "Fuel Price", href: "/superadmin/fuel-price", icon: <CurrencyDollarIcon className="w-4 h-4" /> },
            // { name: "User Request", href: "/superadmin/user-request", icon: <UserIcon className="w-4 h-4" /> },
            // { name: "History User Request", href: "/superadmin/user-request", icon: <ClockIcon className="w-4 h-4" /> },
        ],
    }
];

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

export default function NavbarSuperAdmin({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [openSections, setOpenSections] = useState({});
    const [userData, setUserData] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Ambil data user dari localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                setUserData(JSON.parse(savedUser));
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    }, []);

    const handleLogout = async () => {
        try {
            await API.delete("/logout", { withCredentials: true });
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
            navigate("/");
        } catch (error) {
            console.log(error);
        }
    };

    const toggleSection = (sectionName) => {
        setOpenSections((prev) => ({
            ...prev,
            [sectionName]: !prev[sectionName],
        }));
    };

    const renderNavItems = () =>
        navigation.map((item) => {
            if (item.items) {
                const isOpen = openSections[item.section];

                return (
                    <div key={item.section} className="mb-2">
                        <button
                            onClick={() => toggleSection(item.section)}
                            className={classNames(
                                "flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                                isOpen
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            )}
                        >
                            <div className="flex items-center">
                                <span className={classNames(
                                    "mr-3",
                                    isOpen ? "text-blue-600" : "text-gray-400"
                                )}>
                                    {item.icon}
                                </span>
                                <span>{item.section}</span>
                            </div>
                            <ChevronDownIcon
                                className={classNames(
                                    isOpen ? 'rotate-180 transform' : '',
                                    'h-4 w-4 transition-transform duration-200'
                                )}
                            />
                        </button>

                        {isOpen && (
                            <div className="ml-8 mt-2 space-y-2">
                                {item.items.map((sub) => (
                                    <a
                                        key={sub.name}
                                        href={sub.href}
                                        className={classNames(
                                            "flex items-center px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                                            location.pathname === sub.href
                                                ? "bg-blue-100 text-blue-700 font-medium"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        )}
                                    >
                                        {sub.icon && <span className="mr-3 text-gray-400">{sub.icon}</span>}
                                        {sub.name}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                );
            }

            return (
                <a
                    key={item.section}
                    href={item.href}
                    className={classNames(
                        "flex items-center px-4 py-3 text-sm font-medium rounded-lg mb-2 transition-colors duration-200",
                        location.pathname === item.href
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                >
                    <span className={classNames(
                        "mr-3",
                        location.pathname === item.href ? "text-blue-600" : "text-gray-400"
                    )}>
                        {item.icon}
                    </span>
                    {item.section}
                </a>
            );
        });

    return (
        <div className="min-h-full bg-gray-50">
            {/* Sidebar Mobile */}
            <Dialog as="div" className="relative z-50 lg:hidden" open={sidebarOpen} onClose={setSidebarOpen}>
                <div className="fixed inset-0 bg-gray-900/80 transition-opacity" aria-hidden="true" />

                <div className="fixed inset-0 flex">
                    <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-white shadow-xl">
                        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                <img src="/logo_new.jpeg" className="h-10" alt="Route Modelling App" />
                                <p className="font-bold text-sm">Route Modelling App</p>
                            </div>
                            <button
                                type="button"
                                className="rounded-md p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                                onClick={() => setSidebarOpen(false)}
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 py-6">
                            <div className="px-4 py-4 mb-4 bg-blue-50 rounded-lg">
                                <div className="flex items-center">
                                    <img
                                        className="h-10 w-10 rounded-full"
                                        src={userData?.avatar || "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff"}
                                        alt="User"
                                    />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-900">
                                            {userData?.name || 'User'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {userData?.email || 'user@example.com'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <nav className="space-y-2">{renderNavItems()}</nav>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* Sidebar Desktop */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-white border-r border-gray-200">
                <div className="flex items-center h-16 justify-center border-b border-gray-200 px-4">
                    <img src="/logo_new.jpeg" className="h-10" alt="Route Modelling App" />
                    <p className='font-bold'>Route Modelling App</p>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-6">
                    <div className="px-4 py-4 mb-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center">
                            <img
                                className="h-10 w-10 rounded-full"
                                src={userData?.avatar || "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff"}
                                alt="User"
                            />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">
                                    {userData?.name || 'User'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {userData?.email || 'user@example.com'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <nav className="space-y-2">{renderNavItems()}</nav>
                </div>
            </div>

            {/* Main content */}
            <div className="flex flex-1 flex-col lg:pl-64">
                <div className="sticky top-0 z-10 flex h-16 items-center bg-white shadow-sm px-6 border-b border-gray-200">
                    <button
                        type="button"
                        className="lg:hidden text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Bars3Icon className="h-6 w-6" />
                    </button>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-base sm:text-xl font-semibold text-gray-900 ml-2 lg:ml-0 truncate">Super Admin Dashboard</h1>
                    </div>

                    <div className="ml-auto flex items-center space-x-4">
                        
                        <Menu as="div" className="relative">
                            <Menu.Button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                <div className="flex items-center">
                                    <img
                                        className="h-8 w-8 rounded-full"
                                        src={userData?.avatar || "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff"}
                                        alt="User"
                                    />
                                    <div className="ml-2 hidden md:block">
                                        <p className="text-sm font-medium text-gray-700">
                                            {userData?.name || 'User'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {userData?.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : 'Super Admin'}
                                        </p>
                                    </div>
                                </div>
                            </Menu.Button>

                            <Menu.Items className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg ring-1 ring-black ring-opacity-5 z-50 focus:outline-none py-1">
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <p className="text-sm font-medium text-gray-900">
                                        {userData?.name || 'User'}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {userData?.email || 'user@example.com'}
                                    </p>
                                </div>

                                <div className="py-1">
                                    {/* <Menu.Item>
                                        {({ active }) => (
                                            <a
                                                href="/profile"
                                                className={classNames(
                                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                    'flex items-center px-4 py-2 text-sm transition-colors'
                                                )}
                                            >
                                                <UserIcon className="h-4 w-4 mr-2" />
                                                Profile
                                            </a>
                                        )}
                                    </Menu.Item> */}
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button
                                                onClick={handleLogout}
                                                className={classNames(
                                                    active ? 'bg-gray-100 text-red-700' : 'text-red-600',
                                                    'block w-full text-left px-4 py-2 text-sm font-medium transition-colors'
                                                )}
                                            >
                                                Logout
                                            </button>
                                        )}
                                    </Menu.Item>
                                </div>
                            </Menu.Items>
                        </Menu>
                    </div>
                </div>

                <main className="flex-1 pb-8">
                    <div className="px-6 py-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}