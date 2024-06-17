const parser = math.parser();
//The XYZ positioning in Babylon is strange. When printing, always exchange the Y-position for the Z-position. Leave the X-position as-is.

//Section containing the 3D environment in which the function will be graphed
var canvas = document.getElementById("renderCanvas");

var startRenderLoop = function (engine, canvas) {
    engine.runRenderLoop(function () {
        if (sceneToRender && sceneToRender.activeCamera) {
            sceneToRender.render();
        }
    });
}

var engine = null;
var scene = null;
var sceneToRender = null;
var createDefaultEngine = function () { return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, disableWebGL2Support: false }); };
async function createScene() {
    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);

    // Set the background color
    scene.clearColor = BABYLON.Color3.Black();

    // Parameters: name, alpha, beta, radius, target position, scene
    const camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 10, new BABYLON.Vector3(0, 0, 0), scene);

    // Positions the camera overwriting alpha, beta, radius
    camera.setPosition(new BABYLON.Vector3(40, 40, 40));

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // This creates the input text box
    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    var inputBoxWidth = 0.75;

    var grid = new BABYLON.GUI.Grid();
    advancedTexture.addControl(grid);

    grid.addRowDefinition(0.90) //Row 0
    grid.addRowDefinition(0.05) //Row 1
    grid.addRowDefinition(0.05) //Row 2

    grid.addColumnDefinition(0.2) //Column 0
    grid.addColumnDefinition(0.2) //Column 1
    grid.addColumnDefinition(0.2) //Column 2
    grid.addColumnDefinition(0.2) //Column 3
    grid.addColumnDefinition(0.2) //Column 4


    var equationInput = new BABYLON.GUI.InputText();
    equationInput.width = inputBoxWidth;
    equationInput.maxWidth = 0.9;
    equationInput.height = "40px";
    equationInput.color = "white";
    equationInput.focusedColor = "white";
    equationInput.focusedBackground = "black";
    equationInput.background = "black";
    equationInput.placeholderText = "Enter equation here...";
    grid.addControl(equationInput, 1, -1)

    //Listening for the enter key to be pressed. Then graphs the entered function
    var isUsingInputBox = false;
    canvas.addEventListener("keydown", function (e) {
        if (e.key == "Enter") {
            isUsingInputBox = true;
            console.log("Begin evaluating");
            evaluateEquation();
            console.log("Evaluation complete");
        }
    });

    var hasEvaluated = false; //Variable to determine if a graph has been created or not

    async function evaluateEquation() {

        var functionType = 2 //UPDATE LATER
        var equation = equationInput.text;
        var lowerBound = -1; //UPDATE LATER
        var upperBound = 1; //UPDATE LATER
        var step = 0.01; //UPDATE LATER

        const parser = math.parser();

        var planeSize;
        if (Math.abs(lowerBound) > Math.abs(upperBound)) {
            planeSize = lowerBound;
        } else {
            planeSize = upperBound;
        };
        if (functionType == 1) {
            camera.setPosition(new BABYLON.Vector3(2 * planeSize + 10, 0, 0));
        } else {
            camera.setPosition(new BABYLON.Vector3(2 * planeSize + 10, 2 * planeSize + 10, 2 * planeSize + 10));
        };

        if (functionType === 1) {
            //2-Dimensional Functions

            //X-Axis
            if (hasEvaluated == false) {
                const xAxisPoints = [
                    new BABYLON.Vector3(0, 0, -(planeSize)),
                    new BABYLON.Vector3(0, 0, (planeSize)),
                ]
                const xAxis = BABYLON.MeshBuilder.CreateLines("lines", { points: xAxisPoints });

                //Y-Axis
                const yAxisPoints = [
                    new BABYLON.Vector3(0, -(planeSize), 0),
                    new BABYLON.Vector3(0, (planeSize), 0),
                ]
                const yAxis = BABYLON.MeshBuilder.CreateLines("lines", { points: yAxisPoints });

                //Label axes
                var fontData = await (await fetch("https://assets.babylonjs.com/fonts/Droid Sans_Regular.json")).json();
                var XAxisLabel = BABYLON.MeshBuilder.CreateText("XAxisLabel", "X", fontData, {
                    size: 0.5,
                    resolution: 64,
                    depth: 0.1
                });
                XAxisLabel.billboardMode = 7;
                XAxisLabel.position.x = 0;
                XAxisLabel.position.y = 0;
                XAxisLabel.position.z = (planeSize) + 1;
                let XtextMaterial = new BABYLON.StandardMaterial("X Material", scene);
                XtextMaterial.diffuseColor = BABYLON.Color3.Red();
                XAxisLabel.material = XtextMaterial;
                xAxis.color = new BABYLON.Color3(1, 0, 0);
                var YAxisLabel = BABYLON.MeshBuilder.CreateText("YAxisLabel", "Y", fontData, {
                    size: 0.5,
                    resolution: 64,
                    depth: 0.1
                });
                YAxisLabel.billboardMode = 7;
                YAxisLabel.position.x = 0;
                YAxisLabel.position.y = (planeSize) + 1;
                YAxisLabel.position.z = 0;
                let YtextMaterial = new BABYLON.StandardMaterial("Y Material", scene);
                YtextMaterial.diffuseColor = BABYLON.Color3.Blue();
                YAxisLabel.material = YtextMaterial;
                yAxis.color = new BABYLON.Color3(0, 0, 1);
            }

            //Convert equation into parser-readable format
            const newFormat = equation.replaceAll("x", "a");

            //An array of points
            var points = [];

            //Evaluate
            for (let a = lowerBound; a <= upperBound; a += step) {
                parser.evaluate(`a = ${a}`);
                let yPosition = parser.evaluate(newFormat);
                let xPosition = a;
                //console.log(yPosition);
                if (yPosition <= (upperBound / 2) && yPosition >= (lowerBound / 2)) {
                    points.push(new BABYLON.Vector3(0, yPosition, xPosition)); //In this case, the YZ-Plane acts as the XY-Plane. This is only for a 2D graph.
                }
            }

            //Get curve data
            var path3d = new BABYLON.Path3D(points);
            var tangents = path3d.getTangents();
            var normals = path3d.getNormals();
            var binormals = path3d.getBinormals();
            var curve = path3d.getCurve();

            //Display the curve
            var li = BABYLON.Mesh.CreateLines('li', curve, scene);

        } else if (functionType === 2) {
            //3-Dimensional Functions

            //XY-Plane
            if (hasEvaluated == false) {
                const xyAbstractPlane = BABYLON.Plane.FromPositionAndNormal(new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, 1, 0));
                const xyPlane = BABYLON.MeshBuilder.CreatePlane("plane", { sourcePlane: xyAbstractPlane, sideOrientation: BABYLON.Mesh.DOUBLESIDE, height: 2 * planeSize, width: 2 * planeSize });
                xyPlane.visibility = 0.1;

                //XZ-Plane
                const xzAbstractPlane = BABYLON.Plane.FromPositionAndNormal(new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, 0, 1));
                const xzPlane = BABYLON.MeshBuilder.CreatePlane("plane", { sourcePlane: xzAbstractPlane, sideOrientation: BABYLON.Mesh.DOUBLESIDE, height: 2 * planeSize, width: 2 * planeSize });
                xzPlane.visibility = 0.1;

                //YZ-Plane
                const yzAbstractPlane = BABYLON.Plane.FromPositionAndNormal(new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(1, 0, 0));
                const yzPlane = BABYLON.MeshBuilder.CreatePlane("plane", { sourcePlane: yzAbstractPlane, sideOrientation: BABYLON.Mesh.DOUBLESIDE, height: 2 * planeSize, width: 2 * planeSize });
                yzPlane.visibility = 0.1;

                //X-Axis
                const xAxisPoints = [
                    new BABYLON.Vector3(-(planeSize), 0, 0),
                    new BABYLON.Vector3((planeSize), 0, 0),
                ]
                const xAxis = BABYLON.MeshBuilder.CreateLines("lines", { points: xAxisPoints });

                //Y-Axis
                const yAxisPoints = [
                    new BABYLON.Vector3(0, 0, -(planeSize)),
                    new BABYLON.Vector3(0, 0, (planeSize)),
                ]
                const yAxis = BABYLON.MeshBuilder.CreateLines("lines", { points: yAxisPoints });

                //Z-Axis
                const zAxisPoints = [
                    new BABYLON.Vector3(0, -(planeSize), 0),
                    new BABYLON.Vector3(0, (planeSize), 0),
                ]
                const zAxis = BABYLON.MeshBuilder.CreateLines("lines", { points: zAxisPoints });

                //Label axes
                var fontData = await (await fetch("https://assets.babylonjs.com/fonts/Droid Sans_Regular.json")).json();
                var XAxisLabel = BABYLON.MeshBuilder.CreateText("XAxisLabel", "X", fontData, {
                    size: 0.5,
                    resolution: 64,
                    depth: 0.1
                });
                XAxisLabel.billboardMode = 7;
                XAxisLabel.position.x = (planeSize) + 1;
                XAxisLabel.position.y = 0;
                XAxisLabel.position.z = 0;
                let XtextMaterial = new BABYLON.StandardMaterial("X Material", scene);
                XtextMaterial.diffuseColor = BABYLON.Color3.Red();
                XAxisLabel.material = XtextMaterial;
                xAxis.color = new BABYLON.Color3(1, 0, 0);
                var YAxisLabel = BABYLON.MeshBuilder.CreateText("YAxisLabel", "Y", fontData, {
                    size: 0.5,
                    resolution: 64,
                    depth: 0.1
                });
                YAxisLabel.billboardMode = 7;
                YAxisLabel.position.x = 0;
                YAxisLabel.position.y = 0;
                YAxisLabel.position.z = (planeSize) + 1;
                let YtextMaterial = new BABYLON.StandardMaterial("Y Material", scene);
                YtextMaterial.diffuseColor = BABYLON.Color3.Blue();
                YAxisLabel.material = YtextMaterial;
                yAxis.color = new BABYLON.Color3(0, 0, 1);
                var ZAxisLabel = BABYLON.MeshBuilder.CreateText("ZAxisLabel", "Z", fontData, {
                    size: 0.5,
                    resolution: 64,
                    depth: 0.1
                });
                ZAxisLabel.billboardMode = 7;
                ZAxisLabel.position.x = 0;
                ZAxisLabel.position.y = (planeSize) + 1;
                ZAxisLabel.position.z = 0;
                let ZtextMaterial = new BABYLON.StandardMaterial("Z Material", scene);
                ZtextMaterial.diffuseColor = BABYLON.Color3.Green();
                ZAxisLabel.material = ZtextMaterial;
                zAxis.color = new BABYLON.Color3(0, 1, 0);
            }

            //Convert equation into parser-readable format
            const newFormatx = equation.replaceAll("x", "a");
            const newFormatxy = newFormatx.replaceAll("y", "b");

            //Evaluate
            for (let a = lowerBound; a <= upperBound; a += step) {
                var pointsOne = [];
                for (let b = lowerBound; b <= upperBound; b += step) {
                    parser.evaluate(`a = ${a}`);
                    parser.evaluate(`b = ${b}`);
                    let zPosition = parser.evaluate(newFormatxy);
                    let xPosition = a;
                    let yPosition = b;
                    //console.log(zPosition);
                    if (zPosition <= (upperBound / 2) && zPosition >= (lowerBound / 2)) {
                        pointsOne.push(new BABYLON.Vector3(xPosition, zPosition, yPosition));
                    }
                }
                var path3dOne = new BABYLON.Path3D(pointsOne);
                var curve1 = path3dOne.getCurve();
                var li1 = BABYLON.Mesh.CreateLines('li1', curve1, scene);
            }
            for (let b = lowerBound; b <= upperBound; b += step) {
                var pointsTwo = [];
                for (let a = lowerBound; a <= upperBound; a += step) {
                    parser.evaluate(`a = ${a}`);
                    parser.evaluate(`b = ${b}`);
                    let zPosition = parser.evaluate(newFormatxy);
                    let xPosition = a;
                    let yPosition = b;
                    //console.log(zPosition);
                    if (zPosition <= (upperBound / 2) && zPosition >= (lowerBound / 2)) {
                        pointsTwo.push(new BABYLON.Vector3(xPosition, zPosition, yPosition));
                    }
                }
                var path3dTwo = new BABYLON.Path3D(pointsTwo);
                var curve2 = path3dTwo.getCurve();
                var li2 = BABYLON.Mesh.CreateLines('li2', curve2, scene);
            }
        }

        hasEvaluated = true;
    }

    console.log("Please set the input parameters by calling 'setInputParameters(functionType, equation, lowerBound, upperBound, step)' in the console.");

    return scene;
};

window.initFunction = async function () {
    var asyncEngineCreation = async function () {
        try {
            return createDefaultEngine();
        } catch (e) {
            console.log("the available createEngine function failed. Creating the default engine instead");
            return createDefaultEngine();
        }
    }

    window.engine = await asyncEngineCreation();
    if (!engine) throw 'engine should not be null.';
    startRenderLoop(engine, canvas);
    window.scene = await createScene();
};
initFunction().then(() => {
    sceneToRender = scene
});

// Resize
window.addEventListener("resize", function () {
    engine.resize();
});