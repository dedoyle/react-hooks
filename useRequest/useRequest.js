import { useState, useRef, useEffect, useCallback } from 'react'
import usePersistFn from './usePersistFn'

class Fetch {
  that = this

  count = 0

  manual = false

  // 是否卸载
  unmountedFlag = false

  service = () => Promise.resolve()

  subscribe = () => {}

  state = {
    loading: false,
    data: undefined,
    error: undefined,
    params: [],
    run: this.run.bind(this.that),
    unmount: this.unmount.bind(this.that),
    mutate: this.mutate.bind(this.that),
    refresh: this.refresh.bind(this.that),
  }

  initData = {}

  formatResult = res => res

  constructor(
    service = () => Promise.resolve(),
    subscribe = () => {},
    config = {},
    initState = {}
  ) {
    this.service = service
    this.subscribe = subscribe
    this.config = config
    if (initState) {
      this.state = {
        ...this.state,
        ...initState,
      }
    }
  }

  setState(s = {}) {
    this.state = {
      ...this.state,
      ...s,
    }
    this.subscribe(this.state)
  }

  mutate(data) {
    if (typeof data === 'function') {
      this.state = {
        data: data(this.state.data),
      }
    } else {
      this.state = {
        data,
      }
    }
  }

  run(...args) {
    // console.trace()
    this.count += 1
    // 闭包存储当前请求的 count
    const currentCount = this.count

    this.setState({
      loading: true,
      params: args,
    })

    return this.service(...args)
      .then(res => {
        if (!this.unmountedFlag && currentCount === this.count) {
          const result = this.config.formatResult
            ? this.config.formatResult(res)
            : res
          this.setState({
            data: result,
            error: undefined,
            loading: false,
          })
          return result
        }
      })
      .catch(error => {
        if (!this.unmountedFlag && currentCount === this.count) {
          this.setState({
            data: undefined,
            error,
            loading: false,
          })
          throw error
        }
      })
  }

  refresh() {
    // console.log('refresh')
    this.run(...this.state.params)
  }

  unmount() {
    this.unmountedFlag = true
  }
}

/**
 * @description 封装请求逻辑，包括 loading, error 和取消请求
 * @param {function} service 请求函数
 * @param {object} params 请求参数
 * @param {any} initial data 初始值
 */
const useRequest = (service, options) => {
  const _options = options || {}
  const {
    refreshDeps = [],
    defaultParams = {},
    initialData = {},
    manual = false,
    formatResult = res => res,
  } = _options
  const [fetchData, setFetchData] = useState()
  const servicePersist = usePersistFn(service)
  const formatResultPersist = usePersistFn(formatResult)
  const subscribe = usePersistFn(data => {
    setFetchData(data)
  })

  const config = {
    formatResult: formatResultPersist,
  }

  const run = useCallback(
    (...args) => {
      const newFetch = new Fetch(servicePersist, subscribe.bind(null), config, {
        data: initialData,
        formatResult,
      })
      setFetchData(newFetch.state)
      return newFetch.run(...args)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subscribe]
  )

  const runRef = useRef(run)
  runRef.current = run

  useEffect(() => {
    if (!manual) {
      console.log('first run')
      runRef.current && runRef.current(defaultParams)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!manual) {
      fetchData && fetchData.refresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...refreshDeps])

  useEffect(
    () => () => {
      fetchData && fetchData.unmount()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  return {
    loading: !manual,
    data: initialData,
    error: undefined,
    params: [],
    run,
    ...fetchData,
  }
}

export default useRequest
