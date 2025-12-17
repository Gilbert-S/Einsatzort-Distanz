<script lang="ts">
  export interface DataRow {
    einsatzortId: string
    plzWohnort: string
    nameWohnort: string
    strasseWohnort: string
    zusatzWohnort: string
    entfernungKilometer: string
    dauer: string
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
      const [einsatzortId, plzWohnort, nameWohnort, strasseWohnort, zusatzWohnort] = row.split("\t")
      return {
        einsatzortId,
        plzWohnort,
        nameWohnort,
        strasseWohnort,
        zusatzWohnort,
        entfernungKilometer: "",
        dauer: ""
      }
    })
  })
</script>

<textarea
  bind:value={textAreaValue}
  rows="10"
  placeholder="Fügen Sie Ihre Daten hier ein..."
  class="bg-opacity-30 dark:bg-opacity-30 mb-4 w-full rounded border bg-neutral-100 p-2
    text-neutral-900 dark:bg-neutral-700 dark:text-neutral-300"
></textarea>
