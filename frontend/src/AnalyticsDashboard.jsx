import React from 'react';
import { X, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { analyticsData } from './analyticsData';

const RED = '#C81E2C';
const RED_DIM = '#8f1219';
const INK_FAINT = '#6E6A5D';
const PIE_COLORS = ['#EBC3C6', RED, RED_DIM];

function Panel({ title, children, className = '' }) {
  return (
    <div className={`bg-panel border border-line rounded-sm p-4 ${className}`}>
      <h4 className="text-sm font-semibold text-ink mb-3 display">{title}</h4>
      {children}
    </div>
  );
}

function Kpi({ label, value }) {
  return (
    <div className="bg-panel-2 border border-line rounded-sm px-4 py-3 flex-1 min-w-[120px]">
      <div className="text-[11px] uppercase tracking-wide text-ink-faint mono">{label}</div>
      <div className="text-2xl font-semibold text-ink mt-1">{value}</div>
    </div>
  );
}

export default function AnalyticsDashboard({ open, onClose }) {
  if (!open) return null;

  const { overall, companies, monthly, topRevenueItems, topDemandItems, perCompanyRankings } =
    analyticsData;

  const pieData = [
    { name: 'Pending', value: overall['Pending Orders'] },
    { name: 'Successful', value: overall['Successful Orders'] },
    { name: 'Not Successful', value: overall['Not Successful Orders'] },
  ];

  const companyKeys = Object.keys(perCompanyRankings);

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-start sm:items-center">
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div className="relative w-full h-full sm:h-[92vh] sm:w-[95vw] sm:max-w-6xl bg-paper border border-ink sm:rounded-sm shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-panel">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-red" />
            <h3 className="text-lg font-semibold text-ink display">Data Analytics</h3>
            <span className="text-xs bg-panel-2 border border-line px-2 py-0.5 rounded-sm mono text-ink-soft">
              static snapshot
            </span>
          </div>
          <button onClick={onClose} className="text-ink-faint hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-8">
          {/* KPI strip */}
          <div className="flex flex-wrap gap-3">
            <Kpi label="Total Orders" value={overall['Total Orders']} />
            <Kpi label="Successful" value={overall['Successful Orders']} />
            <Kpi label="Not Successful" value={overall['Not Successful Orders']} />
            <Kpi label="Pending" value={overall['Pending Orders']} />
            <Kpi
              label="% Successful (Decided)"
              value={`${(overall['% Successful (of Decided Orders)'] * 100).toFixed(0)}%`}
            />
          </div>

          {/* Overview section */}
          <section>
            <div className="eyebrow mb-3">Overview</div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Panel title="Total Revenue by Item (Successful Orders)">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topRevenueItems} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDEAE1" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="item" width={80} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                    <Bar dataKey="totalRevenue" fill={RED} name="Revenue ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>

              <Panel title="Orders by Company: Total vs Successful">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={companies} margin={{ bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDEAE1" />
                    <XAxis
                      dataKey="company"
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="totalOrders" fill="#EBC3C6" name="Total Orders" />
                    <Bar dataKey="successfulOrders" fill={RED} name="Successful Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>

              <Panel title="Item Demand: Times Requested vs Qty Requested">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topDemandItems}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDEAE1" />
                    <XAxis dataKey="item" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="totalQtyRequested" fill={RED} name="Total Qty Requested" />
                    <Bar dataKey="timesRequested" fill="#EBC3C6" name="Times Requested (Demand)" />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>

              <Panel title="Monthly Order Activity vs Successful Sales">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDEAE1" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="totalOrders" fill={RED_DIM} name="Total Orders (Activity)" />
                    <Bar dataKey="successfulOrders" fill="#EBC3C6" name="Successful Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>

              <Panel title="Total Orders Breakdown" className="lg:col-span-2">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </Panel>
            </div>
          </section>

          {/* Per-company rankings */}
          <section>
            <div className="eyebrow mb-3">Item Rankings by Company</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {companyKeys.map((company) => (
                <Panel key={company} title={company}>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                      data={perCompanyRankings[company]}
                      layout="vertical"
                      margin={{ left: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDEAE1" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="item" width={70} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="qty" fill={RED} name="Quantity Ordered" />
                    </BarChart>
                  </ResponsiveContainer>
                </Panel>
              ))}
            </div>
          </section>

          <p className="text-[11px] text-ink-faint mono pb-2">
            Snapshot generated from Project_Dashboard.xlsx. Regenerate analyticsData.js to refresh.
          </p>
        </div>
      </div>
    </div>
  );
}
