import { PrismaClient } from '@prisma/client';
import { addDays, addHours, setHours, setMinutes } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.reminder.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.user.deleteMany();

  // Create test user
  const user = await prisma.user.create({
    data: {
      email: 'patient@example.com',
      name: 'John Doe',
      phone: '+1234567890',
    },
  });

  console.log(`👤 Created user: ${user.name} (${user.email})`);

  // Create prescriptions
  const prescriptions = [
    {
      name: 'Ibuprofen',
      dosage: '200mg',
      frequency: 'EVERY_8_HOURS',
      startDate: new Date(),
      endDate: addDays(new Date(), 14),
      notes: 'Take with food',
      status: 'ACTIVE',
    },
    {
      name: 'Amoxicillin',
      dosage: '500mg',
      frequency: 'EVERY_12_HOURS',
      startDate: new Date(),
      endDate: addDays(new Date(), 10),
      notes: 'Complete full course',
      status: 'ACTIVE',
    },
  ];

  for (const prescriptionData of prescriptions) {
    const prescription = await prisma.prescription.create({
      data: {
        ...prescriptionData,
        userId: user.id,
      },
    });

    console.log(`💊 Created prescription: ${prescription.name}`);

    // Generate reminders for the next 3 days
    await generateReminders(prisma, prescription);
  }

  console.log('✅ Database seeded successfully!');
}

async function generateReminders(
  prisma: PrismaClient,
  prescription: {
    id: string;
    frequency: string;
    startDate: Date;
    endDate: Date;
  }
) {
  const now = new Date();
  const endDate = new Date(prescription.endDate);
  
  // Generate reminders for the next 3 days
  for (let day = 0; day < 3; day++) {
    const currentDate = addDays(now, day);
    
    // Skip if the date is after the prescription end date
    if (currentDate > endDate) break;

    // Generate reminders based on frequency
    switch (prescription.frequency) {
      case 'EVERY_8_HOURS':
        // 8 AM, 4 PM, 12 AM
        await createReminder(prisma, prescription.id, setHours(currentDate, 8));
        await createReminder(prisma, prescription.id, setHours(currentDate, 16));
        await createReminder(prisma, prescription.id, setHours(addDays(currentDate, 1), 0)); // Next day 12 AM
        break;
        
      case 'EVERY_12_HOURS':
        // 8 AM, 8 PM
        await createReminder(prisma, prescription.id, setHours(currentDate, 8));
        await createReminder(prisma, prescription.id, setHours(currentDate, 20));
        break;
        
      case 'DAILY':
      default:
        // 9 AM
        await createReminder(prisma, prescription.id, setHours(currentDate, 9));
        break;
    }
  }
}

async function createReminder(
  prisma: PrismaClient,
  prescriptionId: string,
  time: Date
) {
  // Skip if the reminder time is in the past
  if (time < new Date()) return;

  await prisma.reminder.create({
    data: {
      prescriptionId,
      time,
      status: 'PENDING',
    },
  });
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
