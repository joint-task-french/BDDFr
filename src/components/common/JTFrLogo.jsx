import logo from '../../img/assets/logo_JTFr.png'

export default function JTFrLogo({ className = 'w-8 h-8' }) {
  return (
      <img src={logo} alt="JTFr logo" loading="lazy" decoding="async" className={className}/>
  )
}

