uniform vec3 lightPos;
uniform vec3 cameraPos;

varying vec3 vNormal;

void main()	{
    vec3 grassColor = vec3(0.18,0.65,0.12);
    vec3 stoneColor = vec3(0.57, 0.57, 0.57);
    vec3 finalColor = grassColor;
    vec3 light = normalize(lightPos);
    
    float kd = 0.9;
    float ka = 0.6;


    // Mix colors here before applying phong
    // Theta = arccos( (a * b) / ( ||a|| ||b|| ) )
    vec3 up = vec3(0.0, 1.0, 0.0);

    float theta = acos( dot(vNormal, up) ); 

    finalColor=mix(grassColor, stoneColor, smoothstep(0.6, 1.0, theta));

    vec3 ambient = ka * finalColor;
    vec3 diffuse = kd * finalColor * max(0.0, dot(vNormal, light));

    finalColor = ambient+diffuse;

    gl_FragColor=vec4(theta*vec3(finalColor), 1.0);
}