---
date: 2017-10-28T08:38:41.000-05:00
title: Types as Concretions
permalink: /archive/by_date/2017/10/28/
---

<p>I love <a href="http://www.lispcast.com/clojure-and-types">that space where coding and philosophy collide</a>.</p>

<blockquote>
  <p><a href="https://twitter.com/richhickey">Rich Hickey</a> talked about types, such as Java classes and Haskell ADTs, as <em>concretions</em>, not <em>abstractions</em>.</p>
  
  <p>People often talk about a <code>Person</code> class <em>representing</em> a person. But it doesn’t. It represents <em>information about a person</em>.</p>
  
  <p>A <code>Person</code> type, with certain fields of given types, is a concrete choice about what information you want to keep out of all of the possible choices of what information to track about a person.</p>
  
  <p>An abstraction would ignore the particulars and let you store any information about a person.</p>
</blockquote>

<p>– <a href="https://twitter.com/ericnormand">Eric Normand</a>, Clojure vs. The Static Typing World</p>

<p>From <a href="http://www.lispcast.com/clojure-and-types">the same piece</a>, how <a href="http://clojure.org">Clojure</a> was designed to make a certain kind of software easier to write.</p>

<p>A type of software characterized as:</p>

<blockquote>
  <p><strong>solving a real-world problem</strong><br><code>=&gt;</code> must use non-elegant models</p>
  
  <p><strong>running all the time</strong><br><code>=&gt;</code> must deal with state and time</p>
  
  <p><strong>interacting with the world</strong><br><code>=&gt;</code> must have effects and be affected</p>
  
  <p><strong>everything is changing</strong><br><code>=&gt;</code> must change in ways you can’t predict</p>
</blockquote>
