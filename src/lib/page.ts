import { page as state, type Page } from '$app/state';
import { toStore, type Readable } from 'svelte/store';

// Keep legacy components and derived stores reactive to SvelteKit 3 state.
// Create the effect at subscription time so SSR reads the current request's page.
export const page: Readable<Page> = {
  subscribe(run, invalidate) {
    return toStore(() => ({
      data: state.data,
      error: state.error,
      form: state.form,
      params: state.params,
      route: state.route,
      shallow: state.shallow,
      state: state.state,
      status: state.status,
      url: state.url,
    })).subscribe(run, invalidate);
  },
};
