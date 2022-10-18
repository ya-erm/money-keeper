import { api } from '$lib/api';
import { writable } from 'svelte/store';
import { storable } from './storable';

export const userId = writable<number | null>();

export const token = storable<string | null>(null, 'token');

token.subscribe((value) => {
  api.setSecurityData(value);
});

export const groupId = writable<number | null>();
