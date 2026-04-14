import { useState, useEffect } from 'react';

const STORAGE_KEY = 'div2_shd_watch';

function buildDefaultLevels(montreConfig) {
  const defaults = {};
  if (!montreConfig?.categories) return defaults;

  Object.values(montreConfig.categories).forEach(cat => {
    if (!cat?.stats) return;
    Object.keys(cat.stats).forEach(statId => {
      defaults[statId] = 0;
    });
  });

  return defaults;
}

export function getSHDLevels(montreConfig) {
  const defaults = buildDefaultLevels(montreConfig);
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaults, ...parsed };
    }
  } catch (e) {
    console.error("Failed to load SHD levels", e);
  }
  return { ...defaults };
}

export function saveSHDLevels(levels) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
    // Déclencher un événement personnalisé pour informer les autres composants
    window.dispatchEvent(new Event('shd-levels-updated'));
  } catch (e) {
    console.error("Failed to save SHD levels", e);
  }
}

export function useSHDWatch(montreConfig) {
  const [shdLevels, setShdLevels] = useState(() => getSHDLevels(montreConfig));

  useEffect(() => {
    const handleUpdate = () => {
      setShdLevels(getSHDLevels(montreConfig));
    };
    window.addEventListener('shd-levels-updated', handleUpdate);
    return () => window.removeEventListener('shd-levels-updated', handleUpdate);
  }, [montreConfig]);

  useEffect(() => {
    setShdLevels(getSHDLevels(montreConfig));
  }, [montreConfig]);

  const updateStat = (statId, level) => {
    const newLevels = { ...shdLevels, [statId]: level };
    setShdLevels(newLevels);
    saveSHDLevels(newLevels);
  };

  const setAllToMax = () => {
    const defaultLevels = buildDefaultLevels(montreConfig);
    const keys = Object.keys(defaultLevels).length > 0 ? Object.keys(defaultLevels) : Object.keys(shdLevels || {});
    const newLevels = {};
    keys.forEach(key => {
      newLevels[key] = 50;
    });
    setShdLevels(newLevels);
    saveSHDLevels(newLevels);
  };

  const resetAll = () => {
    const defaultLevels = buildDefaultLevels(montreConfig);
    setShdLevels(defaultLevels);
    saveSHDLevels(defaultLevels);
  };

  return {
    shdLevels,
    updateStat,
    setAllToMax,
    resetAll
  };
}
