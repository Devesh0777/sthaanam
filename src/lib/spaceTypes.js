/**
 * Maps a spot listing to its authentic space type, human label, and icon identifier.
 * Priority order ensures the most specific physical type is picked from title/features/description.
 */
export function getSpaceType(listing) {
  if (!listing) return { id: 'parking', label: 'Designated Bay', icon: 'parking' }

  const title = (listing.title || '').toLowerCase()
  const desc = (listing.description || '').toLowerCase()
  const features = (listing.features || []).join(' ').toLowerCase()
  const surface = (listing.surface || '').toLowerCase()
  const fullText = `${listing.spaceType || ''} ${title} ${desc} ${features} ${surface}`

  // 1. Covered Garage / Basement
  if (
    title.includes('garage') ||
    title.includes('basement') ||
    (listing.features?.includes('covered') && (title.includes('covered') || !title.includes('open')))
  ) {
    return { id: 'garage', label: 'Covered Garage', icon: 'garage' }
  }

  // 2. Farmhouse / Lawn
  if (title.includes('farm') || title.includes('lawn') || desc.includes('farmhouse front lawn')) {
    return { id: 'farmhouse', label: 'Farmhouse / Lawn', icon: 'farmhouse' }
  }

  // 3. Railway-side lot
  if (title.includes('rail') || title.includes('station') || desc.includes('railway station')) {
    return { id: 'railway', label: 'Railway-Side Lot', icon: 'railway' }
  }

  // 4. Dharamsala / Lodge / Hall / Ashram
  if (
    title.includes('dharamsala') ||
    title.includes('dharamshala') ||
    title.includes('lodge') ||
    title.includes('ashram') ||
    desc.includes('dharamsala')
  ) {
    return { id: 'dharamsala', label: 'Dharamsala / Hall', icon: 'dharamsala' }
  }

  // 5. Multi-level / Terrace
  if (title.includes('terrace') || title.includes('multi-level') || title.includes('multilevel')) {
    return { id: 'multilevel', label: 'Multi-Level / Terrace', icon: 'multilevel' }
  }

  // 6. Temple-side / Ghat lot
  if (
    title.includes('temple') ||
    title.includes('mandir') ||
    title.includes('ghat') ||
    title.includes('brahmagiri') ||
    desc.includes('temple trust')
  ) {
    return { id: 'temple', label: 'Temple-Side Lot', icon: 'temple' }
  }

  // 7. Driveway / Residential Compound
  if (
    title.includes('driveway') ||
    title.includes('compound') ||
    title.includes('society') ||
    desc.includes('driveway')
  ) {
    return { id: 'driveway', label: 'Driveway / Compound', icon: 'driveway' }
  }

  // 8. Open ground / Plot
  if (
    title.includes('open') ||
    title.includes('plot') ||
    title.includes('ground') ||
    desc.includes('open plot')
  ) {
    return { id: 'open', label: 'Open Ground / Plot', icon: 'open' }
  }

  // Fallback check on full text
  if (fullText.includes('covered')) return { id: 'garage', label: 'Covered Bay', icon: 'garage' }
  if (fullText.includes('plot') || fullText.includes('soil')) return { id: 'open', label: 'Open Ground', icon: 'open' }

  return { id: 'parking', label: 'Designated Bay', icon: 'parking' }
}
