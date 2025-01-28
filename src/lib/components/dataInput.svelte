<script lang="ts">
  export interface DataRow {
    einsatzortId: string
    plzWohnort: string
    nameWohnort: string
    entfernungKilometer: string
    lat?: string
    lon?: string
    displayName?: string
    einsatzLat?: string
    einsatzLon?: string
    einsatzDisplayName?: string
    queriedWohnort?: boolean
    queriedEinsatzort?: boolean
    type?: "einsatzort" | "wohnort"
  }

  interface DataInputProps {
    dataInput: DataRow[]
  }

  let { dataInput = $bindable([]) }: DataInputProps = $props()

  let textAreaValue = $state("")

  $effect(() => {
    const rows = textAreaValue.split("\n")
    dataInput = rows.map((row) => {
      const [einsatzortId, plzWohnort, nameWohnort] = row.split("\t")
      return { einsatzortId, plzWohnort, nameWohnort, entfernungKilometer: "" }
    })
  })
</script>

<textarea
  bind:value={textAreaValue}
  rows="10"
  placeholder="Fügen Sie Ihre Daten hier ein..."
  class="mb-4 w-full rounded border bg-neutral-100 bg-opacity-30 p-2 text-neutral-900
    dark:bg-neutral-700 dark:bg-opacity-30 dark:text-neutral-300"
></textarea>
