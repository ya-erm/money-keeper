import type { Group, User } from '@prisma/client';

export type GroupWithUsers = Pick<Group, 'id' | 'name'> & {
  users: Pick<User, 'id' | 'name' | 'login'>[];
};
