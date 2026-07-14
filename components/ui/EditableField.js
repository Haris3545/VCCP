import { useCallback } from 'react';

// contentEditable span styled to look like native copy until hover/focus,
// so Strategy edits don't read as a form. `as` controls the wrapper tag.
export default function EditableField({ value, onChange, as: Tag = 'span', ...rest }) {
  const handleBlur = useCallback(
    (e) => {
      const next = e.currentTarget.textContent;
      if (next !== value) onChange(next);
    },
    [value, onChange]
  );

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && e.currentTarget.tagName !== 'DIV') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  }, []);

  return (
    <span className="editable-wrap">
      <Tag
        className="editable"
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        {...rest}
      >
        {value}
      </Tag>
      <span className="editable-wrap__pencil" aria-hidden="true">
        ✎
      </span>
    </span>
  );
}
