import { ModuleCatalogService } from "./module-catalog.service";

describe("ModuleCatalogService", () => {
  const service = new ModuleCatalogService();

  it("includes the modules introduced in phase 5", () => {
    expect(service.findAll().map((module) => module.key)).toEqual(
      expect.arrayContaining([
        "almacenes",
        "lotes",
        "promociones",
        "mermas",
        "comprobantes",
      ]),
    );
  });

  it("accepts catalog keys and rejects unknown keys", () => {
    expect(
      service.isValidKeys(["inventario", "almacenes", "comprobantes"]),
    ).toBe(true);
    expect(service.isValidKeys(["inventario", "not-a-module"])).toBe(false);
  });
});
