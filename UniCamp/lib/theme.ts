import { TextStyle } from 'react-native';

// Shared design tokens based on the UniCamp reference screens.
export const C = {
  bg: '#DEDEE3',
  surface: '#D9D9DC',
  field: '#C5C5C9',
  circle: '#CFCFD2',
  bar: '#F0F0F2',
  navy: '#303354',
  navy2: '#45486F',
  navy3: '#202344',
  purple: '#684A87',
  lavender: '#B5A3C9',
  lavenderLight: '#D4C9E0',
  dark: '#313131',
  teal: '#536A6F',
  tile: '#9C9FB3',
  text: '#17171B',
  muted: '#74747D',
  white: '#FFFFFF',
  black: '#000000',
  link: '#3B82F6',
  danger: '#B3261E',
  loginBg: '#EFEFED',
  loginField: '#CDD5D8',
  border: '#ECECF0',
};

export const T = {
  title: { fontSize: 20, fontWeight: '600', color: C.text } as TextStyle,
  section: { fontSize: 14, fontWeight: '700', color: C.text } as TextStyle,
  label: { fontSize: 12, color: C.muted } as TextStyle,
  value: { fontSize: 18, fontWeight: '500', color: C.text } as TextStyle,
  small: { fontSize: 12, color: C.muted } as TextStyle,
};
