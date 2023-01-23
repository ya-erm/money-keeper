/* eslint-disable no-console */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const db = new PrismaClient();

async function createTestUser() {
  const { TEST_LOGIN, TEST_PASSWORD, TEST_SESSION } = process.env;

  console.log('--- TEST USER ---');

  let testUser = await db.user.findUnique({
    where: { login: TEST_LOGIN },
  });

  if (testUser != null) {
    console.log('Test user already exists in database. Skip creating');
  } else {
    testUser = await db.user.create({
      data: {
        login: TEST_LOGIN,
        password: {
          create: {
            hash: await bcrypt.hash(TEST_PASSWORD, 10),
          },
        },
        name: 'Test user',
      },
    });
    console.log(`Test user #${testUser.id} created`);
  }

  let testGroup = await db.group.findFirst({
    where: {
      name: 'Test group',
      users: { some: { userId: testUser.id } },
    },
  });

  if (testGroup != null) {
    console.log('Test group already exists in database. Skip creating');
  } else {
    testGroup = await db.group.create({
      data: {
        name: 'Test group',
        users: {
          create: {
            userId: testUser.id,
          },
        },
      },
    });
    console.log(`Test group #${testGroup.id} created`);
  }

  const token = await db.authToken.findUnique({
    where: { value: TEST_SESSION },
  });

  if (token != null) {
    console.log('Test token already exists in database. Skip creating');
  } else {
    await db.authToken.create({
      data: {
        userId: testUser.id,
        groupId: testGroup.id,
        value: TEST_SESSION,
      },
    });
    console.log('Test token created');
  }
}

async function createTestCategories(ownerId) {
  const existingCategories = await db.category.findMany({
    where: { ownerId },
  });
  const existingCategoriesNames = existingCategories.map((category) => category.name);
  const { count } = await db.category.createMany({
    data: [
      {
        type: 'IN',
        name: 'T_Work',
        ownerId,
      },
      {
        type: 'OUT',
        name: 'T_Shop',
        ownerId,
      },
    ].filter((item) => !existingCategoriesNames.includes(item.name)),
  });
  console.log(`Created ${count} test categories`);
}

async function createTestAccounts(ownerId) {
  const existingAccounts = await db.account.findMany({
    where: { ownerId },
  });
  const existingAccountsNames = existingAccounts.map((account) => account.name);
  const { count } = await db.account.createMany({
    data: [
      {
        name: 'T_TST',
        currency: 'TST',
        ownerId,
      },
      {
        name: 'T_USD',
        currency: 'USD',
        ownerId,
      },
    ].filter((item) => !existingAccountsNames.includes(item.name)),
  });
  console.log(`Created ${count} test account`);
}
async function createTestTags(ownerId) {
  const existingTags = await db.tag.findMany({
    where: { ownerId },
  });
  const existingTagsNames = existingTags.map((tag) => tag.name);
  const { count } = await db.tag.createMany({
    data: [
      {
        name: 'T_Tag',
        ownerId,
      },
      {
        name: 'T_Oil',
        ownerId,
      },
    ].filter((item) => !existingTagsNames.includes(item.name)),
  });
  console.log(`Created ${count} test categories`);
}

async function createTestData() {
  const { TEST_LOGIN } = process.env;

  console.log('--- TEST DATA ---');

  const testUser = await db.user.findUnique({
    where: { login: TEST_LOGIN },
    include: {
      groups: true,
    },
  });

  const groups = await db.group.findMany({
    where: { users: { some: { userId: testUser.id } } },
  });

  const testGroup = groups.find((group) => group.name === 'Test group');

  await createTestCategories(testGroup.id);
  await createTestAccounts(testGroup.id);
  await createTestTags(testGroup.id);
}

async function createDemoUser() {
  console.log('--- DEMO USER ---');

  const existingUser = await db.user.findUnique({
    where: { login: 'demo' },
  });

  if (existingUser != null) {
    console.log('Demo user already exists in database. Skip creating');
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
        create: [
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
        create: [
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
  });

  console.log('Demo user was added to database');
}

async function main() {
  await createTestUser();
  await createTestData();
  await createDemoUser();
}

main()
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
