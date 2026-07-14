import EditableField from '@/components/ui/EditableField';
import EditableList from '@/components/ui/EditableList';
import GrowthAudiencesDiagram from './GrowthAudiencesDiagram';
import CommsPillars from './CommsPillars';

export default function SoapPage({ soap, onChange }) {
  const set = (key) => (next) => onChange({ ...soap, [key]: next });

  const updateLever = (i, key) => (next) => {
    const copy = soap.growthLevers.map((lever, idx) =>
      idx === i ? { ...lever, [key]: next } : lever
    );
    onChange({ ...soap, growthLevers: copy });
  };

  return (
    <div className="grid" style={{ gap: 20 }}>
      <div className="grid grid--2">
        <div className="card">
          <h2>Objectives</h2>
          <div style={{ marginTop: 12 }}>
            <EditableList items={soap.objectives} onChange={set('objectives')} />
          </div>
        </div>
        <div className="card">
          <h2>KPIs</h2>
          <div style={{ marginTop: 12 }}>
            <EditableList items={soap.kpis} onChange={set('kpis')} />
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Three growth levers</h2>
        <div className="lever-list" style={{ marginTop: 14 }}>
          {soap.growthLevers.map((lever, i) => (
            <div className="list-row" key={i}>
              <div style={{ minWidth: 220 }}>
                <EditableField
                  as="div"
                  value={lever.title}
                  onChange={updateLever(i, 'title')}
                  style={{ fontWeight: 700 }}
                />
              </div>
              <EditableField
                as="div"
                value={lever.description}
                onChange={updateLever(i, 'description')}
                style={{ fontSize: 13, color: 'var(--muted)' }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid--2">
        <div className="card">
          <h2>Growth audiences</h2>
          <GrowthAudiencesDiagram value={soap.growthAudiences} onChange={set('growthAudiences')} />
        </div>
        <div className="card">
          <h2>Comms pillars</h2>
          <p style={{ marginTop: 12, marginBottom: 4, fontSize: 12, color: 'var(--muted)' }}>
            Referenced app-wide — Calendar and Locations pillars key off these.
          </p>
        </div>
      </div>

      <div>
        <h2 style={{ marginBottom: 14 }}>Tease / Release / Sustain</h2>
        <CommsPillars pillars={soap.pillars} onChange={set('pillars')} />
      </div>
    </div>
  );
}
