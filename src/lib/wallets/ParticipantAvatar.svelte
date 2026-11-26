<script lang="ts">
  import Icon from '@ya-erm/svelte-ui/Icon';
  import type { Participant } from '#lib/data/interfaces.js';
  import { participantAvatarAppearance } from './participantAvatar';
  export let participant: Pick<Participant, 'id' | 'name' | 'avatarColor' | 'avatarIcon'>;
  $: words = participant.name.trim().split(/\s+/).filter(Boolean);
  $: initials =
    (Array.from(words[0] ?? '')[0] ?? '') + (words.length > 1 ? Array.from(words[words.length - 1])[0] : '');
  $: appearance = participantAvatarAppearance(participant);
  $: icon = typeof participant.avatarIcon === 'string' ? participant.avatarIcon.trim() : '';
</script>

<span
  class="avatar"
  style:--avatar-background={appearance.background}
  style:--avatar-color={appearance.foreground}
  aria-hidden="true"
  data-testId="ParticipantAvatar"
  data-icon={icon || undefined}
  >{#if icon}<Icon name={icon} size={1.5} />{:else if initials}{initials.toLocaleUpperCase()}{:else}<Icon
      name="mdi:account"
      size={1.5}
    />{/if}</span
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
    background: var(--avatar-background);
    color: var(--avatar-color);
    font-size: 1.1rem;
    font-weight: 500;
  }
</style>
