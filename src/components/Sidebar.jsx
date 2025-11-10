function Sidebar({ form, setForm, onSubmit, toggles, setToggles, hasItems }) {
  return (
    <aside className="basis-1/3 max-w-[33%] border-r border-gray-200 dark:border-neutral-800 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Lookup Person</h2>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit?.()
          }}
        >
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="item-text">Person ID</label>
            <input
              id="item-text"
              type="text"
              value={form.personId}
              onChange={(e) => setForm((f) => ({ ...f, personId: e.target.value }))}
              placeholder="e.g., u1, u2, u3"
              className="w-full rounded border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="item-type">Type</label>
            <select
              id="item-type"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full rounded border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="person">person</option>
              <option value="project">project</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full rounded bg-blue-600 text-white text-sm font-medium px-3 py-2 shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Submit
          </button>
        </form>
      </div>

      {hasItems && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold">Display</h3>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="size-4"
              checked={!!toggles?.teams}
              onChange={(e) => setToggles((t) => ({ ...t, teams: e.target.checked }))}
            />
            <span>Show teams</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="size-4"
              checked={!!toggles?.repos}
              onChange={(e) => setToggles((t) => ({ ...t, repos: e.target.checked }))}
            />
            <span>Show repos</span>
          </label>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
