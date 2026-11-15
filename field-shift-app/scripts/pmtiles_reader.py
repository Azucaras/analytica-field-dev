"""Read a PMTiles v3 archive without third party libraries.

The block 5 build needs three things from a built product that the spec makes
acceptance criteria: the tile layer name from the tileset metadata (AC-04), the
gzip byte count of individual tiles (R-08, AC-06) and the features of the tiles
covering a pinned viewport (R-08, AC-06). The `pmtiles` CLI exposes the first and
one tile at a time; enumerating thousands of tiles for a region wide budget
check is too slow through a subprocess per tile, so this module reads the
archive directly.

Format (PMTiles v3 spec, and `pmtiles/pmtiles.hpp` in tippecanoe v2.82.0):

  * header: 127 bytes, little endian, `PMTiles` magic then version 3
  * a directory is COLUMNAR: varint entry count, then all tile_id deltas, then
    all run lengths, then all lengths, then all offsets. An offset is 0 when the
    tile data is contiguous with the previous entry, otherwise offset + 1.
  * an entry with run_length 0 is a pointer to a leaf directory; its `length` is
    the leaf's stored byte size and its `offset` the position in the leaf
    directory section.
  * tile ids run along a Hilbert curve per zoom, not a Morton interleave:
    tile_id = (4^z - 1) / 3 + hilbert(x, y) inside zoom z.
  * directories use the header's internal compression, tile bytes their own.
"""

from __future__ import annotations

import gzip
import json
import math
import struct
from dataclasses import dataclass

HEADER_SIZE = 127
MAGIC = b"PMTiles"
COMPRESSION_NONE = 1
COMPRESSION_GZIP = 2
TILE_TYPE_MVT = 1


# ------------------------------------------------------------------ geometry --


def lonlat_to_world_px(lon: float, lat: float, z: int, tile_size: int = 256) -> tuple[float, float]:
    world_px = tile_size * (1 << z)
    x = (lon + 180.0) / 360.0 * world_px
    clamped = max(-85.0511287798066, min(85.0511287798066, lat))
    rad = math.radians(clamped)
    y = (1.0 - math.log(math.tan(rad) + 1.0 / math.cos(rad)) / math.pi) / 2.0 * world_px
    return x, y


def lonlat_to_tile_xy(lon: float, lat: float, z: int) -> tuple[int, int]:
    n = 1 << z
    x = int((lon + 180.0) / 360.0 * n)
    rad = math.radians(max(-85.0511287798066, min(85.0511287798066, lat)))
    y = int((1.0 - math.log(math.tan(rad) + 1.0 / math.cos(rad)) / math.pi) / 2.0 * n)
    return min(n - 1, max(0, x)), min(n - 1, max(0, y))


# -------------------------------------------------------------- hilbert ids --


def _rotate(size: int, x: int, y: int, rx: int, ry: int) -> tuple[int, int]:
    if ry == 0:
        if rx == 1:
            x = size - 1 - x
            y = size - 1 - y
        x, y = y, x
    return x, y


def zxy_to_tile_id(z: int, x: int, y: int) -> int:
    """Hilbert curve index of (x, y) inside zoom z, plus the zoom's base id."""
    if z > 31:
        raise ValueError("zoom above 31 is outside the 64 bit tile id space")
    if x > (1 << z) - 1 or y > (1 << z) - 1:
        raise ValueError(f"tile {z}/{x}/{y} is outside the zoom's bounds")
    base = ((1 << (2 * z)) - 1) // 3
    size = 1 << z
    distance = 0
    tx, ty = x, y
    step = size // 2
    while step > 0:
        rx = 1 if tx & step else 0
        ry = 1 if ty & step else 0
        distance += step * step * ((3 * rx) ^ ry)
        tx, ty = _rotate(step, tx, ty, rx, ry)
        step //= 2
    return base + distance


def tile_id_to_zxy(tile_id: int) -> tuple[int, int, int]:
    base = 0
    z = 0
    while True:
        num_tiles = (1 << z) * (1 << z)
        if base + num_tiles > tile_id:
            break
        base += num_tiles
        z += 1
        if z > 31:
            raise ValueError("tile id outside the 64 bit space")
    position = tile_id - base
    size = 1 << z
    tx = ty = 0
    step = 1
    t = position
    while step < size:
        rx = 1 & (t // 2)
        ry = 1 & (t ^ rx)
        tx, ty = _rotate(step, tx, ty, rx, ry)
        tx += step * rx
        ty += step * ry
        t //= 4
        step *= 2
    return z, tx, ty


# ------------------------------------------------------------------- header --


@dataclass(frozen=True)
class Header:
    version: int
    root_dir_offset: int
    root_dir_length: int
    metadata_offset: int
    metadata_length: int
    leaf_dirs_offset: int
    leaf_dirs_length: int
    tile_data_offset: int
    tile_data_length: int
    addressed_tiles_count: int
    tile_entries_count: int
    tile_contents_count: int
    clustered: bool
    internal_compression: int
    tile_compression: int
    tile_type: int
    min_zoom: int
    max_zoom: int
    min_lon_e7: int
    min_lat_e7: int
    max_lon_e7: int
    max_lat_e7: int
    center_zoom: int
    center_lon_e7: int
    center_lat_e7: int


def read_header(path: str) -> Header:
    with open(path, "rb") as handle:
        raw = handle.read(HEADER_SIZE)
    if len(raw) != HEADER_SIZE or raw[:7] != MAGIC:
        raise ValueError(f"{path} is not a PMTiles archive")
    version = raw[7]
    if version != 3:
        raise ValueError(f"{path} is PMTiles v{version}; this reader handles v3")
    (
        root_dir_offset,
        root_dir_length,
        metadata_offset,
        metadata_length,
        leaf_dirs_offset,
        leaf_dirs_length,
        tile_data_offset,
        tile_data_length,
        addressed_tiles_count,
        tile_entries_count,
        tile_contents_count,
    ) = struct.unpack_from("<11Q", raw, 8)
    clustered, internal_compression, tile_compression, tile_type = struct.unpack_from("<4B", raw, 96)
    min_zoom, max_zoom = struct.unpack_from("<2B", raw, 100)
    min_lon_e7, min_lat_e7, max_lon_e7, max_lat_e7 = struct.unpack_from("<4i", raw, 102)
    center_zoom = raw[118]
    center_lon_e7, center_lat_e7 = struct.unpack_from("<2i", raw, 119)
    return Header(
        version=version,
        root_dir_offset=root_dir_offset,
        root_dir_length=root_dir_length,
        metadata_offset=metadata_offset,
        metadata_length=metadata_length,
        leaf_dirs_offset=leaf_dirs_offset,
        leaf_dirs_length=leaf_dirs_length,
        tile_data_offset=tile_data_offset,
        tile_data_length=tile_data_length,
        addressed_tiles_count=addressed_tiles_count,
        tile_entries_count=tile_entries_count,
        tile_contents_count=tile_contents_count,
        clustered=bool(clustered),
        internal_compression=internal_compression,
        tile_compression=tile_compression,
        tile_type=tile_type,
        min_zoom=min_zoom,
        max_zoom=max_zoom,
        min_lon_e7=min_lon_e7,
        min_lat_e7=min_lat_e7,
        max_lon_e7=max_lon_e7,
        max_lat_e7=max_lat_e7,
        center_zoom=center_zoom,
        center_lon_e7=center_lon_e7,
        center_lat_e7=center_lat_e7,
    )


def _decompress(raw: bytes, compression: int) -> bytes:
    if compression == COMPRESSION_NONE:
        return raw
    if compression == COMPRESSION_GZIP:
        return gzip.decompress(raw)
    raise ValueError(f"unsupported compression {compression}")


def _varint(raw: bytes, offset: int) -> tuple[int, int]:
    value = 0
    shift = 0
    while True:
        byte = raw[offset]
        offset += 1
        value |= (byte & 0x7F) << shift
        if not byte & 0x80:
            return value, offset
        shift += 7


def _read_range(path: str, start: int, length: int) -> bytes:
    with open(path, "rb") as handle:
        handle.seek(start)
        return handle.read(length)


def parse_directory(raw: bytes) -> list[tuple[int, int, int, int]]:
    """Decode a columnar PMTiles v3 directory into (tile_id, run_length, length, offset)."""
    count, offset = _varint(raw, 0)
    ids = []
    last = 0
    for _ in range(count):
        delta, offset = _varint(raw, offset)
        last += delta
        ids.append(last)
    run_lengths = []
    for _ in range(count):
        value, offset = _varint(raw, offset)
        run_lengths.append(value)
    lengths = []
    for _ in range(count):
        value, offset = _varint(raw, offset)
        lengths.append(value)
    offsets = []
    previous = 0
    for index in range(count):
        value, offset = _varint(raw, offset)
        if value == 0 and index > 0:
            previous = previous + lengths[index - 1]
        else:
            previous = value - 1
        offsets.append(previous)
    return list(zip(ids, run_lengths, lengths, offsets))


def _walk_dir(
    raw: bytes, header: Header, path: str, out: dict[int, tuple[int, int]]
) -> None:
    for tile_id, run_length, length, offset in parse_directory(raw):
        if run_length == 0:
            if length == 0:
                continue
            leaf_raw = _decompress(
                _read_range(path, header.leaf_dirs_offset + offset, length),
                header.internal_compression,
            )
            _walk_dir(leaf_raw, header, path, out)
        else:
            for step in range(run_length):
                out[tile_id + step] = (length, header.tile_data_offset + offset)


def archive_index(path: str) -> tuple[Header, dict[int, tuple[int, int]]]:
    """Return the header and a mapping tile_id -> (stored byte length, file offset)."""
    header = read_header(path)
    root_raw = _decompress(
        _read_range(path, header.root_dir_offset, header.root_dir_length),
        header.internal_compression,
    )
    index: dict[int, tuple[int, int]] = {}
    _walk_dir(root_raw, header, path, index)
    if len(index) != header.addressed_tiles_count:
        raise ValueError(
            f"{path}: decoded {len(index)} tile entries but the header declares "
            f"{header.addressed_tiles_count}; the directory walk is wrong"
        )
    return header, index


def read_metadata(path: str) -> dict:
    header = read_header(path)
    raw = _read_range(path, header.metadata_offset, header.metadata_length)
    return json.loads(_decompress(raw, header.internal_compression))


def stored_tile(
    path: str, header: Header, index: dict[int, tuple[int, int]], z: int, x: int, y: int
) -> bytes | None:
    """Return the tile bytes as stored (gzip when tile_compression is gzip)."""
    entry = index.get(zxy_to_tile_id(z, x, y))
    if entry is None:
        return None
    length, offset = entry
    return _read_range(path, offset, length)


def bbox_tiles(
    z: int, west: float, south: float, east: float, north: float
) -> list[tuple[int, int]]:
    """Every tile of zoom z whose extent overlaps the bounding box."""
    n = 1 << z
    x0, y0 = lonlat_to_tile_xy(west, north, z)
    x1, y1 = lonlat_to_tile_xy(east, south, z)
    return [(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1) if 0 <= x < n and 0 <= y < n]


def viewport_tiles(
    z: int, center_lon: float, center_lat: float, width_px: int, height_px: int, tile_size: int = 256
) -> list[tuple[int, int]]:
    """Tiles MapLibre loads for a centred viewport of the given pixel size."""
    world_px = tile_size * (1 << z)
    centre_x, centre_y = lonlat_to_world_px(center_lon, center_lat, z, tile_size)
    left = centre_x - width_px / 2.0
    right = centre_x + width_px / 2.0
    top = centre_y - height_px / 2.0
    bottom = centre_y + height_px / 2.0
    x0 = int(math.floor(left / tile_size))
    x1 = int(math.floor((right - 1e-9) / tile_size))
    y0 = int(math.floor(top / tile_size))
    y1 = int(math.floor((bottom - 1e-9) / tile_size))
    n = 1 << z
    return [(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1) if 0 <= x < n and 0 <= y < n]
