import axios from 'axios'

import { logger } from '@shared/infra/logger'
import { GeoLocationData, GeoLocationService } from '../GeoLocationService'

const EMPTY: GeoLocationData = { city: null, region: null, country: null, latitude: null, longitude: null }

/** Ignora IPs locais/privados (não há o que consultar) */
const isPrivateIp = (ip: string) => /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1|localhost)/.test(ip)

/**
 * Geolocalização aproximada pelo IP (registrada junto da sessão) usando a API pública ipapi.is.
 */
export class IpApiGeoLocationService implements GeoLocationService {
    async getGeoData(ipAddress?: string): Promise<GeoLocationData> {
        if (!ipAddress || isPrivateIp(ipAddress)) return EMPTY

        try {
            const { data } = await axios.get('https://api.ipapi.is/', { params: { q: ipAddress }, timeout: 2000 })

            return {
                city: data.location?.city ?? null,
                region: data.location?.region?.name ?? null,
                country: data.location?.country?.name ?? null,
                latitude: data.location?.latitude ?? null,
                longitude: data.location?.longitude ?? null
            }
        } catch (error) {
            logger.debug({ err: error, ipAddress }, 'GeoIP lookup failed')
            return EMPTY
        }
    }
}
