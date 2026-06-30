import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@staynest.com' },
    update: {},
    create: {
      email: 'admin@staynest.com',
      name: 'StayNest Admin',
      passwordHash: adminPassword,
      role: 'SUPER_ADMIN',
      emailVerified: true,
      referralCode: 'SNADMIN001',
    },
  })

  // Create sample owner
  const ownerPassword = await bcrypt.hash('Owner@123', 12)
  const owner = await prisma.user.upsert({
    where: { email: 'owner@staynest.com' },
    update: {},
    create: {
      email: 'owner@staynest.com',
      name: 'Rajesh Kumar',
      phone: '+919876543210',
      passwordHash: ownerPassword,
      role: 'OWNER',
      emailVerified: true,
      phoneVerified: true,
      referralCode: 'SNOWNER001',
    },
  })

  // Create sample guest
  const guestPassword = await bcrypt.hash('Guest@123', 12)
  const guest = await prisma.user.upsert({
    where: { email: 'guest@staynest.com' },
    update: {},
    create: {
      email: 'guest@staynest.com',
      name: 'Priya Sharma',
      phone: '+919876543211',
      passwordHash: guestPassword,
      role: 'GUEST',
      emailVerified: true,
      phoneVerified: true,
      gender: 'FEMALE',
      referralCode: 'SNGUEST001',
    },
  })

  console.log('✅ Created users:', { admin: admin.email, owner: owner.email, guest: guest.email })

  // Sample properties data
  const propertiesData = [
    {
      name: 'Sunrise PG for Working Women',
      city: 'Bangalore', state: 'Karnataka',
      address: '123 MG Road, Indiranagar', pincode: '560038',
      latitude: 12.9716, longitude: 77.6412,
      propertyType: 'PG' as const, gender: 'FEMALE' as const,
      basePrice: 12000, securityDeposit: 15000,
      description: 'A safe and comfortable PG accommodation exclusively for working women, located in the heart of Indiranagar with easy access to tech parks and metro stations. Features 24/7 security, CCTV surveillance, and home-cooked meals.',
      amenities: ['wifi', 'food', 'laundry', 'cctv', 'security', 'power_backup'],
    },
    {
      name: 'Tech Hub Co-living Space',
      city: 'Bangalore', state: 'Karnataka',
      address: '456 Outer Ring Road, Marathahalli', pincode: '560037',
      latitude: 12.9569, longitude: 77.7011,
      propertyType: 'CO_LIVING' as const, gender: 'ANY' as const,
      basePrice: 18000, securityDeposit: 20000,
      description: 'Modern co-living space designed for young professionals and tech employees. Community events, high-speed WiFi, and fully furnished rooms with premium amenities.',
      amenities: ['wifi', 'ac', 'gym', 'parking', 'study_room', 'lift'],
    },
    {
      name: 'Student Nest Hostel',
      city: 'Pune', state: 'Maharashtra',
      address: '789 FC Road, Shivaji Nagar', pincode: '411005',
      latitude: 18.5314, longitude: 73.8446,
      propertyType: 'HOSTEL' as const, gender: 'MALE' as const,
      basePrice: 8000, securityDeposit: 5000,
      description: 'Budget-friendly hostel for students near major colleges. Includes study rooms, mess facility, and recreational areas.',
      amenities: ['wifi', 'food', 'study_room', 'laundry'],
    },
    {
      name: 'Green Valley Student Housing',
      city: 'Delhi', state: 'Delhi',
      address: '321 North Campus Road', pincode: '110007',
      latitude: 28.6889, longitude: 77.2090,
      propertyType: 'STUDENT_ACCOMMODATION' as const, gender: 'ANY' as const,
      basePrice: 10000, securityDeposit: 10000,
      description: 'Premium student accommodation near Delhi University North Campus. Air-conditioned rooms, library access, and 24/7 security.',
      amenities: ['wifi', 'ac', 'study_room', 'cctv', 'security', 'lift'],
    },
    {
      name: 'Comfort Stay PG',
      city: 'Mumbai', state: 'Maharashtra',
      address: '555 Andheri West', pincode: '400058',
      latitude: 19.1136, longitude: 72.8697,
      propertyType: 'PG' as const, gender: 'ANY' as const,
      basePrice: 15000, securityDeposit: 15000,
      description: 'Centrally located PG in Andheri West with easy access to business districts. Fully furnished with modern amenities.',
      amenities: ['wifi', 'ac', 'food', 'parking', 'power_backup', 'attached_bathroom'],
    },
    {
      name: 'Elite Co-living Hyderabad',
      city: 'Hyderabad', state: 'Telangana',
      address: '888 HITEC City', pincode: '500081',
      latitude: 17.4435, longitude: 78.3772,
      propertyType: 'CO_LIVING' as const, gender: 'ANY' as const,
      basePrice: 16000, securityDeposit: 18000,
      description: 'Premium co-living space in HITEC City for IT professionals. Modern infrastructure, networking events, and gym facility.',
      amenities: ['wifi', 'ac', 'gym', 'parking', 'food', 'lift', 'cctv'],
    },
  ]

  for (const propData of propertiesData) {
    const { amenities, ...propertyFields } = propData
    const slug = propertyFields.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')

    const property = await prisma.property.upsert({
      where: { slug },
      update: {},
      create: {
        ...propertyFields,
        slug,
        ownerId: owner.id,
        status: 'ACTIVE',
        isVerified: true,
        isInstantBook: Math.random() > 0.5,
        noBrokerage: Math.random() > 0.3,
        country: 'India',
        coverImage: `https://images.unsplash.com/photo-${1560448204 + Math.floor(Math.random() * 100)}-e02f11c3d0e2?w=800&h=600&fit=crop`,
        images: [
          `https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop`,
          `https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop`,
          `https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&h=600&fit=crop`,
        ],
        checkInTime: '10:00',
        checkOutTime: '11:00',
        minStayDays: 30,
        noticePeriodDays: 30,
        rules: ['No smoking inside premises', 'No loud music after 10 PM', 'Visitors allowed till 8 PM'],
        totalRooms: 10,
        availableRooms: Math.floor(Math.random() * 8) + 2,
        averageRating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
        totalReviews: Math.floor(Math.random() * 50) + 5,
        totalBookings: Math.floor(Math.random() * 100) + 10,
      },
    })

    // Add amenities
    for (const amenityName of amenities) {
      await prisma.propertyAmenity.upsert({
        where: { propertyId_name: { propertyId: property.id, name: amenityName } },
        update: {},
        create: { propertyId: property.id, name: amenityName },
      })
    }

    // Add rooms
    const roomTypes: Array<'SINGLE' | 'DOUBLE' | 'TRIPLE'> = ['SINGLE', 'DOUBLE', 'TRIPLE']
    for (let i = 0; i < 3; i++) {
      await prisma.room.create({
        data: {
          propertyId: property.id,
          name: `${roomTypes[i]} Room ${i + 1}`,
          roomType: roomTypes[i],
          capacity: i + 1,
          totalBeds: i + 1,
          availableBeds: Math.floor(Math.random() * (i + 1)) + 1,
          pricePerMonth: property.basePrice + i * 2000,
          floor: Math.floor(Math.random() * 4) + 1,
          size: 100 + i * 50,
          gender: property.gender,
          amenities: amenities.slice(0, 3),
        },
      })
    }

    // Add nearby places
    await prisma.nearbyPlace.createMany({
      data: [
        { propertyId: property.id, name: 'Metro Station', type: 'metro', distance: 0.8 },
        { propertyId: property.id, name: 'City College', type: 'college', distance: 1.2 },
        { propertyId: property.id, name: 'Tech Park', type: 'company', distance: 2.0 },
        { propertyId: property.id, name: 'General Hospital', type: 'hospital', distance: 1.5 },
      ],
    })

    console.log(`✅ Created property: ${property.name}`)
  }

  // Create sample coupons
  const coupons = [
    { code: 'FIRST50', title: 'First Booking 50% Off', type: 'PERCENTAGE' as const, discountValue: 50, maxDiscount: 2000, usageLimit: 1000, perUserLimit: 1 },
    { code: 'STUDENT25', title: 'Student Special 25% Off', type: 'PERCENTAGE' as const, discountValue: 25, maxDiscount: 1500, usageLimit: 500, perUserLimit: 2 },
    { code: 'FLAT500', title: 'Flat ₹500 Off', type: 'FIXED_AMOUNT' as const, discountValue: 500, minBookingAmount: 5000, usageLimit: 200, perUserLimit: 1 },
  ]

  for (const couponData of coupons) {
    await prisma.coupon.upsert({
      where: { code: couponData.code },
      update: {},
      create: {
        ...couponData,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    })
  }
  console.log('✅ Created coupons')

  console.log('🎉 Seeding complete!')
  console.log('\n📝 Test Credentials:')
  console.log('Admin: admin@staynest.com / Admin@123')
  console.log('Owner: owner@staynest.com / Owner@123')
  console.log('Guest: guest@staynest.com / Guest@123')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
