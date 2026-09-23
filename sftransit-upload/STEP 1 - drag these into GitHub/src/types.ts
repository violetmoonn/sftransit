export type TransitType = 'bart' | 'muni-metro' | 'caltrain' | 'cable-car' | 'ferry' | 'phoenix';

export interface Neighborhood {
  id: string;
  name: string;
  description: string;
  vibe: string;
  highlights: string[];
  transitConnections: string[];
  safetyTips: string;
  secrets: string;
  svgPath: string; // Coordinate path representing the polygon on a 1000x1000 grid
  labelX: number;  // Center X for rendering neighborhood text label
  labelY: number;  // Center Y for rendering neighborhood text label
  fillColor: string;
  borderColor: string;
}

export interface TransitLine {
  id: string;
  name: string;
  type: TransitType;
  color: string;
  description: string;
  svgPath: string; // Line coordinate path on a 1000x1000 grid
  frequency: string;
  hours: string;
  stations: string[];
}

export interface Station {
  id: string;
  name: string;
  x: number;
  y: number;
  lines: string[];
  type: TransitType | 'hub';
  description?: string;
}

export interface JourneyStep {
  instruction: string;
  type: TransitType | 'walk';
  line?: string;
  duration?: string;
}

export interface JourneyResult {
  from: string;
  to: string;
  totalTime: string;
  steps: JourneyStep[];
}
