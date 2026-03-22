---
title: NOPTREX Data Acquisition System
date: 04-18-2023
tags: Research, Publications, C++
---

I've created a multi-channel digitizer firmware and C++-based readout software for the Neutron Optics Parity and Time-Reversal Experiment (NOPTREX). I presented this project at the National Conference on Undergraduate Research and the American Physical Society.

The experiment is a collaboration between multiple universities and investigates time-reversal violations in low-energy neutron reactions by monitoring the levels of gamma radiation emitted after the collision of an accelerated neutron with a heavy target. Through this, we hope to be able to explain the Baryon Asymmetry of the early universe.

This readout software was developed in C++ using the HDF5Lib library. It communicates in real time with custom firmware on a CAEN DT5560SE digitizer. It has already been successfully tested on a particle accelerator at the J-PARC (Japan Proton Accelerator Research Complex) campus.

A research paper covering this project is currently in progress.