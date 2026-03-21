import { useState } from 'react'
import { useBuild } from '../../context/BuildContext'
import WeaponSlot from './WeaponSlot'
import WeaponPicker from './WeaponPicker'
import WeaponTalentPicker from './WeaponTalentPicker'
import PrototypeTalentPicker from './PrototypeTalentPicker'

export default function WeaponSection({ data }) {
  const { specialWeapon, weapons, weaponTalents, weaponAttributes, weaponMods, sidearm, sidearmTalent, sidearmAttribute, sidearmMods, specialisation, SPECIALISATIONS, expertise, maxExpertiseLevel, weaponEssentialValues, prototypes, prototypeTalents, dispatch } = useBuild()
  const [pickerOpen, setPickerOpen] = useState(null)
  const [talentPickerSlot, setTalentPickerSlot] = useState(null)
  const [protoTalentSlot, setProtoTalentSlot] = useState(null)

  const handleExpertise = (slot, level) => dispatch({ type: 'SET_EXPERTISE_LEVEL', slot, level })

  const specLabel = specialisation ? SPECIALISATIONS[specialisation]?.label : null
  const specIcon = specialisation ? SPECIALISATIONS[specialisation]?.icon : '🎖️'

  return (
    <>
      {/* Arme spécifique — pleine largeur */}
      <div className="mb-4">
        <WeaponSlot
          label="Arme Spécifique"
          weapon={specialWeapon}
          headerColor="purple"
          armesType={data.armes_type}
          onSelect={() => setPickerOpen('special')}
          onRemove={() => dispatch({ type: 'REMOVE_SPECIAL_WEAPON' })}
          badge={specLabel && (
            <span className="text-xs font-bold uppercase tracking-widest bg-purple-500/15 text-purple-400 px-1.5 py-0.5 rounded">
              {specIcon} {specLabel}
            </span>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Arme primaire */}
        <WeaponSlot
          label="Arme Primaire"
          weapon={weapons[0]}
          talent={weaponTalents[0]}
          attribute={weaponAttributes[0]}
          allAttributs={data.attributs}
          modsArmes={data.modsArmes}
          weaponMods={weaponMods[0]}
          armesType={data.armes_type}
          data={data}
          onSelect={() => setPickerOpen('primary')}
          onRemove={() => dispatch({ type: 'REMOVE_WEAPON', slot: 0 })}
          onSelectTalent={() => setTalentPickerSlot(0)}
          onSetAttribute={(attr) => dispatch({ type: 'SET_WEAPON_ATTRIBUTE', slot: 0, attribute: attr })}
          onSetMods={(mods) => dispatch({ type: 'SET_WEAPON_MODS', slot: 0, mods })}
          expertiseSlot="weapon0"
          expertiseLevel={expertise?.weapon0 || 0}
          onExpertiseChange={handleExpertise}
          maxExpertiseLevel={maxExpertiseLevel}
          essentialSlotKey="weapon0"
          essentialValues={weaponEssentialValues?.weapon0}
          dispatch={dispatch}
          isPrototype={prototypes?.weapon0}
          prototypeTalent={prototypeTalents?.weapon0}
          onSelectPrototypeTalent={() => setProtoTalentSlot('weapon0')}
        />

        {/* Arme secondaire */}
        <WeaponSlot
          label="Arme Secondaire"
          weapon={weapons[1]}
          talent={weaponTalents[1]}
          attribute={weaponAttributes[1]}
          allAttributs={data.attributs}
          modsArmes={data.modsArmes}
          weaponMods={weaponMods[1]}
          armesType={data.armes_type}
          data={data}
          onSelect={() => setPickerOpen('secondary')}
          onRemove={() => dispatch({ type: 'REMOVE_WEAPON', slot: 1 })}
          onSelectTalent={() => setTalentPickerSlot(1)}
          onSetAttribute={(attr) => dispatch({ type: 'SET_WEAPON_ATTRIBUTE', slot: 1, attribute: attr })}
          onSetMods={(mods) => dispatch({ type: 'SET_WEAPON_MODS', slot: 1, mods })}
          expertiseSlot="weapon1"
          expertiseLevel={expertise?.weapon1 || 0}
          onExpertiseChange={handleExpertise}
          maxExpertiseLevel={maxExpertiseLevel}
          essentialSlotKey="weapon1"
          essentialValues={weaponEssentialValues?.weapon1}
          dispatch={dispatch}
          isPrototype={prototypes?.weapon1}
          prototypeTalent={prototypeTalents?.weapon1}
          onSelectPrototypeTalent={() => setProtoTalentSlot('weapon1')}
        />

        {/* Arme de poing */}
        <WeaponSlot
          label="Arme de Poing"
          weapon={sidearm}
          talent={sidearmTalent}
          attribute={sidearmAttribute}
          allAttributs={data.attributs}
          modsArmes={data.modsArmes}
          weaponMods={sidearmMods}
          headerColor="gray"
          armesType={data.armes_type}
          data={data}
          onSelect={() => setPickerOpen('sidearm')}
          onRemove={() => dispatch({ type: 'REMOVE_SIDEARM' })}
          onSelectTalent={() => setTalentPickerSlot('sidearm')}
          onSetAttribute={(attr) => dispatch({ type: 'SET_SIDEARM_ATTRIBUTE', attribute: attr })}
          onSetMods={(mods) => dispatch({ type: 'SET_SIDEARM_MODS', mods })}
          expertiseSlot="sidearm"
          expertiseLevel={expertise?.sidearm || 0}
          onExpertiseChange={handleExpertise}
          maxExpertiseLevel={maxExpertiseLevel}
          essentialSlotKey="sidearm"
          essentialValues={weaponEssentialValues?.sidearm}
          dispatch={dispatch}
          isPrototype={prototypes?.sidearm}
          prototypeTalent={prototypeTalents?.sidearm}
          onSelectPrototypeTalent={() => setProtoTalentSlot('sidearm')}
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
          weaponType={sidearm?.type}
          onClose={() => setTalentPickerSlot(null)}
        />
      )}

      {/* Prototype Talent Picker */}
      {protoTalentSlot && (
        <PrototypeTalentPicker
          data={data}
          slotKey={protoTalentSlot}
          onClose={() => setProtoTalentSlot(null)}
        />
      )}
    </>
  )
}
