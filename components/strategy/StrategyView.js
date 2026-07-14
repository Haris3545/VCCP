import { useState } from 'react';
import artistConfig from '@/lib/artist.config';
import { useLocalStorage } from '@/lib/useLocalStorage';
import EmptyState from '@/components/ui/EmptyState';
import ResetButton from '@/components/ui/ResetButton';
import SoapPage from './SoapPage';
import PoapPage from './PoapPage';

export default function StrategyView({ defaults }) {
  const [view, setView] = useState('soap');
  const [soap, setSoap, resetSoap, soapHydrated] = useLocalStorage(
    `vccp.${artistConfig.artistId}.strategy.soap`,
    defaults.soap
  );
  const [poap, setPoap, resetPoap, poapHydrated] = useLocalStorage(
    `vccp.${artistConfig.artistId}.strategy.poap`,
    defaults.poap
  );

  const hydrated = soapHydrated && poapHydrated;

  return (
    <>
      <EmptyState>
        Edits below are saved to this browser only — no shared backend in this tier.
      </EmptyState>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div className="strategy-switch">
          <button
            type="button"
            className={`strategy-switch__opt${view === 'soap' ? ' strategy-switch__opt--active' : ''}`}
            onClick={() => setView('soap')}
          >
            SOAP
          </button>
          <button
            type="button"
            className={`strategy-switch__opt${view === 'poap' ? ' strategy-switch__opt--active' : ''}`}
            onClick={() => setView('poap')}
          >
            POAP
          </button>
        </div>
        <ResetButton
          label={`Reset ${view.toUpperCase()} to default`}
          onClick={() => (view === 'soap' ? resetSoap() : resetPoap())}
        />
      </div>

      <div style={{ marginTop: 20, opacity: hydrated ? 1 : 0 }}>
        {view === 'soap' ? (
          <SoapPage soap={soap} onChange={setSoap} />
        ) : (
          <PoapPage poap={poap} onChange={setPoap} />
        )}
      </div>
    </>
  );
}
