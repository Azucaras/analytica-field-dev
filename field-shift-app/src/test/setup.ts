import "@testing-library/react";
import { beforeEach } from "vitest";

// Portuguese is the default locale. Most tests assert the English
// catalog, so every test starts in English; locale tests set or clear the key themselves.
beforeEach(() => {
  localStorage.setItem("fs.locale", "en");
});
