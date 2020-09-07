import { useRef } from 'react'
import useRequest from './useRequest'
import usePagination from './usePagination'

export default (service, options = {}) => {
  const { paginated } = options

  const paginatedRef = useRef(paginated)

  if (paginatedRef.current !== paginated) {
    throw Error('禁止修改 paginated 参数')
  }

  paginatedRef.current = paginated

  if (paginated) {
    return usePagination(service, options)
  } else {
    return useRequest(service, options)
  }
}
