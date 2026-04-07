---
date: 2019-07-08 08:21:22
title: Switched On
permalink: /archive/by_date/2019/07/08/
---

<p>Total network nerd out! I switched my internet provider from Bell MTS to <a href="https://teksavvy.com/">TekSavvy</a> and it was quite the ride.</p>

<p>Why the switch? Half the monthly cost and total control of my home network. Oh, and I love tech puzzle and the challenge of the build. ;)</p>

<h3>My New Network Stack</h3>

<ul><li><a href="https://wikidevi.com/wiki/Technicolor_TC4400">Technicolor TC4400</a> Cable Modem - $160cnd from TekSavvy</li>
<li><a href="https://www.tp-link.com/ca/home-networking/wifi-router/archer-c9/">TP-Link Archer C9</a> WiFi Router - $135cnd on Amazon</li>
<li>D-Link DIR615 Flashed with <a href="https://dd-wrt.com/">DD-WRT</a> firmware - pre-owned</li>
<li>Raspberry Pi for <a href="https://pi-hole.net">Ad Blocking</a> - pre-owned</li>
</ul><p>In Winnipeg TekSavvy acts as a Shaw reseller, so the TC4400 takes in a cable signal from the Shaw network. The TC4400 acts as a Bridge to the internet for the Archer C9, which provides local wired and wireless routing. The DIR615 is <a href="https://wiki.dd-wrt.com/wiki/index.php/Switch">configured as a Switch</a> to allow for more wired connections, seven in total.</p>

<p>The Archer C9 also handles DHCP IP allocation for all devices with the Raspberry Pi set as the Domain Name Server. The Raspberry Pi uses the <a href="https://pi-hole.net">open source Pi Hole software</a> to filter out ads at the network level, so no web or app ads get served to the devices on our network.</p>

<h3>Benefits of the Switch</h3>

<p>Here are a few of the benefits that made this switch worthwhile. Most of these benefits came from switching from the MTS provided modem/router/wifi combo unit (<a href="https://www.arris.com/products/5168n-xdsl-gateway/">Arris 5168N</a>) to the custom stack described above. The Arris unit wasn’t horrible, but it wasn’t very configurable.</p>

<p><strong>1) Wifi Signal Strength</strong> - My entire house and the backyard now has Wifi coverage in the -40 to -60 dB range at 2.4 and 5Ghz, which is really good. Measurements taken with the <a href="https://play.google.com/store/apps/details?id=com.farproc.wifi.analyzer&amp;hl=en_CA">Wifi Analyzer Android App</a>. I’m also running my 2.4 and 5Ghz wifi using the same SSID and password to allow my devices to auto-select 5Ghz when close to the router, and 2.4Ghz when further away.</p>

<p><strong>2) More Wired Connections</strong> - I’ve gone from 4 ethernet ports to 7, meaning I can down run the following devices wired rather than on wifi: 2 laptops, 1 pi hole, 1 chromecast, 2 chromecast audio, 1 security alarm system. (Note: The Chromecast didn’t work at all when wired on the Arris.)</p>

<p><strong>3) Pi Hole Ad Filtering</strong> - I had a Pi Hole running with the Arris setup, but it wasn’t perfect. So far the Pi Hole has blocked over %53 of all DNS requests as ads/trackers. That’s right, more than half of all domain name requests on my home network were for ads and trackers that I didn’t ask for. (Note: I still run <a href="https://github.com/gorhill/uBlock/">uBlock origin</a> on my browsers to catch the occasional ads that sneak through. Especially required for Facebook and YouTube.)</p>

<p><strong>4) Download Speeds</strong> - Our internet speeds needs aren’t extreme. At mosts we’re pulling down 2 to 3 simultaneous audio/video streams. As such I stuck with the same speed band of 25Mbs. With MTS, speed tests over the years showed that we were rarely getting the promised 25Mbs download rate. So far with Teksavvy we’re consitently getting significantly faster than 25Mbs across all devices.Testing was done via <a href="http://speedtest.googlefiber.net/">Google</a> and <a href="https://www.speedtest.net/">SpeedTest.net</a>.</p>

<p><strong>5) Monthy Cost</strong> - I’m now saving 50 bucks a month on my internet. More on this in the next section.</p>

<h3>Costs and Savings</h3>

<p>Total cost to switch: $295 (New Modem and Router)<br>
Monthly Savings: $54 ($97/month MTS - $43/month Teksavvy)<br>
Time to pay off switch: 5.5 months<br>
Savings per year after that: $650</p>

<p>All that said, if you call MTS to cancel they’ll eventually offer you a deal. They offered to upgrade me to their Fibe 100 plan while dropping my bill to $45/month for two years (afterwhich it would be $119/month). It’d already purchased the cable modem from Teksavvy and was looking forward to my custom network, so I declined.</p>

<p>Also, it possible to switch to TekSavvy with a much simpler network stack by purchasing the <a href="https://www.gentek.com/resellers/DPC3848V-TNDPC3848V-Cable%20Modems-Technicolor.php">Technicolor DPC3848V</a> Modem/Router/Wifi combo unit. You’ll get fewer wired connections, no ad blocking, and I can’t speak to the WiFi coverage, but it should still be a solid setup.</p>

---

![The new network stack before I tucked it away.](/archive/by_date/2019/07/08/tumblr_pubpdj0xOR1qzoknmo1_500.jpg)

<p>The new network stack before I tucked it away.</p>
