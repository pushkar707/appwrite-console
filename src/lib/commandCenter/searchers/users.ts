import { goto } from '$app/navigation';
import { sdk } from '$lib/stores/sdk';
import { project } from '$routes/console/project-[project]/store';
import { get } from 'svelte/store';
import type { Command, Searcher } from '../commands';
import type { Models } from '@appwrite.io/console';

const getUserCommand = (user: Models.User<Models.Preferences>, projectId: string) =>
    ({
        label: user.name,
        callback: () => {
            goto(`/console/project-${projectId}/auth/user-${user.$id}`);
        },
        group: 'users',
        icon: 'user-circle'
    } satisfies Command);

export const userSearcher = (async (query: string) => {
    const { users } = await sdk.forProject.users.list([], query);
    const projectId = get(project).$id;

    if (users.length === 1) {
        return [
            getUserCommand(users[0], projectId),
            {
                label: 'Go to activity',
                callback: () => {
                    goto(`/console/project-${projectId}/auth/user-${users[0].$id}/activity`);
                },
                group: 'users'
            },
            {
                label: 'Go to sessions',
                callback: () => {
                    goto(`/console/project-${projectId}/auth/user-${users[0].$id}/sessions`);
                },
                group: 'users'
            },
            {
                label: 'Go to memberships',
                callback: () => {
                    goto(`/console/project-${projectId}/auth/user-${users[0].$id}/memberships`);
                },
                group: 'users'
            }
        ];
    }
    return users.map((user) => getUserCommand(user, projectId));
}) satisfies Searcher;
