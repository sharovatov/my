# shaky lines drawing tool for browser and nodejs


<a href="http://mrale.ph/">Vyacheslav Egorov</a> recently <a href="http://mrale.ph/blog/2012/11/25/shaky-diagramming.html">showed his useful helper tool that converts handwritten ASCII-based diagrams into images</a> - he wrote it in Dart, adding around 450 kbytes overhead to the code that could perfectly fit in 18 kbytes of heavily commented non-minimized javascript code (or ~8 kbytes of minified code). 

I thought this was a huge waste of resources and rewrote the tool to pure js, I just didn't see any reason for Dart here.

To use this in console, run 

	node shaky-node.js textfile imagefile.png

Please note that while <a href="https://github.com/LearnBoost/node-canvas/pull/231">this pull request</a> is not merged, there's no way to make node-canvas use custom font, so please install the ttf font locally. 

And please use the `shaky.html` file as a sample of in-browser use.