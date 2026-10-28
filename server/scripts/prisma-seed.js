import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function seed() {
  console.log('--- Seeding Sthanam PostgreSQL Database ---')

  // Password hashes
  const adminPassword = 'Admin@Sthanam2027'
  const hostPassword = 'Host@Sthanam2027'
  const userPassword = 'User@Sthanam2027'

  const [adminHash, hostHash, userHash] = await Promise.all([
    bcrypt.hash(adminPassword, 10),
    bcrypt.hash(hostPassword, 10),
    bcrypt.hash(userPassword, 10),
  ])

  // 1. Seed Users (ADMIN, HOST, USER)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sthanam.gov.in' },
    update: { passwordHash: adminHash, role: 'ADMIN', name: 'Kumbh Controller' },
    create: {
      name: 'Kumbh Controller',
      email: 'admin@sthanam.gov.in',
      phone: '+91 94222 00001',
      passwordHash: adminHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  })

  const host = await prisma.user.upsert({
    where: { email: 'sunita@sthanam.in' },
    update: { passwordHash: hostHash, role: 'HOST', name: 'Sunita Deshmukh' },
    create: {
      name: 'Sunita Deshmukh',
      email: 'sunita@sthanam.in',
      phone: '+91 98200 54321',
      passwordHash: hostHash,
      role: 'HOST',
      status: 'ACTIVE',
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'devv@sthanam.in' },
    update: { passwordHash: userHash, role: 'USER', name: 'Devv' },
    create: {
      name: 'Devv',
      email: 'devv@sthanam.in',
      phone: '+91 98200 12345',
      passwordHash: userHash,
      role: 'USER',
      status: 'ACTIVE',
    },
  })

  console.log('\n================ CREDENTIALS SUMMARY ================')
  console.log('1. ADMIN:')
  console.log('   Email:    admin@sthanam.gov.in')
  console.log('   Password: ' + adminPassword)
  console.log('   Role:     ADMIN')
  console.log('2. HOST:')
  console.log('   Email:    sunita@sthanam.in')
  console.log('   Password: ' + hostPassword)
  console.log('   Role:     HOST')
  console.log('3. USER (Driver):')
  console.log('   Email:    devv@sthanam.in')
  console.log('   Password: ' + userPassword)
  console.log('   Role:     USER')
  console.log('=====================================================\n')

  // 2. Seed Zones
  const zonesData = [
    {
      id: 'ramkund',
      name: 'Ramkund',
      short: 'Ramkund',
      lat: 20.0074,
      lng: 73.7925,
      blurb: 'Main pandal and Godavari sacred snan ghats. Zero parking within 1 km on peak days.',
      melaNote: 'Highest demand 06:00–11:00',
      tag: 'Most crowded',
      ghatName: 'Ramkund Kund',
      ghatLat: 20.0074,
      ghatLng: 73.7925,
    },
    {
      id: 'trimbakeshwar',
      name: 'Trimbakeshwar',
      short: 'Trimbakeshwar',
      lat: 19.932,
      lng: 73.531,
      blurb: 'Kumbh Sthal at Brahmagiri and Kushavarta Kund.',
      melaNote: 'Best value, 28 km from Ramkund',
      tag: 'Best value',
      ghatName: 'Kushavarta Kund',
      ghatLat: 19.932,
      ghatLng: 73.531,
    },
    {
      id: 'trimbak-road',
      name: 'Trimbakeshwar Road',
      short: 'Trimbak Rd',
      lat: 19.972,
      lng: 73.705,
      blurb: 'Highway approach road — spacious plots and compounds.',
      melaNote: 'Day parking popular with tour buses',
      tag: 'Bus friendly',
      ghatName: 'Someshwar Ghat',
      ghatLat: 20.03,
      ghatLng: 73.72,
    },
    {
      id: 'nashik-road',
      name: 'Nashik Road',
      short: 'Nashik Rd',
      lat: 19.954,
      lng: 73.834,
      blurb: 'Rail head and Dharamsala hub. Long-stay parking for pilgrims arriving by train.',
      melaNote: 'Overnight demand 80%+',
      tag: 'Overnight',
      ghatName: 'Panchavati Ghat',
      ghatLat: 20.0065,
      ghatLng: 73.798,
    },
    {
      id: 'panchavati',
      name: 'Panchavati',
      short: 'Panchavati',
      lat: 20.0065,
      lng: 73.798,
      blurb: 'Godavari ghats, Kalaram Mandir and Sita Gumpha.',
      melaNote: 'Prime riverfront access',
      tag: 'Riverside',
      ghatName: 'Panchavati Ghat',
      ghatLat: 20.0065,
      ghatLng: 73.798,
    },
    {
      id: 'tapovan',
      name: 'Tapovan',
      short: 'Tapovan',
      lat: 19.9982,
      lng: 73.8185,
      blurb: 'Sacred grove & Sadhu Gram camp hub with spacious outer grounds.',
      melaNote: 'High vehicle volume area',
      tag: 'Spacious',
      ghatName: 'Kapila Sangam Ghat',
      ghatLat: 19.9995,
      ghatLng: 73.821,
    },
  ]

  for (const z of zonesData) {
    await prisma.zone.upsert({
      where: { id: z.id },
      update: z,
      create: z,
    })
  }

  // 3. Seed Landmarks
  const landmarksData = [
    { name: 'Ramkund Kund Ghat', zoneId: 'ramkund', lat: 20.0074, lng: 73.7925, type: 'GHAT' },
    { name: 'Kushavarta Kund', zoneId: 'trimbakeshwar', lat: 19.932, lng: 73.531, type: 'GHAT' },
    { name: 'Someshwar Waterfall & Ghat', zoneId: 'trimbak-road', lat: 20.03, lng: 73.72, type: 'GHAT' },
    { name: 'Kalaram Mandir & Ghat', zoneId: 'panchavati', lat: 20.0065, lng: 73.798, type: 'MANDIR' },
    { name: 'Kapila Sangam Snan Ghat', zoneId: 'tapovan', lat: 19.9995, lng: 73.821, type: 'GHAT' },
  ]

  for (const lm of landmarksData) {
    const existing = await prisma.landmark.findFirst({ where: { name: lm.name } })
    if (!existing) {
      await prisma.landmark.create({ data: lm })
    }
  }

  // 4. Seed Spaces (Host-owned listings, money stored strictly in integer paise)
  const sampleSpaces = [
    {
      id: 's1',
      title: 'Driveway behind Sagar Petrol Pump',
      hostId: host.id,
      zoneId: 'ramkund',
      address: 'Sagar Colony, off Agra Road, Nashik',
      lat: 20.0092,
      lng: 73.7915,
      priceHourPaise: 4000, // Rs 40/hr
      priceDayPaise: 25000, // Rs 250/day
      capacity: 12,
      spotsLeft: 5,
      rating: 4.9,
      reviewsCount: 87,
      vehicles: ['2w', 'car'],
      features: ['covered', 'gate', 'cctv', 'floodlight', 'caretaker'],
      surface: 'Tile paving',
      clearanceM: 2.4,
      checkInFrom: '00:00',
      checkOutBy: '24:00',
      isInstantBook: true,
      isVerified: true,
      isActive: true,
      description:
        'Level covered driveway right off Agra Road, 6 minutes walk to Ramkund main road. Fits 8 cars and 15 two-wheelers. Caretaker stays on site through the mela.',
    },
    {
      id: 's2',
      title: 'Empty residential plot, Godavari Housing',
      hostId: host.id,
      zoneId: 'ramkund',
      address: 'Godavari Housing Society, Near MIDC, Nashik',
      lat: 20.0041,
      lng: 73.7885,
      priceHourPaise: 3000, // Rs 30/hr
      priceDayPaise: 18000, // Rs 180/day
      capacity: 20,
      spotsLeft: 11,
      rating: 4.7,
      reviewsCount: 42,
      vehicles: ['2w', 'car'],
      features: ['gate', 'floodlight'],
      surface: 'Paver blocks',
      clearanceM: 3.0,
      checkInFrom: '05:00',
      checkOutBy: '23:00',
      isInstantBook: true,
      isVerified: true,
      isActive: true,
      description:
        'Gated residential compound 12 min walk to Ramkund. Easy in-and-out access with wide roadway.',
    },
    {
      id: 's3',
      title: 'Trimbak Highway Tour Compound',
      hostId: host.id,
      zoneId: 'trimbak-road',
      address: 'Trimbak Road near Someshwar Turn, Nashik',
      lat: 19.9712,
      lng: 73.7042,
      priceHourPaise: 6000, // Rs 60/hr
      priceDayPaise: 40000, // Rs 400/day
      capacity: 35,
      spotsLeft: 18,
      rating: 4.8,
      reviewsCount: 65,
      vehicles: ['car', 'bus'],
      features: ['wide', 'cctv', 'water', 'floodlight'],
      surface: 'Cement',
      clearanceM: 4.5,
      checkInFrom: '00:00',
      checkOutBy: '24:00',
      isInstantBook: true,
      isVerified: true,
      isActive: true,
      description:
        'Highway compound designed for tempo travellers and mini-buses approaching Trimbakeshwar.',
    },
    {
      id: 's4',
      title: 'Kushavarta Ashram Courtyard',
      hostId: host.id,
      zoneId: 'trimbakeshwar',
      address: 'Near Kushavarta Kund Main Gate, Trimbakeshwar',
      lat: 19.9335,
      lng: 73.5322,
      priceHourPaise: 5000, // Rs 50/hr
      priceDayPaise: 30000, // Rs 300/day
      capacity: 8,
      spotsLeft: 2,
      rating: 4.9,
      reviewsCount: 94,
      vehicles: ['2w', 'car'],
      features: ['covered', 'gate', 'caretaker', 'cctv'],
      surface: 'Paver blocks',
      clearanceM: 2.6,
      checkInFrom: '04:00',
      checkOutBy: '22:00',
      isInstantBook: true,
      isVerified: true,
      isActive: true,
      description:
        'Sacred courtyard parking 3 minutes walk from Kushavarta Kund. Highly secure with 24/7 ashram staff.',
    },
    {
      id: 's5',
      title: 'Panchavati Kalaram Mandir Compound',
      hostId: host.id,
      zoneId: 'panchavati',
      address: 'Kalaram Mandir East Gate Road, Panchavati',
      lat: 20.0058,
      lng: 73.7992,
      priceHourPaise: 3500, // Rs 35/hr
      priceDayPaise: 22000, // Rs 220/day
      capacity: 10,
      spotsLeft: 4,
      rating: 4.6,
      reviewsCount: 39,
      vehicles: ['2w', 'car'],
      features: ['gate', 'cctv', 'water'],
      surface: 'Paver blocks',
      clearanceM: 2.8,
      checkInFrom: '06:00',
      checkOutBy: '22:30',
      isInstantBook: true,
      isVerified: true,
      isActive: true,
      description:
        'Peaceful residential compound situated directly behind the Kalaram temple corridor.',
    },
  ]

  for (const s of sampleSpaces) {
    await prisma.space.upsert({
      where: { id: s.id },
      update: s,
      create: s,
    })
  }

  // 5. Seed a Sample Booking for Devv (User)
  const sampleBooking = await prisma.booking.upsert({
    where: { code: 'STH-RAM-7821' },
    update: {},
    create: {
      code: 'STH-RAM-7821',
      userId: user.id,
      spaceId: 's1',
      vehicleType: 'car',
      vehicleNumber: 'MH 15 AB 1234',
      startTime: new Date(Date.now() - 3600000), // 1 hour ago
      endTime: new Date(Date.now() + 7200000), // 2 hours from now
      totalPricePaise: 12000, // Rs 120 (3 hours @ Rs 40/hr)
      status: 'ACTIVE',
      checkInTime: new Date(Date.now() - 3300000),
      qrToken: 'QR-STH-7821-SECURE-TOKEN',
      payment: {
        create: {
          amountPaise: 12000,
          currency: 'INR',
          method: 'UPI',
          status: 'COMPLETED',
          transactionRef: 'UPI-9821837192',
        },
      },
    },
  })

  // 6. Seed a Gate Check-in Event
  await prisma.gateEvent.create({
    data: {
      bookingId: sampleBooking.id,
      eventType: 'ENTRY',
      scannedAt: new Date(Date.now() - 3300000),
      scannedBy: 'Gate Attendant - Ramkund Bay 01',
      notes: 'Vehicle arrived on schedule. Scanned via QR kiosk.',
    },
  })

  console.log('✓ Successfully seeded Users, Zones, Landmarks, Spaces, Sample Booking, and Gate Event!')
}

seed()
  .catch((e) => {
    console.error('Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
