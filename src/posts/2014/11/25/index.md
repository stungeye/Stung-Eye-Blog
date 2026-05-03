---
date: 2014-11-25T09:46:00.000-06:00
title: "Discovered on November 25, 2014"
permalink: /archive/by_date/2014/11/25/
---

<iframe src="https://www.youtube.com/embed/B_Rp0FWJOD8?feature=oembed" allowfullscreen=""></iframe>

<p><strong>Internet Bots for Fun &amp; No Profit</strong></p>

<p>My talk from last November&#8217;s <a href="http://www.bsideswpg.ca/">BSides Winnipeg 2013</a> Security Conference.</p>

<p>I spoke about <a href="http://twitter.com/abotlafia">@abotlafia</a>, my Twitter bot inspired by the &#8220;bot&#8221; in Umberto Eco’s 1988 novel <a href="https://en.wikipedia.org/wiki/Foucault's_Pendulum">Foucault’s Pendulum</a>.</p>

<p>To show how little code is required to create automated accounts on Twitter I demo&#8217;d a few other bots that I&#8217;ve written. Here&#8217;s one that Tweets out a random number every five minutes. A modern day <a href="https://en.wikipedia.org/wiki/Numbers_station">Numbers Station</a>.</p>

<pre><code>require 'chatterbot/dsl'

loop do
  tweet rand(1000000..99000000).to_s
  sleep 300
end
</code></pre>

<p>I closed with my motivations, the security/ethical implications of algorithmic social media accounts, and the possibility of a future where we are unable to determine who is real and who is a bot on the Internet.</p>

<p><a href="http://stungeye.com/twitterbots2013/">The slides are online</a>, as is <a href="https://github.com/stungeye/Bsides-Bots">the Ruby source code for the bots</a> I wrote for the talk.</p>

<p>BSides Winnipeg 2013 was a two day <a href="http://www.securitybsides.com/">B-Sides</a> security conference held at the King&#8217;s Head in November 2013. <a href="https://www.youtube.com/playlist?list=PLxyG_Sh7NFecN_prUF6hyA6kn-PUPDQ0H">All the talks are available online</a>.</p>

<p><strong>UPDATE - Abotlafia&#8217;s response to my talk:</strong></p>

<blockquote class="twitter-tweet" lang="en"><p><a href="https://twitter.com/stungeye">@stungeye</a> “you’re in trouble? good.”</p>— Abulafia (@abotlafia) <a href="https://twitter.com/abotlafia/status/537270666379419648">November 25, 2014</a></blockquote>

<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>
