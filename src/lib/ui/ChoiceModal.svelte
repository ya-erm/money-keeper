<script lang="ts">
  import Button from '@ya-erm/svelte-ui/Button';
  import ButtonBase from '@ya-erm/svelte-ui/ButtonBase';
  import Icon from '@ya-erm/svelte-ui/Icon';
  import Modal from '@ya-erm/svelte-ui/Modal';
  import { translate } from '#lib/translate/index.js';

  export let id: string;
  export let opened: boolean;
  export let header: string;
  export let options: { value: string; label: string; icon?: string }[];
  export let value: string | null | undefined;
  export let onSelect: (value: string) => void;
  export let onAccept: () => void;
  export let onClose: () => void;
</script>

<Modal {id} {header} {opened} {onClose}>
  <div class="items flex-col" role="listbox" aria-label={header}>
    {#each options as option (option.value)}
      {@const selected = value === option.value}
      <ButtonBase onClick={() => onSelect(option.value)} role="option" aria-selected={selected}>
        <div class="option w-full flex justify-between gap-0.5 p-0.5" class:active={selected}>
          <div class="flex gap-0.5">
            {#if option.icon}<Icon name={option.icon} />{/if}
            <span>{option.label}</span>
          </div>
          {#if selected}<Icon name="mdi:check" />{/if}
        </div>
      </ButtonBase>
    {/each}
  </div>
  <div class="grid-col-2 gap-1">
    <Button text={$translate('common.cancel')} color="secondary" onClick={onClose} />
    <Button text={$translate('common.accept')} color="primary" onClick={onAccept} />
  </div>
</Modal>

<style>
  .items {
    padding: 0;
    margin: 1rem 0;
    min-width: 14rem;
    list-style: none;
    gap: 0.25rem;
  }
  .option {
    min-height: 2.75rem;
    box-sizing: border-box;
    align-items: center;
  }
  .active {
    color: var(--active-color);
  }
  @media (hover: hover) {
    .option:hover {
      background: var(--hover-background-color);
    }
  }
</style>
