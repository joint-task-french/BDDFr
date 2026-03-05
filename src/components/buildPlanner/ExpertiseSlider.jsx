/**
 * Slider d'expertise pour un slot d'équipement ou d'arme.
 * Le niveau max est récupéré depuis metadata.maxExpertiseLevel.
 */
export default function ExpertiseSlider({ slot, level, onChange, maxLevel = 20 }) {
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <span className="text-xs text-gray-600 uppercase tracking-widest shrink-0 w-14">
        Expertise
      </span>
      <input
        type="range"
        min={0}
        max={maxLevel}
        step={1}
        value={level}
        onChange={e => onChange(slot, parseInt(e.target.value))}
        className="attr-slider flex-1"
      />
      <span className={`text-xs font-bold shrink-0 w-8 text-right ${level > 0 ? 'text-shd' : 'text-gray-600'}`}>
        {level > 0 ? `+${level}` : '0'}
      </span>
    </div>
  )
}
