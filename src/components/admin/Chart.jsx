// Chart.jsx
import React from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const data = [
    { name: "Jan", produksi: 4000 },
    { name: "Feb", produksi: 3000 },
    { name: "Mar", produksi: 2000 },
    { name: "Apr", produksi: 2780 },
    { name: "May", produksi: 1890 },
    { name: "Jun", produksi: 2390 },
    { name: "Jul", produksi: 3490 },
];

const Chart = () => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Grafik Produksi Minyak Bulanan
            </h2>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                    <XAxis dataKey="name" stroke="#8884d8" />
                    <YAxis stroke="#8884d8" />
                    <Tooltip />
                    <Line
                        type="monotone"
                        dataKey="produksi"
                        stroke="#00b894"
                        strokeWidth={3}
                        activeDot={{ r: 8 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default Chart;
