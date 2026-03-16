export default function Badge({ type }) {
  const styles = {
    exotic: 'bg-shd/20 text-shd border-shd/40',
    named: 'bg-yellow-900/30 text-yellow-400 border-yellow-500/40',
    gearset: 'bg-emerald-900/30 text-emerald-400 border-emerald-500/40',
    standard: 'bg-gray-800/50 text-gray-400 border-gray-600/40',
    improvise: 'bg-indigo-900/30 text-indigo-400 border-indigo-500/40',
  }
  const labels = {
    exotic: 'Exotique',
    named: 'Nommé',
    gearset: 'Gear Set',
    standard: 'Standard',
    improvise: 'Improvisé',
  }
  return (
      <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-widest border ${styles[type] || styles.standard}`}>
      {labels[type] || type}
    </span>
  )
}