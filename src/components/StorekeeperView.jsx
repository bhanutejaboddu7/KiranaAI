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
    ShoppingCart,
    ChevronRight,
    MoreVertical,
    Database,
    Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getInventory, seedDatabase } from '../services/api';

// Mock Data for Shortfall (Keep until API supports it)
const MOCK_SHORTFALL = [
    { id: 9, name: 'Milk (500ml)', current: 2, reorder: 10, status: 'critical' },
    { id: 10, name: 'Curd (200g)', current: 4, reorder: 15, status: 'critical' },
    { id: 5, name: 'Sugar (1kg)', current: 5, reorder: 20, status: 'warning' },
    { id: 3, name: 'Sunflower Oil (1L)', current: 8, reorder: 15, status: 'warning' },
];

// Mock Data for Market Prices (Keep until API supports it)
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
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await getInventory();
            setProducts(data);
        } catch (error) {
            console.error("Failed to fetch inventory", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleSeedData = async () => {
        setSeeding(true);
        try {
            await seedDatabase();
            await fetchProducts(); // Refresh data after seeding
            alert("Dummy data added successfully!");
        } catch (error) {
            console.error("Failed to seed data", error);
            alert("Failed to add dummy data.");
        } finally {
            setSeeding(false);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        // Assuming API returns category, if not, we might need to adjust or mock it for now
        const matchesCategory = selectedCategory === 'All' || (p.category || 'Uncategorized') === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="flex flex-col h-full bg-background relative font-sans">
            {/* Top Navigation Tabs */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border pt-safe">
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Store Management</h1>
                        <button
                            onClick={handleSeedData}
                            disabled={seeding}
                            className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 hover:bg-secondary text-secondary-foreground rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                            {seeding ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
                            Add Dummy Data
                        </button>
                    </div>
                    <div className="flex p-1 bg-muted/50 rounded-xl">
                        {['catalog', 'shortfall', 'prices'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 capitalize",
                                    activeTab === tab
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {tab === 'shortfall' ? 'Alerts' : tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto pb-safe-nav">

                {/* Screen 1: Catalog */}
                {activeTab === 'catalog' && (
                    <div className="p-4 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* Search & Filter */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 bg-card p-3 rounded-xl shadow-sm border border-border focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                <Search size={20} className="text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    className="flex-1 outline-none bg-transparent text-foreground placeholder-muted-foreground"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Filter size={18} className="text-muted-foreground" />
                            </div>

                            {/* Category Pills */}
                            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={cn(
                                            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95",
                                            selectedCategory === cat
                                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                                : "bg-card text-muted-foreground border border-border hover:bg-muted"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Product Grid */}
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {filteredProducts.length > 0 ? filteredProducts.map(product => (
                                    <div key={product.id} className="bg-card p-4 rounded-2xl shadow-sm border border-border flex items-center gap-4 active:scale-[0.99] transition-transform">
                                        <div className="w-16 h-16 bg-muted/50 rounded-xl flex items-center justify-center text-3xl shrink-0">
                                            {/* Use a default icon if image is missing or URL */}
                                            {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-xl" /> : '📦'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                                            <p className="text-xs text-muted-foreground">{product.category || 'General'}</p>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="text-sm font-bold text-primary">₹{product.price}</span>
                                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">Stock: {product.stock}</span>
                                            </div>
                                        </div>
                                        <button className="p-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors">
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                )) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        No products found. Try adding dummy data.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Screen 2: Inventory Shortfall */}
                {activeTab === 'shortfall' && (
                    <div className="p-4 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="text-red-500" size={20} />
                            <h2 className="text-lg font-bold text-foreground">Low Stock Alerts</h2>
                        </div>

                        <div className="space-y-3">
                            {MOCK_SHORTFALL.map(item => (
                                <div key={item.id} className={cn(
                                    "bg-card p-4 rounded-2xl border-l-4 shadow-sm flex justify-between items-center",
                                    item.status === 'critical' ? "border-l-red-500" : "border-l-orange-500"
                                )}>
                                    <div>
                                        <h3 className="font-semibold text-foreground">{item.name}</h3>
                                        <div className="flex gap-3 mt-1 text-sm">
                                            <p className="text-muted-foreground">Current: <span className="font-bold text-foreground">{item.current}</span></p>
                                            <p className="text-muted-foreground">Reorder: {item.reorder}</p>
                                        </div>
                                    </div>
                                    <button className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl shadow-sm shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all">
                                        Restock
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="bg-blue-500/10 p-5 rounded-2xl border border-blue-500/20 mt-6">
                            <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
                                <TrendingUp size={16} /> Smart Suggestion
                            </h3>
                            <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                                Based on sales velocity, you should order <strong>20 units</strong> of Milk and <strong>50kg</strong> of Sugar to cover the weekend rush.
                            </p>
                        </div>
                    </div>
                )}

                {/* Screen 3: Live Prices */}
                {activeTab === 'prices' && (
                    <div className="p-4 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="text-green-500" size={20} />
                            <h2 className="text-lg font-bold text-foreground">Market Intelligence</h2>
                        </div>

                        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3">Item</th>
                                        <th className="px-4 py-3">Store</th>
                                        <th className="px-4 py-3">Market</th>
                                        <th className="px-4 py-3 text-right">Trend</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {MOCK_MARKET_PRICES.map(item => (
                                        <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-foreground">
                                                {item.item}
                                                <div className="text-[10px] text-muted-foreground font-normal">{item.lastUpdated}</div>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">₹{item.storePrice}</td>
                                            <td className="px-4 py-3 text-muted-foreground">₹{item.marketPrice}</td>
                                            <td className="px-4 py-3 text-right">
                                                {item.trend === 'up' ? (
                                                    <div className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full text-xs font-bold">
                                                        <ArrowUpRight size={14} /> +{(item.marketPrice - item.storePrice).toFixed(0)}
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-1 rounded-full text-xs font-bold">
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
        </div>
    );
};

export default StorekeeperView;
