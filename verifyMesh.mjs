import { checkMesh } from "./isManifoldSurface.mjs";

if (process.argv.length != 3) {
  console.log("Usage: node verifyMesh.mjs <obj file>");
  process.exit();
}

const isManifold = checkMesh(process.argv[2]);
if (isManifold) {
  console.log("Is a manifold surface");
} else {
  console.log("Is NOT a manifold surface");
}
