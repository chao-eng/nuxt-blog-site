export default defineEventHandler(async (event) => {
  // 清除 cookie（如果使用 cookie 存储 token）
  deleteCookie(event, 'auth.token')
  return { message: '退出成功' }
})
