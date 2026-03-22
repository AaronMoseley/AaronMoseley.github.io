---
title: CMU-Net: Multitasking for Image Segmentation
date: 10-29-2023
tags: Research, Machine Learning, Publication, Python, PyTorch
---

I've developed CMU-Net as part of my work in Dr. Imran's lab at the University of Kentucky. It is an innovative multitasking strategy for medical image segmentation leveraging image-level labels that enable a secondary task of organ detection. By combining the training of the encoder of the U-Net model on organ detection with the entire model's training on image segmentation, we found significant benefits over baseline models trained solely on segmentation.

This project was given as an oral presentation at the University of Kentucky's 5 Minute Fast Track undergraduate research event.

All work was done in Python using PyTorch.