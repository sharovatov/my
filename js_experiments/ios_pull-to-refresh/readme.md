# my iOS pull-to-refresh

Most of the pull-to-refresh plugins or concepts I saw had drawbacks - some emulated native scroll with JS (seems slower and non-native to me), others (mobile gmail) hid scrollbar altogether, <a href="http://cubiq.org/dropbox/iscroll4/examples/pull-to-refresh/">others</a> made scrollbar appear as if some content is already scrolled. 

As no available app seemed good enough for me and project requirements required iOS only, I drafted this.

Basically, everything what needs to be hardware accelerated, is actually accelerated.

<a href="http://sharovatov.ru/ptr/ptr.html">The testcase</a> seems to perform quite well on all my target platforms - iPhone4, 4s and 5.

The code is quite thoroughly commented so it will certainly be obvious what's going on should you want to look inside.