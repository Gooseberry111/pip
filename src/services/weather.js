// Real weather on the farm, from Open-Meteo (free, no account, no key).
// Off until you turn it on. Only a rough location is kept (rounded to about 10 km), on this
// device, and it's only sent to Open-Meteo to ask for the weather.
import { ref, computed } from 'vue'
import { getRoughLocation } from './native'
import { getSeason } from '@/utils/timeOfDay'

const KEY = 'pip:weather:v1'
const FRESH = 30 * 60 * 1000

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {}
  } catch {
    return {}
  }
}
function write(v) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v))
  } catch {
    // ignore
  }
}

const saved = read()
export const weatherOn = ref(Boolean(saved.on))
const place = ref(saved.place ?? null) // { lat, lon }
const current = ref(saved.current ?? null) // { kind, temp, code, at }

// time zones south of the equator, for guessing the season before we know where you are
const SOUTH = /^(Australia|Antarctica|Pacific\/(Auckland|Chatham|Fiji|Tongatapu|Apia|Noumea)|America\/(Argentina|Santiago|Sao_Paulo|Montevideo|Asuncion|La_Paz|Lima)|Africa\/(Johannesburg|Maputo|Harare|Lusaka|Windhoek|Gaborone|Maseru|Mbabane|Blantyre|Lubumbashi)|Indian\/(Mauritius|Reunion|Antananarivo))/
function southern() {
  if (place.value) return place.value.lat < 0
  try {
    return SOUTH.test(Intl.DateTimeFormat().resolvedOptions().timeZone)
  } catch {
    return false
  }
}

export const season = computed(() => getSeason(new Date(), southern()))

/** clear | cloudy | rain | snow | storm | fog, from Open-Meteo's weather codes. */
export function kindOf(code) {
  if (code <= 1) return 'clear'
  if (code <= 3) return 'cloudy'
  if (code === 45 || code === 48) return 'fog'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if (code >= 95) return 'storm'
  return 'rain'
}

export const WEATHER = {
  clear: { name: 'Clear', icon: 'sun' },
  cloudy: { name: 'Cloudy', icon: 'cloud' },
  fog: { name: 'Misty', icon: 'cloud' },
  rain: { name: 'Raining', icon: 'rain' },
  storm: { name: 'Stormy', icon: 'rain' },
  snow: { name: 'Snowing', icon: 'snow' },
}

export const weather = computed(() => (weatherOn.value && current.value ? current.value : null))

let inflight = null
export async function refreshWeather(force = false) {
  if (!weatherOn.value || !place.value) return weather.value
  if (!force && current.value && Date.now() - current.value.at < FRESH) return current.value
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const { lat, lon } = place.value
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`
      const res = await fetch(url)
      if (!res.ok) throw new Error(String(res.status))
      const data = await res.json()
      const code = Number(data.current?.weather_code ?? 0)
      current.value = { kind: kindOf(code), code, temp: Math.round(Number(data.current?.temperature_2m ?? 0)), at: Date.now() }
      write({ on: true, place: place.value, current: current.value })
    } catch {
      // offline or the service is busy: keep the last reading
    } finally {
      inflight = null
    }
    return current.value
  })()
  return inflight
}

/** Turn real weather on (asks for a rough location) or off (forgets it). */
export async function setWeatherOn(on) {
  if (!on) {
    weatherOn.value = false
    place.value = null
    current.value = null
    write({})
    return { ok: true }
  }
  try {
    const { lat, lon } = await getRoughLocation()
    place.value = { lat: Math.round(lat * 10) / 10, lon: Math.round(lon * 10) / 10 }
    weatherOn.value = true
    write({ on: true, place: place.value })
    await refreshWeather(true)
    return { ok: true }
  } catch {
    return { ok: false }
  }
}
