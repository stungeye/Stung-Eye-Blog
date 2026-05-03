---
date: 2004-05-08T16:24:28.000-05:00
generatedBy: tools/migrate.js
title: Evolution Baby
permalink: /archive/by_date/2004/05/08/
---

<a href="http://www.generation5.org/" target="_blank">Generation5</a> contains a wealth of <a href="http://en.wikipedia.org/wiki/Artificial_intelligence" target="_blank">AI</a> information.

I've long been fascinated by <a href="http://www.generation5.org/content/2000/ga.asp" target="_blank">Genetic Programming</a>.

From the above link: <i>[Genetic Algorithms] are basically algorithms based on natural biological evolution. [...] A GA functions by generating a large set of possible solutions to a given problem. It then evaluates each of those solutions, and decides on a "fitness level" (you may recall the phrase: "survival of the fittest") for each solution set. These solutions then breed new solutions. The parent solutions that were more "fit" are more likely to reproduce, while those that were less "fit" are more unlikely to do so. In essence, solutions are evolved over time. This way you evolve your search space scope to a point where you can find the solution. Genetic algorithms can be incredibly efficient if programmed correctly.</i>

When I discovered <a href="http://www.generation5.org/content/2003/gahelloworld.asp" target="_blank">this article</a> on a Genetic Algorithm that "evolves" a text string, I knew I would have to port the code to <a href="http://processing.org/" target="_blank">Processing</a>. The results:

<li><a href="#" border="0" onmouseover="window.status='Click to view GA Words in another window';return true" onmouseout="window.status='';return true" onclick="display_processing('http://www.stungeye.com/processing/0404/GAwords/','Hello_GA','Words GA',300,40);return false;">GA Words</a> - Click to reset Text String Gene Pool. [<a href="http://www.stungeye.com/sketch.php?sketch=GA%20Words&amp;path=processing/0404/GAwords/&amp;filename=Hello_GA&amp;w=300&amp;h=40">permalink</a>]

</li><li><a href="#" border="0" onmouseover="window.status='Click to view GA Images in another window';return true" onmouseout="window.status='';return true" onclick="display_processing('http://www.stungeye.com/processing/0404/GAPic/','Pic_GA','Image GA',200,200);return false;">GA Images</a> - Click to reset Image Gene Pool. [<a href="http://www.stungeye.com/sketch.php?sketch=GA%20Images&amp;path=processing/0404/GAPic/&amp;filename=Pic_GA&amp;w=200&amp;h=200">permalink</a>]

</li><li><a href="#" border="0" onmouseover="window.status='Click to view GA Images 2 in another window';return true" onmouseout="window.status='';return true" onclick="display_processing('http://www.stungeye.com/processing/0404/GAPic/','Pic_GA2','Image GA 2',400,400);return false;">GA Images (Large Image)</a> - Click to reset Image Gene Pool. [<a href="http://www.stungeye.com/sketch.php?sketch=GA%20Images%20Large&amp;path=processing/0404/GAPic/&amp;filename=Pic_GA2&amp;w=400&amp;h=400">permalink</a>]


The first applet uses a Genetic Algorithm to evolve a text string from a gene pool of 4096 randomly seeded text cells. 

The second applet uses the same GA to evolve a 625 pixel image from a gene pool of 1024 randomly seeded image cells.

Because the GA doesn't guarantee a perfect solution, the resultant text string or image must only be considered the best guess (so far). This is why the first applet doesn't always evolve the correct string. Left to run over night, the second applet will still only produce an approximation of the desired image.

The third applet uses the same framework, but the desired image contains 2500 pixels. Because of the increased pixel size (and a gene pool of 2048 images) this applet must be run on a powerful computer (1GHz+ processor with at least 256MB RAM) and could take 3 or 4 hours to evolve a reasonable output image.

--------</li>
