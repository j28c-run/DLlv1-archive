// ============================================================================
// Galeria de Douhal Aribi Live
// ----------------------------------------------------------------------------
// Datos de ejemplo. Sustituye los `src` por las URLs reales de tus imágenes
// (puedes subirlas a /public/gallery/ o usar URLs de Instagram CDN).
// Cada item puede tener: caption, date, category, tags, instagramUrl, aspect.
// ============================================================================

export type GalleryItem = {
  id: string;
  src: string;
  thumb: string;
  caption: string;
  date: string;        // ISO yyyy-mm-dd
  category: GalleryCategory;
  tags: string[];
  instagramUrl?: string;
  aspect: "portrait" | "landscape" | "square" | "tall";
};

export const GALLERY_CATEGORIES = [
  "Conciertos",
  "Backstage",
  "Retratos",
  "Con Fans",
  "Eventos",
  "Momentos",
] as const;
export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];

// Helper: construimos URLs de Picsum con seeds estables para que las imágenes
// sean reproducibles y se vean como una galería real. Sustituye por tus propias
// imágenes cuando las tengas.
const img = (seed: string, w = 800, h = 1000) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

const build = (
  id: string,
  seed: string,
  caption: string,
  date: string,
  category: GalleryCategory,
  tags: string[],
  aspect: GalleryItem["aspect"],
  w: number,
  h: number,
): GalleryItem => ({
  id,
  src: img(seed, w, h),
  thumb: img(seed, Math.round(w * 0.6), Math.round(h * 0.6)),
  caption,
  date,
  category,
  tags,
  instagramUrl: "https://www.instagram.com/douhalaribilive/",
  aspect,
});

export const GALLERY_ITEMS: GalleryItem[] = [
  build("g01", "douhal-stage-01", "Noche mágica en el escenario principal", "2024-11-22", "Conciertos", ["escenario", "luz", "noche"], "landscape", 1000, 640),
  build("g02", "douhal-portrait-01", "Sesión de retratos antes del show", "2024-11-10", "Retratos", ["retrato", "estudio", "b/n"], "portrait", 800, 1100),
  build("g03", "douhal-backstage-01", "Minutos antes de salir, focused", "2024-11-22", "Backstage", ["camerino", "pre-show"], "square", 900, 900),
  build("g04", "douhal-fans-01", "Con los fans después del concierto", "2024-11-23", "Con Fans", ["fans", "autógrafos", "agradecimiento"], "landscape", 1000, 700),
  build("g05", "douhal-stage-02", "El público encendido, vista desde el lateral", "2024-11-22", "Conciertos", ["público", "multitud"], "tall", 800, 1200),
  build("g06", "douhal-event-01", "Llegada al festival, alfombra dorada", "2024-10-05", "Eventos", ["festival", "alfombra"], "portrait", 800, 1100),
  build("g07", "douhal-moment-01", "Sonrisa robada entre ensayos", "2024-09-18", "Momentos", ["candid", "sonrisa"], "square", 900, 900),
  build("g08", "douhal-stage-03", "Silueta contra las luces del escenario", "2024-09-14", "Conciertos", ["silueta", "luces"], "landscape", 1000, 640),
  build("g09", "douhal-portrait-02", "Primer plano, mirada intensa", "2024-09-01", "Retratos", ["close-up", "mirada"], "portrait", 800, 1100),
  build("g10", "douhal-backstage-02", "Repasando la setlist con el equipo", "2024-08-30", "Backstage", ["setlist", "equipo"], "landscape", 1000, 700),
  build("g11", "douhal-fans-02", "Selfie con la tribu de fans", "2024-08-17", "Con Fans", ["selfie", "fans"], "square", 900, 900),
  build("g12", "douhal-stage-04", "Saludando a las primeras filas", "2024-08-17", "Conciertos", ["primeras filas", "saludo"], "portrait", 800, 1100),
  build("g13", "douhal-event-02", "Premio al artista del año", "2024-07-20", "Eventos", ["premio", "galas"], "landscape", 1000, 640),
  build("g14", "douhal-moment-02", "Té y guitarra, tarde tranquila", "2024-07-08", "Momentos", ["guitarra", "tarde"], "tall", 800, 1200),
  build("g15", "douhal-portrait-03", "Estilo editorial, sesión primaveral", "2024-06-15", "Retratos", ["editorial", "moda"], "portrait", 800, 1100),
  build("g16", "douhal-stage-05", "El momento más esperado del verano", "2024-06-21", "Conciertos", ["verano", "festival"], "landscape", 1000, 640),
  build("g17", "douhal-backstage-03", "Ajustando el micrófono, ritual pre-show", "2024-06-21", "Backstage", ["micrófono", "ritual"], "square", 900, 900),
  build("g18", "douhal-fans-03", "Cartel hecho a mano por una fan", "2024-05-12", "Con Fans", ["cartel", "fan"], "portrait", 800, 1100),
  build("g19", "douhal-event-03", "Rueda de prensa antes del lanzamiento", "2024-04-30", "Eventos", ["prensa", "lanzamiento"], "landscape", 1000, 700),
  build("g20", "douhal-moment-03", "Pausa café entre gira y gira", "2024-04-22", "Momentos", ["café", "descanso"], "square", 900, 900),
  build("g21", "douhal-stage-06", "Lluvia de confeti al cierre", "2024-03-15", "Conciertos", ["confeti", "cierre"], "landscape", 1000, 640),
  build("g22", "douhal-portrait-04", "Blanco y negro, atmósfera íntima", "2024-02-28", "Retratos", ["b/n", "íntimo"], "tall", 800, 1200),
  build("g23", "douhal-backstage-04", "Sonrisa cómplice con el manager", "2024-02-10", "Backstage", ["manager", "cómplice"], "portrait", 800, 1100),
  build("g24", "douhal-fans-04", "Fila de espera desde primera hora", "2024-01-20", "Con Fans", ["fila", "espera"], "landscape", 1000, 700),
  build("g25", "douhal-stage-07", "Inicio del tour mundial", "2024-01-15", "Conciertos", ["tour", "inicio"], "tall", 800, 1200),
  build("g26", "douhal-event-04", "Gala benéfica, alfombra roja", "2023-12-18", "Eventos", ["gala", "benéfica"], "portrait", 800, 1100),
  build("g27", "douhal-moment-04", "Desayuno con vistas, viaje", "2023-12-05", "Momentos", ["viaje", "desayuno"], "square", 900, 900),
  build("g28", "douhal-portrait-05", "Sesión vintage en estudio", "2023-11-20", "Retratos", ["vintage", "estudio"], "landscape", 1000, 700),
  build("g29", "douhal-backstage-05", "Rezos y concentración", "2023-11-15", "Backstage", ["concentración", "pre-show"], "portrait", 800, 1100),
  build("g30", "douhal-fans-05", "Firma de discos en la tienda", "2023-10-30", "Con Fans", ["firma", "discos"], "square", 900, 900),
];

// Estadísticas para la cabecera
export const GALLERY_STATS = {
  totalPhotos: GALLERY_ITEMS.length,
  categories: GALLERY_CATEGORIES.length,
  years: new Set(GALLERY_ITEMS.map((i) => i.date.slice(0, 4))).size,
  events: GALLERY_ITEMS.filter((i) => i.category === "Conciertos" || i.category === "Eventos").length,
};
