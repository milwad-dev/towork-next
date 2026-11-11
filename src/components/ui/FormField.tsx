import { useId, type ReactNode } from 'react'

export interface FieldProps {
  id: string
  'aria-invalid': boolean
  'aria-describedby': string | undefined
}

/** Label + error/hint wrapper; passes a11y props to its child through a render function. */
export function FormField({
  label,
  error,
  hint,
  labelSlot,
  children,
}: {
  label?: string
  error?: string
  hint?: string
  /** Custom label row (replaces `label`), e.g. with a "Forgot password?" link. */
  labelSlot?: (id: string) => ReactNode
  children: (field: FieldProps) => ReactNode
}) {
  const id = useId()
  return (
    <div>
      {labelSlot
        ? labelSlot(id)
        : label && (
            <label htmlFor={id} className="label">
              {label}
            </label>
          )}
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': error ? `${id}-error` : undefined })}
      {error ? (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
    </div>
  )
}
