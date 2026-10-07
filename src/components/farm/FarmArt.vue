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
})

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
      <rect x="2" y="3" width="36" height="35" rx="8" :fill="wetSoil ? '#6F4E37' : '#8E6446'" />
      <rect x="2" y="3" width="36" height="31" rx="8" :fill="wetSoil ? '#82603F' : '#A77A57'" />
      <g :stroke="wetSoil ? '#6A4932' : '#8E6446'" stroke-width="2" stroke-linecap="round" opacity="0.7">
        <path d="M8 12 H32 M8 20 H32 M8 28 H32" />
      </g>
      <g v-if="stage === 0" fill="#5B3F2B">
        <circle cx="12" cy="16" r="1.6" /><circle cx="20" cy="24" r="1.6" /><circle cx="28" cy="16" r="1.6" /><circle cx="14" cy="28" r="1.4" /><circle cx="27" cy="28" r="1.4" />
      </g>
      <g v-else-if="stage === 1">
        <g v-for="x in [11, 20, 29]" :key="x" :transform="`translate(${x} ${x === 20 ? 26 : 20})`">
          <path d="M0 4 V-3" stroke="#6E9E5C" stroke-width="1.6" stroke-linecap="round" />
          <path d="M0 -2 C-2 -6 -6 -6 -6 -4 C-5 -1 -2 -1 0 -2Z M0 -3 C2 -7 6 -7 6 -5 C5 -2 2 -2 0 -3Z" fill="#9CC584" />
        </g>
      </g>
      <g v-else>
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
    </g>

    <!-- ================= trees ================= -->
    <g v-else-if="tree" :transform="`translate(20 36) scale(${treeScale}) translate(-20 -36)`">
      <ellipse cx="20" cy="36" rx="13" ry="3.5" fill="#4F6B3E" opacity="0.25" />
      <path d="M17 36 L18 10 L22 10 L23 36Z" fill="#9C7351" />
      <path d="M20 18 L12 8 M20 14 L28 6" stroke="#9C7351" stroke-width="2.4" stroke-linecap="round" />
      <g>
        <circle cx="20" cy="-6" r="15" :fill="TREE_LEAF[type][0]" />
        <circle cx="9" cy="2" r="11" :fill="TREE_LEAF[type][1]" />
        <circle cx="31" cy="2" r="11" :fill="TREE_LEAF[type][1]" />
        <circle cx="20" cy="6" r="11" :fill="TREE_LEAF[type][0]" />
        <circle cx="15" cy="-12" r="5" fill="#fff" opacity="0.18" />
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
      <path d="M2 32 L40 -2 L78 32" stroke="#F6EFE2" stroke-width="5" fill="none" stroke-linejoin="round" stroke-linecap="round" />
      <path d="M2 32 L40 -2 L78 32 L74 30 L40 4 L6 30Z" fill="#8E3C33" opacity="0.4" />
      <rect x="26" y="44" width="28" height="32" fill="#A84438" />
      <path d="M26 44 L54 76 M54 44 L26 76" stroke="#F6EFE2" stroke-width="2.4" />
      <rect x="26" y="44" width="28" height="32" fill="none" stroke="#F6EFE2" stroke-width="2.4" />
      <rect x="33" y="20" width="14" height="12" rx="2" fill="#F6EFE2" />
      <path d="M33 26 H47 M40 20 V32" stroke="#C9584A" stroke-width="1.6" />
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
      <rect x="14" y="44" width="14" height="13" rx="3" :fill="busy ? '#FBE3A0' : '#CFE1EA'" stroke="#B9927A" stroke-width="2" />
      <rect x="52" y="44" width="14" height="13" rx="3" :fill="busy ? '#FBE3A0' : '#CFE1EA'" stroke="#B9927A" stroke-width="2" />
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
      <circle cx="20" cy="-2" r="11" fill="#FBE3A0" opacity="0.35" />
      <path d="M14 -6 H26 L24 4 H16Z" fill="#FBE3A0" stroke="#4A4E5A" stroke-width="1.6" />
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
</style>
