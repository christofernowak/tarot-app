// src/lib/deck.js
export const MAJOR_ARCANA = [
  { number:'0',  name:'O Louco',           symbol:'☽', keyword:'Novos começos, liberdade, saltos de fé' },
  { number:'I',  name:'O Mago',            symbol:'✦', keyword:'Manifestação, poder, criatividade' },
  { number:'II', name:'A Sacerdotisa',     symbol:'◎', keyword:'Intuição, mistério, sabedoria interior' },
  { number:'III',name:'A Imperatriz',      symbol:'♀', keyword:'Abundância, fertilidade, nutrição' },
  { number:'IV', name:'O Imperador',       symbol:'♁', keyword:'Estrutura, autoridade, estabilidade' },
  { number:'V',  name:'O Hierofante',      symbol:'⊕', keyword:'Tradição, espiritualidade, ensinamentos' },
  { number:'VI', name:'Os Amantes',        symbol:'◇', keyword:'Amor, escolhas, união, valores' },
  { number:'VII',name:'O Carro',           symbol:'△', keyword:'Vitória, determinação, controle' },
  { number:'VIII',name:'A Força',          symbol:'∞', keyword:'Coragem, paciência, compaixão' },
  { number:'IX', name:'O Eremita',         symbol:'◉', keyword:'Sabedoria, introspecção, orientação' },
  { number:'X',  name:'Roda da Fortuna',   symbol:'⊛', keyword:'Ciclos, destino, mudança, sorte' },
  { number:'XI', name:'A Justiça',         symbol:'⚖', keyword:'Verdade, equidade, causa e efeito' },
  { number:'XII',name:'O Enforcado',       symbol:'⊓', keyword:'Suspensão, sacrifício, perspectiva' },
  { number:'XIII',name:'A Morte',          symbol:'⬡', keyword:'Transformação, encerramento, renascimento' },
  { number:'XIV',name:'A Temperança',      symbol:'≋', keyword:'Harmonia, moderação, paciência' },
  { number:'XV', name:'O Diabo',           symbol:'⊗', keyword:'Apego, padrões limitantes, materialismo' },
  { number:'XVI',name:'A Torre',           symbol:'⊠', keyword:'Ruptura súbita, revelação, libertação' },
  { number:'XVII',name:'A Estrela',        symbol:'★', keyword:'Esperança, renovação, fé, cura' },
  { number:'XVIII',name:'A Lua',           symbol:'☾', keyword:'Ilusão, inconsciente, medos, intuição' },
  { number:'XIX',name:'O Sol',             symbol:'☀', keyword:'Alegria, sucesso, vitalidade, clareza' },
  { number:'XX', name:'O Julgamento',      symbol:'♦', keyword:'Chamado, renascimento, absolvição' },
  { number:'XXI',name:'O Mundo',           symbol:'◯', keyword:'Completude, integração, realização' },
]

export const SPREAD_CONFIG = {
  day:      { label:'Carta do Dia',            slots:['Tema do dia'],                                        free:true  },
  trio:     { label:'Passado · Presente · Futuro', slots:['Passado','Presente','Futuro'],                    free:true  },
  celtic:   { label:'Cruz Celta',              slots:['Situação','Desafio','Base','Passado','Possibilidade'], free:false },
  horseshoe:{ label:'Ferradura',               slots:['Passado','Presente','Influências','Obstáculos','Expectativas','Melhor Ação','Resultado'], free:false },
  year:     { label:'Carta do Ano',            slots:['Tema anual'],                                         free:false },
}

export const FOCUS_AREAS = [
  { id:'general', label:'Visão Geral',    icon:'◯' },
  { id:'love',    label:'Amor',           icon:'◇' },
  { id:'family',  label:'Família',        icon:'⊕' },
  { id:'money',   label:'Dinheiro',       icon:'★' },
  { id:'health',  label:'Saúde',          icon:'∞' },
  { id:'career',  label:'Carreira',       icon:'△' },
]

// Fisher-Yates shuffle
export function shuffleDeck() {
  const deck = [...MAJOR_ARCANA]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

export function drawCards(count) {
  const deck = shuffleDeck()
  return deck.slice(0, count).map(card => ({
    ...card,
    inverted: Math.random() > 0.65,
  }))
}
