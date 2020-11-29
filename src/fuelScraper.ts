import * as cheerio from 'cheerio';
import axios from 'axios';
import { CityLocations } from './model/cityLocations';
import { LocationStations, StationData } from './model/station';
import { SimpleCoordinates } from './model/simpleCoords';

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
    const response = await axios.request({
      method: 'GET',
      url: this.url,
      responseType: 'arraybuffer',
      reponseEncoding: 'binary' // this key is missing from typescript definitions
    } as object);
    const decodedHtmlBody = response.data.toString('latin1');
    const cheerioStatic: cheerio.Root = cheerio.load(decodedHtmlBody);
    cheerioStatic('select[name=kaupunki]')
      .find('option')
      .each((_index: number, element: cheerio.Element) => {
        let location: string = element.children[0].data;
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
  public async getGasStationsForLocation(location: string): Promise<LocationStations> {
    const decodedLocation = decodeURIComponent(location);
    const url = `${this.url}/${decodedLocation}`;
    const response = await axios.request({
      method: 'GET',
      url,
      responseType: 'arraybuffer',
      reponseEncoding: 'binary' // this key is missing from typescript definitions
    } as object);
    const decodedHtmlBody = response.data.toString('latin1');
    const cheerioStatic = cheerio.load(decodedHtmlBody);
    const priceTable = cheerioStatic('#Hinnat').find('.e10');
    const stationsRows = priceTable.find('.E10');
    const currentYear = new Date().getFullYear();
    const stations = [];
    stationsRows.each((_i: number, element: cheerio.Element) => {
      const station = this.parseStationRow(cheerioStatic, element, currentYear);
      stations.push(station);
    });
    return {
      location: decodedLocation,
      stations
    };
  }

  public async getCoordinatesFromMap(mapLink: string): Promise<SimpleCoordinates> {
    if (mapLink === '-') {
      return undefined;
    }
    const response = await axios.request({
      method: 'GET',
      url: `${this.url}/${mapLink}`,
      responseType: 'text'
    });
    const cheerioStatic: cheerio.Root = cheerio.load(response.data);
    const jsObject = cheerioStatic('.centerCol').find('script').attr('type', 'text/javascript');
    const scriptText = jsObject[3].children[0].data;
    const coordsArray = scriptText
      .split(/google.maps.LatLng/)[1]
      .match(/\(([^)]+)\)/)[1]
      .split(', ');
    return {
      id: '',
      latitude: coordsArray[0],
      longitude: coordsArray[1]
    };
  }

  private parseStationRow(cheerioStatic: cheerio.Root, element: cheerio.Element, currentYear: number): StationData {
    const currentRow = cheerioStatic(element);
    const rawDate = currentRow.find('.PvmTD');
    const updated = `${rawDate.text()}${currentYear}`;
    const linkObj = currentRow.find('td > a');
    let { station, link } = this.parseStationWithLink(linkObj, currentRow);
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

  private parseStationWithLink(linkObj: cheerio.Cheerio, currentRow: cheerio.Cheerio) {
    let link = linkObj.attr('href');
    let station = '-';
    if (link) {
      station = linkObj[0].next.data.replace('(', '').trim();
    } else {
      station = currentRow.find('td')[0].children[0].data;
      link = '-';
    }
    return { station, link };
  }

  private isValidLocation(loc: string): boolean {
    if (loc) {
      const regExpWay = /[\w-]*[Tt]ie[\w-]*/g;
      return !regExpWay.test(loc);
    } else {
      return false;
    }
  }
}
