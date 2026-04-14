import { useState, useEffect } from 'react';

// Charger le fichier JSONC de la montre pour en extraire les clés dynamiquement
const rawMontre = import.meta.glob('../data/montre/montre.jsonc', { query: '?raw', eager: true, import: 'default' })['../data/montre/montre.jsonc'];

function stripJsonComments(text) {
  if (!text) return '';
  let cleanText = text.replace(/^\uFEFF/, '');
  return cleanText.replace(/("(?:\\.|[^\\"])*")|(\/\*[\s\S]*?\*\/)|(\/\/(?:.*)$)/gm, (match, string) => {
    if (string) return string;
    return '';
  });
}

const config = JSON.parse(stripJsonComments(rawMontre));
const DEFAULT_SHD_LEVELS = {};

// Extraire toutes les stats de la config pour initialiser les niveaux à 0
if (config && config.categories) {
  Object.values(config.categories).forEach(cat => {
    if (cat.stats) {
      Object.keys(cat.stats).forEach(statId => {
        DEFAULT_SHD_LEVELS[statId] = 0;
      });
    }
  });
}

const STORAGE_KEY = 'div2_shd_watch';

export function getSHDLevels() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_SHD_LEVELS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Failed to load SHD levels", e);
  }
  return { ...DEFAULT_SHD_LEVELS };
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

export function useSHDWatch() {
  const [shdLevels, setShdLevels] = useState(getSHDLevels());

  useEffect(() => {
    const handleUpdate = () => {
      setShdLevels(getSHDLevels());
    };
    window.addEventListener('shd-levels-updated', handleUpdate);
    return () => window.removeEventListener('shd-levels-updated', handleUpdate);
  }, []);

  const updateStat = (statId, level) => {
    const newLevels = { ...shdLevels, [statId]: level };
    setShdLevels(newLevels);
    saveSHDLevels(newLevels);
  };

  const setAllToMax = () => {
    const newLevels = {};
    Object.keys(DEFAULT_SHD_LEVELS).forEach(key => {
      newLevels[key] = 50;
    });
    setShdLevels(newLevels);
    saveSHDLevels(newLevels);
  };

  const resetAll = () => {
    setShdLevels(DEFAULT_SHD_LEVELS);
    saveSHDLevels(DEFAULT_SHD_LEVELS);
  };

  return {
    shdLevels,
    updateStat,
    setAllToMax,
    resetAll
  };
}
