import EmptyState from '@/components/ui/EmptyState';
import StatTiles from './StatTiles';
import CoverageList from './CoverageList';
import MentionsReachChart from './MentionsReachChart';

export default function DashboardView({ data }) {
  const anyLive = data.headline.some((stat) => stat.source === 'live') || data.mentionsReach?.source === 'live';

  return (
    <>
      {!anyLive && (
        <EmptyState>
          Awaiting live source connections — figures below are illustrative simulated data.
        </EmptyState>
      )}

      <StatTiles stats={data.headline} />

      <div className="grid grid--2" style={{ marginTop: 24 }}>
        <CoverageList coverage={data.coverage} />
        <MentionsReachChart trend={data.mentionsReach} />
      </div>
    </>
  );
}
