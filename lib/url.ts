import qs from "query-string"

interface UrlQueryParams {
  params: string
  key: string
  value: string
}

interface RemoveUrlQueryParams {
  params: string
  keysToRemove: string[]
}

// Updates URL with new query params
export const formUrlQuery = ({ params, key, value }: UrlQueryParams) => {
  const queryString = qs.parse(params)

  queryString[key] = value

  return qs.stringifyUrl({
    url: window.location.pathname,
    query: queryString,
  })
}

// Updates URL with new query params
export const removeKeysFromUrlQuery = ({
  params,
  keysToRemove,
}: RemoveUrlQueryParams) => {
  const queryString = qs.parse(params)

  keysToRemove.forEach((key) => delete queryString[key])

  return qs.stringifyUrl(
    {
      url: window.location.pathname,
      query: queryString,
    },
    { skipNull: true },
  )
}
