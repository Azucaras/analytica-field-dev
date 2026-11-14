from __future__ import annotations

import unittest

from fastapi.testclient import TestClient

from main import app


class CommandEndpointTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_commands_endpoint_lists_four_complete_entries(self):
        response = self.client.get("/commands")

        self.assertEqual(response.status_code, 200)
        commands = response.json()["commands"]
        self.assertEqual(len(commands), 4)
        self.assertEqual(
            {command["name"] for command in commands},
            {"select_field", "set_composition", "open_panel", "apply_filter"},
        )
        for command in commands:
            for key in ("name", "label", "input_schema", "effect", "idempotent", "guard"):
                self.assertIn(key, command)
            self.assertIsInstance(command["input_schema"], dict)
            self.assertTrue(command["input_schema"].get("properties"))

    def test_layers_rejects_invalid_tile_coordinates(self):
        response = self.client.get("/layers?z=2&x=4&y=0")

        self.assertEqual(response.status_code, 400)

    def test_unknown_command_returns_422_and_valid_names(self):
        response = self.client.post("/commands/not_a_command", json={})

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["valid_names"], [
            "select_field", "set_composition", "open_panel", "apply_filter"
        ])

    def test_valid_command_runs_and_returns_applied_effect(self):
        response = self.client.post("/commands/set_composition", json={"preset": "satellite"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["effect"], "set_composition")
        self.assertEqual(response.json()["arguments"], {"preset": "satellite"})

    def test_open_panel_schema_offers_only_scenarios_and_evidence(self):
        response = self.client.get("/commands")

        open_panel = next(
            command for command in response.json()["commands"] if command["name"] == "open_panel"
        )
        self.assertEqual(
            open_panel["input_schema"]["properties"]["panel"]["enum"],
            ["scenarios", "evidence"],
        )

    def test_open_panel_accepts_the_two_supported_panels(self):
        for panel in ("scenarios", "evidence"):
            response = self.client.post("/commands/open_panel", json={"panel": panel})

            self.assertEqual(response.status_code, 200, panel)
            self.assertEqual(response.json()["state"]["open_panel"], panel)

    def test_open_panel_rejects_the_withdrawn_constraints_panel(self):
        response = self.client.post("/commands/open_panel", json={"panel": "constraints"})

        self.assertEqual(response.status_code, 422)
        self.assertIn("panel", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()
