---
title: FIDAR with Drones
date: 10-11-2026
tags: C++, Vulkan, Computer Graphics, Machine Learning
---

Recently I've worked on updating my depth prediction point cloud creation project called FIDAR, linked below. One weakness of that project is that when adding images, you have to know the exact position of the camera relative to the scene. To somewhat solve this, I added support for a Tello drone interface that can estimate the drone's position based on the commands sent to the done.

The [Tello interface](https://dl-cdn.ryzerobotics.com/downloads/Tello/Tello%20SDK%202.0%20User%20Guide.pdf) is surprisingly easy. Once connected to the drone's socket, it needs to be sent a command to activate it. Other than that, you just tell it what direction to travel and for what distance. 

It also exposes a video stream over UDP, which I was able to access relatively easily using the OpenCV library. While using the drone, I update a widget every second with an image from the drone, allowing the operator to see its surroundings.

Once you're happy with where the drone is, you can press F and it will save the image and add a camera to the scene using the drone's estimated position. Even though the positioning should be mostly correct, it's still editable just like any other image added to the scene.

I've updated the Github release build if you have a Tello drone and want to try out this new feature. I also published a Youtube video linked below.