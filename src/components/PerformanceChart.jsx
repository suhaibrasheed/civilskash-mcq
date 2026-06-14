import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

export default function PerformanceChart({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-theme-muted font-bold">
        Not enough data to display performance chart.
      </div>
    );
  }

  // Take up to last 10 attempts, reverse so chronological order is left to right
  const recentHistory = [...history].slice(0, 10).reverse();

  const labels = recentHistory.map((_, i) => `Mock ${i + 1}`);
  const dataScores = recentHistory.map((h) => h.percentage || 0);

  const data = {
    labels,
    datasets: [
      {
        fill: true,
        label: 'Accuracy %',
        data: dataScores,
        borderColor: 'rgb(16, 185, 129)', // emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(16, 185, 129)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)', // slate-900
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `Score: ${context.parsed.y}%`;
          }
        }
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(128, 128, 128, 0.1)',
        },
        ticks: {
          color: '#888888',
          font: {
            size: 10,
            weight: 'bold'
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#888888',
          font: {
            size: 10,
            weight: 'bold'
          }
        }
      }
    },
  };

  return (
    <div className="h-64 w-full relative">
      <Line options={options} data={data} />
    </div>
  );
}
