import { useRef, useState, useEffect } from 'react';

const ChipInput = ({ label, values, setValues, disabled, placeholder, maxTags }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [values]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val.includes(',')) return; // prevent direct comma input
    setInput(val);
  };

  const handleInputKeyDown = (e) => {
    if (
      (e.key === 'Enter' || e.key === ',') &&
      input.trim() &&
      (!maxTags || values.length < maxTags)
    ) {
      e.preventDefault();
      const trimmed = input.trim();
      if (
        trimmed &&
        !values.includes(trimmed) &&
        !trimmed.includes(',')
      ) {
        setValues([...values, trimmed]);
      }
      setInput('');
    } else if (e.key === 'Backspace' && input === '' && values.length > 0) {
      setValues(values.slice(0, -1));
    }
  };

  const removeChip = (idx) => {
    setValues(values.filter((_, i) => i !== idx));
  };

  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-medium mb-1">{label}</label>
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border border-gray-300 focus-within:ring-2 focus-within:ring-green-500 min-h-[44px]">
        {values.map((val, idx) => (
          <span
            key={idx}
            className="bg-green-100 text-green-800 px-2 py-1 rounded-md flex items-center"
          >
            {val}
            <button
              type="button"
              className="ml-1 text-green-600 hover:text-red-600"
              onClick={() => removeChip(idx)}
              disabled={disabled}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          className="flex-grow min-w-[100px] px-1 py-1 focus:outline-none"
          disabled={disabled || (maxTags && values.length >= maxTags)}
          placeholder={maxTags && values.length >= maxTags ? `Max ${maxTags} reached` : placeholder}
        />
      </div>
      {maxTags && (
        <span className="text-xs text-gray-500">
          {maxTags - values.length} tags remaining
        </span>
      )}
    </div>
  );
};

export default ChipInput;
