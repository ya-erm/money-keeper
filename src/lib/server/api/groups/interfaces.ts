import type { GroupWithUsers } from '$lib/interfaces';
import type { Group, User, UserToGroup } from '@prisma/client';
import { Prisma } from '@prisma/client';

type GroupDbo = Pick<Group, 'id' | 'name'> & { users: (UserToGroup & { user: Pick<User, 'id' | 'name' | 'login'> })[] };

export const groupSelection = Prisma.validator<Prisma.GroupSelect>()({
  id: true,
  name: true,
  users: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          login: true,
        },
      },
    },
  },
});

export const mapGroup = (group: GroupDbo): GroupWithUsers => ({
  id: group.id,
  name: group.name,
  users: group.users.map(({ user }) => user),
});
