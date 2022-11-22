import bcrypt from 'bcrypt';

import { ApiError } from '$lib/api';
import { db } from '$lib/server';
import { checkStringParameter } from '$lib/utils';

export type RegisterRequestData = {
  name: string;
  login: string;
  password: string;
};

export async function register(data: RegisterRequestData) {
  const name = checkStringParameter(data.name, 'name');
  const login = checkStringParameter(data.login, 'login');
  const password = checkStringParameter(data.password, 'password');

  const user = await db.user.findUnique({
    where: { login },
  });

  if (user) {
    return new ApiError(400, 'USER_ALREADY_EXISTS', 'User already exists');
  }

  await db.user.create({
    data: {
      name,
      login,
      password: {
        create: { hash: await bcrypt.hash(password, 10) },
      },
      groups: {
        create: {
          group: {
            create: {
              name: `${name}'s group`,
            },
          },
        },
      },
    },
  });
}
