'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, RotateCcw, Sparkles } from 'lucide-react';
import type {
  BezierCurveData,
  BezierSegment,
  BezierControlPoint,
} from '@dial/bonding-curve';
import {
  generateBezierCurvePoints,
  createDefaultBezierCurve,
  validateBezierCurve,
} from '@dial/bonding-curve';

interface BezierCurveEditorProps {
  curveData: BezierCurveData;
  onChange: (curveData: BezierCurveData) => void;
  className?: string;
}

interface DragState {
  segmentIndex: number;
  pointIndex: number;
  isDragging: boolean;
}

export function BezierCurveEditor({
  curveData,
  onChange,
  className = '',
}: BezierCurveEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ segment: number; point: number } | null>(
    null
  );
  const [minPrice, setMinPrice] = useState(curveData.minPrice);
  const [maxPrice, setMaxPrice] = useState(curveData.maxPrice);

  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 400;
  const PADDING = 40;

  // Convert normalized coordinates to canvas coordinates
  const toCanvasCoords = useCallback(
    (point: BezierControlPoint): { x: number; y: number } => {
      return {
        x: PADDING + point.x * (CANVAS_WIDTH - 2 * PADDING),
        y: CANVAS_HEIGHT - PADDING - point.y * (CANVAS_HEIGHT - 2 * PADDING),
      };
    },
    []
  );

  // Convert canvas coordinates to normalized coordinates
  const fromCanvasCoords = useCallback(
    (x: number, y: number): BezierControlPoint => {
      return {
        x: Math.max(0, Math.min(1, (x - PADDING) / (CANVAS_WIDTH - 2 * PADDING))),
        y: Math.max(
          0,
          Math.min(1, (CANVAS_HEIGHT - PADDING - y) / (CANVAS_HEIGHT - 2 * PADDING))
        ),
      };
    },
    []
  );

  // Draw the curve on canvas
  const drawCurve = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = PADDING + (i / 10) * (CANVAS_WIDTH - 2 * PADDING);
      ctx.beginPath();
      ctx.moveTo(x, PADDING);
      ctx.lineTo(x, CANVAS_HEIGHT - PADDING);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
      const y = PADDING + (i / 10) * (CANVAS_HEIGHT - 2 * PADDING);
      ctx.beginPath();
      ctx.moveTo(PADDING, y);
      ctx.lineTo(CANVAS_WIDTH - PADDING, y);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Draw axes
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PADDING, PADDING);
    ctx.lineTo(PADDING, CANVAS_HEIGHT - PADDING);
    ctx.lineTo(CANVAS_WIDTH - PADDING, CANVAS_HEIGHT - PADDING);
    ctx.stroke();

    // Draw axis labels
    ctx.fillStyle = '#999';
    ctx.font = '12px monospace';
    ctx.fillText('Supply →', CANVAS_WIDTH / 2 - 30, CANVAS_HEIGHT - 10);
    ctx.save();
    ctx.translate(15, CANVAS_HEIGHT / 2 + 30);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Price →', 0, 0);
    ctx.restore();

    // Generate curve points
    const curvePoints = generateBezierCurvePoints(curveData, 200);

    // Draw the curve
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 3;
    ctx.beginPath();

    curvePoints.forEach((point, index) => {
      const canvasPoint = toCanvasCoords(point);
      if (index === 0) {
        ctx.moveTo(canvasPoint.x, canvasPoint.y);
      } else {
        ctx.lineTo(canvasPoint.x, canvasPoint.y);
      }
    });

    ctx.stroke();

    // Draw control points and bezier handles
    curveData.segments.forEach((segment, segmentIdx) => {
      const points = [segment.p0, segment.p1, segment.p2, segment.p3];

      // Draw bezier handles (lines connecting control points)
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);

      // Handle from p0 to p1
      const p0Canvas = toCanvasCoords(segment.p0);
      const p1Canvas = toCanvasCoords(segment.p1);
      ctx.beginPath();
      ctx.moveTo(p0Canvas.x, p0Canvas.y);
      ctx.lineTo(p1Canvas.x, p1Canvas.y);
      ctx.stroke();

      // Handle from p2 to p3
      const p2Canvas = toCanvasCoords(segment.p2);
      const p3Canvas = toCanvasCoords(segment.p3);
      ctx.beginPath();
      ctx.moveTo(p2Canvas.x, p2Canvas.y);
      ctx.lineTo(p3Canvas.x, p3Canvas.y);
      ctx.stroke();

      ctx.setLineDash([]);

      // Draw control points
      points.forEach((point, pointIdx) => {
        const canvasPoint = toCanvasCoords(point);
        const isEndpoint = pointIdx === 0 || pointIdx === 3;
        const isHovered =
          hoveredPoint?.segment === segmentIdx && hoveredPoint?.point === pointIdx;

        // Draw point
        ctx.beginPath();
        ctx.arc(canvasPoint.x, canvasPoint.y, isEndpoint ? 8 : 6, 0, 2 * Math.PI);

        if (isHovered) {
          ctx.fillStyle = '#fbbf24';
          ctx.strokeStyle = '#f59e0b';
        } else if (isEndpoint) {
          ctx.fillStyle = '#8b5cf6';
          ctx.strokeStyle = '#7c3aed';
        } else {
          ctx.fillStyle = '#64748b';
          ctx.strokeStyle = '#475569';
        }

        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    });
  }, [curveData, hoveredPoint, toCanvasCoords]);

  // Redraw when curve changes
  useEffect(() => {
    drawCurve();
  }, [drawCurve]);

  // Handle mouse down on canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on a control point
    for (let segIdx = 0; segIdx < curveData.segments.length; segIdx++) {
      const segment = curveData.segments[segIdx];
      const points = [segment.p0, segment.p1, segment.p2, segment.p3];

      for (let ptIdx = 0; ptIdx < points.length; ptIdx++) {
        const canvasPoint = toCanvasCoords(points[ptIdx]);
        const distance = Math.sqrt(
          Math.pow(x - canvasPoint.x, 2) + Math.pow(y - canvasPoint.y, 2)
        );

        if (distance < 10) {
          setDragState({
            segmentIndex: segIdx,
            pointIndex: ptIdx,
            isDragging: true,
          });
          return;
        }
      }
    }
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update hover state
    if (!dragState) {
      let found = false;
      for (let segIdx = 0; segIdx < curveData.segments.length; segIdx++) {
        const segment = curveData.segments[segIdx];
        const points = [segment.p0, segment.p1, segment.p2, segment.p3];

        for (let ptIdx = 0; ptIdx < points.length; ptIdx++) {
          const canvasPoint = toCanvasCoords(points[ptIdx]);
          const distance = Math.sqrt(
            Math.pow(x - canvasPoint.x, 2) + Math.pow(y - canvasPoint.y, 2)
          );

          if (distance < 10) {
            setHoveredPoint({ segment: segIdx, point: ptIdx });
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (!found) {
        setHoveredPoint(null);
      }
    }

    // Handle dragging
    if (dragState && dragState.isDragging) {
      const newPoint = fromCanvasCoords(x, y);

      // Update the curve data
      const newSegments = [...curveData.segments];
      const segment = { ...newSegments[dragState.segmentIndex] };

      // Update the appropriate point
      const pointKey = ['p0', 'p1', 'p2', 'p3'][dragState.pointIndex] as
        | 'p0'
        | 'p1'
        | 'p2'
        | 'p3';
      segment[pointKey] = newPoint;

      newSegments[dragState.segmentIndex] = segment;

      onChange({
        ...curveData,
        segments: newSegments,
      });
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setDragState(null);
  };

  // Add a new segment
  const addSegment = () => {
    const lastSegment = curveData.segments[curveData.segments.length - 1];
    const startPoint = lastSegment.p3;

    const newSegment: BezierSegment = {
      p0: startPoint,
      p1: { x: startPoint.x + 0.1, y: startPoint.y },
      p2: { x: Math.min(1, startPoint.x + 0.2), y: Math.min(1, startPoint.y + 0.2) },
      p3: { x: Math.min(1, startPoint.x + 0.3), y: Math.min(1, startPoint.y + 0.3) },
    };

    onChange({
      ...curveData,
      segments: [...curveData.segments, newSegment],
    });
  };

  // Remove last segment
  const removeSegment = () => {
    if (curveData.segments.length <= 1) return;

    onChange({
      ...curveData,
      segments: curveData.segments.slice(0, -1),
    });
  };

  // Reset to default curve
  const resetCurve = () => {
    const defaultCurve = createDefaultBezierCurve(minPrice, maxPrice);
    onChange(defaultCurve);
  };

  // Update price range
  const handlePriceRangeChange = () => {
    onChange({
      ...curveData,
      minPrice,
      maxPrice,
    });
  };

  // Validate curve
  const validation = validateBezierCurve(curveData);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Custom Bezier Curve
            </h3>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full text-xs font-semibold text-amber-600 dark:text-amber-400">
              <Sparkles className="h-3 w-3" />
              Experimental - Coming Soon
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Drag control points to shape your price curve
          </p>
        </div>

        <div className="flex gap-2">
          <motion.button
            onClick={addSegment}
            className="px-3 py-2 bg-primary/10 hover:bg-primary/20 rounded-lg border border-primary/20 transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm">Add Segment</span>
          </motion.button>

          {curveData.segments.length > 1 && (
            <motion.button
              onClick={removeSegment}
              className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition-colors flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Trash2 className="h-4 w-4" />
              <span className="text-sm">Remove</span>
            </motion.button>
          )}

          <motion.button
            onClick={resetCurve}
            className="px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg border border-border transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RotateCcw className="h-4 w-4" />
            <span className="text-sm">Reset</span>
          </motion.button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="border border-border rounded-lg bg-background cursor-crosshair"
          style={{ width: '100%', height: 'auto' }}
        />

        {/* Legend */}
        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm border border-border rounded-lg p-3 text-xs space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500 border-2 border-purple-700" />
            <span>Curve</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500 border-2 border-purple-700" />
            <span>Endpoints</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-500 border-2 border-slate-700" />
            <span>Control Points</span>
          </div>
        </div>
      </div>

      {/* Price Range Controls */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold mb-2 block">Min Price (SOL)</label>
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(parseFloat(e.target.value) || 0)}
            onBlur={handlePriceRangeChange}
            step="0.01"
            min="0"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block">Max Price (SOL)</label>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(parseFloat(e.target.value) || 0)}
            onBlur={handlePriceRangeChange}
            step="0.01"
            min={minPrice}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Validation Messages */}
      {!validation.valid && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-sm font-semibold text-red-500 mb-1">Validation Errors:</p>
          <ul className="text-xs text-red-400 space-y-1">
            {validation.errors.map((error, idx) => (
              <li key={idx}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Curve Stats */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <h4 className="text-sm font-semibold mb-3">Curve Statistics</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Segments</p>
            <p className="font-mono font-semibold">{curveData.segments.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Price Range</p>
            <p className="font-mono font-semibold">
              {curveData.minPrice.toFixed(2)} - {curveData.maxPrice.toFixed(2)} SOL
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Price Ratio</p>
            <p className="font-mono font-semibold">
              {(curveData.maxPrice / curveData.minPrice).toFixed(2)}x
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

