export default defineEventHandler(async (event) => {
  const market = useValidMarket(event)
  const { exclude } = getQuery<{ exclude?: string }>(event)

  const image = await getRandomImage(market, exclude)

  if (!image)
    throw createError({ statusCode: 404, message: 'No image found' })

  return image
})