import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme';

/**
 * The app mark: a side-view pig mid-throw, wearing the famous side dot —
 * the pigs from the game rendered in the Felt Table palette.
 */
export function Logo({ size = 96 }: { size?: number }) {
  const height = (size * 96) / 128;
  return (
    <Svg width={size} height={height} viewBox="0 0 128 96">
      {/* curly tail */}
      <Path
        d="M20 48 C8 42, 6 56, 16 56 C24 56, 22 46, 16 49"
        stroke={colors.accentEdge}
        strokeWidth={3.5}
        strokeLinecap="round"
        fill="none"
      />
      {/* legs */}
      <Rect x={34} y={70} width={9} height={16} rx={4} fill={colors.accentEdge} />
      <Rect x={52} y={72} width={9} height={16} rx={4} fill={colors.accentEdge} />
      <Rect x={70} y={72} width={9} height={16} rx={4} fill={colors.accentEdge} />
      <Rect x={88} y={70} width={9} height={16} rx={4} fill={colors.accentEdge} />
      {/* body */}
      <Ellipse
        cx={62}
        cy={52}
        rx={44}
        ry={30}
        fill={colors.accent}
        stroke={colors.accentEdge}
        strokeWidth={4}
      />
      {/* far ear, behind the head */}
      <Path
        d="M84 30 L90 12 L102 24 Z"
        fill={colors.accentEdge}
        stroke={colors.accentEdge}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      {/* near ear */}
      <Path
        d="M92 26 L100 10 L110 24 Z"
        fill={colors.accent}
        stroke={colors.accentEdge}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      {/* head */}
      <Circle
        cx={100}
        cy={44}
        r={20}
        fill={colors.accent}
        stroke={colors.accentEdge}
        strokeWidth={4}
      />
      {/* snout */}
      <Ellipse
        cx={118}
        cy={47}
        rx={8}
        ry={7}
        fill={colors.accent}
        stroke={colors.accentEdge}
        strokeWidth={3}
      />
      <Circle cx={115.5} cy={47} r={1.6} fill={colors.accentEdge} />
      <Circle cx={120.5} cy={47} r={1.6} fill={colors.accentEdge} />
      {/* eye */}
      <Circle cx={98} cy={38} r={2.8} fill={colors.accentText} />
      {/* the famous side dot */}
      <Circle cx={52} cy={52} r={6.5} fill={colors.accentText} />
    </Svg>
  );
}
