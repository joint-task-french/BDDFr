import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom'
import Badge from '../../common/Badge'
import { getGearSlotLabel } from '../../../utils/formatters'
import { GEAR_SLOT_ICONS_IMG, resolveIcon, GameIcon } from '../../common/gameAssets.jsx'
import MarkdownText from '../../common/MarkdownText'

function hasContent(v) {
  return v && v !== '' && v !== 'n/a' && v !== '-'
}

export default function TalentEquipCard({ item, equipements, equipementsType, isStatic }) {
  const params = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const isExotic = item.estExotique
  const isGearSet = item.gearSet || item.gear_set
  const hasPerfect = !isExotic && !!item.perfectDescription
  const nameColor = isExotic ? 'text-red-400' : isGearSet ? 'text-emerald-400' : 'text-shd'
  const borderColor = isExotic ? 'border-l-red-500' : isGearSet ? 'border-l-emerald-500' : ''
  const talentIcon = resolveIcon(item.icon)
  const slotIcon = GEAR_SLOT_ICONS_IMG[item.emplacement]

  const isUrlPerfect = params.slug === item.slug && params.modifier === 'parfait'
  const forcePerfect = searchParams.get('parfait') === 'true'

  const [showPerfect, setShowPerfect] = useState(isUrlPerfect || forcePerfect)

  useEffect(() => {
    if (isStatic) {
      setShowPerfect(forcePerfect)
    } else if (params.slug === item.slug) {
      setShowPerfect(params.modifier === 'parfait')
    }
  }, [params.modifier, params.slug, item.slug, isStatic])

  const togglePerfect = (e) => {
    e.preventDefault()
    e.stopPropagation()

    const nextState = !showPerfect
    setShowPerfect(nextState)

    if (isStatic) return

    const category = params.category || 'talentsEquipements'
    const basePath = `/db/${category}/${item.slug}`

    navigate({
      pathname: nextState ? `${basePath}/parfait` : basePath,
      search: location.search
    }, {
      replace: params.slug === item.slug
    })
  }

  const description = showPerfect && hasPerfect ? item.perfectDescription : item.description

  return (
      <div className={`bg-tactical-panel border border-tactical-border rounded-lg overflow-hidden flex flex-col h-full ${borderColor ? `border-l-2 ${borderColor}` : ''}`}>
        <div className="px-4 py-3 border-b border-tactical-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GameIcon src={talentIcon} alt="" size="w-6 h-6" />
              <div className={`font-bold text-sm uppercase tracking-wide ${nameColor}`}>{item.nom}</div>


              {hasPerfect && (
                  <button
                      onClick={togglePerfect}
                      className={`ml-auto flex items-center gap-1 text-xs font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border transition-all ${
                          showPerfect
                              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                              : 'bg-tactical-bg text-gray-500 border-tactical-border hover:border-gray-500'
                      }`}
                  >
            <span className="w-6 h-3.5 relative rounded-full border border-current inline-block">
              <span className={`absolute top-0.5 w-2 h-2 rounded-full bg-current transition-all ${showPerfect ? 'left-3' : 'left-0.5'}`} />
            </span>
                    {showPerfect?'★ ':''}Parfait
                  </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                <GameIcon src={slotIcon} alt="" size="w-3 h-3" className="opacity-70" />
                {getGearSlotLabel(equipementsType, item.emplacement)}
              </span>
              {isExotic && <Badge type="exotic" />}
              {isGearSet && <Badge type="gearset" />}
            </div>
          </div>
          {hasContent(item.prerequis) && (
              <div className="text-xs text-yellow-500/70 mt-0.5">Requis : {item.prerequis}</div>
          )}
        </div>

        {description && (
            <MarkdownText className="px-4 py-2.5 text-xs text-gray-400 leading-relaxed flex-1">
              {description}
            </MarkdownText>
        )}

        {/* Équipement(s) nommé(s) portant la version parfaite */}
        {showPerfect && item.equipementsParfaits?.length > 0 && (
            <div className="px-4 pb-2 text-xs text-yellow-500/70 flex flex-col items-start gap-1 ">
              <span className="text-yellow-400 font-bold uppercase tracking-widest">Équipement :</span>
              <ul className="text-xs list-disc list-inside">
                {item.equipementsParfaits.map(slug => {
                  const eq = (equipements && !Array.isArray(equipements))
                      ? equipements[slug]
                      : equipements?.find(e => e.slug === slug)
                  const nom = eq?.nom || slug
                  return (
                    <li key={slug}>
                      <Link
                        to={`/db/equipements/${slug}`}
                        className="text-yellow-300 hover:underline hover:text-yellow-400 transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        {nom}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
        )}

        {/* Notes */}
        {hasContent(item.notes) && (
            <div className="px-4 py-2 border-t border-tactical-border/50 bg-black/10">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Notes</div>
              <MarkdownText className="text-xs text-gray-400 italic leading-relaxed">
                {item.notes}
              </MarkdownText>
            </div>
        )}
      </div>
  )
}