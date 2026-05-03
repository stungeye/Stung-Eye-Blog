---
date: 2010-05-11T23:20:00.000-05:00
generatedBy: tools/migrate.js
title: Glutton LastFM
permalink: /archive/by_date/2010/05/11/
---

<p>Two days ago I released <a href="http://rubygems.org/gems/glutton_lastfm">my first Ruby gem</a>. In coding parlance <a href="http://en.wikipedia.org/wiki/RubyGems">gems</a> are software libraries created to enhance the <a href="http://www.ruby-lang.org">Ruby programming language</a>.</p>

<p>My gem is call <strong>glutton_lastfm</strong>. It’s a wrapper library for version 2.0 of the <a href="http://www.last.fm/">last.fm</a> <a href="http://www.last.fm/api">API</a>. The source code and documentation is available on <a href="http://github.com/stungeye/glutton_lastfm">my github account</a>.</p>

<p>This gem allows you to query last.fm for:</p>

<ul>
<li>artist information by name</li>
<li>top albums by artist</li>
<li>top tracks by artist</li>
<li>top user-submitted tags by artist</li>
<li>upcoming events by artist</li>
<li>album information by name</li>
</ul>
<p>For example, here’s a program that searches for tags and images related to <a href="http://buck65.com/">Buck 65</a>: <a href="http://github.com/stungeye/glutton_lastfm/blob/master/examples/artist_tags_and_images.rb">artist_tags_and_images.rb</a></p>

<p>I wrote this library to:</p>

<ul>
<li>Learn the gem creation process. (Facilitated by the <a href="http://github.com/technicalpickles/jeweler">jeweler</a> gem.)</li>
<li>Better understand the mechanics of web-based APIs. (Facilitated by the <a href="http://github.com/technicalpickles/jeweler">httparty</a> gem.)</li>
<li>Brush up on my unit-testing skills. (Facilitated by the <a href="http://en.wikipedia.org/wiki/Exception_handling">fakeweb</a> gem.)</li>
<li>Distance myself from years of return-code function creation in favour of <a href="http://en.wikipedia.org/wiki/Exception_handling">exceptions</a>.</li>
</ul>
<p>I also wrote it as part of a larger <a href="http://en.wikipedia.org/wiki/Data_mining">data-mining</a> project I’m working on. (Which reminds me that I’ve been meaning to write a post on datasets and the soon to explode dataset market.)</p>

<p>The glutton_lastfm source-code is released <a href="http://unlicense.org/">unlicensed</a> into the public domain.</p>
