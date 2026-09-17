import topology from "world-atlas/countries-110m.json";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import { displayName } from "@/lib/countries";

export type CountryProps = { name: string };
export type CountryFeature = Feature<Geometry, CountryProps>;

const topo = topology as Topology<{ countries: GeometryCollection<CountryProps> }>;

export const worldCountries = feature(
  topo,
  topo.objects.countries,
) as FeatureCollection<Geometry, CountryProps>;

export function countryId(feature: CountryFeature): string {
  if (feature.id !== undefined && feature.id !== null && String(feature.id).length > 0) {
    return String(feature.id).padStart(3, "0");
  }
  return `n:${feature.properties.name}`;
}

export const COUNTRY_NAMES: Record<string, string> = {};
for (const f of worldCountries.features) {
  const id = countryId(f);
  COUNTRY_NAMES[id] = displayName(id, f.properties.name);
}

export function countryName(id: string): string {
  return COUNTRY_NAMES[id] ?? id;
}
