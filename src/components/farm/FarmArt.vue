<script setup>
// Everything on the farm map, drawn in tile units: one tile is 40 x 40.
// The drawing area is the object's footprint (w x h tiles) plus one tile of sky above it,
// so trees, roofs and windmill sails can rise over the row behind.
import { computed } from 'vue'
import { growthFraction, cropStage, treeById, producerById } from '@/utils/farmLogic'

const props = defineProps({
  type: { type: String, required: true },
  obj: { type: Object, default: () => ({}) },
  now: { type: Number, default: () => Date.now() },
  busy: { type: Boolean, default: false }, // kitchen cooking, producer working
  phase: { type: String, default: 'day' }, // lamps and fires glow after dark
})
const lit = computed(() => props.phase === 'night' || props.phase === 'dusk')

const crop = computed(() => props.obj.crop ?? null)
const stage = computed(() => cropStage(crop.value, props.now))
const wetSoil = computed(() => crop.value?.watered)

const FAMILY = {
  wheat: 'grain', corn: 'corn', sunflower: 'flower', rose: 'flower', lavender: 'flower',
  carrot: 'root', potato: 'root', tomato: 'bush', strawberry: 'bush', blueberry: 'bush', pumpkin: 'vine', watermelon: 'vine',
}
const FRUIT_COLOR = {
  tomato: '#E35D4B', strawberry: '#E5485E', blueberry: '#5B74C9', pumpkin: '#EB8C35', watermelon: '#5FA55A',
  sunflower: '#F4B93B', rose: '#E05A7A', lavender: '#A68BD6', corn: '#F2CB4C', wheat: '#E8C268', carrot: '#EE9447', potato: '#C9A06D',
}
const family = computed(() => FAMILY[crop.value?.id] ?? 'bush')
const fruit = computed(() => FRUIT_COLOR[crop.value?.id] ?? '#E35D4B')

// trees grow in size until their first harvest
const tree = computed(() => treeById[props.type])
const treeRipe = computed(() => props.obj.readyAt && props.now >= props.obj.readyAt)
const treeScale = computed(() => {
  if (props.obj.grown || !props.obj.plantedAt) return 1
  return 0.55 + 0.45 * growthFraction(props.obj.plantedAt, props.obj.readyAt, props.now)
})
const treeBloom = computed(() => !treeRipe.value && props.obj.readyAt && props.obj.readyAt - props.now < (tree.value?.every ?? 60) * 60000 * 0.35)
const TREE_FRUIT = { appletree: '#E35D4B', cherrytree: '#C8314B', orangetree: '#F29A38', peachtree: '#F5AE8C', lemontree: '#F2D04B' }
const TREE_LEAF = { appletree: ['#8DB878', '#6E9E5C'], cherrytree: ['#A9C98C', '#86AD72'], orangetree: ['#7FAF6B', '#5E8E4F'], peachtree: ['#94BC7F', '#719D60'], lemontree: ['#A3C77F', '#7DA65F'] }

const prod = computed(() => producerById[props.type])
const prodReady = computed(() => props.obj.readyAt && props.now >= props.obj.readyAt)
const working = computed(() => props.busy || (props.obj.readyAt && props.now < props.obj.readyAt))
</script>

<template>
  <g>
    <!-- ================= soil plot and crops ================= -->
    <g v-if="type === 'plot'">
      <rect x="1.5" y="3" width="37" height="36" rx="8" fill="#7A5A3F" />
      <rect x="1.5" y="3" width="37" height="33" rx="8" fill="#B98C63" />
      <rect x="4" y="5.5" width="32" height="28" rx="6" :fill="wetSoil ? '#6F4E37' : '#8E6446'" />
      <rect x="4" y="5.5" width="32" height="25" rx="6" :fill="wetSoil ? '#82603F' : '#A77A57'" />
      <g :stroke="wetSoil ? '#6A4932' : '#8E6446'" stroke-width="2.2" stroke-linecap="round" opacity="0.75">
        <path d="M9 12 H31 M9 19 H31 M9 26 H31" />
      </g>
      <g :stroke="wetSoil ? '#9B7754' : '#C49A6C'" stroke-width="1" stroke-linecap="round" opacity="0.6">
        <path d="M9 10.6 H31 M9 17.6 H31 M9 24.6 H31" />
      </g>
      <path d="M6 4.5 H34" stroke="#D9B48A" stroke-width="1.2" stroke-linecap="round" opacity="0.8" />
      <g v-if="wetSoil" fill="#B7D9E8" opacity="0.7"><circle cx="11" cy="29" r="1" /><circle cx="29" cy="14" r="0.9" /><circle cx="22" cy="22" r="0.8" /></g>
      <g v-if="stage === 0" fill="#5B3F2B">
        <circle cx="12" cy="16" r="1.6" /><circle cx="20" cy="24" r="1.6" /><circle cx="28" cy="16" r="1.6" /><circle cx="14" cy="28" r="1.4" /><circle cx="27" cy="28" r="1.4" />
      </g>
      <g v-else-if="stage === 1">
        <g v-for="x in [11, 20, 29]" :key="x" :transform="`translate(${x} ${x === 20 ? 26 : 20})`">
          <path d="M0 4 V-3" stroke="#6E9E5C" stroke-width="1.6" stroke-linecap="round" />
          <path d="M0 -2 C-2 -6 -6 -6 -6 -4 C-5 -1 -2 -1 0 -2Z M0 -3 C2 -7 6 -7 6 -5 C5 -2 2 -2 0 -3Z" fill="#9CC584" />
        </g>
      </g>
      <g v-else-if="stage >= 2" class="sway" :style="{ animationDelay: `${-((obj.uid ?? 0) % 7) * 0.45}s` }">
        <!-- grain: wheat -->
        <g v-if="family === 'grain'">
          <g v-for="(x, i) in [9, 15, 21, 27, 32]" :key="i">
            <path :d="`M${x} 32 Q${x + 1} 18 ${x} ${stage === 3 ? 4 : 10}`" :stroke="stage === 3 ? '#C9A646' : '#8FB86A'" stroke-width="1.6" fill="none" stroke-linecap="round" />
            <ellipse v-if="stage === 3" :cx="x" :cy="6" rx="2.4" ry="5.5" fill="#E8C268" stroke="#C9A646" stroke-width="0.8" />
            <path v-else :d="`M${x} 22 Q${x - 4} 18 ${x - 5} 14`" stroke="#8FB86A" stroke-width="1.4" fill="none" stroke-linecap="round" />
          </g>
        </g>
        <!-- corn: tall stalks -->
        <g v-else-if="family === 'corn'">
          <g v-for="x in [11, 20, 29]" :key="x">
            <path :d="`M${x} 34 V${stage === 3 ? -12 : 0}`" stroke="#7FA85C" stroke-width="2.6" stroke-linecap="round" />
            <path :d="`M${x} 18 Q${x - 9} 12 ${x - 10} 4 M${x} 8 Q${x + 9} 2 ${x + 10} -6`" stroke="#93BD6E" stroke-width="2.2" fill="none" stroke-linecap="round" />
            <g v-if="stage === 3">
              <ellipse :cx="x + 3" cy="10" rx="3.4" ry="7" fill="#F2CB4C" />
              <path :d="`M${x + 1} 16 Q${x + 4} 6 ${x + 7} 2`" stroke="#9CC584" stroke-width="2" fill="none" />
            </g>
          </g>
        </g>
        <!-- flowers: sunflower, rose, lavender -->
        <g v-else-if="family === 'flower'">
          <g v-for="(x, i) in [11, 20, 29]" :key="x">
            <path :d="`M${x} 34 V${crop.id === 'sunflower' ? (stage === 3 ? -4 : 6) : stage === 3 ? 8 : 14}`" stroke="#79A066" stroke-width="2" stroke-linecap="round" />
            <path :d="`M${x} 24 Q${x - 6} 20 ${x - 7} 15 M${x} 20 Q${x + 6} 16 ${x + 7} 11`" stroke="#93BD6E" stroke-width="2" fill="none" stroke-linecap="round" />
            <template v-if="stage === 3">
              <g v-if="crop.id === 'sunflower'" :transform="`translate(${x} ${-6 + (i % 2) * 3})`">
                <circle v-for="a in [0, 45, 90, 135, 180, 225, 270, 315]" :key="a" cx="0" cy="-5" r="3.2" fill="#F4C443" :transform="`rotate(${a})`" />
                <circle r="3.6" fill="#8B6142" />
              </g>
              <g v-else-if="crop.id === 'rose'" :transform="`translate(${x} 8)`">
                <circle r="5" fill="#E05A7A" />
                <path d="M-2 -1 Q0 -4 2 -1 Q1 2 -2 1" stroke="#B83A5A" stroke-width="1" fill="none" />
              </g>
              <g v-else :transform="`translate(${x} 4)`">
                <ellipse v-for="k in 4" :key="k" cx="0" :cy="k * 3" :rx="2.6 - k * 0.3" ry="1.8" fill="#A68BD6" />
              </g>
            </template>
            <circle v-else :cx="x" :cy="crop.id === 'sunflower' ? 6 : 14" r="2.5" fill="#B6D49B" />
          </g>
        </g>
        <!-- roots: carrot, potato -->
        <g v-else-if="family === 'root'">
          <g v-for="(x, i) in [11, 20, 29]" :key="x" :transform="`translate(${x} ${i === 1 ? 20 : 16})`">
            <template v-if="crop.id === 'carrot'">
              <path d="M0 6 L-5 -10 M0 6 L0 -12 M0 6 L5 -10" stroke="#7FB063" stroke-width="2.2" stroke-linecap="round" />
              <path d="M-3 -8 L-6 -12 M3 -8 L6 -12" stroke="#93C277" stroke-width="1.6" stroke-linecap="round" />
              <path v-if="stage === 3" d="M-3.5 6 L3.5 6 L0 14Z" fill="#EE9447" />
            </template>
            <template v-else>
              <circle v-for="(l, k) in [[-5, -3], [5, -3], [0, -8], [0, 0]]" :key="k" :cx="l[0]" :cy="l[1]" r="5" fill="#8FB86A" />
              <ellipse v-if="stage === 3" cx="4" cy="8" rx="4" ry="3" fill="#C9A06D" />
            </template>
          </g>
        </g>
        <!-- vines: pumpkin, watermelon -->
        <g v-else-if="family === 'vine'">
          <path d="M6 30 Q14 18 22 24 T36 20" stroke="#79A066" stroke-width="2" fill="none" stroke-linecap="round" />
          <circle v-for="(l, k) in [[10, 22], [24, 18], [32, 26]]" :key="k" :cx="l[0]" :cy="l[1]" r="5.5" fill="#8FB86A" />
          <g v-if="stage === 3">
            <ellipse v-if="crop.id === 'pumpkin'" cx="20" cy="26" rx="10" ry="8" fill="#EB8C35" />
            <path v-if="crop.id === 'pumpkin'" d="M14 20 Q13 26 14 32 M20 18 V34 M26 20 Q27 26 26 32" stroke="#C96E22" stroke-width="1.2" fill="none" />
            <rect v-if="crop.id === 'pumpkin'" x="19" y="15" width="2.6" height="4" rx="1" fill="#6F8E4A" />
            <ellipse v-if="crop.id === 'watermelon'" cx="20" cy="26" rx="12" ry="8" fill="#5FA55A" />
            <path v-if="crop.id === 'watermelon'" d="M10 24 Q20 18 30 24 M10 28 Q20 22 30 28" stroke="#3E7D3C" stroke-width="1.6" fill="none" />
          </g>
          <circle v-else cx="20" cy="27" r="3" fill="#B6D49B" />
        </g>
        <!-- bushes: tomato, strawberry, blueberry -->
        <g v-else>
          <g v-for="(x, i) in [12, 28]" :key="x">
            <circle v-for="(l, k) in [[-5, 0], [5, 0], [0, -6], [0, 4]]" :key="k" :cx="x + l[0]" :cy="20 + l[1]" r="6" :fill="k % 2 ? '#8FB86A' : '#7FAA5C'" />
            <template v-if="stage === 3">
              <circle v-for="(f, k) in [[-4, 2], [4, -2], [1, 6]]" :key="`f${k}`" :cx="x + f[0]" :cy="20 + f[1]" :r="crop.id === 'blueberry' ? 2.4 : 3" :fill="fruit" />
            </template>
          </g>
        </g>
      </g>
      <g v-if="stage === 3" class="ripe" fill="#FFF6C9">
        <path d="M6 6 l1 2.4 l2.4 1 l-2.4 1 l-1 2.4 l-1 -2.4 l-2.4 -1 l2.4 -1z" />
        <path d="M33 2 l0.8 1.8 l1.8 0.8 l-1.8 0.8 l-0.8 1.8 l-0.8 -1.8 l-1.8 -0.8 l1.8 -0.8z" />
      </g>
    </g>

    <!-- ================= trees ================= -->
    <g v-else-if="tree" :transform="`translate(20 36) scale(${treeScale}) translate(-20 -36)`">
      <ellipse cx="20" cy="36" rx="13" ry="3.5" fill="#4F6B3E" opacity="0.25" />
      <path d="M17 36 L18 10 L22 10 L23 36Z" fill="#9C7351" />
      <path d="M20.5 36 L21 10 L22 10 L23 36Z" fill="#7F5B3F" />
      <path d="M20 18 L12 8 M20 14 L28 6" stroke="#9C7351" stroke-width="2.4" stroke-linecap="round" />
      <g class="tree-sway" :style="{ animationDelay: `${-((obj.uid ?? 0) % 5) * 0.7}s` }">
        <circle cx="22" cy="-3" r="15" fill="#000" opacity="0.08" />
        <circle cx="20" cy="-6" r="15" :fill="TREE_LEAF[type][0]" />
        <circle cx="9" cy="2" r="11" :fill="TREE_LEAF[type][1]" />
        <circle cx="31" cy="2" r="11" :fill="TREE_LEAF[type][1]" />
        <circle cx="20" cy="6" r="11" :fill="TREE_LEAF[type][0]" />
        <circle cx="15" cy="-12" r="5" fill="#fff" opacity="0.18" />
        <circle cx="6" cy="-1" r="3" fill="#fff" opacity="0.12" />
      </g>
      <g v-if="treeRipe">
        <circle v-for="(f, k) in [[12, -6], [26, -10], [30, 4], [16, 6], [22, -1]]" :key="k" :cx="f[0]" :cy="f[1]" r="3.6" :fill="TREE_FRUIT[type]" stroke="#fff" stroke-opacity="0.5" stroke-width="0.8" />
      </g>
      <g v-else-if="treeBloom">
        <circle v-for="(f, k) in [[12, -6], [26, -10], [30, 4], [16, 6], [22, -1]]" :key="k" :cx="f[0]" :cy="f[1]" r="2.2" fill="#FBE1E6" />
      </g>
    </g>

    <!-- ================= buildings ================= -->
    <g v-else-if="type === 'barn'">
      <ellipse cx="40" cy="78" rx="38" ry="4" fill="#4F6B3E" opacity="0.2" />
      <path d="M6 30 L40 2 L74 30 L74 76 L6 76Z" fill="#C9584A" />
      <path d="M58 16.8 L74 30 L74 76 L58 76Z" fill="#A9463B" opacity="0.55" />
      <g stroke="#A9463B" stroke-width="0.9" opacity="0.6">
        <path d="M14 24 V76 M22 18 V76 M58 18 V76 M66 24 V76" />
      </g>
      <path d="M2 32 L40 -2 L78 32" stroke="#F6EFE2" stroke-width="5" fill="none" stroke-linejoin="round" stroke-linecap="round" />
      <path d="M2 32 L40 -2 L78 32 L74 30 L40 4 L6 30Z" fill="#8E3C33" opacity="0.4" />
      <rect x="26" y="44" width="28" height="32" fill="#A84438" />
      <path d="M26 44 L54 76 M54 44 L26 76" stroke="#F6EFE2" stroke-width="2.4" />
      <rect x="26" y="44" width="28" height="32" fill="none" stroke="#F6EFE2" stroke-width="2.4" />
      <rect x="33" y="20" width="14" height="12" rx="2" :fill="lit ? '#FFE9A8' : '#F6EFE2'" />
      <path v-if="!lit" d="M35 30 Q40 26 45 30 L45 32 L35 32Z" fill="#E8C268" />
      <path d="M33 26 H47 M40 20 V32" stroke="#C9584A" stroke-width="1.6" />
      <circle v-if="lit" cx="40" cy="26" r="16" fill="#FFE9A8" opacity="0.25" class="glow" />
      <g transform="translate(64 66)"><rect x="-5" y="-4" width="10" height="10" rx="2" fill="#E8C268" /><path d="M-5 -1 H5 M-5 3 H5" stroke="#C9A646" stroke-width="0.8" /></g>
    </g>

    <g v-else-if="type === 'kitchen'">
      <ellipse cx="40" cy="78" rx="36" ry="4" fill="#4F6B3E" opacity="0.2" />
      <rect x="56" y="-2" width="9" height="20" fill="#B9927A" />
      <g v-if="busy" class="smoke" fill="#fff" opacity="0.8">
        <circle cx="60" cy="-8" r="4" /><circle cx="64" cy="-16" r="5" /><circle cx="59" cy="-25" r="6" />
      </g>
      <rect x="8" y="30" width="64" height="46" rx="3" fill="#F6EBD8" />
      <path d="M2 34 L40 6 L78 34Z" fill="#D9805E" />
      <path d="M2 34 L40 6 L78 34" stroke="#B9634A" stroke-width="3" fill="none" stroke-linejoin="round" />
      <rect x="32" y="50" width="16" height="26" rx="7" fill="#9C7351" />
      <circle cx="44" cy="64" r="1.4" fill="#F6CF6E" />
      <rect x="14" y="44" width="14" height="13" rx="3" :fill="busy || lit ? '#FBE3A0' : '#CFE1EA'" stroke="#B9927A" stroke-width="2" />
      <rect x="52" y="44" width="14" height="13" rx="3" :fill="busy || lit ? '#FBE3A0' : '#CFE1EA'" stroke="#B9927A" stroke-width="2" />
      <path d="M14 60 H28 M52 60 H66" stroke="#E48C9C" stroke-width="3" stroke-linecap="round" />
    </g>

    <g v-else-if="type === 'board'">
      <path d="M8 38 V12 M32 38 V12" stroke="#8C6A4F" stroke-width="3" stroke-linecap="round" />
      <rect x="4" y="2" width="32" height="24" rx="3" fill="#B98C63" />
      <rect x="4" y="2" width="32" height="24" rx="3" fill="none" stroke="#8C6A4F" stroke-width="2" />
      <rect x="8" y="6" width="10" height="8" rx="1" fill="#FFFBF4" transform="rotate(-6 13 10)" />
      <rect x="21" y="7" width="10" height="9" rx="1" fill="#FCE9EC" transform="rotate(5 26 11)" />
      <rect x="12" y="15" width="11" height="8" rx="1" fill="#EAF2E1" />
      <circle cx="13" cy="6" r="1.2" fill="#C9584A" /><circle cx="26" cy="7" r="1.2" fill="#5B74C9" />
    </g>

    <!-- coop -->
    <g v-else-if="type === 'coop'">
      <ellipse cx="40" cy="78" rx="36" ry="4" fill="#4F6B3E" opacity="0.2" />
      <path d="M10 38 L40 12 L70 38Z" fill="#C9584A" />
      <rect x="14" y="36" width="52" height="38" rx="3" fill="#F3E3C6" />
      <path d="M14 46 H66 M14 56 H66 M14 66 H66" stroke="#E2CFAA" stroke-width="1.4" />
      <path d="M32 74 V56 Q40 48 48 56 V74Z" fill="#8C6A4F" />
      <path d="M44 74 L52 82 H62" stroke="#B98C63" stroke-width="3" stroke-linecap="round" />
      <g transform="translate(22 72)">
        <ellipse rx="7" ry="6" fill="#fff" />
        <circle cx="5" cy="-6" r="4" fill="#fff" />
        <path d="M4 -10 Q5 -13 6 -10 Q7 -13 8 -10" fill="#E35D4B" />
        <path d="M9 -6 L12 -5 L9 -4Z" fill="#F2B544" />
        <circle cx="6" cy="-7" r="0.8" fill="#3E2F25" />
      </g>
      <g v-if="prodReady" transform="translate(58 70)">
        <ellipse rx="9" ry="4" fill="#B98C63" />
        <ellipse cx="-3" cy="-3" rx="3" ry="4" fill="#FFF8EA" /><ellipse cx="3" cy="-3" rx="3" ry="4" fill="#F6E7CF" />
      </g>
    </g>

    <!-- beehive -->
    <g v-else-if="type === 'hive'">
      <ellipse cx="20" cy="38" rx="14" ry="3" fill="#4F6B3E" opacity="0.2" />
      <rect x="7" y="22" width="26" height="15" rx="2" fill="#F2C66B" />
      <rect x="9" y="9" width="22" height="14" rx="2" fill="#F5D383" />
      <path d="M5 9 H35 L31 3 H9Z" fill="#B98C63" />
      <rect x="16" y="31" width="8" height="3" rx="1.5" fill="#7A5A34" />
      <path d="M9 16 H31 M7 29 H33" stroke="#D9A94C" stroke-width="1" />
      <g :class="{ buzz: working }">
        <g v-for="(b, k) in [[34, 4], [4, 14], [30, -6]]" :key="k" :transform="`translate(${b[0]} ${b[1]})`">
          <ellipse rx="3" ry="2.2" fill="#F6C443" /><path d="M-1 -2 V2 M1 -2 V2" stroke="#3E2F25" stroke-width="0.9" />
          <ellipse cx="-1" cy="-2.4" rx="1.6" ry="1.1" fill="#fff" opacity="0.8" />
        </g>
      </g>
      <path v-if="prodReady" d="M20 37 Q22 41 20 43 Q18 41 20 37Z" fill="#E8A934" />
    </g>

    <!-- windmill -->
    <g v-else-if="type === 'mill'">
      <ellipse cx="40" cy="78" rx="30" ry="4" fill="#4F6B3E" opacity="0.2" />
      <path d="M24 76 L30 22 L50 22 L56 76Z" fill="#F3E6CF" />
      <path d="M26 24 L40 6 L54 24Z" fill="#9C7351" />
      <rect x="34" y="56" width="12" height="20" rx="5" fill="#8C6A4F" />
      <rect x="36" y="34" width="8" height="9" rx="2" fill="#CFE1EA" />
      <g transform="translate(40 18)">
        <g :class="{ spin: working }">
          <g v-for="a in [0, 90, 180, 270]" :key="a" :transform="`rotate(${a})`">
            <rect x="-3" y="-30" width="6" height="28" rx="1.5" fill="#FFFBF4" stroke="#B9927A" stroke-width="1.2" />
            <path d="M-3 -26 H3 M-3 -20 H3 M-3 -14 H3 M-3 -8 H3" stroke="#D9C4A6" stroke-width="0.8" />
          </g>
        </g>
        <circle r="3.4" fill="#8C6A4F" />
      </g>
      <g v-if="prodReady" transform="translate(64 70)">
        <path d="M-7 6 L-6 -4 Q0 -8 6 -4 L7 6Z" fill="#F6EBD8" stroke="#C9B08A" stroke-width="1" />
      </g>
    </g>

    <!-- cow shed -->
    <g v-else-if="type === 'cowshed'">
      <ellipse cx="40" cy="78" rx="36" ry="4" fill="#4F6B3E" opacity="0.2" />
      <path d="M6 34 L40 10 L74 34Z" fill="#7E9A63" />
      <rect x="10" y="32" width="60" height="44" rx="3" fill="#E9D7B8" />
      <rect x="18" y="44" width="44" height="32" fill="#A77A57" />
      <g transform="translate(40 58)">
        <ellipse rx="13" ry="11" fill="#fff" />
        <ellipse cx="-6" cy="-4" rx="4" ry="3" fill="#3E2F25" />
        <ellipse cx="0" cy="6" rx="8" ry="5" fill="#F3B9B5" />
        <circle cx="-3" cy="6" r="1.2" fill="#B3726C" /><circle cx="3" cy="6" r="1.2" fill="#B3726C" />
        <circle cx="-5" cy="-2" r="1.4" fill="#fff" /><circle cx="5" cy="-2" r="1.4" fill="#3E2F25" />
        <path d="M-12 -8 L-17 -11 M12 -8 L17 -11" stroke="#F3E3C6" stroke-width="3" stroke-linecap="round" />
      </g>
      <g v-if="prodReady" transform="translate(64 70)">
        <rect x="-5" y="-9" width="10" height="14" rx="3" fill="#fff" stroke="#CFE1EA" stroke-width="1.4" />
        <rect x="-3" y="-12" width="6" height="4" rx="1" fill="#7CB3D6" />
      </g>
    </g>

    <!-- ================= decorations ================= -->
    <g v-else-if="type === 'stonepath'">
      <rect x="1" y="1" width="38" height="38" rx="6" fill="#D9CDB6" opacity="0.55" />
      <ellipse cx="12" cy="12" rx="8" ry="6" fill="#C4B8A2" /><ellipse cx="28" cy="14" rx="7" ry="6" fill="#CBBFA9" />
      <ellipse cx="14" cy="29" rx="7" ry="6" fill="#CBBFA9" /><ellipse cx="29" cy="29" rx="8" ry="6" fill="#C4B8A2" />
    </g>
    <g v-else-if="type === 'woodpath'">
      <rect v-for="k in 4" :key="k" x="2" :y="2 + (k - 1) * 9.5" width="36" height="8" rx="2" :fill="k % 2 ? '#C49A6C' : '#B98C63'" />
      <circle v-for="k in 4" :key="`n${k}`" cx="6" :cy="6 + (k - 1) * 9.5" r="0.9" fill="#7A5A34" />
    </g>
    <g v-else-if="type === 'fence'">
      <path d="M2 18 H38 M2 28 H38" stroke="#B98C63" stroke-width="3.4" stroke-linecap="round" />
      <rect x="6" y="10" width="5" height="26" rx="1.5" fill="#9C7351" /><rect x="29" y="10" width="5" height="26" rx="1.5" fill="#9C7351" />
    </g>
    <g v-else-if="type === 'picket'">
      <path d="M1 20 H39 M1 30 H39" stroke="#F3EEE4" stroke-width="3" />
      <path v-for="x in [4, 13, 22, 31]" :key="x" :d="`M${x} 36 V12 L${x + 3} 8 L${x + 6} 12 V36Z`" fill="#FFFDF8" stroke="#D9CFC0" stroke-width="0.8" />
    </g>
    <g v-else-if="type === 'bush'">
      <ellipse cx="20" cy="36" rx="15" ry="3" fill="#4F6B3E" opacity="0.2" />
      <circle cx="12" cy="24" r="10" fill="#7FAA5C" /><circle cx="28" cy="24" r="10" fill="#7FAA5C" /><circle cx="20" cy="16" r="12" fill="#8FB86A" />
      <circle cx="16" cy="12" r="3.5" fill="#fff" opacity="0.18" />
    </g>
    <g v-else-if="type === 'flowerbed'">
      <ellipse cx="20" cy="26" rx="17" ry="11" fill="#8E6446" />
      <g v-for="(f, k) in [[10, 22, '#E48C9C'], [20, 18, '#F2C66B'], [30, 22, '#B48CD1'], [14, 30, '#F2C66B'], [26, 30, '#E48C9C']]" :key="k">
        <circle v-for="a in [0, 72, 144, 216, 288]" :key="a" :cx="f[0]" :cy="f[1] - 3" r="2.2" :fill="f[2]" :transform="`rotate(${a} ${f[0]} ${f[1]})`" />
        <circle :cx="f[0]" :cy="f[1]" r="1.4" fill="#FFF4D6" />
      </g>
    </g>
    <g v-else-if="type === 'mushrooms'">
      <g v-for="(m, k) in [[13, 30, 1], [27, 32, 0.8], [22, 22, 0.65]]" :key="k" :transform="`translate(${m[0]} ${m[1]}) scale(${m[2]})`">
        <rect x="-3" y="-6" width="6" height="8" rx="2" fill="#FFF8EA" />
        <path d="M-10 -5 Q0 -18 10 -5Z" fill="#E35D4B" />
        <circle cx="-4" cy="-9" r="1.6" fill="#fff" /><circle cx="3" cy="-11" r="1.4" fill="#fff" />
      </g>
    </g>
    <g v-else-if="type === 'haybale'">
      <ellipse cx="20" cy="36" rx="15" ry="3" fill="#4F6B3E" opacity="0.2" />
      <rect x="5" y="14" width="30" height="22" rx="6" fill="#E8C268" />
      <path d="M8 20 H32 M8 26 H32 M8 31 H32" stroke="#C9A646" stroke-width="1.2" />
      <path d="M14 14 V36 M26 14 V36" stroke="#A88332" stroke-width="1.6" />
    </g>
    <g v-else-if="type === 'mailbox'">
      <rect x="18" y="16" width="4" height="22" fill="#9C7351" />
      <path d="M9 18 V8 Q9 2 15 2 H25 Q31 2 31 8 V18Z" fill="#7CB3D6" />
      <rect x="27" y="4" width="2" height="10" fill="#E35D4B" /><rect x="27" y="4" width="7" height="4" fill="#E35D4B" />
    </g>
    <g v-else-if="type === 'bench'">
      <rect x="4" y="12" width="32" height="5" rx="1.5" fill="#B98C63" />
      <rect x="4" y="20" width="32" height="5" rx="1.5" fill="#C49A6C" />
      <path d="M8 25 V34 M32 25 V34 M8 17 V20 M32 17 V20" stroke="#8C6A4F" stroke-width="2.6" stroke-linecap="round" />
    </g>
    <g v-else-if="type === 'lamp'">
      <rect x="18.5" y="2" width="3" height="34" fill="#4A4E5A" />
      <ellipse cx="20" cy="37" rx="6" ry="2" fill="#4A4E5A" />
      <circle cx="20" cy="-2" :r="lit ? 22 : 11" fill="#FBE3A0" :opacity="lit ? 0.5 : 0.35" class="glow" />
      <path d="M14 -6 H26 L24 4 H16Z" :fill="lit ? '#FFE9A8' : '#FBE3A0'" stroke="#4A4E5A" stroke-width="1.6" />
      <path d="M13 -6 L20 -11 L27 -6Z" fill="#4A4E5A" />
    </g>
    <g v-else-if="type === 'wheelbarrow'">
      <path d="M4 14 H30 L26 28 H10Z" fill="#7CB3D6" />
      <path d="M30 18 L38 12" stroke="#8C6A4F" stroke-width="2.4" stroke-linecap="round" />
      <circle cx="12" cy="31" r="5" fill="#4A4E5A" /><circle cx="12" cy="31" r="2" fill="#C4B8A2" />
      <circle cx="10" cy="12" r="4" fill="#8FB86A" /><circle cx="18" cy="11" r="4.5" fill="#E35D4B" /><circle cx="25" cy="12" r="3.6" fill="#EE9447" />
    </g>
    <g v-else-if="type === 'gnome'">
      <ellipse cx="20" cy="37" rx="9" ry="2.4" fill="#4F6B3E" opacity="0.25" />
      <rect x="12" y="24" width="16" height="13" rx="5" fill="#5B74C9" />
      <path d="M12 22 Q20 34 28 22 L26 18 H14Z" fill="#FFFDF8" />
      <circle cx="20" cy="16" r="5" fill="#F3C7A9" />
      <circle cx="20" cy="18" r="1.6" fill="#E48C9C" />
      <path d="M12 14 L20 -6 L28 14Z" fill="#E35D4B" />
    </g>
    <g v-else-if="type === 'scarecrow'">
      <path d="M20 38 V8 M6 16 H34" stroke="#9C7351" stroke-width="3" stroke-linecap="round" />
      <path d="M12 14 H28 L26 30 H14Z" fill="#5B74C9" />
      <path d="M14 22 H26" stroke="#E8C268" stroke-width="2" />
      <circle cx="20" cy="4" r="6" fill="#F3E3C6" />
      <circle cx="18" cy="3" r="1" fill="#3E2F25" /><circle cx="22" cy="3" r="1" fill="#3E2F25" />
      <path d="M10 -1 H30 M14 -1 L16 -9 H24 L26 -1" fill="#B98C63" stroke="#8C6A4F" stroke-width="1.4" />
      <path d="M6 16 L3 20 M34 16 L37 20" stroke="#E8C268" stroke-width="2" stroke-linecap="round" />
    </g>
    <g v-else-if="type === 'birdbath'">
      <path d="M16 36 H24 L22 18 H18Z" fill="#CBBFA9" />
      <ellipse cx="20" cy="16" rx="14" ry="5" fill="#CBBFA9" />
      <ellipse cx="20" cy="15" rx="11" ry="3.2" fill="#9CC7DA" />
      <g transform="translate(29 9)">
        <ellipse rx="4" ry="3" fill="#E48C9C" /><circle cx="3" cy="-2" r="2.2" fill="#E48C9C" />
        <path d="M5 -2 L7 -1.5 L5 -1Z" fill="#F2B544" />
      </g>
    </g>
    <g v-else-if="type === 'well'">
      <rect x="6" y="18" width="28" height="18" rx="4" fill="#B4A890" />
      <path d="M6 24 H34 M6 30 H34 M14 18 V24 M26 18 V24 M20 24 V30" stroke="#9A8E76" stroke-width="1.2" />
      <ellipse cx="20" cy="18" rx="14" ry="4" fill="#5A7F94" />
      <path d="M9 18 V2 M31 18 V2" stroke="#8C6A4F" stroke-width="2.4" />
      <path d="M4 4 L20 -6 L36 4Z" fill="#C9584A" />
      <path d="M20 4 V12" stroke="#8C6A4F" stroke-width="1" /><rect x="17" y="11" width="6" height="5" rx="1" fill="#9C7351" />
    </g>
    <g v-else-if="type === 'picnic'">
      <rect x="4" y="6" width="72" height="30" rx="4" fill="#FCE9EC" />
      <g fill="#E48C9C" opacity="0.6">
        <rect v-for="k in 9" :key="k" :x="4 + (k - 1) * 8" y="6" width="4" height="30" />
      </g>
      <g fill="#E48C9C" opacity="0.35"><rect v-for="k in 4" :key="`h${k}`" x="4" :y="6 + (k - 1) * 8" width="72" height="4" /></g>
      <rect x="44" y="12" width="20" height="14" rx="3" fill="#C49A6C" />
      <path d="M46 12 Q54 2 62 12" stroke="#8C6A4F" stroke-width="2" fill="none" />
      <circle cx="18" cy="20" r="5" fill="#fff" /><circle cx="18" cy="20" r="3" fill="#F5AE8C" />
    </g>
    <g v-else-if="type === 'pond'">
      <ellipse cx="40" cy="44" rx="37" ry="32" fill="#B4A890" />
      <ellipse cx="40" cy="43" rx="33" ry="28" fill="#7FB2CB" />
      <ellipse cx="34" cy="36" rx="18" ry="10" fill="#A8CFE0" opacity="0.6" />
      <g v-for="(l, k) in [[24, 50, 7], [52, 34, 6], [50, 58, 5]]" :key="k">
        <path :d="`M${l[0]} ${l[1]} m-${l[2]} 0 a${l[2]} ${l[2] * 0.7} 0 1 0 ${l[2] * 2} 0 L${l[0]} ${l[1]}Z`" fill="#7FAA5C" />
      </g>
      <g transform="translate(52 34)"><circle v-for="a in [0, 72, 144, 216, 288]" :key="a" cx="0" cy="-2.5" r="1.8" fill="#F6C7CD" :transform="`rotate(${a})`" /></g>
    </g>
    <!-- paths -->
    <g v-else-if="type === 'gravel'">
      <rect x="1" y="1" width="38" height="38" rx="7" fill="#DCD3C2" />
      <circle v-for="(g, k) in [[7, 8], [15, 13], [26, 7], [33, 15], [10, 22], [21, 24], [31, 28], [6, 33], [17, 34], [27, 36], [24, 16], [12, 29]]" :key="k" :cx="g[0]" :cy="g[1]" :r="1.2 + (k % 3) * 0.5" :fill="k % 2 ? '#BFB49F' : '#CDC3B0'" />
    </g>
    <g v-else-if="type === 'brickpath'">
      <rect x="1" y="1" width="38" height="38" rx="4" fill="#B5553F" />
      <g fill="#C9684F">
        <rect x="2" y="2" width="17" height="8" rx="1" /><rect x="21" y="2" width="17" height="8" rx="1" />
        <rect x="2" y="12" width="8" height="7" rx="1" /><rect x="12" y="12" width="17" height="7" rx="1" /><rect x="31" y="12" width="7" height="7" rx="1" />
        <rect x="2" y="21" width="17" height="8" rx="1" /><rect x="21" y="21" width="17" height="8" rx="1" />
        <rect x="2" y="31" width="8" height="7" rx="1" /><rect x="12" y="31" width="17" height="7" rx="1" /><rect x="31" y="31" width="7" height="7" rx="1" />
      </g>
    </g>
    <g v-else-if="type === 'mosspath'">
      <ellipse cx="12" cy="12" rx="9" ry="7" fill="#B8B3A3" /><ellipse cx="29" cy="15" rx="8" ry="7" fill="#C2BDAD" />
      <ellipse cx="14" cy="30" rx="8" ry="6.5" fill="#C2BDAD" /><ellipse cx="30" cy="31" rx="7" ry="6" fill="#B8B3A3" />
      <g fill="#7FAA5C" opacity="0.85"><circle cx="8" cy="9" r="3" /><circle cx="33" cy="12" r="2.5" /><circle cx="17" cy="33" r="2.6" /><circle cx="27" cy="34" r="2" /></g>
    </g>
    <g v-else-if="type === 'flowerpath'">
      <ellipse cx="20" cy="12" rx="9" ry="6.5" fill="#E4DCCB" /><ellipse cx="20" cy="29" rx="9" ry="6.5" fill="#E4DCCB" />
      <g v-for="(f, k) in [[6, 6], [34, 8], [5, 22], [35, 24], [7, 37], [33, 36]]" :key="k">
        <circle v-for="a in [0, 72, 144, 216, 288]" :key="a" :cx="f[0]" :cy="f[1] - 2.4" r="1.8" fill="#FFFDF8" :transform="`rotate(${a} ${f[0]} ${f[1]})`" />
        <circle :cx="f[0]" :cy="f[1]" r="1.3" fill="#F2B544" />
      </g>
    </g>
    <g v-else-if="type === 'tilepath'">
      <rect x="1" y="1" width="38" height="38" rx="4" fill="#F4EDE0" />
      <g v-for="(t, k) in [[2, 2], [21, 2], [2, 21], [21, 21]]" :key="k" :transform="`translate(${t[0]} ${t[1]})`">
        <rect width="17" height="17" rx="2" :fill="k % 3 ? '#7CB3D6' : '#5B8FC0'" />
        <path d="M8.5 2 L15 8.5 L8.5 15 L2 8.5Z" fill="#FFFDF8" opacity="0.85" />
        <circle cx="8.5" cy="8.5" r="2" fill="#F2C66B" />
      </g>
    </g>

    <!-- fences and edges -->
    <g v-else-if="type === 'hedge'">
      <ellipse cx="20" cy="37" rx="19" ry="2.6" fill="#4F6B3E" opacity="0.2" />
      <rect x="0" y="14" width="40" height="22" rx="9" fill="#6E9E5C" />
      <circle v-for="x in [6, 15, 25, 34]" :key="x" :cx="x" cy="16" r="7" fill="#7FAA5C" />
      <circle cx="12" cy="13" r="2" fill="#fff" opacity="0.18" />
    </g>
    <g v-else-if="type === 'stonewall'">
      <rect x="0" y="16" width="40" height="21" rx="3" fill="#A69C88" />
      <g fill="#C4BAA6" stroke="#8F8572" stroke-width="0.8">
        <rect x="1" y="17" width="12" height="6" rx="2" /><rect x="14" y="17" width="12" height="6" rx="2" /><rect x="27" y="17" width="12" height="6" rx="2" />
        <rect x="1" y="24" width="7" height="6" rx="2" /><rect x="9" y="24" width="13" height="6" rx="2" /><rect x="23" y="24" width="16" height="6" rx="2" />
        <rect x="1" y="31" width="14" height="5.5" rx="2" /><rect x="16" y="31" width="10" height="5.5" rx="2" /><rect x="27" y="31" width="12" height="5.5" rx="2" />
      </g>
      <circle cx="31" cy="17" r="2.4" fill="#7FAA5C" />
    </g>
    <g v-else-if="type === 'bamboo'">
      <path d="M0 18 H40 M0 30 H40" stroke="#8C6A4F" stroke-width="2" />
      <g v-for="x in [4, 12, 20, 28, 36]" :key="x">
        <rect :x="x - 3" :y="x % 8 ? 6 : 9" width="6" height="30" rx="2.5" fill="#C9C47A" />
        <path :d="`M${x - 3} 16 H${x + 3} M${x - 3} 26 H${x + 3}`" stroke="#A39E57" stroke-width="1.2" />
      </g>
    </g>
    <g v-else-if="type === 'rosearch'">
      <path d="M6 38 V8 Q20 -12 34 8 V38" stroke="#FFFDF8" stroke-width="4" fill="none" stroke-linecap="round" />
      <path d="M6 38 V8 Q20 -12 34 8 V38" stroke="#7FAA5C" stroke-width="2" fill="none" stroke-dasharray="3 4" />
      <g v-for="(r, k) in [[6, 30], [6, 16], [12, 2], [20, -3], [28, 2], [34, 14], [34, 28]]" :key="k" :transform="`translate(${r[0]} ${r[1]})`">
        <circle r="3.4" :fill="k % 2 ? '#E05A7A' : '#F2A3B5'" />
        <circle r="1.2" fill="#B83A5A" opacity="0.6" />
      </g>
    </g>

    <!-- garden pieces -->
    <g v-else-if="type === 'rock'">
      <ellipse cx="20" cy="36" rx="14" ry="3" fill="#4F6B3E" opacity="0.2" />
      <path d="M6 36 Q4 22 14 18 Q24 12 32 20 Q38 28 34 36Z" fill="#A9A397" />
      <path d="M14 18 Q24 12 32 20 Q26 18 18 22Z" fill="#7FAA5C" />
      <path d="M10 28 Q14 26 16 30" stroke="#8E887C" stroke-width="1.2" fill="none" />
    </g>
    <g v-else-if="type === 'stump'">
      <ellipse cx="20" cy="36" rx="14" ry="3" fill="#4F6B3E" opacity="0.2" />
      <path d="M8 20 V34 Q8 38 14 37 H26 Q32 38 32 34 V20Z" fill="#9C7351" />
      <path d="M8 34 L3 37 M32 34 L37 37" stroke="#9C7351" stroke-width="3" stroke-linecap="round" />
      <ellipse cx="20" cy="20" rx="12" ry="5" fill="#D9B48A" />
      <ellipse cx="20" cy="20" rx="7" ry="2.8" fill="none" stroke="#B98C63" stroke-width="1" /><ellipse cx="20" cy="20" rx="3" ry="1.2" fill="none" stroke="#B98C63" stroke-width="1" />
      <g transform="translate(30 16)"><rect x="-1" y="-2" width="2" height="4" fill="#FFF8EA" /><path d="M-4 -2 Q0 -7 4 -2Z" fill="#E35D4B" /></g>
    </g>
    <g v-else-if="type === 'can'">
      <ellipse cx="20" cy="37" rx="12" ry="2.6" fill="#4F6B3E" opacity="0.2" />
      <path d="M10 16 H26 L24 35 H12Z" fill="#9CB5C4" stroke="#6F8A99" stroke-width="1.2" stroke-linejoin="round" />
      <path d="M26 19 L35 11 L37 13 L28 22" fill="#9CB5C4" stroke="#6F8A99" stroke-width="1.2" stroke-linejoin="round" />
      <path d="M12 14 Q18 4 25 14" stroke="#6F8A99" stroke-width="2" fill="none" stroke-linecap="round" />
      <path d="M13 22 H22" stroke="#fff" stroke-width="1.6" opacity="0.6" stroke-linecap="round" />
    </g>
    <g v-else-if="type === 'signpost'">
      <rect x="18" y="4" width="4" height="34" rx="1" fill="#8C6A4F" />
      <path d="M6 6 H30 L35 11 L30 16 H6Z" fill="#C49A6C" stroke="#8C6A4F" stroke-width="1.2" />
      <path d="M34 19 H10 L5 24 L10 29 H34Z" fill="#B98C63" stroke="#8C6A4F" stroke-width="1.2" />
      <path d="M10 11 H25 M14 24 H29" stroke="#8C6A4F" stroke-width="1.4" stroke-linecap="round" opacity="0.6" />
    </g>
    <g v-else-if="type === 'tulips'">
      <ellipse cx="20" cy="33" rx="17" ry="6" fill="#8E6446" />
      <g v-for="(t, k) in [[8, 22, '#E35D4B'], [15, 16, '#F2C66B'], [22, 20, '#E48C9C'], [29, 15, '#B48CD1'], [34, 23, '#E35D4B'], [19, 27, '#F2A3B5']]" :key="k">
        <path :d="`M${t[0]} 34 V${t[1] + 4}`" stroke="#79A066" stroke-width="1.6" />
        <path :d="`M${t[0] - 3.5} ${t[1]} Q${t[0] - 3.5} ${t[1] + 6} ${t[0]} ${t[1] + 6} Q${t[0] + 3.5} ${t[1] + 6} ${t[0] + 3.5} ${t[1]} L${t[0] + 1.8} ${t[1] + 2} L${t[0]} ${t[1] - 1} L${t[0] - 1.8} ${t[1] + 2}Z`" :fill="t[2]" />
      </g>
    </g>
    <g v-else-if="type === 'logpile'">
      <ellipse cx="20" cy="37" rx="17" ry="2.6" fill="#4F6B3E" opacity="0.2" />
      <g v-for="(l, k) in [[9, 31], [20, 31], [31, 31], [14.5, 22], [25.5, 22], [20, 13]]" :key="k">
        <circle :cx="l[0]" :cy="l[1]" r="5.6" fill="#9C7351" />
        <circle :cx="l[0]" :cy="l[1]" r="4" fill="#D9B48A" />
        <circle :cx="l[0]" :cy="l[1]" r="1.6" fill="none" stroke="#B98C63" stroke-width="0.8" />
      </g>
    </g>
    <g v-else-if="type === 'crates'">
      <ellipse cx="20" cy="37" rx="17" ry="2.6" fill="#4F6B3E" opacity="0.2" />
      <g v-for="(c, k) in [[3, 22], [21, 22], [12, 6]]" :key="k" :transform="`translate(${c[0]} ${c[1]})`">
        <circle v-for="(a, j) in [[4, 1], [9, 0], [14, 1]]" :key="j" :cx="a[0]" :cy="a[1]" r="3.4" :fill="k === 2 ? '#F2CB4C' : '#E35D4B'" />
        <rect x="0" y="1" width="17" height="14" rx="1.5" fill="#C49A6C" stroke="#8C6A4F" stroke-width="1" />
        <path d="M0 6 H17 M0 10.5 H17" stroke="#8C6A4F" stroke-width="0.9" />
      </g>
    </g>
    <g v-else-if="type === 'birdhouse'">
      <rect x="18.5" y="14" width="3" height="24" fill="#8C6A4F" />
      <rect x="9" y="-6" width="22" height="20" rx="2" fill="#7CB3D6" />
      <path d="M5 -4 L20 -18 L35 -4Z" fill="#C9584A" />
      <circle cx="20" cy="3" r="3.6" fill="#3E2F25" />
      <path d="M16 10 H24" stroke="#8C6A4F" stroke-width="2" stroke-linecap="round" />
      <g transform="translate(31 -10)"><ellipse rx="3.4" ry="2.6" fill="#F2C66B" /><circle cx="2.4" cy="-1.8" r="2" fill="#F2C66B" /><path d="M4.2 -1.8 L6 -1.3 L4.2 -0.8Z" fill="#EE9447" /></g>
    </g>
    <g v-else-if="type === 'pumpkins'">
      <ellipse cx="20" cy="37" rx="17" ry="2.6" fill="#4F6B3E" opacity="0.2" />
      <g v-for="(pk, k) in [[11, 30, 9], [29, 31, 8], [20, 18, 7.5]]" :key="k" :transform="`translate(${pk[0]} ${pk[1]})`">
        <ellipse :rx="pk[2]" :ry="pk[2] * 0.8" fill="#EB8C35" />
        <path :d="`M-${pk[2] / 2} -${pk[2] * 0.7} Q-${pk[2] * 0.6} 0 -${pk[2] / 2} ${pk[2] * 0.7} M0 -${pk[2] * 0.8} V${pk[2] * 0.8} M${pk[2] / 2} -${pk[2] * 0.7} Q${pk[2] * 0.6} 0 ${pk[2] / 2} ${pk[2] * 0.7}`" stroke="#C96E22" stroke-width="1" fill="none" />
        <rect x="-1" :y="-pk[2] * 0.8 - 3" width="2.2" height="3.4" rx="0.8" fill="#6F8E4A" />
      </g>
    </g>
    <g v-else-if="type === 'lanterns'">
      <path d="M2 -6 Q20 4 38 -6" stroke="#8C6A4F" stroke-width="1" fill="none" />
      <path d="M4 38 V-8 M36 38 V-8" stroke="#8C6A4F" stroke-width="2.4" stroke-linecap="round" />
      <g v-for="(l, k) in [[11, -1, '#E35D4B'], [20, 1, '#F2C66B'], [29, -1, '#E48C9C']]" :key="k" :transform="`translate(${l[0]} ${l[1]})`">
        <circle v-if="lit" r="9" :fill="l[2]" opacity="0.3" class="glow" />
        <ellipse cy="5" rx="4.4" ry="5.4" :fill="l[2]" />
        <path d="M-3 2 H3 M-3.6 5 H3.6 M-3 8 H3" stroke="#fff" stroke-width="0.6" opacity="0.5" />
      </g>
    </g>
    <g v-else-if="type === 'kennel'">
      <ellipse cx="20" cy="37" rx="17" ry="2.6" fill="#4F6B3E" opacity="0.2" />
      <path d="M4 14 L20 0 L36 14Z" fill="#C9584A" />
      <rect x="7" y="13" width="26" height="24" rx="2" fill="#C49A6C" />
      <path d="M14 37 V26 Q20 18 26 26 V37Z" fill="#5A4636" />
      <g transform="translate(20 33)">
        <ellipse rx="6" ry="3.6" fill="#F3E3C6" />
        <ellipse cx="-5" cy="-1" rx="2" ry="3" fill="#B98C63" transform="rotate(30 -5 -1)" />
        <path d="M-2 -0.5 Q-1 0.5 0 -0.5 M1.5 -0.5 Q2.5 0.5 3.5 -0.5" stroke="#3E2F25" stroke-width="0.7" fill="none" />
      </g>
      <rect x="15" y="7" width="10" height="4" rx="1" fill="#FFFDF8" />
    </g>
    <g v-else-if="type === 'cat'">
      <ellipse cx="20" cy="36" rx="14" ry="2.6" fill="#4F6B3E" opacity="0.2" />
      <ellipse cx="21" cy="29" rx="13" ry="7.5" fill="#EE9447" />
      <path d="M33 31 Q40 30 38 22" stroke="#EE9447" stroke-width="4" fill="none" stroke-linecap="round" />
      <circle cx="11" cy="26" r="7" fill="#F2A65E" />
      <path d="M6 21 L6 14 L11 19Z M16 21 L16 14 L11 19Z" fill="#F2A65E" />
      <path d="M7 26 Q8.5 27.5 10 26 M12 26 Q13.5 27.5 15 26" stroke="#3E2F25" stroke-width="0.9" fill="none" stroke-linecap="round" />
      <path d="M20 24 Q23 22 26 24 M22 31 Q25 29 28 31" stroke="#D9772E" stroke-width="1.4" fill="none" />
      <text x="28" y="14" font-size="7" font-weight="800" fill="#fff" opacity="0.9" class="zzz">z</text>
    </g>
    <g v-else-if="type === 'topiary'">
      <rect x="11" y="28" width="18" height="10" rx="2" fill="#C9684F" />
      <rect x="9" y="26" width="22" height="4" rx="1.5" fill="#B5553F" />
      <rect x="18.5" y="6" width="3" height="21" fill="#8C6A4F" />
      <circle cx="20" cy="14" r="9" fill="#6E9E5C" />
      <circle cx="20" cy="-4" r="7" fill="#7FAA5C" />
      <circle cx="17" cy="-7" r="2" fill="#fff" opacity="0.2" />
    </g>
    <g v-else-if="type === 'firepit'">
      <ellipse cx="20" cy="31" rx="15" ry="6" fill="#8F8572" />
      <ellipse cx="20" cy="30" rx="11" ry="4" fill="#4A3E33" />
      <circle v-if="lit" cx="20" cy="22" r="18" fill="#FFB35C" opacity="0.25" class="glow" />
      <path d="M12 30 L28 26 M12 26 L28 30" stroke="#9C7351" stroke-width="3" stroke-linecap="round" />
      <g class="flame">
        <path d="M20 28 Q12 22 17 14 Q18 20 20 18 Q20 10 25 6 Q24 14 28 20 Q28 26 20 28Z" fill="#F29A38" />
        <path d="M20 28 Q16 24 19 19 Q20 23 22 21 Q24 25 20 28Z" fill="#FBE3A0" />
      </g>
    </g>
    <g v-else-if="type === 'swing'">
      <path d="M4 38 L8 -8 M36 38 L32 -8 M6 -8 H34" stroke="#9C7351" stroke-width="3" stroke-linecap="round" />
      <g class="swing-seat">
        <path d="M13 -8 V22 M27 -8 V22" stroke="#C9B08A" stroke-width="1.2" />
        <rect x="10" y="21" width="20" height="4" rx="1.5" fill="#E48C9C" />
      </g>
      <path d="M6 -10 Q10 -16 14 -10 Q18 -16 22 -10" stroke="#7FAA5C" stroke-width="2" fill="none" />
      <circle cx="10" cy="-12" r="1.8" fill="#F2A3B5" /><circle cx="19" cy="-12" r="1.8" fill="#F2A3B5" />
    </g>
    <g v-else-if="type === 'sundial'">
      <path d="M14 38 H26 L24 18 H16Z" fill="#CBBFA9" />
      <ellipse cx="20" cy="16" rx="14" ry="5" fill="#E4DCCB" stroke="#B4A890" stroke-width="1" />
      <path d="M20 16 L26 6 L26 16Z" fill="#C9952F" />
      <path d="M8 16 H10 M30 16 H32 M20 11.5 V12.5 M20 19.5 V20.5" stroke="#9A8E76" stroke-width="1.2" />
    </g>
    <g v-else-if="type === 'statue'">
      <rect x="9" y="28" width="22" height="10" rx="1.5" fill="#CBBFA9" />
      <rect x="7" y="25" width="26" height="4" rx="1" fill="#DCD3C2" />
      <ellipse cx="20" cy="19" rx="9" ry="7" fill="#E4DCCB" />
      <circle cx="20" cy="8" r="6" fill="#E4DCCB" />
      <ellipse cx="17" cy="-3" rx="2.2" ry="7" fill="#E4DCCB" /><ellipse cx="23" cy="-3" rx="2.2" ry="7" fill="#E4DCCB" />
      <circle cx="28" cy="22" r="3" fill="#E4DCCB" />
      <path d="M18 8 h0.1 M22 8 h0.1" stroke="#9A8E76" stroke-width="1.6" stroke-linecap="round" />
      <circle cx="12" cy="24" r="2.4" fill="#7FAA5C" opacity="0.8" />
    </g>
    <g v-else-if="type === 'flowercart'">
      <ellipse cx="40" cy="37" rx="34" ry="3" fill="#4F6B3E" opacity="0.2" />
      <path d="M62 22 L78 14" stroke="#8C6A4F" stroke-width="3" stroke-linecap="round" />
      <rect x="10" y="12" width="52" height="16" rx="2" fill="#C49A6C" stroke="#8C6A4F" stroke-width="1.2" />
      <path d="M10 20 H62" stroke="#8C6A4F" stroke-width="1" />
      <g v-for="(f, k) in [[16, '#E35D4B'], [24, '#F2C66B'], [32, '#E48C9C'], [40, '#B48CD1'], [48, '#F2C66B'], [56, '#E35D4B']]" :key="k">
        <circle :cx="f[0]" :cy="9 - (k % 2) * 3" r="4.6" :fill="f[1]" />
        <circle :cx="f[0]" :cy="9 - (k % 2) * 3" r="1.5" fill="#FFF4D6" />
        <circle :cx="f[0] + 3" cy="12" r="2.6" fill="#7FAA5C" />
      </g>
      <circle cx="22" cy="31" r="6" fill="#8C6A4F" /><circle cx="22" cy="31" r="2" fill="#D9B48A" />
      <circle cx="50" cy="31" r="6" fill="#8C6A4F" /><circle cx="50" cy="31" r="2" fill="#D9B48A" />
    </g>
    <g v-else-if="type === 'fountain'">
      <ellipse cx="40" cy="62" rx="36" ry="14" fill="#B4A890" />
      <ellipse cx="40" cy="59" rx="31" ry="10" fill="#7FB2CB" />
      <ellipse cx="34" cy="57" rx="14" ry="4" fill="#A8CFE0" opacity="0.7" />
      <rect x="35" y="20" width="10" height="38" rx="2" fill="#CBBFA9" />
      <ellipse cx="40" cy="22" rx="16" ry="5" fill="#CBBFA9" />
      <ellipse cx="40" cy="21" rx="12" ry="3" fill="#9CC7DA" />
      <g class="water" stroke="#CFE6F0" stroke-width="2" fill="none" stroke-linecap="round">
        <path d="M40 14 V2 M40 4 Q30 6 26 20 M40 4 Q50 6 54 20" />
        <path d="M28 22 Q24 34 22 52 M52 22 Q56 34 58 52" opacity="0.6" />
      </g>
      <circle cx="40" cy="1" r="2.4" fill="#E4F2F7" />
    </g>
    <g v-else-if="type === 'tent'">
      <ellipse cx="40" cy="74" rx="36" ry="5" fill="#4F6B3E" opacity="0.2" />
      <path d="M4 74 L40 10 L76 74Z" fill="#EB8C35" />
      <path d="M40 10 L76 74 H58Z" fill="#C96E22" />
      <path d="M40 74 L32 42 L40 22 L48 42Z" :fill="lit ? '#FFE9A8' : '#5A4636'" />
      <circle v-if="lit" cx="40" cy="56" r="26" fill="#FFE9A8" opacity="0.25" class="glow" />
      <path d="M40 10 V2 M40 2 L48 5 L40 8" stroke="#8C6A4F" stroke-width="1.6" fill="#E35D4B" />
      <path d="M2 76 L6 70 M78 76 L74 70" stroke="#8C6A4F" stroke-width="1.6" />
    </g>
    <g v-else-if="type === 'greenhouse'">
      <ellipse cx="40" cy="78" rx="38" ry="4" fill="#4F6B3E" opacity="0.2" />
      <path d="M6 76 V30 Q40 -6 74 30 V76Z" fill="#D6EBF2" opacity="0.85" />
      <path d="M6 30 Q40 -6 74 30 M6 76 V30 M74 76 V30 M23 76 V16 M40 76 V10 M57 76 V16 M6 52 H74" stroke="#FFFDF8" stroke-width="2.4" fill="none" />
      <g v-for="(pl, k) in [[14, 66], [30, 64], [50, 64], [66, 66]]" :key="k" :transform="`translate(${pl[0]} ${pl[1]})`">
        <rect x="-5" y="2" width="10" height="9" rx="1.5" fill="#C9684F" />
        <circle cx="-3" cy="-1" r="4" fill="#7FAA5C" /><circle cx="3" cy="-2" r="4.4" fill="#8FB86A" />
        <circle v-if="k % 2" cx="1" cy="-4" r="1.8" fill="#E35D4B" />
      </g>
      <path d="M14 36 Q20 30 26 36" stroke="#fff" stroke-width="2" opacity="0.6" fill="none" />
    </g>
    <g v-else-if="type === 'telescope'">
      <path d="M20 22 L10 38 M20 22 L30 38 M20 22 V38" stroke="#8C6A4F" stroke-width="2.2" stroke-linecap="round" />
      <g transform="rotate(-35 20 18)">
        <rect x="6" y="13" width="28" height="9" rx="3" fill="#5B74C9" />
        <rect x="30" y="11" width="6" height="13" rx="2" fill="#F2C66B" />
        <rect x="2" y="15" width="5" height="5" rx="1" fill="#3E4A7A" />
      </g>
      <g v-if="lit" fill="#FFF6D9" class="twinkle"><circle cx="34" cy="-20" r="1.4" /><circle cx="26" cy="-30" r="1" /><circle cx="38" cy="-34" r="1.2" /></g>
    </g>
    <g v-else-if="type === 'treehouse'">
      <ellipse cx="40" cy="78" rx="30" ry="4" fill="#4F6B3E" opacity="0.2" />
      <path d="M34 78 L36 20 H44 L46 78Z" fill="#9C7351" />
      <circle cx="40" cy="-10" r="26" fill="#7FAA5C" /><circle cx="18" cy="6" r="18" fill="#6E9E5C" /><circle cx="62" cy="6" r="18" fill="#6E9E5C" />
      <rect x="20" y="18" width="40" height="24" rx="2" fill="#C49A6C" stroke="#8C6A4F" stroke-width="1.4" />
      <path d="M16 20 L40 2 L64 20Z" fill="#C9584A" />
      <rect x="26" y="25" width="10" height="9" rx="1.5" :fill="lit ? '#FFE9A8' : '#CFE1EA'" stroke="#8C6A4F" stroke-width="1.2" />
      <rect x="44" y="26" width="9" height="16" rx="1.5" fill="#8C6A4F" />
      <path d="M58 42 V78 M66 42 V78 M58 50 H66 M58 58 H66 M58 66 H66 M58 74 H66" stroke="#B98C63" stroke-width="2" />
      <path d="M18 42 H62" stroke="#8C6A4F" stroke-width="2.4" />
    </g>
    <g v-else-if="type === 'rainbow'">
      <g fill="none" stroke-width="5" stroke-linecap="round">
        <path d="M6 38 A34 34 0 0 1 74 38" stroke="#F28B82" />
        <path d="M11 38 A29 29 0 0 1 69 38" stroke="#F8C77A" />
        <path d="M16 38 A24 24 0 0 1 64 38" stroke="#F6E58D" />
        <path d="M21 38 A19 19 0 0 1 59 38" stroke="#9FD39B" />
        <path d="M26 38 A14 14 0 0 1 54 38" stroke="#8EC5E8" />
        <path d="M31 38 A9 9 0 0 1 49 38" stroke="#C3A8E6" />
      </g>
      <g fill="#fff"><circle cx="6" cy="36" r="6" /><circle cx="12" cy="38" r="5" /><circle cx="74" cy="36" r="6" /><circle cx="68" cy="38" r="5" /></g>
    </g>
    <g v-else-if="type === 'snowman'">
      <ellipse cx="20" cy="37" rx="13" ry="2.6" fill="#4F6B3E" opacity="0.2" />
      <circle cx="20" cy="28" r="10" fill="#FFFFFF" stroke="#DCE7EE" stroke-width="1" />
      <circle cx="20" cy="12" r="7.5" fill="#FFFFFF" stroke="#DCE7EE" stroke-width="1" />
      <path d="M13 17 Q20 21 27 17 L28 21 Q20 24 12 21Z" fill="#E35D4B" />
      <path d="M20 12 L27 13.5 L20 14Z" fill="#EE9447" />
      <circle cx="17.5" cy="10" r="1" fill="#3E2F25" /><circle cx="22.5" cy="10" r="1" fill="#3E2F25" />
      <circle cx="20" cy="26" r="1.2" fill="#3E2F25" /><circle cx="20" cy="31" r="1.2" fill="#3E2F25" />
      <rect x="14" y="1" width="12" height="4" rx="1" fill="#3E4A7A" /><rect x="16" y="-6" width="8" height="8" rx="1" fill="#3E4A7A" />
      <path d="M10 26 L3 20 M30 26 L37 20" stroke="#8C6A4F" stroke-width="1.6" stroke-linecap="round" />
    </g>
    <!-- sheep pen -->
    <g v-else-if="type === 'sheepfold'">
      <ellipse cx="40" cy="78" rx="36" ry="4" fill="#4F6B3E" opacity="0.2" />
      <path d="M6 30 L30 12 L54 30Z" fill="#6F8E9C" />
      <rect x="10" y="29" width="40" height="26" rx="2" fill="#D9C4A6" />
      <rect x="24" y="38" width="12" height="17" fill="#8C6A4F" />
      <path d="M4 62 H76 M4 70 H76" stroke="#E9DCC6" stroke-width="3" />
      <path v-for="x in [6, 22, 38, 54, 70]" :key="x" :d="`M${x} 56 V76`" stroke="#E9DCC6" stroke-width="3" stroke-linecap="round" />
      <g v-for="(p, k) in [[48, 66], [64, 60]]" :key="k" :transform="`translate(${p[0]} ${p[1]})`">
        <circle r="7" fill="#F4EFE6" /><circle cx="-4" cy="-3" r="4" fill="#F4EFE6" /><circle cx="4" cy="-4" r="4" fill="#F4EFE6" />
        <rect x="6" y="-4" width="5" height="5" rx="2" fill="#3E2F25" />
      </g>
    </g>
    <!-- pig pen -->
    <g v-else-if="type === 'pigpen'">
      <ellipse cx="44" cy="64" rx="30" ry="12" fill="#8A6A4A" />
      <path d="M4 32 L24 18 L44 32Z" fill="#8C6A4F" />
      <rect x="8" y="31" width="32" height="20" rx="2" fill="#C9684F" />
      <rect x="18" y="38" width="10" height="13" fill="#5B4636" />
      <g v-for="(p, k) in [[40, 64], [58, 60]]" :key="k" :transform="`translate(${p[0]} ${p[1]})`">
        <ellipse rx="9" ry="6" fill="#F4AEB2" />
        <ellipse cx="8" cy="0" rx="3" ry="2.6" fill="#E8898F" />
        <path d="M2 -6 L4 -9 L6 -5Z" fill="#F4AEB2" />
      </g>
      <path d="M2 74 H78" stroke="#B98C63" stroke-width="3" />
    </g>
    <!-- bunny hutch -->
    <g v-else-if="type === 'bunnyhutch'">
      <path d="M6 14 L20 4 L34 14Z" fill="#7E9A63" />
      <rect x="8" y="13" width="24" height="14" rx="2" fill="#C49A6C" />
      <rect x="13" y="16" width="14" height="9" rx="1" fill="#5B4636" />
      <path d="M10 27 V31 M30 27 V31" stroke="#8C6A4F" stroke-width="2" />
      <g transform="translate(14 34)"><ellipse rx="5" ry="3.6" fill="#FFFDF8" /><circle cx="4" cy="-2" r="2.6" fill="#FFFDF8" /><path d="M3 -4 V-9 M5 -4 V-9" stroke="#FFFDF8" stroke-width="1.6" stroke-linecap="round" /></g>
      <g transform="translate(28 35)"><ellipse rx="4.4" ry="3.2" fill="#C9A06D" /><circle cx="3.4" cy="-2" r="2.3" fill="#C9A06D" /><path d="M2.6 -4 V-8 M4.4 -4 V-8" stroke="#C9A06D" stroke-width="1.4" stroke-linecap="round" /></g>
    </g>
    <!-- duck house -->
    <g v-else-if="type === 'duckhouse'">
      <ellipse cx="26" cy="32" rx="13" ry="6" fill="#7FB2CB" />
      <path d="M2 16 L12 8 L22 16Z" fill="#5B8FC0" />
      <rect x="4" y="15" width="16" height="12" rx="1" fill="#F3E3C6" />
      <rect x="9" y="19" width="6" height="8" fill="#5B4636" />
      <g transform="translate(26 31)"><ellipse rx="5" ry="3" fill="#F6D266" /><circle cx="4" cy="-3" r="2.4" fill="#F6D266" /><path d="M6 -3 L8.5 -2.6 L6 -2Z" fill="#EE9447" /></g>
    </g>
    <!-- goat corner -->
    <g v-else-if="type === 'goats'">
      <ellipse cx="54" cy="22" rx="12" ry="8" fill="#B4AC9C" />
      <path d="M2 30 H78 M2 37 H78" stroke="#B98C63" stroke-width="2.6" />
      <path v-for="x in [4, 24, 44, 64, 76]" :key="x" :d="`M${x} 26 V40`" stroke="#8C6A4F" stroke-width="2.6" stroke-linecap="round" />
      <g v-for="(p, k) in [[22, 22], [54, 12]]" :key="k" :transform="`translate(${p[0]} ${p[1]})`">
        <rect x="-7" y="-4" width="14" height="7" rx="3" fill="#F4EFE6" />
        <rect x="5" y="-9" width="6" height="6" rx="2" fill="#F4EFE6" />
        <path d="M6 -9 L4 -13 M9 -9 L8 -13" stroke="#9C7351" stroke-width="1.2" />
        <path d="M-5 3 V7 M4 3 V7" stroke="#D9CFC0" stroke-width="1.6" />
      </g>
    </g>
    <!-- horse paddock -->
    <g v-else-if="type === 'horse'">
      <ellipse cx="40" cy="44" rx="34" ry="28" fill="#B9A27E" opacity="0.4" />
      <rect x="4" y="10" width="72" height="66" rx="6" fill="none" stroke="#FFFDF8" stroke-width="2.6" />
      <rect x="4" y="18" width="72" height="50" rx="6" fill="none" stroke="#FFFDF8" stroke-width="1.6" opacity="0.7" />
      <g transform="translate(40 44)">
        <rect x="-14" y="-6" width="26" height="11" rx="5" fill="#9C6B45" />
        <path d="M-11 5 V15 M-5 5 V15 M4 5 V15 M9 5 V15" stroke="#6B4A33" stroke-width="2.4" stroke-linecap="round" />
        <path d="M10 -4 L16 -16 L22 -14 L17 -2Z" fill="#9C6B45" />
        <path d="M11 -6 L15 -15" stroke="#4A3426" stroke-width="2.6" />
        <path d="M-14 -3 Q-20 2 -18 10" stroke="#4A3426" stroke-width="2.4" fill="none" />
      </g>
    </g>
    <g v-else-if="type === 'goldencan'">
      <ellipse cx="20" cy="37" rx="12" ry="2.6" fill="#4F6B3E" opacity="0.25" />
      <rect x="14" y="30" width="12" height="7" rx="1.5" fill="#B9927A" />
      <circle cx="20" cy="12" r="13" fill="#FBE3A0" opacity="0.35" />
      <path d="M10 14 H26 L24 30 H12Z" fill="#F2C66B" stroke="#C9952F" stroke-width="1.4" stroke-linejoin="round" />
      <path d="M26 17 L35 9 L37 11 L28 20" fill="#F2C66B" stroke="#C9952F" stroke-width="1.3" stroke-linejoin="round" />
      <path d="M12 12 Q18 2 25 12" stroke="#C9952F" stroke-width="2" fill="none" stroke-linecap="round" />
      <path d="M14 18 H22" stroke="#FFF3C4" stroke-width="2" stroke-linecap="round" />
      <circle cx="36" cy="6" r="1.4" fill="#fff" /><circle cx="6" cy="10" r="1.2" fill="#fff" />
    </g>
    <g v-else-if="type === 'gazebo'">
      <ellipse cx="40" cy="70" rx="34" ry="8" fill="#E6DCCB" />
      <path d="M14 70 V30 M66 70 V30 M30 72 V34 M50 72 V34" stroke="#FFFDF8" stroke-width="4" stroke-linecap="round" />
      <path d="M6 32 L40 2 L74 32Z" fill="#9CB5C4" />
      <path d="M6 32 Q23 40 40 32 Q57 40 74 32" stroke="#FFFDF8" stroke-width="3" fill="none" />
      <circle cx="40" cy="0" r="3" fill="#F2C66B" />
      <path d="M14 56 H66" stroke="#FFFDF8" stroke-width="2.4" />
    </g>
  </g>
</template>

<style scoped>
.spin {
  animation: spin 3s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.buzz {
  animation: buzz 1.4s ease-in-out infinite alternate;
}
@keyframes buzz {
  from { transform: translate(-1px, 1px); }
  to { transform: translate(1px, -2px); }
}
.smoke circle {
  animation: smoke 2.4s ease-out infinite;
}
.smoke circle:nth-child(2) { animation-delay: 0.8s; }
.smoke circle:nth-child(3) { animation-delay: 1.6s; }
@keyframes smoke {
  0% { opacity: 0; transform: translateY(6px); }
  30% { opacity: 0.8; }
  100% { opacity: 0; transform: translateY(-8px); }
}
.glow {
  animation: glow 3s ease-in-out infinite;
}
@keyframes glow {
  50% { opacity: 0.2; }
}
.flame {
  transform-origin: 20px 28px;
  animation: flame 0.6s ease-in-out infinite alternate;
}
@keyframes flame {
  to { transform: scale(0.92, 1.08) skewX(3deg); }
}
.swing-seat {
  transform-origin: 20px -8px;
  animation: swing 3s ease-in-out infinite alternate;
}
@keyframes swing {
  from { transform: rotate(-6deg); }
  to { transform: rotate(6deg); }
}
.water path {
  stroke-dasharray: 4 4;
  animation: water 0.8s linear infinite;
}
@keyframes water {
  to { stroke-dashoffset: -8; }
}
.zzz {
  animation: zzz 2.6s ease-in-out infinite;
}
@keyframes zzz {
  0% { opacity: 0; transform: translateY(4px); }
  50% { opacity: 0.9; }
  100% { opacity: 0; transform: translateY(-6px); }
}
.twinkle circle {
  animation: glow 1.8s ease-in-out infinite;
}
.twinkle circle:nth-child(2) { animation-delay: 0.6s; }
.twinkle circle:nth-child(3) { animation-delay: 1.2s; }
.sway {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: sway 3.2s ease-in-out infinite alternate;
}
@keyframes sway {
  from { transform: rotate(-2.5deg); }
  to { transform: rotate(2.5deg); }
}
.tree-sway {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: tree-sway 5s ease-in-out infinite alternate;
}
@keyframes tree-sway {
  from { transform: rotate(-1.5deg); }
  to { transform: rotate(1.5deg); }
}
.ripe path {
  transform-box: fill-box;
  transform-origin: center;
  animation: ripe 1.6s ease-in-out infinite;
}
.ripe path:nth-child(2) { animation-delay: 0.8s; }
@keyframes ripe {
  0%, 100% { opacity: 0; transform: scale(0.4); }
  50% { opacity: 1; transform: scale(1); }
}
</style>
