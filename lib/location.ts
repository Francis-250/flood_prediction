import rawData from "./data.json";

export interface ProvinceDistricts {
  province: string;
  districts: string[];
}

export interface DistrictInfo {
  name: string;
  province: string;
  sectors: string[];
  cells: string[];
}

type LocationDataType = Record<string, Record<string, Record<string, Record<string, string[]>>>>;

const data = rawData as LocationDataType;

/**
 * Returns list of all provinces in Rwanda.
 */
export function getProvinces(): string[] {
  return Object.keys(data);
}

/**
 * Returns list of districts grouped by province.
 */
export function getProvincesWithDistricts(): ProvinceDistricts[] {
  return Object.entries(data).map(([province, districtsObj]) => ({
    province,
    districts: Object.keys(districtsObj),
  }));
}

/**
 * Returns flat list of all district names in Rwanda.
 */
export function getAllDistrictNames(): string[] {
  const districts: string[] = [];
  for (const provinceObj of Object.values(data)) {
    for (const districtName of Object.keys(provinceObj)) {
      districts.push(districtName);
    }
  }
  return districts.sort();
}

/**
 * Returns detail info (province, sectors, cells) for a specific district.
 */
export function getDistrictInfo(districtName: string): DistrictInfo | null {
  for (const [province, districtsObj] of Object.entries(data)) {
    if (districtsObj[districtName]) {
      const sectorsObj = districtsObj[districtName];
      const sectors = Object.keys(sectorsObj);
      const cellsSet = new Set<string>();

      for (const sectorName of sectors) {
        const cellsObj = sectorsObj[sectorName];
        if (cellsObj) {
          for (const cellName of Object.keys(cellsObj)) {
            cellsSet.add(cellName);
          }
        }
      }

      return {
        name: districtName,
        province,
        sectors,
        cells: Array.from(cellsSet).sort(),
      };
    }
  }
  return null;
}

/**
 * Returns all districts with their associated province.
 */
export function getAllDistrictsWithProvince(): { name: string; province: string }[] {
  const result: { name: string; province: string }[] = [];
  for (const [province, districtsObj] of Object.entries(data)) {
    for (const districtName of Object.keys(districtsObj)) {
      result.push({ name: districtName, province });
    }
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}
