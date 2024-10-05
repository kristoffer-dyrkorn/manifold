import * as fs from "fs";

function readOBJ(fileName) {
  const objData = fs.readFileSync(fileName, { encoding: "utf-8" });
  let vertices = [];
  let triangles = [];
  objData.split(/\r?\n/).forEach((line) => {
    const lineTokens = line.split(" ");
    switch (lineTokens[0]) {
      case "v":
        vertices.push([+lineTokens[1], +lineTokens[2], +lineTokens[3]]);
        break;
      case "f":
        const vertex = new Array(lineTokens.length - 1);
        for (let i = 1; i < lineTokens.length; ++i) {
          const indices = lineTokens[i].split("/");
          vertex[i - 1] = indices[0] - 1;
        }
        triangles.push(vertex);
        break;
    }
  });
  return [vertices, triangles];
}

function unindexGeometry(meshTriangles, meshVertices) {
  return meshTriangles
    .map((triangle) => {
      return [
        meshVertices[triangle[0]],
        meshVertices[triangle[1]],
        meshVertices[triangle[2]],
      ];
    })
    .flat();
}

// from https://stackoverflow.com/a/58519810
function chunkify(array, chunkSize) {
  return array.reduce(
    (result, item, index) =>
      (index % chunkSize
        ? result[result.length - 1].push(item)
        : result.push([item])) && result,
    []
  );
}

function indexGeometry(unindexedVertices) {
  // here we do not consider whether very close vertices should be considered equal.
  // the chosen convention is that vertices are only equal if the string representation is equal

  // map: vertex hash, ie (3D coordinate as a string) -> vertex value ([x, y, z])
  const vertexMap = new Map();
  const indices = [];

  unindexedVertices.forEach((v) => {
    // use the string representation of the vertex (3D coordinate) as hash key
    // example: a vertex v = [0.1, 0.4, 0.5] will get the key "0.1,0.4,0.5"
    const vertexKey = v.toString();

    if (vertexMap.has(vertexKey)) {
      // we have seen the vertex before - find its index and store it
      const keysArray = Array.from(vertexMap.keys());
      const index = keysArray.indexOf(vertexKey);
      indices.push(index);
    } else {
      // this is a new vertex - add the index value to the index array and store the vertex in the map
      indices.push(vertexMap.size);
      vertexMap.set(vertexKey, v);
    }
  });

  // generate triangle arrays out of the flat indices array
  const triangles = chunkify(indices, 3);

  // the vertex map (fortunately) keepst the values in insertion order
  return [Array.from(vertexMap.values()), triangles];
}

function getEdgeKey(i1, i2) {
  // ignore edge direction by always returning smallest index first
  if (i1 < i2) {
    return `${i1}-${i2}`;
  } else {
    return `${i2}-${i1}`;
  }
}

function classifyEdges(triangles) {
  // map: edge (string representation: start vertex - end vertex) -> list of triangle (indices) having that edge
  // note: edge direction is here ignored, ie 1->2 will be considered equal to 2->1
  const edgeMap = new Map();

  triangles.forEach((tri, triangleIndex) => {
    for (let i = 0; i < 3; i++) {
      // get a hash key for this edge
      const edgeKey = getEdgeKey(tri[i], tri[(i + 1) % 3]);
      const triangles = edgeMap.get(edgeKey);

      // register this edge as belonging to the current triangle
      if (triangles) {
        // we have seen this triangle before - update current triangle list (map value) with this one
        triangles.push(triangleIndex);
      } else {
        // this is a new triangle, create a new map entry for this key with the current triangle stored as a list
        edgeMap.set(edgeKey, [triangleIndex]);
      }
    }
  });

  const interiorEdges = [];
  const boundaryEdges = [];

  edgeMap.forEach((tris, edgeKey) => {
    if (tris.length == 2) {
      interiorEdges.push(edgeKey);
    } else if (tris.length == 1) {
      boundaryEdges.push(edgeKey);
    } else {
      console.info(
        `Info: The edge ${edgeKey} belongs to ${tris.length} triangles, this mesh is not manifold.`
      );
    }
  });

  return [interiorEdges, boundaryEdges];
}

// return the number of unique vertices along the boundary of the mesh
function getBoundaryVerticesCount(boundaryEdges) {
  const verticesAsStrings = boundaryEdges.map((e) => e.split("-")).flat();
  const vertices = verticesAsStrings.map((v) => +v);
  return Array.from(new Set(vertices)).length;
}

// calculate various metrics for the surface - based on vertices and edges
// if the mesh counts match the metrics then the surface is regarded to be a manifold
function isManifoldSurface(triangles, vertices) {
  const [interiorEdges, boundaryEdges] = classifyEdges(triangles);
  const totalEdges = interiorEdges.length + boundaryEdges.length;

  const facesMetric = 2 * (vertices.length - 1) - boundaryEdges.length;
  const edgesMetric = 3 * (vertices.length - 1) - boundaryEdges.length;
  const boundaryMetric = getBoundaryVerticesCount(boundaryEdges);

  let facesPass = false;
  if (triangles.length == facesMetric) {
    facesPass = true;
  }

  let edgesPass = false;
  if (totalEdges == edgesMetric) {
    edgesPass = true;
  }

  let boundaryPass = false;
  if (boundaryEdges.length == boundaryMetric) {
    boundaryPass = true;
  }

  return facesPass && edgesPass && boundaryPass;
}

export function checkMesh(fileName) {
  const [meshVertices, meshTriangles] = readOBJ(fileName);

  // the input might contain "fake" indexed geometries, ie duplicate vertices that just have different indices
  // so, first un-index the geometry...
  const unindexedVertices = unindexGeometry(meshTriangles, meshVertices);

  // ...and then recreate the mesh as (fully) indexed geometry
  const [vertices, triangles] = indexGeometry(unindexedVertices);

  return isManifoldSurface(triangles, vertices);
}
