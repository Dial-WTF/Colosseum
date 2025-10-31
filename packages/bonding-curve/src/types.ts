// Bonding Curve Configuration
export interface BondingCurveConfig {
  type: 'linear' | 'exponential' | 'logarithmic' | 'bezier';
  basePrice: number;
  priceIncrement: number;
  maxSupply: number;
  // Custom bezier curve data (only used when type === 'bezier')
  bezierCurve?: BezierCurveData;
}

// Bezier control point (2D point on the curve)
export interface BezierControlPoint {
  x: number; // Supply (0-1 normalized)
  y: number; // Price multiplier (0-1 normalized, applied to price range)
}

// A single cubic Bezier segment (4 control points)
export interface BezierSegment {
  p0: BezierControlPoint; // Start point
  p1: BezierControlPoint; // First control point
  p2: BezierControlPoint; // Second control point
  p3: BezierControlPoint; // End point
}

// Complete piecewise Bezier curve definition
export interface BezierCurveData {
  segments: BezierSegment[];
  minPrice: number; // Minimum price in SOL
  maxPrice: number; // Maximum price in SOL
}

