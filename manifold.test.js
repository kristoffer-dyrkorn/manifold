import * as fs from "fs";
import * as path from "path";
import { describe, expect, test } from "vitest";
import { checkMesh } from "./isManifoldSurface.mjs";

const manifoldMeshes = "./testdata/manifold/";
const nonManifoldMeshes = "./testdata/nonmanifold/";

describe("Testing manifold meshes", () => {
  fs.readdirSync(manifoldMeshes).forEach((file) => {
    const fullPath = path.resolve(manifoldMeshes, file);

    test(`Testing file ${file}`, () => {
      expect(checkMesh(fullPath)).toBe(true);
    });
  });
});

describe("Testing non-manifold meshes", () => {
  fs.readdirSync(nonManifoldMeshes).forEach((file) => {
    const fullPath = path.resolve(nonManifoldMeshes, file);

    test(`Testing file ${file}`, () => {
      expect(checkMesh(fullPath)).toBe(false);
    });
  });
});
