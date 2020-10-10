import { SimpleCoordinates } from './simpleCoords';

export interface StationData {
  id?: string | number;
  station: string;
  updated?: string;
  link?: string;
  ninetyFive: string;
  ninetyEight: string;
  diesel: string;
  coordinates?: SimpleCoordinates;
}

export interface LocationStations {
  location: string;
  stations: StationData[];
}
