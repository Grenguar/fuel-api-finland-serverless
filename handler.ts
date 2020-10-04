import { FuelScraper } from './src/fuelScraper';
import { LambdaResponse } from './src/model/lambdaResponse';

const url = 'https://www.polttoaine.net';
const fuelScraper = new FuelScraper(url);

const getLocations = async (event: any, context: any, callback: any) => {
  try {
    const cityLocations = await fuelScraper.getLocationNames();
    const response: LambdaResponse = {
      statusCode: 200,
      body: JSON.stringify(cityLocations)
    };
    callback(null, response);
  } catch (err) {
    console.error(err);
    const response: LambdaResponse = {
      statusCode: 200,
      body: JSON.stringify('Error occured')
    };
    callback(null, response);
  }
};

const getLocationPrices = async (event: any, _context: any, callback: any) => {
  const locationName = event.pathParameters.name;
  const stationsForLocation = await fuelScraper.getGasStationsForLocation(
    locationName
  );
  console.log(stationsForLocation);
  const response: LambdaResponse = {
    statusCode: 200,
    body: JSON.stringify(stationsForLocation)
  };
  callback(null, response);
};

export { getLocations, getLocationPrices };
