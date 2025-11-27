import dbUtils from '../../db'
import { getServerUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const { currPassword, newPassword } = await readBody(event)
  const session = await getServerUser(event)
  // console.log("当前登录用户:",session)
  return await changePassword(session.userId, currPassword, newPassword)
})

const changePassword = async (userId: number, currPassword: string, newPassword: string) => {
  const cnt = dbUtils.common.get('SELECT count(1) cnt FROM admin_user WHERE id = ? and password = ?', [userId, currPassword])
  if (cnt?.cnt == 0) {
    return {
      success: false,
      err: '原密码错误',
      data: null
    }
  }
  dbUtils.common.run('UPDATE admin_user SET password = ? WHERE id=?', [newPassword, userId])
  return {
    success: true,
    err: '',
    data: null
  }
}
