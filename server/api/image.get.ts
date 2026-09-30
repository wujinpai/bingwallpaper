interface ImageQuery {
  mkt: string
  date: string
}

export default defineEventHandler(
  async (event) => {
    const query = getQuery<ImageQuery>(event)

    const market = useValidMarket(event)
    const date = query.date ? parseDateInput(query.date) : getDateWithMarketOffset(market.offset)

    const image = await getCachedImageFromStorage(toDateKey(date), market.lang)

    if (!image)
      throw createError({ statusCode: 404, message: 'Image not found' })

    return image
  },
)