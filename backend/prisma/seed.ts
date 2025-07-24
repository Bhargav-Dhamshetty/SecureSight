import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create sample users
  const users = await Promise.all([
    prisma.user.create({
      data: { name: 'John Doe', email: 'john@example.com' }
    }),
    prisma.user.create({
      data: { name: 'Jane Smith', email: 'jane@example.com' }
    }),
    prisma.user.create({
      data: { name: 'Security Admin', email: 'admin@securesight.com' }
    }),
    prisma.user.create({
      data: { name: 'Mike Johnson', email: 'mike@example.com' }
    })
  ]);

  // Create cameras
  const cameras = await Promise.all([
    prisma.camera.create({
      data: { name: 'Shop Floor A', location: 'Main Production Area' }
    }),
    prisma.camera.create({
      data: { name: 'Vault Camera', location: 'Security Vault' }
    }),
    prisma.camera.create({
      data: { name: 'Main Entrance', location: 'Building Entrance' }
    }),
    prisma.camera.create({
      data: { name: 'Parking Lot', location: 'Employee Parking' }
    })
  ]);

  // Create incidents over last 24 hours
  const incidentTypes = ['Gun Threat', 'Unauthorized Access', 'Suspicious Activity', 'Loitering', 'Vehicle Alert'];
  const now = new Date();

  const incidents = [];
  for (let i = 0; i < 15; i++) {
    const hoursAgo = Math.floor(Math.random() * 24);
    const tsStart = new Date(now.getTime() - (hoursAgo * 60 * 60 * 1000));
    const duration = Math.floor(Math.random() * 300) + 30; // 30-330 seconds
    const tsEnd = new Date(tsStart.getTime() + (duration * 1000));
    
    incidents.push({
      cameraId: cameras[Math.floor(Math.random() * cameras.length)].id,
      type: incidentTypes[Math.floor(Math.random() * incidentTypes.length)],
      tsStart,
      tsEnd,
      thumbnailUrl: `https://picsum.photos/200/150?random=${i}`,
      resolved: Math.random() > 0.7 // 30% resolved
    });
  }

  await prisma.incident.createMany({ data: incidents });

  console.log('✅ Database seeded successfully!');
  console.log(`👥 Created ${users.length} users`);
  console.log(`📹 Created ${cameras.length} cameras`);
  console.log(`🚨 Created ${incidents.length} incidents`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });