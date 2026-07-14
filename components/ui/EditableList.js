import EditableField from './EditableField';

// Values-only editing over a fixed-length list of strings — no add/remove
// in this pass (kept out of scope for the Lite build).
export default function EditableList({ items, onChange, ordered = false }) {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 8 }}>
      {items.map((item, i) => (
        <li key={i}>
          <EditableField
            as="div"
            value={item}
            onChange={(next) => {
              const copy = items.slice();
              copy[i] = next;
              onChange(copy);
            }}
          />
        </li>
      ))}
    </Tag>
  );
}
