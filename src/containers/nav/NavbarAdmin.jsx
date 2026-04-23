import React, { Fragment, useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { Dialog, Transition, Menu } from "@headlessui/react";
import { Bars3Icon, XMarkIcon, SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import API from "../../api/Api";

const navigation = [
    {
        section: "Dashboard",
        icon: "⛽",
        href: "/admin/dashboard"
    },
    {
        section: "Menu",
        icon: "🛡️",
        items: [
            { name: "Admin Kapal", href: "/admin/ship" },
            { name: "Admin Fuel", href: "#" },
            { name: "Admin Fresh Water", href: "#" },
            { name: "Admin Fleet", href: "#" },
            { name: "Supervisor", href: "#" },
        ],
    },
    {
        section: "Profile",
        icon: "👤",
        isProfile: true
    }
];

function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
}

const NavbarAdmin = ({ children }) => {
    const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
    const [sidebarOpenDesktop, setSidebarOpenDesktop] = useState(true);
    const [openSections, setOpenSections] = useState({});
    const [name, setName] = useState("");
    const [token, setToken] = useState("");
    const [expire, setExpire] = useState("");
    const [image, setImage] = useState("");
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const savedMode = localStorage.getItem('darkMode') === 'true';
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialMode = savedMode || prefersDark;

        setDarkMode(initialMode);
        updateDarkModeClasses(initialMode);
    }, []);

    const updateDarkModeClasses = (isDark) => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('darkMode', newMode);
        updateDarkModeClasses(newMode);
    };

    useEffect(() => {
        const savedImage = localStorage.getItem("savedImage");
        if (savedImage) setImage(savedImage);
    }, []);

    useEffect(() => {
        const initialSections = {};
        navigation.forEach((item) => {
            if (item.section) initialSections[item.section] = false;
        });
        setOpenSections(initialSections);
    }, []);

    const toggleSection = (sectionName) => {
        setOpenSections((prev) => ({
            ...prev,
            [sectionName]: !prev[sectionName],
        }));
    };

    const axiosJWT = axios.create();

    axiosJWT.interceptors.request.use(
        async (config) => {
            const currentDate = new Date();
            if (expire * 1000 < currentDate.getTime()) {
                const response = await API.get("/token");
                config.headers.Authorization = `Bearer ${response.data.accessToken}`;
                setToken(response.data.accessToken);
                const decoded = jwtDecode(response.data.accessToken);
                setName(decoded.name);
                setExpire(decoded.exp);
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    const navigate = useNavigate();

    const Logout = async () => {
        try {
            await API.delete("/logout");
            navigate("/");
        } catch (error) {
            console.log(error);
        }
    };

    const renderMenuItems = (isMobile = false) => {
        return navigation.map((item) => {
            if (item.isProfile) {
                return (
                    <Menu as="div" key="profile" className="relative w-full mt-auto">
                        <Menu.Button className={classNames(
                            "w-full text-left cursor-pointer flex items-center px-3 py-3 text-sm font-semibold uppercase tracking-wider",
                            "text-black hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                        )}>
                            {isMobile || sidebarOpenDesktop ? (
                                <>
                                    <img
                                        src={image || "https://cdn-icons-png.flaticon.com/512/147/147144.png"}
                                        alt="Profile"
                                        className="h-6 w-6 rounded-full mr-2"
                                    />
                                    Profile
                                    <svg
                                        className="ml-2 h-4 w-4 shrink-0 transform transition-transform duration-200"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                        aria-hidden="true"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
                                    </svg>
                                </>
                            ) : (
                                <img
                                    src={image || "https://cdn-icons-png.flaticon.com/512/147/147144.png"}
                                    alt="Profile"
                                    className="h-6 w-6 rounded-full"
                                />
                            )}
                        </Menu.Button>
                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                        >
                            <Menu.Items className={classNames(
                                "absolute rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50",
                                "bg-white dark:bg-gray-800",
                                isMobile ? "left-0 right-0 mx-2" : sidebarOpenDesktop ? "left-0 mt-2 w-full" : "left-full ml-2 w-56"
                            )}>
                                <div className="py-1">
                                    <Menu.Item>
                                        {({ active }) => (
                                            <a
                                                href="/profile"
                                                className={classNames(
                                                    active ? "bg-gray-100 dark:bg-gray-700" : "",
                                                    "block px-4 py-2 text-sm text-gray-700 dark:text-gray-300"
                                                )}
                                            >
                                                Your Profile
                                            </a>
                                        )}
                                    </Menu.Item>
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button
                                                onClick={Logout}
                                                className={classNames(
                                                    active ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300" : "text-red-600 dark:text-red-400",
                                                    "block w-full px-4 py-2 text-left text-sm"
                                                )}
                                            >
                                                Log out
                                            </button>
                                        )}
                                    </Menu.Item>
                                </div>
                            </Menu.Items>
                        </Transition>
                    </Menu>
                );
            }

            return (
                <div key={item.section} className="w-full">
                    {item.href ? (
                        <a
                            href={item.href}
                            className={classNames(
                                "flex items-center px-3 py-3 text-sm font-semibold uppercase tracking-wider",
                                "text-black hover:text-gray-800 dark:text-gray-300 dark:hover:text-white",
                                isMobile ? "justify-between" : sidebarOpenDesktop ? "justify-between" : "justify-center"
                            )}
                            title={isMobile || sidebarOpenDesktop ? item.section : ""}
                            onClick={(e) => {
                                e.preventDefault();
                                if (isMobile) setSidebarOpenMobile(false);
                                navigate(item.href);
                            }}
                        >
                            {isMobile || sidebarOpenDesktop ? (
                                <>
                                    {item.section}
                                </>
                            ) : (
                                <span className="text-xl">{item.icon}</span>
                            )}
                        </a>
                    ) : (
                        <>
                            <button
                                onClick={() => toggleSection(item.section)}
                                className={classNames(
                                    "w-full text-left cursor-pointer flex items-center px-3 py-3 text-sm font-semibold uppercase tracking-wider",
                                    "text-black hover:text-gray-800 dark:text-gray-300 dark:hover:text-white",
                                    isMobile ? "justify-between" : sidebarOpenDesktop ? "justify-between" : "justify-center"
                                )}
                                title={isMobile || sidebarOpenDesktop ? item.section : ""}
                            >
                                {isMobile || sidebarOpenDesktop ? (
                                    <>
                                        {item.section}
                                        <svg
                                            className={classNames(
                                                "ml-2 h-4 w-4 shrink-0 transform transition-transform duration-200",
                                                openSections[item.section] ? "rotate-90" : "rotate-0"
                                            )}
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                            aria-hidden="true"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
                                        </svg>
                                    </>
                                ) : (
                                    <span className="text-xl">{item.icon}</span>
                                )}
                            </button>
                            {(isMobile || sidebarOpenDesktop) && openSections[item.section] && (
                                <div className={classNames(
                                    "rounded-md",
                                    "bg-gray-100 dark:bg-gray-700"
                                )}>
                                    {item.items.map((subItem) => (
                                        <a
                                            key={subItem.name}
                                            href={subItem.href}
                                            className={classNames(
                                                "flex items-center rounded-md px-3 py-2 w-full overflow-hidden whitespace-nowrap transition-colors duration-300 text-sm",
                                                "text-gray-700 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
                                            )}
                                            title={subItem.name}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (isMobile) setSidebarOpenMobile(false);
                                                navigate(subItem.href);
                                            }}
                                        >
                                            <span>{subItem.name}</span>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            );

        });
    };

    return (
        <>
            {/* Mobile sidebar */}
            <Transition.Root show={sidebarOpenMobile} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-40 md:hidden"
                    onClose={setSidebarOpenMobile}
                >
                    <Transition.Child
                        as={Fragment}
                        enter="transition-opacity ease-linear duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity ease-linear duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
                    </Transition.Child>

                    <div className="fixed inset-0 z-40 flex">
                        <Transition.Child
                            as={Fragment}
                            enter="transition ease-in-out duration-300 transform"
                            enterFrom="-translate-x-full"
                            enterTo="translate-x-0"
                            leave="transition ease-in-out duration-300 transform"
                            leaveFrom="translate-x-0"
                            leaveTo="-translate-x-full"
                        >
                            <Dialog.Panel className={classNames(
                                "relative flex flex-col w-full max-w-xs h-full",
                                "bg-white dark:bg-gray-800"
                            )}>
                                <div className="flex h-16 flex-shrink-0 items-center justify-between px-4">
                                    <img
                                        className="h-8 w-auto"
                                        src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500"
                                        alt="Your Company"
                                    />
                                    <button
                                        type="button"
                                        className={classNames(
                                            "inline-flex items-center justify-center rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white",
                                            "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                                        )}
                                        onClick={() => setSidebarOpenMobile(false)}
                                    >
                                        <span className="sr-only">Close sidebar</span>
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>
                                <div className="h-0 flex-1 overflow-y-auto">
                                    <nav className="flex-1 px-2 py-4 space-y-1">
                                        {renderMenuItems(true)}
                                    </nav>
                                </div>
                                {/* Mobile dark mode toggle */}
                                <div className={classNames(
                                    "p-4 border-t",
                                    "border-gray-200 dark:border-gray-700"
                                )}>
                                    <button
                                        onClick={toggleDarkMode}
                                        className={classNames(
                                            "flex items-center justify-center w-full p-2 rounded-md",
                                            "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                        )}
                                    >
                                        {darkMode ? (
                                            <>
                                                <SunIcon className="h-5 w-5 mr-2" />
                                                Light Mode
                                            </>
                                        ) : (
                                            <>
                                                <MoonIcon className="h-5 w-5 mr-2" />
                                                Dark Mode
                                            </>
                                        )}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition.Root>

            {/* Desktop sidebar */}
            <div
                className={classNames(
                    "fixed inset-y-0 left-0 transition-width duration-300 ease-in-out overflow-hidden flex flex-col",
                    "bg-white dark:bg-gray-800",
                    sidebarOpenDesktop ? "w-64" : "w-16",
                    "hidden md:flex"
                )}
            >
                <div className="flex h-16 items-center px-4 justify-between">
                    <button
                        className={classNames(
                            "focus:outline-none",
                            "text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                        )}
                        onClick={() => setSidebarOpenDesktop(!sidebarOpenDesktop)}
                        title={sidebarOpenDesktop ? "Collapse sidebar" : "Expand sidebar"}
                    >
                        {sidebarOpenDesktop ? (
                            <XMarkIcon className="h-6 w-6" />
                        ) : (
                            <Bars3Icon className="h-6 w-6" />
                        )}
                    </button>
                </div>
                <div className="flex flex-col overflow-y-auto flex-grow px-2 space-y-1 py-2">
                    {renderMenuItems(false)}
                </div>

                {/* Dark Mode Toggle in Sidebar */}
                <div className={classNames(
                    "px-4 py-4 w-full border-t",
                    "border-gray-200 dark:border-gray-700"
                )}>
                    <button
                        onClick={toggleDarkMode}
                        className={classNames(
                            "flex items-center justify-center w-full p-2 rounded-md",
                            "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        )}
                        title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                    >
                        {darkMode ? (
                            <>
                                <SunIcon className="h-5 w-5 mr-2" />
                                {sidebarOpenDesktop && "Light Mode"}
                            </>
                        ) : (
                            <>
                                <MoonIcon className="h-5 w-5 mr-2" />
                                {sidebarOpenDesktop && "Dark Mode"}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Main content area */}
            <div
                className={classNames(
                    "ml-0 md:ml-16 transition-margin duration-300 ease-in-out min-h-screen",
                    "bg-gray-100 dark:bg-gray-900",
                    sidebarOpenDesktop ? "md:ml-64" : "md:ml-16"
                )}
            >
                {/* Top bar mobile */}
                <div className={classNames(
                    "sticky top-0 z-[9999] flex items-center border-b px-4 py-3 md:hidden",
                    "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                )}>
                    <button
                        type="button"
                        className={classNames(
                            "inline-flex items-center justify-center rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500",
                            "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                        )}
                        onClick={() => setSidebarOpenMobile(true)}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                    </button>
                    <h1 className={classNames(
                        "ml-4 text-lg font-semibold",
                        "text-black dark:text-white"
                    )}>
                        Dashboard
                    </h1>

                    {/* Mobile dark mode toggle */}
                    <button
                        onClick={toggleDarkMode}
                        className={classNames(
                            "ml-auto p-2",
                            "text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                        )}
                    >
                        {darkMode ? (
                            <SunIcon className="h-5 w-5" />
                        ) : (
                            <MoonIcon className="h-5 w-5" />
                        )}
                    </button>
                </div>

                <main className={classNames(
                    "min-h-screen",
                    "text-black dark:text-white"
                )}>
                    {children}
                </main>
            </div>
        </>
    );
};

export default NavbarAdmin;