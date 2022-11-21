/* eslint-disable no-console */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const db = new PrismaClient();

async function main() {
  const existingUser = await db.user.findUnique({
    where: { login: 'demo' },
  });

  if (existingUser != null) {
    console.log('Demo user already exists in database. Skip seeding');
    return;
  }

  const user = await db.user.create({
    data: {
      login: 'demo',
      name: 'Demo User',
      password: {
        create: {
          hash: await bcrypt.hash('demo', 10),
        },
      },
    },
  });

  const group = await db.group.create({
    data: {
      name: 'Demo group',
      users: {
        create: {
          userId: user.id,
        },
      },
      categories: {
        createMany: {
          data: [
            {
              type: 'IN',
              name: 'Incomings',
              icon: 'mdi:tray-arrow-down',
            },
            {
              type: 'OUT',
              name: 'Food',
              icon: 'mdi:food',
            },
            {
              type: 'OUT',
              name: 'Home',
              icon: 'mdi:home',
            },
            {
              type: 'OUT',
              name: 'Shopping',
              icon: 'mdi:cart',
            },
          ],
        },
      },
    },
    include: {
      categories: true,
    },
  });

  const categories = group.categories;

  await db.account.create({
    data: {
      ownerId: group.id,
      name: 'Demo Account',
      icon: 'mdi:currency-usd',
      currency: 'USD',
      transactions: {
        createMany: {
          data: [
            {
              ownerId: group.id,
              categoryId: categories[0].id,
              date: '2022-10-01T12:00:00Z',
              comment: 'Salary',
              amount: 1000,
            },
            {
              ownerId: group.id,
              categoryId: categories[1].id,
              date: '2022-10-02T12:00:00Z',
              comment: 'Market',
              amount: 10.35,
            },
            {
              ownerId: group.id,
              categoryId: categories[2].id,
              date: '2022-10-02T12:00:00Z',
              comment: 'Flat rent',
              amount: 300,
            },
          ],
        },
      },
    },
  });

  console.log('Demo user was added to database');
}

main()
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
