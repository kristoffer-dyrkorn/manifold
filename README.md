# Manifold

Checks whether an input mesh (an OBJ file) is a manifold surface.

Based on a method described in [An introduction to Mesh Generation](https://perso.uclouvain.be/vincent.legat/documents/meca2170/meshGenerationBook.pdf), by Christophe Geuzaine Jean-François Remacle.

## Usage

Run `node verifyMesh.mjs <obj file to check>` from the command line. See under the `testdata/` folder for example data files.

The unit tests (implemented via `vitest`) in `manifold.test.js` can also be useful to look at. Run the tests by installing the needed dependencies and then running `vitest`, ie:

```
yarn
yarn test
```
