import { keyBy, chunk, sortBy } from 'lodash'
import { useEffect } from 'react'
import { Row } from 'common/supabase/utils'
import { usePersistentInMemoryState } from 'web/hooks/use-persistent-in-memory-state'
import { db } from 'web/lib/supabase/db'
import { getUsers } from 'web/lib/supabase/user'
import { User } from 'common/user'
import { filterDefined } from 'common/util/array'
import { Lover } from 'common/love/lover'
import { api } from 'web/lib/firebase/api'
import { API } from 'common/api/schema'
import { useLoverByUserId } from './use-lover'
import { getLoversCompatibilityFactor } from 'common/love/compatibility-score'

export const useLovers = () => {
  const [lovers, setLovers] = usePersistentInMemoryState<
    (Row<'lovers'> & { user: User })[] | undefined
  >(undefined, 'lovers')

  useEffect(() => {
    db.from('lovers')
      .select('*')
      .filter('looking_for_matches', 'eq', true)
      .order('created_time', { ascending: false })
      .neq('pinned_url', null)
      .then(async ({ data }) => {
        if (!data) return
        const userChunks = chunk(data, 250)
        const newLovers: Lover[] = []
        await Promise.all(
          userChunks.map(async (chunk) =>
            getUsers(chunk.map((d) => d.user_id)).then((users) => {
              const usersById = keyBy(users, 'id')
              const dataWithUser = data.map((d) => {
                const user = usersById[d.user_id]
                if (!user || user.isBannedFromPosting) return undefined
                return { ...d, user }
              })
              newLovers.push(...filterDefined(dataWithUser))
            })
          )
        )
        setLovers(newLovers)
      })
  }, [])

  return lovers
}

export const useCompatibleLovers = (
  userId: string | null | undefined,
  options?: { sortWithLocationPenalty?: boolean }
) => {
  const [data, setData] = usePersistentInMemoryState<
    (typeof API)['compatible-lovers']['returns'] | undefined | null
  >(undefined, `compatible-lovers-${userId}`)

  const lover = useLoverByUserId(userId ?? undefined)

  useEffect(() => {
    if (userId) {
      api('compatible-lovers', { userId })
        .then((result) => {
          const { compatibleLovers, loverCompatibilityScores } = result
          if (options?.sortWithLocationPenalty) {
            result.compatibleLovers = sortBy(compatibleLovers, (l) => {
              const modifier = !lover
                ? 1
                : getLoversCompatibilityFactor(lover, l)
              return modifier * loverCompatibilityScores[l.user.id].score
            }).reverse()
          }
          setData(result)
        })
        .catch((e) => {
          if (e.code === 404) {
            setData(null)
          } else {
            throw e
          }
        })
    } else if (userId === null) setData(null)
  }, [userId])

  return data
}
