---
date: 2013-03-09T12:58:00.000-06:00
title: A Scientific Approach to Debugging
permalink: /archive/by_date/2013/03/09/
---

<p>This list, taken from John Regehr’s <a href="http://blog.regehr.org/archives/199">How to Debug</a> (<a href="http://www.cs.uni.edu/~wallingf/blog/archives/monthly/2013-03.html#e2013-03-08T15_50_37.htm">via</a>), aligns nicely with my process for debugging software.</p>

<ol><li>Verify the Bug and Determine Correct Behaviour.</li>
<li>Stabilize, Isolate, and [Reproduce].</li>
<li>Estimate [Likelihood of Probable Causes].</li>
<li>Devise and Run an Experiment.</li>
<li>Iterate Until the Bug is Found.</li>
<li>Fix the Bug and Verify the Fix.</li>
<li>Undo [Unwanted] Changes.</li>
<li>Create a Regression Test.</li>
<li>Find the Bug’s Friends and Relatives.</li>
</ol><p>My changes/clarifications are shown within square braces. Trust me, read the <a href="http://blog.regehr.org/archives/199">full post</a>. Each step is explained in detail.</p>

<p>I’ve just finished re-reading <a href="http://en.wikipedia.org/wiki/Robert_M._Pirsig">Robert Pirsig</a>’s <a href="http://en.wikipedia.org/wiki/Zen_and_the_Art_of_Motorcycle_Maintenance">Zen and the Art of Motorcycle Maintenance</a>, where a similar debugging approach (the scientific method) is explained.</p>

<blockquote>
  <p>“For this you keep a lab notebook. Everything gets written down, formally, so that you know at all times where you are, where you’ve been, where you’re going and where you want to get. […] Sometimes just the act of writing down the problems straightens out your head as to what they really are.</p>
  
  <p>The logical statements entered into the notebook are broken down into six categories:</p>
  
  <ol><li>Statement of the problem.</li>
  <li>Hypotheses as to the cause of the problem.</li>
  <li>Experiments designed to test each hypothesis.</li>
  <li>Predicted results of the experiments.</li>
  <li>Observed results of the experiments</li>
  <li>Conclusions from the results of the experiments. </li>
  </ol><p>“The real purpose of scientific method is to make sure Nature hasn’t misled you into thinking you know something you don’t actually know. […] One logical slip and an entire scientific edifice comes tumbling down. One false deduction […] and you can get hung up indefinitely.</p>
</blockquote>

<p>As a programming instructor I help students when things go wrong with the applications they’re writing. Because of my experience with the types of apps they are coding, I’m usually quick at spotting the source of the bug. Pointing out these bugs may fix their immediate problem, <em>but it does little to correct the error in logic that led to the bug</em>. Perhaps before coming to me, students with buggy source code should work through steps 1 through 4 from either of these lists.</p>

<p>If I were to mandate this for my classes, I’d have to add a step zero:</p>

<p><strong>Be Prepared to Learn From Your Mistake.</strong></p>

<p>New programmers are often quick to blame the language or framework they are using when their code doesn’t work. I still catch myself thinking “<em>IT</em> isn’t working” when I encounter troublesome bugs in my code. However, experience has shown me two things:</p>

<ol><li>My tools are rarely the source of my problem. </li>
<li>If I’m not prepared to accept responsibility for my bugs, I’m doomed to repeat them.</li>
</ol><p>ʕ•ᴥ•ʔ</p>

<p>Recommended reading:</p>

<ul><li><a href="http://celandine13.livejournal.com/33599.html">Errors vs. Bugs and the End of Stupidity</a>.</li>
<li><a href="http://www.rubberduckdebugging.com/">Rubber Duck Debugging</a></li>
<li><a href="http://www.sifry.com/alerts/archives/000136.html">Zen and the Art of Bugfixing</a>.</li>
<li><a href="http://prodlife.wordpress.com/2009/04/08/stand-back-im-going-to-try-science/">Stand Back. I’m Going To Try Science</a>.</li>
</ul>

---

[![I first read this book thirteen years ago while backpacking in Fiji. I just finished a re-read, this time from the perspective of an educator rather than that of a new grad. Next up is a re-read of the sequel Lila. When I first read Lila I got trapped for hours (days!) thinking about the evolution of consciousness. The end result was the essay From Instincts to Consciousness I wrote in November 2003.](/archive/by_date/2013/03/09/tumblr_mjei6raCcF1qzoknmo1_500.jpg)](http://instagr.am/p/VwXfF8NySh/)

<p>I first read this book thirteen years ago while backpacking in Fiji. I just finished a re-read, this time from the perspective of an educator rather than that of a new grad.</p>

<p>Next up is a re-read of the sequel <a href="http://en.wikipedia.org/wiki/Lila:_An_Inquiry_into_Morals">Lila</a>. When I first read Lila I got trapped for hours (days!) thinking about the evolution of consciousness. The end result was the essay <a href="http://stungeye.com/archives/2003/11/from_instincts.php">From Instincts to Consciousness</a> I wrote in November 2003.</p>
