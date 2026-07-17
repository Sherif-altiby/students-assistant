import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/prisma';

async function main() {
  const hashedPassword = await bcrypt.hash(
    '12345678',
    10,
  );

  const user = await prisma.user.create({
    data: {
      name: 'Sherif Ahmed',
      email: 'sherif@example.com',
      phone: '01000000001',
      password: hashedPassword,
      gender: 'MALE',
      level: 'GENERAL_SECONDARY',
      track: 'SCIENCE_MATH',
      parentPhone: '01000000002',
      country: 'Egypt',
    },
  });

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);

  yesterday.setDate(
    yesterday.getDate() - 1,
  );

  const drinkWater = await prisma.habit.create({
    data: {
      title: 'Drink water',
      userId: user.id,
    },
  });

  const exercise = await prisma.habit.create({
    data: {
      title: 'Exercise',
      userId: user.id,
    },
  });

  const readBook = await prisma.habit.create({
    data: {
      title: 'Read a book',
      userId: user.id,
    },
  });

  await prisma.completedHabit.createMany({
    data: [
      {
        userId: user.id,
        habitId: drinkWater.id,
        date: today,
      },
      {
        userId: user.id,
        habitId: exercise.id,
        date: today,
      },
      {
        userId: user.id,
        habitId: readBook.id,
        date: yesterday,
      },
    ],
  });

  const mathTask = await prisma.task.create({
    data: {
      title: 'Study mathematics',
      frequency: 'TODAY',
      userId: user.id,
    },
  });

  const gymTask = await prisma.task.create({
    data: {
      title: 'Go to the gym',
      frequency: 'EVERY_DAY',
      userId: user.id,
    },
  });

  const englishTask = await prisma.task.create({
    data: {
      title: 'Practice English',
      frequency: 'EVERY_DAY',
      userId: user.id,
    },
  });

   

  console.log('Seed completed successfully.');
}

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });