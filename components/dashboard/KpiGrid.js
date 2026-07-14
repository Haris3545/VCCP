import KpiCard from '@/components/ui/KpiCard';

export default function KpiGrid({ kpis }) {
  return (
    <div className="grid grid--kpi">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}
