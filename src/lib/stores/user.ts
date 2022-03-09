import type { Models } from 'src/sdk';
import { writable } from 'svelte/store';

export const user = writable<Models.User<Record<string, unknown>>>();
