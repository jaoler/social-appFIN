import {AppBskyActorDefs, AppBskyGraphGetList} from '@atproto/api'
import {
  InfiniteData,
  QueryClient,
  QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'

const PAGE_SIZE = 30
type RQPageParam = string | undefined

const RQKEY_ROOT = 'list-members'
export const RQKEY = (uri: string) => [RQKEY_ROOT, uri]

export function useListMembersQuery(uri: string) {
  const {getAgent} = useAgent()
  return useInfiniteQuery<
    AppBskyGraphGetList.OutputSchema,
    Error,
    InfiniteData<AppBskyGraphGetList.OutputSchema>,
    QueryKey,
    RQPageParam
  >({
    staleTime: STALE.MINUTES.ONE,
    queryKey: RQKEY(uri),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      const res = await getAgent().app.bsky.graph.getList({
        list: uri,
        limit: PAGE_SIZE,
        cursor: pageParam,
      })
      return res.data
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
  })
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<AppBskyActorDefs.ProfileView, void> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<AppBskyGraphGetList.OutputSchema>
  >({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData) {
      continue
    }
    for (const [_queryKey, queryData] of queryDatas) {
      if (!queryData?.pages) {
        continue
      }
      for (const page of queryData?.pages) {
        if (page.list.creator.did === did) {
          yield page.list.creator
        }
        for (const item of page.items) {
          if (item.subject.did === did) {
            yield item.subject
          }
        }
      }
    }
  }
}
