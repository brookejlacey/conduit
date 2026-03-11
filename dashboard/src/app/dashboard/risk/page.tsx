'use client';

import { useVaults } from '@/hooks/useVaults';

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
  const { vaults, loading } = useVaults();

  // Compute risk scores from real vault data
  const computeRiskScores = () => {
    if (vaults.length === 0) {
      return { concentration: 0, utilization: 0, counterparty: 0, fx: 20, operational: 10, liquidity: 0, overall: 0 };
    }

    // Concentration: how concentrated are deposits in a single vault
    const deposits = vaults.map((v) => Number(v.totalDeposits.toString()));
    const totalDeposits = deposits.reduce((a, b) => a + b, 0);
    const maxDeposit = Math.max(...deposits);
    const concentration = totalDeposits > 0 ? Math.round((maxDeposit / totalDeposits) * 100) : 0;

    // Utilization: average daily spend utilization
    const utilizations = vaults.map((v) => {
      const limit = Number(v.policy.dailySpendLimit.toString());
      const spent = Number(v.policy.dailySpent.toString());
      return limit > 0 ? (spent / limit) * 100 : 0;
    });
    const utilization = Math.round(utilizations.reduce((a, b) => a + b, 0) / utilizations.length);

    // Counterparty: inverse of diversification
    const avgCounterparties = vaults.reduce((sum, v) => sum + v.policy.approvedCounterparties.length, 0) / vaults.length;
    const counterparty = Math.round(Math.max(0, 50 - avgCounterparties * 10));

    // Liquidity: ratio of low-balance vaults
    const lowBalanceCount = vaults.filter((v) => Number(v.totalDeposits.toString()) < 1000 * 1e6).length;
    const liquidity = Math.round((lowBalanceCount / vaults.length) * 100);

    // FX and operational are fixed baseline scores (would need oracle data)
    const fx = 20;
    const operational = 10;

    // Weighted overall
    const overall = Math.round(
      concentration * 0.2 + utilization * 0.15 + counterparty * 0.2 + fx * 0.15 + operational * 0.1 + liquidity * 0.2,
    );

    return { concentration, utilization, counterparty, fx, operational, liquidity, overall };
  };

  const riskScores = computeRiskScores();

  const overallColor =
    riskScores.overall < 30
      ? 'text-conduit-emerald-400'
      : riskScores.overall < 60
        ? 'text-conduit-amber-400'
        : 'text-red-400';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-conduit-navy-50">Risk Dashboard</h1>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-conduit-blue-400 border-t-transparent" />
          <span className="ml-3 text-conduit-navy-300">Computing risk scores...</span>
        </div>
      )}

      {!loading && (
        <>
          {/* Overall Risk Score */}
          <div className="card flex items-center gap-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-conduit-navy-600">
              <span className={`text-3xl font-bold ${overallColor}`}>{riskScores.overall}</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-conduit-navy-100">Overall Risk Score</h2>
              <p className="text-sm text-conduit-navy-400">
                Weighted composite of all risk categories computed from {vaults.length} vault{vaults.length !== 1 ? 's' : ''}.
                Score below 30 is low risk, 30-60 is moderate, above 60 is elevated.
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

          {/* Dynamic Alerts */}
          <div className="card">
            <h2 className="mb-4 text-lg font-semibold text-conduit-navy-100">Active Alerts</h2>
            <div className="space-y-3">
              {riskScores.utilization > 60 && (
                <div className="flex items-center gap-3 rounded-lg border border-conduit-amber-500/30 bg-conduit-amber-500/10 p-4">
                  <div className="h-2 w-2 rounded-full bg-conduit-amber-400" />
                  <div>
                    <p className="text-sm font-medium text-conduit-amber-400">Utilization Warning</p>
                    <p className="text-xs text-conduit-navy-300">
                      Average daily spend utilization at {riskScores.utilization}%. Consider increasing daily limits or rebalancing.
                    </p>
                  </div>
                </div>
              )}
              {riskScores.concentration > 70 && (
                <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                  <div className="h-2 w-2 rounded-full bg-red-400" />
                  <div>
                    <p className="text-sm font-medium text-red-400">Concentration Alert</p>
                    <p className="text-xs text-conduit-navy-300">
                      {riskScores.concentration}% of deposits in a single vault. Diversify across vaults.
                    </p>
                  </div>
                </div>
              )}
              {riskScores.overall < 30 && (
                <div className="flex items-center gap-3 rounded-lg border border-conduit-navy-600 bg-conduit-navy-800 p-4">
                  <div className="h-2 w-2 rounded-full bg-conduit-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-conduit-navy-200">All Clear</p>
                    <p className="text-xs text-conduit-navy-400">
                      Overall risk is low. All metrics within acceptable thresholds.
                    </p>
                  </div>
                </div>
              )}
              {vaults.length === 0 && (
                <p className="py-2 text-center text-sm text-conduit-navy-400">
                  No vaults found. Deploy programs and create vaults to see risk metrics.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
