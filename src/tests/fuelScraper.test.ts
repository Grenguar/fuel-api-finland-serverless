import { FuelScraper } from '../fuelScraper';
import axios from 'axios';
import * as moxios from 'moxios';
import { readFileSync } from 'fs';
import path = require('path');

const url = 'https://www.fuel.net';
const fuelScraper = new FuelScraper(url);
const mainPage = readFileSync(path.join(__dirname, './fixtures/main.html'), 'utf-8');
const imatraPage = readFileSync(path.join(__dirname, './fixtures/imatra.html'), 'utf-8');

describe('FuelScraper tests', () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it('getLocationNames(): should get all locations', async () => {
    moxios.stubRequest(/.*/, {
      status: 200,
      responseText: mainPage
    });
    const locations = await fuelScraper.getLocationNames();
    expect(locations.locations.length).toBeGreaterThan(0);
    expect(locations.locations).toContain('Helsinki');
    expect(locations.locations).toContain('Espoo');
    expect(locations.locations).toContain('Tampere');
  });

  it('should get all stations for locations', async () => {
    moxios.stubRequest(/Imatra.*/, {
      status: 200,
      responseText: imatraPage
    });
    const stations = await fuelScraper.getGasStationsForLocation('Imatra');
    expect(stations.stations.length).toBe(3);
  });
});
