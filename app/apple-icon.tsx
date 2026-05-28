import { ImageResponse } from 'next/og';

// 180×180 Apple-Touch-Icon für iOS-Homescreen.

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#2563eb',
        borderRadius: 32,
        color: 'white',
        fontSize: 110,
        fontWeight: 700,
        fontFamily: 'system-ui, sans-serif',
        letterSpacing: '-0.04em',
      }}
    >
      DGB
    </div>,
    { ...size }
  );
}
