"""AC-06: the United States zoom walk record names every zoom the criterion names.

The criterion names the walk `D`, `D+1`, `D+3` and 14, where `D` is the manifest's
`detail_minzoom` (Table G). The record is read here, so the criterion can be read from the
artifact alone. Run from the app root:

    python3 scripts/test_walk_record.py
"""

import glob
import json
import os
import unittest

APP_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIXTURES = os.path.join(APP_ROOT, "artifacts", "fixtures")
MANIFEST = os.path.join(APP_ROOT, "data", "polygons", "us-38017.manifest.json")


def newest_us_walk_record() -> str:
    """The most recent `polygon-tiles-us-<date>.json`, by its date in the file name."""
    paths = sorted(glob.glob(os.path.join(FIXTURES, "polygon-tiles-us-*.json")))
    if not paths:
        raise AssertionError("no polygon-tiles-us-<date>.json record is in artifacts/fixtures")
    return paths[-1]


class UsWalkRecordTest(unittest.TestCase):
    def setUp(self) -> None:
        with open(MANIFEST, encoding="utf-8") as handle:
            self.detail_minzoom = json.load(handle)["detail_minzoom"]
        with open(newest_us_walk_record(), encoding="utf-8") as handle:
            self.record = json.load(handle)

    def test_walk_names_d_d_plus_1_d_plus_3_and_14(self) -> None:
        d = self.detail_minzoom
        expected = {str(zoom) for zoom in (d, d + 1, d + 3, 14)}
        recorded = set(self.record["zoom_walk"].keys())
        missing = sorted(expected - recorded, key=int)
        self.assertEqual(missing, [], f"the walk record lacks zooms {missing} of D={d}")

    def test_every_walk_address_has_a_status_and_a_byte_count(self) -> None:
        for zoom, walk in self.record["zoom_walk"].items():
            for tile in walk["tiles"]:
                with self.subTest(zoom=zoom, tile=tile):
                    self.assertIn(tile["status"], ("present", "absent"))
                    self.assertIsInstance(tile["bytes"], int)

    def test_walk_zoom_14_is_the_same_camera_as_the_pinned_view_v2(self) -> None:
        walk = self.record["zoom_walk"].get("14")
        if walk is None:
            self.fail("zoom 14 is absent from the walk record")
        self.assertEqual(walk["center"], self.record["views"]["V2"]["camera"]["center"])


if __name__ == "__main__":
    unittest.main()
