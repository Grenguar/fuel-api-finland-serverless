import * as cheerio from 'cheerio';
import axios from 'axios';
import { CityLocations } from './model/cityLocations';
import { LocationStations, StationData } from './model/station';

export class FuelScraper {
  readonly url: string;

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Returns all locations
   */
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

  /**
   * Returns all stations and prices for location
   * @param location location from the response of getLocationNames
   */
  public async getGasStationsForLocation(
    location: string
  ): Promise<LocationStations> {
    const url = `${this.url}/${location}`;
    const res = await axios.get(url);
    const htmlBody = res.data;
    const cheerioStatic = cheerio.load(htmlBody);
    const priceTable = cheerioStatic('#Hinnat').find('.e10');
    const stationsRows = priceTable.find('.E10');
    const currentYear = new Date().getFullYear();
    const stations = [];
    stationsRows.each((_i: number, element: cheerio.Element) => {
      const station = this.parseStationRow(cheerioStatic, element, currentYear);
      stations.push(station);
    });
    return {
      location,
      stations
    };
  }

  private parseStationRow(
    cheerioStatic: cheerio.Root,
    element: cheerio.Element,
    currentYear: number
  ): StationData {
    const currentRow = cheerioStatic(element);
    const rawDate = currentRow.find('.PvmTD');
    const updated = `${rawDate.text()}${currentYear}`;
    const linkObj = currentRow.find('td > a');
    let link = linkObj.attr('href');
    let station = '-';
    if (link) {
      station = linkObj[0].next.data;
    } else {
      station = currentRow.find('td')[0].children[0].data;
      link = '-';
    }
    const id = this.getStationId(link);
    const allPricesEL = currentRow.find('.Hinnat');
    const ninetyFive = allPricesEL[0].children[0].data;
    const ninetyEight = allPricesEL[1].children[0].data;
    const diesel = allPricesEL[2].children[0].data;
    const st = {
      id,
      station,
      updated,
      link,
      ninetyFive,
      ninetyEight,
      diesel
    };
    return st;
  }

  private getStationId(mapLink: string): string {
    return typeof mapLink === 'undefined' ? '-' : mapLink.split('id=')[1];
  }

  private isValidLocation(loc: string): boolean {
    if (loc) {
      const regExpWay = /[\w-]*tie[\w-]*/g;
      return !regExpWay.test(loc);
    } else {
      return false;
    }
  }
}
