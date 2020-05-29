import * as cheerio from "cheerio";
import axios from "axios";

export class FuelScraper {
  url: string;

  constructor(url: string) {
    this.url = url;
  }

  public async getCityNames(): Promise<CityLocations> {
    const citiesList: string[] = [];
    const response = await axios.get(this.url);
    const cheerioStatic: CheerioStatic = cheerio.load(<string>response.data);
    cheerioStatic("select")
      .find("option")
      .map(function (_index: number, element: CheerioElement) {
        let cityName: string = element.attribs["value"];
        console.log(element.name);
        if (cityName !== undefined) {
          citiesList.push(cityName);
        }
      });
    return { locations: citiesList };
  }
}

export interface CityLocations {
  locations: string[];
}
