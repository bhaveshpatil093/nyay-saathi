#!/usr/bin/env python3
"""
Generates valid, spec-compliant PNG icons for Nyay Saathi PWA.
- icon-192.png (192x192)
- icon-512.png (512x512)
- icon-maskable-512.png (512x512 with safe padding)
- apple-touch-icon.png (180x180)

Uses only Python standard library (zlib, struct, math) - zero external dependencies.
"""

import math
import os
import struct
import zlib

def write_png(width, height, pixel_data, output_path):
    """
    Writes RGBA raw buffer to PNG file.
    pixel_data: bytes of length width * height * 4
    """
    raw_lines = bytearray()
    for y in range(height):
        raw_lines.append(0)  # filter type 0 (None)
        start = y * width * 4
        raw_lines.extend(pixel_data[start : start + width * 4])

    compressed_idat = zlib.compress(bytes(raw_lines), 9)

    def make_chunk(chunk_type, data):
        length = len(data)
        crc = zlib.crc32(chunk_type + data) & 0xFFFFFFFF
        return struct.pack(">I", length) + chunk_type + data + struct.pack(">I", crc)

    png_bytes = bytearray(b"\x89PNG\r\n\x1a\n")
    # IHDR: width(4), height(4), bit_depth(1=8), color_type(1=6: RGBA), compression(1=0), filter(1=0), interlace(1=0)
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    png_bytes.extend(make_chunk(b"IHDR", ihdr_data))
    png_bytes.extend(make_chunk(b"IDAT", compressed_idat))
    png_bytes.extend(make_chunk(b"IEND", b""))

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(png_bytes)
    print(f"Generated: {output_path} ({width}x{height}, {len(png_bytes)} bytes)")


def render_nyay_saathi_icon(size, is_maskable=False):
    """
    Renders Nyay Saathi shield, scales, and tricolor emblem onto an RGBA buffer.
    """
    buf = bytearray(size * size * 4)

    # Colors
    NAVY_900 = (11, 37, 69, 255)       # #0B2545
    NAVY_700 = (19, 49, 92, 255)       # #13315C
    SAFFRON = (255, 153, 51, 255)      # #FF9933
    INDIA_GREEN = (19, 136, 8, 255)    # #138808
    WHITE = (255, 255, 255, 255)

    def set_pixel(x, y, color):
        if 0 <= x < size and 0 <= y < size:
            idx = (y * size + x) * 4
            # Alpha blending
            a = color[3] / 255.0
            if a >= 1.0:
                buf[idx] = color[0]
                buf[idx + 1] = color[1]
                buf[idx + 2] = color[2]
                buf[idx + 3] = 255
            elif a > 0.0:
                bg_r, bg_g, bg_b = buf[idx], buf[idx + 1], buf[idx + 2]
                buf[idx] = int(color[0] * a + bg_r * (1 - a))
                buf[idx + 1] = int(color[1] * a + bg_g * (1 - a))
                buf[idx + 2] = int(color[2] * a + bg_b * (1 - a))
                buf[idx + 3] = 255

    corner_r = 0 if is_maskable else int(size * 0.18)

    # 1. Background Fill with optional rounded corners
    for y in range(size):
        for x in range(size):
            if corner_r > 0:
                # check 4 corners
                in_corner = False
                if x < corner_r and y < corner_r:
                    in_corner = (x - corner_r) ** 2 + (y - corner_r) ** 2 > corner_r ** 2
                elif x >= size - corner_r and y < corner_r:
                    in_corner = (x - (size - corner_r - 1)) ** 2 + (y - corner_r) ** 2 > corner_r ** 2
                elif x < corner_r and y >= size - corner_r:
                    in_corner = (x - corner_r) ** 2 + (y - (size - corner_r - 1)) ** 2 > corner_r ** 2
                elif x >= size - corner_r and y >= size - corner_r:
                    in_corner = (x - (size - corner_r - 1)) ** 2 + (y - (size - corner_r - 1)) ** 2 > corner_r ** 2
                if in_corner:
                    continue
            set_pixel(x, y, NAVY_900)

    # Scale factor and center offset
    # If maskable, center within safe circle (radius 0.40 * size)
    scale = 0.36 if is_maskable else 0.44
    cx = size / 2.0
    cy = size / 2.0 - (size * 0.03)

    # Shield geometry in normalized coordinates [-1, 1]
    # Point top: (0, -0.75), Top-Right: (0.55, -0.55), Mid-Right: (0.55, -0.15), Bottom: (0, 0.55)
    def in_shield(nx, ny):
        nx = abs(nx)
        if ny < -0.75 or ny > 0.55 or nx > 0.58:
            return False
        # top slant
        if ny < -0.55 + (nx / 0.58) * 0.20:
            return False
        # bottom curve to point
        if ny > -0.15:
            slant = (ny - (-0.15)) / 0.70
            if nx > 0.58 * (1.0 - math.pow(slant, 1.2)):
                return False
        return True

    # Render Shield
    shield_radius = size * scale
    for y in range(size):
        for x in range(size):
            nx = (x - cx) / shield_radius
            ny = (y - cy) / shield_radius
            if in_shield(nx, ny):
                # Check border
                border_thick = 0.05
                is_border = (
                    not in_shield(nx * 1.05, ny * 1.05) or
                    not in_shield(nx * (1 + border_thick), ny + border_thick) or
                    not in_shield(nx - border_thick, ny - border_thick)
                )
                if is_border:
                    set_pixel(x, y, SAFFRON)
                else:
                    set_pixel(x, y, NAVY_700)

    # Render Scales of Justice
    # Vertical pillar
    pillar_w = max(2, int(size * 0.022))
    pillar_top = int(cy - shield_radius * 0.48)
    pillar_bot = int(cy + shield_radius * 0.22)
    for y in range(pillar_top, pillar_bot):
        for dx in range(-pillar_w // 2, pillar_w // 2 + 1):
            set_pixel(int(cx + dx), y, WHITE)

    # Fulcrum circle
    fulcrum_r = max(3, int(size * 0.035))
    for dy in range(-fulcrum_r, fulcrum_r + 1):
        for dx in range(-fulcrum_r, fulcrum_r + 1):
            if dx * dx + dy * dy <= fulcrum_r * fulcrum_r:
                set_pixel(int(cx + dx), pillar_top + dy, SAFFRON)

    # Horizontal beam
    beam_w = max(2, int(size * 0.020))
    beam_half_len = int(shield_radius * 0.42)
    beam_y = int(cy - shield_radius * 0.32)
    for x in range(int(cx - beam_half_len), int(cx + beam_half_len) + 1):
        for dy in range(-beam_w // 2, beam_w // 2 + 1):
            set_pixel(x, beam_y + dy, WHITE)

    # Scale pan strings and pans
    for side in (-1, 1):
        px = int(cx + side * beam_half_len)
        py_pan = int(beam_y + shield_radius * 0.28)
        # Strings from beam end to pan
        for step in range(25):
            t = step / 24.0
            sy = int(beam_y + t * (py_pan - beam_y))
            sx1 = int(px - t * (size * 0.035))
            sx2 = int(px + t * (size * 0.035))
            set_pixel(sx1, sy, WHITE)
            set_pixel(sx2, sy, WHITE)

        # Pan bowl (semicircle / arc)
        pan_r = int(size * 0.045)
        for dy in range(0, pan_r + 1):
            for dx in range(-pan_r, pan_r + 1):
                if dx * dx + dy * dy <= pan_r * pan_r and dy >= 0:
                    set_pixel(px + dx, py_pan + dy, SAFFRON)

    # Horizontal pedestal at base of pillar
    ped_w = int(shield_radius * 0.26)
    ped_h = max(2, int(size * 0.018))
    for x in range(int(cx - ped_w), int(cx + ped_w) + 1):
        for dy in range(ped_h):
            set_pixel(x, pillar_bot + dy, WHITE)

    # Tricolor stripe at bottom
    tri_y = int(cy + shield_radius * 0.65)
    tri_w = int(shield_radius * 0.70)
    tri_h = max(3, int(size * 0.022))
    for x in range(int(cx - tri_w), int(cx + tri_w) + 1):
        for dy in range(tri_h):
            set_pixel(x, tri_y + dy, INDIA_GREEN)

    return bytes(buf)


def main():
    icons = [
        ("public/icons/icon-192.png", 192, False),
        ("public/icons/icon-512.png", 512, False),
        ("public/icons/icon-maskable-512.png", 512, True),
        ("public/icons/apple-touch-icon.png", 180, False),
    ]

    for path, sz, maskable in icons:
        buf = render_nyay_saathi_icon(sz, is_maskable=maskable)
        write_png(sz, sz, buf, path)

    print("All PWA icons generated successfully!")


if __name__ == "__main__":
    main()
