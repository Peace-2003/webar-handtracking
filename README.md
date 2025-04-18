# Pattern-Based Web AR Experience

This web AR application detects image patterns through the camera and displays different 3D models anchored to each pattern.

## Setup Instructions

### 1. Prepare Target Images

You need to create or select images that will be used as markers for AR detection. Good images for AR tracking should:

- Have high contrast
- Contain many unique features (not repetitive patterns)
- Be non-reflective
- Be preferably flat (not curved)

Save your target images (at least 3) in the `assets` folder.

### 2. Generate the Mind File

The `.mind` file is what MindAR uses to recognize your target images. To generate it:

1. Go to the [MindAR Image Compiler](https://hiukim.github.io/mind-ar-js-doc/tools/compile/)
2. Upload your target images (you can select multiple)
3. Click "Start Compile"
4. Download the generated `.mind` file
5. Save the file as `targets.mind` in the `targets` folder of this project

### 3. Run the Application

- Host the files on a web server (you can use tools like [http-server](https://www.npmjs.com/package/http-server))
- Open the website on a mobile device with a camera
- Allow camera permissions when prompted
- Point your camera at the target images to see the AR content

## Customizing AR Content

To customize what appears for each target image, edit the `index.html` file:

- Each target image corresponds to a `<a-entity>` tag with `mindar-image-target="targetIndex: X">`
- The targetIndex corresponds to the order in which you uploaded images to the compiler
- Replace the basic shapes with your own 3D models, images, videos, or other content

## Technical Details

This project uses:
- [MindAR](https://github.com/hiukim/mind-ar-js): For image tracking
- [A-Frame](https://aframe.io/): For 3D rendering in WebXR