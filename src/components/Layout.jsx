import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, LayoutDashboard, Store, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';

const Layout = ({ children }) => {
    const location = useLocation();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const navItems = [
        { icon: MessageSquare, label: 'Chat', path: '/' },
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Store, label: 'Storekeeper', path: '/storekeeper' },
        { icon: Store, label: 'Stock Manager', path: '/stock' },
        { icon: MessageSquare, label: 'Customer Mode', path: '/customer' },
    ];

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                        <Store className="w-8 h-8" />
                        KiranaAI
                    </h1>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="md:hidden p-1 hover:bg-gray-100 rounded-lg"
                    >
                        <X size={24} />
                    </button>
                </div>
                <nav className="px-4 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                location.pathname === item.path
                                    ? "bg-primary text-primary-foreground"
                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto flex flex-col">
                {/* Mobile Header */}
                <div className="md:hidden p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4 sticky top-0 z-30">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <Menu size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-primary">KiranaAI</h1>
                </div>

                <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Layout;
