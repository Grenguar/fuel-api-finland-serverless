import { FuelScraper } from './src/fuelScraper'

interface LambdaResponse {
  statusCode: number
  body: string
}
const url = 'https://www.polttoaine.net/'
const fuelScraper = new FuelScraper(url)

const getLocations = async (event: any, context: any, callback: any) => {
  try {
    const cityLocations = await fuelScraper.getCityNames()
    const response: LambdaResponse = {
      statusCode: 200,
      body: JSON.stringify(cityLocations)
    }
    callback(null, response)
  } catch (err) {
    console.error(err)
    const response: LambdaResponse = {
      statusCode: 200,
      body: JSON.stringify('Error occured')
    }
    callback(null, response)
  }
}

export { getLocations }
