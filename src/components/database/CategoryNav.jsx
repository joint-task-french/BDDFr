export default function CategoryNav({ categories, active, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {categories.map(cat => (
        <button
          key={cat.key}
          onClick={() => onSelect(cat.key)}
          className={`px-3 py-2 rounded text-xs font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${
            active === cat.key
              ? 'bg-shd/15 text-shd border-shd/40'
              : 'text-gray-500 border-tactical-border hover:text-gray-300 hover:border-gray-500'
          }`}
        >
          <span className="mr-1.5">{cat.icon}</span>
          {cat.label}
        </button>
      ))}
    </div>
  )
}

