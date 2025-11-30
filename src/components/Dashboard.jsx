import React, { useEffect, useState } from 'react';
import { Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { getInventory, getSales } from '../services/api';

const Dashboard = () => {
    const [inventory, setInventory] = useState([]);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [invData, salesData] = await Promise.all([getInventory(), getSales()]);
                setInventory(invData);
                setSales(salesData);
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-full">Loading...</div>;
    }

    const lowStockItems = inventory.filter(item => item.stock < 10);
    const totalSalesToday = sales
        .filter(sale => new Date(sale.timestamp).toDateString() === new Date().toDateString())
        .reduce((sum, sale) => sum + sale.total_amount, 0);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Products</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{inventory.length}</h3>
                        </div>
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <Package size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Today's Sales</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalSalesToday.toFixed(2)}</h3>
                        </div>
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Low Stock Items</p>
                            <h3 className="text-2xl font-bold text-red-600">{lowStockItems.length}</h3>
                        </div>
                        <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                            <AlertTriangle size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Sales Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Sales</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">ID</th>
                                <th className="px-6 py-3 font-medium">Product</th>
                                <th className="px-6 py-3 font-medium">Quantity</th>
                                <th className="px-6 py-3 font-medium">Amount</th>
                                <th className="px-6 py-3 font-medium">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {sales.slice(0, 5).map((sale) => (
                                <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 text-gray-900 dark:text-white">#{sale.id}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{sale.product_name || sale.product_id}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{sale.quantity}</td>
                                    <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">₹{sale.total_amount}</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{new Date(sale.timestamp).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
