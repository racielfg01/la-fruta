import { useState, useMemo } from 'react'

export function usePagination<T>(data: T[], itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(itemsPerPage)

  const totalPages = Math.max(1, Math.ceil(data.length / perPage))
  const safePage = Math.min(currentPage, totalPages)

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * perPage
    return data.slice(start, start + perPage)
  }, [data, safePage, perPage])

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const changePerPage = (n: number) => {
    setPerPage(n)
    setCurrentPage(1)
  }

  return {
    currentPage: safePage,
    totalPages,
    perPage,
    paginatedData,
    goToPage,
    changePerPage,
    setCurrentPage: goToPage,
  }
}
