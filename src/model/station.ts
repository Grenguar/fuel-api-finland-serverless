export interface StationData {
  id: string;
  station: string;
  updated: string;
  link: string;
  ninetyFive: string;
  ninetyEight: string;
  diesel: string;
}

export interface LocationStations {
  location: string;
  stations: StationData[];
}
