import { useCallback, useRef } from 'react'

const noop = () => {}

const usePersistFn = (fn = noop) => {
  const ref = useRef(() => {
    throw new Error('Cannot call function while rendering')
  })

  ref.current = fn

  const persistFn = useCallback((...args) => ref.current(...args), [ref])

  return persistFn
}

export default usePersistFn
