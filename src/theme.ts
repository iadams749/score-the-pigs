/**
 * "Felt Table" — the app is the table the pigs get thrown on.
 * Every interactive element is a physical chip sitting on felt: lit from
 * above (highlight ramp) with a thick shadowed bottom edge that compresses
 * when pressed. Display type is Alfa Slab One, a carnival-poster slab;
 * body type is Nunito.
 */
export const colors = {
  // felt surface ramp (vignette runs dark → base → dark)
  surface: '#1E4034',
  surfaceDeep: '#122921',
  // raised card ramp
  card: '#27503F',
  cardEdge: '#122E23',
  stitch: '#4E7A63',
  // chalk text
  text: '#F7F1DE',
  textDim: '#AFBFA8',
  // pig pink chip
  accent: '#F2A0B5',
  accentEdge: '#A85874',
  accentText: '#4A1626',
  // brass chip (banked points)
  brass: '#DFAC49',
  brassEdge: '#8A6318',
  brassText: '#33240A',
  // disaster chip
  danger: '#C0402E',
  dangerEdge: '#6E1F12',
  dangerText: '#FBEFE5',
  outline: '#3B6B56',
  // chart marks (validated for contrast on `card`)
  chartBar: '#DFAC49',
  chartBarDanger: '#E8836C',
};

export const fonts = {
  display: 'AlfaSlabOne_400Regular',
  body: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_800ExtraBold',
};

export const spacing = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
};

export const radius = {
  s: 8,
  m: 14,
  l: 22,
};

export const type = {
  score: {
    fontSize: 72,
    fontFamily: fonts.display,
    color: colors.text,
  },
  title: {
    fontSize: 30,
    fontFamily: fonts.display,
    color: colors.text,
  },
  heading: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  /** Small uppercase label above a section — set letterSpacing wide. */
  eyebrow: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: colors.textDim,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.text,
  },
  caption: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textDim,
  },
};
