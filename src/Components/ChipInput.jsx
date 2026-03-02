import { useRef, useState, useEffect } from 'react';

const ChipInput = ({ label, values, setValues, disabled, placeholder, maxTags }) => {
  const [input, setInput] = useState('');
  const [draggedIdx, setDraggedIdx] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [values]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val.includes(',')) return; // prevent direct comma input
    setInput(val);
  };

  const handleInputPaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    
    if (pastedText.includes(',')) {
      // Split by comma and process each tag
      const tags = pastedText.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0 && !values.includes(tag));
      
      // Add tags up to the max limit
      const availableSlots = maxTags ? maxTags - values.length : tags.length;
      const tagsToAdd = tags.slice(0, availableSlots);
      
      if (tagsToAdd.length > 0) {
        setValues([...values, ...tagsToAdd]);
      }
      
      setInput('');
    } else {
      // Single tag paste - just set the input
      setInput(pastedText.trim());
    }
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

  const handleDragStart = (e, idx) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === dropIdx) return;
    const newValues = [...values];
    const [draggedItem] = newValues.splice(draggedIdx, 1);
    newValues.splice(dropIdx, 0, draggedItem);
    setValues(newValues);
    setDraggedIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-medium mb-1">{label}</label>
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border border-gray-300 focus-within:ring-2 focus-within:ring-green-500 min-h-[44px]">
        {values.map((val, idx) => (
          <span
            key={idx}
            draggable={!disabled}
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
            className={`bg-green-100 text-green-800 px-2 py-1 rounded-md flex items-center cursor-move ${draggedIdx === idx ? 'opacity-50' : ''}`}
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
          onPaste={handleInputPaste}
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
