import { DynamoDB } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { StationData } from '../model/station';

export default class DynamoDbConnector {
  private _client: DocumentClient;
  private tableName: string;

  constructor(tableName: string) {
    let options = {};
    this._client = new DynamoDB.DocumentClient(options);
    this.tableName = tableName;
  }

  public async saveStationToDb(stationData: StationData): Promise<boolean> {
    const { id, station, updated, link, ninetyFive, ninetyEight, diesel, coordinates } = stationData;
    const params = {
      TableName: this.tableName,
      Item: {
        id,
        name: station,
        updated,
        link,
        ninetyFive,
        ninetyEight,
        diesel,
        ...(coordinates && {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        })
      }
    };
    await this._client
      .put(params, (error) => {
        if (error) {
          console.error(error);
          return false;
        }
      })
      .promise();
    return true;
  }
}
