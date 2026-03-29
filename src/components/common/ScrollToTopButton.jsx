import { useEffect, useState, useRef } from 'react'

export default function ScrollToTopButton({ scrollContainerSelector }) {
  const [visible, setVisible] = useState(false)
  const btnRef = useRef(null)

  useEffect(() => {
    let scrollContainer = null
    if (scrollContainerSelector) {
      scrollContainer = document.querySelector(scrollContainerSelector)
    }
    if (!scrollContainer) {
      const all = Array.from(document.querySelectorAll('div, main, section, article'))
      scrollContainer = all.find(el => {
        const style = window.getComputedStyle(el)
        const overflowY = style.overflowY
        return (
          (overflowY === 'auto' || overflowY === 'scroll') &&
          el.scrollHeight > el.clientHeight + 10
        )
      })
    }
    if (!scrollContainer) {
      scrollContainer = window
    }
    const getScroll = () => scrollContainer === window ? window.scrollY : scrollContainer.scrollTop
    const handleScroll = () => {
      const y = getScroll()
      setVisible(y > 80)
    }
    scrollContainer.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [scrollContainerSelector])

  const handleClick = () => {
    let scrollContainer = null
    if (scrollContainerSelector) {
      scrollContainer = document.querySelector(scrollContainerSelector)
    }
    if (!scrollContainer) {
      const all = Array.from(document.querySelectorAll('div, main, section, article'))
      scrollContainer = all.find(el => {
        const style = window.getComputedStyle(el)
        const overflowY = style.overflowY
        return (
          (overflowY === 'auto' || overflowY === 'scroll') &&
          el.scrollHeight > el.clientHeight + 10
        )
      })
    }
    if (!scrollContainer) {
      scrollContainer = window
    }
    if (scrollContainer === window) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Animation slide + fade
  const style = {
    position: 'fixed',
    right: 24,
    bottom: 24,
    zIndex: 50,
    background: 'rgba(30,30,40,0.95)',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: 48,
    height: 48,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'opacity 0.3s cubic-bezier(.4,0,.2,1), transform 0.3s cubic-bezier(.4,0,.2,1)',
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(40px)',
    pointerEvents: visible ? 'auto' : 'none',
  }

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      title="Remonter en haut"
      style={style}
      aria-label="Remonter en haut"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
    >
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M5 15l7-7 7 7" />
      </svg>
    </button>
  )
}
