

function saveToObj(mesh){

    var objText = generateObjText(mesh.geometry);

    var blob = new Blob([objText], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "MyTerrain.obj");
    
    

}

function generateObjText(geometry, material){

    var faces = geometry.faces;
    var vertices = geometry.vertices;
    var faceVertexUvs = geometry.faceVertexUvs[0];



    var result = '';
    
    
    // Vertices
    for(var i=0; i<vertices.length; i++){
        var vertex = vertices[i];

        result += "v " + vertex.x + " " + vertex.y + " " + vertex.z + "\n";
    }
    
    // UVs
    for (var i = 0; i < faceVertexUvs.length; i++) {
        var face = faceVertexUvs[i];
        for (var j = 0; j < face.length; j++) {
            var uv = face[j];

            result += "vt " + uv.x + " " + uv.y + "\n";
        }
    }

    // Normals
    for (var i = 0; i < faces.length; i++) {
        var face = faces[i];

        for (var j = 0; j < face.vertexNormals.length; j++) {
            var normal = face.vertexNormals[j];

            
            result += "vn " + normal.x + " " + normal.y + " " + normal.z + "\n";
        }
    }

    
    let currentMaterial = null;
    for (let i = 0; i < faces.length; i++) {
        const face = faces[i];

        if (material && face.materialIndex !== currentMaterial) {
            const mtl = material instanceof Array ? material[face.materialIndex] : material;

            output += `usemtl ${(mtl.name !== '') ? mtl.name : `material ${mtl.id}`}\n`;

            currentMaterial = face.materialIndex;
        }

        const faceIndexes = [face.a + 1, face.b + 1, face.c + 1]
            .map((faceIndex, j) => `${faceIndex}/${faceVertexUvs.length > 0 ? j : ''}/${i * 3 + j + 1}`)
            .join(' ');

        result += `f ${faceIndexes}\n`;
    }


    return result;
    
}