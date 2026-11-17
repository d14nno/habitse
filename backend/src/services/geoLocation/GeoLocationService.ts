export interface GeoLocationData {
  city: string | null
  region: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
}

export interface GeoLocationService {
  /**
   * Retorna dados de geolocalização a partir de um endereço IP.
   *
   * @param ipAddress - Endereço IP.
   * @returns Dados de cidade, região, país, latitude e longitude.
   */
  getGeoData(ipAddress?: string): Promise<GeoLocationData>
}