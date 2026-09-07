---
title: FIDAR
date: 09-07-2026
tags: C++, Vulkan, Computer Graphics, Machine Learning
---

Over the past few months, I've continued working on updating the Volt Engine, which I made a post about at the beginning of the year. At the time, it was a mostly hard-coded engine that could do a few cool things, but wouldn't function nearly as well if used for a real task. So, I set about fixing that.

I added support for 3D models in the GLTF format using tiny-gltf, added support for creating arbitrary widgets, and most importantly, removed the reliance on a single UI object material and a single world object material. Now, you can create any material with any vertex and instance data format, using any shader, and set the material of an object to that. This was definitely one of the most complicated updates I've made to the engine, as everything essentially assumed a specific data format and shader. But, it was worth it as now the engine can do "anything" (heavy use of air quotes).

![Avocado Model](images/AvocadoExample.png)

Additionally, I switched to Linux between the last update and now. So, I had to switch away from using Visual Studio and have changed the project over to CMake so it can be built on any platform. I have decided, though, to only release versions of programs using the Volt Engine on Linux.

Now that the engine was ready, I needed something to show it off with. I decided on a basic 3D point cloud generator that I have called FIDAR (fake LIDAR). The idea is it can take in multiple images from different positions, predict the depth of each pixel, and use the predictions to recreate 3D scenes as point clouds. The feasibility of this is up for debate as it's very difficult to get a model to make all of the predictions from different images align. But, it's a good proof-of-concept anyway.

I developed a model using ideas from the following papers. It ended up being a UNet-like model with a coarse and fine branch, both feeding into the decoder. It has some heavily modified blocks in the encoder and I've seen some pretty good performance with it. The source code for the model is linked at the bottom of the page if you want to check it out.

- [Depth Map Prediction from a Single Image using a Multi-Scale Deep Network](https://arxiv.org/abs/1406.2283)
- [UNet](https://arxiv.org/pdf/1505.04597)
- [DenseNet](https://arxiv.org/abs/1608.06993)
- [SPADE](https://nvlabs.github.io/SPADE/)
- [UniDepth](https://arxiv.org/abs/2403.18913)

I trained one model on the [NYU indoor depth dataset](https://cs.nyu.edu/~fergus/datasets/nyu_depth_v2.html) and another on the [KITTI outdoor depth dataset](https://www.cvlibs.net/datasets/kitti/index.php). I've included both as options in the FIDAR application, but I've gotten better results with indoor images as the NYU dataset uses dense depth maps that don't contain any invalid pixels.

After getting the model ready, I built the actual FIDAR application, which was made relatively simple by the, not to brag, robust and easy-to-use interface provided by the Volt Engine. In the application, the user can place a camera, edit its properties, and then create a point cloud from the input image all with a few clicks. This can then be exported to an LAS file so it can be used or modified in other places. An example point cloud using an image from the NYU dataset is shown below.

![Example Point Cloud](images/FIDARPointCloud.png)

There's a Linux build in the Github linked below if you want to try it out. Please let me know if you run into any issues. I've also published a YouTube video discussing how I built FIDAR, so please check it out.