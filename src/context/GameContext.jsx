import { createContext, useState, useEffect, useContext } from 'react'

export const GameContext = createContext()

export function GameProvider({ children }) {
  const [currentGame, setCurrentGame] = useState(() => {
    return localStorage.getItem('selected_game') || 'td2'
  })

  useEffect(() => {
    localStorage.setItem('selected_game', currentGame)
  }, [currentGame])

  return (
    <GameContext.Provider value={{ currentGame, setCurrentGame }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  return useContext(GameContext)
}
