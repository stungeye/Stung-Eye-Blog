---
date: 2018-06-05 16:50:45
title: Meow Reader Ex Machina
permalink: /archive/by_date/2018/06/05/
---

<p>9 years, 4 months, 19 days ago I posted my first image to <a href="http://meow-reader-blog.tumblr.com/">Meow Reader</a>, a Tumblr dedicated to images of cats reading and cats learning how to read.</p>

<p>A few weeks back I mentioned the (then abadoned) site to my department chair and he (jokingly?) suggested I use <a href="https://en.wikipedia.org/wiki/Machine_learning">Machine Learning</a> to automate the discovery of new Meow Reader images.</p>

<p><em>Challenge Accepted.</em></p>

<p><a href="https://gist.github.com/stungeye/9974f404f7e530d4e6afd27218a0a41f">A few Ruby scripts</a> later (plus some research into the <a href="https://clarifai.com/developer/guide/">Clarifai API</a>) and I’ve got a shiny new collection of reading cats, dogs, rabbits, sloths… you named it! I’ve documented the process below, but you can also <a href="http://stungeye.com/MeowML/reading-animals.html">skip straight to the images</a>.</p>

<p><strong>Finding reading animals, a play in five acts:</strong></p>

<ul><li><strong>Act 1</strong> - Collect <a href="http://meow-reader-blog.tumblr.com">140 existing images of reading cats</a>.</li>
<li><strong>Act 2</strong> - Use <a href="https://clarifai.com/developer/guide/">Clarifai</a> to detect concepts within images from Act 1.</li>
<li><strong>Act 3</strong> - Sort the discovered concepts by:

<ul><li>How often they appear.</li>
<li>Machine’s “confidence” in the concept.</li>
</ul></li>
<li><strong>Act 4</strong> - Collect <a href="http://animalsthatdopeoplethings.tumblr.com/">1000s of new animal images</a> Tumblr.</li>
<li><strong>Act 5</strong> - Filter images from Act 4 using concepts discovered in Act 2:<br><code>book, book bindings, book series, education, literature, newspaper, research, technology</code></li>
<li><strong><a href="http://stungeye.com/MeowML/reading-animals.html">Profit!</a></strong></li>
</ul><p>The <a href="https://clarifai.com/developer/guide/">Clarifai API</a> could also be used in Act 5 to filter the images even further to limit the reading animals to be cats only. View the full <a href="https://gist.github.com/stungeye/9974f404f7e530d4e6afd27218a0a41f#file-01_extract_meow_reader_images-rb">source code here</a>. There’s a separate script for each step.</p>

<p>Oh, and I also created a new version of <a href="https://play.google.com/store/apps/details?id=com.stungeye.meowreader">the Meow Reader Android app</a> using <a href="https://vuejs.org/">Vue.js</a> and <a href="https://cordova.apache.org/">Cordova</a>.</p>

<p>Please <a href="https://play.google.com/store/apps/details?id=com.stungeye.meowreader">install it</a> and leave me a glowing 5 star review. (/◔◡ ◔)/</p>

---

![Animals Reading Animals Learning How To ReadAnimals Using Technology Concepts used to find these images: book, book bindings, book series, education, literature, newspaper, research, technology](/archive/by_date/2018/06/05/tumblr_p9v9mwnaCo1qzoknmo1_500.png)

<p><strong>Animals Reading</strong><br/>
Animals Learning How To Read<br/><strong>Animals Using Technology</strong></p>

<p>Concepts used <a href="https://gist.github.com/stungeye/9974f404f7e530d4e6afd27218a0a41f#file-01_extract_meow_reader_images-rb">to find</a> these images: <code>book, book bindings, book series, education, literature, newspaper, research, technology</code></p>
