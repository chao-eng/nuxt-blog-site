import dbUtils from '../../db'

export default defineEventHandler(async (event) => {
    const shortId = getRouterParam(event, 'shortId')
    if (!shortId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing shortId'
        })
    }

    const article = dbUtils.article.getArticleByShortId(shortId)
    if (!article) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Article not found'
        })
    }

    return {
        success: true,
        data: {
            path: article.path
        }
    }
})
