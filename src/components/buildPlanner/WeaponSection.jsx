import { useState } from 'react'
import { useBuild } from '../../context/BuildContext'
import { SPECIALISATIONS } from '../../utils/formatters'
import WeaponSlot from './WeaponSlot'
import WeaponPicker from './WeaponPicker'
import WeaponTalentPicker from './WeaponTalentPicker'

export default function WeaponSection({ data }) {
  const { specialWeapon, weapons, weaponTalents, sidearm, sidearmTalent, specialisation, dispatch } = useBuild()
  const [pickerOpen, setPickerOpen] = useState(null) // 'special' | 'primary' | 'secondary' | 'sidearm' | null
  const [talentPickerSlot, setTalentPickerSlot] = useState(null)

  const specLabel = specialisation ? SPECIALISATIONS[specialisation]?.label : null
  const specIcon = specialisation ? SPECIALISATIONS[specialisation]?.icon : '🎖️'

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Arme spécifique */}
        <WeaponSlot
          label="Arme Spécifique"
          weapon={specialWeapon}
          headerColor="purple"
          onSelect={() => setPickerOpen('special')}
          onRemove={() => dispatch({ type: 'REMOVE_SPECIAL_WEAPON' })}
          badge={specLabel && (
            <span className="text-[9px] font-bold uppercase tracking-widest bg-purple-500/15 text-purple-400 px-1.5 py-0.5 rounded">
              {specIcon} {specLabel}
            </span>
          )}
        />

        {/* Arme primaire */}
        <WeaponSlot
          label="Arme Primaire"
          weapon={weapons[0]}
          talent={weaponTalents[0]}
          onSelect={() => setPickerOpen('primary')}
          onRemove={() => dispatch({ type: 'REMOVE_WEAPON', slot: 0 })}
          onSelectTalent={() => setTalentPickerSlot(0)}
        />

        {/* Arme secondaire */}
        <WeaponSlot
          label="Arme Secondaire"
          weapon={weapons[1]}
          talent={weaponTalents[1]}
          onSelect={() => setPickerOpen('secondary')}
          onRemove={() => dispatch({ type: 'REMOVE_WEAPON', slot: 1 })}
          onSelectTalent={() => setTalentPickerSlot(1)}
        />

        {/* Arme de poing */}
        <WeaponSlot
          label="Arme de Poing"
          weapon={sidearm}
          talent={sidearmTalent}
          headerColor="gray"
          onSelect={() => setPickerOpen('sidearm')}
          onRemove={() => dispatch({ type: 'REMOVE_SIDEARM' })}
          onSelectTalent={() => setTalentPickerSlot('sidearm')}
        />
      </div>

      {/* Picker arme spécifique */}
      {pickerOpen === 'special' && (
        <WeaponPicker
          data={data}
          mode="special"
          onClose={() => setPickerOpen(null)}
          onSelect={(weapon) => {
            dispatch({ type: 'SET_SPECIAL_WEAPON', weapon })
            setPickerOpen(null)
          }}
        />
      )}

      {/* Picker armes classiques */}
      {(pickerOpen === 'primary' || pickerOpen === 'secondary') && (
        <WeaponPicker
          data={data}
          mode="classic"
          slotIndex={pickerOpen === 'primary' ? 0 : 1}
          onClose={() => setPickerOpen(null)}
          onSelect={(weapon) => {
            const slot = pickerOpen === 'primary' ? 0 : 1
            dispatch({ type: 'SET_WEAPON', slot, weapon })
            setPickerOpen(null)
            if (!weapon.estExotique) {
              setTimeout(() => setTalentPickerSlot(slot), 200)
            }
          }}
        />
      )}

      {/* Picker arme de poing */}
      {pickerOpen === 'sidearm' && (
        <WeaponPicker
          data={data}
          mode="sidearm"
          onClose={() => setPickerOpen(null)}
          onSelect={(weapon) => {
            dispatch({ type: 'SET_SIDEARM', weapon })
            setPickerOpen(null)
            if (!weapon.estExotique) {
              setTimeout(() => setTalentPickerSlot('sidearm'), 200)
            }
          }}
        />
      )}

      {/* Talent picker */}
      {talentPickerSlot !== null && talentPickerSlot !== 'sidearm' && (
        <WeaponTalentPicker
          data={data}
          slotIndex={talentPickerSlot}
          weaponType={weapons[talentPickerSlot]?.type}
          onClose={() => setTalentPickerSlot(null)}
        />
      )}
      {talentPickerSlot === 'sidearm' && (
        <WeaponTalentPicker
          data={data}
          slotIndex="sidearm"
          weaponType="pistolet"
          onClose={() => setTalentPickerSlot(null)}
        />
      )}
    </>
  )
}
