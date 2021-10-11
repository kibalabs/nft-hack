declare type CanvasSize = {
  maxArea: (options: unknown) => Promise<{ width: number, height: number }>;
}
declare let canvasSize: CanvasSize;

declare module 'canvas-size' {
  export = canvasSize;
}
