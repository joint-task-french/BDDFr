import { useState, useEffect } from 'react';

export const STORAGE_KEY = 'div2_shd_watch';
export const SHD_LEVELS_UPDATED_EVENT = 'shd-levels-updated';

function clampLevel(level, maxLevel = Number.POSITIVE_INFINITY) {
  const parsed = Number(level);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(maxLevel, Math.round(parsed)));
}

function resolveMaxLevelForStat(statId, montreConfig) {
  const globalMax = Number(montreConfig?.max_points_per_stat);
  const fallbackMax = Number.isFinite(globalMax) ? globalMax : Number.POSITIVE_INFINITY;
  if (!montreConfig?.categories || !statId) return fallbackMax;

  for (const category of Object.values(montreConfig.categories)) {
    const stat = category?.stats?.[statId];
    if (!stat) continue;

    const step = Number(stat.step);
    const max = Number(stat.max);
    if (Number.isFinite(step) && step > 0 && Number.isFinite(max) && max >= 0) {
      return Math.round(max / step);
    }
    return fallbackMax;
  }

  return fallbackMax;
}

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

export function normalizeSHDLevels(levels, montreConfig) {
  const defaults = buildDefaultLevels(montreConfig);
  const normalized = { ...defaults };
  if (!levels || typeof levels !== 'object') return normalized;

  Object.entries(levels).forEach(([statId, level]) => {
    const isKnownInConfig = Object.prototype.hasOwnProperty.call(defaults, statId);
    if (isKnownInConfig || !montreConfig?.categories) {
      normalized[statId] = clampLevel(level, resolveMaxLevelForStat(statId, montreConfig));
    }
  });

  return normalized;
}

export function getSHDLevels(montreConfig) {
  const defaults = buildDefaultLevels(montreConfig);
  if (typeof window === 'undefined') return { ...defaults };

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return normalizeSHDLevels(parsed, montreConfig);
      }
    }
  } catch (e) {
    console.error("Failed to load SHD levels", e);
  }
  return { ...defaults };
}

export function saveSHDLevels(levels, montreConfig) {
  if (typeof window === 'undefined') return;

  try {
    const normalizedLevels = normalizeSHDLevels(levels, montreConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedLevels));
    // Événement local (même onglet) pour synchroniser les pages Build.
    window.dispatchEvent(new CustomEvent(SHD_LEVELS_UPDATED_EVENT, { detail: normalizedLevels }));
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

    const handleStorage = (event) => {
      if (event.key === STORAGE_KEY) {
        handleUpdate();
      }
    };

    window.addEventListener(SHD_LEVELS_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(SHD_LEVELS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [montreConfig]);

  useEffect(() => {
    setShdLevels(getSHDLevels(montreConfig));
  }, [montreConfig]);

  const updateStat = (statId, level) => {
    setShdLevels(prev => {
      const maxLevel = resolveMaxLevelForStat(statId, montreConfig);
      const newLevels = { ...prev, [statId]: clampLevel(level, maxLevel) };
      saveSHDLevels(newLevels, montreConfig);
      return newLevels;
    });
  };

  const setAllToMax = () => {
    setShdLevels(prev => {
      const defaultLevels = buildDefaultLevels(montreConfig);
      const keys = Object.keys(defaultLevels).length > 0 ? Object.keys(defaultLevels) : Object.keys(prev || {});
      const newLevels = {};
      keys.forEach(key => {
        newLevels[key] = resolveMaxLevelForStat(key, montreConfig);
      });
      saveSHDLevels(newLevels, montreConfig);
      return newLevels;
    });
  };

  const resetAll = () => {
    setShdLevels(() => {
      const defaultLevels = buildDefaultLevels(montreConfig);
      saveSHDLevels(defaultLevels, montreConfig);
      return defaultLevels;
    });
  };

  return {
    shdLevels,
    updateStat,
    setAllToMax,
    resetAll
  };
}
