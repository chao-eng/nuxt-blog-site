import type { Result } from '~/types'
import dbUtils from '../../db'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    return await saveProfile(event.context.user.userId, body)
  } catch (error: any) {
    return {
      success: false,
      err: error.message,
      data: undefined
    }
  }
})

const saveProfile = async (userId: number, body: any): Promise<Result<undefined>> => {
  dbUtils.common.run('UPDATE admin_user SET username=?, name = ?,email = ?,avatar=?,bio = ? WHERE id = ?', [body.username, body.name, body.email, body.avatar, body.bio, userId])
  return {
    success: true,
    err: '',
    data: undefined
  }
}
