---
date: 2004-02-12T18:14:58.000-06:00
title: Ordered Chaos Revisited
permalink: /archive/by_date/2004/02/12/
---

After spending an hour <a href="http://www.citesciences.fr/english/web_cite/voir/invisibl/droit_fs.htm" target="_blank">zooming</a> (<i>"The 'Invisible' videos zoom in on matter and show you what is actually there, although invisible to the naked eye."</i>) I knew what had to be done. I spent the last two days learning a new programming language called <a href="http://processing.org/" target="_blank">Processing</a>. It's like Flash for programmers, (a simplified java syntax with a powerful graphics API.) During this time I wrote a small Mandelbrot exploration program.


<i>The following applets require that your brower <a href="http://java.sun.com/products/plugin/" target="_blank">supports java</a>.</i>


<a href="#" border="0" onmouseover="window.status='Click to view to the zoom-able Mandelbrot in another window';return true" onmouseout="window.status='';return true" onclick="display_processing('http://www.stungeye.com/processing/0204/','zoomableRecursive','Zoomable Recursive Mandelbrot',480,360);return false;">Click to view Mandelbrot exploration applet.</a> (Source code available.)


Click anywhere on the fractal plane to double the magnification. Zoom out by holding down any key and clicking the fractal. (The view centres on the clicked position for both in/out zooms.) 15 zooms are possible before floating point rounding errors erode the image. (Is that 65536X magnification?) The maximum number of Mandelbrot iterations is increased by 15 for each level of zoom, (improving the Mandelbrot resolution).

With the Flash apps from the last post, the pixel resolutions were poor, (4x4 pixel to 10x10 pixel representations for each fractal test point.) The pixel resolution of the processing applets is 1x1. The number of calculations being performed compared to the Flash generators has increased by many fold. To improve the rendering time I coded a recursive rectangle approximation engine.


<a href="#" border="0" onmouseover="window.status='Click to view to the zoom-able Mandelbrot in another window';return true" onmouseout="window.status='';return true" onclick="display_processing('http://www.stungeye.com/processing/0204/','zoomableRecursiveDebug','Zoomable Recursive Mandelbrot (Debug Mode)',480,360);return false;">Click to view Mandelbrot exploration applet in approximation debug mode.</a> (Source code available.)


In debug mode you can see that the applet calculates the image as a gradient of bounded rectangles. I was able to exploit an interesting property of the Mandelbrot set, it is <i>simply connected</i>. This means that if any solid shape can be drawn on the set, where the shade/colour is identical for all the boundary points, this shape can be <i>filled in</i> with said shade/colour. The approximation engine divides the screen into four quadrants, a test is performed to determine if the quadrants can be filled in. Each quadrant that cannot be filled is further divided unto four quadrants of it's own. And the process repeats. (Division stopping only when a quadrant is filled or has reached a size of 2 pixels or less in either width or depth.)

This save us the trouble of calculating the escape velocity for <i>every single pixel</i>.

<i>Related: <a href="http://stungeye.com/archives/2003/05/i_see_patterns.php">fractal-like images of plants from the cabbage family</a>.</i>

***

Some Flash and Processing links:

<li><a href="http://levitated.net/" target="_blank">Leviated.net</a> - Flash experiments with source code.

</li><li><a href="http://www.complexification.net/" target="_blank">complexification.net</a> - Flash and Processing experiments and sketches. (Source code also present.)

</li><li><a href="http://www.bit-101.com/index2.php" target="_blank">Bit-101</a> and the amazing <a href="http://www.bit-101.com/forum/index.php" target="_blank">Bit-101 forums</a>.


***

</li><li><a href="http://andreaseigel.typepad.com/afternoon/2004/02/will_you_accept.html" target="_blank">Will you accept this coffin</a> - A look at the realities of reality show dating.

</li><li><a href="http://els.f2o.org/space/" target="_blank">mundane photos</a>

</li><li><a href="http://www.vintagesmith.com/images/Blossfeldt/BlossAlbum/" target="_blank">Awe-inspriring structures in plants</a>.

</li><li><a href="http://www.wolframscience.com/nksonline/" target="_blank">Stephen Wolfram's A New Kind of Science free online.</a>

</li><li>What else was <a href="http://cgi.monjunet.ne.jp/PT/honyaku/bin/hksrch.dll?Q=motoko+rich&amp;D=149296&amp;I=2" target="_blank">Lost In Translation</a>.

</li><li>Your daily funk and hip-hop fix at <a href="http://www.wefunkradio.com/" target="_blank">WeFunk</a>.

</li><li>The <a href="http://www.themushroomhouse.com/" target="_blank">Mushroom house</a> is now officially grown. The interior design is based on the anatomy of a tree. Wow, it's for sale. (via <a href="http://www.lorbus.com/" target="_blank">lorbus</a>)

--------</li>
