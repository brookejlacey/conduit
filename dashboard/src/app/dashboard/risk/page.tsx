'use client';

import { MetricCard } from '@/components/shared/MetricCard';

const riskScores = {
  concentration: 35,
  utilization: 62,
  counterparty: 28,
  fx: 41,
  operational: 15,
  liquidity: 22,
  overall: 34,
};

function RiskGauge({ label, score }: { label: string; score: number }) {
  const getColor = (s: number) => {
    if (s < 30) return 'text-conduit-emerald-400 bg-conduit-emerald-400';
    if (s < 60) return 'text-conduit-amber-400 bg-conduit-amber-400';
    return 'text-red-400 bg-red-400';
  };

  const colorClass = getColor(score);
  const textColor = colorClass.split(' ')[0];
  const bgColor = colorClass.split(' ')[1];

  return (
    <div className="card">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-conduit-navy-200">{label}</span>
        <span className={`text-lg font-bold ${textColor}`}>{score}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-conduit-navy-700">
        <div
          className={`h-full rounded-full ${bgColor} transition-all duration-500`}
          style={{ width: `${score}%`, opacity: 0.8 }}
        />
      </div>
    </div>
  );
}

export default function RiskPage() {
  const overallColor =
    riskScores.overall < 30
      ? 'text-conduit-emerald-400'
      : riskScores.overall < 60
        ? 'text-conduit-amber-400'
        : 'text-red-400';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-conduit-navy-50">Risk Dashboard</h1>

      {/* Overall Risk Score */}
      <div className="card flex items-center gap-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-conduit-navy-600">
          <span className={`text-3xl font-bold ${overallColor}`}>{riskScores.overall}</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-conduit-navy-100">Overall Risk Score</h2>
          <p className="text-sm text-conduit-navy-400">
            Weighted composite of all risk categories. Score below 30 is low risk, 30-60 is
            moderate, above 60 is elevated.
          </p>
        </div>
      </div>

      {/* Risk Categories */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <RiskGauge label="Concentration Risk" score={riskScores.concentration} />
        <RiskGauge label="Utilization Risk" score={riskScores.utilization} />
        <RiskGauge label="Counterparty Risk" score={riskScores.counterparty} />
        <RiskGauge label="FX Risk" score={riskScores.fx} />
        <RiskGauge label="Operational Risk" score={riskScores.operational} />
        <RiskGauge label="Liquidity Risk" score={riskScores.liquidity} />
      </div>

      {/* Active Alerts */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-conduit-navy-100">Active Alerts</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg border border-conduit-amber-500/30 bg-conduit-amber-500/10 p-4">
            <div className="h-2 w-2 rounded-full bg-conduit-amber-400" />
            <div>
              <p className="text-sm font-medium text-conduit-amber-400">
                Utilization Warning
              </p>
              <p className="text-xs text-conduit-navy-300">
                Vault #2 daily spend utilization at 81.7%. Consider increasing daily limit or
                rebalancing.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-conduit-navy-600 bg-conduit-navy-800 p-4">
            <div className="h-2 w-2 rounded-full bg-conduit-emerald-400" />
            <div>
              <p className="text-sm font-medium text-conduit-navy-200">
                All Clear: Counterparty Risk
              </p>
              <p className="text-xs text-conduit-navy-400">
                No single counterparty exceeds 15% of total exposure. Well diversified.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
