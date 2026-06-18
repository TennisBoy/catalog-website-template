/** Big −/+ stepper with tap-to-type for large class-set counts. */
export function QuantityStepper({
  value,
  onChange,
}: {
  value: number
  onChange: (n: number) => void
}) {
  const set = (n: number) => onChange(Math.max(0, Math.round(n) || 0))
  return (
    <div className="stepper">
      <button type="button" className="stepper__btn" onClick={() => set(value - 1)} aria-label="Decrease quantity">
        −
      </button>
      <input
        className="stepper__input"
        type="number"
        inputMode="numeric"
        min={0}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => set(Number(e.target.value))}
        aria-label="Quantity"
      />
      <button type="button" className="stepper__btn" onClick={() => set(value + 1)} aria-label="Increase quantity">
        +
      </button>
    </div>
  )
}
