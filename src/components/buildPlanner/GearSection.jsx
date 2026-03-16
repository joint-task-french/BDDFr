import { useState, useMemo } from 'react'
import { useBuild } from '../../context/BuildContext'
import { getGearSlots, getGearSlotLabel, getGearSlotEmoji } from '../../utils/formatters'
import GearSlot from './GearSlot'
import GearPicker from './GearPicker'
import GearTalentPicker from './GearTalentPicker'

export default function GearSection({ data }) {
    const { gear, gearTalents, gearAttributes, gearMods, expertise, maxExpertiseLevel, dispatch } = useBuild()
    const [pickerSlot, setPickerSlot] = useState(null)
    const [talentSlot, setTalentSlot] = useState(null)

    const handleExpertise = (slot, level) => dispatch({ type: 'SET_EXPERTISE_LEVEL', slot, level })

    const gearSlots = useMemo(() => getGearSlots(data.equipements_type), [data.equipements_type])

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {gearSlots.map(slot => (
                    <GearSlot
                        key={slot}
                        slotKey={slot}
                        label={getGearSlotLabel(data.equipements_type, slot)}
                        icon={getGearSlotEmoji(data.equipements_type, slot)}
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
                        gearMods={gearMods[slot] || []}
                        onSetMod={(mod, modIndex) => dispatch({ type: 'SET_GEAR_MOD', slot, mod, modIndex })}
                        attributsType={data.attributs_type}
                        expertiseLevel={expertise?.[slot] || 0}
                        onExpertiseChange={handleExpertise}
                        maxExpertiseLevel={maxExpertiseLevel}
                    />
                ))}
            </div>

            {pickerSlot && (
                <GearPicker
                    data={data}
                    slotKey={pickerSlot}
                    onClose={() => setPickerSlot(null)}
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