function MarchingCubes(size, resolution){

    var context = this;
    
    this.resolution = resolution || 10;
    this.size = size || 10;
    this.dx = this.dy = this.dz = this.size / this.resolution;
    intializeData();
    this.gridCells;
    this.isoValue = 10;
    this.data;

    // Billboards
    this.billboardGeometry = new THREE.Geometry();
    var sprite = new THREE.TextureLoader().load( "ball.png" );
    this.pointsMaterial = new THREE.PointsMaterial( { size: 35, sizeAttenuation: false, map: sprite, alphaTest: 0.5, transparent: true } );
    this.pointsMaterial.color.setHSL( 1.0, 0.3, 0.7 );

    // Volume
    this.geometry = new THREE.Geometry();
    this.volumeMaterial =  new THREE.MeshLambertMaterial( {color: 0x00ff00, side: THREE.DoubleSide} );
    this.mesh = new THREE.Mesh( this.geometry, this.volumeMaterial );


    this.init = function(material){
        this.resolution = resolution || 10;
        this.size = size || 10;
        this.dx = this.dy = this.dz = this.size / this.resolution;
        this.volumeMaterial = material;
    
        this.isoValue = 0;

        // Lookup tables from Paul Bourke's implementation
        // http://paulbourke.net/geometry/polygonise/
        this.edgeTable = [
            0x0  , 0x109, 0x203, 0x30a, 0x406, 0x50f, 0x605, 0x70c,
            0x80c, 0x905, 0xa0f, 0xb06, 0xc0a, 0xd03, 0xe09, 0xf00,
            0x190, 0x99 , 0x393, 0x29a, 0x596, 0x49f, 0x795, 0x69c,
            0x99c, 0x895, 0xb9f, 0xa96, 0xd9a, 0xc93, 0xf99, 0xe90,
            0x230, 0x339, 0x33 , 0x13a, 0x636, 0x73f, 0x435, 0x53c,
            0xa3c, 0xb35, 0x83f, 0x936, 0xe3a, 0xf33, 0xc39, 0xd30,
            0x3a0, 0x2a9, 0x1a3, 0xaa , 0x7a6, 0x6af, 0x5a5, 0x4ac,
            0xbac, 0xaa5, 0x9af, 0x8a6, 0xfaa, 0xea3, 0xda9, 0xca0,
            0x460, 0x569, 0x663, 0x76a, 0x66 , 0x16f, 0x265, 0x36c,
            0xc6c, 0xd65, 0xe6f, 0xf66, 0x86a, 0x963, 0xa69, 0xb60,
            0x5f0, 0x4f9, 0x7f3, 0x6fa, 0x1f6, 0xff , 0x3f5, 0x2fc,
            0xdfc, 0xcf5, 0xfff, 0xef6, 0x9fa, 0x8f3, 0xbf9, 0xaf0,
            0x650, 0x759, 0x453, 0x55a, 0x256, 0x35f, 0x55 , 0x15c,
            0xe5c, 0xf55, 0xc5f, 0xd56, 0xa5a, 0xb53, 0x859, 0x950,
            0x7c0, 0x6c9, 0x5c3, 0x4ca, 0x3c6, 0x2cf, 0x1c5, 0xcc ,
            0xfcc, 0xec5, 0xdcf, 0xcc6, 0xbca, 0xac3, 0x9c9, 0x8c0,
            0x8c0, 0x9c9, 0xac3, 0xbca, 0xcc6, 0xdcf, 0xec5, 0xfcc,
            0xcc , 0x1c5, 0x2cf, 0x3c6, 0x4ca, 0x5c3, 0x6c9, 0x7c0,
            0x950, 0x859, 0xb53, 0xa5a, 0xd56, 0xc5f, 0xf55, 0xe5c,
            0x15c, 0x55 , 0x35f, 0x256, 0x55a, 0x453, 0x759, 0x650,
            0xaf0, 0xbf9, 0x8f3, 0x9fa, 0xef6, 0xfff, 0xcf5, 0xdfc,
            0x2fc, 0x3f5, 0xff , 0x1f6, 0x6fa, 0x7f3, 0x4f9, 0x5f0,
            0xb60, 0xa69, 0x963, 0x86a, 0xf66, 0xe6f, 0xd65, 0xc6c,
            0x36c, 0x265, 0x16f, 0x66 , 0x76a, 0x663, 0x569, 0x460,
            0xca0, 0xda9, 0xea3, 0xfaa, 0x8a6, 0x9af, 0xaa5, 0xbac,
            0x4ac, 0x5a5, 0x6af, 0x7a6, 0xaa , 0x1a3, 0x2a9, 0x3a0,
            0xd30, 0xc39, 0xf33, 0xe3a, 0x936, 0x83f, 0xb35, 0xa3c,
            0x53c, 0x435, 0x73f, 0x636, 0x13a, 0x33 , 0x339, 0x230,
            0xe90, 0xf99, 0xc93, 0xd9a, 0xa96, 0xb9f, 0x895, 0x99c,
            0x69c, 0x795, 0x49f, 0x596, 0x29a, 0x393, 0x99 , 0x190,
            0xf00, 0xe09, 0xd03, 0xc0a, 0xb06, 0xa0f, 0x905, 0x80c,
            0x70c, 0x605, 0x50f, 0x406, 0x30a, 0x203, 0x109, 0x0
        ];

        this.triTable = [
            [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [0, 1, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [1, 8, 3, 9, 8, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [0, 8, 3, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [9, 2, 10, 0, 2, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [2, 8, 3, 2, 10, 8, 10, 9, 8, -1, -1, -1, -1, -1, -1, -1],
            [3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [0, 11, 2, 8, 11, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [1, 9, 0, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [1, 11, 2, 1, 9, 11, 9, 8, 11, -1, -1, -1, -1, -1, -1, -1],
            [3, 10, 1, 11, 10, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [0, 10, 1, 0, 8, 10, 8, 11, 10, -1, -1, -1, -1, -1, -1, -1],
            [3, 9, 0, 3, 11, 9, 11, 10, 9, -1, -1, -1, -1, -1, -1, -1],
            [9, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [4, 3, 0, 7, 3, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [0, 1, 9, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [4, 1, 9, 4, 7, 1, 7, 3, 1, -1, -1, -1, -1, -1, -1, -1],
            [1, 2, 10, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [3, 4, 7, 3, 0, 4, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1],
            [9, 2, 10, 9, 0, 2, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1],
            [2, 10, 9, 2, 9, 7, 2, 7, 3, 7, 9, 4, -1, -1, -1, -1],
            [8, 4, 7, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [11, 4, 7, 11, 2, 4, 2, 0, 4, -1, -1, -1, -1, -1, -1, -1],
            [9, 0, 1, 8, 4, 7, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1],
            [4, 7, 11, 9, 4, 11, 9, 11, 2, 9, 2, 1, -1, -1, -1, -1],
            [3, 10, 1, 3, 11, 10, 7, 8, 4, -1, -1, -1, -1, -1, -1, -1],
            [1, 11, 10, 1, 4, 11, 1, 0, 4, 7, 11, 4, -1, -1, -1, -1],
            [4, 7, 8, 9, 0, 11, 9, 11, 10, 11, 0, 3, -1, -1, -1, -1],
            [4, 7, 11, 4, 11, 9, 9, 11, 10, -1, -1, -1, -1, -1, -1, -1],
            [9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [9, 5, 4, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [0, 5, 4, 1, 5, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [8, 5, 4, 8, 3, 5, 3, 1, 5, -1, -1, -1, -1, -1, -1, -1],
            [1, 2, 10, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [3, 0, 8, 1, 2, 10, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1],
            [5, 2, 10, 5, 4, 2, 4, 0, 2, -1, -1, -1, -1, -1, -1, -1],
            [2, 10, 5, 3, 2, 5, 3, 5, 4, 3, 4, 8, -1, -1, -1, -1],
            [9, 5, 4, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [0, 11, 2, 0, 8, 11, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1],
            [0, 5, 4, 0, 1, 5, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1],
            [2, 1, 5, 2, 5, 8, 2, 8, 11, 4, 8, 5, -1, -1, -1, -1],
            [10, 3, 11, 10, 1, 3, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1],
            [4, 9, 5, 0, 8, 1, 8, 10, 1, 8, 11, 10, -1, -1, -1, -1],
            [5, 4, 0, 5, 0, 11, 5, 11, 10, 11, 0, 3, -1, -1, -1, -1],
            [5, 4, 8, 5, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1],
            [9, 7, 8, 5, 7, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [9, 3, 0, 9, 5, 3, 5, 7, 3, -1, -1, -1, -1, -1, -1, -1],
            [0, 7, 8, 0, 1, 7, 1, 5, 7, -1, -1, -1, -1, -1, -1, -1],
            [1, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [9, 7, 8, 9, 5, 7, 10, 1, 2, -1, -1, -1, -1, -1, -1, -1],
            [10, 1, 2, 9, 5, 0, 5, 3, 0, 5, 7, 3, -1, -1, -1, -1],
            [8, 0, 2, 8, 2, 5, 8, 5, 7, 10, 5, 2, -1, -1, -1, -1],
            [2, 10, 5, 2, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1],
            [7, 9, 5, 7, 8, 9, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1],
            [9, 5, 7, 9, 7, 2, 9, 2, 0, 2, 7, 11, -1, -1, -1, -1],
            [2, 3, 11, 0, 1, 8, 1, 7, 8, 1, 5, 7, -1, -1, -1, -1],
            [11, 2, 1, 11, 1, 7, 7, 1, 5, -1, -1, -1, -1, -1, -1, -1],
            [9, 5, 8, 8, 5, 7, 10, 1, 3, 10, 3, 11, -1, -1, -1, -1],
            [5, 7, 0, 5, 0, 9, 7, 11, 0, 1, 0, 10, 11, 10, 0, -1],
            [11, 10, 0, 11, 0, 3, 10, 5, 0, 8, 0, 7, 5, 7, 0, -1],
            [11, 10, 5, 7, 11, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [0, 8, 3, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [9, 0, 1, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [1, 8, 3, 1, 9, 8, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1],
            [1, 6, 5, 2, 6, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [1, 6, 5, 1, 2, 6, 3, 0, 8, -1, -1, -1, -1, -1, -1, -1],
            [9, 6, 5, 9, 0, 6, 0, 2, 6, -1, -1, -1, -1, -1, -1, -1],
            [5, 9, 8, 5, 8, 2, 5, 2, 6, 3, 2, 8, -1, -1, -1, -1],
            [2, 3, 11, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [11, 0, 8, 11, 2, 0, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1],
            [0, 1, 9, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1],
            [5, 10, 6, 1, 9, 2, 9, 11, 2, 9, 8, 11, -1, -1, -1, -1],
            [6, 3, 11, 6, 5, 3, 5, 1, 3, -1, -1, -1, -1, -1, -1, -1],
            [0, 8, 11, 0, 11, 5, 0, 5, 1, 5, 11, 6, -1, -1, -1, -1],
            [3, 11, 6, 0, 3, 6, 0, 6, 5, 0, 5, 9, -1, -1, -1, -1],
            [6, 5, 9, 6, 9, 11, 11, 9, 8, -1, -1, -1, -1, -1, -1, -1],
            [5, 10, 6, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [4, 3, 0, 4, 7, 3, 6, 5, 10, -1, -1, -1, -1, -1, -1, -1],
            [1, 9, 0, 5, 10, 6, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1],
            [10, 6, 5, 1, 9, 7, 1, 7, 3, 7, 9, 4, -1, -1, -1, -1],
            [6, 1, 2, 6, 5, 1, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1],
            [1, 2, 5, 5, 2, 6, 3, 0, 4, 3, 4, 7, -1, -1, -1, -1],
            [8, 4, 7, 9, 0, 5, 0, 6, 5, 0, 2, 6, -1, -1, -1, -1],
            [7, 3, 9, 7, 9, 4, 3, 2, 9, 5, 9, 6, 2, 6, 9, -1],
            [3, 11, 2, 7, 8, 4, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1],
            [5, 10, 6, 4, 7, 2, 4, 2, 0, 2, 7, 11, -1, -1, -1, -1],
            [0, 1, 9, 4, 7, 8, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1],
            [9, 2, 1, 9, 11, 2, 9, 4, 11, 7, 11, 4, 5, 10, 6, -1],
            [8, 4, 7, 3, 11, 5, 3, 5, 1, 5, 11, 6, -1, -1, -1, -1],
            [5, 1, 11, 5, 11, 6, 1, 0, 11, 7, 11, 4, 0, 4, 11, -1],
            [0, 5, 9, 0, 6, 5, 0, 3, 6, 11, 6, 3, 8, 4, 7, -1],
            [6, 5, 9, 6, 9, 11, 4, 7, 9, 7, 11, 9, -1, -1, -1, -1],
            [10, 4, 9, 6, 4, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [4, 10, 6, 4, 9, 10, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1],
            [10, 0, 1, 10, 6, 0, 6, 4, 0, -1, -1, -1, -1, -1, -1, -1],
            [8, 3, 1, 8, 1, 6, 8, 6, 4, 6, 1, 10, -1, -1, -1, -1],
            [1, 4, 9, 1, 2, 4, 2, 6, 4, -1, -1, -1, -1, -1, -1, -1],
            [3, 0, 8, 1, 2, 9, 2, 4, 9, 2, 6, 4, -1, -1, -1, -1],
            [0, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [8, 3, 2, 8, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1],
            [10, 4, 9, 10, 6, 4, 11, 2, 3, -1, -1, -1, -1, -1, -1, -1],
            [0, 8, 2, 2, 8, 11, 4, 9, 10, 4, 10, 6, -1, -1, -1, -1],
            [3, 11, 2, 0, 1, 6, 0, 6, 4, 6, 1, 10, -1, -1, -1, -1],
            [6, 4, 1, 6, 1, 10, 4, 8, 1, 2, 1, 11, 8, 11, 1, -1],
            [9, 6, 4, 9, 3, 6, 9, 1, 3, 11, 6, 3, -1, -1, -1, -1],
            [8, 11, 1, 8, 1, 0, 11, 6, 1, 9, 1, 4, 6, 4, 1, -1],
            [3, 11, 6, 3, 6, 0, 0, 6, 4, -1, -1, -1, -1, -1, -1, -1],
            [6, 4, 8, 11, 6, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [7, 10, 6, 7, 8, 10, 8, 9, 10, -1, -1, -1, -1, -1, -1, -1],
            [0, 7, 3, 0, 10, 7, 0, 9, 10, 6, 7, 10, -1, -1, -1, -1],
            [10, 6, 7, 1, 10, 7, 1, 7, 8, 1, 8, 0, -1, -1, -1, -1],
            [10, 6, 7, 10, 7, 1, 1, 7, 3, -1, -1, -1, -1, -1, -1, -1],
            [1, 2, 6, 1, 6, 8, 1, 8, 9, 8, 6, 7, -1, -1, -1, -1],
            [2, 6, 9, 2, 9, 1, 6, 7, 9, 0, 9, 3, 7, 3, 9, -1],
            [7, 8, 0, 7, 0, 6, 6, 0, 2, -1, -1, -1, -1, -1, -1, -1],
            [7, 3, 2, 6, 7, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [2, 3, 11, 10, 6, 8, 10, 8, 9, 8, 6, 7, -1, -1, -1, -1],
            [2, 0, 7, 2, 7, 11, 0, 9, 7, 6, 7, 10, 9, 10, 7, -1],
            [1, 8, 0, 1, 7, 8, 1, 10, 7, 6, 7, 10, 2, 3, 11, -1],
            [11, 2, 1, 11, 1, 7, 10, 6, 1, 6, 7, 1, -1, -1, -1, -1],
            [8, 9, 6, 8, 6, 7, 9, 1, 6, 11, 6, 3, 1, 3, 6, -1],
            [0, 9, 1, 11, 6, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [7, 8, 0, 7, 0, 6, 3, 11, 0, 11, 6, 0, -1, -1, -1, -1],
            [7, 11, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [3, 0, 8, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [0, 1, 9, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [8, 1, 9, 8, 3, 1, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1],
            [10, 1, 2, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [1, 2, 10, 3, 0, 8, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1],
            [2, 9, 0, 2, 10, 9, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1],
            [6, 11, 7, 2, 10, 3, 10, 8, 3, 10, 9, 8, -1, -1, -1, -1],
            [7, 2, 3, 6, 2, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [7, 0, 8, 7, 6, 0, 6, 2, 0, -1, -1, -1, -1, -1, -1, -1],
            [2, 7, 6, 2, 3, 7, 0, 1, 9, -1, -1, -1, -1, -1, -1, -1],
            [1, 6, 2, 1, 8, 6, 1, 9, 8, 8, 7, 6, -1, -1, -1, -1],
            [10, 7, 6, 10, 1, 7, 1, 3, 7, -1, -1, -1, -1, -1, -1, -1],
            [10, 7, 6, 1, 7, 10, 1, 8, 7, 1, 0, 8, -1, -1, -1, -1],
            [0, 3, 7, 0, 7, 10, 0, 10, 9, 6, 10, 7, -1, -1, -1, -1],
            [7, 6, 10, 7, 10, 8, 8, 10, 9, -1, -1, -1, -1, -1, -1, -1],
            [6, 8, 4, 11, 8, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [3, 6, 11, 3, 0, 6, 0, 4, 6, -1, -1, -1, -1, -1, -1, -1],
            [8, 6, 11, 8, 4, 6, 9, 0, 1, -1, -1, -1, -1, -1, -1, -1],
            [9, 4, 6, 9, 6, 3, 9, 3, 1, 11, 3, 6, -1, -1, -1, -1],
            [6, 8, 4, 6, 11, 8, 2, 10, 1, -1, -1, -1, -1, -1, -1, -1],
            [1, 2, 10, 3, 0, 11, 0, 6, 11, 0, 4, 6, -1, -1, -1, -1],
            [4, 11, 8, 4, 6, 11, 0, 2, 9, 2, 10, 9, -1, -1, -1, -1],
            [10, 9, 3, 10, 3, 2, 9, 4, 3, 11, 3, 6, 4, 6, 3, -1],
            [8, 2, 3, 8, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1],
            [0, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [1, 9, 0, 2, 3, 4, 2, 4, 6, 4, 3, 8, -1, -1, -1, -1],
            [1, 9, 4, 1, 4, 2, 2, 4, 6, -1, -1, -1, -1, -1, -1, -1],
            [8, 1, 3, 8, 6, 1, 8, 4, 6, 6, 10, 1, -1, -1, -1, -1],
            [10, 1, 0, 10, 0, 6, 6, 0, 4, -1, -1, -1, -1, -1, -1, -1],
            [4, 6, 3, 4, 3, 8, 6, 10, 3, 0, 3, 9, 10, 9, 3, -1],
            [10, 9, 4, 6, 10, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [4, 9, 5, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [0, 8, 3, 4, 9, 5, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1],
            [5, 0, 1, 5, 4, 0, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1],
            [11, 7, 6, 8, 3, 4, 3, 5, 4, 3, 1, 5, -1, -1, -1, -1],
            [9, 5, 4, 10, 1, 2, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1],
            [6, 11, 7, 1, 2, 10, 0, 8, 3, 4, 9, 5, -1, -1, -1, -1],
            [7, 6, 11, 5, 4, 10, 4, 2, 10, 4, 0, 2, -1, -1, -1, -1],
            [3, 4, 8, 3, 5, 4, 3, 2, 5, 10, 5, 2, 11, 7, 6, -1],
            [7, 2, 3, 7, 6, 2, 5, 4, 9, -1, -1, -1, -1, -1, -1, -1],
            [9, 5, 4, 0, 8, 6, 0, 6, 2, 6, 8, 7, -1, -1, -1, -1],
            [3, 6, 2, 3, 7, 6, 1, 5, 0, 5, 4, 0, -1, -1, -1, -1],
            [6, 2, 8, 6, 8, 7, 2, 1, 8, 4, 8, 5, 1, 5, 8, -1],
            [9, 5, 4, 10, 1, 6, 1, 7, 6, 1, 3, 7, -1, -1, -1, -1],
            [1, 6, 10, 1, 7, 6, 1, 0, 7, 8, 7, 0, 9, 5, 4, -1],
            [4, 0, 10, 4, 10, 5, 0, 3, 10, 6, 10, 7, 3, 7, 10, -1],
            [7, 6, 10, 7, 10, 8, 5, 4, 10, 4, 8, 10, -1, -1, -1, -1],
            [6, 9, 5, 6, 11, 9, 11, 8, 9, -1, -1, -1, -1, -1, -1, -1],
            [3, 6, 11, 0, 6, 3, 0, 5, 6, 0, 9, 5, -1, -1, -1, -1],
            [0, 11, 8, 0, 5, 11, 0, 1, 5, 5, 6, 11, -1, -1, -1, -1],
            [6, 11, 3, 6, 3, 5, 5, 3, 1, -1, -1, -1, -1, -1, -1, -1],
            [1, 2, 10, 9, 5, 11, 9, 11, 8, 11, 5, 6, -1, -1, -1, -1],
            [0, 11, 3, 0, 6, 11, 0, 9, 6, 5, 6, 9, 1, 2, 10, -1],
            [11, 8, 5, 11, 5, 6, 8, 0, 5, 10, 5, 2, 0, 2, 5, -1],
            [6, 11, 3, 6, 3, 5, 2, 10, 3, 10, 5, 3, -1, -1, -1, -1],
            [5, 8, 9, 5, 2, 8, 5, 6, 2, 3, 8, 2, -1, -1, -1, -1],
            [9, 5, 6, 9, 6, 0, 0, 6, 2, -1, -1, -1, -1, -1, -1, -1],
            [1, 5, 8, 1, 8, 0, 5, 6, 8, 3, 8, 2, 6, 2, 8, -1],
            [1, 5, 6, 2, 1, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [1, 3, 6, 1, 6, 10, 3, 8, 6, 5, 6, 9, 8, 9, 6, -1],
            [10, 1, 0, 10, 0, 6, 9, 5, 0, 5, 6, 0, -1, -1, -1, -1],
            [0, 3, 8, 5, 6, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [10, 5, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [11, 5, 10, 7, 5, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [11, 5, 10, 11, 7, 5, 8, 3, 0, -1, -1, -1, -1, -1, -1, -1],
            [5, 11, 7, 5, 10, 11, 1, 9, 0, -1, -1, -1, -1, -1, -1, -1],
            [10, 7, 5, 10, 11, 7, 9, 8, 1, 8, 3, 1, -1, -1, -1, -1],
            [11, 1, 2, 11, 7, 1, 7, 5, 1, -1, -1, -1, -1, -1, -1, -1],
            [0, 8, 3, 1, 2, 7, 1, 7, 5, 7, 2, 11, -1, -1, -1, -1],
            [9, 7, 5, 9, 2, 7, 9, 0, 2, 2, 11, 7, -1, -1, -1, -1],
            [7, 5, 2, 7, 2, 11, 5, 9, 2, 3, 2, 8, 9, 8, 2, -1],
            [2, 5, 10, 2, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1],
            [8, 2, 0, 8, 5, 2, 8, 7, 5, 10, 2, 5, -1, -1, -1, -1],
            [9, 0, 1, 5, 10, 3, 5, 3, 7, 3, 10, 2, -1, -1, -1, -1],
            [9, 8, 2, 9, 2, 1, 8, 7, 2, 10, 2, 5, 7, 5, 2, -1],
            [1, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [0, 8, 7, 0, 7, 1, 1, 7, 5, -1, -1, -1, -1, -1, -1, -1],
            [9, 0, 3, 9, 3, 5, 5, 3, 7, -1, -1, -1, -1, -1, -1, -1],
            [9, 8, 7, 5, 9, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [5, 8, 4, 5, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1],
            [5, 0, 4, 5, 11, 0, 5, 10, 11, 11, 3, 0, -1, -1, -1, -1],
            [0, 1, 9, 8, 4, 10, 8, 10, 11, 10, 4, 5, -1, -1, -1, -1],
            [10, 11, 4, 10, 4, 5, 11, 3, 4, 9, 4, 1, 3, 1, 4, -1],
            [2, 5, 1, 2, 8, 5, 2, 11, 8, 4, 5, 8, -1, -1, -1, -1],
            [0, 4, 11, 0, 11, 3, 4, 5, 11, 2, 11, 1, 5, 1, 11, -1],
            [0, 2, 5, 0, 5, 9, 2, 11, 5, 4, 5, 8, 11, 8, 5, -1],
            [9, 4, 5, 2, 11, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [2, 5, 10, 3, 5, 2, 3, 4, 5, 3, 8, 4, -1, -1, -1, -1],
            [5, 10, 2, 5, 2, 4, 4, 2, 0, -1, -1, -1, -1, -1, -1, -1],
            [3, 10, 2, 3, 5, 10, 3, 8, 5, 4, 5, 8, 0, 1, 9, -1],
            [5, 10, 2, 5, 2, 4, 1, 9, 2, 9, 4, 2, -1, -1, -1, -1],
            [8, 4, 5, 8, 5, 3, 3, 5, 1, -1, -1, -1, -1, -1, -1, -1],
            [0, 4, 5, 1, 0, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [8, 4, 5, 8, 5, 3, 9, 0, 5, 0, 3, 5, -1, -1, -1, -1],
            [9, 4, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [4, 11, 7, 4, 9, 11, 9, 10, 11, -1, -1, -1, -1, -1, -1, -1],
            [0, 8, 3, 4, 9, 7, 9, 11, 7, 9, 10, 11, -1, -1, -1, -1],
            [1, 10, 11, 1, 11, 4, 1, 4, 0, 7, 4, 11, -1, -1, -1, -1],
            [3, 1, 4, 3, 4, 8, 1, 10, 4, 7, 4, 11, 10, 11, 4, -1],
            [4, 11, 7, 9, 11, 4, 9, 2, 11, 9, 1, 2, -1, -1, -1, -1],
            [9, 7, 4, 9, 11, 7, 9, 1, 11, 2, 11, 1, 0, 8, 3, -1],
            [11, 7, 4, 11, 4, 2, 2, 4, 0, -1, -1, -1, -1, -1, -1, -1],
            [11, 7, 4, 11, 4, 2, 8, 3, 4, 3, 2, 4, -1, -1, -1, -1],
            [2, 9, 10, 2, 7, 9, 2, 3, 7, 7, 4, 9, -1, -1, -1, -1],
            [9, 10, 7, 9, 7, 4, 10, 2, 7, 8, 7, 0, 2, 0, 7, -1],
            [3, 7, 10, 3, 10, 2, 7, 4, 10, 1, 10, 0, 4, 0, 10, -1],
            [1, 10, 2, 8, 7, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [4, 9, 1, 4, 1, 7, 7, 1, 3, -1, -1, -1, -1, -1, -1, -1],
            [4, 9, 1, 4, 1, 7, 0, 8, 1, 8, 7, 1, -1, -1, -1, -1],
            [4, 0, 3, 7, 4, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [4, 8, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [9, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [3, 0, 9, 3, 9, 11, 11, 9, 10, -1, -1, -1, -1, -1, -1, -1],
            [0, 1, 10, 0, 10, 8, 8, 10, 11, -1, -1, -1, -1, -1, -1, -1],
            [3, 1, 10, 11, 3, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [1, 2, 11, 1, 11, 9, 9, 11, 8, -1, -1, -1, -1, -1, -1, -1],
            [3, 0, 9, 3, 9, 11, 1, 2, 9, 2, 11, 9, -1, -1, -1, -1],
            [0, 2, 11, 8, 0, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [3, 2, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [2, 3, 8, 2, 8, 10, 10, 8, 9, -1, -1, -1, -1, -1, -1, -1],
            [9, 10, 2, 0, 9, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [2, 3, 8, 2, 8, 10, 0, 1, 8, 1, 10, 8, -1, -1, -1, -1],
            [1, 10, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [1, 3, 8, 9, 1, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [0, 9, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [0, 3, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]
        ];
        initCells();
        // Generate mesh
        this.generateMesh();

        // DEBUG //
        
        setupBillboards();
        

        // Remove splashscreen when loading is done
        $('#loadscreen').fadeOut();
    };

    this.paint = function(i,j,k, buttonPressed){
        var offset = 0;
        // left-click
        if (buttonPressed == 0)
            offset = -0.1;
        // right-click
        else if (buttonPressed == 2)
            offset = 0.1;

        console.log("PAINTING..");

        console.log( "number of vertices before paint: " + this.geometry.vertices.length);

        var paintRadii = parameters.paintSize;


        for (var x = i - paintRadii; x < i + paintRadii; x++)
        {
            for (var y = j - paintRadii; y < j + paintRadii; y++)
            {
                for (var z = k - paintRadii; z < k + paintRadii; z++)
                {
                    // distance from center to currently evaluated point
                    var distance = dist(i,j,k,x,y,z);
                    if ( distance < paintRadii ) {
                        var newIso = this.isoValue +
                            ( paintRadii / (distance + 1) - ((paintRadii + 1) / paintRadii)) * offset;
                        if ( newIso < this.data[x][y][z] )
                            this.data[x][y][z] = newIso;
                    }
                }
            }
        }
        var t0 = performance.now();
        updateCells(i, j, k, paintRadii);
        this.generateMesh();
        console.log( "number of vertices after paint: " + this.geometry.vertices.length);
        var t1 = performance.now();
        console.log("initCells() took " + (t1-t0) + "ms");
    };

    this.setISO = function(value) {

        this.isoValue = value;

        if (this.parameters.renderBillboards) {
            setupBillboards();
        }
        this.generateMesh();
    };

    this.generateMesh = function(){
        this.geometry.dispose();
        this.geometry = new THREE.Geometry();
        
        this.vertexIndex = 0; 
        
        

        for(var i = 0; i < this.resolution - 1; i++)
        {
            for(var j = 0; j < this.resolution - 1; j++)
            {
                for(var k = 0; k < this.resolution - 1; k++)
                {
                    this.polygonise(this.gridCells[i][j][k]);
                }
            }
        }
        
        // Huge performance bottleneck and redundant since we calculate vertex normals manually
        // this.geometry.computeFaceNormals();
        // this.geometry.computeVertexNormals();
        // this.geometry.computeBoundingSphere();

        this.scene.remove(this.mesh);
        this.mesh = new THREE.Mesh( this.geometry, this.volumeMaterial );
        this.scene.add(this.mesh);


        this.scene.remove(this.meshVertNormals);
        this.meshVertNormals = new THREE.VertexNormalsHelper( this.mesh, 2, 0x00ff00, 1 );

        this.scene.remove(this.meshFaceNormals);
        this.meshFaceNormals = new THREE.FaceNormalsHelper( this.mesh, 2, 0x0000ff, 1 );

        if(this.parameters.renderVertNorms){
            this.scene.add(this.meshVertNormals);
        }

        if(this.parameters.renderFaceNorms){
            this.scene.add(this.meshFaceNormals);
        }
    };

    /**
     * Performs the actual marching cubes algorithm and inserts vertices and faces accordingly
     * @param {Object} gridCell 
     */
    this.polygonise = function(gridCell)
    {
        var cubeindex = 0;
        var vertlist = []; //contains xyz positions
        var vertNormalList = [];

        if (gridCell.isoValues[0] < this.isoValue) cubeindex |= 1;
        if (gridCell.isoValues[1] < this.isoValue) cubeindex |= 2;
        if (gridCell.isoValues[2] < this.isoValue) cubeindex |= 4;
        if (gridCell.isoValues[3] < this.isoValue) cubeindex |= 8;
        if (gridCell.isoValues[4] < this.isoValue) cubeindex |= 16;
        if (gridCell.isoValues[5] < this.isoValue) cubeindex |= 32;
        if (gridCell.isoValues[6] < this.isoValue) cubeindex |= 64;
        if (gridCell.isoValues[7] < this.isoValue) cubeindex |= 128;

        //cubes is inside/outside surface
        if (this.edgeTable[cubeindex] == 0)
            return 0;

        if (this.edgeTable[cubeindex] & 1)
            vertlist[0] = VertexInterp(gridCell.positions[0],gridCell.positions[1],gridCell.isoValues[0],gridCell.isoValues[1]);
            vertNormalList[0] = VertexInterp(gridCell.gradients[0],gridCell.gradients[1],gridCell.isoValues[0],gridCell.isoValues[1]);

        if (this.edgeTable[cubeindex] & 2)
            vertlist[1] = VertexInterp(gridCell.positions[1],gridCell.positions[2],gridCell.isoValues[1],gridCell.isoValues[2]);
            vertNormalList[1] = VertexInterp(gridCell.gradients[1],gridCell.gradients[2],gridCell.isoValues[1],gridCell.isoValues[2]);

        if (this.edgeTable[cubeindex] & 4)
            vertlist[2] = VertexInterp(gridCell.positions[2],gridCell.positions[3],gridCell.isoValues[2],gridCell.isoValues[3]);
            vertNormalList[2] = VertexInterp(gridCell.gradients[2],gridCell.gradients[3],gridCell.isoValues[2],gridCell.isoValues[3]);

        if (this.edgeTable[cubeindex] & 8)
            vertlist[3] = VertexInterp(gridCell.positions[3],gridCell.positions[0],gridCell.isoValues[3],gridCell.isoValues[0]);
            vertNormalList[3] = VertexInterp(gridCell.gradients[3],gridCell.gradients[0],gridCell.isoValues[3],gridCell.isoValues[0]);

        if (this.edgeTable[cubeindex] & 16)
            vertlist[4] = VertexInterp(gridCell.positions[4],gridCell.positions[5],gridCell.isoValues[4],gridCell.isoValues[5]);
            vertNormalList[4] = VertexInterp(gridCell.gradients[4],gridCell.gradients[5],gridCell.isoValues[4],gridCell.isoValues[5]);

        if (this.edgeTable[cubeindex] & 32)
            vertlist[5] = VertexInterp(gridCell.positions[5],gridCell.positions[6],gridCell.isoValues[5],gridCell.isoValues[6]);
            vertNormalList[5] = VertexInterp(gridCell.gradients[5],gridCell.gradients[6],gridCell.isoValues[5],gridCell.isoValues[6]);

        if (this.edgeTable[cubeindex] & 64)
            vertlist[6] = VertexInterp(gridCell.positions[6],gridCell.positions[7],gridCell.isoValues[6],gridCell.isoValues[7]);
            vertNormalList[6] = VertexInterp(gridCell.gradients[6],gridCell.gradients[7],gridCell.isoValues[6],gridCell.isoValues[7]);

        if (this.edgeTable[cubeindex] & 128)
            vertlist[7] = VertexInterp(gridCell.positions[7],gridCell.positions[4],gridCell.isoValues[7],gridCell.isoValues[4]);
            vertNormalList[7] = VertexInterp(gridCell.gradients[7],gridCell.gradients[4],gridCell.isoValues[7],gridCell.isoValues[4]);

        if (this.edgeTable[cubeindex] & 256)
            vertlist[8] = VertexInterp(gridCell.positions[0],gridCell.positions[4],gridCell.isoValues[0],gridCell.isoValues[4]);
            vertNormalList[8] = VertexInterp(gridCell.gradients[0],gridCell.gradients[4],gridCell.isoValues[0],gridCell.isoValues[4]);

        if (this.edgeTable[cubeindex] & 512)
            vertlist[9] = VertexInterp(gridCell.positions[1],gridCell.positions[5],gridCell.isoValues[1],gridCell.isoValues[5]);
            vertNormalList[9] = VertexInterp(gridCell.gradients[1],gridCell.gradients[5],gridCell.isoValues[1],gridCell.isoValues[5]);

        if (this.edgeTable[cubeindex] & 1024)
            vertlist[10] = VertexInterp(gridCell.positions[2],gridCell.positions[6],gridCell.isoValues[2],gridCell.isoValues[6]);
            vertNormalList[10] = VertexInterp(gridCell.gradients[2],gridCell.gradients[6],gridCell.isoValues[2],gridCell.isoValues[6]);

        if (this.edgeTable[cubeindex] & 2048)
            vertlist[11] = VertexInterp(gridCell.positions[3],gridCell.positions[7],gridCell.isoValues[3],gridCell.isoValues[7]);
            vertNormalList[11] = VertexInterp(gridCell.gradients[3],gridCell.gradients[7],gridCell.isoValues[3],gridCell.isoValues[7]);;



        var i=0; 
        var a,b,c, face;
        var aNorm, bNorm, cNorm;
        while (this.triTable[cubeindex][i] != -1) {
            a = vertlist[this.triTable[cubeindex][ i    ]].clone();
            b = vertlist[this.triTable[cubeindex][ i + 1]].clone();
            c = vertlist[this.triTable[cubeindex][ i + 2]].clone();

            try{
                aNorm = vertNormalList[this.triTable[cubeindex][ i    ]].clone();
                bNorm = vertNormalList[this.triTable[cubeindex][ i + 1]].clone();
                cNorm = vertNormalList[this.triTable[cubeindex][ i + 2]].clone();
            } catch(e){
                this.triTable[cubeindex][ i    ]
                break;
            }


            this.geometry.vertices.push( a );
            this.geometry.vertices.push( b );
            this.geometry.vertices.push( c );

            face = new THREE.Face3(this.vertexIndex, this.vertexIndex + 1, this.vertexIndex + 2);
            face.vertexNormals[0] = aNorm;
            face.vertexNormals[1] = bNorm;
            face.vertexNormals[2] = cNorm;

            this.geometry.faces.push( face );
            this.geometry.faceVertexUvs[ 0 ].push( [ new THREE.Vector2(0,0), new THREE.Vector2(0,1), new THREE.Vector2(1,1) ] );
            
            this.vertexIndex +=3;
            i += 3;
        }

    
    };

    function VertexInterp(p1, p2, valp1, valp2)
    {
        var mu;
        var p = new THREE.Vector3(0,0,0);
        
        if ( Math.abs(this.isoValue - valp1) < 0.00001)
            return p1;
        if ( Math.abs(this.isoValue - valp2) < 0.00001)
            return p2;
        if ( Math.abs(valp1 - valp2) < 0.00001)
            return p1;

        mu = (this.isoValue - valp1) / (valp2 - valp1);

        p.x = p1.x + mu * (p2.x -p1.x);
        p.y = p1.y + mu * (p2.y -p1.y);
        p.z = p1.z + mu * (p2.z -p1.z);

        return p;
    }

    function setupBillboards(){
        this.billboardGeometry.dispose();
        this.billboardGeometry = new THREE.Geometry();
        

        for ( var i = 0; i < resolution; i ++ ) {
            for ( var j = 0; j < resolution; j ++ ) {
                for ( var k = 0; k < resolution; k ++ ) {
                    var vertex = new THREE.Vector3();
                    vertex.x = i*dx - (this.size/2);
                    vertex.y = j*dy - (this.size/2);
                    vertex.z = k*dz - (this.size/2);
    
    
                    if(this.data[i][j][k] < this.isoValue)
                        this.billboardGeometry.vertices.push( vertex );
                }
            }
        }

        this.scene.remove(this.particles);
        this.particles = new THREE.Points( this.billboardGeometry, this.pointsMaterial );
        
        if (this.parameters.renderBillboards) {
            this.scene.add(this.particles)
        }
        
    }

    function updateCells(x, y, z, paintRadii)
    {
        for ( var i = x - paintRadii; i < x + paintRadii; i ++ ) {
            for ( var j = y - paintRadii; j < y + paintRadii; j ++ ) {
                for ( var k = z - paintRadii; k < z + paintRadii; k ++ ) {
                    var isoValues = [];
                    var gradients = [];
                    //create a grid cell
                    //isoValues contains the isovalue at each vertex/corner of the cube

                    //bottom verrices of cube
                    isoValues.push(this.data[i  ][j  ][k  ]);   gradients.push(this.gradients[i  ][j  ][k  ]);
                    isoValues.push(this.data[i+1][j  ][k  ]);   gradients.push(this.gradients[i+1][j  ][k  ]);
                    isoValues.push(this.data[i+1][j  ][k+1]);   gradients.push(this.gradients[i+1][j  ][k+1]);
                    isoValues.push(this.data[i  ][j  ][k+1]);   gradients.push(this.gradients[i  ][j  ][k+1]);

                    //top verrices of cube
                    isoValues.push(this.data[i  ][j+1][k  ]);   gradients.push(this.gradients[i  ][j+1][k  ]);
                    isoValues.push(this.data[i+1][j+1][k  ]);   gradients.push(this.gradients[i+1][j+1][k  ]);
                    isoValues.push(this.data[i+1][j+1][k+1]);   gradients.push(this.gradients[i+1][j+1][k+1]);
                    isoValues.push(this.data[i  ][j+1][k+1]);   gradients.push(this.gradients[i  ][j+1][k+1]);


                    var positions = [];
                    positions.push( new THREE.Vector3( i   * this.dx, j   * this.dy, k     * this.dz).subScalar(this.size/2));
                    positions.push( new THREE.Vector3((i+1)* this.dx, j   * this.dy, k     * this.dz).subScalar(this.size/2));
                    positions.push( new THREE.Vector3((i+1)* this.dx, j   * this.dy, (k+1) * this.dz).subScalar(this.size/2));
                    positions.push( new THREE.Vector3( i   * this.dx, j   * this.dy, (k+1) * this.dz).subScalar(this.size/2));

                    positions.push( new THREE.Vector3( i   * this.dx,(j+1)* this.dy, k     * this.dz).subScalar(this.size/2));
                    positions.push( new THREE.Vector3((i+1)* this.dx,(j+1)* this.dy, k     * this.dz).subScalar(this.size/2));
                    positions.push( new THREE.Vector3((i+1)* this.dx,(j+1)* this.dy, (k+1) * this.dz).subScalar(this.size/2));
                    positions.push( new THREE.Vector3(i    * this.dx,(j+1)* this.dy, (k+1) * this.dz).subScalar(this.size/2));

                    var gridCell = {
                        positions: positions,
                        gradients: gradients,
                        isoValues: isoValues
                    };

                    this.gridCells[i][j][k] = gridCell;
                }
            }
        }
    }

    function initCells()
    {
        this.gridCells = new Array();
        for ( var i = 0; i < this.resolution - 1; i++ ) {
            this.gridCells[i] = new Array();
            for ( var j = 0; j < this.resolution - 1; j++ ) {
                this.gridCells[i][j] = new Array();
                for ( var k = 0; k < this.resolution - 1; k++ ) {
                    var isoValues = [];
                    var gradients = [];
                    //create a grid cell
                    //isoValues contains the isovalue at each vertex/corner of the cube

                    //bottom vertices of cube
                    isoValues.push(this.data[i  ][j  ][k  ]);   gradients.push(this.gradients[i  ][j  ][k  ]); 
                    isoValues.push(this.data[i+1][j  ][k  ]);   gradients.push(this.gradients[i+1][j  ][k  ]); 
                    isoValues.push(this.data[i+1][j  ][k+1]);   gradients.push(this.gradients[i+1][j  ][k+1]); 
                    isoValues.push(this.data[i  ][j  ][k+1]);   gradients.push(this.gradients[i  ][j  ][k+1]); 
                    
                    //top vertices of cube
                    isoValues.push(this.data[i  ][j+1][k  ]);   gradients.push(this.gradients[i  ][j+1][k  ]);    
                    isoValues.push(this.data[i+1][j+1][k  ]);   gradients.push(this.gradients[i+1][j+1][k  ]);  
                    isoValues.push(this.data[i+1][j+1][k+1]);   gradients.push(this.gradients[i+1][j+1][k+1]);  
                    isoValues.push(this.data[i  ][j+1][k+1]);   gradients.push(this.gradients[i  ][j+1][k+1]);  


                    var positions = [];
                    positions.push( new THREE.Vector3( i   * this.dx, j   * this.dy, k     * this.dz).subScalar(this.size/2));
                    positions.push( new THREE.Vector3((i+1)* this.dx, j   * this.dy, k     * this.dz).subScalar(this.size/2));
                    positions.push( new THREE.Vector3((i+1)* this.dx, j   * this.dy, (k+1) * this.dz).subScalar(this.size/2));
                    positions.push( new THREE.Vector3( i   * this.dx, j   * this.dy, (k+1) * this.dz).subScalar(this.size/2));

                    positions.push( new THREE.Vector3( i   * this.dx,(j+1)* this.dy, k     * this.dz).subScalar(this.size/2));
                    positions.push( new THREE.Vector3((i+1)* this.dx,(j+1)* this.dy, k     * this.dz).subScalar(this.size/2));
                    positions.push( new THREE.Vector3((i+1)* this.dx,(j+1)* this.dy, (k+1) * this.dz).subScalar(this.size/2));
                    positions.push( new THREE.Vector3(i    * this.dx,(j+1)* this.dy, (k+1) * this.dz).subScalar(this.size/2));

                    var gridCell = {
                        positions: positions,
                        gradients: gradients,
                        isoValues: isoValues
                    };
                    this.gridCells[i][j][k] = gridCell;
                }
            }
        }

        //this.gridCells = gridCells;
    }

    function dist(x1, y1, z1, x2, y2, z2){
        return Math.sqrt( Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2) + Math.pow(z1 - z2, 2));
    }

    function intializeData(){
        var data = new Array();
        

        noise.seed(Math.random());

        var amplitude = 15.0;

        for(var i=0; i < this.resolution; i++){
            data[i] = new Array();
            for(var j=0; j < this.resolution; j++){
                data[i][j] = new Array();

                for(var k=0; k < this.resolution; k++){
                    var pos = new THREE.Vector3(i * this.dx, j * this.dy, k * this.dz);

                    var noiseSum = pos.y;
                    var orgPosY = pos.y;
                    //warp coordinates before noise octaves are calculated
                    // low freq + high amplitude -> more caves and arches
                    // medium freq + low amplitude -> ropey, organic terrain

                    var warpFreq = 0.1;
                    var warpAmplitude = 2.0;
                    var warp =  noise.simplex3(pos.x * warpFreq, pos.y * warpFreq, pos.z * warpFreq);

                    pos.x += warpAmplitude * warp;
                    pos.y += warpAmplitude * warp;
                    pos.z += warpAmplitude * warp;

                    var freqIndex = 0;
                    var freqs = [0.01, 0.0214, 0.0397, 0.0809, 0.162, 0.318, 0.645, 1.199, 2.403];
                    for (var div = 1.0; div < 256.0; div*=2)
                    {
                        noiseSum += amplitude/div * noise.simplex3(freqs[freqIndex] * pos.x,
                                freqs[freqIndex] * pos.y, freqs[freqIndex] * pos.z);
                        freqIndex++;
                    }



                    data[i][j][k] =  -25 + ( noiseSum);
                    //data[i][j][k] += Math.min(Math.max((hardFloor - orgPosY) * 3.0, 0.0), 1.0) * 40;
                }
            }
        }
        
        // Edge cases are set to 'undefined'
        var gradients = new Array();

        for(var i=0; i < this.resolution; i++){
            gradients[i] = new Array();
            for(var j=0; j < this.resolution; j++){
                gradients[i][j] = new Array();
                for(var k=0; k < this.resolution; k++){
                    
                    try{
                        gradients[i][j][k] = new THREE.Vector3();
                        gradients[i][j][k].x = -0.5 * ( (data[i-1][j  ][k  ] - data[i+1][j  ][k  ]) / this.dx )
                        gradients[i][j][k].y = -0.5 * ( (data[i  ][j-1][k  ] - data[i  ][j+1][k  ]) / this.dy )
                        gradients[i][j][k].z = -0.5 * ( (data[i  ][j  ][k-1] - data[i  ][j  ][k+1]) / this.dz )
                    } catch(e){
                        gradients[i][j][k] = new THREE.Vector3(0.0, 1.0, 0.0);
                    }

                }
            }
        } 

        this.data = data;
        this.gradients = gradients;
    }
    
    return context;

}