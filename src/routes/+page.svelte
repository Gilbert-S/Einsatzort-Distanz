<script lang="ts">
  import DataInput, { type DataRow } from "$lib/components/dataInput.svelte"
  import DarkModeToggle from "$lib/components/darkModeToggle.svelte"

  let dataInput: DataRow[] = $state([])
  let tooltipContent = $state<DataRow | null>(null)
  let tooltipVisible = $state(false)
  let tooltipX = $state(0)
  let tooltipY = $state(0)
  const cache: Record<string, any> = $state({})
  let isLoading = $state(false)

  const CHUNK_SIZE = 100

  let title = $state(
    "Überdimensioniertes Wohn- und Einsatzstätten-Fahrstrecken-Bestimmungs- und Koordinationsprogramm (ÜWEFBKP)"
  )

  async function fetchFromCacheOrApi(query: string) {
    if (cache[query]) {
      return cache[query]
    }
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&polygon=1&addressdetails=1`
    )
    const result = await response.json()
    if (result.length > 0) {
      cache[query] = result
    }
    return result
  }

  async function fetchDistances(coordinatePairs: string[]) {
    const results = []
    for (let i = 0; i < coordinatePairs.length; i += CHUNK_SIZE) {
      const chunk = coordinatePairs.slice(i, i + CHUNK_SIZE)
      const sources = chunk.map((_, index) => index * 2).join(";")
      const destinations = chunk.map((_, index) => index * 2 + 1).join(";")
      const query = `http://router.project-osrm.org/table/v1/driving/${chunk.join(";")}?sources=${sources}&destinations=${destinations}&annotations=distance`
      const response = await fetch(query)
      const result = await response.json()
      if (result.distances) {
        results.push(...result.distances)
      }
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait for 1 second
    }
    return results
  }

  async function getCoordinates() {
    isLoading = true
    const coordinatePairs = []
    const validIndices = []

    for (let i = 0; i < dataInput.length; i++) {
      const row = dataInput[i]

      if (row.plzWohnort && row.plzWohnort) {
        const wohnortQuery = `${row.plzWohnort} ${row.plzWohnort}`
        const wohnortResult = await fetchFromCacheOrApi(wohnortQuery)
        if (wohnortResult.length > 0) {
          dataInput[i] = {
            ...row,
            lat: wohnortResult[0].lat,
            lon: wohnortResult[0].lon,
            displayName: wohnortResult[0].display_name,
            queriedWohnort: true
          }
        } else {
          dataInput[i].queriedWohnort = true
        }
      }

      if (row.einsatzortId) {
        const einsatzortParts = row.einsatzortId.split(" - ")
        einsatzortParts.shift()
        const einsatzortQuery = einsatzortParts.join(",")
        const einsatzortResult = await fetchFromCacheOrApi(einsatzortQuery)
        if (einsatzortResult.length > 0) {
          dataInput[i] = {
            ...dataInput[i],
            einsatzLat: einsatzortResult[0].lat,
            einsatzLon: einsatzortResult[0].lon,
            einsatzDisplayName: einsatzortResult[0].display_name,
            queriedEinsatzort: true
          }
        } else {
          dataInput[i].queriedEinsatzort = true
        }
      }

      if (
        dataInput[i].lat &&
        dataInput[i].lon &&
        dataInput[i].einsatzLat &&
        dataInput[i].einsatzLon
      ) {
        coordinatePairs.push(
          `${dataInput[i].lon},${dataInput[i].lat};${dataInput[i].einsatzLon},${dataInput[i].einsatzLat}`
        )
        validIndices.push(i)
      }
    }

    if (coordinatePairs.length > 0) {
      const distances = await fetchDistances(coordinatePairs)
      if (distances.length > 0) {
        for (let i = 0; i < distances.length; i++) {
          const index = validIndices[i]
          const dist = Number.parseFloat(distances[i][i % CHUNK_SIZE])
          dataInput[index].entfernungKilometer = (dist / 1000).toFixed(1)
        }
      }
    }

    isLoading = false
  }

  function showTooltip(event: MouseEvent, row: DataRow, type: "einsatzort" | "wohnort") {
    tooltipContent = { ...row, type }
    tooltipX = event.clientX + 15
    tooltipY = event.clientY + 15
    tooltipVisible = true
  }

  function hideTooltip() {
    tooltipVisible = false
    tooltipContent = null
  }

  function moveTooltip(event: MouseEvent) {
    tooltipX = event.clientX + 15
    tooltipY = event.clientY + 15
  }

  function openMap(row: DataRow) {
    if (row.lat && row.lon && row.einsatzLat && row.einsatzLon) {
      const url = `https://map.project-osrm.org/?srv=0&loc=${row.lat},${row.lon}&loc=${row.einsatzLat},${row.einsatzLon}`
      window.open(url, "_blank")
    }
  }

  function openDirections(lat: string | undefined, lon: string | undefined) {
    if (lat && lon) {
      const url = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}`
      window.open(url, "_blank")
    }
  }

  let cacheEntries = $derived(Object.keys(cache).length)
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<main class="container mx-auto p-4" onmousemove={moveTooltip}>
  <div class="mb-4 flex items-center justify-between">
    <h1 class="text-2xl font-bold text-sky-600">{title}</h1>
    <DarkModeToggle />
  </div>
  <DataInput bind:dataInput></DataInput>
  <div class="mb-4 flex items-center justify-between">
    <button
      onclick={getCoordinates}
      class="flex items-center rounded bg-sky-600 px-4 py-2 text-white"
    >
      starte Koordinaten & Distanz Abfrage
      {#if isLoading}
        <svg
          class="ml-3 h-5 w-5 animate-spin text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          ></path>
        </svg>
      {/if}
    </button>
    <div class="text-right text-sm text-neutral-600 dark:text-neutral-400">
      zwischengespeicherte eindeutige Koordinaten: {cacheEntries}
    </div>
  </div>
  <div class="relative overflow-hidden rounded shadow-md">
    <table class="min-w-full border-collapse">
      <thead class="bg-neutral-300 dark:bg-neutral-800">
        <tr class="text-left text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
          <th class="px-3 py-3 tracking-wider">Einsatzort-ID</th>
          <th class="px-3 py-3 tracking-wider">PLZ Wohnort</th>
          <th class="px-3 py-3 tracking-wider">Name Wohnort</th>
          <th class="px-3 py-3 tracking-wider">Entfernung Kilometer</th>
        </tr>
      </thead>
      <tbody class="divide-none">
        {#each dataInput as row}
          <tr
            class="text-neutral-900 odd:bg-neutral-100 even:bg-neutral-200 dark:text-neutral-100
              odd:dark:bg-neutral-700/50 even:dark:bg-neutral-700/90"
          >
            <td
              class="relative whitespace-nowrap px-6 py-4 text-sm font-medium
                {row.queriedEinsatzort
                ? row.einsatzLat && row.einsatzLon
                  ? 'indicator-green'
                  : 'indicator-red'
                : ''}"
              onmouseenter={(event) => showTooltip(event, row, "einsatzort")}
              onmouseleave={hideTooltip}
              onclick={() => openDirections(row.einsatzLat, row.einsatzLon)}
            >
              {row.einsatzortId}
            </td>
            <td
              class="relative whitespace-nowrap px-6 py-4 text-sm"
              onmouseenter={(event) => showTooltip(event, row, "wohnort")}
              onmouseleave={hideTooltip}
              onclick={() => openDirections(row.lat, row.lon)}
            >
              {row.plzWohnort}
            </td>
            <td
              class="relative whitespace-nowrap px-6 py-4 text-sm
                {row.queriedWohnort
                ? row.lat && row.lon
                  ? 'indicator-green'
                  : 'indicator-red'
                : ''}"
              onmouseenter={(event) => showTooltip(event, row, "wohnort")}
              onmouseleave={hideTooltip}
              onclick={() => openDirections(row.lat, row.lon)}
            >
              {row.nameWohnort}
            </td>
            <td class="relative whitespace-nowrap px-6 py-4 text-sm" onclick={() => openMap(row)}>
              {row.entfernungKilometer}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <footer
    class="mt-14 min-w-64 max-w-screen-sm rounded bg-neutral-100 p-4 text-sm text-neutral-600 shadow-md dark:bg-neutral-800 dark:text-neutral-400"
  >
    <p class="mb-2">
      Dieses Tool fragt die OpenStreetMap Nominatim API nach Koordinaten basierend auf geschriebenen
      Adressen ab. Anschließend wird die OSRM API verwendet, um die Entfernung zwischen den Wohnort-
      und Einsatzort-Koordinaten zu berechnen.
    </p>
    <ul class="list-inside list-disc">
      <li>
        <a
          href="https://nominatim.org/release-docs/develop/api/Search/"
          target="_blank"
          rel="noopener"
          class="text-sky-600 hover:underline"
        >
          Nominatim API
        </a>
      </li>
      <li>
        <a
          href="https://project-osrm.org"
          target="_blank"
          rel="noopener"
          class="text-sky-600 hover:underline"
        >
          OSRM API
        </a>
      </li>
    </ul>
  </footer>

  {#if tooltipVisible && tooltipContent}
    <div
      class="fixed z-50 max-w-xs rounded bg-black bg-opacity-80 p-2 text-white dark:bg-white
			dark:bg-opacity-80 dark:text-black"
      style="top: {tooltipY}px; left: {tooltipX}px;"
    >
      {#if tooltipContent.type === "einsatzort" && tooltipContent.einsatzLat && tooltipContent.einsatzLon}
        <p>Lat: {tooltipContent.einsatzLat}</p>
        <p>Lon: {tooltipContent.einsatzLon}</p>
        <p>{tooltipContent.einsatzDisplayName}</p>
      {:else if tooltipContent.type === "wohnort" && tooltipContent.lat && tooltipContent.lon}
        <p>Lat: {tooltipContent.lat}</p>
        <p>Lon: {tooltipContent.lon}</p>
        <p>{tooltipContent.displayName}</p>
      {:else}
        <p>Keine Koordinaten.</p>
      {/if}
    </div>
  {/if}
</main>

<style>
  .indicator-green::after {
    content: "";
    position: absolute;
    left: 0.3rem;
    top: 50%;
    transform: translateY(-50%);
    width: 0.75rem;
    height: 0.75rem;
    background-color: #10b981; /* green-500 */
    border-radius: 50%;
  }
  .indicator-red::after {
    content: "";
    position: absolute;
    left: 0.3rem;
    top: 50%;
    transform: translateY(-50%);
    width: 0.75rem;
    height: 0.75rem;
    background-color: #ef4444; /* red-500 */
    border-radius: 50%;
  }

  th,
  td,
  tr {
    border-width: 0;
  }
</style>
