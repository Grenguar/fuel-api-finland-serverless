import * as cheerio from 'cheerio';
import axios, { AxiosResponse } from 'axios';
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
    const stationsWithoutCoords = [];
    const stationsMapForCoords = new Map<number, StationData>();
    stationsRows.each((_i: number, element: cheerio.Element) => {
      const station = this.parseStationRow(cheerioStatic, element, currentYear);
      if (typeof station.id === 'number') {
        stationsMapForCoords.set(station.id, station);
      } else {
        stationsWithoutCoords.push(station);
      }
      stations.push(station);
    });
    return {
      location: decodedLocation,
      stations
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

  private async updateStationsWithCoordinates(stationsMap: Map<number, StationData>): Promise<StationData[]> {
    const updatedMap = stationsMap;
    const stationLinks = [...stationsMap.values()].map((st) => st.link.toString());
    const promises = stationLinks.map((link) => this.getCoordinatesFromMap(link));
    const updatedStations = await Promise.all(promises);
    return [...updatedMap.values()];
  }

  private getStationId(mapLink: string): string | number {
    return typeof mapLink === 'undefined' ? '-' : Number(mapLink.split('id=')[1]);
  }

  private parseStationWithLink(linkObj: cheerio.Cheerio, currentRow: cheerio.Cheerio) {
    let link = linkObj.attr('href');
    let station = '-';
    if (link) {
      station = linkObj[0].next.data.replace('(', '');
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

  private async getCoordinatesFromMap(mapLink: string): Promise<SimpleCoordinates> {
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
      latitude: coordsArray[0],
      longitude: coordsArray[1]
    };
  }
}
