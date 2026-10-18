<script lang="ts">
  import SearchPeople from '$lib/components/faces-page/PeopleSearch.svelte';
  import { type PersonResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';
  import FaceThumbnail from './FaceThumbnail.svelte';
  import { Button } from '@immich/ui';

  interface Props {
    screenHeight: number;
    people: PersonResponseDto[];
    peopleToNotShow: PersonResponseDto[];
    onSelect: (person: PersonResponseDto) => void;
    handleSearch?: (sortFaces: boolean) => void;
  }

  let { screenHeight, people, peopleToNotShow, onSelect, handleSearch }: Props = $props();
  let searchedPeopleLocal: PersonResponseDto[] = $state([]);
  let sortBySimilarity = $state(true);
  let name = $state('');

  const showPeople = $derived(
    (name ? searchedPeopleLocal : people).filter((person) =>
      peopleToNotShow.every((unselectedPerson) => unselectedPerson.id !== person.id),
    ),
  );
</script>

<div class="flex flex-wrap items-center gap-4">
  <div class="md:w-96">
    <SearchPeople type="searchBar" placeholder={$t('search_people')} bind:searchName={name} bind:searchedPeopleLocal />
  </div>

  {#if handleSearch}
    <div class="flex gap-2" role="group" aria-label={$t('merge_people')}>
      <Button
        size="small"
        variant={sortBySimilarity ? 'filled' : 'ghost'}
        aria-pressed={sortBySimilarity}
        onclick={() => {
          sortBySimilarity = true;
          name = '';
          handleSearch(true);
        }}
      >
        {$t('similar_people')}
      </Button>
      <Button
        size="small"
        variant={sortBySimilarity ? 'ghost' : 'filled'}
        aria-pressed={!sortBySimilarity}
        onclick={() => {
          sortBySimilarity = false;
          name = '';
          handleSearch(false);
        }}
      >
        {$t('known_people')}
      </Button>
    </div>
  {/if}
</div>

<div
  class="mt-6 immich-scrollbar overflow-y-auto rounded-3xl bg-gray-200 p-10 dark:bg-immich-dark-gray"
  style:max-height={screenHeight - 400 + 'px'}
>
  <div class="grid-col-2 grid gap-8 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10">
    {#each showPeople as person (person.id)}
      <FaceThumbnail {person} onClick={() => onSelect(person)} circle border selectable />
    {/each}
  </div>
</div>
