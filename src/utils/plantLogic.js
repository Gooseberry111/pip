// Pure plant rules. No Vue, no storage: functions in, values out.
// This keeps Pip's "biology" easy to test and reuse (e.g. on a server later).

import { GROWTH_STAGES, MAX_LEVEL } from '@/data/growthStages'

export const HOUR = 60 * 60 * 1000

export const WATER = {
  max: 100,
  pour: 35, // added per watering
  fullAbove: 92, // Pip politely declines water above this
  decayPerHour: 100 / 36, // a full Pip empties in ~1.5 days
}

export const HEALTH = {
  healthy: 'healthy',
  thirsty: 'thirsty',
  wilting: 'wilting',
}

const THIRSTY_BELOW = 55
const WILTING_BELOW = 20

const GROWTH = {
  perAbsorbedWater: 0.6, // growth points per unit of water Pip actually drinks
  passivePerHour: { healthy: 1.5, thirsty: 0.6, wilting: 0 },
  simulationStepHours: 1 / 6,
  maxSimulatedHours: 24 * 14,
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function getHealth(waterLevel) {
  if (waterLevel < WILTING_BELOW) return HEALTH.wilting
  if (waterLevel < THIRSTY_BELOW) return HEALTH.thirsty
  return HEALTH.healthy
}

/** How droopy Pip looks, 0 (upright) to 1 (tired). Smooth, so leaves sag gradually. */
export function getDroop(waterLevel) {
  if (waterLevel >= 70) return 0
  if (waterLevel >= THIRSTY_BELOW) return ((70 - waterLevel) / (70 - THIRSTY_BELOW)) * 0.25
  if (waterLevel >= WILTING_BELOW) return 0.25 + ((THIRSTY_BELOW - waterLevel) / (THIRSTY_BELOW - WILTING_BELOW)) * 0.45
  return 0.7 + ((WILTING_BELOW - waterLevel) / WILTING_BELOW) * 0.3
}

/** Growth points needed to finish a level. */
export function requiredForLevel(level) {
  return 40 + level * 20
}

export function isMaxLevel(level) {
  return level >= MAX_LEVEL
}

export function getStageIndex(level) {
  let index = 0
  GROWTH_STAGES.forEach((stage, i) => {
    if (level >= stage.fromLevel) index = i
  })
  return index
}

export function getStage(level) {
  return GROWTH_STAGES[getStageIndex(level)]
}

export function getNextStage(level) {
  return GROWTH_STAGES[getStageIndex(level) + 1] ?? null
}

/**
 * A continuous "how grown" value used for drawing Pip: the stage index plus a little
 * extra as Pip moves through the levels inside that stage, so every level is visible.
 */
export function getGrowthValue(level, progress) {
  const stageIndex = getStageIndex(level)
  const stage = GROWTH_STAGES[stageIndex]
  const next = GROWTH_STAGES[stageIndex + 1]
  const levelFraction = isMaxLevel(level) ? 1 : clamp(progress / requiredForLevel(level), 0, 1)
  if (!next) return stageIndex + Math.min(0.3, (level - stage.fromLevel + levelFraction) * 0.15)
  const levelsInStage = next.fromLevel - stage.fromLevel
  const fraction = (level - stage.fromLevel + levelFraction) / levelsInStage
  return stageIndex + fraction * 0.35
}

/** Percentage through the current level, 0-100. */
export function getLevelPercent(level, progress) {
  if (isMaxLevel(level)) return 100
  return Math.floor(clamp((progress / requiredForLevel(level)) * 100, 0, 100))
}

/** Percentage of the way to the next stage, 0-100. */
export function getStagePercent(level, progress) {
  const index = getStageIndex(level)
  const stage = GROWTH_STAGES[index]
  const next = GROWTH_STAGES[index + 1]
  if (!next) return 100
  const levelFraction = clamp(progress / requiredForLevel(level), 0, 1)
  return Math.floor(((level - stage.fromLevel + levelFraction) / (next.fromLevel - stage.fromLevel)) * 100)
}

/** Hours until Pip gets thirsty from a given water level (0 if already thirsty). */
export function hoursUntilThirsty(waterLevel) {
  return Math.max(0, (waterLevel - THIRSTY_BELOW) / WATER.decayPerHour)
}

/** Pour water. Returns the new water level and how much Pip actually drank. */
export function pourWater(waterLevel, amount = WATER.pour) {
  if (waterLevel >= WATER.fullAbove) return { waterLevel, absorbed: 0 }
  const next = Math.min(WATER.max, waterLevel + amount)
  return { waterLevel: next, absorbed: next - waterLevel }
}

export function growthFromWatering(absorbed) {
  return absorbed * GROWTH.perAbsorbedWater
}

/** Add growth points, rolling over into new levels. */
export function applyGrowth(level, progress, gain) {
  let nextLevel = level
  let nextProgress = progress + gain
  const levelsGained = []
  while (!isMaxLevel(nextLevel) && nextProgress >= requiredForLevel(nextLevel)) {
    nextProgress -= requiredForLevel(nextLevel)
    nextLevel += 1
    levelsGained.push(nextLevel)
  }
  if (isMaxLevel(nextLevel)) nextProgress = 0
  return { level: nextLevel, progress: nextProgress, levelsGained }
}

/**
 * Let time pass. Water evaporates and Pip grows a little on its own while it has water.
 * Simulated in small steps so growth slows naturally as Pip gets thirsty.
 */
export function simulateTime(waterLevel, elapsedMs) {
  let hours = clamp(elapsedMs / HOUR, 0, GROWTH.maxSimulatedHours)
  let water = waterLevel
  let growthGain = 0
  while (hours > 0) {
    const step = Math.min(GROWTH.simulationStepHours, hours)
    growthGain += GROWTH.passivePerHour[getHealth(water)] * step
    water = Math.max(0, water - WATER.decayPerHour * step)
    hours -= step
  }
  return { waterLevel: water, growthGain }
}
