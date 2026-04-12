---
date: 2009-03-17 17:38:11
title: Art and Code - Overview Part I
permalink: /archive/by_date/2009/03/17/
---

<p>It’s about time I wrote an overview of my <a href="http://artandcode.ning.com/">Art and Code</a> experience.</p>

<h3>Saturday - Workshops and Church Brews</h3>

<p>The day began with <a href="http://stungeye.com/archive/by_date/2009/03/07/">a walk by the Cloud Factory</a> followed by two programming workshops with lunch between them. There were 9 simultaneous morning and afternoon workshops. Choosing just two was frustrating. Another day of workshops would have been delightful.</p>

<p>I attended <a href="http://artandcode.ning.com/events/information-visualization-with">Information Visualization</a> and <a href="http://artandcode.ning.com/events/make-games-with-hackety-hack">Play Games with Hackety Hack</a>.</p>

<h4>Information Visualization - Ben Fry</h4>

<p><a href="http://benfry.com/">Ben Fry</a> along with <a href="http://reas.com/">Casey Reas</a> created the <a href="http://processing.org">Processing language</a> “for people who want to program images, animation, and interactions.” I first discovered Processing (aka p5) in January of 2004. <a href="http://stungeye.com/processing/0304/index.html">One of my first sketches</a> stitched together MRI brain-scan images into an interactive animation. (See: <a href="http://stungeye.com/programs/">my early p5 sketches</a> and <a href="http://stungeye.com/processing/1007/">a more recent sketch</a>.)</p>

<p>Ben’s lecture focused on using visuals to effectively communicate complex information. Shout outs to <a href="http://en.wikipedia.org/wiki/Edward_Tufte">Edward Tufte</a> and <a href="http://en.wikipedia.org/wiki/Mark_Lombardi">Mark Lombardi</a> (See: <a href="http://www.albany.edu/museum/wwwmuseum/work/lombardi/images/lombardi1.jpg">Lombardi 1</a> &amp; <a href="http://www.pumpitout.com/pictures/marklombardi.jpg">Lombardi 2</a>)</p>

<p>Info Viz Workflow:</p>

<ul>
<li>Acquire</li>
<li>Parse</li>
<li>Filter</li>
<li>Mine</li>
<li>Represent</li>
<li>Refine</li>
<li>Interact</li>
</ul>
<p>Also:</p>

<ul>
<li><a href="http://chart.apis.google.com/chart?cht=p3&amp;chs=640x255&amp;chd=t:82,18&amp;chl=Looks%20like%20Pac-man%7CDoes%20not%20look%20like%20Pac-man&amp;chco=FFFF00,000000&amp;chtt=Percentage%20of%20chart%20which%20looks%20like%20Pac-man">An Important Visualization</a></li>
<li>It’s easy to <a href="http://faculty.maxwell.syr.edu/mon2ier/e_reprints/StatSci%20Aug2005%20(Lying%20with%20Maps).pdf">lie with statistics and maps</a> [pdf].</li>
<li>
<a href="http://kspark.kaist.ac.kr/Human%20Engineering.files/Chernoff/Chernoff%20Faces.htm">Using Cartoon Faces to Represent Multi-dimensional Datasets</a> (More: <a href="http://en.wikipedia.org/wiki/Chernoff_face">Chernoff Faces</a> and <a href="http://www.hesketh.com/schampeo/projects/Faces/FaceSaver.html">Face Saver</a>)</li>
</ul>
<p>During the experimentation part of this workshop I began working on the <a href="http://stungeye.com/archive/by_date/2009/03/16/">Marvel “Social Network” visualization</a>.</p>

<p><a href="http://www.flickr.com/photos/ecin/3346633173/">Lunch</a> was tabbouleh salad, hummus, pitas and an apple.</p>

<h4>Hackety Hack - _why</h4>

<p><a href="http://hackety.org/">Why</a> began the afternoon workshop with a song accompanied by <a href="http://www.flickr.com/photos/23856408@N02/3339805005/">autoharp</a>. Then we played with a pre-release of <a href="http://hacketyhack.net/">Hackety Hack</a>, a <a href="http://www.ruby-lang.org">Ruby</a>-based toolkit for learning to code.</p>

<p>Some Notable Features:</p>

<ul>
<li>
<p><a href="http://github.com/why/bloopsaphone/tree/master">Bloopsaphone</a> songs and <a href="http://www.flickr.com/photos/schmarty/3345714278/">sounds</a>:</p>

<pre><code>b = Bloops.new
b.tempo = 320
# Where s1 is a bloopsaphone sound that can be 
# generated for you or created by you.
b.tune s1, "f#5 c6 e4 b6 g5 d6 4  f#5 e5 c5 b6 c6 d6 4 "
b.play
sleep 1 while !b.stopped?
</code></pre>
</li>
<li>A <a href="http://www.vim.org/">vim</a>-style (aka modal) <a href="http://www.flickr.com/photos/schmarty/3345713990/">drawing tool</a>. </li>
<li>Integrated mail client for sharing code.</li>
<li>A <a href="http://en.wikipedia.org/wiki/Dingbat">Dingbat</a> sprite library for <a href="http://www.flickr.com/photos/konklone/3350076941/">game creation</a>.</li>
<li>
<a href="http://en.wikipedia.org/wiki/Internet_Relay_Chat">IRC</a>-like chat channels for human or programmatic communication. (For example, we wrote “chat” apps that allowed us to communicate by colour. Each rectangle in <a href="http://www.flickr.com/photos/konklone/3350076765/in/set-72157615169614994/">this image</a> represents someone in the room.).</li>
<li>Embedded <a href="http://tryruby.hobix.com/">Try Ruby</a>
</li>
</ul>
<p>Upcoming Features:</p>

<ul>
<li>Built in Tutorials / Lessons (Similar to the original Hackety Hack)</li>
<li>Database (sqlite?) tables for data persistency.</li>
</ul>
<p>The kid sitting to my left (maybe 12 or 13 years old) was new to programming. He was enthralled by the Hackety experience. I could almost hear his brain rewiring as he started to grok Ruby. Okay, I could literally hear it too, as he asked me a number of great programming questions.</p>

<p>After the workshop I spent some time chatting with <a href="http://www.flickr.com/photos/konklone/3350902676/in/set-72157615169614994/">Why and a group of fun and friendly Ottawarians</a>. (Is that the right term for someone from Ottawa?) We eventually found our way to <a href="http://www.churchbrew.com/">Church Brew Works</a> (a restaurant and micro-brewery <a href="http://www.flickr.com/photos/stungeye/3349696745/">inside an old church</a>) for a lovely dinner with some lovely beers. It took a while to obtain a table for 13, but good times were had by all.</p>

---

[![Inca Yupana (&#8220;counting tool&#8221;) based on the Fibonacci sequence.](/archive/by_date/2009/03/17/02MycoI69l688zaexINwVLivo1_500.gif)](http://upload.wikimedia.org/wikipedia/commons/1/18/Yupana_1.GIF)

Inca <a href="http://en.wikipedia.org/wiki/Abacus#Native_American_abaci">Yupana</a> (&#8220;counting tool&#8221;) <a href="http://www.quipus.it/english/Andean%20Calculators.pdf">based on the Fibonacci sequence</a>.
