import { vec2, vec3, mat4 } from 'gl-matrix';


export const InitGPU = async () => {
    
    //if this browser does not support webGPU
    if(!navigator.gpu) {
        throw('This browser does not support WebGPU');
    }
    
    //get canvas from index.html
    const canvas = document.getElementById('canvas-webgpu') as HTMLCanvasElement;
    const div = document.getElementById('canvas-block-div') as HTMLDivElement;
    canvas.width  = div.offsetWidth;
    canvas.height = div.offsetHeight;
    //make canvas div resizable
    function windowResize() {
        canvas.width  = div.offsetWidth;
        canvas.height = div.offsetHeight;
    };
    window.addEventListener('resize', windowResize);

    //request a default adapter
    const adapter = await navigator.gpu?.requestAdapter();
    //request logical device from adapter
    const device = await adapter?.requestDevice() as GPUDevice;
    //set the canvas context to webGPU application settings
    const context = canvas.getContext('webgpu') as GPUCanvasContext;
    //get system specific canvas specifications
    const format = navigator.gpu.getPreferredCanvasFormat();
    //configure the canvas context settings
    context.configure({
        device: device,
        format: format,
        alphaMode:'premultiplied'
    });
    return{ device, canvas, format, context };
};

export const CreateAnimation = (draw:any, rotation:vec3 = vec3.fromValues(0,0,0), isAnimation = true ) => {
    function step() {
        if(isAnimation){
            rotation[0] += 0.01;
            rotation[1] += 0.01;
            rotation[2] += 0.01;
        } else{
            rotation = [0, 0, 0];
        }
        draw();
        requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

export const CreateTransforms = (modelMat:mat4, translation:vec3 = [0,0,0], rotation:vec3 = [0,0,0], scaling:vec3 = [1,1,1]) => {
    const rotateXMat = mat4.create();
    const rotateYMat = mat4.create();
    const rotateZMat = mat4.create();   
    const translateMat = mat4.create();
    const scaleMat = mat4.create();

    //perform indivisual transformations
    mat4.fromTranslation(translateMat, translation);
    mat4.fromXRotation(rotateXMat, rotation[0]);
    mat4.fromYRotation(rotateYMat, rotation[1]);
    mat4.fromZRotation(rotateZMat, rotation[2]);
    mat4.fromScaling(scaleMat, scaling);

    //combine all transformation matrices together to form a final transform matrix: modelMat
    mat4.multiply(modelMat, rotateXMat, scaleMat);
    mat4.multiply(modelMat, rotateYMat, modelMat);        
    mat4.multiply(modelMat, rotateZMat, modelMat);
    mat4.multiply(modelMat, translateMat, modelMat);
};

export const CreateViewProjection = (respectRatio = 1.0, cameraPosition:vec3 = [2, 2, 4], lookDirection:vec3 = [0, 0, 0], 
    upDirection:vec3 = [0, 1, 0]) => {

    const viewMatrix = mat4.create();
    const projectionMatrix = mat4.create();       
    const viewProjectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, 2*Math.PI/5, respectRatio, 0.1, 100.0);

    mat4.lookAt(viewMatrix, cameraPosition, lookDirection, upDirection);
    mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);

    const cameraOption = {
        eye: cameraPosition,
        center: lookDirection,
        zoomMax: 100,
        zoomSpeed: 2
    };

    return {
        viewMatrix,
        projectionMatrix,
        viewProjectionMatrix,
        cameraOption
    }
};


export const CreateGPUBufferUint = (device:GPUDevice, data:Uint32Array, 
    usageFlag:GPUBufferUsageFlags = GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST) => {
    const buffer = device.createBuffer({
        size: data.byteLength,
        usage: usageFlag,
        mappedAtCreation: true
    });
    new Uint32Array(buffer.getMappedRange()).set(data);
    buffer.unmap();
    return buffer;
};

