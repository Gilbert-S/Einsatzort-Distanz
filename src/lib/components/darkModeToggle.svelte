<script lang="ts">
  import { browser } from "$app/environment"
  let darkMode = $state(true)

  function toggleDarkMode() {
    darkMode = !darkMode
  }

  $effect(() => {
    if (browser) {
      if (darkMode) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }
  })
</script>

<button
  onclick={toggleDarkMode}
  class="relative flex cursor-pointer items-center rounded-full px-2 py-2"
  aria-label="Toggle dark mode"
>
  <div
    class="relative mx-2 flex h-8 w-16 items-center justify-between
      rounded-full bg-neutral-800 px-1 dark:bg-neutral-400"
  >
    <span class="">{darkMode ? "☀️" : "🌙"}</span>
    <div
      class="absolute left-0 top-0 h-8 w-8 transform rounded-full bg-neutral-100
        transition-transform dark:bg-neutral-900 {darkMode
        ? 'translate-x-8'
        : ''} flex items-center justify-center"
    >
      <span class="">{darkMode ? "🌙" : "☀️"}</span>
    </div>
    <span class="">{darkMode ? "" : "🌙"}</span>
  </div>
</button>
