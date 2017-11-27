

function saveToObj(mesh){

    var objText = genObj(mesh.geometry);

    var blob = new Blob([objText], { type: "text/plain;charset=utf-8" });
    //saveAs(blob, "MyTerrain.obj");
    

}

function genObj(geometry){
    var result = "";

    // Vertices
    for (var i = 0; i < geometry.vertices.length; i++){        
        var v = geometry.vertices[i];
        result += "v " + v.x + " " + v.y + " " + v.z + "\n";
    }

    var maxIndex = 0;
    for (var i = 0; i < geometry.faces.length; i++){
        var f = geometry.faces[i]; 

        if(f.a < 0 || f.b < 0 || f.c < 0){
            console.log(f.a, f.b, f.c);
        }
        
        result += "f " + f.a + " " + f.b + " " + f.c + "\n";
    }


    return result;

}
