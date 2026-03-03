import { useState } from 'react'
import { useBuild } from '../../context/BuildContext'
import { GEAR_SLOTS, GEAR_SLOT_LABELS, GEAR_SLOT_ICONS } from '../../utils/formatters'
import GearSlot from './GearSlot'
import GearPicker from './GearPicker'
import GearTalentPicker from './GearTalentPicker'

export default function GearSection({ data }) {
  const { gear, gearTalents, gearAttributes, gearMods, dispatch } = useBuild()
  const [pickerSlot, setPickerSlot] = useState(null)
  const [talentSlot, setTalentSlot] = useState(null)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GEAR_SLOTS.map(slot => (
          <GearSlot
            key={slot}
            slotKey={slot}
            label={GEAR_SLOT_LABELS[slot]}
            icon={GEAR_SLOT_ICONS[slot]}
            piece={gear[slot]}
            talent={(slot === 'torse' || slot === 'sac_a_dos') ? gearTalents[slot] : null}
            hasTalentSlot={slot === 'torse' || slot === 'sac_a_dos'}
            onSelect={() => setPickerSlot(slot)}
            onSelectTalent={() => setTalentSlot(slot)}
            ensembles={data.ensembles}
            talentsEquipements={data.talentsEquipements}
            allAttributs={data.attributs}
            gearAttributes={gearAttributes[slot] || null}
            onSetAttributes={(attrs) => dispatch({ type: 'SET_GEAR_ATTRIBUTES', slot, attributes: attrs })}
            modsEquipements={data.modsEquipements}
            gearMod={gearMods[slot] || null}
            onSetMod={(mod) => dispatch({ type: 'SET_GEAR_MOD', slot, mod })}
          />
        ))}
      </div>

      {pickerSlot && (
        <GearPicker
          data={data}
          slotKey={pickerSlot}
          onClose={() => setPickerSlot(null)}
          onSelectTalent={(s) => {
            setPickerSlot(null)
            if (s === 'torse' || s === 'sac_a_dos') {
              setTimeout(() => setTalentSlot(s), 200)
            }
          }}
        />
      )}

      {talentSlot && (
        <GearTalentPicker
          data={data}
          slotKey={talentSlot}
          onClose={() => setTalentSlot(null)}
        />
      )}
    </>
  )
}

