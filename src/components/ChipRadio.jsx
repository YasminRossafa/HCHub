/**
 * A radio input visually presented as a filter chip. Uses a real, visible
 * <label> (not placeholder-only text) and a native radio input under the
 * hood so keyboard/screen-reader semantics come for free — the input is
 * `sr-only`, not `display:none`, so it stays focusable and its focus ring is
 * drawn on the visible label via the `.chip-radio-input` rule in index.css.
 */
export default function ChipRadio({ name, value, label, icon: Icon, checked, onChange }) {
  const id = `${name}-${value}`
  return (
    <div className="inline-flex">
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="chip-radio-input sr-only"
      />
      <label
        htmlFor={id}
        className={`flex cursor-pointer items-center gap-1.5 rounded-full border-2 px-3.5 py-2 text-sm font-medium transition-colors ${
          checked
            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-300'
            : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600'
        }`}
      >
        {Icon && <Icon aria-hidden="true" size={14} />}
        {label}
      </label>
    </div>
  )
}
