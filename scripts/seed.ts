// Seed script: inicializa el admin por defecto y carga fotos de muestra.
import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Datasets realistas para una fan page de Douha Laribi (creadora marroquí)
const CATEGORIES = ['Retratos', 'Looks', 'Live', 'Behind', 'Fans', 'Eventos', 'Viajes', 'Estilo']
const TAGS_POOL = [
  'hijab', 'modestfashion', 'makeup', 'natural', 'studio', 'exterior',
  'sonrisa', 'mirada', 'b/n', 'color', 'verano', 'invierno', 'primavera',
  'otoño', 'gala', 'casual', 'elegant', 'streetstyle', 'morocco', 'casa',
  'travel', 'beach', 'sunset', 'gold', 'editorial', 'vintage', 'live',
  'tiktok', 'youtube', 'shorts', 'reel', 'podcast', 'entrevista',
  'collab', 'foto-juntos', 'fans', 'autografo', 'backstage', 'pre-show',
  'pre-show', 'maquillaje', 'vestidor', 'selfie', 'candid',
]
const LOCATIONS = [
  'Casablanca', 'Rabat', 'Marrakech', 'Tánger', 'Fez', 'Agadir', 'París', 'Madrid', 'Estambul', 'Dubái', '—'
]
const SOURCES = ['instagram', 'telegram', 'patreon', 'local'] as const

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T
}
function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  const out: T[] = []
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0])
  }
  return out
}

// Captions por categoría
const CAPTIONS: Record<string, string[]> = {
  'Retratos': [
    'Sesión de retratos en estudio', 'Primer plano, mirada intensa',
    'Retrato natural con luz cálida', 'Sesión primaveral en exterior',
    'Retrato editorial blanco y negro', 'Retrato íntimo, mañana tranquila',
  ],
  'Looks': [
    'Nuevo look hijab para el otoño', 'Outfit del día: tonos tierra',
    'Estilo modesto en tonos pastel', 'Look elegante para la gala',
    'Street style casual de domingo', 'Estilo dorado para la sesión',
  ],
  'Live': [
    'En directo desde TikTok', 'Live con fans: 2 horas de charla',
    'Live de preguntas y respuestas', 'Live nocturno, sorpresa',
    'Live especial aniversario', 'Live colaborativo con invitada',
  ],
  'Behind': [
    'Behind the scenes de la sesión', 'Preparando el live, minutos antes',
    'Backstage del rodaje', 'Maquillaje y pelo, antes de salir',
    'Vestidor: eligiendo el look', 'Equipo en pleno trabajo',
  ],
  'Fans': [
    'Selfie con fans después del evento', 'Firma de autógrafos',
    'Encuentro con fans en la calle', 'Fans esperando desde temprano',
    'Foto grupal con la comunidad', 'Carteles hechos a mano por fans',
  ],
  'Eventos': [
    'Llegada al evento, alfombra dorada', 'Premio a creadora del año',
    'Gala benéfica, look de noche', 'Festival de moda modesta',
    'Rueda de prensa del lanzamiento', 'Foto oficial del evento',
  ],
  'Viajes': [
    'Viaje a Estambul, vistas', 'Playa al atardecer, fin de gira',
    'Mañana en Dubái', 'Café con vistas en París',
    'Paseando por Madrid', 'Tarde tranquila en Marrakech',
  ],
  'Estilo': [
    'Detalle del vestido, sesión editorial', 'Accesorios dorados, primer plano',
    'Estilo vintage, sesión retro', 'Combinación de texturas',
    'Detalle del hijab, tonos cálidos', 'Estilo minimalista, mañana clara',
  ],
}

const ASPECTS: Array<'portrait' | 'landscape' | 'square' | 'tall'> = [
  'portrait', 'landscape', 'square', 'tall', 'portrait', 'tall', 'landscape', 'square'
]

const SIZE_BY_ASPECT = {
  portrait: [800, 1000],
  tall: [800, 1200],
  square: [900, 900],
  landscape: [1000, 700],
} as const

async function main() {
  // 1) Crear admin por defecto si no existe
  const existing = await prisma.admin.findFirst()
  if (!existing) {
    const hash = await bcrypt.hash('douhal2026', 10)
    await prisma.admin.create({ data: { username: 'admin', password: hash } })
    console.log('Admin creado: admin / douhal2026')
  }

  // 2) Limpiar fotos previas (solo seed, no en producción)
  await prisma.tagOnPhoto.deleteMany()
  await prisma.photo.deleteMany()
  await prisma.tag.deleteMany()

  // 3) Crear tags (sin duplicar)
  const tagMap = new Map<string, string>()
  for (const t of TAGS_POOL) {
    const existingTag = await prisma.tag.findUnique({ where: { name: t } })
    if (existingTag) {
      tagMap.set(t, existingTag.id)
    } else {
      const created = await prisma.tag.create({ data: { name: t } })
      tagMap.set(t, created.id)
    }
  }

  // 4) Crear 80 fotos con metadata realista
  const now = Date.now()
  const items = []
  for (let i = 0; i < 80; i++) {
    const cat = pick(CATEGORIES)
    const aspect = ASPECTS[i % ASPECTS.length]
    const [w, h] = SIZE_BY_ASPECT[aspect]
    const seed = `douha-${cat.toLowerCase()}-${i}-${Math.floor(Math.random() * 100000)}`
    const src = `https://picsum.photos/seed/${seed}/${w}/${h}`
    const thumb = `https://picsum.photos/seed/${seed}/${Math.round(w * 0.5)}/${Math.round(h * 0.5)}`
    const caption = pick(CAPTIONS[cat] || ['Momento capturado'])
    // Fecha aleatoria en últimos 3 años
    const daysAgo = Math.floor(Math.random() * 365 * 3)
    const date = new Date(now - daysAgo * 86400000)

    const item = await prisma.photo.create({
      data: {
        src,
        thumb,
        width: w,
        height: h,
        title: caption,
        description: '',
        date,
        location: pick(LOCATIONS),
        category: cat,
        source: pick(SOURCES),
        pinned: i < 6,  // primeras 6 destacadas
        views: Math.floor(Math.random() * 8000),
      },
    })

    // 2-4 tags aleatorios
    const tagNames = pickN(TAGS_POOL, 2 + Math.floor(Math.random() * 3))
    for (const t of tagNames) {
      const tagId = tagMap.get(t)!
      await prisma.tagOnPhoto.create({ data: { photoId: item.id, tagId } })
    }
    items.push(item)
  }

  console.log(`Cargadas ${items.length} fotos con tags.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
