import { reactive } from 'vue';
import GeoJSON from 'geojson';
import project from '../package.json';
import data from '../data/data.json';
import * as turf from '@turf/turf';

const source = turf.featureCollection(
  data.map((x: any) =>
    turf.point([x.Longitude, x.Latitude], { name: x['Sorting form'], id: x['IDPl'], info: x['Note'] })
  )
);

const state = reactive({
  token: localStorage.getItem('token') || '',
});

export default {
  state,
  source,
};
