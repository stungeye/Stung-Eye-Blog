---
date: 2007-10-20T13:39:01.000-05:00
title: usually permanent form
permalink: /archive/by_date/2007/10/20/
---

View Simulation: [Interactive model of my generative crystal algorithm](http://stungeye.com/processing/1007/).

Restart the [DLA](http://en.wikipedia.org/wiki/Diffusion-limited_aggregation) simulation by clicking on the crystal. Try adjusting the growth parameter (set using the slider at the bottom of the screen). The higher the number shown in the slider, the quicker the crystal will grow. The effects of changing the growth parameter are most dramatic after a restart. (For example, try restarting with a growth factor of 5).

The crystal is initially "seeded" with 4 points in the centre of the screen. 

Boiled down, the algorithm is as follows:

- Start with a number of white seed crystal particles.
- Add grey particles in a band around the seeds.
- Have the grey particles move about.
- If a grey particle touches a white crystal, have it freeze and turn white (crystalize).

As the crystal grows, more and more particles are added to the simulation. The radius of the band where the new particles are placed also grows with time. To inhibit grey particles from moving too far away from the crystal to be useful, a weak pseudo-gravity was implemented.

*Note:* An interesting side-effect of the crystalization is that once particles reach the outer edges of the screen they will start to crystalize on the word "growth" beside the slider.
