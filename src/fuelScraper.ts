import * as cheerio from 'cheerio';
import axios from 'axios';

export class FuelScraper {
  url: string;

  constructor(url: string) {
    this.url = url;
  }

  public async getLocationNames(): Promise<CityLocations> {
    const locations: string[] = [];
    const response = await axios.get(this.url);
    const cheerioStatic: cheerio.Root = cheerio.load(response.data as string);
    cheerioStatic('select')
      .find('option')
      .map((_index: number, element: cheerio.Element) => {
        let location: string = element.attribs['value'];
        if (this.isValidLocation(location)) {
          locations.push(location);
        }
      });
    return { locations };
  }

  private isValidLocation(loc: string): boolean {
    if (loc === undefined) {
      return false;
    } else {
      const regExpWay = /[\w-]*tie[\w-]*/g;
      return !regExpWay.test(loc);
    }
  }
}

export interface CityLocations {
  locations: string[];
}
