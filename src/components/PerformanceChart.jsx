import React, { useMemo } from 'react';
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

// Abbreviate category slug or mock title for compact X-axis labels
const abbreviate = (str = '') => {
  const map = {
    'general-science': 'Sci & Tech',
    'indian-polity': 'Polity',
    'indian-economy': 'Economy',
    'indian-geography': 'Ind. Geo',
    'physical-geography': 'Phy. Geo',
    'world-geography': 'World Geo',
    'ancient-history': 'Ancient',
    'art-culture': 'Art & Cult',
    'medieval-history': 'Medieval',
    'modern-history': 'Modern',
    'current-affairs': 'Curr. Aff.',
    'computer-awareness': 'Computer',
    'static-gk': 'Static GK',
    'jk-affairs': 'J&K',
    'environment': 'Environ.',
    'english': 'English',
    'reasoning': 'Reasoning',
    'maths': 'Maths',
    'accountancy': 'Accounts',
  };
  const slug = (str || '').toLowerCase().replace(/\s+/g, '-');
  if (map[slug]) return map[slug];
  const first = str.split(/[\s\-_]/)[0] || str;
  return first.length > 8 ? first.slice(0, 7) + '…' : first;
};

export default function PerformanceChart({ history }) {
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return null;

    // Up to last 15 mocks, reversed so earliest is on the left
    const recentHistory = [...history].slice(0, 15).reverse();

    const labels = recentHistory.map((h, i) => {
      if (h.date) {
        const d = new Date(h.date);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }
      }
      return `Mock ${i + 1}`;
    });

    const scores = recentHistory.map(h => h.percentage ?? 0);

    // 30-day rolling average: for each point, average of all mocks within 30d before it
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const allSorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));

    const rollingAvg = recentHistory.map(h => {
      const pointDate = new Date(h.date).getTime();
      const windowStart = pointDate - thirtyDaysMs;
      const windowMocks = allSorted.filter(m => {
        const d = new Date(m.date).getTime();
        return d >= windowStart && d <= pointDate;
      });
      if (windowMocks.length === 0) return h.percentage ?? 0;
      const avg = windowMocks.reduce((sum, m) => sum + (m.percentage ?? 0), 0) / windowMocks.length;
      return Math.round(avg * 10) / 10;
    });

    return { labels, scores, rollingAvg, recentHistory };
  }, [history]);

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-72 text-theme-muted font-bold text-sm">
        Attempt some mock tests to see your performance trend here.
      </div>
    );
  }

  const { labels, scores, rollingAvg, recentHistory } = chartData;

  // Color each data point: green ≥70, amber ≥50, rose <50
  const pointColors = scores.map(s =>
    s >= 70 ? 'rgb(16, 185, 129)'
    : s >= 50 ? 'rgb(245, 158, 11)'
    : 'rgb(244, 63, 94)'
  );

  const data = {
    labels,
    datasets: [
      {
        fill: true,
        label: 'Mock Score',
        data: scores,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.07)',
        tension: 0.4,
        pointBackgroundColor: pointColors,
        pointBorderColor: '#fff',
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBorderWidth: 2,
        pointHoverBorderWidth: 2,
        clip: false,
      },
      {
        fill: false,
        label: '30-Day Avg',
        data: rollingAvg,
        borderColor: 'rgba(99, 102, 241, 0.65)',
        backgroundColor: 'transparent',
        borderDash: [6, 4],
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: 'rgb(99, 102, 241)',
        pointHoverBorderColor: '#fff',
        borderWidth: 2,
        clip: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 12,
        right: 8,
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          color: '#888888',
          font: { size: 10, weight: 'bold' },
          boxWidth: 18,
          boxHeight: 2,
          padding: 16,
          usePointStyle: true,
          pointStyle: 'line',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.93)',
        titleColor: '#ffffff',
        bodyColor: 'rgba(255, 255, 255, 0.72)',
        padding: 13,
        cornerRadius: 10,
        displayColors: true,
        boxWidth: 10,
        boxHeight: 10,
        callbacks: {
          title: (items) => {
            const idx = items[0]?.dataIndex ?? 0;
            const h = recentHistory[idx];
            return h?.title || items[0]?.label || '';
          },
          label: (context) => {
            if (context.datasetIndex === 0) {
              const idx = context.dataIndex;
              const h = recentHistory[idx];
              const correct = h?.correct ?? '-';
              const total = h?.total ?? '-';
              return `  Score: ${context.parsed.y}%  (${correct} / ${total} correct)`;
            }
            return `  30-Day Avg: ${context.parsed.y}%`;
          },
          afterBody: (items) => {
            const idx = items[0]?.dataIndex ?? 0;
            const h = recentHistory[idx];
            if (h?.date) {
              const d = new Date(h.date);
              return [`  ${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`];
            }
            return [];
          },
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(128, 128, 128, 0.1)' },
        ticks: {
          color: '#888888',
          font: { size: 10, weight: 'bold' },
          stepSize: 25,
          callback: val => `${val}%`,
        },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: '#888888',
          font: { size: 10, weight: 'bold' },
          maxRotation: 30,
        },
      },
    },
  };

  return (
    <div className="h-72 w-full relative">
      <Line options={options} data={data} />
    </div>
  );
}
