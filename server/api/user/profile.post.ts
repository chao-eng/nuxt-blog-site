import type { Result } from '~/types'
import dbUtils from '../../db'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    return await saveProfile(event.context.user.userId, body)
  } catch (error) {
    return {
      success: false,
      err: (error as Error).message,
      data: undefined
    }
  }
})

const saveProfile = async (userId: number, body: {
  username: string
  name: string
  email: string
  avatar: string
  bio: string
}): Promise<Result<undefined>> => {
  dbUtils.common.run('UPDATE admin_user SET username=?, name = ?,email = ?,avatar=?,bio = ? WHERE id = ?', [body.username, body.name, body.email, body.avatar, body.bio, userId])
  return {
    success: true,
    err: '',
    data: undefined
  }
}
