import "@testing-library/react";
import { beforeEach } from "vitest";

// Block 5 made Portuguese the default locale. The block 1 to 4 tests assert the English
// catalog, so every test starts in English; locale tests set or clear the key themselves.
beforeEach(() => {
  localStorage.setItem("fs.locale", "en");
});
