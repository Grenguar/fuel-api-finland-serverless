import { Handler, Context, Callback } from "aws-lambda";
import { FuelScraper } from "./fuleScraper";

interface HelloResponse {
  statusCode: number;
  body: string;
}
const fuelScraper = new FuelScraper("https://www.polttoaine.net/");

const getLocations: Handler = async (
  event: any,
  context: Context,
  callback: Callback
) => {
  const cityLocations = await fuelScraper.getCityNames();
  const response: HelloResponse = {
    statusCode: 200,
    body: JSON.stringify(cityLocations),
  };

  callback(null, response);
};

export { getLocations };
