import { enabledModulesSchema, moduleCatalogSchema } from "../schema";

describe("module configuration schemas", () => {
  it("accepts a catalog item returned by the backend", () => {
    expect(
      moduleCatalogSchema.safeParse([
        {
          key: "almacenes",
          label: "Almacenes",
          description: "Almacenes y transferencias.",
        },
      ]).success,
    ).toBe(true);
  });

  it("rejects duplicate enabled module keys", () => {
    expect(enabledModulesSchema.safeParse(["ventas", "ventas"]).success).toBe(
      false,
    );
  });
});
