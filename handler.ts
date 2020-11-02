import { FuelScraper } from './src/fuelScraper';
import { LambdaResponse } from './src/model/lambdaResponse';

const url = 'https://www.polttoaine.net';
const fuelScraper = new FuelScraper(url);

const getLocations = async (_event: any, _context: any, _callback: any): Promise<LambdaResponse> => {
  try {
    const cityLocations = await fuelScraper.getLocationNames();
    return {
      statusCode: 200,
      body: JSON.stringify(cityLocations)
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 200,
      body: JSON.stringify('Error occured')
    };
  }
};

const getLocationPrices = async (event: any, _context: any, _callback: any): Promise<LambdaResponse> => {
  try {
    const locationName = event.pathParameters.name;
    const stationsForLocation = await fuelScraper.getGasStationsForLocation(locationName);
    return {
      statusCode: 200,
      body: JSON.stringify(stationsForLocation)
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 200,
      body: JSON.stringify('Error occured')
    };
  }
};

export { getLocations, getLocationPrices };
