// src/services/promptBuilder.js

const SPREAD_LABELS = {
  day:      ['Carta do Dia'],
  trio:     ['Passado', 'Presente', 'Futuro'],
  celtic:   ['Situação', 'Desafio', 'Base', 'Passado Recente', 'Possibilidade'],
  horseshoe:['Passado', 'Presente', 'Influências', 'Obstáculos', 'Expectativas', 'Melhor Ação', 'Resultado'],
  year:     ['Carta do Ano'],
}

const SPREAD_DESC = {
  day:      'Carta do Dia — um único tema central para hoje',
  trio:     'Passado · Presente · Futuro — jornada no tempo',
  celtic:   'Cruz Celta — leitura profunda de múltiplas posições',
  horseshoe:'Ferradura — sete posições para visão completa',
  year:     'Carta do Ano — tema central para o ano vigente',
}

const FOCUS_LABELS = {
  general:  'Visão geral da vida',
  love:     'Amor e relacionamentos',
  family:   'Família e vínculos afetivos',
  money:    'Dinheiro e finanças',
  health:   'Saúde e bem-estar',
  career:   'Carreira e trabalho',
}

export function buildSystemPrompt() {
  return `Você é Mística, uma tarologista experiente com profundo conhecimento em simbolismo \
arquetípico, astrologia e psicologia junguiana. Suas leituras são poéticas, empáticas e \
perspicazes — nunca alarmistas ou deterministas.

REGRAS ABSOLUTAS:
- Escreva sempre em português do Brasil com tom íntimo (use "você")
- Nunca invente eventos concretos ("você vai perder o emprego", "alguém vai morrer")
- Nunca prometa resultados ou certezas sobre o futuro
- Cada posição recebe um parágrafo rico de 3-4 frases
- A síntese integra todas as cartas em 4-6 frases
- Se uma carta estiver invertida, interprete como energia bloqueada, internalizada ou que pede atenção
- Responda SOMENTE com o JSON solicitado — sem texto fora do JSON, sem blocos de código markdown`
}

export function buildUserPrompt({ user, cards, spreadType, focusArea }) {
  // Premium recebe contexto astrológico completo; free recebe só signo solar
  const astroLines = []
  if (user.sun_sign)    astroLines.push(`- Signo solar: ${user.sun_sign}`)
  if (user.moon_sign && user.plan === 'premium')    astroLines.push(`- Signo lunar: ${user.moon_sign}`)
  if (user.rising_sign && user.plan === 'premium')  astroLines.push(`- Ascendente: ${user.rising_sign}`)

  const astroContext = astroLines.length > 0
    ? astroLines.join('\n')
    : '- Signo não informado'

  const labels = SPREAD_LABELS[spreadType] || cards.map((_, i) => `Posição ${i + 1}`)

  const cardsText = cards.map((c, i) =>
    `${i + 1}. ${labels[i] || `Posição ${i+1}`} → ${c.name} (arcano ${c.number})${c.inverted ? ' — INVERTIDA' : ''}\n   Palavras-chave: ${c.keyword}`
  ).join('\n')

  const focusLabel = FOCUS_LABELS[focusArea || 'general']
  const spreadDesc = SPREAD_DESC[spreadType] || 'Tiragem personalizada'

  // Monta JSON template que o modelo deve preencher
  const cardJsonTemplate = cards.map((c, i) => ({
    posicao: labels[i] || `Posição ${i+1}`,
    carta: c.name,
    invertida: c.inverted,
    interpretacao: '...',
  }))

  return `Faça uma leitura de tarô com o seguinte contexto:

DADOS DO USUÁRIO:
${astroContext}
- Área de foco: ${focusLabel}

TIRAGEM: ${spreadDesc}

CARTAS SORTEADAS:
${cardsText}

Retorne EXATAMENTE este JSON preenchido (sem nenhum texto fora):
${JSON.stringify({
    titulo: 'título poético curto da leitura',
    cartas: cardJsonTemplate,
    sintese: 'parágrafo integrando todas as cartas',
    conselho: 'uma frase de ação concreta e positiva',
    palavras_chave: ['palavra1', 'palavra2', 'palavra3'],
  }, null, 2)}`
}
