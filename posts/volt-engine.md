---
title: Volt Engine
date: 01-03-2026
tags: C++, Vulkan, Computer Graphics
---

I've released the first version of the Volt Engine: a basic rendering engine built with C++, Vulkan, HLSL, and Qt.

The engine's API is similar to Unity's, which makes it easy and familiar to add and modify objects in the scene. Each scene object has various options that can be modified, like its interaction with lighting, its texture, and whether it should be displayed "billboarded". Scene objects can have their meshes modified at runtime, which is updated dynamically during rendering. The engine is also capable of rendering text and other UI elements.

The engine implements the Blinn-Phong lighting algorithm and comes with a small demo that shows its capabilities. This demo shows thousands of objects of different colors and textures interacting realistically with multiple lighting sources.

The demo also has a Qt button built into the window to show the possibility of adding elements outside the rendered scene.