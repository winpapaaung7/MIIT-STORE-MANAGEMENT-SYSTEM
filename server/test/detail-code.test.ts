import { expect, it } from "vitest";
import { detailCodeForSerial, latestDetailSerial } from "../src/inventory/detail-code.js";

it("starts a new item at serial one", () => {
  expect(detailCodeForSerial("0007", latestDetailSerial("0007", null) + 1)).toBe("0007-000001");
});
it("uses the highest serial despite deletions and smaller remaining counts", () => {
  const survivingCodes = ["0007-000001", "0007-000009", "0007-000330"];
  const latest = [...survivingCodes].sort().at(-1);
  expect(detailCodeForSerial("0007", latestDetailSerial("0007", latest) + 1)).toBe("0007-000331");
});
it("allocates consecutive codes across repeated bulk rows", () => {
  let serial = latestDetailSerial("0006", "0006-000338");
  const codes: string[] = [];
  for (const quantity of [2, 3]) {
    for (let offset = 1; offset <= quantity; offset++) codes.push(detailCodeForSerial("0006", serial + offset));
    serial += quantity;
  }
  expect(codes).toEqual(["0006-000339", "0006-000340", "0006-000341", "0006-000342", "0006-000343"]);
});
it("rejects exhausted serials and malformed existing codes", () => {
  expect(() => detailCodeForSerial("0007", 1000000)).toThrow();
  expect(() => latestDetailSerial("0007", "0008-000001")).toThrow();
  expect(() => latestDetailSerial("0007", "0007-xyz")).toThrow();
});
