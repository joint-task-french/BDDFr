import { useState } from 'react'
import { useBuild } from '../../context/BuildContext'
import SkillSlot from './SkillSlot'
import SkillPicker from './SkillPicker'

export default function SkillSection({ data }) {
  const { skills, skillMods } = useBuild()
  const [pickerSlot, setPickerSlot] = useState(null)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[0, 1].map(i => (
          <SkillSlot
            key={i}
            slotIndex={i}
            skill={skills[i]}
            skillMod={skillMods[i]}
            modsCompetences={data.modsCompetences}
            allAttributs={data.attributs}
            statistiques={data.statistiques}
            onSelect={() => setPickerSlot(i)}
          />
        ))}
      </div>

      {pickerSlot !== null && (
        <SkillPicker
          data={data}
          slotIndex={pickerSlot}
          onClose={() => setPickerSlot(null)}
        />
      )}
    </>
  )
}

