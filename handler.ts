import DynamoDbConnector from './src/db/dynamoDbConnector';
import { FuelScraper } from './src/fuelScraper';
import { LambdaResponse } from './src/model/lambdaResponse';
import { StationData } from './src/model/station';
import { v4 as uuidv4, v4 } from 'uuid';

const url = 'https://www.polttoaine.net';
const fuelScraper = new FuelScraper(url);
const dynamoDbTable = process.env.DYNAMODB_TABLE ?? 'local';

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

const saveStation = async (event: any, _context: any, _callback: any): Promise<LambdaResponse> => {
  try {
    const coordinates = await fuelScraper.getCoordinatesFromMap(event.link);
    const id = event.id ?? v4();
    const stationData = {
      ...event,
      id,
      coordinates
    } as StationData;
    console.log('station: ', stationData);
    const dbConnector = new DynamoDbConnector(dynamoDbTable);
    const result = await dbConnector.saveStationToDb(stationData);
    if (result) {
      return {
        statusCode: 200,
        body: JSON.stringify('success')
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify('Failure to save into db')
      };
    }
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify('Error occured')
    };
  }
};

export { getLocations, getLocationPrices, saveStation };
