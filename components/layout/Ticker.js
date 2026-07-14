// Decorative, always-on strip. Explicitly labelled SIMULATED — nothing here
// should ever be mistaken for a live feed by someone in the room.
const ITEMS = [
  { label: 'Cultural Buzz Score', value: '87/100', delta: '+4.2' },
  { label: 'Streaming Momentum', value: '112 idx', delta: '+6.8' },
  { label: 'Social Sentiment', value: '74% pos.', delta: '-1.3' },
  { label: 'Press Mentions', value: '342/wk', delta: '+11.5' },
  { label: 'Search Interest', value: '91 idx', delta: '+2.1' },
];

export default function Ticker() {
  const loop = [...ITEMS, ...ITEMS];
  return (
    <div className="ticker">
      <div className="ticker__track">
        {loop.map((item, i) => (
          <span className="ticker__item" key={`${item.label}-${i}`}>
            <span className="ticker__dot" />
            {item.label} <strong>{item.value}</strong> ({item.delta})
          </span>
        ))}
        <span className="ticker__item">
          <span className="ticker__dot" />
          SIMULATED — awaiting live source connection
        </span>
      </div>
    </div>
  );
}
