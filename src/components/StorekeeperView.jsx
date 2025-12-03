import React, { useState, useEffect } from 'react';
import {
    Home,
    AlertTriangle,
    TrendingUp,
    Search,
    Filter,
    Plus,
    ArrowUpRight,
    ArrowDownRight,
    Package,
    ShoppingCart
} from 'lucide-react';
import { cn } from '../lib/utils';

// Mock Data for Catalog
const MOCK_PRODUCTS = [
    { id: 1, name: 'Basmati Rice (Premium)', category: 'Grains', stock: 45, price: 120, image: '🌾' },
    { id: 2, name: 'Toor Dal', category: 'Pulses', stock: 12, price: 140, image: '🥣' },
    { id: 3, name: 'Sunflower Oil (1L)', category: 'Oil', stock: 8, price: 165, image: '🌻' },
    { id: 4, name: 'Whole Wheat Atta (5kg)', category: 'Flour', stock: 20, price: 210, image: '🍞' },
    { id: 5, name: 'Sugar (1kg)', category: 'Essentials', stock: 5, price: 45, image: '🍬' },
    { id: 6, name: 'Tata Salt', category: 'Essentials', stock: 50, price: 25, image: '🧂' },
    { id: 7, name: 'Red Chilli Powder', category: 'Spices', stock: 15, price: 80, image: '🌶️' },
    { id: 8, name: 'Turmeric Powder', category: 'Spices', stock: 18, price: 60, image: '🟡' },
    { id: 9, name: 'Milk (500ml)', category: 'Dairy', stock: 2, price: 30, image: '🥛' },
    { id: 10, name: 'Curd (200g)', category: 'Dairy', stock: 4, price: 20, image: '🥣' },
    { id: 11, name: 'Paneer (200g)', category: 'Dairy', stock: 10, price: 90, image: '🧀' },
    { id: 12, name: 'Maggi Noodles', category: 'Snacks', stock: 100, price: 14, image: '🍜' },
];

// Mock Data for Shortfall
const MOCK_SHORTFALL = [
    { id: 9, name: 'Milk (500ml)', current: 2, reorder: 10, status: 'critical' },
    { id: 10, name: 'Curd (200g)', current: 4, reorder: 15, status: 'critical' },
    { id: 5, name: 'Sugar (1kg)', current: 5, reorder: 20, status: 'warning' },
    { id: 3, name: 'Sunflower Oil (1L)', current: 8, reorder: 15, status: 'warning' },
];

// Mock Data for Market Prices
const MOCK_MARKET_PRICES = [
    { id: 1, item: 'Onion (Nashik)', storePrice: 40, marketPrice: 35, trend: 'down', lastUpdated: '10:30 AM' },
    { id: 2, item: 'Potato (Agra)', storePrice: 20, marketPrice: 22, trend: 'up', lastUpdated: '11:00 AM' },
    { id: 3, item: 'Tomato (Local)', storePrice: 30, marketPrice: 28, trend: 'down', lastUpdated: '09:45 AM' },
    { id: 4, item: 'Green Chilli', storePrice: 60, marketPrice: 65, trend: 'up', lastUpdated: '10:15 AM' },
    { id: 5, item: 'Garlic', storePrice: 150, marketPrice: 160, trend: 'up', lastUpdated: 'Yesterday' },
    { id: 6, item: 'Ginger', storePrice: 120, marketPrice: 110, trend: 'down', lastUpdated: 'Yesterday' },
];

const CATEGORIES = ['All', 'Grains', 'Pulses', 'Oil', 'Flour', 'Spices', 'Dairy', 'Snacks', 'Essentials'];

const StorekeeperView = () => {
    const [activeTab, setActiveTab] = useState('catalog');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const filteredProducts = MOCK_PRODUCTS.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="flex flex-col h-[calc(100dvh-4rem)] md:h-[calc(100vh-8rem)] bg-slate-50 relative font-sans">

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto pb-20 no-scrollbar">

                {/* Screen 1: Catalog */}
                {activeTab === 'catalog' && (
                    <div className="p-4 space-y-4">
                        {/* Sticky Header */}
                        <div className="sticky top-0 bg-slate-50 z-10 pb-2 space-y-3">
                            <div className="flex items-center gap-2 bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                                <Search size={20} className="text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    className="flex-1 outline-none text-slate-700 placeholder-slate-400"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Filter size={18} className="text-slate-400" />
                            </div>

                            {/* Category Pills */}
                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={cn(
                                            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                                            selectedCategory === cat
                                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Product Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {filteredProducts.map(product => (
                                <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2">
                                    <div className="w-full h-24 bg-slate-50 rounded-lg flex items-center justify-center text-4xl mb-1">
                                        {product.image}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-800 line-clamp-2 leading-tight">{product.name}</h3>
                                        <p className="text-xs text-slate-500 mt-1">{product.category}</p>
                                    </div>
                                    <div className="flex justify-between items-end mt-2">
                                        <div>
                                            <p className="text-xs text-slate-400">Stock: {product.stock}</p>
                                            <p className="font-bold text-indigo-600">₹{product.price}</p>
                                        </div>
                                        <button className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Screen 2: Inventory Shortfall */}
                {activeTab === 'shortfall' && (
                    <div className="p-4 space-y-4">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <AlertTriangle className="text-red-500" /> Low Stock Alerts
                        </h2>

                        <div className="space-y-3">
                            {MOCK_SHORTFALL.map(item => (
                                <div key={item.id} className={cn(
                                    "bg-white p-4 rounded-xl border-l-4 shadow-sm flex justify-between items-center",
                                    item.status === 'critical' ? "border-l-red-500" : "border-l-yellow-500"
                                )}>
                                    <div>
                                        <h3 className="font-semibold text-slate-800">{item.name}</h3>
                                        <div className="flex gap-4 mt-1 text-sm">
                                            <p className="text-slate-500">Current: <span className="font-bold text-slate-800">{item.current}</span></p>
                                            <p className="text-slate-400">Reorder: {item.reorder}</p>
                                        </div>
                                    </div>
                                    <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-indigo-700 active:scale-95 transition-all">
                                        Restock
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-6">
                            <h3 className="font-semibold text-blue-800 mb-2">Smart Suggestion</h3>
                            <p className="text-sm text-blue-600 leading-relaxed">
                                Based on sales velocity, you should order <strong>20 units</strong> of Milk and <strong>50kg</strong> of Sugar to cover the weekend rush.
                            </p>
                        </div>
                    </div>
                )}

                {/* Screen 3: Live Prices */}
                {activeTab === 'prices' && (
                    <div className="p-4 space-y-4">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <TrendingUp className="text-green-600" /> Market Intelligence
                        </h2>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">Item</th>
                                        <th className="px-4 py-3">Store</th>
                                        <th className="px-4 py-3">Market</th>
                                        <th className="px-4 py-3 text-right">Trend</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {MOCK_MARKET_PRICES.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-slate-800">
                                                {item.item}
                                                <div className="text-[10px] text-slate-400 font-normal">{item.lastUpdated}</div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">₹{item.storePrice}</td>
                                            <td className="px-4 py-3 text-slate-600">₹{item.marketPrice}</td>
                                            <td className="px-4 py-3 text-right">
                                                {item.trend === 'up' ? (
                                                    <div className="inline-flex items-center gap-1 text-red-500 bg-red-50 px-2 py-1 rounded-full text-xs font-bold">
                                                        <ArrowUpRight size={14} /> +{(item.marketPrice - item.storePrice).toFixed(0)}
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-bold">
                                                        <ArrowDownRight size={14} /> -{(item.storePrice - item.marketPrice).toFixed(0)}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Navigation Bar */}
            <div className="bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center sticky bottom-0 z-20 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <button
                    onClick={() => setActiveTab('catalog')}
                    className={cn(
                        "flex flex-col items-center gap-1 transition-colors",
                        activeTab === 'catalog' ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    <Home size={24} strokeWidth={activeTab === 'catalog' ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Catalog</span>
                </button>

                <button
                    onClick={() => setActiveTab('shortfall')}
                    className={cn(
                        "flex flex-col items-center gap-1 transition-colors relative",
                        activeTab === 'shortfall' ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    <div className="relative">
                        <AlertTriangle size={24} strokeWidth={activeTab === 'shortfall' ? 2.5 : 2} />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                    </div>
                    <span className="text-[10px] font-medium">Alerts</span>
                </button>

                <button
                    onClick={() => setActiveTab('prices')}
                    className={cn(
                        "flex flex-col items-center gap-1 transition-colors",
                        activeTab === 'prices' ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    <TrendingUp size={24} strokeWidth={activeTab === 'prices' ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Trends</span>
                </button>
            </div>


        </div>
    );
};

export default StorekeeperView;
