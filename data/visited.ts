/**
 * The 45 countries I've been to, as my travel app's "been" list recorded
 * them on 2026-08-31. That list is canonical: no re-litigating layovers or
 * childhood trips — if the app says been, I've been. West Bank is folded
 * into Palestine; Kosovo is absent because I haven't been.
 *
 * `numeric` is the ISO 3166-1 numeric code, which is how Natural Earth
 * keys its features; `code` is the human-friendly alpha-2.
 */
export interface VisitedCountry {
  code: string;
  numeric: number;
  name: string;
}

export const visited: VisitedCountry[] = [
  // Europe (30)
  { code: 'AL', numeric: 8, name: 'Albania' },
  { code: 'AT', numeric: 40, name: 'Austria' },
  { code: 'BY', numeric: 112, name: 'Belarus' },
  { code: 'BE', numeric: 56, name: 'Belgium' },
  { code: 'BA', numeric: 70, name: 'Bosnia and Herzegovina' },
  { code: 'BG', numeric: 100, name: 'Bulgaria' },
  { code: 'HR', numeric: 191, name: 'Croatia' },
  { code: 'CZ', numeric: 203, name: 'Czechia' },
  { code: 'DK', numeric: 208, name: 'Denmark' },
  { code: 'EE', numeric: 233, name: 'Estonia' },
  { code: 'FI', numeric: 246, name: 'Finland' },
  { code: 'DE', numeric: 276, name: 'Germany' },
  { code: 'HU', numeric: 348, name: 'Hungary' },
  { code: 'IT', numeric: 380, name: 'Italy' },
  { code: 'LV', numeric: 428, name: 'Latvia' },
  { code: 'LT', numeric: 440, name: 'Lithuania' },
  { code: 'LU', numeric: 442, name: 'Luxembourg' },
  { code: 'MD', numeric: 498, name: 'Moldova' },
  { code: 'NL', numeric: 528, name: 'Netherlands' },
  { code: 'PL', numeric: 616, name: 'Poland' },
  { code: 'PT', numeric: 620, name: 'Portugal' },
  { code: 'RO', numeric: 642, name: 'Romania' },
  { code: 'RU', numeric: 643, name: 'Russia' },
  { code: 'SK', numeric: 703, name: 'Slovakia' },
  { code: 'ES', numeric: 724, name: 'Spain' },
  { code: 'SE', numeric: 752, name: 'Sweden' },
  { code: 'CH', numeric: 756, name: 'Switzerland' },
  { code: 'TR', numeric: 792, name: 'Turkey' },
  { code: 'UA', numeric: 804, name: 'Ukraine' },
  { code: 'GB', numeric: 826, name: 'United Kingdom' },
  // Asia (10)
  { code: 'AM', numeric: 51, name: 'Armenia' },
  { code: 'GE', numeric: 268, name: 'Georgia' },
  { code: 'IL', numeric: 376, name: 'Israel' },
  { code: 'JP', numeric: 392, name: 'Japan' },
  { code: 'JO', numeric: 400, name: 'Jordan' },
  { code: 'KZ', numeric: 398, name: 'Kazakhstan' },
  { code: 'PS', numeric: 275, name: 'Palestine' },
  { code: 'KR', numeric: 410, name: 'South Korea' },
  { code: 'TJ', numeric: 762, name: 'Tajikistan' },
  { code: 'UZ', numeric: 860, name: 'Uzbekistan' },
  // Africa (2)
  { code: 'EG', numeric: 818, name: 'Egypt' },
  { code: 'MA', numeric: 504, name: 'Morocco' },
  // Americas (3)
  { code: 'CA', numeric: 124, name: 'Canada' },
  { code: 'US', numeric: 840, name: 'United States' },
  { code: 'CO', numeric: 170, name: 'Colombia' },
];
