// src/services/astrology.js

// Dados dos signos com símbolo, elemento, qualidade e descrição
export const SIGNS_DATA = {
  Áries:       { symbol: '♈', element: 'Fogo',   quality: 'Cardinal', planet: 'Marte',    dates: '21/03 – 19/04' },
  Touro:       { symbol: '♉', element: 'Terra',   quality: 'Fixo',     planet: 'Vênus',    dates: '20/04 – 20/05' },
  Gêmeos:      { symbol: '♊', element: 'Ar',      quality: 'Mutável',  planet: 'Mercúrio', dates: '21/05 – 20/06' },
  Câncer:      { symbol: '♋', element: 'Água',    quality: 'Cardinal', planet: 'Lua',      dates: '21/06 – 22/07' },
  Leão:        { symbol: '♌', element: 'Fogo',    quality: 'Fixo',     planet: 'Sol',      dates: '23/07 – 22/08' },
  Virgem:      { symbol: '♍', element: 'Terra',   quality: 'Mutável',  planet: 'Mercúrio', dates: '23/08 – 22/09' },
  Libra:       { symbol: '♎', element: 'Ar',      quality: 'Cardinal', planet: 'Vênus',    dates: '23/09 – 22/10' },
  Escorpião:   { symbol: '♏', element: 'Água',    quality: 'Fixo',     planet: 'Plutão',   dates: '23/10 – 21/11' },
  Sagitário:   { symbol: '♐', element: 'Fogo',    quality: 'Mutável',  planet: 'Júpiter',  dates: '22/11 – 21/12' },
  Capricórnio: { symbol: '♑', element: 'Terra',   quality: 'Cardinal', planet: 'Saturno',  dates: '22/12 – 19/01' },
  Aquário:     { symbol: '♒', element: 'Ar',      quality: 'Fixo',     planet: 'Urano',    dates: '20/01 – 18/02' },
  Peixes:      { symbol: '♓', element: 'Água',    quality: 'Mutável',  planet: 'Netuno',   dates: '19/02 – 20/03' },
}

// Calcula signo solar a partir da data de nascimento (YYYY-MM-DD)
export function calculateSunSign(birthDate) {
  const date = new Date(birthDate + 'T12:00:00Z')
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Áries'
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Touro'
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gêmeos'
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Câncer'
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leão'
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgem'
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra'
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Escorpião'
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagitário'
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricórnio'
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquário'
  return 'Peixes'
}
