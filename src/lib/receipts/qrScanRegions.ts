export type QrScanRegion = { x: number; y: number; width: number; height: number };

export const qrScanRegions = (width: number, height: number, photo: boolean): QrScanRegion[] => {
  const full = { x: 0, y: 0, width, height };
  if (!photo) {
    const side = Math.min(width, height);
    // Match the square object-fit: cover preview, preserving its source pixels.
    const center = { x: (width - side) / 2, y: (height - side) / 2, width: side, height: side };
    return width === height ? [full] : [center, full];
  }
  // Overlapping native-resolution crops also find a small QR near a photo's edge.
  const cropWidth = Math.floor(width * 0.7);
  const cropHeight = Math.floor(height * 0.7);
  if (Math.max(width, height) <= 1800) return [full];
  return [
    full,
    ...[0, height - cropHeight].flatMap((y) =>
      [0, width - cropWidth].map((x) => ({ x, y, width: cropWidth, height: cropHeight })),
    ),
  ];
};

export const qrCanvasSize = (region: QrScanRegion) => {
  const scale = Math.min(
    1,
    3200 / Math.max(region.width, region.height),
    Math.sqrt(6000000 / (region.width * region.height)),
  );
  return {
    width: Math.max(1, Math.floor(region.width * scale)),
    height: Math.max(1, Math.floor(region.height * scale)),
  };
};
