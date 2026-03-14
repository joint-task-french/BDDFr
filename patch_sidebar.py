with open("src/components/layout/Sidebar.jsx", "r") as f:
    content = f.read()

content = content.replace(
    "import {InfoToolTip} from \"../common/InfoToolTip.jsx\";",
    "import {InfoToolTip} from \"../common/InfoToolTip.jsx\";\nimport { useGame } from '../../context/GameContext'"
)

game_selector = """
      <div className="px-4 pb-2 border-b border-tactical-border">
        <select
          value={currentGame}
          onChange={(e) => setCurrentGame(e.target.value)}
          className="w-full bg-tactical-panel border border-tactical-border text-white text-sm rounded focus:ring-shd focus:border-shd p-2 uppercase tracking-widest"
        >
          <option value="td1">The Division 1</option>
          <option value="td2">The Division 2</option>
        </select>
      </div>
"""

content = content.replace(
    "export default function Sidebar({ open, onClose }) {",
    "export default function Sidebar({ open, onClose }) {\n  const { currentGame, setCurrentGame } = useGame()"
)

content = content.replace(
    """      <div className="p-4 sm:p-6 border-b border-tactical-border flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <JTFrLogo className="w-8 h-8 md:w-10 md:h-10 xl:w-12 xl:h-12" />
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-widest uppercase">
            Réseau <span className="text-shd">SHD</span>: <span className='text-blue-700'>JT</span><span className='text-white'>F</span><span className='text-red-500'>r</span>
          </h1>
        </div>
        <button onClick={onClose} className="md:hidden text-gray-500 hover:text-shd p-2 -mr-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>""",
    """      <div className="p-4 sm:p-6 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <JTFrLogo className="w-8 h-8 md:w-10 md:h-10 xl:w-12 xl:h-12" />
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-widest uppercase">
            Réseau <span className="text-shd">SHD</span>: <span className='text-blue-700'>JT</span><span className='text-white'>F</span><span className='text-red-500'>r</span>
          </h1>
        </div>
        <button onClick={onClose} className="md:hidden text-gray-500 hover:text-shd p-2 -mr-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>\n""" + game_selector
)

with open("src/components/layout/Sidebar.jsx", "w") as f:
    f.write(content)
