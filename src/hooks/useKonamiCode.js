import { useState, useEffect, useCallback } from 'react';

const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'b', 'a'
];

export const useKonamiCode = (onActivate) => {
  const [input, setInput] = useState([]);

  const handleKeyDown = useCallback((e) => {
    const nextInput = [...input, e.key].slice(-KONAMI_CODE.length);
    setInput(nextInput);

    if (nextInput.join(',') === KONAMI_CODE.join(',')) {
      onActivate();
      setInput([]);
    }
  }, [input, onActivate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return null;
};
