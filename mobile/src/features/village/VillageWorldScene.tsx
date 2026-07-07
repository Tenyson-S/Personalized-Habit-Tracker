import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  DimensionValue,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from 'react-native-svg';
import type { VillageBuilding, VillageWorld } from '../../types/api';

const VIEWBOX_WIDTH = 360;
const VIEWBOX_HEIGHT = 520;

type ScenePalette = {
  skyTop: string;
  skyBottom: string;
  horizon: string;
  hillFar: string;
  hillNear: string;
  groundTop: string;
  groundBottom: string;
  path: string;
  pathHighlight: string;
  water: string;
  waterLight: string;
  outline: string;
  foliage: string;
  foliageLight: string;
  foliageDark: string;
  trunk: string;
  wall: string;
  roof: string;
  roofDark: string;
  window: string;
  shadow: string;
  hud: string;
  hudText: string;
};

const positions: Record<string, { x: number; y: number; width: number; height: number }> = {
  LIBRARY: { x: 65, y: 230, width: 82, height: 86 },
  OBSERVATORY: { x: 292, y: 174, width: 82, height: 92 },
  FARM: { x: 61, y: 363, width: 92, height: 88 },
  HEARTH: { x: 176, y: 310, width: 86, height: 94 },
  GARDEN: { x: 291, y: 338, width: 92, height: 88 },
  WORKSHOP: { x: 107, y: 442, width: 92, height: 84 },
  TOWN_SQUARE: { x: 248, y: 442, width: 98, height: 84 },
  CENTRAL_TREE: { x: 178, y: 201, width: 98, height: 108 },
  WINDMILL: { x: 323, y: 258, width: 74, height: 102 },
};

function paletteFor(world: VillageWorld): ScenePalette {
  const time = world.environment.time_of_day;
  const weather = world.environment.weather;

  let palette: ScenePalette;
  if (time === 'NIGHT') {
    palette = {
      skyTop: '#22363D', skyBottom: '#526A63', horizon: '#70877B',
      hillFar: '#526D65', hillNear: '#617B68', groundTop: '#78946F', groundBottom: '#668461',
      path: '#B9A987', pathHighlight: '#CDBD9D', water: '#557F89', waterLight: '#8CB2B3',
      outline: '#34483F', foliage: '#557A56', foliageLight: '#6E9566', foliageDark: '#456747',
      trunk: '#705C46', wall: '#D8D0B3', roof: '#8A6755', roofDark: '#6D5145',
      window: '#F5D58A', shadow: 'rgba(28,45,39,0.24)', hud: 'rgba(241,236,218,0.90)', hudText: '#30423A',
    };
  } else if (time === 'DUSK') {
    palette = {
      skyTop: '#A88EA9', skyBottom: '#EDC09A', horizon: '#D8C4A4',
      hillFar: '#8E9A78', hillNear: '#84946C', groundTop: '#91AC72', groundBottom: '#7E9B68',
      path: '#D2BF93', pathHighlight: '#E0CDA5', water: '#6C9EA7', waterLight: '#A8C5C2',
      outline: '#465348', foliage: '#65855B', foliageLight: '#86A56E', foliageDark: '#536F4F',
      trunk: '#755B43', wall: '#EEE3C8', roof: '#A46151', roofDark: '#814C44',
      window: '#F7D98C', shadow: 'rgba(47,58,49,0.18)', hud: 'rgba(255,249,233,0.91)', hudText: '#37463D',
    };
  } else if (time === 'DAWN') {
    palette = {
      skyTop: '#E9BFA2', skyBottom: '#F5E8C8', horizon: '#D8D7B0',
      hillFar: '#A0AF81', hillNear: '#91A874', groundTop: '#9DB87A', groundBottom: '#86A56D',
      path: '#D7C298', pathHighlight: '#E6D2AB', water: '#73A8AE', waterLight: '#B4D0CA',
      outline: '#465448', foliage: '#6C915F', foliageLight: '#91B173', foliageDark: '#58794F',
      trunk: '#7A6048', wall: '#F1E7CC', roof: '#A86653', roofDark: '#824E43',
      window: '#F7D58A', shadow: 'rgba(47,58,49,0.16)', hud: 'rgba(255,251,237,0.93)', hudText: '#37463D',
    };
  } else {
    palette = {
      skyTop: '#9DCED4', skyBottom: '#DFEBCF', horizon: '#C8D8AF',
      hillFar: '#9AB282', hillNear: '#89A971', groundTop: '#9FBD7C', groundBottom: '#88A96E',
      path: '#D9C59A', pathHighlight: '#E7D5AE', water: '#69A9B1', waterLight: '#B4D5D0',
      outline: '#425248', foliage: '#67915B', foliageLight: '#91B96F', foliageDark: '#52784B',
      trunk: '#785D43', wall: '#F1E8CE', roof: '#A55F4F', roofDark: '#804940',
      window: '#F4D080', shadow: 'rgba(47,58,49,0.16)', hud: 'rgba(255,252,240,0.93)', hudText: '#37463D',
    };
  }

  if (weather === 'MISTY') {
    return { ...palette, skyTop: '#B7C8C3', skyBottom: '#DCE1D3', groundTop: '#98AC84', groundBottom: '#879E79' };
  }
  if (weather === 'DRIZZLE') {
    return { ...palette, skyTop: '#879FA4', skyBottom: '#C8D3C5', groundTop: '#839F79', groundBottom: '#718D6E' };
  }
  if (weather === 'GOLDEN' && time !== 'NIGHT') {
    return { ...palette, skyTop: '#D5B977', skyBottom: '#F2E0AE', horizon: '#E6D1A2' };
  }
  return palette;
}

function Tree({ x, y, scale = 1, palette }: { x: number; y: number; scale?: number; palette: ScenePalette }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      <Ellipse cx="0" cy="10" rx="16" ry="5" fill={palette.shadow} />
      <Rect x="-3" y="-10" width="6" height="23" rx="3" fill={palette.trunk} />
      <Circle cx="-8" cy="-15" r="10" fill={palette.foliageDark} />
      <Circle cx="7" cy="-17" r="12" fill={palette.foliage} />
      <Circle cx="0" cy="-25" r="13" fill={palette.foliageLight} />
    </G>
  );
}

function SeedPlot({ x, y, palette }: { x: number; y: number; palette: ScenePalette }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Ellipse cx="0" cy="8" rx="25" ry="10" fill={palette.shadow} />
      <Ellipse cx="0" cy="2" rx="22" ry="9" fill="#8A7658" opacity="0.62" />
      <Path d="M0 3 C-2 -7 1 -13 5 -18" stroke={palette.foliageDark} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <Ellipse cx="8" cy="-17" rx="6" ry="3.5" fill={palette.foliageLight} transform="rotate(-24 8 -17)" />
      <Ellipse cx="-1" cy="-10" rx="5" ry="3" fill={palette.foliage} transform="rotate(28 -1 -10)" />
    </G>
  );
}

function SelectedHalo({ x, y, palette }: { x: number; y: number; palette: ScenePalette }) {
  return <Ellipse cx={x} cy={y + 8} rx="42" ry="24" fill={palette.window} opacity="0.18" stroke={palette.window} strokeWidth="2" />;
}

function Library({ x, y, level, palette }: { x: number; y: number; level: number; palette: ScenePalette }) {
  const scale = 0.82 + level * 0.055;
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      <Ellipse cx="0" cy="18" rx="34" ry="10" fill={palette.shadow} />
      <Rect x="-28" y="-18" width="56" height="38" rx="4" fill={palette.wall} stroke={palette.outline} strokeWidth="2.2" />
      <Polygon points="-33,-18 0,-42 33,-18" fill={palette.roof} stroke={palette.outline} strokeWidth="2.2" />
      <Rect x="-7" y="0" width="14" height="20" rx="3" fill={palette.roofDark} />
      <Rect x="-21" y="-9" width="10" height="10" rx="2" fill={palette.window} stroke={palette.outline} strokeWidth="1.5" />
      <Rect x="11" y="-9" width="10" height="10" rx="2" fill={palette.window} stroke={palette.outline} strokeWidth="1.5" />
      {level >= 2 && <><Rect x="-4" y="-34" width="8" height="8" rx="1" fill={palette.window} /><Line x1="0" y1="-34" x2="0" y2="-26" stroke={palette.outline} strokeWidth="1" /></>}
      {level >= 3 && <><Rect x="-37" y="-5" width="10" height="24" rx="2" fill={palette.wall} stroke={palette.outline} strokeWidth="2" /><Rect x="27" y="-5" width="10" height="24" rx="2" fill={palette.wall} stroke={palette.outline} strokeWidth="2" /></>}
      {level >= 4 && <><Circle cx="-30" cy="20" r="3" fill="#E5B65F" /><Circle cx="31" cy="20" r="3" fill="#D98C6D" /></>}
    </G>
  );
}

function Observatory({ x, y, level, palette }: { x: number; y: number; level: number; palette: ScenePalette }) {
  const scale = 0.84 + level * 0.05;
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      <Ellipse cx="0" cy="18" rx="31" ry="9" fill={palette.shadow} />
      <Rect x="-25" y="-10" width="50" height="30" rx="7" fill={palette.wall} stroke={palette.outline} strokeWidth="2.2" />
      <Path d="M-25 -10 A25 23 0 0 1 25 -10 Z" fill="#9BAEAA" stroke={palette.outline} strokeWidth="2.2" />
      <Line x1="0" y1="-33" x2="0" y2="-10" stroke={palette.outline} strokeWidth="2" />
      <Line x1="5" y1="-29" x2="28" y2="-45" stroke={palette.outline} strokeWidth="5" strokeLinecap="round" />
      <Circle cx="30" cy="-47" r="6" fill="#7D918F" stroke={palette.outline} strokeWidth="2" />
      <Rect x="-6" y="5" width="12" height="15" rx="3" fill={palette.roofDark} />
      {level >= 2 && <Circle cx="-12" cy="-3" r="4" fill={palette.window} />}
      {level >= 3 && <><Line x1="-26" y1="10" x2="-35" y2="18" stroke={palette.outline} strokeWidth="2" /><Circle cx="-38" cy="20" r="4" fill={palette.window} /></>}
      {level >= 4 && <Circle cx="17" cy="-14" r="2.5" fill={palette.window} />}
    </G>
  );
}

function Farm({ x, y, level, palette }: { x: number; y: number; level: number; palette: ScenePalette }) {
  const scale = 0.84 + level * 0.05;
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      <Ellipse cx="0" cy="20" rx="38" ry="10" fill={palette.shadow} />
      <Path d="M-38 10 C-20 4 18 4 38 10" stroke="#8A6E4F" strokeWidth="3" fill="none" opacity="0.75" />
      <Path d="M-34 17 C-18 12 18 12 34 17" stroke="#8A6E4F" strokeWidth="3" fill="none" opacity="0.65" />
      <Rect x="-22" y="-16" width="44" height="36" rx="3" fill="#C97A59" stroke={palette.outline} strokeWidth="2.2" />
      <Polygon points="-27,-16 0,-36 27,-16" fill={palette.roofDark} stroke={palette.outline} strokeWidth="2.2" />
      <Rect x="-8" y="1" width="16" height="19" rx="2" fill="#7D5744" />
      <Path d="M-8 1 L8 20 M8 1 L-8 20" stroke="#C9A276" strokeWidth="1.6" />
      {level >= 2 && <><Circle cx="-30" cy="7" r="3" fill="#E5C364" /><Circle cx="29" cy="8" r="3" fill="#E5C364" /></>}
      {level >= 3 && <><Rect x="26" y="-8" width="9" height="28" rx="2" fill={palette.wall} stroke={palette.outline} strokeWidth="1.8" /><Line x1="30" y1="-8" x2="30" y2="-23" stroke={palette.outline} strokeWidth="2" /></>}
      {level >= 4 && <Path d="M-44 0 C-50 -8 -52 -16 -50 -24 M-44 0 C-38 -8 -37 -16 -39 -24" stroke={palette.foliageLight} strokeWidth="2.5" fill="none" />}
    </G>
  );
}

function Hearth({ x, y, level, palette }: { x: number; y: number; level: number; palette: ScenePalette }) {
  const scale = 0.84 + level * 0.05;
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      <Ellipse cx="0" cy="20" rx="35" ry="10" fill={palette.shadow} />
      <Rect x="-28" y="-15" width="56" height="37" rx="5" fill={palette.wall} stroke={palette.outline} strokeWidth="2.2" />
      <Polygon points="-34,-15 0,-40 34,-15" fill={palette.roof} stroke={palette.outline} strokeWidth="2.2" />
      <Rect x="-18" y="-35" width="9" height="21" rx="2" fill={palette.roofDark} stroke={palette.outline} strokeWidth="1.7" />
      <Rect x="-7" y="1" width="14" height="21" rx="4" fill={palette.roofDark} />
      <Rect x="-22" y="-6" width="10" height="10" rx="2" fill={palette.window} />
      <Rect x="12" y="-6" width="10" height="10" rx="2" fill={palette.window} />
      {level >= 2 && <Path d="M-31 21 Q0 29 31 21" stroke="#7A654D" strokeWidth="2" fill="none" />}
      {level >= 3 && <><Circle cx="-34" cy="20" r="4" fill="#D9A565" /><Circle cx="34" cy="20" r="4" fill="#D98D70" /></>}
      {level >= 4 && <><Circle cx="-14" cy="-45" r="4" fill="#D8E0D8" opacity="0.45" /><Circle cx="-9" cy="-54" r="5" fill="#D8E0D8" opacity="0.34" /></>}
    </G>
  );
}

function Garden({ x, y, level, palette }: { x: number; y: number; level: number; palette: ScenePalette }) {
  const scale = 0.86 + level * 0.05;
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      <Ellipse cx="0" cy="13" rx="37" ry="14" fill={palette.shadow} />
      <Ellipse cx="0" cy="5" rx="33" ry="16" fill="#789D66" stroke={palette.outline} strokeWidth="2" />
      <Path d="M-28 7 Q0 -8 28 7" stroke="#D7C59A" strokeWidth="6" fill="none" strokeLinecap="round" />
      <Circle cx="-19" cy="0" r="5" fill={palette.foliageLight} />
      <Circle cx="18" cy="1" r="6" fill={palette.foliageLight} />
      <Circle cx="-11" cy="11" r="3" fill="#E3AE70" />
      <Circle cx="9" cy="-4" r="3" fill="#D98D72" />
      {level >= 2 && <><Rect x="-5" y="-17" width="10" height="20" rx="3" fill={palette.trunk} /><Circle cx="0" cy="-22" r="11" fill={palette.foliage} /></>}
      {level >= 3 && <><Circle cx="25" cy="11" r="2.5" fill="#E8D36D" /><Circle cx="-25" cy="9" r="2.5" fill="#D99A78" /></>}
      {level >= 4 && <Path d="M-11 -18 Q0 -30 11 -18" stroke={palette.window} strokeWidth="2" fill="none" />}
    </G>
  );
}

function Workshop({ x, y, level, palette }: { x: number; y: number; level: number; palette: ScenePalette }) {
  const scale = 0.84 + level * 0.05;
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      <Ellipse cx="0" cy="18" rx="35" ry="10" fill={palette.shadow} />
      <Rect x="-28" y="-16" width="56" height="38" rx="4" fill="#D7B37F" stroke={palette.outline} strokeWidth="2.2" />
      <Polygon points="-34,-16 -17,-34 0,-16 17,-34 34,-16" fill={palette.roofDark} stroke={palette.outline} strokeWidth="2.2" />
      <Rect x="-7" y="1" width="14" height="21" rx="3" fill="#7B5A45" />
      <Circle cx="-18" cy="-3" r="6" fill={palette.window} stroke={palette.outline} strokeWidth="1.5" />
      <Path d="M-18 -8 L-18 2 M-23 -3 L-13 -3" stroke={palette.outline} strokeWidth="1" />
      {level >= 2 && <Rect x="11" y="-7" width="12" height="10" rx="2" fill="#B56E55" />}
      {level >= 3 && <><Line x1="31" y1="6" x2="42" y2="-2" stroke={palette.outline} strokeWidth="3" /><Circle cx="44" cy="-4" r="4" fill="#C7A068" /></>}
      {level >= 4 && <Circle cx="-30" cy="22" r="3" fill="#E6C56E" />}
    </G>
  );
}

function TownSquare({ x, y, level, palette }: { x: number; y: number; level: number; palette: ScenePalette }) {
  const scale = 0.84 + level * 0.05;
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      <Ellipse cx="0" cy="12" rx="40" ry="15" fill="#C9B88F" opacity="0.75" stroke={palette.outline} strokeWidth="1.8" />
      <Ellipse cx="0" cy="4" rx="16" ry="8" fill={palette.water} stroke={palette.outline} strokeWidth="2" />
      <Rect x="-4" y="-10" width="8" height="15" rx="3" fill="#D9D0B8" stroke={palette.outline} strokeWidth="1.6" />
      <Circle cx="0" cy="-12" r="5" fill={palette.waterLight} />
      {level >= 2 && <><Rect x="-34" y="4" width="13" height="5" rx="2" fill={palette.trunk} /><Rect x="21" y="4" width="13" height="5" rx="2" fill={palette.trunk} /></>}
      {level >= 3 && <><Line x1="-31" y1="-5" x2="-31" y2="10" stroke={palette.outline} strokeWidth="2" /><Circle cx="-31" cy="-8" r="3" fill={palette.window} /><Line x1="31" y1="-5" x2="31" y2="10" stroke={palette.outline} strokeWidth="2" /><Circle cx="31" cy="-8" r="3" fill={palette.window} /></>}
      {level >= 4 && <><Circle cx="-18" cy="15" r="3" fill="#D98E74" /><Circle cx="18" cy="15" r="3" fill="#E4C867" /></>}
    </G>
  );
}

function CentralTree({ x, y, level, palette }: { x: number; y: number; level: number; palette: ScenePalette }) {
  if (level === 0) {
    return (
      <G transform={`translate(${x} ${y})`}>
        <Ellipse cx="0" cy="24" rx="26" ry="9" fill={palette.shadow} />
        <Path d="M0 22 C-2 7 0 -6 4 -18" stroke={palette.trunk} strokeWidth="6" fill="none" strokeLinecap="round" />
        <Circle cx="4" cy="-20" r="10" fill={palette.foliageLight} />
        <Circle cx="-5" cy="-12" r="8" fill={palette.foliage} />
      </G>
    );
  }
  const scale = 0.80 + level * 0.09;
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      <Ellipse cx="0" cy="29" rx="39" ry="12" fill={palette.shadow} />
      <Path d="M-5 28 C-8 4 -5 -13 0 -35 C7 -15 9 3 6 28 Z" fill={palette.trunk} stroke={palette.outline} strokeWidth="2" />
      <Circle cx="-20" cy="-27" r="20" fill={palette.foliageDark} />
      <Circle cx="21" cy="-28" r="22" fill={palette.foliage} />
      <Circle cx="0" cy="-48" r="24" fill={palette.foliageLight} />
      <Circle cx="-5" cy="-25" r="22" fill={palette.foliage} />
      {level >= 2 && <><Circle cx="-31" cy="-11" r="11" fill={palette.foliageLight} /><Circle cx="32" cy="-9" r="12" fill={palette.foliageDark} /></>}
      {level >= 3 && <><Circle cx="-16" cy="-50" r="3" fill="#E5C56A" /><Circle cx="16" cy="-43" r="3" fill="#D98C70" /></>}
      {level >= 4 && <><Circle cx="-33" cy="-31" r="2.5" fill={palette.window} /><Circle cx="28" cy="-43" r="2.5" fill={palette.window} /><Circle cx="3" cy="-66" r="2.5" fill={palette.window} /></>}
    </G>
  );
}

function Windmill({ x, y, level, palette }: { x: number; y: number; level: number; palette: ScenePalette }) {
  const scale = 0.83 + level * 0.05;
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      <Ellipse cx="0" cy="26" rx="29" ry="9" fill={palette.shadow} />
      <Path d="M-17 24 L-11 -24 L11 -24 L17 24 Z" fill={palette.wall} stroke={palette.outline} strokeWidth="2.2" />
      <Polygon points="-15,-24 0,-39 15,-24" fill={palette.roofDark} stroke={palette.outline} strokeWidth="2.2" />
      <Circle cx="0" cy="-15" r="5" fill="#B98B62" stroke={palette.outline} strokeWidth="2" />
      <Line x1="0" y1="-15" x2="0" y2="-49" stroke={palette.outline} strokeWidth="4" strokeLinecap="round" />
      <Line x1="0" y1="-15" x2="31" y2="-15" stroke={palette.outline} strokeWidth="4" strokeLinecap="round" />
      <Line x1="0" y1="-15" x2="0" y2="19" stroke={palette.outline} strokeWidth="4" strokeLinecap="round" />
      <Line x1="0" y1="-15" x2="-31" y2="-15" stroke={palette.outline} strokeWidth="4" strokeLinecap="round" />
      <Rect x="-5" y="8" width="10" height="16" rx="3" fill={palette.roofDark} />
      {level >= 2 && <Circle cx="0" cy="-2" r="3" fill={palette.window} />}
      {level >= 3 && <><Circle cx="-22" cy="24" r="3" fill="#E5C66E" /><Circle cx="23" cy="24" r="3" fill="#D98E72" /></>}
    </G>
  );
}

function BuildingArt({ building, palette, selected }: { building: VillageBuilding; palette: ScenePalette; selected: boolean }) {
  const position = positions[building.key] ?? { x: 180, y: 300, width: 80, height: 80 };
  if (selected) {
    return (
      <G>
        <SelectedHalo x={position.x} y={position.y} palette={palette} />
        <BuildingArt building={building} palette={palette} selected={false} />
      </G>
    );
  }
  if (!building.unlocked && building.key !== 'CENTRAL_TREE') {
    return <SeedPlot x={position.x} y={position.y} palette={palette} />;
  }

  const props = { x: position.x, y: position.y, level: building.level, palette };
  switch (building.key) {
    case 'LIBRARY': return <Library {...props} />;
    case 'OBSERVATORY': return <Observatory {...props} />;
    case 'FARM': return <Farm {...props} />;
    case 'HEARTH': return <Hearth {...props} />;
    case 'GARDEN': return <Garden {...props} />;
    case 'WORKSHOP': return <Workshop {...props} />;
    case 'TOWN_SQUARE': return <TownSquare {...props} />;
    case 'CENTRAL_TREE': return <CentralTree {...props} />;
    case 'WINDMILL': return <Windmill {...props} />;
    default: return <SeedPlot x={position.x} y={position.y} palette={palette} />;
  }
}

function SkyDetails({ world, palette }: { world: VillageWorld; palette: ScenePalette }) {
  const isNight = world.environment.time_of_day === 'NIGHT';
  const lively = world.environment.state === 'LIVELY' || world.environment.state === 'BLOOMING';
  return (
    <G>
      {isNight ? (
        <>
          <Circle cx="296" cy="58" r="22" fill="#F1E9D1" opacity="0.94" />
          <Circle cx="304" cy="50" r="20" fill={palette.skyTop} />
          {[28, 67, 112, 147, 226, 252, 332].map((x, index) => <Circle key={x} cx={x} cy={22 + (index % 3) * 21} r={index % 2 ? 1.4 : 1.9} fill="#F5EECF" opacity="0.78" />)}
        </>
      ) : (
        <Circle cx="296" cy="58" r="24" fill={world.environment.weather === 'GOLDEN' ? '#F3C96C' : '#F2D88B'} opacity="0.92" />
      )}
      {lively && !isNight && (
        <>
          <Path d="M40 70 q7 -7 14 0 q7 -7 14 0" stroke={palette.outline} strokeWidth="1.7" fill="none" opacity="0.6" />
          <Path d="M103 47 q5 -5 10 0 q5 -5 10 0" stroke={palette.outline} strokeWidth="1.4" fill="none" opacity="0.5" />
        </>
      )}
      {world.environment.weather === 'DRIZZLE' && [18, 48, 78, 110, 142, 176, 214, 250, 287, 324].map((x, index) => (
        <Line key={x} x1={x} y1={92 + (index % 3) * 10} x2={x - 4} y2={103 + (index % 3) * 10} stroke="#E8F1EE" strokeWidth="1.5" opacity="0.7" />
      ))}
    </G>
  );
}

function Terrain({ world, palette }: { world: VillageWorld; palette: ScenePalette }) {
  const unlocks = new Set(world.unlocks.map((item) => item.key));
  const hasFlowers = world.environment.rhythm_score >= 60;
  return (
    <>
      <Defs>
        <LinearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.skyTop} />
          <Stop offset="1" stopColor={palette.skyBottom} />
        </LinearGradient>
        <LinearGradient id="groundGradient" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.groundTop} />
          <Stop offset="1" stopColor={palette.groundBottom} />
        </LinearGradient>
      </Defs>
      <Rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="url(#skyGradient)" />
      <SkyDetails world={world} palette={palette} />
      <Path d="M0 126 C54 95 107 104 156 128 C211 97 272 91 360 129 L360 180 L0 180 Z" fill={palette.hillFar} opacity="0.72" />
      <Path d="M0 154 C70 119 122 135 183 161 C243 125 303 126 360 151 L360 194 L0 194 Z" fill={palette.hillNear} opacity="0.9" />
      <Rect x="0" y="153" width={VIEWBOX_WIDTH} height="367" fill="url(#groundGradient)" />

      <Path d="M176 520 C177 465 161 435 173 397 C189 348 197 319 178 282 C166 257 166 224 179 194" stroke={palette.path} strokeWidth="34" fill="none" strokeLinecap="round" />
      <Path d="M176 314 C132 307 99 276 67 238" stroke={palette.path} strokeWidth="28" fill="none" strokeLinecap="round" />
      <Path d="M179 278 C224 252 264 218 292 180" stroke={palette.path} strokeWidth="27" fill="none" strokeLinecap="round" />
      <Path d="M171 396 C118 385 87 373 61 365" stroke={palette.path} strokeWidth="28" fill="none" strokeLinecap="round" />
      <Path d="M177 392 C222 379 258 357 291 340" stroke={palette.path} strokeWidth="27" fill="none" strokeLinecap="round" />
      <Path d="M175 457 C143 452 124 446 108 440" stroke={palette.path} strokeWidth="24" fill="none" strokeLinecap="round" />
      <Path d="M181 456 C208 452 228 446 248 441" stroke={palette.path} strokeWidth="24" fill="none" strokeLinecap="round" />

      <Path d="M176 520 C177 465 161 435 173 397 C189 348 197 319 178 282 C166 257 166 224 179 194" stroke={palette.pathHighlight} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.55" />

      <Path d="M-20 493 C53 469 95 486 150 479 C211 471 270 450 380 476 L380 540 L-20 540 Z" fill={palette.water} />
      <Path d="M-20 495 C55 476 102 493 153 485 C220 475 275 460 380 483" stroke={palette.waterLight} strokeWidth="3" fill="none" opacity="0.62" />

      {unlocks.has('POND') && (
        <G>
          <Ellipse cx="303" cy="294" rx="28" ry="15" fill={palette.water} stroke={palette.outline} strokeWidth="1.8" />
          <Path d="M286 294 Q303 286 320 294" stroke={palette.waterLight} strokeWidth="2" fill="none" opacity="0.6" />
        </G>
      )}
      {unlocks.has('WOODEN_BRIDGE') && (
        <G transform="translate(184 483) rotate(-7)">
          <Rect x="-27" y="-8" width="54" height="16" rx="3" fill="#9C704D" stroke={palette.outline} strokeWidth="1.6" />
          {[-18, -9, 0, 9, 18].map((x) => <Line key={x} x1={x} y1="-7" x2={x} y2="7" stroke="#6F523F" strokeWidth="1" />)}
        </G>
      )}

      <Tree x={28} y={204} scale={0.82} palette={palette} />
      <Tree x={22} y={302} scale={0.68} palette={palette} />
      <Tree x={337} y={208} scale={0.76} palette={palette} />
      <Tree x={340} y={384} scale={0.75} palette={palette} />
      <Tree x={18} y={431} scale={0.72} palette={palette} />
      <Tree x={337} y={455} scale={0.62} palette={palette} />
      <Tree x={125} y={170} scale={0.58} palette={palette} />
      <Tree x={233} y={173} scale={0.56} palette={palette} />

      {unlocks.has('ORCHARD') && (
        <G>
          <Tree x={316} y={396} scale={0.58} palette={palette} />
          <Tree x={334} y={412} scale={0.52} palette={palette} />
          <Circle cx="310" cy="382" r="2.6" fill="#C86E59" />
          <Circle cx="330" cy="397" r="2.6" fill="#C86E59" />
        </G>
      )}

      {unlocks.has('BIRDHOUSE') && (
        <G transform="translate(116 274)">
          <Line x1="0" y1="0" x2="0" y2="22" stroke={palette.trunk} strokeWidth="2.5" />
          <Rect x="-6" y="-8" width="12" height="10" rx="2" fill="#C5835C" stroke={palette.outline} strokeWidth="1.3" />
          <Polygon points="-8,-8 0,-14 8,-8" fill={palette.roofDark} />
          <Circle cx="0" cy="-4" r="2" fill={palette.outline} />
        </G>
      )}

      {unlocks.has('GOAT') && (
        <G transform="translate(94 386)">
          <Ellipse cx="0" cy="0" rx="9" ry="5" fill="#EFE6D1" stroke={palette.outline} strokeWidth="1.2" />
          <Circle cx="9" cy="-2" r="4" fill="#EFE6D1" stroke={palette.outline} strokeWidth="1.2" />
          <Line x1="-5" y1="4" x2="-6" y2="10" stroke={palette.outline} strokeWidth="1.2" />
          <Line x1="5" y1="4" x2="5" y2="10" stroke={palette.outline} strokeWidth="1.2" />
        </G>
      )}

      {hasFlowers && [
        [44, 274], [79, 291], [139, 345], [225, 317], [325, 309], [40, 410], [299, 409], [145, 466],
      ].map(([x, y], index) => <Circle key={`${x}-${y}`} cx={x} cy={y} r="2.4" fill={index % 2 ? '#E7C863' : '#D98F75'} opacity="0.9" />)}

      {world.environment.weather === 'MISTY' && (
        <>
          <Ellipse cx="95" cy="267" rx="110" ry="30" fill="#F4F4E9" opacity="0.14" />
          <Ellipse cx="285" cy="389" rx="120" ry="34" fill="#F4F4E9" opacity="0.12" />
        </>
      )}
    </>
  );
}

function Cloud({ delay = 0, top = 70, opacity = 0.55 }: { delay?: number; top?: number; opacity?: number }) {
  const translate = useRef(new Animated.Value(-90)).current;
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(translate, { toValue: 410, duration: 24000, useNativeDriver: true }),
        Animated.timing(translate, { toValue: -90, duration: 1, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [delay, translate]);

  return (
    <Animated.View pointerEvents="none" style={[styles.cloud, { top, opacity, transform: [{ translateX: translate }] }]}>
      <View style={[styles.cloudBubble, styles.cloudBubbleOne]} />
      <View style={[styles.cloudBubble, styles.cloudBubbleTwo]} />
      <View style={[styles.cloudBubble, styles.cloudBubbleThree]} />
      <View style={styles.cloudBase} />
    </Animated.View>
  );
}

function Fireflies({ visible }: { visible: boolean }) {
  const pulse = useRef(new Animated.Value(0.25)).current;
  useEffect(() => {
    if (!visible) return undefined;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.2, duration: 1700, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse, visible]);

  if (!visible) return null;
  const dots = [
    ['44%', '34%'], ['52%', '29%'], ['61%', '40%'], ['73%', '53%'], ['39%', '59%'], ['81%', '69%'], ['28%', '74%'],
  ] as const;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {dots.map(([left, top], index) => (
        <Animated.View key={`${left}-${top}`} style={[styles.firefly, { left, top, opacity: index % 2 ? pulse : Animated.subtract(1.1, pulse) }]} />
      ))}
    </View>
  );
}

export function VillageWorldScene({
  world,
  selectedKey,
  onSelect,
}: {
  world: VillageWorld;
  selectedKey: string | null;
  onSelect: (building: VillageBuilding) => void;
}) {
  const { width } = useWindowDimensions();
  const sceneHeight = Math.min(560, Math.max(472, width * 1.45));
  const palette = useMemo(() => paletteFor(world), [world]);
  const selected = world.buildings.find((building) => building.key === selectedKey) ?? null;
  const firefliesUnlocked = world.unlocks.some((item) => item.key === 'FIREFLIES');
  const isNight = world.environment.time_of_day === 'NIGHT';
  const cloudVisible = world.environment.weather !== 'DRIZZLE' || world.environment.time_of_day !== 'NIGHT';

  return (
    <View style={[styles.scene, { height: sceneHeight }]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} preserveAspectRatio="xMidYMid slice">
        <Terrain world={world} palette={palette} />
        {world.buildings.map((building) => (
          <BuildingArt key={building.key} building={building} palette={palette} selected={building.key === selectedKey} />
        ))}
      </Svg>

      {cloudVisible && <Cloud top={48} opacity={isNight ? 0.18 : 0.48} />}
      {world.environment.weather !== 'DRIZZLE' && <Cloud top={94} delay={8500} opacity={isNight ? 0.12 : 0.34} />}
      <Fireflies visible={isNight && firefliesUnlocked} />

      <View pointerEvents="none" style={[styles.stagePill, { backgroundColor: palette.hud }]}>
        <Text style={[styles.stageText, { color: palette.hudText }]}>{world.stage_label} · {world.environment.time_of_day.toLowerCase()}</Text>
      </View>

      <View pointerEvents="none" style={[styles.coinPill, { backgroundColor: palette.hud }]}>
        <View style={styles.coinDot} />
        <Text style={[styles.coinText, { color: palette.hudText }]}>{world.coins}</Text>
      </View>

      {world.buildings.map((building) => {
        const position = positions[building.key] ?? positions.CENTRAL_TREE;
        const left = `${((position.x - position.width / 2) / VIEWBOX_WIDTH) * 100}%` as DimensionValue;
        const top = `${((position.y - position.height / 2) / VIEWBOX_HEIGHT) * 100}%` as DimensionValue;
        const hitWidth = `${(position.width / VIEWBOX_WIDTH) * 100}%` as DimensionValue;
        const hitHeight = `${(position.height / VIEWBOX_HEIGHT) * 100}%` as DimensionValue;
        return (
          <Pressable
            key={building.key}
            onPress={() => onSelect(building)}
            accessibilityRole="button"
            accessibilityLabel={`${building.name}, ${building.state_label}`}
            accessibilityHint="Shows how this part of your life is reflected in the village"
            style={[styles.hitTarget, { left, top, width: hitWidth, height: hitHeight }]}
          />
        );
      })}

      {selected && (
        <View pointerEvents="none" style={[styles.selectionTag, { backgroundColor: palette.hud }]}>
          <Text style={[styles.selectionName, { color: palette.hudText }]}>{selected.name}</Text>
          <Text style={[styles.selectionState, { color: palette.hudText }]}>{selected.state_label}</Text>
        </View>
      )}

      <View pointerEvents="none" style={styles.bottomHint}>
        <Text style={styles.bottomHintText}>Tap a place to see its story</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 30,
    backgroundColor: '#9FC5C1',
    borderWidth: 1,
    borderColor: 'rgba(47,58,49,0.12)',
  },
  hitTarget: { position: 'absolute', borderRadius: 32 },
  stagePill: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  stageText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize', letterSpacing: 0.2 },
  coinPill: {
    position: 'absolute',
    top: 14,
    right: 14,
    minWidth: 56,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  coinDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D9AE59', borderWidth: 1, borderColor: '#997641' },
  coinText: { fontSize: 12, fontWeight: '800' },
  selectionTag: {
    position: 'absolute',
    left: 16,
    bottom: 42,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    maxWidth: '65%',
  },
  selectionName: { fontSize: 14, fontWeight: '800' },
  selectionState: { fontSize: 11, opacity: 0.72, marginTop: 1 },
  bottomHint: {
    position: 'absolute',
    bottom: 11,
    alignSelf: 'center',
    backgroundColor: 'rgba(35,47,41,0.58)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  bottomHintText: { color: '#F7F2E5', fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  cloud: { position: 'absolute', left: 0, width: 86, height: 30 },
  cloudBase: { position: 'absolute', left: 7, top: 14, width: 68, height: 15, backgroundColor: '#FFFDF4', borderRadius: 20 },
  cloudBubble: { position: 'absolute', backgroundColor: '#FFFDF4', borderRadius: 999 },
  cloudBubbleOne: { left: 17, top: 7, width: 26, height: 23 },
  cloudBubbleTwo: { left: 35, top: 1, width: 32, height: 29 },
  cloudBubbleThree: { left: 52, top: 9, width: 22, height: 20 },
  firefly: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 99,
    backgroundColor: '#F4DC80',
    shadowColor: '#F4DC80',
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 2,
  },
});
