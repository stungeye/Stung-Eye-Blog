---
date: 2013-12-17T23:27:00.000-06:00
generatedBy: tools/migrate.js
title: Probability of Dice Rolls in Settlers of Catan
permalink: /archive/by_date/2013/12/17/
---

<p><img src="https://stungeye.com/images/others/1213/settlers.jpg" alt="Settlers of Catan Board"></p>

<p><strong>A few weeks back I played a game of <a href="https://en.wikipedia.org/wiki/The_Settlers_of_Catan">Settlers of Catan</a> where an 8 was only rolled once.</strong> This is <em>a pretty big deal</em> if you know how the game is played.</p>

<p>In  Catan, each turn begins with a player rolling two 6-sided dice. The <em>sum</em> of this roll determines the game play. The full rules of the game aren’t important for this post, just the fact that players hedge their play based on the probabilities of specific sums occurring. According to these probabilities an 8 should roll, on average, every 7.2 turns. <em>In our game it took 72 turns to roll an 8!</em> For the players who had hedged their fortunes on 8s, this was a crushing blow.</p>

<p>After the game, we spent some time discussing the rarity of a game such as this. Many felt that only rolling one 8 in 72 turns was incredibly rare. I argued that it wasn’t as rare as we might think. I then took the position that we couldn’t have a logical discussion about these kinds of games since randomness was involved. I was wrong, we have <a href="https://en.wikipedia.org/wiki/Probability_theory">probability theory</a>.</p>

<p>Let’s explore probability theory to learn how rare this game really was.</p>

<h3>Single Die Probabilities</h3>

<p>When rolling a single 6-sided die, the chance of rolling any side is equal. Since there are six sides to the die, each side has a 1 out of 6 chance of rolling. If, say, we were to roll a single die 600 times, each side would appear <em>on average</em> 100 times.</p>

<p>In probability theory terms this is called a uniform distribution.</p>

<h3>Dice Sum Probabilities</h3>

<p>Things get more interesting when pairs of dice are thrown and summed, as in Catan. In this situation certain sums are more likely to appear than others. This is because there are more possible die-side combinations for certain sums.</p>

<p>The following chart shows this distribution of sums. Notice that the sum of two uniform distributions (each die) makes a triangular distribution.</p>

<p><img src="https://stungeye.com/images/others/1213/dice_sum_probabilities.jpg" alt="All possible combos when summing two six-sided dice."></p>

<p>Shown in this image are the 36 possible outcomes of rolling 2 dice. Six of these combos sum to a 7 while only one of them sums to a 2. It should therefore be apparent that in a game of Catan, 7s are rolled more often than 2s. <em>If you don’t believe me, grab a pair of dice and start rolling while keeping track of the sums.</em></p>

<p>Looking at this chart we see that 5 of the 36 possible combinations sum to an 8. As such, an 8 should roll on average 5 times every 36 rolls, or as I stated earlier, once every 7.2 rolls (5/36).</p>

<h3>Simulating Dice Rolls</h3>

<p>I coded the following visualization to demonstrate these dice-sum probabilities. In this program virtual 6-sided dice-throws are simulated using a <a href="https://en.wikipedia.org/wiki/Pseudorandomness">pseudorandom</a> number generator. In total over 3000 virtual dice are thrown before the program resets.</p>

<iframe src="https://openprocessing.org/sketch/124236/embed/" width="400" height="400"></iframe>

<p>The <span style="color:#eee; background-color:#008789; padding: 0 3px;">left-hand graph</span> above shows how often each virtual die lands on a specific side, 1 through 6. Since there is an equal probability of each side appearing, the columns in this graph should all be approximately the same height. This is the uniform distribution I mentioned earlier.</p>

<p>The <span style="color:#eee; background-color:#FC4349; padding: 0 3px;">right-hand graph</span> above shows these same dice-rolls grouped in pairs and summed, just like in a game of Settlers. As the number of rolls increases, this graph of sum-occurrences begins to resemble the triangular distribution shown in the picture of the dice sum combos above.</p>

<h3>Randomness is Tricky</h3>

<p>Based on these dice-sum probabilities, how often should an 8 roll in 72 turns? Well, if the chance of rolling an 8 is 5 out of 36 (or 13.9%) then in 72 turns an eight should roll <em>on average</em> 10 times. Why? Because 13.9% of 72 is 10.</p>

<p>Notice that throughout this post I’ve been using the phrase “on average” when talking about expected dice rolls? That’s the key to our mystery. Yes, based on the probabilities, an 8 should be rolled 13.9% of the time. However, each roll is random and independent from all previous rolls. So with <em>enough rolls</em> the results will settle close to these probabilities (this is the <a href="https://en.wikipedia.org/wiki/Law_of_large_numbers">law of large numbers</a>), but for a small sampling of rolls they may not. Grab two dice and roll them 36 times, a sum of 8 will show up exactly 5 times only about 19% of the time. Such is chaos.</p>

<p>The next visualization demonstrates just this effect. Each refresh of the graphs represents another possible 72-roll game of Settlers. <em>With a sample size of 72 pairs of dice the graphs are often far from ideal.</em> In some games <span style="color:#eee; background-color:#008789; padding: 0 3px;">dice-sides</span> are far from uniform, and the <span style="color:#eee; background-color:#FC4349; padding: 0 3px;">dice sums</span> do not always follow the expected triangular probability distribution.</p>

<iframe src="https://openprocessing.org/sketch/124261/embed/" width="400" height="400"></iframe>

<h3>Our Crazy Game</h3>

<p>So how rare was our game? I used the <a href="https://anydice.com">AnyDice programming language</a> (which is an amazing tool btw) to find out.</p>

<blockquote>
  <p>output 72d (2d6 = 8)</p>
</blockquote>

<p>This program calculates the odds of rolling any number of 8s in a game of 72 rolls of 2 six-sided dice. Based on <a href="https://anydice.com/program/2f6b">the output of this program</a> the chance of rolling exactly one 8 in a 72 turn game of Settlers is 0.0245%. In other words, a game like this could be expected, on average, once every 4,081 games.</p>

<p>Truthfully, since our game went to 79 rolls it was more like a <a href="https://anydice.com/program/300c">1 out of 10,595 game</a>. Had no eights rolled in the entire 79 roll game, it would have been a 1 out of 135,000 game. Counting both cases together (<a href="https://anydice.com/program/442f9">one 8 <em>or fewer</em> in 79 rolls</a>), a game at least as extreme as ours comes along about once every 9,824 games. Rare, but still possible. <em>Such is chaos.</em></p>

<h3>UPDATE (18/12/2013): What About The Sequence of No-8 Rolls?</h3>

<p>After reading this post, a friend who was at the game suggested that the odds were actually far worse than I calculated, if you take the order of the rolls into account. His argument being that going the first 71 rolls without an 8 is a 1 in 40,813 event. See calculation below*.</p>

<p>While this is true, it’s important to note that we are now talking about two different probabilities.</p>

<ol><li>Probability of no 8s in <strong>the first</strong> 71 rolls: 1 in 40,813</li>
<li>Probability of rolling only one 8 <strong>anywhere</strong> in 79 rolls: 1 in 10,595</li>
</ol>

<p>The first is less likely because it describes a narrower event, one picked after we’d seen how the game played out. A run of 71 or more no-8 rolls <em>anywhere</em> in a 79 roll game is about a 1 in 19,332 event.</p>

<h3>Resources and Further Reading</h3>

<p>Before I started writing this blog post I wrote <a href="https://gist.github.com/stungeye/7912928">a Ruby program to simulate the roll of dice in Settlers</a> using the truly random data from <a href="https://www.random.org">Random.org</a>.</p>

<p><strong>I referenced the following sites while writing this post:</strong></p>

<ul><li><a href="https://mathigon.org/course/probability/introduction">Understanding Probability</a></li>
<li><a href="https://cs.stanford.edu/people/nick/settlers/DiceOddsSettlers.html">Dice Odds for Settlers of Catan</a></li>
<li><a href="https://dicehateme.com/2011/09/these-dice-are-driving-me-crazy-a-guest-blog/">These dice are driving me crazy!</a></li>
<li><a href="https://en.wikipedia.org/wiki/Law_of_large_numbers">Law of Large Numbers</a></li>
<li><a href="https://www.mathcelebrity.com/2dice.php">Two Dice Roll Calculator</a></li>
<li><a href="https://web.archive.org/web/20141012065827/http://www.statisticalengineering.com/sums_of_random_variables.htm">Triangle Distribution - The Sum of Random Variables</a></li>
</ul><p><strong>*Example Probability Calculation:</strong> The odds of rolling no 8s in a game of 71 turns.</p>

<p>The probability of <em>not</em> rolling an 8 is 1 minus the probability <em>of</em> rolling an 8.</p>

<blockquote>
  <p>1 - 5/36 = 31/36</p>
</blockquote>

<p>We multiply the probability of <em>not</em> rolling an 8 with itself 71 times (31/36 to the power of 71) to find our answer.</p>

<blockquote>
  <p>The odds are 0.00245% which is <strong>1 out of 40,813</strong>.</p>
</blockquote>

<p><strong>Attributions:</strong> The header image for this post was found on <a href="https://enjoyneer.blogspot.com/2011/01/settlers-of-catan.html">enjoyneer.blogspot.com</a>. The dice-sum probability image was found on <a href="https://rosalind.info/problems/lia/">rosalind.info</a>. I wrote the two programs in this post using the <a href="https://processing.org">Processing language</a> and they are hosted on <a href="https://openprocessing.org">OpenProcessing.org</a>.</p>
