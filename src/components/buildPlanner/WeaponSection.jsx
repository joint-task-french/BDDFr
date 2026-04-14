import { useState } from 'react'
import { useBuild } from '../../context/BuildContext'
import WeaponSlot from './WeaponSlot'
import WeaponPicker from './WeaponPicker'
import WeaponTalentPicker from './WeaponTalentPicker'
import PrototypeTalentPicker from './PrototypeTalentPicker'
import {GameIcon, resolveAsset} from "../common/GameAssets.jsx";
import { getWeaponTypeLabel } from '../../utils/formatters'

export default function WeaponSection({ data }) {
  const { specialWeapon, weapons, weaponTalents, weaponAttributes, weaponMods, sidearm, sidearmTalent, sidearmAttribute, sidearmMods, specialisation, SPECIALISATIONS, classSpe, expertise, maxExpertiseLevel, weaponEssentialValues, prototypes, prototypeTalents, specialWeaponBonusPoints, dispatch } = useBuild()
  const [pickerOpen, setPickerOpen] = useState(null)
  const [talentPickerSlot, setTalentPickerSlot] = useState(null)
  const [protoTalentSlot, setProtoTalentSlot] = useState(null)

  const handleExpertise = (slot, level) => dispatch({ type: 'SET_EXPERTISE_LEVEL', slot, level })
  const classStats = specialisation ? classSpe?.[specialisation]?.classStats : null
  const bonusArmeConfig = classStats?.bonusArme
  const weaponTypeChoices = Object.entries(data.armes_type || {}).filter(([, def]) => def?.type !== 'specifique')
  const totalBonusPoints = Object.values(specialWeaponBonusPoints || {}).reduce((sum, value) => sum + (Number(value) || 0), 0)

  const setBonusPoints = (weaponType, nextPoints) => {
    if (!bonusArmeConfig) return
    dispatch({
      type: 'SET_SPECIAL_WEAPON_BONUS_POINT',
      weaponType,
      points: nextPoints,
      maxElement: bonusArmeConfig.maxElement,
      maxPoints: bonusArmeConfig.maxPoints,
    })
  }

  const specLabel = specialisation ? SPECIALISATIONS[specialisation]?.label : null
  const specIcon = specialisation ? <GameIcon src={resolveAsset(SPECIALISATIONS[specialisation]?.icon)} size='w-6 h-6' /> : '🎖️'
  const specialWeaponBonusPanel = (specialWeapon && bonusArmeConfig) ? (
    <div className="border border-purple-500/20 rounded bg-purple-900/10 p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs text-purple-200/80">
          {totalBonusPoints}/{bonusArmeConfig.maxPoints} points
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {weaponTypeChoices.map(([weaponType]) => {
          const points = specialWeaponBonusPoints?.[weaponType] || 0
          const maxPerType = bonusArmeConfig.maxElement || 3
          const bonusPercent = points * (bonusArmeConfig.valeurParPoint || 0)
          const canIncrease = points < maxPerType && totalBonusPoints < (bonusArmeConfig.maxPoints || 9)
          const canDecrease = points > 0
          return (
            <div key={weaponType} className="flex items-center justify-between gap-2 bg-black/20 border border-purple-500/10 rounded px-2 py-1.5">
              <div className="min-w-0">
                <div className="text-xs text-gray-300 truncate">{getWeaponTypeLabel(data.armes_type, weaponType)}</div>
                <div className="text-2xs text-purple-300/80">+{bonusPercent}% ({points}/{maxPerType})</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setBonusPoints(weaponType, points - 1)}
                  disabled={!canDecrease}
                  className="w-6 h-6 rounded border border-purple-400/30 text-purple-200 disabled:opacity-30"
                >-</button>
                <button
                  type="button"
                  onClick={() => setBonusPoints(weaponType, points + 1)}
                  disabled={!canIncrease}
                  className="w-6 h-6 rounded border border-purple-400/30 text-purple-200 disabled:opacity-30"
                >+</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  ) : null

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
          expertiseSlot="special"
          expertiseLevel={expertise?.special || 0}
          onExpertiseChange={handleExpertise}
          maxExpertiseLevel={maxExpertiseLevel}
          extraPanel={specialWeaponBonusPanel}
          extraPanelTitle="Bonus de spécialisation"
          extraPanelDefaultOpen={false}
          badge={specLabel && (
            <span className="text-xs font-bold uppercase tracking-widest bg-purple-500/15 text-purple-400 px-1.5 py-0.5 rounded flex flex-row items-center gap-1">
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
