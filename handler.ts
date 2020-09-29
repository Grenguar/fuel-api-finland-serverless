import { FuelScraper } from './src/fuelScraper';
import { LambdaResponse } from './src/model/lambdaResponse';

const url = 'https://www.polttoaine.net/';
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

const getLocationPrices = (event: any, context: any, callback: any) => {
  console.log(event, 'event:');
  console.log(context, 'event:');
  const locationName = event.pathParameters.name;
  const response: LambdaResponse = {
    statusCode: 200,
    body: JSON.stringify(`Hello from ${locationName}`)
  };
  callback(null, response);
};

export { getLocations, getLocationPrices };
