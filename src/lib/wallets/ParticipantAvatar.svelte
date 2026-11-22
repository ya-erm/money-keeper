<script lang="ts">
  import Icon from '@ya-erm/svelte-ui/Icon';
  import type { Participant } from '#lib/data/interfaces.js';
  export let participant: Pick<Participant, 'id' | 'name'>;
  $: words = participant.name.trim().split(/\s+/).filter(Boolean);
  $: initials =
    (Array.from(words[0] ?? '')[0] ?? '') + (words.length > 1 ? Array.from(words[words.length - 1])[0] : '');
  $: hue = Array.from(participant.id).reduce((hash, letter) => (hash * 31 + (letter.codePointAt(0) ?? 0)) % 360, 0);
</script>

<span class="avatar" style:--avatar-hue={hue} aria-hidden="true" data-testId="ParticipantAvatar"
  >{#if initials}{initials.toLocaleUpperCase()}{:else}<Icon name="mdi:account" size={1.5} />{/if}</span
>

<style>
  .avatar {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: hsl(var(--avatar-hue) 50% 85%);
    color: #243040;
    font-size: 1.1rem;
    font-weight: 500;
  }
</style>
