import { useCallback, useEffect, useRef } from 'react'
import useRequest from './useRequest'

const defaultPage = 1

/**
 * @description 分页相关逻辑
 * @param {function} service 请求函数
 * @param {object} params 请求参数
 */
const usePagination = (service, options = {}) => {
  const { defaultPageSize = 20, refreshDeps = [], ...restOptions } = options

  const { data, run, params, ...rest } = useRequest(service, {
    defaultParams: {
      current: defaultPage,
      pageSize: defaultPageSize,
    },
    initialData: { rows: [], total_count: 0 },
    ...restOptions,
  })

  const { current = 1, pageSize = defaultPageSize } =
    params && params[0] ? params[0] : {}
  const total = data?.total_count || 0

  const onChange = useCallback(
    (p, s) => {
      console.log('onChange ')
      let toPage = p <= 0 ? 1 : p
      const toPageSize = s <= 0 ? 1 : s

      const tempTotalPage = Math.ceil(total / toPageSize)
      if (toPage > tempTotalPage) {
        toPage = tempTotalPage
      }
      if (toPage > 0) {
        run({
          current: toPage,
          pageSize: toPageSize,
        })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [total]
  )

  const onShowSizeChange = useCallback(
    (p, s) => {
      onChange(p, s)
    },
    [onChange]
  )

  const changeCurrent = useCallback(
    num => {
      run({
        current: num,
        pageSize: pageSize,
      })
    },
    [run, pageSize]
  )

  const changeCurrentRef = useRef(changeCurrent)
  changeCurrentRef.current = changeCurrent

  useEffect(() => {
    console.log(refreshDeps)
    console.log('refreshDeps change')
    if (!options.manual) {
      changeCurrentRef.current(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...refreshDeps])

  return {
    data,
    ...rest,
    pagination: {
      current,
      pageSize,
      total: data?.total_count,
      onChange,
      onShowSizeChange,
    },
  }
}

export default usePagination
