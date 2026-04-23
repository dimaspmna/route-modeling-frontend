// FuelPieChart.jsx
import React from "react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

const data = [
    { name: "Solar", value: 400 },
    { name: "Pertamax", value: 300 },
    { name: "Pertalite", value: 200 },
    { name: "Dexlite", value: 100 },
];

const COLORS = ["#00b894", "#0984e3", "#fdcb6e", "#d63031"];

const FuelPieChart = () => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Konsumsi Bahan Bakar Rata-rata
            </h2>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default FuelPieChart;
