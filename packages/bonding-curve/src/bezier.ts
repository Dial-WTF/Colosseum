import Decimal from 'decimal.js';
import { Bezier } from 'bezier-js';
import type { BezierCurveData, BezierSegment, BezierControlPoint } from './types';

// Configure Decimal.js for high precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_DOWN });

/**
 * Evaluate a piecewise Bezier curve at a normalized position (0-1)
 * Returns the normalized y value (0-1)
 */
export function evaluateBezierCurve(
  curveData: BezierCurveData,
  normalizedX: number
): number {
  // Clamp input to [0, 1]
  const x = Math.max(0, Math.min(1, normalizedX));

  // Find the segment that contains this x value
  const segment = findSegmentAtX(curveData.segments, x);
  
  if (!segment) {
    // Fallback: if no segment found, return linear interpolation
    return x;
  }

  // Create a Bezier.js curve from the segment
  const bezierCurve = new Bezier(
    segment.p0.x, segment.p0.y,
    segment.p1.x, segment.p1.y,
    segment.p2.x, segment.p2.y,
    segment.p3.x, segment.p3.y
  );

  // Find the t parameter that gives us the desired x value
  // This requires solving the Bezier equation for x
  const t = findTParameterForX(bezierCurve, x);
  
  // Get the y value at that t parameter
  const point = bezierCurve.get(t);
  
  return point.y;
}

/**
 * Find which segment contains a given x value
 */
function findSegmentAtX(
  segments: BezierSegment[],
  x: number
): BezierSegment | null {
  for (const segment of segments) {
    const minX = Math.min(segment.p0.x, segment.p3.x);
    const maxX = Math.max(segment.p0.x, segment.p3.x);
    
    if (x >= minX && x <= maxX) {
      return segment;
    }
  }
  
  // Return last segment as fallback
  return segments[segments.length - 1] || null;
}

/**
 * Find the t parameter for a Bezier curve that produces a specific x value
 * Uses Newton-Raphson iteration for fast convergence
 */
function findTParameterForX(
  curve: Bezier,
  targetX: number,
  tolerance: number = 0.0001
): number {
  let t = 0.5; // Initial guess
  let iterations = 0;
  const maxIterations = 20;

  while (iterations < maxIterations) {
    const point = curve.get(t);
    const error = point.x - targetX;
    
    if (Math.abs(error) < tolerance) {
      return t;
    }

    // Get derivative at current t
    const derivative = curve.derivative(t);
    
    // Avoid division by zero
    if (Math.abs(derivative.x) < 0.0001) {
      break;
    }

    // Newton-Raphson step
    t = t - error / derivative.x;
    
    // Clamp t to [0, 1]
    t = Math.max(0, Math.min(1, t));
    
    iterations++;
  }

  return t;
}

/**
 * Calculate price at a specific supply using Bezier curve
 */
export function calculateBezierPrice(
  currentSupply: number,
  maxSupply: number,
  curveData: BezierCurveData
): Decimal {
  // Normalize supply to [0, 1]
  const normalizedSupply = currentSupply / maxSupply;
  
  // Evaluate curve to get normalized price (0-1)
  const normalizedPrice = evaluateBezierCurve(curveData, normalizedSupply);
  
  // Map to actual price range
  const priceRange = curveData.maxPrice - curveData.minPrice;
  const actualPrice = curveData.minPrice + (normalizedPrice * priceRange);
  
  return new Decimal(actualPrice);
}

/**
 * Create a default S-curve Bezier for smooth price progression
 */
export function createDefaultBezierCurve(
  minPrice: number = 0.1,
  maxPrice: number = 10
): BezierCurveData {
  return {
    minPrice,
    maxPrice,
    segments: [
      {
        p0: { x: 0, y: 0 },      // Start at bottom-left
        p1: { x: 0.2, y: 0 },    // Slow start
        p2: { x: 0.8, y: 1 },    // Fast finish
        p3: { x: 1, y: 1 },      // End at top-right
      }
    ]
  };
}

/**
 * Create a multi-segment Bezier curve with custom control points
 * Useful for complex pricing strategies
 */
export function createMultiSegmentBezier(
  segments: BezierSegment[],
  minPrice: number,
  maxPrice: number
): BezierCurveData {
  // Validate and connect segments
  const connectedSegments = ensureContinuity(segments);
  
  return {
    segments: connectedSegments,
    minPrice,
    maxPrice,
  };
}

/**
 * Ensure segments connect properly (p3 of one segment = p0 of next)
 */
function ensureContinuity(segments: BezierSegment[]): BezierSegment[] {
  if (segments.length <= 1) return segments;
  
  const connected: BezierSegment[] = [segments[0]];
  
  for (let i = 1; i < segments.length; i++) {
    const prevSegment = connected[connected.length - 1];
    const currentSegment = segments[i];
    
    // Make sure current segment starts where previous ended
    connected.push({
      ...currentSegment,
      p0: prevSegment.p3,
    });
  }
  
  return connected;
}

/**
 * Generate sample points along the curve for visualization
 */
export function generateBezierCurvePoints(
  curveData: BezierCurveData,
  numPoints: number = 100
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const x = i / numPoints;
    const y = evaluateBezierCurve(curveData, x);
    points.push({ x, y });
  }
  
  return points;
}

/**
 * Convert a simple curve type to a Bezier approximation
 */
export function curveTypeToBezier(
  type: 'linear' | 'exponential' | 'logarithmic',
  minPrice: number,
  maxPrice: number
): BezierCurveData {
  switch (type) {
    case 'linear':
      return {
        minPrice,
        maxPrice,
        segments: [{
          p0: { x: 0, y: 0 },
          p1: { x: 0.33, y: 0.33 },
          p2: { x: 0.66, y: 0.66 },
          p3: { x: 1, y: 1 },
        }]
      };
      
    case 'exponential':
      return {
        minPrice,
        maxPrice,
        segments: [{
          p0: { x: 0, y: 0 },
          p1: { x: 0.1, y: 0 },
          p2: { x: 0.5, y: 0.7 },
          p3: { x: 1, y: 1 },
        }]
      };
      
    case 'logarithmic':
      return {
        minPrice,
        maxPrice,
        segments: [{
          p0: { x: 0, y: 0 },
          p1: { x: 0.5, y: 0.3 },
          p2: { x: 0.9, y: 1 },
          p3: { x: 1, y: 1 },
        }]
      };
  }
}

/**
 * Validate a Bezier curve configuration
 */
export function validateBezierCurve(curveData: BezierCurveData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!curveData.segments || curveData.segments.length === 0) {
    errors.push('Curve must have at least one segment');
  }
  
  if (curveData.minPrice < 0) {
    errors.push('Minimum price cannot be negative');
  }
  
  if (curveData.maxPrice <= curveData.minPrice) {
    errors.push('Maximum price must be greater than minimum price');
  }
  
  // Check each segment
  curveData.segments.forEach((segment, idx) => {
    const points = [segment.p0, segment.p1, segment.p2, segment.p3];
    
    points.forEach((point, pointIdx) => {
      if (point.x < 0 || point.x > 1) {
        errors.push(`Segment ${idx}, point ${pointIdx}: x must be in [0, 1]`);
      }
      if (point.y < 0 || point.y > 1) {
        errors.push(`Segment ${idx}, point ${pointIdx}: y must be in [0, 1]`);
      }
    });
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

