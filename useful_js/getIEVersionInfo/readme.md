getIEVersionInfo
---
The function returns an array where first element is jscript engine version (obtained from @_jscript_version) and second element is mshtml version (obtained from conditional comments IE version).

**Note** that compressing this function alongside with other functions may either break it (if your compressor of choice doesn't know how to compress conditional compilation) or make the compression quality lower (because even those compressors that know how about conditional compilation, may fail renaming properties). 

So instead of putting the function inside your uncompressed file, just copy the pre-minified version from getIEVersionInfo.min.js into your minified file.