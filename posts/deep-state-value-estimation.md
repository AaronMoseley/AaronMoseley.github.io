---
title: Deep State-Value Estimation for Long-Term Planning
date: 04-28-2024
tags: Research, Machine Learning, Python
---

I've completed my thesis for the Lewis Honors College at the University of Kentucky: Deep State-Value Estimation for Long-Term Planning.

This is a novel reinforcement learning approach for long-term planning tasks that combines deep image analysis models with traditional tree-search algorithms. 

When training on strategy games, most state-of-the-art reinforcement learning approaches rely entirely on self-play or learning from human strategies. But, self-play leads to early versions of models making entirely random moves and takes longer to train while many tasks that require reinforcement learning don't have established human strategies to use when training models. 

This new approach, dubbed Deep-State Learning, introduces simple opponents that use hard-coded tree-search algorithms at the beginning of the training process. Later in training, the opponents alternate between mutated self-play and these simple opponents. This strategy allows the model to initially learn intelligent but simple strategies before switching to self-play, reducing the random moves inherent to early models limited to solely self-play.

An experimental analysis on a custom generic strategy game shows that Deep-State Learning performs better than traditional tree-search algorithms and models trained on self-play by up to 10%. 